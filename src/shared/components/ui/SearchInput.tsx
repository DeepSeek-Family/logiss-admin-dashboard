import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  debounceMs?: number;
  defaultValue?: string;
  value?: string;
  onChange?: (debouncedValue: string) => void;
  onSearchChange?: (debouncedValue: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  paramName = 'searchTerm',
  className = '',
  debounceMs = 500,
  defaultValue,
  value: controlledValue,
  onChange,
  onSearchChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlValue = searchParams.get(paramName) || searchParams.get('search') || '';
  
  const [text, setText] = useState<string>(
    controlledValue !== undefined ? controlledValue : (defaultValue !== undefined ? defaultValue : urlValue)
  );

  // Sync internal text if URL parameter changes externally
  useEffect(() => {
    const currentUrlValue = searchParams.get(paramName) || searchParams.get('search') || '';
    if (controlledValue !== undefined) {
      setText(controlledValue);
    } else if (currentUrlValue !== text) {
      setText(currentUrlValue);
    }
  }, [searchParams, paramName, controlledValue]);

  // Debounced effect for URL and callback triggers
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = text.trim();
      const currentParam = searchParams.get(paramName) || '';

      if (trimmed !== currentParam) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (paramName !== 'search') next.delete('search');
            if (paramName !== 'searchTerm') next.delete('searchTerm');

            if (trimmed) {
              next.set(paramName, trimmed);
            } else {
              next.delete(paramName);
            }
            return next;
          },
          { replace: true }
        );
      }

      if (onSearchChange) {
        onSearchChange(trimmed);
      }
      if (onChange) {
        onChange(trimmed);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs, paramName, setSearchParams, onSearchChange, onChange]);

  const handleClear = () => {
    setText('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(paramName);
        next.delete('search');
        next.delete('searchTerm');
        return next;
      },
      { replace: true }
    );
    if (onSearchChange) {
      onSearchChange('');
    }
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors pointer-events-none"
        size={16}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl text-xs font-medium text-ink shadow-sm ring-1 ring-ink/5 outline-none transition-all placeholder:text-ink-4/60"
      />
      {text && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink p-1 rounded-full hover:bg-bg transition-all"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
