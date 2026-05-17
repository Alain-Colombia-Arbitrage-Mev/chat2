import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Block } from "./blocks";

type Props<B extends Block> = {
  block: B;
  onChange: (patch: Partial<B>) => void;
};

export function BlockProperties({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  switch (block.type) {
    case "heading":
      return <HeadingProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
    case "text":
      return <TextProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
    case "image":
      return <ImageProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
    case "button":
      return <ButtonProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
    case "hero":
      return <HeroProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
    case "columns":
      return <ColumnsProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
    case "divider":
      return <DividerProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
    case "spacer":
      return <SpacerProps block={block} onChange={onChange as (p: Partial<typeof block>) => void} />;
  }
}

function HeadingProps({ block, onChange }: Props<Extract<Block, { type: "heading" }>>) {
  return (
    <div className="space-y-3">
      <Field label="Texto">
        <Textarea rows={2} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Nivel">
          <Select
            value={String(block.level)}
            onValueChange={(v) => onChange({ level: Number(v) as 1 | 2 | 3 })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <AlignField value={block.align} onChange={(align) => onChange({ align })} />
      </div>
      <ColorField label="Color" value={block.color ?? ""} onChange={(color) => onChange({ color })} />
    </div>
  );
}

function TextProps({ block, onChange }: Props<Extract<Block, { type: "text" }>>) {
  return (
    <div className="space-y-3">
      <Field label="Texto">
        <Textarea rows={4} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        <ColorField label="Color" value={block.color ?? ""} onChange={(color) => onChange({ color })} />
      </div>
    </div>
  );
}

function ImageProps({ block, onChange }: Props<Extract<Block, { type: "image" }>>) {
  return (
    <div className="space-y-3">
      <Field label="URL">
        <Input value={block.src} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Texto alternativo">
        <Input value={block.alt} onChange={(e) => onChange({ alt: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Ancho (px)">
          <Input
            type="number"
            value={block.width}
            onChange={(e) => onChange({ width: Number(e.target.value) || 0 })}
          />
        </Field>
        <AlignField value={block.align} onChange={(align) => onChange({ align })} />
      </div>
    </div>
  );
}

function ButtonProps({ block, onChange }: Props<Extract<Block, { type: "button" }>>) {
  return (
    <div className="space-y-3">
      <Field label="Texto del botón">
        <Input value={block.label} onChange={(e) => onChange({ label: e.target.value })} />
      </Field>
      <Field label="URL (href)">
        <Input value={block.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://…" />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        <ColorField
          label="Fondo"
          value={block.backgroundColor ?? ""}
          onChange={(backgroundColor) => onChange({ backgroundColor })}
        />
        <ColorField
          label="Texto"
          value={block.color ?? ""}
          onChange={(color) => onChange({ color })}
        />
      </div>
    </div>
  );
}

function HeroProps({ block, onChange }: Props<Extract<Block, { type: "hero" }>>) {
  return (
    <div className="space-y-3">
      <Field label="Etiqueta (arriba)">
        <Input value={block.label} onChange={(e) => onChange({ label: e.target.value })} />
      </Field>
      <Field label="Número/texto grande">
        <Input value={block.bigText} onChange={(e) => onChange({ bigText: e.target.value })} />
      </Field>
      <Field label="Caption (abajo)">
        <Input value={block.caption} onChange={(e) => onChange({ caption: e.target.value })} />
      </Field>
      <ColorField
        label="Color acento"
        value={block.accentColor ?? ""}
        onChange={(accentColor) => onChange({ accentColor })}
      />
    </div>
  );
}

function ColumnsProps({ block, onChange }: Props<Extract<Block, { type: "columns" }>>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 p-2 rounded border">
        <p className="text-xs font-semibold text-muted-foreground">Columna izquierda</p>
        <Field label="Etiqueta">
          <Input
            value={block.left.label}
            onChange={(e) => onChange({ left: { ...block.left, label: e.target.value } })}
          />
        </Field>
        <Field label="Valor">
          <Input
            value={block.left.value}
            onChange={(e) => onChange({ left: { ...block.left, value: e.target.value } })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Color"
            value={block.left.color ?? ""}
            onChange={(c) => onChange({ left: { ...block.left, color: c } })}
          />
          <Field label="Tachado">
            <Select
              value={block.left.strikethrough ? "yes" : "no"}
              onValueChange={(v) => onChange({ left: { ...block.left, strikethrough: v === "yes" } })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Sí</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
      <div className="space-y-2 p-2 rounded border">
        <p className="text-xs font-semibold text-muted-foreground">Columna derecha</p>
        <Field label="Etiqueta">
          <Input
            value={block.right.label}
            onChange={(e) => onChange({ right: { ...block.right, label: e.target.value } })}
          />
        </Field>
        <Field label="Valor">
          <Input
            value={block.right.value}
            onChange={(e) => onChange({ right: { ...block.right, value: e.target.value } })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Color"
            value={block.right.color ?? ""}
            onChange={(c) => onChange({ right: { ...block.right, color: c } })}
          />
          <Field label="Tachado">
            <Select
              value={block.right.strikethrough ? "yes" : "no"}
              onValueChange={(v) => onChange({ right: { ...block.right, strikethrough: v === "yes" } })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Sí</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </div>
  );
}

function DividerProps({ block, onChange }: Props<Extract<Block, { type: "divider" }>>) {
  return (
    <ColorField label="Color" value={block.color ?? ""} onChange={(color) => onChange({ color })} />
  );
}

function SpacerProps({ block, onChange }: Props<Extract<Block, { type: "spacer" }>>) {
  return (
    <div className="space-y-3">
      <Field label="Altura (px)">
        <Input
          type="number"
          value={block.height}
          onChange={(e) => onChange({ height: Number(e.target.value) || 0 })}
        />
      </Field>
      <div className="flex gap-1">
        {[8, 16, 24, 32, 48].map((h) => (
          <Button key={h} size="sm" variant="outline" onClick={() => onChange({ height: h })}>
            {h}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ── Tiny field primitives ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function AlignField({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (v: "left" | "center" | "right") => void;
}) {
  return (
    <Field label="Alineación">
      <Select value={value} onValueChange={(v) => onChange(v as "left" | "center" | "right")}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Izquierda</SelectItem>
          <SelectItem value="center">Centro</SelectItem>
          <SelectItem value="right">Derecha</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded border bg-background cursor-pointer shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs h-9 px-1.5"
          placeholder="auto"
        />
      </div>
    </Field>
  );
}
