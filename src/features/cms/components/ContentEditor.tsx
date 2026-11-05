import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Minus,
  Undo,
  Redo,
  CheckCircle2,
  Loader2,
  Eye,
  Edit3,
} from "lucide-react";
import { useGetRuleByTypeQuery, RuleType } from "@/redux/api/rulesApi";
import {
  dedupeRepeatedEditorHtml,
  escapeHtml,
  htmlToPlainText,
  prepareRuleContentForEditor,
  stripUnsafeHtml,
} from "@/features/cms/utils/richText";

interface ContentEditorProps {
  activePage: string;
  content: { [key: string]: string };
  setContent: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const EDITOR_BODY_CLASS =
  "w-full h-[460px] p-6 bg-white text-ink text-sm font-sans leading-relaxed outline-none overflow-y-auto " +
  "[&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic [&_s]:line-through [&_strike]:line-through " +
  "[&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-bg [&_code]:text-primary [&_code]:text-xs [&_code]:font-mono " +
  "[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-ink-3 [&_blockquote]:italic " +
  "[&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_hr]:my-4 [&_hr]:border-line-2";

export const ContentEditor: React.FC<ContentEditorProps> = ({
  activePage,
  content,
  setContent,
}) => {
  const isRulePage = ["terms", "privacy", "about"].includes(activePage);

  const {
    data: ruleResponse,
    isLoading,
    isUninitialized,
  } = useGetRuleByTypeQuery(activePage as RuleType, { skip: !isRulePage });

  const ruleBootLoading = isUninitialized || (isLoading && !ruleResponse);
  const lastServerContentRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!isRulePage || ruleResponse?.data?.content === undefined) return;

    const raw = ruleResponse.data.content;
    if (lastServerContentRef.current[activePage] === raw) return;
    lastServerContentRef.current[activePage] = raw;

