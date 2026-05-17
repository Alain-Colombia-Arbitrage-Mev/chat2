import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Brush,
  Heading as HeadingIcon,
  Mail,
  RotateCcw,
  Save,
  Sparkles,
  Tag,
  TextCursor,
  TriangleAlert,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

// ── Types mirror lib/email_template_config.ts ───────────────────────────────
type TemplateConfig = {
  brand: {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    accentColor: string;
    successColor: string;
  };
  header: { tagline: string; title: string; greeting: string };
  hero: { label: string; savingsCopy: string };
  body: { beforeLabel: string; afterLabel: string; rationaleLabel: string };
  cta: { label: string; url: string };
  footer: { supportEmail: string; footerCopy: string };
  updatedAt?: string;
};

const EMPTY: TemplateConfig = {
  brand: { companyName: "", primaryColor: "#0F1B2D", accentColor: "#F8B03B", successColor: "#16A34A" },
  header: { tagline: "", title: "", greeting: "" },
  hero: { label: "", savingsCopy: "" },
  body: { beforeLabel: "", afterLabel: "", rationaleLabel: "" },
  cta: { label: "", url: "" },
  footer: { supportEmail: "", footerCopy: "" },
};

const TOKENS = [
  { key: "client_name", help: "Nombre del cliente" },
  { key: "company_name", help: "Nombre empresa" },
  { key: "discount_percent", help: "Descuento aplicado (sin %)" },
  { key: "discount_amount", help: "Ahorro mensual con moneda" },
  { key: "new_price", help: "Factura nueva con moneda" },
  { key: "current_price", help: "Factura actual con moneda" },
  { key: "consumption_kwh", help: "Consumo kWh/mes" },
  { key: "customer_type", help: "doméstico / pyme / industrial" },
  { key: "city", help: "Ciudad del cliente" },
  { key: "rule_id", help: "Regla aplicada" },
  { key: "quote_id", help: "Referencia interna" },
];

