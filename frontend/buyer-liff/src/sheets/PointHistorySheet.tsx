import { motion, AnimatePresence } from 'framer-motion';
import { Gift, History, Minus, Plus, X } from 'lucide-react';
import { EmptyState } from '../components/ui/Primitives';
import type { Member } from '../types';

export default function PointHistorySheet({
  open, onClose, member,
}: { open: boolean; onClose: () => void; member: Member | null }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-paper rounded-t-[2rem] max-h-[88vh] flex flex-col shadow-deep"
          >
            <div className="pt-3 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-line" /></div>

            <div className="px-6 pt-4 pb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent-deep">Point activity</p>
                <h3 className="font-extrabold text-xl ink mt-0.5">ประวัติแต้ม</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white hairline flex items-center justify-center">
                <X size={18} className="ink" />
              </button>
            </div>

            <div className="px-6 pb-3">
              <div
                className="text-white rounded-3xl p-5 flex items-center justify-between shadow-deep luxe-border"
                style={{ background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 55%, #b9530a 100%)' }}
              >
                <div>
                  <p className="text-[var(--gold-1)] text-[10px] font-semibold tracking-[0.25em] uppercase">✦ Available</p>
                  <p className="font-display font-semibold text-3xl mt-1">
                    {(member?.points || 0).toLocaleString()} <span className="text-sm font-medium opacity-75">แต้ม</span>
                  </p>
                </div>
                <Gift size={32} className="text-[var(--gold-1)]" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-2.5 no-scrollbar">
              {member?.pointHistory?.length ? (
                member.pointHistory.map((h) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-white hairline rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        h.delta > 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                      }`}>
                        {h.delta > 0 ? <Plus size={16} strokeWidth={2.6} /> : <Minus size={16} strokeWidth={2.6} />}
                      </div>
                      <div>
                        <p className="font-extrabold text-[13px] ink">{h.reason}</p>
                        <p className="text-[10px] ink-mute font-bold">
                          {new Date(h.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-extrabold text-base ${h.delta > 0 ? 'text-success' : 'text-danger'}`}>
                      {h.delta > 0 ? `+${h.delta}` : h.delta}
                    </p>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={<History size={28} />}
                  title="ยังไม่มีประวัติ"
                  body="แต้มที่คุณได้รับจะมาแสดงที่นี่"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
