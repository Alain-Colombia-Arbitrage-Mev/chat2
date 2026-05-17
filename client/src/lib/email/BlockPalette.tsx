import { useDraggable } from "@dnd-kit/core";
import {
  Heading as HeadingIcon,
  Type,
  Image as ImageIcon,
  MousePointer,
  Minus,
  ArrowUpDown,
  Sparkles,
  Columns2,
} from "lucide-react";
import type { BlockType } from "./blocks";

type Item = { type: BlockType; label: string; icon: React.ComponentType<{ className?: string }> };

const ITEMS: Item[] = [
  { type: "heading", label: "Heading", icon: HeadingIcon },
  { type: "text", label: "Texto", icon: Type },
  { type: "image", label: "Imagen", icon: ImageIcon },
  { type: "button", label: "Botón", icon: MousePointer },
  { type: "hero", label: "Hero", icon: Sparkles },
  { type: "columns", label: "Columnas", icon: Columns2 },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: ArrowUpDown },
];

export function BlockPalette() {
  return (
    <div className="space-y-1.5">
      {ITEMS.map((it) => (
        <PaletteItem key={it.type} item={it} />
      ))}
    </div>
  );
}

function PaletteItem({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.type}`,
    data: { source: "palette", blockType: item.type },
  });

  const Icon = item.icon;
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      className={`w-full flex items-center gap-2 px-2.5 py-2 text-left text-sm rounded-md border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1">{item.label}</span>
    </button>
  );
}

export function PaletteDragOverlay({ type }: { type: BlockType }) {
  const it = ITEMS.find((i) => i.type === type);
  if (!it) return null;
  const Icon = it.icon;
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 text-sm rounded-md border bg-card shadow-lg w-44">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{it.label}</span>
    </div>
  );
}
