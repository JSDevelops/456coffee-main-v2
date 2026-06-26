import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hover?: boolean;
}

export function Card({
  padded = true,
  hover = false,
  className = '',
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border transition-all duration-200
        ${hover ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''}
        ${padded ? 'p-5 sm:p-6' : ''}
        ${className}
      `}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h3 className="font-bold text-base sm:text-lg" style={{ color: 'var(--text)' }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
