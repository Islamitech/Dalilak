import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'start',
  fullWidth = true,
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-[var(--text-secondary)] select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && iconPosition === 'start' && (
          <span className="absolute right-3.5 text-[var(--text-muted)] pointer-events-none shrink-0">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full bg-[var(--input-bg)] text-[var(--text-primary)] border rounded-2xl
            text-sm px-4 py-2.5 transition-all duration-200 outline-none
            placeholder:text-[var(--text-muted)]
            focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
            ${icon && iconPosition === 'start' ? 'pr-10' : ''}
            ${icon && iconPosition === 'end' ? 'pl-10' : ''}
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[var(--border-color)]'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />

        {icon && iconPosition === 'end' && (
          <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none shrink-0">
            {icon}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-bold text-rose-500 leading-tight">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--text-muted)] leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
