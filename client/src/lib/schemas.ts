import { z } from "zod";

export const chatbotSettingsSchema = z.object({
  botName: z.string().min(1, "Bot name is required"),
  systemPrompt: z.string().optional().default(""),
  model: z.string().min(1, "Model is required"),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().min(50).max(4096).default(500),
  topP: z.coerce.number().min(0).max(1).default(1.0),
  introMessage: z.string().optional().default("Hi! How can I help you today?"),
});

export const widgetConfigSchema = z.object({
  primaryColor: z.string().default("#2d92dc"),
  accentColor: z.string().default("#1a1a2e"),
  buttonText: z.string().default("What can I help you with?"),
  chatHeaderTitle: z.string().default("Chat with us"),
  position: z.enum(["left", "right"]).default("right"),
});

export const qaPairSchema = z.object({
  uuid: z.string().optional(),
  topic: z.string().min(1, "Topic is required"),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  company_id: z.string().optional(),
});

export type ChatbotSettingsFormValues = z.infer<typeof chatbotSettingsSchema>;
export type WidgetConfigFormValues = z.infer<typeof widgetConfigSchema>;
export type QAPairFormValues = z.infer<typeof qaPairSchema>;
