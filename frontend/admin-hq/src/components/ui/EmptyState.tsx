import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mt-1.5 max-w-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
