import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { type Block, type EmailDoc, interpolate } from "./blocks";

type Props = {
  doc: EmailDoc;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (blockId: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
};

// Renders the email blocks DIRECTLY in the page (no iframe) so dnd-kit can hook
// into pointer events on each block. Click-to-edit happens via contentEditable
// in-place. The visual fidelity is close to email render — inline styles only.
export function EmailCanvas({ doc, selectedId, onSelect, onEdit, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-empty" });
  return (
    <div
      style={{
        backgroundColor: doc.brand.bodyBg,
        padding: "24px 0",
        minHeight: 600,
        borderRadius: 8,
      }}
      onClick={(e) => {
        // Click on the body background (not on a block) clears selection.
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      <div
        style={{
          backgroundColor: doc.brand.containerBg,
          maxWidth: 600,
          margin: "0 auto",
          borderRadius: 12,
          overflow: "hidden",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <SortableContext items={doc.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {doc.blocks.length === 0 ? (
            <div
              ref={setNodeRef}
              style={{
                padding: 48,
                textAlign: "center",
                color: "#94A3B8",
                border: `2px dashed ${isOver ? "#0EA5E9" : "#CBD5E1"}`,
                margin: 16,
                borderRadius: 8,
              }}
            >
              Arrastra un bloque aquí
            </div>
          ) : (
            doc.blocks.map((b) => (
              <SortableShell
                key={b.id}
                block={b}
                selected={b.id === selectedId}
                brand={doc.brand}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableShell({
  block,
  selected,
  brand,
  onSelect,
  onEdit,
  onDelete,
}: {
  block: Block;
  selected: boolean;
  brand: EmailDoc["brand"];
  onSelect: (id: string) => void;
  onEdit: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: "canvas", blockId: block.id },
  });

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
    outline: selected ? "2px solid #0EA5E9" : "2px solid transparent",
    outlineOffset: -2,
  };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      className="group hover:outline-sky-300/60"
    >
      {/* Floating controls — only visible on hover/selected */}
      <div
        className={`absolute left-1 top-1 z-10 flex items-center gap-1 ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } transition-opacity`}
      >
        <button
          {...attributes}
          {...listeners}
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="bg-sky-500 text-white rounded p-1 shadow cursor-grab active:cursor-grabbing"
          title="Arrastrar para reordenar"
          aria-label="Arrastrar"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="bg-sky-500 text-white text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded">
          {block.type}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(block.id);
        }}
        className={`absolute right-1 top-1 z-10 ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } transition-opacity bg-white text-rose-600 hover:bg-rose-50 rounded p-1 shadow`}
        title="Eliminar"
        aria-label="Eliminar"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <BlockBody block={block} brand={brand} onEdit={onEdit} />
    </div>
  );
}

// ── Block rendering (no React Email components — just plain styled HTML so
// dnd-kit + contentEditable work without iframes / shadow DOM). The save path
// still uses @react-email/render for the canonical HTML.

function BlockBody({
  block,
  brand,
  onEdit,
}: {
  block: Block;
  brand: EmailDoc["brand"];
  onEdit: (id: string, field: string, value: string) => void;
}) {
  const setText = (field: string) => (v: string) => onEdit(block.id, field, v);
  switch (block.type) {
    case "heading": {
      const fontSize = block.level === 1 ? 28 : block.level === 2 ? 22 : 18;
      const headingStyle: React.CSSProperties = {
        margin: 0,
        padding: "12px 32px",
        fontSize,
        fontWeight: 700,
        color: block.color ?? brand.primaryColor,
        textAlign: block.align,
        lineHeight: 1.25,
      };
      const inner = <Editable value={block.text} onChange={setText("text")} />;
      if (block.level === 1) return <h1 style={headingStyle}>{inner}</h1>;
      if (block.level === 2) return <h2 style={headingStyle}>{inner}</h2>;
      return <h3 style={headingStyle}>{inner}</h3>;
    }
    case "text":
      return (
        <p
          style={{
            margin: 0,
            padding: "12px 32px",
            fontSize: 15,
            lineHeight: 1.55,
            color: block.color ?? "#1F2937",
            textAlign: block.align,
          }}
        >
          <Editable value={block.text} onChange={setText("text")} multiline />
        </p>
      );
    case "image":
      return (
        <div style={{ padding: "12px 32px", textAlign: block.align }}>
          {block.src ? (
            <img
              src={block.src}
              alt={block.alt}
              width={block.width}
              style={{ maxWidth: "100%", height: "auto", display: "inline-block" }}
            />
          ) : (
            <div
              style={{
                border: "2px dashed #CBD5E1",
                padding: 24,
                color: "#94A3B8",
                borderRadius: 8,
              }}
            >
              Imagen sin URL — añade `src` en propiedades
            </div>
          )}
        </div>
      );
    case "button":
      return (
        <div style={{ padding: "20px 32px", textAlign: block.align }}>
          <span
            style={{
              backgroundColor: block.backgroundColor ?? brand.accentColor,
              color: block.color ?? "#0F1B2D",
              fontWeight: 700,
              fontSize: 15,
              padding: "14px 28px",
              borderRadius: 8,
              display: "inline-block",
              cursor: "default",
            }}
          >
            <Editable value={block.label} onChange={setText("label")} />
          </span>
        </div>
      );
    case "divider":
      return (
        <div style={{ padding: "12px 32px" }}>
          <hr style={{ borderColor: block.color ?? "#E2E8F0", margin: 0, borderTop: "1px solid", borderBottom: 0 }} />
        </div>
      );
    case "spacer":
      return (
        <div
          style={{
            height: block.height,
            borderTop: "1px dashed transparent",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(148,163,184,.1) 0 6px, transparent 6px 12px)",
          }}
          aria-label={`Spacer ${block.height}px`}
        />
      );
    case "hero":
      return (
        <div
          style={{
            margin: "16px 32px",
            padding: "28px 24px",
            textAlign: "center",
            borderRadius: 10,
            border: `2px solid ${block.accentColor ?? brand.accentColor}`,
            backgroundColor: "#FFF8EC",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            <Editable value={block.label} onChange={setText("label")} />
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1,
              color: block.accentColor ?? brand.accentColor,
            }}
          >
            <Editable value={block.bigText} onChange={setText("bigText")} />
          </div>
          <div style={{ fontSize: 14, color: "#334155", marginTop: 6 }}>
            <Editable value={block.caption} onChange={setText("caption")} />
          </div>
        </div>
      );
    case "columns":
      return (
        <div style={{ padding: "12px 32px" }}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tbody>
              <tr>
                <td style={cellStyle}>
                  <div style={colLabelStyle}>
                    <Editable value={block.left.label} onChange={setText("left.label")} />
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 20,
                      fontWeight: 700,
                      color: block.left.color ?? "#94A3B8",
                      textDecoration: block.left.strikethrough ? "line-through" : "none",
                    }}
                  >
                    <Editable value={block.left.value} onChange={setText("left.value")} />
                  </div>
                </td>
                <td style={{ width: 12 }} />
                <td style={cellStyle}>
                  <div style={colLabelStyle}>
                    <Editable value={block.right.label} onChange={setText("right.label")} />
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 22,
                      fontWeight: 800,
                      color: block.right.color ?? brand.successColor,
                      textDecoration: block.right.strikethrough ? "line-through" : "none",
                    }}
                  >
                    <Editable value={block.right.value} onChange={setText("right.value")} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
  }
}

const cellStyle: React.CSSProperties = {
  padding: "12px 16px",
  backgroundColor: "#F8FAFC",
  borderRadius: 8,
  verticalAlign: "top",
  width: "50%",
};
const colLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#64748B",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

// ── In-place editable text (double-click to enter, blur/Enter to save) ──────

function Editable({
  value,
  onChange,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);

  // Render with `{{tokens}}` interpolated, but keep raw value for editing.
  const display = editing ? value : interpolate(value);

  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editing]);

  return (
    <span
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={false}
      onClick={(e) => {
        // Single click selects the block (handled by parent). Stop propagation
        // only when we're already editing so the cursor lands inside the text.
        if (editing) e.stopPropagation();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !multiline) {
          e.preventDefault();
          (e.currentTarget as HTMLSpanElement).blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
      onBlur={(e) => {
        const next = e.currentTarget.innerText.replace(/ /g, " ").trim();
        setEditing(false);
        if (next !== value) onChange(next);
      }}
      style={{
        outline: editing ? "1px solid #0EA5E9" : "none",
        borderRadius: 3,
        padding: editing ? "0 2px" : 0,
        cursor: editing ? "text" : "inherit",
        whiteSpace: multiline ? "pre-wrap" : "normal",
      }}
      title={editing ? undefined : "Doble click para editar"}
    >
      {display}
    </span>
  );
}
