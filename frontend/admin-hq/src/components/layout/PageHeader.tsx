import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <div
            className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
