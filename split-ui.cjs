const fs = require('fs');
const path = require('path');

const DIR = 'src/components/ui';

const components = {
  'Badge.jsx': `
import React from 'react';

export const Badge = ({ variant = 'neutral', dot = false, children, className = '' }) => {
  const variants = {
    neutral: 'bg-bg text-ink-3 border-line',
    primary: 'bg-primary-light text-primary border-primary/10',
    'primary-light': 'bg-primary-light/50 text-primary border-primary/10',
    accent: 'bg-accent-light text-accent border-accent/10',
    warning: 'bg-warning-light text-warning border-warning/10',
    urgent: 'bg-urgent-light text-urgent border-urgent/10',
    white: 'bg-white text-primary border-white',
    solid_accent: 'bg-accent text-white border-accent',
    solid_primary: 'bg-primary text-white border-primary',
    solid_warning: 'bg-warning text-white border-warning',
    solid_urgent: 'bg-urgent text-white border-urgent',
  };

  return (
    <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border \${variants[variant] || variants.neutral} \${className}\`}>
      {dot && <span className={\`w-1.5 h-1.5 rounded-full mr-1.5 \${variant.startsWith('solid') ? 'bg-white' : (variant === 'accent' || variant === 'solid_accent' ? 'bg-accent' : (variant === 'primary' ? 'bg-primary' : 'bg-current'))}\`}></span>}
      {children}
    </span>
  );
};
`,
  'TripStatusBadge.jsx': `
import React from 'react';
import { Badge } from './Badge';

export const TripStatusBadge = ({ status }) => {
  const config = {
    pending_review: { variant: 'warning', label: 'Pending Review' },
    assigned: { variant: 'primary', label: 'Assigned' },
    confirmed: { variant: 'primary', label: 'Confirmed' },
    dispatched: { variant: 'solid_primary', label: 'Dispatched', dot: true },
    en_route: { variant: 'solid_primary', label: 'En Route', dot: true },
    arrived: { variant: 'warning', label: 'Arrived' },
    in_trip: { variant: 'solid_accent', label: 'In Trip', dot: true },
    completed: { variant: 'accent', label: 'Completed' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
    no_show: { variant: 'urgent', label: 'No Show' },
  };

  const { variant, label, dot } = config[status] || { variant: 'neutral', label: status };
  return <Badge variant={variant} dot={dot}>{label}</Badge>;
};
`,
  'Avatar.jsx': `
import React from 'react';

const avatarMap = {
  'DW': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  'MG': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  'JC': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  'PL': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  'RK': 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&h=150&fit=crop',
  'DP': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
  'JT': 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop',
  'EM': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  'NA': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
  'LS': 'https://images.unsplash.com/photo-1531123897727-8f129e1bfa82?w=150&h=150&fit=crop',
  'MT': 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop',
  'AD': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  'DS': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
};

export const Avatar = ({ initials, src, size = 'md', online = false, className = '', shape = 'circle' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    full: 'w-full h-full',
  };

  const imageSrc = src || avatarMap[initials];
  const roundedClass = shape === 'square' ? 'rounded-[inherit]' : 'rounded-full';

  return (
    <div className={\`relative flex-shrink-0 \${className}\`}>
      {imageSrc ? (
        <img src={imageSrc} alt={initials} className={\`\${sizes[size]} \${roundedClass} object-cover shadow-sm ring-1 ring-black/5\`} />
      ) : (
        <div className={\`\${sizes[size]} \${roundedClass} bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold tracking-tighter shadow-sm\`}>
          {initials}
        </div>
      )}
      {online && (
        <span className={\`absolute bottom-0 right-0 \${size === 'full' ? 'w-4 h-4' : 'w-[28%] h-[28%]'} bg-emerald-500 border-2 border-white rounded-full\`}></span>
      )}
    </div>
  );
};
`,
  'Button.jsx': `
import React from 'react';

export const Button = ({ variant = 'primary', size = 'md', icon: Icon, children, className = '', ...props }) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    accent: 'bg-accent text-white hover:bg-accent-dark',
    ghost: 'bg-transparent text-ink-2 hover:bg-bg',
    outline: 'bg-transparent border border-line text-ink-2 hover:bg-bg',
    danger: 'bg-urgent text-white hover:bg-urgent-dark',
    'primary-light': 'bg-primary-light text-primary hover:bg-primary/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={\`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 \${variants[variant]} \${sizes[size]} \${className}\`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
};
`,
  'Card.jsx': `
import React from 'react';

export const Card = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div 
      onClick={onClick}
      className={\`bg-white rounded-xl border border-line-2 overflow-hidden \${hover ? 'hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all' : ''} \${className}\`}
      {...props}
    >
      {children}
    </div>
  );
};
`,
  'StatCard.jsx': `
import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ label, value, sub, icon: Icon, accent = 'primary', trend }) => {
  const accents = {
    primary: 'text-primary bg-primary-light',
    accent: 'text-accent bg-accent-light',
    warning: 'text-warning bg-warning-light',
    urgent: 'text-urgent bg-urgent-light',
  };

  return (
    <Card className="p-4 relative">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">{label}</span>
        {Icon && (
          <div className={\`p-1.5 rounded-lg \${accents[accent]}\`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold font-display text-ink mb-1">{value}</div>
      {(sub || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={\`flex items-center text-[10px] font-bold \${trend.startsWith('+') ? 'text-accent' : 'text-urgent'}\`}>
              {trend.startsWith('+') ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
              {trend}
            </span>
          )}
          {sub && <span className="text-[10px] text-ink-4">{sub}</span>}
        </div>
      )}
    </Card>
  );
};
`,
  'Pagination.jsx': `
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export const Pagination = ({ currentPage = 1, totalPages = 1, totalItems = 0, itemsPerPage = 10, onPageChange }) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-line-2">
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, i) => (
            page === '...' ? (
              <span key={\`dots-\${i}\`} className="px-2 text-ink-4"><MoreHorizontal size={14} /></span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={\`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all \${
                  currentPage === page 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-110' 
                    : 'text-ink-3 hover:bg-bg hover:text-ink'
                }\`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      <div className="text-xs font-semibold text-ink-4">
        Showing <span className="text-ink font-bold">{startItem}–{endItem}</span> of <span className="text-ink font-bold">{totalItems.toLocaleString()}</span> results
      </div>
    </div>
  );
};
`,
  'EmptyState.jsx': `
import React from 'react';

export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center text-ink-4 mb-4">
      {Icon && <Icon size={32} />}
    </div>
    <h3 className="text-base font-bold text-ink mb-1">{title}</h3>
    <p className="text-sm text-ink-3 max-w-xs">{description}</p>
  </div>
);
`,
  'SectionHeader.jsx': `
import React from 'react';

export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-bold font-display text-ink">{title}</h2>
      {subtitle && <p className="text-xs text-ink-3">{subtitle}</p>}
    </div>
    {action && (
      <div className="text-sm font-semibold text-primary hover:underline cursor-pointer">
        {action}
      </div>
    )}
  </div>
);
`
};

Object.entries(components).forEach(([filename, code]) => {
  fs.writeFileSync(path.join(DIR, filename), code.trim());
});

const indexCode = Object.keys(components)
  .map(f => \`export * from './\${f.replace('.jsx', '')}';\`)
  .join('\\n');

fs.writeFileSync(path.join(DIR, 'index.js'), indexCode);

// Rewrite UI.jsx to re-export
fs.writeFileSync('src/components/UI.jsx', "export * from './ui';\\n");

console.log('UI Components modularized successfully!');
