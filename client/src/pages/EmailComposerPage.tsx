import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import type { EditorRef, EmailEditorProps } from "react-email-editor";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Save, Eye, EyeOff, RotateCcw, Loader2, ExternalLink, Sparkles,
} from "lucide-react";
import {
  getEmailDraft,
  saveEmailDraft,
  deleteEmailDraft,
  getComposerPreview,
  type EmailPreviewLang,
} from "@/lib/api";

const EmailEditor = lazy(() => import("react-email-editor"));

const LANGS: Array<{ code: EmailPreviewLang; label: string }> = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
];

// Merge tags shown in Unlayer's right-panel dropdown. When the user
// inserts one, it appears as {{key}} in the exported HTML and is
// substituted server-side at send time using real bill data.
const MERGE_TAGS = {
  name: { name: "Nombre del cliente", value: "{{name}}", sample: "María" },
  provider: { name: "Proveedor", value: "{{provider}}", sample: "EPM" },
  kwh: { name: "Consumo mensual", value: "{{kwh}}", sample: "247 kWh" },
  monthlyBill: { name: "Factura actual", value: "{{monthlyBill}}", sample: "COP 536,729" },
  rate: { name: "Tarifa", value: "{{rate}}", sample: "COP 859/kWh" },
  monthlySavings: { name: "Ahorro mensual", value: "{{monthlySavings}}", sample: "COP 209,324" },
  yearlySavings: { name: "Ahorro anual", value: "{{yearlySavings}}", sample: "COP 2,511,888" },
  tenYearSavings: { name: "Ahorro 10 años", value: "{{tenYearSavings}}", sample: "COP 25,118,880" },
  twentyFiveYearSavings: { name: "Ahorro 25 años", value: "{{twentyFiveYearSavings}}", sample: "COP 62,797,200" },
  pct: { name: "% de ahorro", value: "{{pct}}", sample: "39%" },
  companyName: { name: "Empresa", value: "{{companyName}}", sample: "Ancestro" },
  ctaUrl: { name: "URL del CTA", value: "{{ctaUrl}}", sample: "https://ancestro.ai/agendar" },
  currency: { name: "Moneda", value: "{{currency}}", sample: "COP" },
};

// Default Unlayer design used when there's no saved draft yet.
// This is a simple 3-section email the user can then modify.
const DEFAULT_DESIGN = {
  body: {
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: "heading",
                values: {
                  containerPadding: "20px",
                  headingType: "h1",
                  fontSize: "28px",
                  textAlign: "center",
                  text: "Tu propuesta solar, {{name}}",
                  color: "#1a1a2e",
                },
              },
              {
                type: "text",
                values: {
                  containerPadding: "12px 20px",
                  fontSize: "15px",
                  textAlign: "left",
                  text: "<p>Analizamos tu factura de <strong>{{provider}}</strong> y calculamos tu ahorro con energía solar:</p>",
                  color: "#374151",
                },
              },
              {
                type: "text",
                values: {
                  containerPadding: "10px 20px",
                  fontSize: "16px",
                  textAlign: "left",
                  text: "<p><strong>Factura actual:</strong> {{monthlyBill}}<br><strong>Ahorro mensual:</strong> {{monthlySavings}} ({{pct}})<br><strong>Ahorro en 25 años:</strong> {{twentyFiveYearSavings}}</p>",
                  color: "#1a1a2e",
                },
              },
              {
                type: "button",
                values: {
                  containerPadding: "20px",
                  buttonColors: { color: "#ffffff", backgroundColor: "#f97316" },
                  size: { autoWidth: true, width: "100%" },
                  fontSize: "15px",
                  textAlign: "center",
                  padding: "14px 32px",
                  border: {},
                  borderRadius: "8px",
                  href: { name: "web", values: { href: "{{ctaUrl}}", target: "_blank" } },
                  text: "Agendar llamada",
                },
              },
              {
                type: "text",
                values: {
                  containerPadding: "20px",
                  fontSize: "12px",
                  textAlign: "center",
                  text: "<p>— {{companyName}}</p>",
                  color: "#6b7280",
                },
              },
            ],
          },
        ],
        values: { backgroundColor: "#ffffff" },
      },
    ],
    values: {
      backgroundColor: "#f4f5f7",
      contentWidth: "600px",
      fontFamily: { label: "Inter", value: "'Inter', sans-serif" },
    },
  },
  counters: { u_row: 1, u_column: 1, u_content_text: 3, u_content_heading: 1, u_content_button: 1 },
};

