import React from "react";
import { cx } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { ColorOrb } from "@/components/ui/color-orb";
import { cn } from "@/lib/utils";

const SPEED_FACTOR = 1;
const DOCK_HEIGHT = 44;
const EXPANDED_HEIGHT = 520;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MorphPanelProps {
  onSubmit?: (message: string) => void;
  disabled?: boolean;
  primaryColor?: string;
  accentColor?: string;
  placeholder?: string;
  dockText?: string;
  headerText?: string;
  messages?: ChatMessage[];
  isLoading?: boolean;
}

interface ContextShape {
  showForm: boolean;
  triggerOpen: () => void;
  triggerClose: () => void;
  disabled: boolean;
}

const FormContext = React.createContext({} as ContextShape);
const useFormContext = () => React.useContext(FormContext);

export function MorphPanel({
  onSubmit,
  disabled = false,
  primaryColor = "#2d92dc",
  accentColor,
  placeholder = "Ask me anything...",
  dockText = "Ask AI",
  headerText = "AI Chat",
  messages = [],
  isLoading = false,
}: MorphPanelProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [showForm, setShowForm] = React.useState(false);

  const triggerClose = React.useCallback(() => {
    setShowForm(false);
    textareaRef.current?.blur();
  }, []);

  const triggerOpen = React.useCallback(() => {
    if (disabled) return;
    setShowForm(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    });
  }, [disabled]);

  const handleSend = React.useCallback(
    (message: string) => {
      if (onSubmit && message.trim()) {
        onSubmit(message.trim());
      }
      // Stay open — don't collapse
    },
    [onSubmit]
  );

  // Auto-scroll messages when new ones arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-open when there are messages beyond the first assistant intro
  React.useEffect(() => {
    if (messages.length > 1 && !showForm) {
      setShowForm(true);
    }
  }, [messages.length]);

  React.useEffect(() => {
    function clickOutsideHandler(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node) &&
        showForm
      ) {
        triggerClose();
      }
    }
    document.addEventListener("mousedown", clickOutsideHandler);
    return () => document.removeEventListener("mousedown", clickOutsideHandler);
  }, [showForm, triggerClose]);

  const ctx = React.useMemo(
    () => ({ showForm, triggerOpen, triggerClose, disabled }),
    [showForm, triggerOpen, triggerClose, disabled]
  );

  const orbTones: Record<string, string> = {
    base: "oklch(22.64% 0 0)",
    ...(primaryColor && { accent1: primaryColor }),
    ...(accentColor && { accent2: accentColor }),
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: "100%", height: EXPANDED_HEIGHT }}
    >
      <motion.div
        ref={wrapperRef}
        data-panel
        className={cx(
          "relative z-[3] flex flex-col overflow-hidden border"
        )}
        style={{
          backgroundColor: "white",
          boxShadow: showForm
            ? "0 8px 40px rgba(0,0,0,0.12), 0 2px 12px rgba(0,0,0,0.08)"
            : "0 2px 12px rgba(0,0,0,0.08)",
        }}
        initial={false}
        animate={{
          width: showForm ? "100%" : "auto",
          height: showForm ? EXPANDED_HEIGHT : DOCK_HEIGHT,
          borderRadius: showForm ? 16 : 20,
        }}
        transition={{
          type: "spring",
          stiffness: 550 / SPEED_FACTOR,
          damping: 45,
          mass: 0.7,
          delay: showForm ? 0 : 0.08,
        }}
      >
        <FormContext.Provider value={ctx}>
          {/* Collapsed dock bar */}
          <DockBar orbTones={orbTones} dockText={dockText} />

          {/* Expanded chat area */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 550 / SPEED_FACTOR,
                  damping: 45,
                  mass: 0.7,
                }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Header with orb */}
                <div className="flex items-center gap-[6px] px-3 py-2 border-b border-gray-100">
                  <ColorOrb dimension="24px" tones={orbTones} />
                  <span
                    className="select-none"
                    style={{ color: "#374151", fontSize: "13px", fontWeight: 500 }}
                  >
                    {headerText}
                  </span>
                  <button
                    type="button"
                    onClick={triggerClose}
                    className="ml-auto flex items-center justify-center rounded-full w-6 h-6 hover:bg-gray-100 transition-colors cursor-pointer"
                    style={{ color: "#9ca3af" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-3 py-3"
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "8px 12px",
                          borderRadius:
                            msg.role === "user"
                              ? "12px 12px 4px 12px"
                              : "12px 12px 12px 4px",
                          backgroundColor:
                            msg.role === "user" ? primaryColor : "#f3f4f6",
                          color: msg.role === "user" ? "white" : "#1f2937",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div
                        style={{
                          padding: "10px 16px",
                          borderRadius: "12px 12px 12px 4px",
                          backgroundColor: "#f3f4f6",
                          display: "flex",
                          gap: "4px",
                          alignItems: "center",
                        }}
                      >
                        <span className="morph-typing-dot" style={{ animationDelay: "0s" }} />
                        <span className="morph-typing-dot" style={{ animationDelay: "0.2s" }} />
                        <span className="morph-typing-dot" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input area */}
                <ChatInputArea
                  ref={textareaRef}
                  onSend={handleSend}
                  placeholder={placeholder}
                  disabled={disabled || isLoading}
                  primaryColor={primaryColor}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </FormContext.Provider>
      </motion.div>

      <style>{`
        @keyframes morphTypingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-3px); }
        }
        .morph-typing-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #9ca3af;
          animation: morphTypingBounce 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function DockBar({ orbTones, dockText }: { orbTones: Record<string, string>; dockText: string }) {
  const { showForm, triggerOpen, disabled } = useFormContext();

  if (showForm) return null;

  return (
    <footer className="flex h-[44px] items-center justify-center whitespace-nowrap select-none">
      <div className="flex items-center justify-center gap-2 px-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <ColorOrb dimension="24px" tones={orbTones} />
        </motion.div>

        <Button
          type="button"
          className="flex h-fit flex-1 justify-end rounded-full px-2 !py-0.5"
          variant="ghost"
          onClick={triggerOpen}
          disabled={disabled}
        >
          <span className="truncate" style={{ color: "#374151", fontSize: "14px" }}>
            {dockText}
          </span>
        </Button>
      </div>
    </footer>
  );
}

interface ChatInputAreaProps {
  ref: React.Ref<HTMLTextAreaElement>;
  onSend: (message: string) => void;
  placeholder: string;
  disabled: boolean;
  primaryColor: string;
}

function ChatInputArea({ ref, onSend, placeholder, disabled, primaryColor }: ChatInputAreaProps) {
  const [value, setValue] = React.useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
      setValue("");
    }
  }

  function handleKeys(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value);
        setValue("");
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-100 px-2 py-2"
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "6px",
          backgroundColor: "#f9fafb",
          borderRadius: "12px",
          padding: "4px 4px 4px 12px",
        }}
      >
        <textarea
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeys}
          disabled={disabled}
          rows={1}
          spellCheck={false}
          className="flex-1 resize-none outline-0"
          style={{
            fontSize: "13px",
            fontFamily: "inherit",
            color: "#1f2937",
            border: "none",
            backgroundColor: "transparent",
            padding: "6px 0",
            minHeight: "32px",
            maxHeight: "80px",
            lineHeight: "20px",
          }}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 flex items-center justify-center rounded-full w-7 h-7 transition-all cursor-pointer"
          style={{
            backgroundColor: disabled || !value.trim() ? "#d1d5db" : primaryColor,
            color: "white",
            opacity: disabled || !value.trim() ? 0.5 : 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 19V5M12 5L6 11M12 5L18 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}

export default MorphPanel;
