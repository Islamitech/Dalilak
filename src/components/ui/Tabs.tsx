import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'chips';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs py-1.5 px-3' : 'text-xs sm:text-sm py-2 px-4';

  return (
    <div className={`overflow-x-auto scrollbar-none select-none ${className}`}>
      <div
        className={`flex items-center gap-1.5 min-w-max ${
          fullWidth ? 'w-full justify-between' : ''
        } ${variant === 'underline' ? 'border-b border-[var(--border-color)]' : ''}`}
        role="tablist"
      >
        {items.map((tab) => {
          const isActive = activeTab === tab.id;

          if (variant === 'underline') {
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`
                  flex items-center gap-2 border-b-2 font-black cursor-pointer transition-all duration-200
                  ${sizeClasses}
                  ${
                    isActive
                      ? 'border-amber-500 text-amber-500'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                  }
                `}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-600'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          }

          if (variant === 'chips') {
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`
                  flex items-center gap-1.5 rounded-full font-bold cursor-pointer transition-all active:scale-95 border
                  ${sizeClasses}
                  ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm'
                      : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/30'
                  }
                `}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          }

          // Default: 'pills'
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 rounded-xl font-bold cursor-pointer transition-all duration-200 active:scale-95
                ${sizeClasses}
                ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
                }
              `}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-black/20 text-slate-950' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
