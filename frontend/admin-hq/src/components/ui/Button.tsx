import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--accent)',   color: 'var(--accent-fg)' },
  secondary: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' },
  ghost:     { background: 'transparent',      color: 'var(--text-2)' },
  danger:    { background: 'var(--danger)',    color: '#fff' },
  success:   { background: 'var(--success)',   color: '#fff' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      style,
      ...rest
    },
    ref,
  ) => {
    const merged: React.CSSProperties = { ...variantStyles[variant], ...(style || {}) };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={merged}
        className={`
          inline-flex items-center justify-center font-semibold whitespace-nowrap
          transition-all duration-150 ease-out
          hover:opacity-90 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          ${sizeClass[size]}
          ${className}
        `}
        {...rest}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';
