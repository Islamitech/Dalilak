import React from 'react';

export type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral' 
  | 'purple';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulseDot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
  success: {
    bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    dot: 'bg-rose-500',
  },
  info: {
    bg: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
    dot: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    dot: 'bg-slate-500',
  },
  purple: {
    bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
    dot: 'bg-purple-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-2 py-0.5 gap-1',
  sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
  md: 'text-xs px-3 py-1 gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulseDot = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={`
        inline-flex items-center justify-center font-black rounded-full border
        select-none whitespace-nowrap leading-none transition-colors
        ${styles.bg}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulseDot && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${styles.dot}`} />
        </span>
      )}

      {icon && <span className="shrink-0">{icon}</span>}

      <span>{children}</span>
    </span>
  );
};
