import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles =
    'inline-flex items-center justify-center font-cairo font-bold transition-all duration-200 ease-out cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 select-none rounded-xl';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-6 py-2.5 text-sm sm:text-base gap-2.5'
  }[size];

  const variantStyles = {
    primary:
      'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs focus-visible:ring-amber-500 border border-amber-500/20',
    secondary:
      'bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--border-color)] font-bold focus-visible:ring-slate-400',
    outline:
      'bg-transparent text-[var(--text-primary)] hover:bg-[var(--input-bg)] border border-[var(--border-color)] shadow-2xs focus-visible:ring-amber-500 font-bold',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] font-bold focus-visible:ring-slate-400 border border-transparent',
    danger:
      'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30 font-black focus-visible:ring-rose-500',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs focus-visible:ring-emerald-500 border border-transparent'
  }[variant];

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

