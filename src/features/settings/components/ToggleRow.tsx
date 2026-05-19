interface ToggleRowProps {
  label: string;
  desc: string;
  on: boolean;
  onChange: (val: boolean) => void;
}

export const ToggleRow = ({ label, desc, on, onChange }: ToggleRowProps) => (
  <div className="flex items-center justify-between py-3.5 border-b border-line-2 last:border-0">
    <div className="pr-6 min-w-0">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="text-xs text-ink-4 mt-0.5">{desc}</p>
    </div>
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${on ? 'bg-primary' : 'bg-line'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);
