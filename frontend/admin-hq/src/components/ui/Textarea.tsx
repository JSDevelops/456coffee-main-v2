import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, containerClassName = '', className = '', ...rest }, ref) => (
    <div className={containerClassName}>
      {label && (
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`
          w-full rounded-xl p-3.5 text-sm transition-all resize-none
          ${className}
        `}
        style={{
          background: 'var(--surface-2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          color: 'var(--text)',
        }}
        {...rest}
      />
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
Textarea.displayName = 'Textarea';
