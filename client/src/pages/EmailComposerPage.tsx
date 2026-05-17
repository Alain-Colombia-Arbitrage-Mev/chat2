import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LivePreview, renderDocToHtml } from "@/lib/email/LivePreview";
import { BlockPalette, PaletteDragOverlay } from "@/lib/email/BlockPalette";
import { BlockCanvas } from "@/lib/email/BlockCanvas";
import { BlockProperties } from "@/lib/email/BlockProperties";
import {
  type Block,
  type BlockType,
  type EmailDoc,
  defaultDoc,
  makeBlock,
  TOKENS,
} from "@/lib/email/blocks";
import {
  Mail,
  MousePointerClick,
  RotateCcw,
  Save,
  Tag,
  TriangleAlert,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";
const LOCAL_KEY = "ancestro:email-composer:doc-v1";

export default function EmailComposerPage() {
  const { toast } = useToast();
  const [doc, setDoc] = useState<EmailDoc>(() => defaultDoc());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingPaletteType, setDraggingPaletteType] = useState<BlockType | null>(null);

  // Load: try backend, fall back to localStorage, fall back to default doc.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/email-editor/template-config`, { credentials: "include" });
        if (r.ok) {
          const d = (await r.json()) as { config?: unknown; blocks?: Block[]; brand?: EmailDoc["brand"] };
          if (Array.isArray(d.blocks) && d.brand) {
            setDoc({ schema: "blocks-v1", brand: d.brand, blocks: d.blocks });
            setLoading(false);
            return;
          }
        }
      } catch {
        /* fall through to localStorage */
      }
      const cached = localStorage.getItem(LOCAL_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as EmailDoc;
          if (parsed.schema === "blocks-v1") {
            setDoc(parsed);
          }
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    })();
  }, []);

  const selectedBlock = useMemo(
    () => doc.blocks.find((b) => b.id === selectedId) ?? null,
    [doc.blocks, selectedId],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setDoc((d) => ({
      ...d,
      blocks: d.blocks.map((b) =>
        b.id === id
          ? // Cast is safe — caller passes a partial of the same block type.
            ({ ...b, ...patch } as Block)
          : b,
      ),
    }));
    setDirty(true);
  }, []);

  // Called from the iframe (click-to-edit inline). The data-edit-path is
  // "<block-id>:<field>" where field may be a nested path like "left.value".
  const onInlineEdit = useCallback((blockId: string, field: string, value: string) => {
    setDoc((d) => ({
      ...d,
      blocks: d.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const segs = field.split(".");
        if (segs.length === 1) {
          return { ...b, [segs[0]]: value } as Block;
        }
        // Two-level (columns.left.label etc.).
        const [outer, inner] = segs as [string, string];
        const outerVal = (b as unknown as Record<string, Record<string, unknown>>)[outer];
        return {
          ...b,
          [outer]: { ...outerVal, [inner]: value },
        } as Block;
      }),
    }));
    setDirty(true);
  }, []);

  const deleteBlock = useCallback(
    (id: string) => {
      setDoc((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }));
      if (selectedId === id) setSelectedId(null);
      setDirty(true);
    },
    [selectedId],
  );

  const updateBrand = useCallback((patch: Partial<EmailDoc["brand"]>) => {
    setDoc((d) => ({ ...d, brand: { ...d.brand, ...patch } }));
    setDirty(true);
  }, []);

  const insertToken = useCallback(
    (token: string) => {
      if (!selectedBlock) {
        toast({
          title: "Selecciona un bloque",
          description: "Click sobre un bloque del preview o del canvas y luego inserta la variable.",
        });
        return;
      }
      // For text-style blocks, append to `.text`. For button → `.label`. For others, no-op with hint.
      const t = `{{${token}}}`;
      if (selectedBlock.type === "heading" || selectedBlock.type === "text") {
        updateBlock(selectedBlock.id, { text: selectedBlock.text + t } as Partial<Block>);
      } else if (selectedBlock.type === "button") {
        updateBlock(selectedBlock.id, { label: selectedBlock.label + t } as Partial<Block>);
      } else if (selectedBlock.type === "hero") {
        updateBlock(selectedBlock.id, { caption: selectedBlock.caption + t } as Partial<Block>);
      } else {
        toast({
          title: "Bloque sin texto",
          description: "Este bloque no acepta variables. Selecciona un Heading, Texto, Botón o Hero.",
        });
      }
    },
    [selectedBlock, updateBlock, toast],
  );

  // ── DnD ────────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => {
    const src = e.active.data.current?.source;
    if (src === "palette") {
      setDraggingPaletteType(e.active.data.current?.blockType as BlockType);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDraggingPaletteType(null);
    const { active, over } = e;
    if (!over) return;
    const srcKind = active.data.current?.source as "palette" | "canvas" | undefined;

    if (srcKind === "palette") {
      const type = active.data.current?.blockType as BlockType;
      const newBlock = makeBlock(type);
      setDoc((d) => {
        const overId = String(over.id);
        const idx = d.blocks.findIndex((b) => b.id === overId);
        const insertAt = idx < 0 ? d.blocks.length : idx + 1;
        const next = [...d.blocks];
        next.splice(insertAt, 0, newBlock);
        return { ...d, blocks: next };
      });
      setSelectedId(newBlock.id);
      setDirty(true);
      return;
    }

    if (srcKind === "canvas") {
      const fromId = String(active.id);
      const toId = String(over.id);
      if (fromId === toId) return;
      setDoc((d) => {
        const from = d.blocks.findIndex((b) => b.id === fromId);
        const to = d.blocks.findIndex((b) => b.id === toId);
        if (from < 0 || to < 0) return d;
        return { ...d, blocks: arrayMove(d.blocks, from, to) };
      });
      setDirty(true);
    }
  };

  // ── Persistence ────────────────────────────────────────────────────────────

  const onSave = async () => {
    setSaving(true);
    try {
      const html = await renderDocToHtml(doc);
      const body = JSON.stringify({
        schema: doc.schema,
        brand: doc.brand,
        blocks: doc.blocks,
        html,
      });
      let backendOk = false;
      try {
        const r = await fetch(`${API}/api/email-editor/template-config`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body,
        });
        backendOk = r.ok;
      } catch {
        backendOk = false;
      }
      // Always cache locally so work isn't lost while the backend catches up to blocks-v1.
      localStorage.setItem(LOCAL_KEY, JSON.stringify(doc));
      setDirty(false);
      toast({
        title: backendOk ? "Plantilla guardada" : "Guardado local",
        description: backendOk
          ? "Los próximos envíos usan esta versión."
          : "El backend aún no acepta blocks-v1. Guardado en este navegador.",
      });
    } catch (e) {
      toast({ title: "Error guardando", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    if (!confirm("¿Restablecer la plantilla a su estado inicial?")) return;
    setDoc(defaultDoc());
    setSelectedId(null);
    setDirty(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-muted-foreground text-sm">Cargando plantilla…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="p-6 max-w-[1700px] mx-auto">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Mail className="h-6 w-6" /> Email Composer
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" />
                Arrastra bloques desde la paleta al canvas. Click en un bloque para editar sus propiedades.
              </p>
              {dirty && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <TriangleAlert className="h-3 w-3" /> Hay cambios sin guardar
                </p>
              )}
            </div>
            <Button variant="outline" onClick={onReset} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button onClick={onSave} disabled={saving || !dirty}>
              <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_360px] gap-4">
            {/* Palette */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bloques</CardTitle>
                  <CardDescription className="text-xs">Arrastra al canvas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BlockPalette />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estructura</CardTitle>
                  <CardDescription className="text-xs">Reordena, selecciona o elimina.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BlockCanvas
                    blocks={doc.blocks}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onDelete={deleteBlock}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Preview</CardTitle>
                  <span className="text-xs text-muted-foreground">React Email · render local</span>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <LivePreview doc={doc} onEdit={onInlineEdit} onSelect={setSelectedId} height={920} />
              </CardContent>
            </Card>

            {/* Properties */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {selectedBlock ? `Propiedades · ${selectedBlock.type}` : "Selecciona un bloque"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedBlock
                      ? "Cambios se aplican al instante en el preview."
                      : "Click sobre un bloque del canvas o del preview."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedBlock ? (
                    <BlockProperties
                      block={selectedBlock}
                      onChange={(patch) => updateBlock(selectedBlock.id, patch)}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Sin selección.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Variables
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click para insertar en el bloque de texto seleccionado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {TOKENS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => insertToken(t.key)}
                        className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors disabled:opacity-40"
                        title={t.help}
                        disabled={!selectedBlock}
                      >
                        <code>{`{{${t.key}}}`}</code>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Marca global</CardTitle>
                  <CardDescription className="text-xs">Aplica a toda la plantilla.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <BrandField label="Nombre empresa" value={doc.brand.companyName} onChange={(v) => updateBrand({ companyName: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <BrandColor label="Primary" value={doc.brand.primaryColor} onChange={(v) => updateBrand({ primaryColor: v })} />
                    <BrandColor label="Accent" value={doc.brand.accentColor} onChange={(v) => updateBrand({ accentColor: v })} />
                    <BrandColor label="Success" value={doc.brand.successColor} onChange={(v) => updateBrand({ successColor: v })} />
                    <BrandColor label="Body BG" value={doc.brand.bodyBg} onChange={(v) => updateBrand({ bodyBg: v })} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DragOverlay>
          {draggingPaletteType ? <PaletteDragOverlay type={draggingPaletteType} /> : null}
        </DragOverlay>
      </DndContext>
    </AppLayout>
  );
}

function BrandField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function BrandColor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded border bg-background cursor-pointer shrink-0"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs h-9 px-1.5" />
      </div>
    </div>
  );
}
