interface ContentEditorProps {
  activePage: string;
  content: { [key: string]: string };
  setContent: (val: { [key: string]: string }) => void;
}

export const ContentEditor = ({ activePage, content, setContent }: ContentEditorProps) => {
  return (
    <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-medium text-primary uppercase tracking-[0.1em] z-10">
        Page Markdown Content
      </div>
      <textarea
        className="w-full h-[500px] p-6 bg-white border-2 border-line rounded-2xl text-ink font-mono text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none scrollbar-hide resize-none shadow-inner"
        value={content[activePage] || ''}
        onChange={(e) => setContent({ ...content, [activePage]: e.target.value })}
        placeholder="Start typing content here..."
      />
    </div>
  );
};
