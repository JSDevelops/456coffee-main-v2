import { motion } from 'framer-motion';
import type { Category } from '../types';

/**
 * Category browser rail — used on Home (preview) and Menu (filter chips).
 *
 *   <CategoryRail variant="filter" categories=[…] activeId=… onSelect={fn} />
 *   <CategoryRail variant="preview" categories=[…] onSelect={fn} />
 *
 * Each category gets a pastel "tone" assigned deterministically from its id
 * so colors stay stable across renders but feel varied across the rail.
 */

const TONES = [
  { soft: 'rgba(255, 209, 102, 0.30)', glow: 'rgba(245, 179, 1, 0.45)',  ink: '#7a3608' }, // amber
  { soft: 'rgba(244, 63, 122, 0.18)',  glow: 'rgba(244, 63, 122, 0.40)', ink: '#9d174d' }, // rose
  { soft: 'rgba(139, 92, 246, 0.18)',  glow: 'rgba(139, 92, 246, 0.40)', ink: '#5b21b6' }, // lavender
  { soft: 'rgba(20, 184, 166, 0.20)',  glow: 'rgba(20, 184, 166, 0.42)', ink: '#0f766e' }, // mint
  { soft: 'rgba(56, 189, 248, 0.20)',  glow: 'rgba(56, 189, 248, 0.40)', ink: '#075985' }, // sky
  { soft: 'rgba(251, 146, 60, 0.22)',  glow: 'rgba(251, 146, 60, 0.42)', ink: '#9a3412' }, // peach
];

function toneFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

const ACTIVE_BG = 'linear-gradient(135deg, #2b1530 0%, #4d2546 55%, #b9530a 100%)';

export interface CategoryRailProps {
  categories: Category[];
  activeId?: string | null;
  onSelect: (id: string | null) => void;
  /** "filter" includes a ทั้งหมด pill at the start. "preview" is for Home. */
  variant?: 'filter' | 'preview';
  totalCount?: number;
}

export default function CategoryRail({
  categories, activeId, onSelect, variant = 'filter', totalCount,
}: CategoryRailProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
      {variant === 'filter' && (
        <Pill
          icon="✦"
          label="ทั้งหมด"
          count={totalCount ?? 0}
          active={!activeId}
          tone={TONES[0]}
          onClick={() => onSelect(null)}
        />
      )}
      {categories.map((c) => (
        <Pill
          key={c.id}
          icon={c.icon || '☕'}
          label={c.name}
          count={c._count.products}
          active={activeId === c.id}
          tone={toneFor(c.id)}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </div>
  );
}

function Pill({
  icon, label, count, active, tone, onClick,
}: {
  icon: string;
  label: string;
  count: number;
  active: boolean;
  tone: typeof TONES[number];
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={[
        'shrink-0 group relative inline-flex items-center gap-2.5 pl-2 pr-4 h-14 rounded-[1.2rem] transition-all min-w-[124px]',
        active ? 'text-white shadow-amber' : 'bg-white hairline',
      ].join(' ')}
      style={active ? { background: ACTIVE_BG } : undefined}
    >
      {/* Icon bubble */}
      <span
        className="grid w-10 h-10 place-items-center rounded-[0.95rem] text-[18px] shrink-0 transition-all"
        style={{
          background: active ? 'rgba(255,255,255,0.18)' : tone.soft,
          boxShadow: active
            ? '0 0 0 1px rgba(255,255,255,0.22)'
            : `0 6px 16px -8px ${tone.glow}, inset 0 0 0 1px rgba(255,255,255,0.6)`,
        }}
      >
        <span className="leading-none">{icon}</span>
      </span>

      {/* Label */}
      <span className="flex flex-col items-start gap-0 min-w-0">
        <span
          className={[
            'font-semibold text-[12px] leading-tight truncate max-w-[80px]',
            active ? '' : 'ink',
          ].join(' ')}
        >
          {label}
        </span>
        <span
          className={[
            'text-[9.5px] font-medium leading-tight',
            active ? 'text-[var(--gold-1)]' : '',
          ].join(' ')}
          style={!active ? { color: tone.ink } : undefined}
        >
          {count} รายการ
        </span>
      </span>

      {/* Active gold underline accent */}
      {active && (
        <motion.span
          layoutId="cat-active-underline"
          className="absolute left-3 right-3 -bottom-px h-[2px] rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #ffd166, transparent)' }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        />
      )}
    </motion.button>
  );
}