export default function EmailComposerPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<TemplateConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeField, setActiveField] = useState<{ block: keyof TemplateConfig; field: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/email-editor/template-config`, { credentials: "include" });
        if (!r.ok) throw new Error(`load ${r.status}`);
        const d = (await r.json()) as { config: TemplateConfig };
        setConfig(d.config);
      } catch (e) {
        toast({
          title: "No pude cargar la plantilla",
          description: (e as Error).message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const patch = useCallback(<B extends keyof TemplateConfig>(block: B, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [block]: { ...(prev[block] as object), [field]: value } as TemplateConfig[B],
    }));
    setDirty(true);
  }, []);

  const insertToken = useCallback(
    (token: string) => {
      if (!activeField) {
        toast({ title: "Selecciona un campo primero", description: "Haz click en un input para insertar la variable." });
        return;
      }
      const current = (config[activeField.block] as Record<string, string>)[activeField.field] ?? "";
      patch(activeField.block, activeField.field, `${current}{{${token}}}`);
    },
    [activeField, config, patch, toast],
  );

  const onSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/email-editor/template-config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!r.ok) throw new Error(`save ${r.status}`);
      const d = (await r.json()) as { config: TemplateConfig };
      setConfig(d.config);
      setDirty(false);
      toast({ title: "Plantilla guardada", description: "Los próximos envíos usan esta versión." });
    } catch (e) {
      toast({ title: "Error guardando", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    if (!confirm("¿Restablecer la plantilla a sus valores por defecto?")) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/email-editor/template-config`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error(`reset ${r.status}`);
      const d = (await r.json()) as { config: TemplateConfig };
      setConfig(d.config);
      setDirty(false);
      toast({ title: "Plantilla restablecida" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const previewSrcDoc = useLivePreview(config);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-muted-foreground text-sm">Cargando plantilla…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Mail className="h-6 w-6" /> Email Composer
            </h1>
            <p className="text-sm text-muted-foreground">
              Edita la plantilla React Email del cotizador. Live preview a la derecha. Inserta variables como{" "}
              <code className="bg-muted px-1 rounded text-xs">{"{{client_name}}"}</code> en cualquier texto.
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_640px] gap-6">
          <div>
            <Tabs defaultValue="brand">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="brand"><Brush className="h-4 w-4 mr-1.5" /> Brand</TabsTrigger>
                <TabsTrigger value="header"><HeadingIcon className="h-4 w-4 mr-1.5" /> Header</TabsTrigger>
                <TabsTrigger value="hero"><Sparkles className="h-4 w-4 mr-1.5" /> Hero</TabsTrigger>
                <TabsTrigger value="body"><TextCursor className="h-4 w-4 mr-1.5" /> Body</TabsTrigger>
                <TabsTrigger value="cta"><Tag className="h-4 w-4 mr-1.5" /> CTA & Footer</TabsTrigger>
              </TabsList>

              <TabsContent value="brand">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Marca</CardTitle>
                    <CardDescription>Colores del header y nombre de la empresa.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Nombre empresa" value={config.brand.companyName} onChange={(v) => patch("brand", "companyName", v)} onFocus={() => setActiveField({ block: "brand", field: "companyName" })} />
                    <Field label="Logo URL (opcional)" value={config.brand.logoUrl ?? ""} onChange={(v) => patch("brand", "logoUrl", v)} onFocus={() => setActiveField({ block: "brand", field: "logoUrl" })} placeholder="https://…/logo.png" />
                    <div className="grid grid-cols-3 gap-3">
                      <ColorField label="Primary (navy)" value={config.brand.primaryColor} onChange={(v) => patch("brand", "primaryColor", v)} />
                      <ColorField label="Accent (amber)" value={config.brand.accentColor} onChange={(v) => patch("brand", "accentColor", v)} />
                      <ColorField label="Success (green)" value={config.brand.successColor} onChange={(v) => patch("brand", "successColor", v)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="header">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Header</CardTitle>
                    <CardDescription>Banda superior del email con el saludo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Tagline" value={config.header.tagline} onChange={(v) => patch("header", "tagline", v)} onFocus={() => setActiveField({ block: "header", field: "tagline" })} />
                    <Field label="Título" value={config.header.title} onChange={(v) => patch("header", "title", v)} onFocus={() => setActiveField({ block: "header", field: "title" })} />
                    <TextField label="Saludo" value={config.header.greeting} onChange={(v) => patch("header", "greeting", v)} onFocus={() => setActiveField({ block: "header", field: "greeting" })} rows={3} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hero">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Hero (descuento grande)</CardTitle>
                    <CardDescription>El bloque con el % grande y el copy de ahorro.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Etiqueta sobre el %" value={config.hero.label} onChange={(v) => patch("hero", "label", v)} onFocus={() => setActiveField({ block: "hero", field: "label" })} />
                    <Field label="Copy de ahorro" value={config.hero.savingsCopy} onChange={(v) => patch("hero", "savingsCopy", v)} onFocus={() => setActiveField({ block: "hero", field: "savingsCopy" })} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="body">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Body</CardTitle>
                    <CardDescription>Etiquetas de la comparación antes/después y rationale.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Etiqueta «Antes»" value={config.body.beforeLabel} onChange={(v) => patch("body", "beforeLabel", v)} onFocus={() => setActiveField({ block: "body", field: "beforeLabel" })} />
                    <Field label="Etiqueta «Después»" value={config.body.afterLabel} onChange={(v) => patch("body", "afterLabel", v)} onFocus={() => setActiveField({ block: "body", field: "afterLabel" })} />
                    <Field label="Etiqueta «Rationale»" value={config.body.rationaleLabel} onChange={(v) => patch("body", "rationaleLabel", v)} onFocus={() => setActiveField({ block: "body", field: "rationaleLabel" })} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cta">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">CTA y Footer</CardTitle>
                    <CardDescription>Botón principal + copy y soporte del footer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Texto del botón" value={config.cta.label} onChange={(v) => patch("cta", "label", v)} onFocus={() => setActiveField({ block: "cta", field: "label" })} />
                    <Field label="URL del botón" value={config.cta.url} onChange={(v) => patch("cta", "url", v)} onFocus={() => setActiveField({ block: "cta", field: "url" })} placeholder="https://…" />
                    <Field label="Email de soporte" value={config.footer.supportEmail} onChange={(v) => patch("footer", "supportEmail", v)} onFocus={() => setActiveField({ block: "footer", field: "supportEmail" })} />
                    <TextField label="Copy del footer" value={config.footer.footerCopy} onChange={(v) => patch("footer", "footerCopy", v)} onFocus={() => setActiveField({ block: "footer", field: "footerCopy" })} rows={2} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Variables disponibles</CardTitle>
                <CardDescription className="text-xs">Click para insertar en el campo activo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {TOKENS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => insertToken(t.key)}
                      className="text-xs px-2 py-1 rounded bg-muted hover:bg-accent transition-colors"
                      title={t.help}
                    >
                      <code>{`{{${t.key}}}`}</code>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Preview en vivo</CardTitle>
                  <span className="text-xs text-muted-foreground">React Email</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  srcDoc={previewSrcDoc}
                  className="w-full h-[840px] border-0 bg-[#F1F5F9]"
                  title="Email preview"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <Input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onFocus={props.onFocus}
        placeholder={props.placeholder}
      />
    </div>
  );
}

function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <Textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onFocus={props.onFocus}
        rows={props.rows ?? 2}
      />
    </div>
  );
}

function ColorField(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="h-9 w-12 rounded border bg-background cursor-pointer"
        />
        <Input value={props.value} onChange={(e) => props.onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}

/** Debounced live preview — POSTs the current config and renders the returned HTML in an iframe via srcDoc. */
function useLivePreview(config: TemplateConfig): string {
  const [html, setHtml] = useState<string>(
    "<html><body style='font-family:system-ui;padding:24px;color:#64748b'>Cargando preview…</body></html>",
  );
  // Stringify so the deep-equality check works cleanly.
  const key = useMemo(() => JSON.stringify(config), [config]);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/email/template/preview`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });
        if (!res.ok) throw new Error(`preview ${res.status}`);
        setHtml(await res.text());
      } catch (e) {
        setHtml(
          `<html><body style='font-family:system-ui;padding:24px;color:#dc2626'>Error al renderizar preview: ${
            (e as Error).message
          }</body></html>`,
        );
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return html;
}
