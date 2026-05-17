import React, { useEffect, useRef, useState, useCallback, memo } from "react";

interface ChatInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  primaryColor?: string;
  textColor?: string;
}

const SendButton = memo(({ isDisabled, primaryColor }: { isDisabled: boolean; primaryColor: string }) => (
  <button
    type="submit"
    aria-label="Send message"
    disabled={isDisabled}
    className={`ml-auto self-center h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full border-0 p-0 transition-all z-20 ${
      isDisabled
        ? "opacity-40 cursor-not-allowed bg-gray-400 text-white/60"
        : "opacity-90 text-white hover:opacity-100 cursor-pointer hover:shadow-lg"
    }`}
    style={!isDisabled ? { backgroundColor: primaryColor } : undefined}
  >
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${isDisabled ? "opacity-50" : "opacity-100"}`}
    >
      <path
        d="M16 22L16 10M16 10L11 15M16 10L21 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
));
SendButton.displayName = "SendButton";

export default function ChatInput({
  placeholder = "Type a message...",
  onSubmit,
  disabled = false,
  primaryColor = "#2d92dc",
  textColor = "#1f2937",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const throttleRef = useRef<number | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 22 * 4 + 16; // 4 lines
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + "px";
    }
  }, [value]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && onSubmit && !disabled) {
        onSubmit(value.trim());
        setValue("");
      }
    },
    [value, onSubmit, disabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current && !throttleRef.current) {
      throttleRef.current = window.setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setMousePosition({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }
        throttleRef.current = null;
      }, 50);
    }
  }, []);

  const isSubmitDisabled = disabled || !value.trim();

  // Convert hex to rgba for glow effects
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-form" style={{ padding: "12px 16px" }}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="chat-input-container group"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
          minHeight: "44px",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "4px 4px 4px 16px",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.06)",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
          overflow: "hidden",
        }}
      >
        {/* Glow effect on focus */}
        <div
          className="chat-input-glow"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            opacity: 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            boxShadow: `0 0 0 1px ${hexToRgba(primaryColor, 0.3)}, 0 0 12px ${hexToRgba(primaryColor, 0.15)}, 0 0 24px ${hexToRgba(primaryColor, 0.08)}`,
          }}
        />

        {/* Cursor-following gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            opacity: 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            background: `radial-gradient(circle 100px at ${mousePosition.x}% ${mousePosition.y}%, ${hexToRgba(primaryColor, 0.06)} 0%, transparent 70%)`,
          }}
          className="chat-input-gradient"
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Message Input"
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            minHeight: "36px",
            maxHeight: "96px",
            backgroundColor: "transparent",
            fontSize: "14px",
            fontFamily: "inherit",
            color: textColor,
            border: "none",
            outline: "none",
            padding: "6px 8px 6px 0",
            resize: "none",
            overflowY: "auto",
            lineHeight: "22px",
            letterSpacing: "-0.14px",
            zIndex: 10,
            position: "relative",
          }}
        />

        <SendButton isDisabled={isSubmitDisabled} primaryColor={primaryColor} />
      </div>

      <style>{`
        .chat-input-container:hover .chat-input-glow,
        .chat-input-container:focus-within .chat-input-glow {
          opacity: 1 !important;
        }
        .chat-input-container:hover .chat-input-gradient {
          opacity: 1 !important;
        }
        .chat-input-container:focus-within {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.08) !important;
        }
        .chat-input-container textarea::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </form>
  );
}
