import React, { useState, useRef, useEffect } from 'react';
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
  HelpCircle,
  Loader2,
  Eye,
  Edit3,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import { useGetRuleByTypeQuery, RuleType } from '@/redux/api/rulesApi';

interface ContentEditorProps {
  activePage: string;
  content: { [key: string]: string };
  setContent: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({ activePage, content, setContent }) => {
  const isRulePage = ['terms', 'privacy', 'about'].includes(activePage);

  const { data: ruleResponse, isLoading, isFetching } = useGetRuleByTypeQuery(
    activePage as RuleType,
    { skip: !isRulePage }
  );

  useEffect(() => {
    if (isRulePage && ruleResponse?.data?.content !== undefined) {
      setContent((prev) => ({
        ...prev,
        [activePage]: ruleResponse.data.content,
      }));
    }
  }, [ruleResponse, activePage, isRulePage, setContent]);

  const value = content[activePage] || '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
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

  // Render markdown preview
  const renderPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="prose prose-sm max-w-none text-ink space-y-3 leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-xl font-bold text-ink pb-1 border-b border-line-2 mt-4">{line.replace('# ', '')}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-lg font-bold text-ink mt-3">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-sm font-bold text-ink mt-2">{line.replace('### ', '')}</h3>;
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-sm text-ink-2">
                {line.replace(/^[-*]\s+/, '')}
              </li>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <li key={idx} className="ml-4 list-decimal text-sm text-ink-2 font-medium">
                {line.replace(/^\d+\.\s+/, '')}
              </li>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-primary pl-4 py-1.5 my-2 text-ink-3 italic bg-primary/5 rounded-r-lg">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (line.startsWith('---')) {
            return <hr key={idx} className="my-4 border-line-2" />;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx} className="text-sm text-ink-2">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Editor Main Container */}
      <div className="bg-white rounded-2xl border border-line-2 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        {/* Rich Formatting Toolbar */}
        <div className="bg-bg/60 border-b border-line-2 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
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

          {/* Right Mode Switchers */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-line-2">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'edit'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Edit3 size={12} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <span>Split View</span>
            </button>
          </div>
        </div>

        <div className="relative">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center h-[460px] text-ink-3 gap-3 bg-bg/10">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-sm font-medium">Loading {activePage} content...</p>
            </div>
          ) : (
            <>
              {viewMode === 'edit' && (
                <textarea
                  ref={textareaRef}
                  className="w-full h-[460px] p-6 bg-white text-ink text-sm font-sans leading-relaxed outline-none resize-none placeholder:text-ink-4 focus:ring-0 border-none"
                  value={value}
                  onChange={(e) => updateContent(e.target.value)}
                  placeholder="Write your document content here... Use the toolbar above or standard markdown formatting."
                />
              )}

              {viewMode === 'preview' && (
                <div className="w-full h-[460px] p-6 bg-bg/20 overflow-y-auto">
                  {value.trim() ? (
                    renderPreview(value)
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-ink-4">
                      <Eye size={32} className="mb-2 opacity-30" />
                      <p className="text-xs">No content to preview yet. Switch to Edit mode to start typing.</p>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'split' && (
                <div className="grid grid-cols-2 divide-x divide-line-2 h-[460px]">
                  <textarea
                    ref={textareaRef}
                    className="w-full h-full p-6 bg-white text-ink text-sm font-sans leading-relaxed outline-none resize-none placeholder:text-ink-4 border-none"
                    value={value}
                    onChange={(e) => updateContent(e.target.value)}
                    placeholder="Write your document content here..."
                  />
                  <div className="w-full h-full p-6 bg-bg/20 overflow-y-auto">
                    {renderPreview(value)}
                  </div>
                </div>
              )}
            </>
          )}
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