export default function EmailComposerPage() {
  const { toast } = useToast();
  const emailEditorRef = useRef<EditorRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [initialDesign, setInitialDesign] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState<EmailPreviewLang>("es");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const previewBlobUrl = useRef<string>("");

  // Load saved design on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const draft = await getEmailDraft();
        if (cancelled) return;
        setInitialDesign((draft.design as Record<string, unknown>) || DEFAULT_DESIGN);
      } catch {
        if (!cancelled) setInitialDesign(DEFAULT_DESIGN);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // When Unlayer is ready AND we have the initial design, load it.
  const onReady: EmailEditorProps["onReady"] = (unlayer) => {
    if (initialDesign) {
      unlayer.loadDesign(initialDesign as any);
    }
    setIsLoaded(true);
  };

  // Re-load design if it arrives after onReady.
  useEffect(() => {
    if (isLoaded && initialDesign && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.loadDesign(initialDesign as any);
    }
  }, [isLoaded, initialDesign]);

  const handleSave = async () => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) return;
    setIsSaving(true);
    unlayer.exportHtml(async (data) => {
      try {
        await saveEmailDraft(data.html, data.design);
        toast({ title: "Guardado", description: "Los próximos emails usarán esta plantilla." });
        // Refresh preview if open.
        if (showPreview) {
          const rendered = await getComposerPreview(previewLang);
          setPreviewHtml(rendered);
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "No se pudo guardar.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handlePreview = async () => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) return;
    unlayer.exportHtml(async (data) => {
      try {
        // Save before previewing so the server uses the latest version.
        await saveEmailDraft(data.html, data.design);
        const rendered = await getComposerPreview(previewLang);
        setPreviewHtml(rendered);
        setShowPreview(true);
      } catch (err: any) {
        toast({ title: "Preview error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReset = async () => {
    if (!confirm("¿Borrar la plantilla guardada y volver al template de código?")) return;
    try {
      await deleteEmailDraft();
      toast({ title: "Restablecido", description: "Se usará el template React por defecto." });
      // Reload the editor with the default design.
      emailEditorRef.current?.editor?.loadDesign(DEFAULT_DESIGN as any);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Refresh preview when language changes.
  useEffect(() => {
    if (!showPreview) return;
    let cancelled = false;
    (async () => {
      try {
        const rendered = await getComposerPreview(previewLang);
        if (!cancelled) setPreviewHtml(rendered);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [previewLang, showPreview]);

  const previewUrl = useMemo(() => {
    if (previewBlobUrl.current) {
      URL.revokeObjectURL(previewBlobUrl.current);
      previewBlobUrl.current = "";
    }
    if (!previewHtml) return "";
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html" }));
    previewBlobUrl.current = url;
    return url;
  }, [previewHtml]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl.current) URL.revokeObjectURL(previewBlobUrl.current);
    };
  }, []);

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-semibold">Email Composer</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Arrastrá bloques (heading, text, button, image, columns, divider) desde el panel derecho.
              Los <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" /><strong>merge tags</strong></span>{" "}
              (nombre, factura, ahorro, etc.) se insertan desde el menú del editor y se reemplazan con
              los datos reales del usuario al enviar.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" /> Template de código
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={!isLoaded}>
              {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isLoaded || isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "Guardando..." : "Guardar y publicar"}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div style={{ height: "75vh", minHeight: 640 }}>
              {!isLoaded && (
                <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando editor...
                </div>
              )}
              <Suspense fallback={
                <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando editor...
                </div>
              }>
              <EmailEditor
                ref={emailEditorRef}
                onReady={onReady}
                minHeight="75vh"
                options={{
                  appearance: { theme: "light" },
                  mergeTags: MERGE_TAGS,
                  displayMode: "email",
                  features: { preview: true, textEditor: { tables: true } },
                }}
              />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-sm">Preview con datos reales</CardTitle>
                  <CardDescription>
                    Factura de ejemplo: EPM, 247 kWh, COP 536,729. Los <code>{"{{tags}}"}</code>{" "}
                    se reemplazan con los valores reales.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Tabs value={previewLang} onValueChange={(v) => setPreviewLang(v as EmailPreviewLang)}>
                    <TabsList>
                      {LANGS.map((l) => (
                        <TabsTrigger key={l.code} value={l.code} className="text-xs">
                          {l.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  {previewUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  title="Preview"
                  className="w-full border-0 block bg-white"
                  style={{ height: 800 }}
                />
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Preview no disponible.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
