import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, ChevronRight, Package, X, ArrowRight } from 'lucide-react';
import { PaginationControls, useClientPagination } from '../Pagination';

export default function QCView({ orders, updateStatus }: any) {
  const qcOrders = orders.filter((o: any) => o.status === 'READY_FOR_QC');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [checklist, setChecklist] = useState({
    menuCorrect: false,
    lidSecured: false,
    stickerApplied: false,
  });
  const paginatedOrders = useClientPagination(qcOrders, 8);
  const isComplete = checklist.menuCorrect && checklist.lidSecured && checklist.stickerApplied;

  useEffect(() => {
    if (selectedOrder && !qcOrders.some((o: any) => o.id === selectedOrder.id)) {
      setSelectedOrder(null);
    }
  }, [qcOrders, selectedOrder]);

  useEffect(() => { setSelectedOrder(null); }, [paginatedOrders.page]);

  const selectOrder = (order: any) => {
    setSelectedOrder(order);
    setChecklist({ menuCorrect: false, lidSecured: false, stickerApplied: false });
  };

  const checkItems = [
    { id: 'menuCorrect',    label: 'รายการถูกต้อง',   sub: 'ตรวจสอบรายการและจำนวนตาม Ticket' },
    { id: 'lidSecured',     label: 'ปิดฝาเรียบร้อย',  sub: 'ปิดฝาแน่นสนิท ไม่หกเลอะ' },
    { id: 'stickerApplied', label: 'ติดสติกเกอร์',    sub: 'ติดชื่อลูกค้าและเมนูครบ' },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#f8f5f1' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4"
        style={{ height: '56px', background: '#ffffff', borderBottom: '1px solid #ece5da' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}
        >
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 leading-none">Quality Control</p>
          <p className="text-sm font-black text-[#2d241e] truncate">ตรวจสอบคุณภาพ (QC)</p>
        </div>
        <div
          className="shrink-0 px-3 h-8 rounded-xl flex items-center text-xs font-black text-white"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}
        >
          {qcOrders.length} รายการ
        </div>
      </header>

      {/* ══════ DESKTOP (≥ md) two-column ══════ */}
      <div className="hidden md:flex flex-1 overflow-hidden gap-5 p-5">

        {/* Left: order list */}
        <div
          className="w-72 shrink-0 rounded-2xl flex flex-col overflow-hidden"
          style={{ background: '#fff', border: '1px solid #ece5da' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50 px-4 pt-4 pb-2">
            รอตรวจสอบ
          </p>
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-2">
            {paginatedOrders.pageItems.map((order: any) => (
              <button
                key={order.id}
                onClick={() => selectOrder(order)}
                className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-3"
                style={{
                  background: selectedOrder?.id === order.id
                    ? 'linear-gradient(135deg,#eff6ff,#dbeafe)'
                    : '#fdfaf6',
                  border: `1px solid ${selectedOrder?.id === order.id ? '#93c5fd' : '#ece5da'}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    #{order.orderNo?.slice(-4)}
                  </span>
                  <p className="font-black text-sm text-[#2d241e] truncate">
                    {order.customerName || 'ลูกค้า Walk-in'}
                  </p>
                  <p className="text-[10px] text-[#7c543c]/60 font-bold">
                    {order.items?.length} รายการ · {order.platform}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className={selectedOrder?.id === order.id ? 'text-blue-500' : 'text-[#ece5da]'}
                />
              </button>
            ))}
            {qcOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#ece5da]">
                <CheckCircle2 size={40} />
                <p className="mt-3 text-xs font-black uppercase tracking-widest text-center">
                  ตรวจสอบครบแล้ว
                </p>
              </div>
            )}
          </div>
          <div className="px-3 py-3 border-t" style={{ borderColor: '#ece5da' }}>
            <PaginationControls
              page={paginatedOrders.page}
              totalPages={paginatedOrders.totalPages}
              totalItems={paginatedOrders.totalItems}
              pageSize={paginatedOrders.pageSize}
              onPageChange={paginatedOrders.setPage}
              itemLabel="ออเดอร์"
              variant="blue"
            />
          </div>
        </div>

        {/* Right: inspection panel */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="h-full rounded-2xl flex flex-col overflow-hidden"
                style={{ background: '#fff', border: '1px solid #ece5da' }}
              >
                <InspectionContent
                  order={selectedOrder}
                  checkItems={checkItems}
                  checklist={checklist}
                  setChecklist={setChecklist}
                  isComplete={isComplete}
                  updateStatus={updateStatus}
                  setSelectedOrder={setSelectedOrder}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center"
                style={{ color: '#d4c5b0' }}
              >
                <Package size={72} strokeWidth={1} />
                <p className="mt-4 text-xs font-black uppercase tracking-widest">
                  เลือกออเดอร์เพื่อเริ่มการตรวจสอบ
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════ MOBILE (< md) full-width list + bottom sheet ══════ */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        {/* Order list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 no-scrollbar">
          {qcOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#d4c5b0]">
              <CheckCircle2 size={56} strokeWidth={1} />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-center">
                ตรวจสอบครบแล้ว
              </p>
            </div>
          ) : (
            paginatedOrders.pageItems.map((order: any) => (
              <button
                key={order.id}
                onClick={() => selectOrder(order)}
                className="w-full rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98]"
                style={{ background: '#fff', border: '1px solid #ece5da', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                {/* Status dot */}
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}
                >
                  <ShieldCheck size={18} className="text-blue-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                      #{order.orderNo?.slice(-4)}
                    </span>
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: '#fef3c7', color: '#92400e' }}
                    >
                      {order.platform}
                    </span>
                  </div>
                  <p className="font-black text-sm text-[#2d241e]">
                    {order.customerName || 'ลูกค้า Walk-in'}
                  </p>
                  <p className="text-[11px] text-[#7c543c]/60 font-medium mt-0.5">
                    {order.items?.length} รายการ
                  </p>
                </div>

                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
                >
                  <ChevronRight size={16} className="text-[#7c543c]/50" />
                </div>
              </button>
            ))
          )}
          <div className="h-4" />
        </div>

        {/* Pagination (mobile) */}
        {paginatedOrders.totalPages > 1 && (
          <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: '#ece5da', background: '#fff' }}>
            <PaginationControls
              page={paginatedOrders.page}
              totalPages={paginatedOrders.totalPages}
              totalItems={paginatedOrders.totalItems}
              pageSize={paginatedOrders.pageSize}
              onPageChange={paginatedOrders.setPage}
              itemLabel="ออเดอร์"
              variant="blue"
            />
          </div>
        )}
      </div>

      {/* ── Mobile: Inspection Bottom Sheet ─────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              className="relative bg-white rounded-t-[2rem] flex flex-col overflow-hidden"
              style={{
                maxHeight: 'calc(100dvh - 68px)',
                paddingBottom: 'max(1rem, var(--sab, 0px))',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#e8e2db]" />
              </div>

              {/* Sheet header */}
              <div className="px-5 pb-3 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    #{selectedOrder.orderNo?.slice(-4)} · {selectedOrder.platform}
                  </p>
                  <p className="text-lg font-black text-[#2d241e]">
                    {selectedOrder.customerName || 'ลูกค้า Walk-in'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-xl bg-[#f3ece1] flex items-center justify-center text-[#7c543c]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <InspectionContent
                  order={selectedOrder}
                  checkItems={checkItems}
                  checklist={checklist}
                  setChecklist={setChecklist}
                  isComplete={isComplete}
                  updateStatus={updateStatus}
                  setSelectedOrder={setSelectedOrder}
                  isMobile
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Shared inspection content (used in both desktop panel & mobile sheet)
// ─────────────────────────────────────────────────────────
function InspectionContent({
  order,
  checkItems,
  checklist,
  setChecklist,
  isComplete,
  updateStatus,
  setSelectedOrder,
  isMobile = false,
}: any) {
  return (
    <>
      {/* Menu list */}
      <div className="px-5 py-4 space-y-3 border-b" style={{ borderColor: '#ece5da' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50">
          รายการเมนู
        </p>
        {order.items?.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
          >
            <div
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm"
              style={{ background: '#fff', color: '#7c543c', border: '1px solid #ece5da' }}
            >
              ×{item.quantity}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-sm text-[#2d241e] truncate">{item.productName}</p>
              {item.selectedOptions?.length > 0 && (
                <p className="text-[10px] font-medium text-[#7c543c]/60 truncate">
                  {item.selectedOptions.map((o: any) => o.label).join(' · ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className="px-5 py-4 space-y-2.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50 mb-3">
          รายการตรวจสอบ
        </p>
        {checkItems.map((item: any) => {
          const active = checklist[item.id as keyof typeof checklist];
          return (
            <button
              key={item.id}
              onClick={() => setChecklist((prev: any) => ({ ...prev, [item.id]: !prev[item.id] }))}
              className="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all active:scale-[0.98]"
              style={{
                background: active ? '#ecfdf5' : '#fdfaf6',
                border: `1.5px solid ${active ? '#6ee7b7' : '#ece5da'}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all"
                style={{
                  background: active ? '#10b981' : '#fff',
                  border: `2px solid ${active ? '#10b981' : '#d4c5b0'}`,
                }}
              >
                {active && <CheckCircle2 size={16} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-[#2d241e]">{item.label}</p>
                <p className="text-[10px] font-medium text-[#7c543c]/60 mt-0.5">{item.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action button */}
      <div className="px-5 pb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!isComplete}
          onClick={() => {
            updateStatus(order.id, 'READY_FOR_PICKUP');
            setSelectedOrder(null);
          }}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm text-white flex items-center justify-center gap-2 transition-all"
          style={{
            background: isComplete
              ? 'linear-gradient(135deg,#10b981,#059669)'
              : '#e8e2db',
            color: isComplete ? '#ffffff' : '#a09080',
            boxShadow: isComplete ? '0 8px 24px rgba(16,185,129,0.30)' : 'none',
            cursor: isComplete ? 'pointer' : 'not-allowed',
          }}
        >
          <CheckCircle2 size={18} />
          ผ่านการตรวจสอบ
          {isComplete && <ArrowRight size={16} />}
        </motion.button>
      </div>
    </>
  );
}
