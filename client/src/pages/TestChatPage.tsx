import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getClientConfig, sendChatMessage, type ChatSource } from "@/lib/api";
import { Send, RotateCcw, Bot, User, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  confidence?: number;
  model?: string;
}

export default function TestChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<number | null>(null);
  const [expandedContent, setExpandedContent] = useState<string | null>(null); // "msgIdx-sourceIdx"
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: config } = useQuery({
    queryKey: ["client-config"],
    queryFn: () => getClientConfig(),
  });

  // Add intro message on config load
  useEffect(() => {
    if (config && messages.length === 0) {
      const introMessage = config.introMessage || "Hi! How can I help you today?";
      setMessages([
        {
          role: "assistant",
          content: introMessage,
        },
      ]);
    }
  }, [config]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation history (exclude intro message and sources)
      const history = newMessages
        .filter((_, i) => i > 0) // Skip intro
        .slice(0, -1) // Exclude the latest user message (sent separately)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendChatMessage(userMessage, history);

      // Flatten the new sources shape ({docs, turns, profile, faqs}) into the
      // ChatSource[] the UI was built for.
      const flatSources: ChatSource[] = [
        ...response.sources.faqs.map((f) => ({
          type: "faq" as const,
          id: f.id,
          score: f.score,
          title: f.question,
          category: f.category,
        })),
        ...response.sources.docs.map((d) => ({
          type: "doc" as const,
          id: d.id,
          score: d.score,
          title: d.file,
        })),
        ...response.sources.turns.map((t) => ({
          type: "turn" as const,
          id: t.id,
          score: t.score,
          title: `prior ${t.role ?? "turn"}`,
        })),
        ...response.sources.profile.map((p) => ({
          type: "profile" as const,
          id: p.id,
          score: p.score,
          title: "user profile fact",
        })),
      ];

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          sources: flatSources,
          confidence: undefined,
          model: undefined,
        },
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get response",
        variant: "destructive",
      });
      // Remove user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    const introMessage = config?.introMessage || "Hi! How can I help you today?";
    setMessages([{ role: "assistant", content: introMessage }]);
    setShowSources(null);
  };

  const modelLabel = config?.model
    ? (() => {
        const m = config.model;
        if (m.includes("gpt-5.4-nano")) return "GPT-5.4 Nano";
        if (m.includes("gpt-5.4-mini")) return "GPT-5.4 Mini";
        if (m.includes("gpt-5.4")) return "GPT-5.4";
        if (m.includes("gpt-4.1-mini")) return "GPT-4.1 Mini";
        if (m.includes("gpt-4.1")) return "GPT-4.1";
        if (m.includes("o4-mini")) return "O4 Mini";
        if (m.includes("opus-4-6")) return "Claude Opus 4.6";
        if (m.includes("sonnet-4-6")) return "Claude Sonnet 4.6";
        if (m.includes("haiku-4-5")) return "Claude Haiku 4.5";
        return m;
      })()
    : "GPT-5.4 Mini";

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return "bg-emerald-500";
    if (score >= 0.4) return "bg-amber-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.7) return "text-emerald-400";
    if (score >= 0.4) return "text-amber-400";
    return "text-red-400";
  };

  const getSourceBadgeColor = (type: string) => {
    switch (type) {
      case "faq": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "website": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "document": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "";
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl tracking-tight">Test Chat</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Test your chatbot in a live conversation. Messages use your configured settings and knowledge base.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              {modelLabel}
            </Badge>
            <Button variant="outline" size="sm" onClick={clearChat}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4" />
              {config?.botName || "AI Assistant"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2.5 max-w-[75%] ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                        {/* Confidence bar */}
                        {msg.role === "assistant" && msg.confidence !== undefined && msg.confidence > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${getConfidenceColor(msg.confidence)}`}
                                  style={{ width: `${Math.round(msg.confidence * 100)}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-mono ${getConfidenceLabel(msg.confidence)}`}>
                                {Math.round(msg.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Sources toggle */}
                        {msg.sources && msg.sources.length > 0 && (
                          <button
                            onClick={() =>
                              setShowSources(showSources === i ? null : i)
                            }
                            className="flex items-center gap-1 mt-2 text-xs opacity-70 hover:opacity-100 transition-opacity"
                          >
                            {showSources === i ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""} used
                          </button>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Expanded sources panel */}
                    {showSources === i && msg.sources && (
                      <div className="ml-11 mt-2 space-y-2">
                        {msg.sources.map((source, si) => {
                          const contentKey = `${i}-${si}`;
                          const isExpanded = expandedContent === contentKey;

                          return (
                            <div
                              key={si}
                              className="rounded-lg border bg-background/80 p-3 text-xs space-y-2"
                            >
                              {/* Source header */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getSourceBadgeColor(source.type)}`}>
                                  {source.type === "faq" ? "FAQ" : source.type === "website" ? "Website" : "Document"}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {source.collection}
                                </span>
                                <span className="font-medium truncate flex-1">{source.title}</span>
                                <span className={`font-mono ${getConfidenceLabel(source.score)}`}>
                                  {Math.round(source.score * 100)}%
                                </span>
                              </div>

                              {/* Metadata row */}
                              <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                                {source.sectionHeading && (
                                  <span className="truncate">Section: {source.sectionHeading}</span>
                                )}
                                {source.sourceUrl && (
                                  <a
                                    href={source.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {new URL(source.sourceUrl).hostname}
                                  </a>
                                )}
                                {source.docId && (
                                  <span className="font-mono">Doc: {source.docId.slice(0, 8)}...</span>
                                )}
                                {source.distance !== null && (
                                  <span className="font-mono">Dist: {source.distance.toFixed(3)}</span>
                                )}
                              </div>

                              {/* Content preview / full */}
                              <div className="text-muted-foreground">
                                <p className={isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}>
                                  {isExpanded ? source.fullContent : source.content}
                                </p>
                                {source.fullContent.length > 200 && (
                                  <button
                                    onClick={() => setExpandedContent(isExpanded ? null : contentKey)}
                                    className="text-primary hover:underline mt-1"
                                  >
                                    {isExpanded ? "Show less" : "Show more"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="rounded-lg px-4 py-3 bg-muted">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
