import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, CheckCircle2, Clock, Coffee } from 'lucide-react';

export default function QueueMonitorView({ branch, orders }: any) {
  const preparing = orders
    .filter((o: any) => ['PAID', 'PREPARING', 'READY_FOR_QC'].includes(o.status))
    .slice(0, 10);
  const ready = orders
    .filter((o: any) => o.status === 'READY_FOR_PICKUP')
    .slice(0, 10);

  // Chime on new ready order
  const prevReadyIds = useRef<string[]>([]);
  useEffect(() => {
    const ids = ready.map((o: any) => o.id);
    const hasNew = ids.some((id: string) => !prevReadyIds.current.includes(id));
    if (hasNew) { /* play sound here if desired */ }
    prevReadyIds.current = ids;
  }, [ready]);

  const branchName = branch?.name || '456 Coffee';

  return (
    <div className="h-full flex flex-col bg-[#1a1715] text-white overflow-hidden font-sans">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-6 shrink-0">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Coffee size={24} className="text-[#2d241e] sm:hidden" />
            <Coffee size={30} className="text-[#2d241e] hidden sm:block" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase truncate">
              {branchName}
            </h1>
            <p className="text-[10px] sm:text-sm font-bold text-amber-500/60 uppercase tracking-widest leading-tight">
              จอแสดงสถานะออเดอร์
            </p>
          </div>
        </div>
        {/* Right: watermark — hide on xs */}
        <div className="hidden sm:block text-4xl lg:text-6xl font-black text-white/8 italic select-none shrink-0">
          #456Cafe
        </div>
      </div>

      {/* ── Main grid — stack on mobile, side-by-side on sm+ ────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 px-4 sm:px-8 pb-4 sm:pb-6">

        {/* Column: กำลังจัดเตรียม */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <Clock className="text-gray-500 shrink-0" size={20} />
            <h2 className="text-sm sm:text-xl font-black uppercase tracking-widest text-gray-500">กำลังจัดเตรียม</h2>
            <span className="ml-auto text-xs font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
              {preparing.length}
            </span>
          </div>

          <div className="flex-1 min-h-0 bg-white/5 rounded-2xl sm:rounded-[2rem] border border-white/5 overflow-y-auto p-3 sm:p-6">
            {preparing.length === 0 ? (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center opacity-10">
                <Clock size={40} />
                <p className="mt-3 font-black text-xs">รอออเดอร์ใหม่</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
                <AnimatePresence>
                  {preparing.map((order: any) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center border border-white/5 text-center"
                    >
                      <span className="text-3xl sm:text-5xl font-black text-white/40 leading-none">
                        #{order.queueNo || '—'}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1.5 uppercase truncate max-w-full">
                        {order.customerName || 'ลูกค้า'}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Column: เชิญรับสินค้า */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <BellRing className="text-emerald-400 animate-pulse shrink-0" size={20} />
            <h2 className="text-sm sm:text-xl font-black uppercase tracking-widest text-emerald-400">เชิญรับสินค้า</h2>
            <span className="ml-auto text-xs font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {ready.length}
            </span>
          </div>

          <div className="flex-1 min-h-0 bg-emerald-500/10 rounded-2xl sm:rounded-[2rem] border border-emerald-500/20 overflow-y-auto p-3 sm:p-6">
            {ready.length === 0 ? (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center opacity-10">
                <BellRing size={40} />
                <p className="mt-3 font-black text-xs">ยังไม่มีรายการที่เสร็จ</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                <AnimatePresence>
                  {ready.map((order: any) => (
                    <motion.div
                      key={order.id}
                      layoutId={order.id}
                      initial={{ x: 60, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -60, opacity: 0 }}
                      className="bg-emerald-500 text-[#1a1715] rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex items-center justify-between gap-3 shadow-xl shadow-emerald-500/20 border-2 border-emerald-400"
                    >
                      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                        {/* Queue number */}
                        <span className="text-4xl sm:text-7xl font-black italic tracking-tighter leading-none shrink-0">
                          #{order.queueNo || '—'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-xl font-black uppercase tracking-tight leading-none truncate">
                            {order.customerName || 'ลูกค้า'}
                          </p>
                          <p className="text-[10px] sm:text-sm font-bold opacity-60 mt-1">
                            โปรดรับสินค้าที่เคาน์เตอร์
                          </p>
                        </div>
                      </div>
                      <CheckCircle2
                        className="opacity-40 shrink-0"
                        size={28}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/5 px-4 sm:px-8 py-3 flex items-center justify-between opacity-40 gap-2 flex-wrap">
        <p className="font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">
          Fresh Coffee · Premium Experience
        </p>
        <div className="flex items-center gap-3 sm:gap-6 font-black text-[10px] sm:text-xs uppercase tracking-widest flex-wrap">
          {branch?.openTime && branch?.closeTime && (
            <span>เปิด {branch.openTime} – {branch.closeTime}</span>
          )}
          {branch?.phone && <span>โทร {branch.phone}</span>}
          <span>{new Date().toLocaleDateString('th-TH')}</span>
        </div>
      </div>
    </div>
  );
}
