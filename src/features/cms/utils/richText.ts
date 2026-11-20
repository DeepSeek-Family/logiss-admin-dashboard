import DOMPurify from "dompurify";

const HTML_TAG = /<(?:p|div|br|strong|b|em|i|ul|ol|li|blockquote|a|span|code|s|strike|u|h[1-6])\b/i;

export function isProbablyHtml(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (HTML_TAG.test(trimmed)) return true;
  return /<[a-z][^>]*>/i.test(trimmed);
}

/** Some API payloads repeat the same block twice — collapse identical halves. */
export function dedupeRepeatedEditorHtml(html: string): string {
  const safe = stripUnsafeHtml(html.trim());
  if (!safe) return "";

  const doc = new DOMParser().parseFromString(safe, "text/html");
  const children = [...doc.body.childNodes].filter(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())),
  );

  if (children.length >= 2 && children.length % 2 === 0) {
    const mid = children.length / 2;
    const serialize = (nodes: ChildNode[]) =>
      nodes
        .map((node) => (node instanceof Element ? node.outerHTML : (node.textContent ?? "")))
        .join("");

    const first = serialize(children.slice(0, mid));
    const second = serialize(children.slice(mid));
    if (first && first === second) {
      return first;
    }
  }

  return safe;
}

export function prepareRuleContentForEditor(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const html = isProbablyHtml(trimmed) ? stripUnsafeHtml(trimmed) : toEditorHtml(trimmed);
  return dedupeRepeatedEditorHtml(html);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdownToHtml(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return html;
}

/** Legacy plain / markdown → HTML for the WYSIWYG editor (headings flattened to normal text). */
export function toEditorHtml(raw: string): string {
  if (!raw.trim()) return "";
  if (isProbablyHtml(raw)) return raw;

  const lines = raw.split("\n");
  const parts: string[] = [];
  let listType: "ul" | "ol" | null = null;
  const listItems: string[] = [];

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    parts.push(
      `<${listType}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${listType}>`,
    );
    listItems.length = 0;
    listType = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("---")) {
      flushList();
      parts.push("<hr />");
      continue;
    }

    const withoutHeading = trimmed.replace(/^#{1,6}\s+/, "");
    const bulletMatch = withoutHeading.match(/^[-*]\s+(.+)/);
    const orderedMatch = withoutHeading.match(/^\d+\.\s+(.+)/);
    const quoteMatch = withoutHeading.match(/^>\s+(.+)/);

    if (bulletMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(inlineMarkdownToHtml(bulletMatch[1]));
      continue;
    }

    if (orderedMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(inlineMarkdownToHtml(orderedMatch[1]));
      continue;
    }

    flushList();

    if (quoteMatch) {
      parts.push(`<blockquote>${inlineMarkdownToHtml(quoteMatch[1])}</blockquote>`);
    } else {
      parts.push(`<p>${inlineMarkdownToHtml(withoutHeading)}</p>`);
    }
  }

  flushList();
  return parts.join("");
}

export function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\u00a0/g, " ").trim();
}

// Formatting the CMS editor produces; everything else (script, iframe, svg,
// form, meta, style, event handlers, javascript:/data: links…) is removed.
const ALLOWED_TAGS = [
  "p", "br", "hr", "div", "span", "b", "strong", "i", "em", "u", "s", "strike",
  "del", "ins", "sub", "sup", "small", "mark", "blockquote", "code", "pre",
  "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
];
const ALLOWED_ATTR = ["href", "title", "target", "rel", "class"];

let hooksAdded = false;
const addLinkHook = () => {
  if (hooksAdded) return;
  hooksAdded = true;
  // Links opening a new tab can't reach back into this page
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
};

/** Removes malicious/injected HTML (XSS) and keeps safe formatting. */
export function stripUnsafeHtml(html: string): string {
  addLinkHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/(?!\/)|#)/i,
    ALLOW_DATA_ATTR: false,
  });
}
