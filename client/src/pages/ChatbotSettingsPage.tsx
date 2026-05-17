import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getClientConfig, updateClientConfig } from "@/lib/api";
import { chatbotSettingsSchema, type ChatbotSettingsFormValues } from "@/lib/schemas";
import { DEFAULT_SYSTEM_PROMPT } from "@shared/schema";
import { Save, Bot, Sliders, MessageSquare } from "lucide-react";

const AVAILABLE_MODELS = [
  { id: "gpt-5.4", label: "GPT-5.4", provider: "OpenAI" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini", provider: "OpenAI" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano", provider: "OpenAI" },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "OpenAI" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI" },
  { id: "o4-mini", label: "O4 Mini", provider: "OpenAI" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "Anthropic" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini (OpenRouter)", provider: "OpenRouter" },
  { id: "google/gemma-4-31b-it", label: "Gemma 4 31B IT", provider: "OpenRouter" },
  { id: "minimax/minimax-m2.7", label: "MiniMax M2.7", provider: "OpenRouter" },
  { id: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron 3 Super 120B", provider: "OpenRouter" },
];

export default function ChatbotSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["client-config"],
    queryFn: () => getClientConfig(),
  });

  const form = useForm<ChatbotSettingsFormValues>({
    resolver: zodResolver(chatbotSettingsSchema),
    defaultValues: {
      botName: "AI Assistant",
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      model: "openai/gpt-5.4-mini",
      temperature: 0.7,
      maxTokens: 500,
      topP: 1.0,
      introMessage: "Hi! How can I help you today?",
    },
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      form.reset({
        botName: config.botName || "AI Assistant",
        systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        model: config.model || "openai/gpt-5.4-mini",
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens ?? 500,
        topP: config.topP ?? 1.0,
        introMessage: config.introMessage || "Hi! How can I help you today?",
      });
    }
  }, [config, form]);

  const updateMutation = useMutation({
    mutationFn: (data: ChatbotSettingsFormValues) => updateClientConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-config"] });
      toast({
        title: "Settings saved",
        description: "Your chatbot settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChatbotSettingsFormValues) => {
    updateMutation.mutate(data);
  };

  const temperature = form.watch("temperature");
  const topP = form.watch("topP");
  const maxTokens = form.watch("maxTokens");

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
            <h2 className="text-3xl tracking-tight">Chatbot Settings</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Configure your chatbot's behavior, personality, and model settings.
            </p>
          </div>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Bot Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Bot Identity
              </CardTitle>
              <CardDescription>
                Set the name and greeting for your chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="botName">Bot Name</Label>
                  <Input
                    id="botName"
                    placeholder="AI Assistant"
                    {...form.register("botName")}
                  />
                  {form.formState.errors.botName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.botName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="introMessage">Intro / Greeting Message</Label>
                <p className="text-xs text-muted-foreground">
                  This is the first message users see when they open the chat.
                </p>
                <Textarea
                  id="introMessage"
                  placeholder="Hi! How can I help you today?"
                  rows={2}
                  {...form.register("introMessage")}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                System Prompt
              </CardTitle>
              <CardDescription>
                Define the chatbot's personality, behavior rules, and instructions. This is the main prompt that guides how the bot responds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="systemPrompt"
                placeholder="Define the chatbot's personality, sales approach, objection handling, and behavior rules..."
                rows={10}
                className="font-mono text-sm"
                {...form.register("systemPrompt")}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Be specific about the bot's role, tone, and what topics it should and shouldn't discuss. The knowledge base content is automatically appended to this prompt during conversations.
              </p>
            </CardContent>
          </Card>

          {/* Model & Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Model & Parameters
              </CardTitle>
              <CardDescription>
                Choose the AI model and fine-tune response generation settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={form.watch("model")}
                  onValueChange={(value) => form.setValue("model", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">OpenAI</div>
                    {AVAILABLE_MODELS.filter(m => m.provider === "OpenAI").map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Anthropic</div>
                    {AVAILABLE_MODELS.filter(m => m.provider === "Anthropic").map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">OpenRouter</div>
                    {AVAILABLE_MODELS.filter(m => m.provider === "OpenRouter").map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the AI model that powers your chatbot's responses.
                </p>
              </div>

              <Separator />

              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={[temperature]}
                  onValueChange={([value]) => form.setValue("temperature", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise (0)</span>
                  <span>Balanced (0.7)</span>
                  <span>Creative (2.0)</span>
                </div>
              </div>

              {/* Top P */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Top P (Nucleus Sampling)</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {topP.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[topP]}
                  onValueChange={([value]) => form.setValue("topP", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Focused (0)</span>
                  <span>Full range (1.0)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Max Response Length (tokens)</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {maxTokens}
                  </span>
                </div>
                <Slider
                  min={50}
                  max={4096}
                  step={50}
                  value={[maxTokens]}
                  onValueChange={([value]) => form.setValue("maxTokens", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Short (50)</span>
                  <span>Medium (500)</span>
                  <span>Long (4096)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
