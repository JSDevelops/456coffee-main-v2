import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, error, leftIcon, rightIcon, containerClassName = '', className = '', ...rest },
    ref,
  ) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full h-11 rounded-xl text-sm transition-all
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              ${className}
            `}
            style={{
              background: 'var(--surface-2)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              color: 'var(--text)',
            }}
            {...rest}
          />
          {rightIcon && (
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {(hint || error) && (
          <p
            className="text-xs mt-1.5"
            style={{ color: error ? 'var(--danger)' : 'var(--text-muted)' }}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
