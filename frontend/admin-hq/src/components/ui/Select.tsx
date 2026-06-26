import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, containerClassName = '', className = '', children, ...rest }, ref) => (
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
        <select
          ref={ref}
          className={`
            w-full h-11 rounded-xl pl-4 pr-10 text-sm appearance-none transition-all
            ${className}
          `}
          style={{
            background: 'var(--surface-2)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            color: 'var(--text)',
          }}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
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
  ),
);
Select.displayName = 'Select';
