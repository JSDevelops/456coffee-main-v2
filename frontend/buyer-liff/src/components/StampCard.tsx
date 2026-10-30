import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Crown, Sparkles, Check, Gift } from 'lucide-react';

interface StampCardProps {
  completedOrdersCount: number;
  onRedeemReward?: () => void;
}

export default function StampCard({
  completedOrdersCount,
  onRedeemReward,
}: StampCardProps) {
  // 10 stamps per cycle
  const currentStamps = completedOrdersCount % 10;
  const isComplete = completedOrdersCount > 0 && currentStamps === 0;
  const activeStampsCount = isComplete ? 10 : currentStamps;
  const remaining = isComplete ? 0 : 10 - activeStampsCount;

  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    setClaimed(true);
    onRedeemReward?.();
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-deep luxe-border"
         style={{
           background: 'linear-gradient(135deg, #1c1510 0%, #2e2017 40%, #17110c 100%)',
           border: '1px solid rgba(212, 169, 104, 0.35)',
         }}>
      {/* Background ambient auroras */}
      <span className="aurora absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[var(--gold-1)]/15 blur-2xl pointer-events-none" />
      <span className="aurora absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-[#ea580c]/15 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-[var(--gold-1)] bg-white/10 ring-1 ring-white/15">
            <Sparkles size={11} className="text-[var(--gold-1)]" /> 456 Atelier Stamp Pass
          </span>
          <h3 className="font-display mt-2 text-xl font-extrabold leading-tight text-white">
            สะสมแสตมป์ดิจิทัล
          </h3>
          <p className="mt-0.5 text-[11px] font-bold text-white/70">
            {isComplete
              ? 'ยินดีด้วยค่ะ! คุณสะสมครบ 10 ดวงแล้ว'
              : `สะสมอีก ${remaining} แก้ว เพื่อรับเครื่องดื่มฟรี 1 แก้ว`}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="font-display block text-3xl font-extrabold text-[var(--gold-1)]">
            {activeStampsCount}<span className="text-sm font-bold text-white/60">/10</span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider text-white/50">Stamps</span>
        </div>
      </div>

      {/* 10 Stamp Grid (2 rows of 5) */}
      <div className="relative mt-6 grid grid-cols-5 gap-2.5">
        {Array.from({ length: 10 }).map((_, index) => {
          const stampNumber = index + 1;
          const isStamped = stampNumber <= activeStampsCount;
          const isFreeRewardCup = stampNumber === 10;

          return (
            <motion.div
              key={stampNumber}
              whileHover={{ scale: 1.05 }}
              className={`relative flex flex-col items-center justify-center rounded-2xl h-[58px] transition-all ${
                isFreeRewardCup
                  ? isStamped
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-stone-950 shadow-gold'
                    : 'bg-white/10 border-2 border-dashed border-[var(--gold-1)]/60 text-[var(--gold-1)]'
                  : isStamped
                  ? 'bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white shadow-soft'
                  : 'bg-white/8 border border-white/12 text-white/40'
              }`}
            >
              {isStamped ? (
                <>
                  {isFreeRewardCup ? (
                    <Crown size={22} className="text-stone-950 animate-bounce" />
                  ) : (
                    <div className="relative">
                      <Coffee size={20} />
                      <span className="absolute -bottom-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-white text-[#ea580c] text-[8px] font-black flex items-center justify-center shadow-xs">
                        <Check size={9} strokeWidth={3} />
                      </span>
                    </div>
                  )}
                  <span className="text-[8px] font-black tracking-tight mt-1 opacity-90">
                    {isFreeRewardCup ? 'FREE!' : `#${stampNumber}`}
                  </span>
                </>
              ) : (
                <>
                  {isFreeRewardCup ? (
                    <Gift size={20} className="text-[var(--gold-1)]" />
                  ) : (
                    <Coffee size={18} strokeWidth={1.5} />
                  )}
                  <span className="text-[8px] font-extrabold tracking-tight mt-1 opacity-60">
                    {isFreeRewardCup ? 'ฟรี 1 แก้ว' : `${stampNumber}`}
                  </span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Action / Redeem Button */}
      {isComplete && (
        <div className="relative mt-5 pt-4 border-t border-white/15">
          <AnimatePresence mode="wait">
            {claimed ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-3 text-center"
              >
                <p className="text-xs font-black text-emerald-300">
                  🎉 สิทธิ์ฟรีของคุณถูกบันทึกในระบบแล้ว สามารถแจ้งบาริสต้าได้ทันที!
                </p>
              </motion.div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleClaim}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-gold"
              >
                <Gift size={16} /> แลกรับเครื่องดื่มฟรี 1 แก้วทันที!
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer hint */}
      <div className="relative mt-4 flex items-center justify-between text-[9.5px] font-bold text-white/50">
        <span>● สั่งเครื่องดื่ม 1 แก้ว = แสตมป์ 1 ดวง</span>
        <span>สะสมได้ไม่จำกัดรอบ</span>
      </div>
    </div>
  );
}
