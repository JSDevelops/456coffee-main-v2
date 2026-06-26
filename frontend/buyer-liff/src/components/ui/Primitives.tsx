import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

/** App-wide page header used inside scroll containers. */
export function PageHeader({
  title, subtitle, onBack, right, sticky = true,
}: { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode; sticky?: boolean }) {
  return (
    <header
      className={`${sticky ? 'sticky top-0 z-30' : ''} px-5 pt-5 pb-3 glass border-b border-[var(--hairline)]`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="ย้อนกลับ"
              className="w-10 h-10 rounded-2xl bg-white hairline flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-soft"
            >
              <ArrowLeft size={18} className="ink" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-[16px] leading-tight truncate ink">{title}</h1>
            {subtitle && <p className="text-[10.5px] ink-soft mt-0.5 truncate font-medium">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}

/** Soft section title used between content blocks. */
export function SectionTitle({ kicker, title, action }: { kicker?: string; title: string; action?: ReactNode }) {
  return (
    <div className="px-5 mb-3 flex items-end justify-between gap-3">
      <div>
        {kicker && (
          <p className="text-[9.5px] font-black tracking-[0.28em] uppercase text-gold mb-1">{kicker}</p>
        )}
        <h2 className="font-display font-extrabold text-[16px] ink leading-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Pill-shaped chip — supports active state. */
export function Chip({
  active, children, onClick, leading,
}: { active?: boolean; children: ReactNode; onClick?: () => void; leading?: ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={[
        'shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[11px] font-extrabold transition-all',
        active
          ? 'text-white shadow-amber'
          : 'bg-white hairline ink-soft',
      ].join(' ')}
      style={active ? { background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' } : undefined}
    >
      {leading}
      {children}
    </motion.button>
  );
}

/** Generic skeleton block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Centered empty state with optional CTA. */
export function EmptyState({
  icon, title, body, action,
}: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-16">
      <div className="relative w-20 h-20 mb-5">
        <span className="absolute inset-0 rounded-[1.6rem] spin-slow"
              style={{ background: 'conic-gradient(from 0deg, #ffd166, #f43f7a, #8b5cf6, #14b8a6, #ffd166)' }} />
        <div className="absolute inset-[3px] rounded-[1.4rem] bg-white flex items-center justify-center text-[var(--accent-deep)]">
          {icon}
        </div>
      </div>
      <h3 className="font-display font-extrabold text-xl ink">{title}</h3>
      {body && <p className="text-sm ink-soft mt-1.5 max-w-[260px] leading-relaxed font-medium">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Status badge — relies on TONE_BG class. */
export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

/** Primary CTA button. */
export function PrimaryButton({
  children, onClick, disabled, type = 'button', icon, full = true, size = 'lg',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: ReactNode;
  full?: boolean;
  size?: 'md' | 'lg';
}) {
  const h = size === 'lg' ? 'h-14' : 'h-12';
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        full ? 'w-full' : '',
        h,
        'inline-flex items-center justify-center gap-2.5 px-6 rounded-2xl font-extrabold text-[13px] text-ink',
        'pop-amber transition-all',
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-px',
      ].join(' ')}
      style={{ background: 'linear-gradient(135deg, #ffd166 0%, #f5b301 50%, #ff9b1c 100%)' }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/** Bottom-sheet wrapper with backdrop. */
export function Sheet({
  open, onClose, children, fullHeight = false,
}: { open: boolean; onClose: () => void; children: ReactNode; fullHeight?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className={[
          'relative w-full max-w-md mx-auto bg-paper rounded-t-[2rem] overflow-hidden flex flex-col shadow-deep',
          fullHeight ? 'h-[92vh]' : 'max-h-[92vh]',
        ].join(' ')}
      >
        <div className="pt-3 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-line" />
        </div>
        {children}
      </motion.div>
    </div>
  );
}
