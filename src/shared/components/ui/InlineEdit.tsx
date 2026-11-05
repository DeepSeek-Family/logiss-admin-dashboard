import { useEffect, useState } from "react";

export const INLINE_EDIT_INPUT_CLASS =
  "bg-transparent border border-transparent hover:bg-bg/70 focus:bg-white focus:ring-2 focus:ring-primary/15 rounded-lg px-1.5 py-1 text-xs font-medium text-ink outline-none transition-colors cursor-pointer";

const to24HourTime = (value?: string): string => {
  if (!value) return "";
  const normalizedValue = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(normalizedValue)) return normalizedValue;
  const match = normalizedValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let hours = Number.parseInt(match[1], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
};

const to12HourTime = (value?: string): string => {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  let hours = Number.parseInt(match[1], 10);
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${match[2]} ${meridiem}`;
};

interface InlineTimeInputProps {
  value?: string;
  onCommit: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const InlineTimeInput = ({
  value,
  onCommit,
  className = "",
  ariaLabel,
}: InlineTimeInputProps) => (
  <input
    type="time"
    value={to24HourTime(value)}
    aria-label={ariaLabel}
    onClick={(event) => event.stopPropagation()}
    onChange={(event) => onCommit(event.target.value ? to12HourTime(event.target.value) : "")}
    className={`${INLINE_EDIT_INPUT_CLASS} w-[118px] ${className}`}
  />
);

interface InlineTextInputProps {
  value?: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export const InlineTextInput = ({
  value,
  onCommit,
  placeholder,
  className = "",
  ariaLabel,
}: InlineTextInputProps) => {
  const [draftValue, setDraftValue] = useState(value ?? "");

  useEffect(() => setDraftValue(value ?? ""), [value]);

  return (
    <input
      type="text"
      value={draftValue}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={() => {
        if (draftValue !== (value ?? "")) onCommit(draftValue);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraftValue(value ?? "");
          event.currentTarget.blur();
        }
      }}
      className={`${INLINE_EDIT_INPUT_CLASS} placeholder:text-ink-4/60 ${className}`}
    />
  );
};
