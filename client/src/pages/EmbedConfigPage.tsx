import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Select removed — position control no longer needed for centered MorphPanel
import { useToast } from "@/hooks/use-toast";
import { getClientConfig, updateClientConfig } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Save, Code, Eye, Copy, Check, Paintbrush } from "lucide-react";
import { MorphPanel } from "@/components/ui/ai-input";

interface WidgetConfig {
  primaryColor: string;
  accentColor: string;
  buttonText: string;
  chatHeaderTitle: string;
  position: "left" | "right";
  customCss?: string;
  inputPlaceholder?: string;
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  primaryColor: "#2d92dc",
  accentColor: "#1a1a2e",
  buttonText: "Ask AI",
  chatHeaderTitle: "AI Chat",
  position: "right",
  customCss: "",
  inputPlaceholder: "Type a message...",
};

export default function EmbedConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG);
  const [previewMessages, setPreviewMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreviewSend = async (message: string) => {
    const userMsg = { role: "user" as const, content: message };
    setPreviewMessages((prev) => [...prev, userMsg]);
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/widget/chat/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationHistory: [...previewMessages, userMsg],
        }),
      });
      const data = await res.json();
      setPreviewMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "No response" },
      ]);
    } catch {
      setPreviewMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: could not reach the server." },
      ]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const { data: config, isLoading } = useQuery({
    queryKey: ["client-config"],
    queryFn: () => getClientConfig(),
  });

  useEffect(() => {
    if (config?.widgetConfig) {
      setWidgetConfig({ ...DEFAULT_WIDGET_CONFIG, ...config.widgetConfig });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: { widgetConfig: WidgetConfig }) => updateClientConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-config"] });
      toast({
        title: "Widget settings saved",
        description: "Your embed widget configuration has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save widget settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ widgetConfig });
  };

  const embedUrl = `${window.location.origin}/widget?agent=default`;
  const serverOrigin = window.location.origin;

  const embedCode = `<script
  src="${serverOrigin}/widget.js"
  data-server="${serverOrigin}"
  data-agent="default"
  data-color="${widgetConfig.primaryColor}"
  data-accent="${widgetConfig.accentColor}"
  data-title="${widgetConfig.chatHeaderTitle}"
  data-position="${widgetConfig.position}"
  data-placeholder="${widgetConfig.inputPlaceholder || "Type a message..."}"
  data-button="${widgetConfig.buttonText}"
  defer
><\/script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Embed code copied to clipboard." });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl tracking-tight">Embed Widget</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Customize your chat widget and get the embed code for your website.
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customization Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the chat widget looks on your website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <p className="text-xs text-muted-foreground">Messages, send button, orb color</p>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={widgetConfig.primaryColor}
                        onChange={(e) =>
                          setWidgetConfig((p) => ({ ...p, primaryColor: e.target.value }))
                        }
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={widgetConfig.primaryColor}
                        onChange={(e) =>
                          setWidgetConfig((p) => ({ ...p, primaryColor: e.target.value }))
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Orb Accent Color</Label>
                    <p className="text-xs text-muted-foreground">Secondary orb gradient color</p>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="accentColor"
                        value={widgetConfig.accentColor}
                        onChange={(e) =>
                          setWidgetConfig((p) => ({ ...p, accentColor: e.target.value }))
                        }
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={widgetConfig.accentColor}
                        onChange={(e) =>
                          setWidgetConfig((p) => ({ ...p, accentColor: e.target.value }))
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buttonText">Dock Bar Text</Label>
                    <Input
                      id="buttonText"
                      value={widgetConfig.buttonText}
                      onChange={(e) =>
                        setWidgetConfig((p) => ({ ...p, buttonText: e.target.value }))
                      }
                      placeholder="Ask AI"
                    />
                    <p className="text-xs text-muted-foreground">Text shown on the collapsed bar</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chatHeaderTitle">Chat Header Text</Label>
                    <Input
                      id="chatHeaderTitle"
                      value={widgetConfig.chatHeaderTitle}
                      onChange={(e) =>
                        setWidgetConfig((p) => ({ ...p, chatHeaderTitle: e.target.value }))
                      }
                      placeholder="AI Chat"
                    />
                    <p className="text-xs text-muted-foreground">Title in the expanded panel header</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inputPlaceholder">Input Placeholder</Label>
                  <Input
                    id="inputPlaceholder"
                    value={widgetConfig.inputPlaceholder || ""}
                    onChange={(e) =>
                      setWidgetConfig((p) => ({ ...p, inputPlaceholder: e.target.value }))
                    }
                    placeholder="Type a message..."
                  />
                  <p className="text-xs text-muted-foreground">Placeholder text in the chat input field</p>
                </div>
              </CardContent>
            </Card>

            {/* Custom CSS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paintbrush className="w-5 h-5" />
                  Custom CSS
                </CardTitle>
                <CardDescription>
                  Add custom CSS to override default widget styles. Use class selectors like{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.widget-panel</code>,{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.widget-header</code>,{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.widget-bubble</code>,{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.widget-input-area</code>,{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.widget-footer</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={widgetConfig.customCss || ""}
                  onChange={(e) =>
                    setWidgetConfig((p) => ({ ...p, customCss: e.target.value }))
                  }
                  placeholder={`.widget-panel {\n  /* border-radius: 16px; */\n}\n.widget-bubble {\n  /* font-size: 13px; */\n}\n.chat-input-container {\n  /* background: rgba(0,0,0,0.05); */\n}`}
                  className="font-mono text-xs min-h-[140px]"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Available selectors: <code>.widget-open-btn</code>, <code>.widget-panel</code>,{" "}
                  <code>.widget-header</code>, <code>.widget-messages</code>,{" "}
                  <code>.widget-message</code>, <code>.widget-message-user</code>,{" "}
                  <code>.widget-message-assistant</code>, <code>.widget-bubble</code>,{" "}
                  <code>.widget-avatar</code>, <code>.widget-input-area</code>,{" "}
                  <code>.chat-input-container</code>, <code>.widget-footer</code>
                </p>
              </CardContent>
            </Card>

            {/* Embed Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Embed Code
                </CardTitle>
                <CardDescription>
                  Copy this code and paste it into your website's HTML, just before the closing &lt;/body&gt; tag.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={copyEmbedCode}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <strong>Direct URL:</strong>{" "}
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {embedUrl}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <Card className="h-fit sticky top-24">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="relative border rounded-lg overflow-hidden bg-muted flex items-center justify-center"
                style={{ height: "580px" }}
              >
                {/* Simulated website background */}
                <div className="absolute inset-0 p-6 space-y-3 opacity-20 pointer-events-none">
                  <div className="h-8 bg-muted-foreground/30 rounded w-1/2" />
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                  <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
                  <div className="h-32 bg-muted-foreground/20 rounded" />
                  <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
                  <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
                </div>

                {/* MorphPanel preview */}
                <div className="relative z-10" style={{ width: 340 }}>
                  <MorphPanel
                    placeholder={widgetConfig.inputPlaceholder || "Type a message..."}
                    primaryColor={widgetConfig.primaryColor}
                    accentColor={widgetConfig.accentColor}
                    dockText={widgetConfig.buttonText}
                    headerText={widgetConfig.chatHeaderTitle}
                    messages={previewMessages}
                    isLoading={previewLoading}
                    onSubmit={handlePreviewSend}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Click "Ask AI" to preview the expanded chat. Use "Direct URL" above to test the full widget.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
