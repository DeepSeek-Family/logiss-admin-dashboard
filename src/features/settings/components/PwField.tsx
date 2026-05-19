import { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

interface PwFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PwField = ({ label, placeholder, value, onChange }: PwFieldProps) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <p className="text-xs font-semibold text-ink-4 mb-1.5">{label}</p>
      <div className="relative">
        <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full h-11 rounded-xl border border-line-2 text-sm font-medium text-ink bg-bg pl-10 pr-11 focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
        />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};
