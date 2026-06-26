import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  delta?: number | null;       // pct change
  deltaLabel?: string;          // override the auto label, e.g. "vs เมื่อวาน"
  loading?: boolean;
  tone?: 'accent' | 'success' | 'warning' | 'info' | 'neutral';
}

const toneFg: Record<NonNullable<StatCardProps['tone']>, string> = {
  accent:  'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  info:    'var(--info)',
  neutral: 'var(--text-2)',
};
const toneBg: Record<NonNullable<StatCardProps['tone']>, string> = {
  accent:  'var(--accent-soft)',
  success: 'var(--success-soft)',
  warning: 'var(--warning-soft)',
  info:    'var(--info-soft)',
  neutral: 'var(--surface-2)',
};

export function StatCard({
  icon,
  label,
  value,
  delta,
  deltaLabel = 'vs เมื่อวาน',
  loading,
  tone = 'accent',
}: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: toneBg[tone], color: toneFg[tone] }}
        >
          {icon}
        </div>
        {delta != null && !loading && (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{
              color:
                Math.abs(delta) < 0.01
                  ? 'var(--text-muted)'
                  : delta > 0
                    ? 'var(--success)'
                    : 'var(--danger)',
            }}
          >
            {Math.abs(delta) < 0.01 ? null : delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta) < 0.01 ? 'คงที่' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      {loading ? (
        <div className="animate-shimmer h-8 w-2/3 rounded-md" />
      ) : (
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight num truncate" style={{ color: 'var(--text)' }}>
          {value}
        </h3>
      )}
      {delta != null && (
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
          {deltaLabel}
        </p>
      )}
    </Card>
  );
}
