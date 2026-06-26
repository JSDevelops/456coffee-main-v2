import { motion } from 'framer-motion';
import { Coffee, Plus, Sparkles } from 'lucide-react';
import { TAG_COLORS, parseTags, cleanDescription, type MenuItem } from '../types';

/** Compact 2-col grid card. */
export function MenuCard({
  item, onSelect, onAddQuick,
}: { item: MenuItem; onSelect: () => void; onAddQuick: () => void }) {
  const tags = parseTags(item.tags);
  const desc = cleanDescription(item.description);
  const unavailable = item.status !== 'AVAILABLE';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="group relative bg-white rounded-[1.6rem] overflow-hidden hairline shadow-soft active:shadow-pop transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-dim">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy" decoding="async" fetchPriority="low"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center mesh-cream">
            <Coffee size={36} className="text-[var(--accent)]/70" />
          </div>
        )}
        {/* gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />

        {tags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex gap-1 flex-wrap max-w-[80%]">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ring-1 ring-white/50 shadow-soft ${TAG_COLORS[t] || 'bg-white text-ink'}`}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {unavailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[10.5px] font-extrabold ink-soft bg-white px-3 py-1 rounded-full hairline">
              หมดชั่วคราว
            </span>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <p className="font-display font-extrabold text-[13px] ink truncate leading-snug">{item.name}</p>
        {desc && (
          <p className="text-[10.5px] ink-soft line-clamp-1 mt-0.5 font-medium">{desc}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-display font-extrabold text-[13.5px] ink">
            <span className="text-[11px] ink-mute mr-0.5">฿</span>
            <span className="text-gold">{item.price}</span>
          </span>
          {!unavailable && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onAddQuick(); }}
              aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
              className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--accent-deep)] via-[var(--accent)] to-[var(--gold-1)] text-white flex items-center justify-center shadow-amber active:scale-95 transition-transform"
            >
              <Plus size={18} strokeWidth={2.6} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Horizontal large card for the home featured carousel. */
export function MenuCardLarge({ item, onSelect }: { item: MenuItem; onSelect: () => void }) {
  const tags = parseTags(item.tags);
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="shrink-0 w-[78%] sm:w-[68%] snap-start bg-white rounded-[1.8rem] overflow-hidden hairline shadow-soft luxe-border"
    >
      <div className="relative h-48 bg-paper-dim">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
        ) : (
          <div className="w-full h-full flex items-center justify-center mesh-cream">
            <Coffee size={48} className="text-[var(--accent)]/70" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        {tags[0] && (
          <span className={`absolute top-3 left-3 text-[9.5px] px-2.5 py-1 rounded-full font-semibold ring-1 ring-white/50 shadow-soft ${TAG_COLORS[tags[0]] || 'bg-white text-ink'}`}>
            {tags[0]}
          </span>
        )}
        <span
          className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-semibold text-[var(--ink)] shadow-amber ring-1 ring-white/60"
          style={{ background: 'linear-gradient(135deg, #ffd166 0%, #f5b301 60%, #ff9b1c 100%)' }}
        >
          <Sparkles size={10} strokeWidth={2.4} /> Signature
        </span>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="font-display font-extrabold text-[14.5px] leading-snug truncate drop-shadow-md">
            {item.name}
          </p>
          <p className="text-[11px] mt-0.5 opacity-95 font-bold">
            เริ่มต้น <span className="text-[var(--gold-1)]">฿{item.price}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
