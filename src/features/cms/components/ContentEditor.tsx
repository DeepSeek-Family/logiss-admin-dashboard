import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Badge } from '@/shared/components/ui';

interface ContentEditorProps {
  activePage: string;
  content: { [key: string]: string };
  setContent: (val: { [key: string]: string }) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({ activePage, content, setContent }) => {
  const value = content[activePage] || '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Update content with history tracking
  const updateContent = (newValue: string) => {
    setContent({ ...content, [activePage]: newValue });
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setContent({ ...content, [activePage]: prev });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setContent({ ...content, [activePage]: next });
    }
  };

  // Insert formatting at cursor position
  const applyFormat = (prefix: string, suffix = '', defaultText = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    updateContent(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : defaultText.length)
      );
    }, 10);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    updateContent(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 10);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Editor Main Container */}
      <div className="bg-white rounded-2xl border border-line-2 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        {/* Rich Formatting Toolbar */}
        <div className="bg-bg/60 border-b border-line-2 px-3 py-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {/* History */}
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

            {/* Headings */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-line-2">
              <button
                type="button"
                onClick={() => insertLinePrefix('# ')}
                title="Heading 1"
                className="px-2 py-1 rounded-lg text-xs font-bold text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('## ')}
                title="Heading 2"
                className="px-2 py-1 rounded-lg text-xs font-bold text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('### ')}
                title="Heading 3"
                className="px-2 py-1 rounded-lg text-xs font-bold text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                H3
              </button>
            </div>

            {/* Text Styling */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-line-2">
              <button
                type="button"
                onClick={() => applyFormat('**', '**', 'bold text')}
                title="Bold (Ctrl+B)"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('*', '*', 'italic text')}
                title="Italic (Ctrl+I)"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('~~', '~~', 'strikethrough')}
                title="Strikethrough"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Strikethrough size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('`', '`', 'code')}
                title="Inline Code"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Code size={14} />
              </button>
            </div>

            {/* Lists & Quotes */}
            <div className="flex items-center gap-0.5 px-1.5 border-r border-line-2">
              <button
                type="button"
                onClick={() => insertLinePrefix('- ')}
                title="Bullet List"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('1. ')}
                title="Numbered List"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <ListOrdered size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('> ')}
                title="Quote Block"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Quote size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('[', '](https://example.com)', 'Link Title')}
                title="Insert Hyperlink"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Link size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertLinePrefix('\n---\n')}
                title="Horizontal Divider"
                className="p-1.5 rounded-lg text-ink-3 hover:text-primary hover:bg-white transition-colors"
              >
                <Minus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full h-[460px] p-6 bg-white text-ink text-sm font-sans leading-relaxed outline-none resize-none placeholder:text-ink-4 focus:ring-0 border-none"
            value={value}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="Write your document content here... Use the toolbar above or standard markdown formatting."
          />
        </div>
      </div>

      {/* Editor Footer / Meta bar */}
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
    </div>
  );
};
