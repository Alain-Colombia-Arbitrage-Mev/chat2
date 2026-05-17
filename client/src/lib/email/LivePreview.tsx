import { useEffect, useMemo, useRef, useState } from "react";
import { render } from "@react-email/render";
import { EmailTemplate } from "./EmailTemplate";
import type { EmailDoc } from "./blocks";

type EditMsg = { source: "__re_editor"; kind: "edit"; path: string; value: string };
type SelectMsg = { source: "__re_editor"; kind: "select"; blockId: string | null };

type Props = {
  doc: EmailDoc;
  onEdit: (blockId: string, field: string, value: string) => void;
  onSelect?: (blockId: string | null) => void;
  height?: number;
};

const EDITOR_SCRIPT = `
(function () {
  function clearSel() {
    document.querySelectorAll('.__re_selected').forEach(function (n) { n.classList.remove('__re_selected'); });
  }
  document.addEventListener('click', function (e) {
    var editable = e.target.closest('[data-edit-path]');
    var blockEl = e.target.closest('[data-block-id]');
    clearSel();
    if (blockEl) blockEl.classList.add('__re_selected');
    parent.postMessage({ source: '__re_editor', kind: 'select', blockId: blockEl ? blockEl.getAttribute('data-block-id') : null }, '*');
    if (!editable) return;
    e.preventDefault();
    if (editable.isContentEditable) return;
    editable.contentEditable = 'true';
    editable.spellcheck = false;
    editable.focus();
    var range = document.createRange();
    range.selectNodeContents(editable);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, true);
  document.addEventListener('keydown', function (e) {
    var el = e.target.closest && e.target.closest('[data-edit-path]');
    if (!el) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); el.blur(); }
  }, true);
  document.addEventListener('blur', function (e) {
    var el = e.target.closest && e.target.closest('[data-edit-path]');
    if (!el || !el.isContentEditable) return;
    el.contentEditable = 'false';
    var value = (el.innerText || '').replace(/\\u00a0/g, ' ').trim();
    parent.postMessage({
      source: '__re_editor',
      kind: 'edit',
      path: el.getAttribute('data-edit-path'),
      value: value,
    }, '*');
  }, true);
})();
`;

const EDITOR_STYLE = `
[data-block-id] { position: relative; outline: 1px dashed transparent; outline-offset: 4px; transition: outline-color 120ms; }
[data-block-id]:hover { outline-color: rgba(148, 163, 184, .6); }
[data-block-id].__re_selected { outline: 2px solid rgba(14, 165, 233, .9); outline-offset: 4px; }
[data-edit-path] {
  outline: 1px dashed transparent;
  outline-offset: 2px;
  border-radius: 3px;
  cursor: text;
  transition: outline-color 120ms ease, background-color 120ms ease;
}
[data-edit-path]:hover {
  outline-color: rgba(56, 189, 248, .55);
  background-color: rgba(56, 189, 248, .06);
}
[data-edit-path][contenteditable="true"] {
  outline: 1px solid rgba(14, 165, 233, .95);
  background-color: rgba(14, 165, 233, .08);
}
`;

export function LivePreview({ doc, onEdit, onSelect, height = 900 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string>("");

  const docKey = useMemo(() => JSON.stringify(doc), [doc]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await render(<EmailTemplate doc={doc} />, { pretty: false });
        if (cancelled) return;
        const injected = raw
          .replace("</head>", `<style>${EDITOR_STYLE}</style></head>`)
          .replace("</body>", `<script>${EDITOR_SCRIPT}</script></body>`);
        setHtml(injected);
      } catch (e) {
        if (cancelled) return;
        setHtml(
          `<html><body style="font-family:system-ui;padding:24px;color:#dc2626">Error: ${
            (e as Error).message
          }</body></html>`,
        );
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d = ev.data as EditMsg | SelectMsg | undefined;
      if (!d || d.source !== "__re_editor") return;
      if (d.kind === "edit" && typeof d.path === "string") {
        const [blockId, field] = d.path.split(":");
        if (blockId && field) onEdit(blockId, field, String(d.value ?? ""));
      } else if (d.kind === "select") {
        onSelect?.(d.blockId ?? null);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onEdit, onSelect]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      title="Email preview"
      className="w-full border-0 bg-[#F1F5F9] rounded-md"
      style={{ height }}
    />
  );
}

// Render the doc to a final HTML string for save / send (no editor scripts).
export async function renderDocToHtml(doc: EmailDoc): Promise<string> {
  return render(<EmailTemplate doc={doc} />, { pretty: false });
}
