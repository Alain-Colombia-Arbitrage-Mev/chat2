import { useState, useEffect, useRef } from "react";
import { getClientConfig, sendChatMessage } from "@/lib/api";

function getWidgetAgentId(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("agent") || "default";
}

async function fetchWidgetConfig() {
  return getClientConfig();
}

/**
 * Send a chat message to memory.ancestro.ai.
 *
 * The first turn after the lead form is filled embeds the userInfo at the
 * top so the backend's `register_user` tool fires automatically and the
 * anonymous session is upgraded to authenticated with a permanent user_id.
 */
async function sendWidgetMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userInfo?: { name: string; email: string; phone: string },
  sessionId?: string | null,
  isFirstUserMessage = false,
) {
  let messageToSend = message;
  if (isFirstUserMessage && userInfo) {
    // Stitch lead info into the first user turn so register_user tool fires.
    messageToSend =
      `[user info: name=${userInfo.name}, email=${userInfo.email}, phone=${userInfo.phone}]\n\n` +
      message;
  }
  const resp = await sendChatMessage(messageToSend, conversationHistory, {
    sessionId: sessionId ?? undefined,
    useTools: true,
  });
  return {
    response: resp.reply,
    sessionId: resp.session_id,
    sources: resp.sources,
    registered: resp.registered,
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface WidgetConfig {
  primaryColor: string;
  accentColor: string;
  buttonText: string;
  chatHeaderTitle: string;
  position: "left" | "right";
  customCss?: string;
  inputPlaceholder?: string;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

const DEFAULT_CONFIG: WidgetConfig = {
  primaryColor: "#2d92dc",
  accentColor: "#1a1a2e",
  buttonText: "Ask AI",
  chatHeaderTitle: "AI Chat",
  position: "right",
  customCss: "",
  inputPlaceholder: "Type a message...",
};

// Simple phone validation: must be 7-15 digits, optionally with + prefix
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return /^\+?\d{7,15}$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EmbeddableWidgetPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const clientConfig = await fetchWidgetConfig();
        if (clientConfig?.widgetConfig) {
          setConfig({ ...DEFAULT_CONFIG, ...clientConfig.widgetConfig });
        }
      } catch (error) {
        console.error("Failed to load widget config:", error);
      }
      setConfigLoaded(true);
    }
    loadConfig();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && userInfo) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, userInfo]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(formData.email)) errors.email = "Invalid email";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    else if (!isValidPhone(formData.phone)) errors.phone = "Invalid phone number (7-15 digits)";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setUserInfo({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/[\s\-().]/g, ""),
    });
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading || !userInfo) return;

    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = newMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const isFirstUserMessage = newMessages.filter((m) => m.role === "user").length === 1;
      const response = await sendWidgetMessage(
        userMessage,
        history,
        userInfo,
        sessionId,
        isFirstUserMessage,
      );
      if (response.sessionId && !sessionId) setSessionId(response.sessionId);
      setMessages((prev) => [...prev, { role: "assistant", content: response.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I'm having trouble responding right now. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading || !userInfo) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📎 ${file.name}` },
      {
        role: "assistant",
        content:
          "File uploads from the widget aren't supported yet on the new backend. Please describe what's in the file and I'll help from there.",
      },
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    void getWidgetAgentId; // keep the import alive for future per-agent routing
  };

  if (!configLoaded) return null;

  const isRight = config.position !== "left";
  const primary = config.primaryColor || "#2d92dc";
  const accent = config.accentColor || "#1a1a2e";

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: transparent; }

        .widget-fab {
          position: fixed; bottom: 24px;
          ${isRight ? "right: 24px;" : "left: 24px;"}
          height: 64px; border-radius: 32px;
          background: #111111; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          padding: 0 24px 0 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          z-index: 2147483647;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          animation: widgetFloat 3s ease-in-out infinite;
          transition: box-shadow 0.3s;
        }
        .widget-fab:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.35);
          animation-play-state: paused;
        }
        @keyframes widgetFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .widget-fab svg { width: 38px; height: 38px; flex-shrink: 0; }
        .widget-fab-text {
          color: #ffffff; font-size: 16px; font-weight: 600;
          white-space: nowrap; letter-spacing: 0.3px;
        }

        .widget-panel {
          position: fixed; bottom: 100px;
          ${isRight ? "right: 24px;" : "left: 24px;"}
          width: 400px; max-width: calc(100vw - 32px);
          height: 560px; max-height: calc(100vh - 130px);
          background: #ffffff; border-radius: 20px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
          display: flex; flex-direction: column; overflow: hidden;
          z-index: 2147483647;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px; line-height: 1.5; color: #1f2937;
          animation: widgetSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: none;
        }
        @keyframes widgetSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .widget-header {
          display: flex; align-items: center; gap: 10px; padding: 16px 20px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white; font-size: 15px; font-weight: 600; flex-shrink: 0;
        }
        .widget-header-logo { width: 28px; height: 26px; flex-shrink: 0; }
        .widget-header-info { display: flex; flex-direction: column; }
        .widget-header-title { font-size: 14px; font-weight: 600; }
        .widget-header-status { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 400; }
        .widget-header-close {
          margin-left: auto; background: none; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer; padding: 6px;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .widget-header-close:hover { color: white; background: rgba(255,255,255,0.1); }

        .widget-form {
          flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 14px;
          overflow-y: auto;
        }
        .widget-form h3 { font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 2px; }
        .widget-form p { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .widget-field { display: flex; flex-direction: column; gap: 4px; }
        .widget-field label { font-size: 12px; font-weight: 500; color: #374151; }
        .widget-field input {
          padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 13px; font-family: inherit; color: #1f2937; outline: none;
          transition: border-color 0.15s;
        }
        .widget-field input:focus { border-color: ${primary}; box-shadow: 0 0 0 2px ${primary}22; }
        .widget-field input.field-error { border-color: #ef4444; }
        .widget-error { font-size: 11px; color: #ef4444; }
        .widget-form-btn {
          padding: 12px; border: none; border-radius: 10px; cursor: pointer;
          font-size: 14px; font-weight: 600; color: #1a1a2e;
          background: #F8B03B; transition: background 0.15s, transform 0.1s; margin-top: 4px;
        }
        .widget-form-btn:hover { background: #e9a235; transform: translateY(-1px); }

        .widget-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .widget-msg {
          max-width: 82%; padding: 10px 14px; font-size: 13px;
          line-height: 1.5; white-space: pre-wrap; word-break: break-word;
        }
        .widget-msg-user {
          align-self: flex-end; background: #F8B03B; color: #1a1a2e;
          border-radius: 16px 16px 4px 16px; font-weight: 500;
        }
        .widget-msg-bot {
          align-self: flex-start; background: #f8f9fa; color: #1f2937;
          border-radius: 16px 16px 16px 4px; border: 1px solid #e9ecef;
        }
        .widget-typing {
          align-self: flex-start; display: flex; gap: 4px;
          padding: 12px 16px; background: #f3f4f6; border-radius: 14px 14px 14px 4px;
        }
        .widget-typing-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #9ca3af;
          animation: typingBounce 1.4s ease-in-out infinite;
        }
        .widget-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .widget-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); }
        }

        .widget-input-area {
          border-top: 1px solid #f0f0f0; padding: 12px 16px;
          display: flex; align-items: flex-end; gap: 8px; background: #fafbfc; flex-shrink: 0;
        }
        .widget-textarea {
          flex: 1; border: none; outline: none; resize: none;
          font-size: 13px; font-family: inherit; color: #1f2937; background: transparent;
          padding: 8px 0; min-height: 36px; max-height: 80px; line-height: 20px;
        }
        .widget-send-btn {
          flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; border: none;
          background: #F8B03B; color: #1a1a2e; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, transform 0.1s;
        }
        .widget-send-btn:hover { background: #e9a235; transform: scale(1.05); }
        .widget-send-btn:disabled { opacity: 0.3; cursor: default; transform: none; }
        .widget-attach-btn {
          flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; border: none;
          background: transparent; color: #9ca3af; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.15s;
        }
        .widget-attach-btn:hover { color: #374151; }
        .widget-attach-btn:disabled { opacity: 0.4; cursor: default; }

        ${config.customCss || ""}
      `}</style>

      {/* FAB */}
      {!isOpen && (
        <button className="widget-fab" onClick={() => setIsOpen(true)} title={config.buttonText}>
          <svg viewBox="20 20 65 60" fill="none">
            <path d="M61.83 48.77c-.78 2.07-1.61 4.13-2.16 6.29-.45 1.75-.63 3.53-.7 5.33-.06 1.86-.08 3.73-.28 5.58-.3 2.94-1.71 5.16-4.43 6.44a6.5 6.5 0 01-3.1.59c-1.9-.03-3.65-.53-5.14-1.71-1.56-1.22-2.42-2.82-2.47-4.83-.02-.85.23-1.55.84-2.22 4.35-4.73 8.64-9.52 12.85-14.38.24-.28.46-.56.69-.84.12-.16.18-.34.1-.52-.09-.19-.28-.14-.45-.14h-4.75c-.43 0-.52-.12-.38-.55 1.17-3.52 2.35-7.04 3.53-10.56v-.13c-1.04 1.07-2.04 2.08-3.01 3.11-2.82 2.97-5.65 5.93-8.52 8.84l-.14.14c-.32.3-.51.3-.8-.04a27 27 0 01-1.69-2.06c-.74-.99-1.5-1.97-2.06-3.08-.69-1.34-1.11-2.77-1.07-4.28.07-2.71 1.44-4.77 3.98-5.82a8.4 8.4 0 013.11-.65c2.78-.24 5.51 0 8.16.88 3 1 5.61 2.62 7.78 4.93.82.88 1.17 1.94 1.3 3.12.27 2.31-.38 4.44-1.17 6.55z" fill="#F8B03B"/>
            <path d="M48.54 52.73c.11-.22.08-.3-.18-.3h-5.04c-.01-.03-.03-.05-.05-.07 3.33-3.25 6.46-6.7 9.8-9.97-.18.54-.37 1.09-.57 1.63-.62 1.72-1.25 3.46-1.88 5.18-.09.24.04.22.2.22h4.16l.58.01c.02.03.04.05.07.08-3.74 4.34-7.38 8.76-11.15 13.09.2-.49.39-.97.59-1.45 1.05-2.55 2.09-5.1 3.14-7.65.11-.26.2-.51.33-.74z" fill="white"/>
            <path d="M45.07 27.67c.01 1.14-.36 2.22-1.14 3.18-1.28 1.57-3.7 1.3-4.82-.07-1.27-1.53-1.64-4.55-.1-6.56 1.27-1.67 3.74-1.62 5.03.1.67.88 1.04 2.07 1.03 3.35z" fill="#F8B03B"/>
            <path d="M51.67 27.5c.01.88-.17 1.7-.67 2.42-.71 1.03-1.97 1.32-2.97.67-.61-.39-.89-1-.07-1.67-.31-1.12-.2-2.19.37-3.2.76-1.35 2.33-1.67 3.38-.72.47.43.71.99.88 1.59.08.29.08.6.08.91z" fill="#F8B03B"/>
            <path d="M57.59 28.8c-.09.93-.32 1.83-.91 2.59-.48.61-1.11.98-1.92.8-.88-.2-1.39-.82-1.57-1.67-.3-1.38.1-2.59 1.1-3.56.95-.92 2.49-.56 3 .65.17.38.33.76.3 1.19z" fill="#F8B03B"/>
            <path d="M60.69 34.55c-1.02.42-2.02-.28-2.25-1.23-.04-.2-.09-.41-.07-.56.01-1.34.64-2.28 1.69-2.92 1.09-.67 2.39-.01 2.56 1.29.18 1.35-.67 2.91-1.93 3.42z" fill="#F8B03B"/>
            <path d="M65.94 35.75c-.13.59-.39 1.11-.78 1.57-.38.44-.85.63-1.25.64-1.19 0-1.82-.76-1.6-1.76.24-1.06.9-1.78 1.93-2.07 1.02-.3 1.91.57 1.7 1.62z" fill="#F8B03B"/>
          </svg>
          <span className="widget-fab-text">Chat with us</span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="widget-panel">
          <div className="widget-header">
            <svg className="widget-header-logo" viewBox="0 0 103 97" fill="none">
              <path d="M48.54 52.73c.11-.22.08-.3-.18-.3h-5.04c-.01-.03-.03-.05-.05-.07 3.33-3.25 6.46-6.7 9.8-9.97-.18.54-.37 1.09-.57 1.63-.62 1.72-1.25 3.46-1.88 5.18-.09.24.04.22.2.22h4.16l.58.01c.02.03.04.05.07.08-3.74 4.34-7.38 8.76-11.15 13.09.2-.49.39-.97.59-1.45 1.05-2.55 2.09-5.1 3.14-7.65.11-.26.2-.51.33-.74z" fill="#F8B03B"/>
              <path d="M12.73 87.33l14.94-4.99 2.7 1.31a44 44 0 0021.13 4.63C77.22 88.28 95.64 69.9 95.64 47.82c0-22.16-18.29-40.46-44.14-40.46S7.36 25.66 7.36 47.82c.04 8.48 2.83 16.72 7.95 23.48l2.51 3.3-5.09 12.73z" fill="none" stroke="#F8B03B" strokeWidth="2"/>
            </svg>
            <div className="widget-header-info">
              <span className="widget-header-title">{config.chatHeaderTitle}</span>
              <span className="widget-header-status">Online</span>
            </div>
            <button className="widget-header-close" onClick={() => setIsOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Step 1: Collect user info */}
          {!userInfo ? (
            <form className="widget-form" onSubmit={handleFormSubmit}>
              <div>
                <h3>Before we start</h3>
                <p>Please share your details so we can assist you better.</p>
              </div>

              <div className="widget-field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? "field-error" : ""}
                  autoFocus
                />
                {formErrors.name && <span className="widget-error">{formErrors.name}</span>}
              </div>

              <div className="widget-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? "field-error" : ""}
                />
                {formErrors.email && <span className="widget-error">{formErrors.email}</span>}
              </div>

              <div className="widget-field">
                <label>Phone</label>
                <input
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={formErrors.phone ? "field-error" : ""}
                />
                {formErrors.phone && <span className="widget-error">{formErrors.phone}</span>}
              </div>

              <button type="submit" className="widget-form-btn">Start Chat</button>
            </form>
          ) : (
            <>
              {/* Step 2: Chat */}
              <div className="widget-messages" ref={scrollRef}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "40px 16px" }}>
                    {config.buttonText || "Send a message to start chatting"}
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`widget-msg ${msg.role === "user" ? "widget-msg-user" : "widget-msg-bot"}`}>
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="widget-typing">
                    <div className="widget-typing-dot" />
                    <div className="widget-typing-dot" />
                    <div className="widget-typing-dot" />
                  </div>
                )}
              </div>

              <div className="widget-input-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                <button
                  className="widget-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Upload bill or document"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <textarea
                  ref={inputRef}
                  className="widget-textarea"
                  placeholder={config.inputPlaceholder || "Type a message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  rows={1}
                  disabled={isLoading}
                />
                <button className="widget-send-btn" onClick={handleSend} disabled={!input.trim() || isLoading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
