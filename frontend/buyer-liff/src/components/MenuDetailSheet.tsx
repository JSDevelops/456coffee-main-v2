import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { cleanDescription, type MenuItem, type MenuOption, type OptionGroup } from '../types';

export default function MenuDetailSheet({
  item, onClose, onAddToCart,
}: {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, qty: number, opts: Record<string, MenuOption[]>, note: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, MenuOption[]>>({});
  const [note, setNote] = useState('');

  useEffect(() => {
    const initial: Record<string, MenuOption[]> = {};
    item.optionGroups.forEach((g) => {
      const def = g.options.find((o) => o.isDefault);
      if (def) initial[g.id] = [def];
    });
    setSelected(initial);
  }, [item]);

  const toggleOption = (group: OptionGroup, opt: MenuOption) => {
    setSelected((prev) => {
      const cur = prev[group.id] || [];
      if (group.maxSelect === 1) return { ...prev, [group.id]: [opt] };
      const exists = cur.find((o) => o.id === opt.id);
      if (exists) return { ...prev, [group.id]: cur.filter((o) => o.id !== opt.id) };
      if (cur.length >= group.maxSelect) return { ...prev, [group.id]: [...cur.slice(1), opt] };
      return { ...prev, [group.id]: [...cur, opt] };
    });
  };

  const optionsTotal = Object.values(selected).flat().reduce((s, o) => s + o.priceAddon, 0);
  const total = (item.price + optionsTotal) * qty;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex flex-col justify-end"
    >
      <div className="absolute inset-0 bg-[var(--ink)]/55 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative bg-paper rounded-t-[2rem] max-h-[92vh] flex flex-col overflow-hidden shadow-deep w-full max-w-md mx-auto"
      >
        {/* Hero image */}
        <div className="relative h-56 shrink-0 bg-paper-dim">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="eager" decoding="async" fetchPriority="high" />
          ) : (
            <div className="w-full h-full flex items-center justify-center mesh-cream">
              <Coffee size={64} className="text-accent" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-2xl glass flex items-center justify-center shadow-pop"
            aria-label="ปิด"
          >
            <X size={18} className="ink" />
          </button>
          <div className="absolute -bottom-1 left-0 right-0 h-6 bg-paper rounded-t-[2rem]" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 no-scrollbar">
          <div>
            <h2 className="font-display font-semibold text-[18px] ink leading-tight">{item.name}</h2>
            {(() => {
              const desc = cleanDescription(item.description);
              return desc ? (
                <p className="text-[11.5px] ink-soft mt-1.5 leading-relaxed">{desc}</p>
              ) : null;
            })()}
            <p className="font-display font-semibold text-[18px] text-gold mt-3">฿{item.price}</p>
          </div>

          {item.optionGroups.map((group) => (
            <section key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-semibold text-[12.5px] ink">{group.name}</p>
                {group.isRequired && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--rose-soft)] text-[var(--rose)] font-semibold">
                    จำเป็น
                  </span>
                )}
                <span className="text-[10px] ink-mute">เลือกได้ {group.maxSelect}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isSel = (selected[group.id] || []).some((o) => o.id === opt.id);
                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => toggleOption(group, opt)}
                      className={[
                        'h-10 px-4 rounded-2xl text-[11.5px] font-semibold transition-all',
                        isSel ? 'text-white shadow-amber' : 'bg-white hairline ink',
                      ].join(' ')}
                      style={
                        isSel
                          ? { background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 55%, #b9530a 100%)' }
                          : undefined
                      }
                    >
                      {opt.label}
                      {opt.priceAddon > 0 && (
                        <span className={`ml-1.5 ${isSel ? 'text-[var(--gold-1)]' : 'text-[var(--accent-deep)]'}`}>
                          +฿{opt.priceAddon}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <p className="font-semibold text-[12.5px] ink mb-2">หมายเหตุ</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ไม่ใส่น้ำแข็ง, ใส่ถุงเพิ่ม..."
              className="w-full bg-white hairline rounded-2xl py-3 px-4 text-[12px] ink outline-none focus:shadow-glow transition-shadow"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 pt-4 pb-7 bg-white border-t border-[var(--hairline)]">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 bg-paper rounded-2xl p-1.5 hairline">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl bg-white hairline flex items-center justify-center"
              >
                <Minus size={14} className="ink" strokeWidth={2.4} />
              </motion.button>
              <span className="font-semibold text-[14px] w-6 text-center ink">{qty}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-pop"
                style={{ background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' }}
              >
                <Plus size={14} strokeWidth={2.4} />
              </motion.button>
            </div>
            <p className="font-display font-semibold text-[18px] ink">
              <span className="text-[12px] ink-mute mr-0.5">฿</span>
              <span className="text-gold">{total}</span>
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { onAddToCart(item, qty, selected, note); onClose(); }}
            className="w-full h-14 rounded-2xl text-ink font-semibold pop-amber inline-flex items-center justify-center gap-2.5"
            style={{ background: 'linear-gradient(135deg, #ffd166 0%, #f5b301 50%, #ff9b1c 100%)' }}
          >
            <ShoppingBag size={20} /> เพิ่มลงตะกร้า · ฿{total}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
