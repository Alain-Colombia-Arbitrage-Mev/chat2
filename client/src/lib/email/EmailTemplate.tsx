import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { type Block, type EmailDoc, interpolate } from "./blocks";

export type { EmailDoc, Block } from "./blocks";

export function EmailTemplate({ doc }: { doc: EmailDoc }) {
  const { brand, blocks } = doc;
  const previewSource = firstText(blocks) || brand.companyName;

  return (
    <Html>
      <Head />
      <Preview>{interpolate(previewSource)}</Preview>
      <Body style={{ ...styles.body, backgroundColor: brand.bodyBg }}>
        <Container style={{ ...styles.container, backgroundColor: brand.containerBg }}>
          {blocks.map((b) => (
            <BlockView key={b.id} block={b} brand={brand.accentColor} success={brand.successColor} primary={brand.primaryColor} />
          ))}
        </Container>
      </Body>
    </Html>
  );
}

function BlockView({
  block,
  brand,
  success,
  primary,
}: {
  block: Block;
  brand: string;
  success: string;
  primary: string;
}) {
  const dataAttr = { "data-block-id": block.id } as Record<string, string>;
  switch (block.type) {
    case "heading": {
      const fontSize = block.level === 1 ? 28 : block.level === 2 ? 22 : 18;
      return (
        <Section style={styles.section} {...dataAttr}>
          <Heading
            as={`h${block.level}` as "h1" | "h2" | "h3"}
            data-edit-path={`${block.id}:text`}
            style={{
              margin: 0,
              fontSize,
              fontWeight: 700,
              color: block.color ?? primary,
              textAlign: block.align,
              lineHeight: 1.25,
            }}
          >
            {interpolate(block.text)}
          </Heading>
        </Section>
      );
    }

    case "text":
      return (
        <Section style={styles.section} {...dataAttr}>
          <Text
            data-edit-path={`${block.id}:text`}
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.55,
              color: block.color ?? "#1F2937",
              textAlign: block.align,
            }}
          >
            {interpolate(block.text)}
          </Text>
        </Section>
      );

    case "image":
      return (
        <Section style={{ ...styles.section, textAlign: block.align }} {...dataAttr}>
          <Img
            src={block.src}
            alt={block.alt}
            width={block.width}
            style={{
              maxWidth: "100%",
              height: "auto",
              display: block.align === "center" ? "inline-block" : "block",
              marginLeft: block.align === "right" ? "auto" : undefined,
              marginRight: block.align === "left" ? "auto" : undefined,
            }}
          />
        </Section>
      );

    case "button":
      return (
        <Section style={{ ...styles.section, textAlign: block.align }} {...dataAttr}>
          <Button
            href={block.href || "#"}
            data-edit-path={`${block.id}:label`}
            style={{
              backgroundColor: block.backgroundColor ?? brand,
              color: block.color ?? "#0F1B2D",
              fontWeight: 700,
              fontSize: 15,
              padding: "14px 28px",
              borderRadius: 8,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {interpolate(block.label)}
          </Button>
        </Section>
      );

    case "divider":
      return (
        <Section style={styles.section} {...dataAttr}>
          <Hr style={{ borderColor: block.color ?? "#E2E8F0", margin: 0 }} />
        </Section>
      );

    case "spacer":
      return (
        <Section style={{ padding: 0 }} {...dataAttr}>
          <div style={{ height: block.height, lineHeight: `${block.height}px`, fontSize: 1 }}>
            &nbsp;
          </div>
        </Section>
      );

    case "hero":
      return (
        <Section
          style={{
            margin: "16px 32px",
            padding: "28px 24px",
            textAlign: "center",
            borderRadius: 10,
            border: `2px solid ${block.accentColor ?? brand}`,
            backgroundColor: "#FFF8EC",
          }}
          {...dataAttr}
        >
          <Text
            data-edit-path={`${block.id}:label`}
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {interpolate(block.label)}
          </Text>
          <Text
            data-edit-path={`${block.id}:bigText`}
            style={{
              margin: "6px 0",
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1,
              color: block.accentColor ?? brand,
            }}
          >
            {interpolate(block.bigText)}
          </Text>
          <Text
            data-edit-path={`${block.id}:caption`}
            style={{ margin: 0, fontSize: 14, color: "#334155" }}
          >
            {interpolate(block.caption)}
          </Text>
        </Section>
      );

    case "columns":
      return (
        <Section style={styles.section} {...dataAttr}>
          <Row>
            <Column style={styles.colCell}>
              <Text
                data-edit-path={`${block.id}:left.label`}
                style={styles.colLabel}
              >
                {block.left.label}
              </Text>
              <Text
                data-edit-path={`${block.id}:left.value`}
                style={{
                  margin: "4px 0 0 0",
                  fontSize: 20,
                  fontWeight: 700,
                  color: block.left.color ?? "#94A3B8",
                  textDecoration: block.left.strikethrough ? "line-through" : "none",
                }}
              >
                {interpolate(block.left.value)}
              </Text>
            </Column>
            <Column style={{ width: 12 }} />
            <Column style={styles.colCell}>
              <Text
                data-edit-path={`${block.id}:right.label`}
                style={styles.colLabel}
              >
                {block.right.label}
              </Text>
              <Text
                data-edit-path={`${block.id}:right.value`}
                style={{
                  margin: "4px 0 0 0",
                  fontSize: 22,
                  fontWeight: 800,
                  color: block.right.color ?? success,
                  textDecoration: block.right.strikethrough ? "line-through" : "none",
                }}
              >
                {interpolate(block.right.value)}
              </Text>
            </Column>
          </Row>
        </Section>
      );
  }
}

function firstText(blocks: Block[]): string {
  for (const b of blocks) {
    if (b.type === "heading" || b.type === "text") return b.text;
  }
  return "";
}

const styles = {
  body: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    padding: "24px 0",
  },
  container: {
    borderRadius: 12,
    margin: "0 auto",
    maxWidth: 600,
    overflow: "hidden" as const,
  },
  section: { padding: "12px 32px" },
  colCell: {
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    verticalAlign: "top" as const,
  },
  colLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    color: "#64748B",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
} as const;
