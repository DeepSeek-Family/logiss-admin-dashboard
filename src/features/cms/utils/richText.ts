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

export function stripUnsafeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, iframe, object, embed, form").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (attr.name.toLowerCase().startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}
