import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * App-wide top bar. One component, three visual variants.
 *
 *   variant="paper"  — solid ivory page header (default)
 *   variant="glass"  — translucent header that floats over scrolling content
 *   variant="hero"   — dark plum→amber gradient (used on order detail / profile)
 *
 * Slots:
 *   leading   — back button / avatar / left action
 *   trailing  — right action(s)
 *   kicker    — small uppercase label above title
 */
export type TopBarVariant = 'paper' | 'glass' | 'hero';

export interface TopBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  kicker?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  variant?: TopBarVariant;
  sticky?: boolean;
  /** Ornamental decoration shown to the right (icon graphic). */
  decoration?: ReactNode;
  className?: string;
}

const variantBg: Record<TopBarVariant, string> = {
  paper: 'bg-[var(--paper)]/85 backdrop-blur-md border-b border-[var(--hairline)]',
  glass: 'glass border-b border-[var(--hairline)]',
  hero:  'text-white',
};

export default function TopBar({
  title, subtitle, kicker, leading, trailing,
  variant = 'paper', sticky = false, decoration, className = '',
}: TopBarProps) {
  const isHero = variant === 'hero';

  return (
    <header
      className={[
        'relative px-5 pt-5 pb-3',
        sticky ? 'sticky top-0 z-30' : '',
        variantBg[variant],
        isHero ? 'rounded-b-[2rem] overflow-hidden' : '',
        className,
      ].join(' ')}
      style={isHero ? {
        background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 50%, #b9530a 100%)',
      } : undefined}
    >
      {isHero && decoration && (
        <span className="pointer-events-none absolute right-0 -bottom-3 opacity-90">
          {decoration}
        </span>
      )}

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {leading}
          <div className="min-w-0">
            {kicker && (
              <p
                className={[
                  'text-[9.5px] font-semibold tracking-[0.32em] uppercase',
                  isHero ? 'text-[var(--gold-1)]' : 'text-gold',
                ].join(' ')}
              >
                {kicker}
              </p>
            )}
            {title && (
              <h1
                className={[
                  'font-display font-semibold leading-tight truncate',
                  isHero ? 'text-[18px] mt-0.5' : 'text-[18px]',
                  isHero ? '' : 'ink',
                ].join(' ')}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className={[
                'text-[10.5px] mt-0.5 truncate font-medium',
                isHero ? 'text-white/75' : 'ink-soft',
              ].join(' ')}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {trailing && <div className="flex items-center gap-2 shrink-0">{trailing}</div>}
      </div>
    </header>
  );
}

/** Standard back button used as TopBar.leading. */
export function BackButton({ onClick, variant = 'paper' }: { onClick: () => void; variant?: TopBarVariant }) {
  const isHero = variant === 'hero';
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label="ย้อนกลับ"
      className={[
        'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform',
        isHero
          ? 'bg-white/15 ring-1 ring-white/24 text-white backdrop-blur'
          : 'bg-white hairline ink shadow-soft',
      ].join(' ')}
    >
      <ArrowLeft size={18} />
    </motion.button>
  );
}

/** Standard icon button used as TopBar.trailing. */
export function IconButton({
  onClick, label, children, tone = 'paper',
}: {
  onClick?: () => void;
  label?: string;
  children: ReactNode;
  tone?: 'paper' | 'gold' | 'hero';
}) {
  const cls =
    tone === 'gold'
      ? 'bg-gradient-to-br from-[var(--accent)] to-[var(--gold-1)] text-ink shadow-amber'
      : tone === 'hero'
      ? 'bg-white/15 ring-1 ring-white/24 text-white backdrop-blur'
      : 'bg-white hairline ink shadow-soft';
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={label}
      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform ${cls}`}
    >
      {children}
    </motion.button>
  );
}
