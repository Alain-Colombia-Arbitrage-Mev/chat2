// Block schema for the visual email composer.
// Each block has a stable `id` + `type` + payload. The whole document is a flat
// list of blocks plus brand-level config — there are no fixed sections.

export type Align = "left" | "center" | "right";

export type HeadingBlock = {
  id: string;
  type: "heading";
  text: string;
  level: 1 | 2 | 3;
  align: Align;
  color?: string;
};

export type TextBlock = {
  id: string;
  type: "text";
  text: string;
  align: Align;
  color?: string;
};

export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  width: number;
  align: Align;
};

export type ButtonBlock = {
  id: string;
  type: "button";
  label: string;
  href: string;
  align: Align;
  backgroundColor?: string;
  color?: string;
};

export type DividerBlock = { id: string; type: "divider"; color?: string };

export type SpacerBlock = { id: string; type: "spacer"; height: number };

export type HeroBlock = {
  id: string;
  type: "hero";
  label: string;
  bigText: string;
  caption: string;
  accentColor?: string;
};

export type ColumnsBlock = {
  id: string;
  type: "columns";
  left: { label: string; value: string; color?: string; strikethrough?: boolean };
  right: { label: string; value: string; color?: string; strikethrough?: boolean };
};

export type Block =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | HeroBlock
  | ColumnsBlock;

export type BlockType = Block["type"];

export type Brand = {
  companyName: string;
  primaryColor: string;
  accentColor: string;
  successColor: string;
  bodyBg: string;
  containerBg: string;
};

export type EmailDoc = {
  schema: "blocks-v1";
  brand: Brand;
  blocks: Block[];
};

// ── Factories ────────────────────────────────────────────────────────────────

let idCounter = 0;
function makeId(type: BlockType): string {
  idCounter += 1;
  return `${type}-${Date.now().toString(36)}-${idCounter}`;
}

export function makeBlock(type: BlockType): Block {
  switch (type) {
    case "heading":
      return { id: makeId(type), type, text: "Nuevo título", level: 2, align: "left" };
    case "text":
      return {
        id: makeId(type),
        type,
        text: "Escribe aquí tu texto. Puedes usar variables como {{client_name}}.",
        align: "left",
      };
    case "image":
      return {
        id: makeId(type),
        type,
        src: "https://placehold.co/600x200/0F1B2D/F8B03B?text=Imagen",
        alt: "",
        width: 600,
        align: "center",
      };
    case "button":
      return {
        id: makeId(type),
        type,
        label: "Ver propuesta",
        href: "https://",
        align: "center",
        backgroundColor: "#F8B03B",
        color: "#0F1B2D",
      };
    case "divider":
      return { id: makeId(type), type };
    case "spacer":
      return { id: makeId(type), type, height: 24 };
    case "hero":
      return {
        id: makeId(type),
        type,
        label: "TU AHORRO",
        bigText: "{{discount_percent}}%",
        caption: "menos en tu factura mensual",
      };
    case "columns":
      return {
        id: makeId(type),
        type,
        left: { label: "Antes", value: "{{current_price}}", strikethrough: true },
        right: { label: "Después", value: "{{new_price}}", color: "#16A34A" },
      };
  }
}

// Token list shared with the variables panel.
export const TOKENS = [
  { key: "client_name", help: "Nombre del cliente" },
  { key: "company_name", help: "Nombre empresa" },
  { key: "discount_percent", help: "Descuento aplicado (sin %)" },
  { key: "discount_amount", help: "Ahorro mensual con moneda" },
  { key: "new_price", help: "Factura nueva con moneda" },
  { key: "current_price", help: "Factura actual con moneda" },
  { key: "consumption_kwh", help: "Consumo kWh/mes" },
  { key: "customer_type", help: "doméstico / pyme / industrial" },
  { key: "city", help: "Ciudad del cliente" },
  { key: "rule_id", help: "Regla aplicada" },
  { key: "quote_id", help: "Referencia interna" },
];

export const SAMPLE: Record<string, string> = {
  client_name: "María García",
  company_name: "Ancestro Energía",
  discount_percent: "23",
  discount_amount: "21,40 €",
  new_price: "68,20 €",
  current_price: "89,60 €",
  consumption_kwh: "320",
  customer_type: "doméstico",
  city: "Madrid",
  rule_id: "RULE_HOGAR_A1",
  quote_id: "Q-2026-04821",
};

export function interpolate(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    k in SAMPLE ? SAMPLE[k] : `{{${k}}}`,
  );
}

// Default starter document — what a fresh email looks like.
export function defaultDoc(): EmailDoc {
  return {
    schema: "blocks-v1",
    brand: {
      companyName: "Ancestro Energía",
      primaryColor: "#0F1B2D",
      accentColor: "#F8B03B",
      successColor: "#16A34A",
      bodyBg: "#F1F5F9",
      containerBg: "#FFFFFF",
    },
    blocks: [
      {
        id: makeId("heading"),
        type: "heading",
        text: "Tu nueva tarifa de luz",
        level: 1,
        align: "left",
      },
      {
        id: makeId("text"),
        type: "text",
        text: "Hola {{client_name}}, hemos calculado tu mejor oferta basada en tu consumo medio.",
        align: "left",
      },
      {
        id: makeId("hero"),
        type: "hero",
        label: "TU AHORRO",
        bigText: "{{discount_percent}}%",
        caption: "menos en tu factura mensual",
      },
      {
        id: makeId("columns"),
        type: "columns",
        left: { label: "Antes", value: "{{current_price}}", strikethrough: true },
        right: { label: "Después", value: "{{new_price}}", color: "#16A34A" },
      },
      {
        id: makeId("button"),
        type: "button",
        label: "Ver propuesta",
        href: "https://example.com/quote/{{quote_id}}",
        align: "center",
      },
      { id: makeId("divider"), type: "divider" },
      {
        id: makeId("text"),
        type: "text",
        text: "Ref. {{quote_id}} · ¿Dudas? Escríbenos a soporte@ancestro.ai",
        align: "center",
        color: "#94A3B8",
      },
    ],
  };
}
