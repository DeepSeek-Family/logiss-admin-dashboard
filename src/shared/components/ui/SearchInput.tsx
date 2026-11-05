import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";

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
  placeholder = "Search...",
  paramName = "searchTerm",
  className = "",
  debounceMs = 500,
  defaultValue,
  value: controlledValue,
  onChange,
  onSearchChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlValue = searchParams.get(paramName) || searchParams.get("search") || "";

  const [text, setText] = useState<string>(
    controlledValue !== undefined
      ? controlledValue
      : defaultValue !== undefined
        ? defaultValue
        : urlValue,
  );

  // Callbacks are read via ref and only fired when the value changes, so parents passing
  // inline handlers (e.g. ones that reset pagination) aren't re-triggered on every render.
  const callbacksRef = useRef({ onSearchChange, onChange });
  callbacksRef.current = { onSearchChange, onChange };
  const lastEmittedRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const emit = (value: string) => {
    if (lastEmittedRef.current === value) return;
    lastEmittedRef.current = value;
    callbacksRef.current.onSearchChange?.(value);
    callbacksRef.current.onChange?.(value);
  };

  // Sync internal text if URL or parent value changes externally (not while the user is typing).
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;

    const currentUrlValue = searchParams.get(paramName) || searchParams.get("search") || "";
    if (controlledValue !== undefined) {
      setText(controlledValue);
    } else if (currentUrlValue !== text) {
      setText(currentUrlValue);
    }
  }, [searchParams, paramName, controlledValue, text]);

  // Debounced effect for URL and callback triggers (do not depend on `searchParams` — avoids re-fire on every URL replace).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mountedRef.current) return;

      const trimmed = text.trim();

      setSearchParams(
        (prev) => {
          const currentParam = prev.get(paramName) || prev.get("search") || "";
          if (trimmed === currentParam) return prev;

          const next = new URLSearchParams(prev);
          if (paramName !== "search") next.delete("search");
          if (paramName !== "searchTerm") next.delete("searchTerm");

          if (trimmed) {
            next.set(paramName, trimmed);
          } else {
            next.delete(paramName);
          }
          return next;
        },
        { replace: true },
      );

      if (mountedRef.current) {
        emit(trimmed);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs, paramName, setSearchParams]);

  const handleClear = () => {
    setText("");
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(paramName);
        next.delete("search");
        next.delete("searchTerm");
        return next;
      },
      { replace: true },
    );
    emit("");
  };

  return (
    <div className={`relative group ${className}`}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors pointer-events-none"
        size={16}
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-10 pl-10 pr-9 bg-white border border-line rounded-lg text-sm font-medium text-ink outline-none transition-colors duration-150 placeholder:text-ink-4/70 hover:border-line focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {text && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink p-1 rounded-md hover:bg-bg transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
