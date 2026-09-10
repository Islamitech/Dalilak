import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'ghost' 
  | 'success' 
  | 'outline-amber';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 
    'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-sm focus-visible:ring-amber-500',
  secondary: 
    'bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--border-color)] font-bold focus-visible:ring-slate-400',
  danger: 
    'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30 font-black focus-visible:ring-rose-500',
  ghost: 
    'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] font-bold focus-visible:ring-slate-400',
  success: 
    'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-sm focus-visible:ring-emerald-500',
  'outline-amber': 
    'border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-bold focus-visible:ring-amber-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'text-[11px] px-2.5 py-1 rounded-lg gap-1.5',
  sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-2',
  md: 'text-xs sm:text-sm px-5 py-2.5 rounded-xl gap-2',
  lg: 'text-sm sm:text-base px-6 py-3 rounded-2xl gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-cairo select-none
        transition-all duration-200 ease-out cursor-pointer
        active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none active:scale-100' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'start' && <span className="shrink-0">{icon}</span>
      )}

      {children && <span className="truncate">{children}</span>}

      {!loading && icon && iconPosition === 'end' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
