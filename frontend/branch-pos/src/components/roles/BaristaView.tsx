import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  Loader2,
  PackageCheck,
  Play,
  Search,
  Timer,
} from 'lucide-react';

const STATUS_COPY: Record<string, { label: string; tone: string; dot: string }> = {
  PAID:      { label: 'รอเริ่มทำ', tone: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  PREPARING: { label: 'กำลังทำ',  tone: 'bg-blue-50 text-blue-800 border-blue-200',   dot: 'bg-blue-500'  },
};

function minutesSince(date?: string) {
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
}
function itemName(item: any) {
  return item.productName || item.product?.name || item.name || 'สินค้า';
}
function itemOptions(item: any): string[] {
  if (!Array.isArray(item.selectedOptions)) return [];
  return item.selectedOptions
    .map((o: any) => o?.label || o?.name || o?.optionName)
    .filter(Boolean);
}

export default function BaristaView({ orders, updateStatus }: any) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  /** Mobile: show detail panel instead of list */
  const [mobileDetail, setMobileDetail] = useState(false);
  const [filter, setFilter]             = useState<'ALL' | 'WAITING' | 'ACTIVE'>('ALL');
  const [search, setSearch]             = useState('');
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [, setNowTick]                  = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((v) => v + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const baristaOrders = useMemo(() =>
    orders
      .filter((o: any) => o.status === 'PAID' || o.status === 'PREPARING')
      .sort((a: any, b: any) => {
        if (a.status !== b.status) return a.status === 'PREPARING' ? -1 : 1;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }),
  [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baristaOrders.filter((o: any) => {
      if (filter === 'WAITING' && o.status !== 'PAID')      return false;
      if (filter === 'ACTIVE'  && o.status !== 'PREPARING') return false;
      if (!q) return true;
      return (
        o.orderNo?.toLowerCase().includes(q) ||
        String(o.queueNo || '').includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.items || []).some((item: any) => itemName(item).toLowerCase().includes(q))
      );
    });
  }, [baristaOrders, filter, search]);

  const selectedOrder =
    filteredOrders.find((o: any) => o.id === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  useEffect(() => {
    if (!selectedOrder) { setSelectedOrderId(null); return; }
    if (selectedOrder.id !== selectedOrderId) setSelectedOrderId(selectedOrder.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder?.id]);

  const waitingCount = baristaOrders.filter((o: any) => o.status === 'PAID').length;
  const activeCount  = baristaOrders.filter((o: any) => o.status === 'PREPARING').length;
  const itemCount    = selectedOrder?.items?.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0) || 0;

  const changeStatus = async (order: any, status: 'PREPARING' | 'READY_FOR_QC') => {
    if (!order || updatingId) return;
    setUpdatingId(order.id);
    try {
      await updateStatus(order.id, status);
      if (status === 'READY_FOR_QC') {
        const next = filteredOrders.find((c: any) => c.id !== order.id);
        setSelectedOrderId(next?.id || null);
        if (!next) setMobileDetail(false);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Shared list panel content ──────────────────────────────────────── */
  const renderList = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[#eadfce] space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a6b4a]/60" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาคิว / เมนู / ลูกค้า"
            className="w-full h-11 pl-10 pr-3 rounded-2xl bg-[#fbf6ef] border border-[#eadfce] outline-none text-sm font-semibold text-[#241711]"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <FilterButton active={filter === 'ALL'}     onClick={() => setFilter('ALL')}     label="ทั้งหมด" />
          <FilterButton active={filter === 'WAITING'} onClick={() => setFilter('WAITING')} label="รอเริ่ม" />
          <FilterButton active={filter === 'ACTIVE'}  onClick={() => setFilter('ACTIVE')}  label="กำลังทำ" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        <AnimatePresence initial={false}>
          {filteredOrders.map((order: any) => (
            <TicketButton
              key={order.id}
              order={order}
              active={selectedOrder?.id === order.id}
              onClick={() => {
                setSelectedOrderId(order.id);
                setMobileDetail(true);
              }}
            />
          ))}
        </AnimatePresence>
        {filteredOrders.length === 0 && (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-[#9a6b4a]/35 text-center">
            <Coffee size={54} strokeWidth={1.5} />
            <p className="mt-4 text-sm font-black uppercase tracking-widest">ยังไม่มีออเดอร์</p>
            <p className="mt-1 text-xs font-semibold">ออเดอร์ที่ชำระแล้วจะเข้ามาที่นี่</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Shared detail panel content ────────────────────────────────────── */
  const renderDetail = () => {
    if (!selectedOrder) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-[#9a6b4a]/35">
          <Coffee size={82} strokeWidth={1.2} />
          <p className="mt-4 text-sm font-black uppercase tracking-widest">พร้อมรับออเดอร์</p>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        {/* Order header */}
        <div className="px-4 py-4 border-b border-[#eadfce] bg-[#fffaf4] shrink-0">
          {/* Mobile back button */}
          <button
            className="xl:hidden mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#9a6b4a]"
            onClick={() => setMobileDetail(false)}
          >
            <ArrowLeft size={16} /> กลับรายการ
          </button>

          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-[1.25rem] bg-[#ea580c] text-white flex items-center justify-center shrink-0">
              <span className="text-3xl font-black tracking-[-0.06em]">#{selectedOrder.queueNo || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={selectedOrder.status} />
                <span className="inline-flex h-7 px-2.5 rounded-xl bg-white border border-[#eadfce] items-center text-[10px] font-black uppercase tracking-widest text-[#9a6b4a]">
                  {selectedOrder.platform || 'STORE'}
                </span>
              </div>
              <h2 className="mt-1.5 text-2xl font-black tracking-tight truncate">
                {selectedOrder.customerName || 'ลูกค้าหน้าร้าน'}
              </h2>
              <p className="mt-0.5 text-xs font-bold text-[#9a6b4a]">
                {selectedOrder.orderNo} · {itemCount} ชิ้น · เข้ามา {minutesSince(selectedOrder.createdAt)} นาที
              </p>
            </div>
            {/* Desktop only metrics */}
            <div className="hidden lg:flex gap-3 shrink-0">
              <DetailMetric icon={<Timer size={16} />}       label="เวลารอ"  value={`${minutesSince(selectedOrder.createdAt)} นาที`} />
              <DetailMetric icon={<PackageCheck size={16} />} label="จำนวน" value={`${itemCount} ชิ้น`} />
            </div>
          </div>
        </div>

        {/* Scrollable body — items + note + steps */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {/* Special note */}
          {selectedOrder.note && (
            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle size={17} />
                <p className="text-[10px] font-black uppercase tracking-widest">หมายเหตุ</p>
              </div>
              <p className="mt-2 text-sm font-bold text-rose-900">{selectedOrder.note}</p>
            </div>
          )}

          {/* Drink list */}
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9a6b4a]">รายการเครื่องดื่ม</p>
          {(selectedOrder.items || []).map((item: any, index: number) => (
            <DrinkLine key={`${item.id || index}`} item={item} />
          ))}

          {/* Steps — hidden on xs to save space */}
          <div className="hidden sm:block rounded-[1.25rem] bg-[#fbf6ef] border border-[#eadfce] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9a6b4a] mb-3">ขั้นตอนการทำงาน</p>
            <div className="space-y-2">
              <StepRow done={selectedOrder.status === 'PREPARING'} label="เริ่มทำเครื่องดื่ม" />
              <StepRow done={false} label="ตรวจรายการและส่ง QC" />
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="p-4 border-t border-[#eadfce] bg-[#fffaf4] shrink-0">
          {selectedOrder.status === 'PAID' ? (
            <button
              disabled={updatingId === selectedOrder.id}
              onClick={() => changeStatus(selectedOrder, 'PREPARING')}
              className="w-full h-14 rounded-2xl bg-[#ea580c] text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updatingId === selectedOrder.id ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              เริ่มทำเครื่องดื่ม
            </button>
          ) : (
            <button
              disabled={updatingId === selectedOrder.id}
              onClick={() => changeStatus(selectedOrder, 'READY_FOR_QC')}
              className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updatingId === selectedOrder.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              ทำเสร็จแล้ว ส่งไป QC
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ── Root ───────────────────────────────────────────────────────────── */
  return (
    <div className="h-full overflow-hidden bg-[#f7f3ec] text-[#241711] flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#eadfce] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#ea580c] text-white flex items-center justify-center shadow-sm">
            <Coffee size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9a6b4a]">Barista Station</p>
            <h1 className="text-xl font-black tracking-tight truncate">จอเตรียมเครื่องดื่ม</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Metric label="รอเริ่ม" value={waitingCount} tone="amber" />
          <Metric label="กำลังทำ" value={activeCount}  tone="blue"  />
        </div>
      </header>

      {/* ── Mobile: slide panels (< xl) ─────────────────────────────────── */}
      <div className="xl:hidden relative flex-1 min-h-0 overflow-hidden">
        {/* List panel */}
        <AnimatePresence initial={false}>
          {!mobileDetail && (
            <motion.div
              key="list"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="absolute inset-0 bg-white overflow-hidden"
            >
              {renderList()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail panel */}
        <AnimatePresence initial={false}>
          {mobileDetail && (
            <motion.div
              key="detail"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="absolute inset-0 bg-white overflow-hidden"
            >
              {renderDetail()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop: side-by-side (xl+) ─────────────────────────────────── */}
      <div className="hidden xl:flex flex-1 min-h-0 p-5 gap-5">
        <aside className="w-[390px] shrink-0 bg-white rounded-[1.5rem] border border-[#eadfce] shadow-sm overflow-hidden">
          {renderList()}
        </aside>
        <section className="flex-1 min-w-0 bg-white rounded-[1.5rem] border border-[#eadfce] shadow-sm overflow-hidden">
          {renderDetail()}
        </section>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function Metric({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'blue' }) {
  const color  = tone === 'amber' ? '#d97706' : '#2563eb';
  const bg     = tone === 'amber' ? '#fffbeb' : '#eff6ff';
  const border = tone === 'amber' ? '#fde68a' : '#bfdbfe';
  return (
    <div
      className="h-11 min-w-[80px] sm:min-w-[96px] px-3 rounded-2xl flex items-center justify-between gap-2 sm:gap-3 border"
      style={{ background: bg, borderColor: border }}
    >
      <span className="text-[10px] font-black uppercase tracking-widest text-[#6b4b35]">{label}</span>
      <span className="text-xl font-black tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="h-9 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors"
      style={{ background: active ? '#241711' : '#fbf6ef', color: active ? '#ffffff' : '#6b4b35', border: '1px solid #eadfce' }}
    >
      {label}
    </button>
  );
}

function TicketButton({ order, active, onClick }: { order: any; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      onClick={onClick}
      className="w-full rounded-[1.25rem] p-3 text-left border transition-colors"
      style={{ background: active ? '#fff7ed' : '#ffffff', borderColor: active ? '#fb923c' : '#eadfce' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#241711] text-white flex items-center justify-center font-black text-lg shrink-0">
            #{order.queueNo || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm text-[#241711] truncate">{order.customerName || 'ลูกค้าหน้าร้าน'}</p>
            <p className="text-[10px] font-bold text-[#9a6b4a] truncate">
              {(order.items || []).slice(0, 2).map(itemName).join(', ')}
            </p>
          </div>
        </div>
        <ChevronRight className={active ? 'text-[#ea580c]' : 'text-[#d6c5b5]'} size={18} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <StatusPill status={order.status} />
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#9a6b4a]">
          <Clock size={11} /> {minutesSince(order.createdAt)} นาที
        </span>
      </div>
    </motion.button>
  );
}

function StatusPill({ status }: { status: string }) {
  const copy = STATUS_COPY[status] || STATUS_COPY.PAID;
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 px-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${copy.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${copy.dot}`} />
      {copy.label}
    </span>
  );
}

function DetailMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="w-32 rounded-2xl bg-white border border-[#eadfce] p-3">
      <div className="flex items-center gap-2 text-[#9a6b4a]">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-1 text-lg font-black text-[#241711]">{value}</p>
    </div>
  );
}

function DrinkLine({ item }: { item: any }) {
  const options = itemOptions(item);
  return (
    <div className="rounded-[1.25rem] border border-[#eadfce] bg-white p-4 flex items-start gap-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] flex items-center justify-center font-black text-xl shrink-0">
        x{item.quantity || 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg sm:text-xl font-black tracking-tight text-[#241711] leading-tight">
          {itemName(item)}
        </p>
        {options.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.map((opt, i) => (
              <span
                key={`${opt}-${i}`}
                className="inline-flex h-7 items-center rounded-xl bg-[#fbf6ef] border border-[#eadfce] px-2.5 text-xs font-bold text-[#6b4b35]"
              >
                {opt}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#eadfce] p-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : 'bg-[#fbf6ef] text-[#b9a28d]'}`}>
        {done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
      </div>
      <p className="text-sm font-black text-[#241711]">{label}</p>
    </div>
  );
}
