interface NotificationFilterProps {
  categories: string[];
  activeFilter: string;
  setActiveFilter: (val: string) => void;
  items: any[];
}

export const NotificationFilter = ({
  categories,
  activeFilter,
  setActiveFilter,
  items
}: NotificationFilterProps) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map(cat => {
        const count = cat === 'All' ? items.filter(n => !n.read).length : items.filter(n => n.category === cat && !n.read).length;
        return (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeFilter === cat ? 'bg-primary text-white' : 'text-ink-4 hover:text-ink hover:bg-bg'
            }`}
          >
            {cat}
            {count > 0 && (
              <span className={`text-xs font-semibold px-1.5 rounded-full leading-none ${activeFilter === cat ? 'bg-white/20 text-white' : 'bg-line-2 text-ink-3'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
