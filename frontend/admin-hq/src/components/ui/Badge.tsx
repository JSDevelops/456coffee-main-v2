import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const tones: Record<Tone, { bg: string; fg: string; border?: string }> = {
  neutral: { bg: 'var(--surface-2)',  fg: 'var(--text-2)',   border: 'var(--border)' },
  accent:  { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  warning: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
  danger:  { bg: 'var(--danger-soft)',  fg: 'var(--danger)' },
  info:    { bg: 'var(--info-soft)',    fg: 'var(--info)' },
};

export function Badge({ tone = 'neutral', children, icon, className = '' }: BadgeProps) {
  const t = tones[tone];
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 h-6 rounded-md text-xs font-semibold
        ${className}
      `}
      style={{
        background: t.bg,
        color: t.fg,
        border: t.border ? `1px solid ${t.border}` : 'none',
      }}
    >
      {icon}
      {children}
    </span>
  );
}
