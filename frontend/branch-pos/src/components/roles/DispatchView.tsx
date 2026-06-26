import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Package,
  Phone,
  Search,
  Truck,
  User,
} from 'lucide-react';
import { PaginationControls, useClientPagination } from '../Pagination';

function minutesSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

export default function DispatchView({ orders, updateStatus }: any) {
  const readyOrders = orders.filter((o: any) => o.status === 'READY_FOR_PICKUP');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [mobileDetail, setMobileDetail]   = useState(false);
  const [riderInfo, setRiderInfo]         = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm]       = useState('');

  const filteredOrders = readyOrders.filter((o: any) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.orderNo?.toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.riderName || '').toLowerCase().includes(q) ||
      (o.riderPhone || '').toLowerCase().includes(q)
    );
  });

  const paginatedOrders = useClientPagination(filteredOrders, 8, searchTerm.trim().toLowerCase());

  useEffect(() => {
    if (selectedOrder && !filteredOrders.some((o: any) => o.id === selectedOrder.id)) {
      setSelectedOrder(null);
      setMobileDetail(false);
    }
  }, [filteredOrders, selectedOrder]);

  useEffect(() => {
    setSelectedOrder(null);
    setMobileDetail(false);
  }, [paginatedOrders.page]);

  const selectOrder = (order: any) => {
    setSelectedOrder(order);
    setRiderInfo({ name: order.riderName || '', phone: order.riderPhone || '' });
    setMobileDetail(true);
  };

  const confirmDispatch = () => {
    updateStatus(selectedOrder.id, 'DISPATCHED', { riderName: riderInfo.name, riderPhone: riderInfo.phone });
    setSelectedOrder(null);
    setMobileDetail(false);
  };

  /* ── List panel content ───────────────────────────────────────────── */
  const renderList = () => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search */}
      <div className="px-4 py-3 border-b border-orange-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ออเดอร์ / ชื่อไรเดอร์..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-orange-100 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
          />
        </div>
      </div>

      {/* Order cards */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {paginatedOrders.pageItems.map((order: any) => {
          const active = selectedOrder?.id === order.id;
          const mins   = minutesSince(order.updatedAt);
          return (
            <motion.button
              key={order.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => selectOrder(order)}
              className="w-full rounded-2xl border text-left transition-all p-4"
              style={{
                background:   active ? '#ea580c'  : '#ffffff',
                borderColor:  active ? '#ea580c'  : '#fed7aa',
                color:        active ? '#ffffff'  : '#1e293b',
                boxShadow:    active ? '0 8px 24px rgba(234,88,12,0.25)' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Queue badge */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                    style={{ background: active ? 'rgba(255,255,255,0.2)' : '#fff7ed', color: active ? '#fff' : '#ea580c' }}
                  >
                    #{order.orderNo?.slice(-4)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{order.customerName || 'ออเดอร์จัดส่ง'}</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.65)' : '#9a6b4a' }}>
                      {order.items?.length} รายการ · พร้อมส่ง {mins} นาทีที่แล้ว
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                    style={{ background: active ? 'rgba(255,255,255,0.2)' : '#fed7aa', color: active ? '#fff' : '#ea580c' }}
                  >
                    {order.platform || 'STORE'}
                  </span>
                  <ChevronRight size={16} style={{ color: active ? 'rgba(255,255,255,0.5)' : '#fba98a' }} />
                </div>
              </div>
            </motion.button>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center opacity-20">
            <Package size={56} />
            <p className="mt-4 font-black uppercase tracking-widest text-xs">ไม่มีรายการรอรับส่ง</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="shrink-0">
        <PaginationControls
          page={paginatedOrders.page}
          totalPages={paginatedOrders.totalPages}
          totalItems={paginatedOrders.totalItems}
          pageSize={paginatedOrders.pageSize}
          onPageChange={paginatedOrders.setPage}
          itemLabel="ออเดอร์"
          variant="orange"
        />
      </div>
    </div>
  );

  /* ── Detail panel content ─────────────────────────────────────────── */
  const renderDetail = () => {
    if (!selectedOrder) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-200">
          <Truck size={80} strokeWidth={1} />
          <p className="mt-4 font-black uppercase tracking-[0.3em] text-xs">รอการจัดการโลจิสติกส์</p>
        </div>
      );
    }

    const mins = minutesSince(selectedOrder.updatedAt);

    return (
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-orange-50/60 border-b border-orange-100 shrink-0">
          {/* Mobile back */}
          <button
            className="xl:hidden mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-orange-500"
            onClick={() => { setMobileDetail(false); }}
          >
            <ArrowLeft size={15} /> กลับรายการ
          </button>

          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 font-black text-lg">
              #{selectedOrder.orderNo?.slice(-4)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 truncate">
                {selectedOrder.customerName || 'ลูกค้า Delivery'}
              </h2>
              <p className="text-xs font-bold text-orange-600 mt-0.5">ส่งมอบออเดอร์ให้ไรเดอร์</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-orange-100 text-orange-600">
                  {selectedOrder.platform || 'STORE'}
                </span>
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                  <Calendar size={10} /> พร้อมส่ง {mins} นาทีที่แล้ว
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* Order items + QC status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-2">รายการอาหาร / เครื่องดื่ม</p>
              <div className="space-y-1">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <p key={idx} className="text-sm font-bold text-slate-700">
                    ×{item.quantity} {item.productName || item.product?.name || item.name}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-2">สถานะการตรวจสอบ</p>
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                <CheckCircle2 size={16} /> ผ่านการตรวจสอบ QC
              </div>
              <p className="text-[10px] font-bold text-gray-400 mt-1">ตรวจสอบโดยหัวหน้าสาขาแล้ว</p>
            </div>
          </div>

          {/* Rider form */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ข้อมูลไรเดอร์</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-500 ml-1">ชื่อไรเดอร์</label>
                <div className="mt-1 relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-300" size={16} />
                  <input
                    type="text"
                    placeholder="เช่น G-1234 (สมศักดิ์)"
                    value={riderInfo.name}
                    onChange={e => setRiderInfo({ ...riderInfo, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-orange-50/40 rounded-2xl border border-orange-100 font-bold text-sm outline-none focus:border-orange-300"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 ml-1">เบอร์โทรศัพท์</label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-300" size={16} />
                  <input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={riderInfo.phone}
                    onChange={e => setRiderInfo({ ...riderInfo, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-orange-50/40 rounded-2xl border border-orange-100 font-bold text-sm outline-none focus:border-orange-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Policy notice */}
          <div className="rounded-2xl border-2 border-dashed border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 italic">
              "Dispatcher ต้องตรวจสอบเลขที่ออเดอร์ในแอปของไรเดอร์ให้ตรงกันก่อนส่งมอบสินค้า"
            </p>
          </div>
        </div>

        {/* Confirm CTA — sticky bottom */}
        <div className="px-4 sm:px-6 py-4 border-t border-orange-100 shrink-0">
          <button
            onClick={confirmDispatch}
            className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-lg shadow-orange-900/20 hover:bg-orange-700 active:scale-[0.98] transition-all"
          >
            ยืนยันการส่งมอบ
          </button>
        </div>
      </div>
    );
  };

  /* ── Root layout ─────────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col bg-[#fdfaf6]">
      {/* Header */}
      <div className="h-16 bg-white border-b border-orange-100 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Truck size={22} className="text-orange-500" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-widest text-slate-800">การจัดส่ง / โลจิสติกส์</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">รอไรเดอร์มารับ</p>
          <p className="text-xl font-black text-orange-600">{readyOrders.length}</p>
        </div>
      </div>

      {/* ── Mobile: slide panels (< xl) ──────────────────────────────── */}
      <div className="xl:hidden flex-1 min-h-0 relative overflow-hidden">
        {/* List */}
        <AnimatePresence initial={false}>
          {!mobileDetail && (
            <motion.div
              key="list"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="absolute inset-0 bg-[#fdfaf6] overflow-hidden"
            >
              {renderList()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail */}
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

      {/* ── Desktop: side-by-side (xl+) ──────────────────────────────── */}
      <div className="hidden xl:flex flex-1 min-h-0 p-6 gap-6">
        <aside className="w-[360px] shrink-0 bg-white rounded-[2rem] border border-orange-100 shadow-sm overflow-hidden">
          {renderList()}
        </aside>
        <section className="flex-1 min-w-0 bg-white rounded-[2rem] border border-orange-100 shadow-sm overflow-hidden">
          {renderDetail()}
        </section>
      </div>
    </div>
  );
}
