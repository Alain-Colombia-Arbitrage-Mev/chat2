import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { Block } from "./blocks";

type Props = {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
};

// The canvas is a tiny side-channel that mirrors the preview: it gives the user
// drag handles + delete buttons + selection chrome that the iframe can't host
// (since dnd-kit can't sense drops inside an iframe). The actual visual email
// is the preview iframe — this is the "structure" view next to it.
export function BlockCanvas({ blocks, selectedId, onSelect, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-empty" });

  return (
    <div className="space-y-1">
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {blocks.length === 0 ? (
          <div
            ref={setNodeRef}
            className={`border-2 border-dashed rounded-md py-12 text-center text-sm text-muted-foreground transition-colors ${
              isOver ? "border-sky-400 bg-sky-50" : "border-muted-foreground/30"
            }`}
          >
            Arrastra un bloque aquí
          </div>
        ) : (
          blocks.map((b) => (
            <SortableBlock
              key={b.id}
              block={b}
              selected={b.id === selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}

function SortableBlock({
  block,
  selected,
  onSelect,
  onDelete,
}: {
  block: Block;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: "canvas", blockId: block.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(block.id)}
      className={`group flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border bg-card hover:border-sky-300 cursor-pointer transition-colors ${
        selected ? "border-sky-500 bg-sky-50" : "border-border"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        aria-label="Arrastrar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate">{labelFor(block)}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(block.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        aria-label="Eliminar"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function labelFor(b: Block): string {
  switch (b.type) {
    case "heading":
      return `H${b.level} · ${b.text.slice(0, 30)}`;
    case "text":
      return `Texto · ${b.text.slice(0, 32)}`;
    case "image":
      return `Imagen · ${b.alt || b.src.slice(0, 28)}`;
    case "button":
      return `Botón · ${b.label}`;
    case "hero":
      return `Hero · ${b.bigText}`;
    case "columns":
      return `Columnas · ${b.left.label} / ${b.right.label}`;
    case "divider":
      return "Divider";
    case "spacer":
      return `Spacer · ${b.height}px`;
  }
}
