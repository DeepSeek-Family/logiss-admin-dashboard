import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Search, X, Check, Loader2, User, Car } from 'lucide-react';
import { Avatar } from './Avatar';

export type EntitySearchSelectItem = {
  id: string;
  title: string;
  subtitle?: string;
  initials?: string;
  imageUrl?: string;
  online?: boolean;
};

export interface EntitySearchSelectProps {
  label?: string;
  required?: boolean;
  items: EntitySearchSelectItem[];
  valueId: string | null;
  onChange: (id: string | null, item: EntitySearchSelectItem | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  triggerIcon?: LucideIcon;
  entityKind?: 'person' | 'vehicle';
  loading?: boolean;
  disabled?: boolean;
  selectedBadge?: string;
  emptySearchText?: string;
  emptyListText?: string;
  /** Controlled search (e.g. booking form API debounce). */
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  className?: string;
}

export const EntitySearchSelect: React.FC<EntitySearchSelectProps> = ({
  label,
  required,
  items,
  valueId,
  onChange,
  placeholder = 'Select from list…',
  searchPlaceholder = 'Search…',
  triggerIcon: TriggerIcon = User,
  entityKind = 'person',
  loading,
  disabled,
  selectedBadge = 'Selected',
  emptySearchText,
  emptyListText = 'No items available',
  searchValue: controlledSearch,
  onSearchValueChange,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const search = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setSearch = (v: string) => {
    if (onSearchValueChange) onSearchValueChange(v);
    else setInternalSearch(v);
  };

  const selected = useMemo(
    () => items.find((i) => i.id === valueId) ?? null,
    [items, valueId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.subtitle || '').toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q),
    );
  }, [items, search]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  const ListLeading = ({ item }: { item: EntitySearchSelectItem }) => {
    if (item.imageUrl || item.initials) {
      return (
        <Avatar
          initials={item.initials || '?'}
          size="sm"
          src={item.imageUrl}
          online={item.online}
        />
      );
    }
    const Icon = entityKind === 'vehicle' ? Car : User;
    return (
      <div className="w-8 h-8 rounded-full bg-bg border border-line-2 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-ink-3" />
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || selected) && (
        <div className="flex items-center justify-between">
          {label ? (
            <p className="text-xs font-semibold text-ink-3">
              {label} {required ? <span className="text-urgent">*</span> : null}
            </p>
          ) : (
            <span />
          )}
          {selected && !disabled && (
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="text-xs text-urgent hover:underline font-medium"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      <div className="relative" ref={rootRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
            if (!open) setSearch('');
          }}
          className={`w-full p-3 border rounded-xl flex items-center justify-between gap-3 text-left transition-all disabled:opacity-60 ${
            open
              ? 'border-primary ring-2 ring-primary/20 bg-white shadow-sm'
              : selected
                ? 'border-primary/40 bg-primary/5 hover:border-primary'
                : 'border-line-2 bg-bg/50 hover:bg-white hover:border-line'
          }`}
        >
          {selected ? (
            <div className="flex items-center gap-3 min-w-0">
              <ListLeading item={selected} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-ink truncate">{selected.title}</p>
                  {selectedBadge ? (
                    <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium shrink-0">
                      {selectedBadge}
                    </span>
                  ) : null}
                </div>
                {selected.subtitle ? (
                  <p className="text-[11px] text-ink-4 truncate">{selected.subtitle}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-ink-4">
              <TriggerIcon size={15} className="text-ink-3" />
              <span className="text-xs">{placeholder}</span>
            </div>
          )}

          <ChevronDown
            size={16}
            className={`text-ink-4 transition-transform duration-200 shrink-0 ${open ? 'rotate-180 text-primary' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-line-2 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-2.5 border-b border-line-2 bg-bg/20">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-line-2 rounded-lg text-ink placeholder:text-ink-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4" />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-1 space-y-1 custom-scrollbar">
              {loading ? (
                <div className="py-6 text-center text-xs text-ink-4 flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin text-primary" />
                  Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-4">
                  {search.trim()
                    ? emptySearchText || `No results for "${search.trim()}"`
                    : emptyListText}
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = valueId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange(item.id, item);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`w-full p-2.5 rounded-lg flex items-center justify-between gap-3 text-left transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-bg text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ListLeading item={item} />
                        <div className="min-w-0">
                          <p
                            className={`text-xs truncate ${isSelected ? 'font-semibold text-primary' : 'font-medium text-ink'}`}
                          >
                            {item.title}
                          </p>
                          {item.subtitle ? (
                            <p className="text-[11px] text-ink-4 truncate">{item.subtitle}</p>
                          ) : null}
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check size={10} className="text-white" />
                        </div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
