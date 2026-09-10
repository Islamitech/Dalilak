import React from 'react';

export type CardVariant = 'default' | 'gold' | 'elevated' | 'bordered' | 'muted';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm',
  gold: 'bg-amber-500/10 border border-amber-500/30 shadow-sm',
  elevated: 'bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md',
  bordered: 'bg-transparent border border-[var(--border-color)]',
  muted: 'bg-[var(--input-bg)] border border-[var(--border-color)]',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6 sm:p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        rounded-3xl transition-all duration-200
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverable ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-amber-500/40 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
