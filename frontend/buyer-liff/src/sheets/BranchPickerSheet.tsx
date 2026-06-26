import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, Store as StoreIcon, X } from 'lucide-react';
import type { Branch } from '../types';

export default function BranchPickerSheet({
  open, onClose, branches, selected, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  selected: Branch | null;
  onSelect: (b: Branch) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-paper rounded-t-[2rem] max-h-[85vh] flex flex-col shadow-deep"
          >
            <div className="pt-3 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-line" /></div>
            <div className="px-6 pt-4 pb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent-deep">Choose store</p>
                <h3 className="font-extrabold text-xl ink mt-0.5">เลือกสาขา</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white hairline flex items-center justify-center">
                <X size={18} className="ink" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 no-scrollbar">
              {branches.map((b) => {
                const isSel = selected?.id === b.id;
                return (
                  <motion.button
                    key={b.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onSelect(b); onClose(); }}
                    className={[
                      'w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4',
                      isSel ? 'text-white shadow-deep' : 'bg-white hairline active:shadow-pop',
                    ].join(' ')}
                    style={isSel ? { background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' } : undefined}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSel ? 'bg-white/15 text-white' : 'bg-cream text-accent-deep'
                    }`}>
                      <StoreIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-[14px] truncate">{b.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                          b.isOpen
                            ? isSel ? 'bg-white/15 text-success' : 'bg-success-soft text-success'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {b.isOpen ? 'เปิด' : 'ปิด'}
                        </span>
                      </div>
                      <div className={`text-[11px] mt-1 inline-flex items-center gap-1.5 truncate ${
                        isSel ? 'text-white/70' : 'ink-mute'
                      }`}>
                        <MapPin size={11} /><span className="truncate">{b.address || '—'}</span>
                      </div>
                      {b.openTime && (
                        <p className={`text-[10px] mt-0.5 inline-flex items-center gap-1 font-bold ${isSel ? 'text-white/70' : 'ink-mute'}`}>
                          <Clock size={10} /> {b.openTime}–{b.closeTime}
                        </p>
                      )}
                    </div>
                    {isSel && <CheckCircle2 size={22} className="text-accent shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