    const html = prepareRuleContentForEditor(raw);
    setContent((prev) => {
      if (prev[activePage] === html) return prev;
      return { ...prev, [activePage]: html };
    });
  }, [ruleResponse?.data?.content, activePage, isRulePage, setContent]);

  const value = content[activePage] || "";
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSyncedHtml = useRef(value);
  const isProgrammaticDomSync = useRef(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setHistory([value]);
    setHistoryIndex(0);
    lastSyncedHtml.current = value;
  }, [activePage]);

  const plainText = htmlToPlainText(value);
  const charCount = plainText.length;
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const syncEditorDom = useCallback((html: string) => {
    const el = editorRef.current;
    if (!el) return;
    const normalized = dedupeRepeatedEditorHtml(html);
    if (el.innerHTML !== normalized) {
      isProgrammaticDomSync.current = true;
      el.innerHTML = normalized || "";
      queueMicrotask(() => {
        isProgrammaticDomSync.current = false;
      });
    }
    lastSyncedHtml.current = normalized;
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value === lastSyncedHtml.current) return;
    if (document.activeElement === el) return;
    syncEditorDom(value);
  }, [value, syncEditorDom]);

  useLayoutEffect(() => {
    if (viewMode !== "edit" || ruleBootLoading) return;
    syncEditorDom(value);
  }, [viewMode, ruleBootLoading, value, syncEditorDom]);

  const updateContent = (newValue: string) => {
    const safe = dedupeRepeatedEditorHtml(stripUnsafeHtml(newValue));
    setContent((prev) => ({ ...prev, [activePage]: safe }));
    setHistory((prevHistory) => {
      const trimmed = prevHistory.slice(0, historyIndex + 1);
      trimmed.push(safe);
      setHistoryIndex(trimmed.length - 1);
      return trimmed;
    });
    lastSyncedHtml.current = safe;
  };

  const readEditorHtml = () => stripUnsafeHtml(editorRef.current?.innerHTML ?? "");

  const syncFromEditor = () => {
    if (isProgrammaticDomSync.current) return;
    const html = readEditorHtml();
    if (html === lastSyncedHtml.current) return;
    updateContent(html);
  };

  const flushEditorToState = () => {
    const html = readEditorHtml();
    if (html !== lastSyncedHtml.current) {
      updateContent(html);
    }
  };

  const openPreview = () => {
    flushEditorToState();
    setViewMode("preview");
  };

  const preventToolbarBlur = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command: string, commandValue?: string) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    syncFromEditor();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousValue = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setContent((prev) => ({ ...prev, [activePage]: previousValue }));
      syncEditorDom(previousValue);
      return;
    }
    focusEditor();
    document.execCommand("undo");
    syncFromEditor();
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setContent((prev) => ({ ...prev, [activePage]: next }));
      syncEditorDom(next);
      return;
    }
    focusEditor();
    document.execCommand("redo");
    syncFromEditor();
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      runCommand("bold");
    } else if (key === "i") {
      event.preventDefault();
      runCommand("italic");
    } else if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) handleRedo();
      else handleUndo();
    } else if (key === "y") {
      event.preventDefault();
      handleRedo();
    }
  };

  const insertLink = () => {
    focusEditor();
    const url = window.prompt("Link URL", "https://");
    if (!url?.trim()) return;
    runCommand("createLink", url.trim());
  };

  const insertCode = () => {
    focusEditor();
    const selection = window.getSelection();
    const text = selection?.toString() || "code";
    document.execCommand("insertHTML", false, `<code>${escapeHtml(text)}</code>`);
    syncFromEditor();
  };

  const editorSurface = (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      className={EDITOR_BODY_CLASS}
      data-placeholder="Write your document content here..."
      onInput={syncFromEditor}
      onBlur={syncFromEditor}
      onKeyDown={handleEditorKeyDown}
    />
  );

  const previewHtml = dedupeRepeatedEditorHtml(stripUnsafeHtml(value));

  const previewSurface = plainText ? (
    <div
      className={`${EDITOR_BODY_CLASS} bg-bg/20 cursor-default`}
      dangerouslySetInnerHTML={{ __html: previewHtml }}
    />
  ) : (
    <div
      className={`${EDITOR_BODY_CLASS} bg-bg/20 flex flex-col items-center justify-center text-ink-4`}
    >
      <Eye size={32} className="mb-2 opacity-30" />
      <p className="text-xs">No content to preview yet. Switch to Edit mode to start typing.</p>
    </div>
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-line-2 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        <div className="bg-bg/60 border-b border-line-2 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-line-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-white disabled:opacity-30 transition-colors"
              >
                <Undo size={14} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-white disabled:opacity-30 transition-colors"
              >
                <Redo size={14} />
              </button>
            </div>

            <div className="flex items-center gap-0.5 px-1.5 border-r border-line-2">
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => runCommand("bold")}
                title="Bold (Ctrl+B)"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => runCommand("italic")}
                title="Italic (Ctrl+I)"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => runCommand("strikeThrough")}
                title="Strikethrough"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Strikethrough size={14} />
              </button>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={insertCode}
                title="Inline Code"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Code size={14} />
              </button>
            </div>

            <div className="flex items-center gap-0.5 px-1.5 border-r border-line-2">
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => runCommand("insertUnorderedList")}
                title="Bullet List"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => runCommand("insertOrderedList")}
                title="Numbered List"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <ListOrdered size={14} />
              </button>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => runCommand("formatBlock", "blockquote")}
                title="Quote Block"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Quote size={14} />
              </button>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={insertLink}
                title="Insert Hyperlink"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Link size={14} />
              </button>
              <button
                type="button"
                onMouseDown={preventToolbarBlur}
                onClick={() => runCommand("insertHorizontalRule")}
                title="Horizontal Divider"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Minus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-line-2">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "edit"
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              <Edit3 size={12} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={openPreview}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "preview"
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
          </div>
        </div>

        <div className="relative">
          {ruleBootLoading ? (
            <div className="flex flex-col items-center justify-center h-[460px] text-ink-3 gap-3 bg-bg/10">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-sm font-medium">Loading {activePage} content...</p>
            </div>
          ) : (
            <>
              <div
                className={viewMode === "edit" ? "block" : "hidden"}
                aria-hidden={viewMode !== "edit"}
              >
                {editorSurface}
              </div>
              <div
                className={viewMode === "preview" ? "block" : "hidden"}
                aria-hidden={viewMode !== "preview"}
              >
                {previewSurface}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-xs text-ink-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-accent" /> Live Sync Active
          </span>
          <span className="text-ink-4">·</span>
          <span>~{readingTime} min read</span>
        </div>

        <div className="flex items-center gap-3 font-medium">
          <span>{wordCount} words</span>
          <span className="text-ink-4">·</span>
          <span>{charCount} characters</span>
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--ink-4, #94a3b8);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
