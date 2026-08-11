import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  isGold?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isGold = false,
  icon,
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
        isGold
          ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/30'
          : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/30'
      } ${className}`}
    >
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {icon && <span className="text-amber-500">{icon}</span>}
        <p className={`text-2xl font-black ${isGold ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>
          {value}
        </p>
      </div>
      {change && <p className="text-xs font-bold text-emerald-500 mt-1">{change}</p>}
      {children}
    </div>
  );
};
