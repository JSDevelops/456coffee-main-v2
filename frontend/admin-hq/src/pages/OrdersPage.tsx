import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Clock,
  CreditCard,
  Coffee,
  Check,
  Package,
  Truck,
  Store,
  Ban,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Calendar,
  Filter,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
  ChevronRight,
  Wallet,
  Printer,
} from 'lucide-react';
import { api } from '../api';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  Select,
  Skeleton,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productId: string;
  product?: { name: string; imageUrl?: string };
  productName?: string;
  quantity: number;
  price: number;
  unitPrice: number;
  optionsPrice: number;
  selectedOptions?: any;
}
interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string;
  paidAt?: string | null;
}
interface Order {
  id: string;
  orderNo: string;
  branchId: string;
  branch?: { id: string; name: string };
  customerUid: string;
  customerName?: string | null;
  totalAmount: number;
  status: string;
  fulfillmentType: string;
  note?: string | null;
  items: OrderItem[];
  payment?: Payment;
  createdAt: string;
}
interface Branch {
  id: string;
  name: string;
}
interface OrderStats {
  total: number;
  todayCount: number;
  todayRevenue: number;
  totalRevenue: number;
  byStatus: Record<string, number>;
}
interface OrderListResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────

const STATUS_FLOW = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY_FOR_QC',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'PICKED_UP',
];

const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number }> }
> = {
  PENDING:          { label: 'รอชำระ',      color: '#d97706', bg: 'rgba(217,119,6,0.12)',  icon: Clock },
  PAID:             { label: 'ชำระแล้ว',    color: '#0891b2', bg: 'rgba(8,145,178,0.12)',  icon: CreditCard },
  PREPARING:        { label: 'กำลังทำ',     color: '#ea580c', bg: 'rgba(234,88,12,0.12)',  icon: Coffee },
  READY_FOR_QC:     { label: 'รอตรวจ',     color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: Check },
  READY_FOR_PICKUP: { label: 'พร้อมรับ',   color: '#10b981', bg: 'rgba(16,185,129,0.14)', icon: Package },
  DISPATCHED:       { label: 'จัดส่งแล้ว', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Truck },
  COMPLETED:        { label: 'เสร็จสิ้น',  color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: Check },
  PICKED_UP:        { label: 'รับแล้ว',    color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: Truck },
  CANCELLED:        { label: 'ยกเลิก',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)',icon: Ban },
};

const PAYMENT_METHODS = ['CASH', 'QR', 'TRANSFER', 'ONLINE'] as const;
const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'เงินสด', QR: 'QR Code', TRANSFER: 'โอนเงิน', ONLINE: 'Online',
};

const FULFILLMENT_TYPES = ['PICKUP', 'DELIVERY'] as const;
const FULFILLMENT_LABEL: Record<string, string> = {
  PICKUP: 'รับที่ร้าน',
  DELIVERY: 'จัดส่ง',
};

type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'all';
const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today',     label: 'วันนี้' },
  { id: 'yesterday', label: 'เมื่อวาน' },
  { id: '7d',        label: '7 วัน' },
  { id: '30d',       label: '30 วัน' },
  { id: 'all',       label: 'ทั้งหมด' },
];

type SortKey = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc';
const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'newest',      label: 'ใหม่สุดก่อน' },
  { id: 'oldest',      label: 'เก่าสุดก่อน' },
  { id: 'amount-desc', label: 'ยอดเงินมาก→น้อย' },
  { id: 'amount-asc',  label: 'ยอดเงินน้อย→มาก' },
];

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec} วิ`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาที`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} วัน`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function dateForPreset(preset: DatePreset): string | undefined {
  if (preset === 'all') return undefined;
  const d = new Date();
  if (preset === 'today') return d.toISOString().slice(0, 10);
  if (preset === 'yesterday') {
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  // 7d / 30d → undefined (filter client-side via dateAfter)
  return undefined;
}

function dateAfterForPreset(preset: DatePreset): Date | undefined {
  if (preset === '7d') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (preset === '30d') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
  return undefined;
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const toast = useToast();

  // ─── State ────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [branchId, setBranchId] = useState<string>('');
  const [statusSet, setStatusSet] = useState<Set<string>>(new Set());
  const [paymentSet, setPaymentSet] = useState<Set<string>>(new Set());
  const [fulfillmentSet, setFulfillmentSet] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // UI
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, datePreset, branchId, statusSet, paymentSet, fulfillmentSet, sortKey, pageSize]);

  useEffect(() => {
    api.get<Branch[]>('/branches/admin')
      .then(setBranches)
      .catch((e: any) => toast.error(e?.message || 'โหลดสาขาไม่สำเร็จ'));
  }, [toast]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await api.get<OrderStats>(`/orders/stats${branchId ? `?branchId=${branchId}` : ''}`);
      setStats(statsData);
    } catch (e: any) {
      toast.error(e?.message || 'โหลดสถิติไม่สำเร็จ');
    }
  }, [branchId, toast]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchId) params.set('branchId', branchId);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const date = dateForPreset(datePreset);
      if (date) params.set('date', date);
      const dateAfter = dateAfterForPreset(datePreset);
      if (dateAfter) params.set('dateFrom', dateAfter.toISOString());
      if (statusSet.size > 0) params.set('status', Array.from(statusSet).join(','));
      if (paymentSet.size > 0) params.set('paymentMethod', Array.from(paymentSet).join(','));
      if (fulfillmentSet.size > 0) params.set('fulfillmentType', Array.from(fulfillmentSet).join(','));
      params.set('sort', sortKey);
      params.set('page', String(page));
      params.set('limit', String(pageSize));

      const ordersData = await api.get<OrderListResponse>(`/orders?${params}`);
      setOrders(ordersData.data);
      setMeta(ordersData.meta);
    } catch (e: any) {
      toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [
    branchId,
    debouncedSearch,
    datePreset,
    fulfillmentSet,
    page,
    pageSize,
    paymentSet,
    sortKey,
    statusSet,
    toast,
  ]);

  const fetchAll = useCallback(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Client-side filtering + sorting ───────────────────────────────────
  const filteredOrders = orders;

  const selected = filteredOrders.find((o) => o.id === selectedId) || orders.find((o) => o.id === selectedId) || null;

  // ─── Filter helpers ────────────────────────────────────────────────────
  const toggleSet = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    (datePreset !== 'today' ? 1 : 0) +
    (branchId ? 1 : 0) +
    statusSet.size +
    paymentSet.size +
    fulfillmentSet.size +
    (sortKey !== 'newest' ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setDatePreset('today');
    setBranchId('');
    setStatusSet(new Set());
    setPaymentSet(new Set());
    setFulfillmentSet(new Set());
    setSortKey('newest');
    setPage(1);
  };

  // ─── Mutations ─────────────────────────────────────────────────────────
  const advance = async (id: string, next: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: next });
      toast.success(`สถานะ → ${STATUS_CFG[next]?.label || next}`);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'อัปเดตไม่สำเร็จ');
    }
  };
  const cancel = async (id: string) => {
    if (!confirm('ยกเลิกออเดอร์นี้?')) return;
    try {
      await api.patch(`/orders/${id}/cancel`, {});
      toast.success('ยกเลิกออเดอร์สำเร็จ');
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'ยกเลิกไม่สำเร็จ');
    }
  };
  const confirmPayment = async (id: string) => {
    try {
      await api.patch(`/orders/${id}/payment`, { status: 'PAID' });
      toast.success('ยืนยันชำระเงินสำเร็จ');
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'ยืนยันไม่สำเร็จ');
    }
  };
  const printReceipt = (order: Order) => {
    const escapeHtml = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const items = order.items
      .map((item) => {
        const name = escapeHtml(item.productName || item.product?.name || 'สินค้า');
        const options = (() => {
          try {
            const raw = typeof item.selectedOptions === 'string'
              ? JSON.parse(item.selectedOptions)
              : item.selectedOptions || [];
            return Array.isArray(raw)
              ? raw.map((o: any) => o.label || o.name).filter(Boolean).map(escapeHtml).join(', ')
              : '';
          } catch {
            return '';
          }
        })();
        return `
          <div class="item">
            <div>
              <strong>×${item.quantity} ${name}</strong>
              ${options ? `<small>${options}</small>` : ''}
            </div>
            <strong>฿${Number(item.price || 0).toLocaleString()}</strong>
          </div>`;
      })
      .join('');
    const w = window.open('', '_blank', 'width=420,height=720');
    if (!w) {
      toast.error('เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต popup');
      return;
    }
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt ${order.orderNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; margin: 0; padding: 12px; font-family: Arial, sans-serif; color: #111827; }
            h1 { text-align: center; margin: 0; font-size: 18px; }
            .center { text-align: center; }
            .muted { color: #6b7280; font-size: 10px; }
            .queue { text-align: center; font-size: 42px; font-weight: 900; color: #ea580c; line-height: 1; margin-top: 8px; }
            .line { border-top: 1px dashed #9ca3af; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin-bottom: 8px; break-inside: avoid; }
            .item small { display: block; color: #6b7280; margin-top: 2px; }
            .row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin: 4px 0; }
            .total { font-size: 14px; font-weight: 900; }
            .thanks { text-align: center; color: #6b7280; font-size: 10px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <h1>456 Coffee</h1>
          <div class="center muted">${escapeHtml(order.branch?.name || 'สาขาหลัก')}</div>
          <div class="center muted">${new Date(order.createdAt).toLocaleString('th-TH')}</div>
          <div class="queue">#${escapeHtml((order as any).queueNo || '-')}</div>
          <div class="center muted">${escapeHtml(order.orderNo)}</div>
          <div class="line"></div>
          ${items}
          <div class="line"></div>
          <div class="row total"><span>ยอดรวม</span><span>฿${order.totalAmount.toLocaleString()}</span></div>
          <div class="row muted"><span>วิธีชำระเงิน</span><span>${escapeHtml(order.payment ? PAYMENT_LABEL[order.payment.method] || order.payment.method : '-')}</span></div>
          <div class="row muted"><span>สถานะ</span><span>${order.payment?.status === 'PAID' ? 'ชำระแล้ว' : 'รอชำระ'}</span></div>
          ${order.note ? `<div class="line"></div><div class="muted">หมายเหตุ: ${escapeHtml(order.note)}</div>` : ''}
          <div class="thanks">ขอบคุณที่ใช้บริการ</div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 400); };</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const handleExportCsv = () => {
    if (!orders || orders.length === 0) {
      toast.error('ไม่มีข้อมูลออเดอร์สำหรับ Export');
      return;
    }

    const headers = [
      'Order No',
      'Date/Time',
      'Branch',
      'Customer',
      'Items Count',
      'Items Detail',
      'Total Amount (THB)',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Fulfillment',
    ];

    const rows = orders.map((o) => {
      const branchName = o.branch?.name || '-';
      const customer = o.customerName || o.customerUid || '-';
      const itemsCount = o.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0;
      const itemsDetail = (o.items || [])
        .map((it) => `${it.product?.name || it.productName || 'สินค้า'} x${it.quantity}`)
        .join('; ');
      const paymentMethod = o.payment?.method || '-';
      const paymentStatus = o.payment?.status || '-';
      const dateStr = new Date(o.createdAt).toLocaleString('th-TH');

      return [
        `"${o.orderNo}"`,
        `"${dateStr}"`,
        `"${branchName.replace(/"/g, '""')}"`,
        `"${customer.replace(/"/g, '""')}"`,
        itemsCount,
        `"${itemsDetail.replace(/"/g, '""')}"`,
        o.totalAmount.toFixed(2),
        `"${paymentMethod}"`,
        `"${paymentStatus}"`,
        `"${o.status}"`,
        `"${o.fulfillmentType || '-'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `456coffee_orders_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`ส่งออก ${orders.length} ออเดอร์เป็นไฟล์ CSV สำเร็จ`);
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title="ออเดอร์ทั้งหมด"
        description={`${meta.total.toLocaleString()} ออเดอร์ตรงตามตัวกรอง · ทั้งหมดในระบบ ${(stats?.total ?? 0).toLocaleString()}`}
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={fetchAll}>
              รีเฟรช
            </Button>
            <Button variant="secondary" leftIcon={<Download size={14} />} onClick={handleExportCsv}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* Stats strip */}
      <StatsStrip stats={stats} loading={loading} />

      {/* Filter section */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        branchId={branchId}
        onBranchChange={setBranchId}
        branches={branches}
        statusSet={statusSet}
        onToggleStatus={(s) => toggleSet(statusSet, s, setStatusSet)}
        paymentSet={paymentSet}
        onTogglePayment={(p) => toggleSet(paymentSet, p, setPaymentSet)}
        fulfillmentSet={fulfillmentSet}
        onToggleFulfillment={(f) => toggleSet(fulfillmentSet, f, setFulfillmentSet)}
        sortKey={sortKey}
        onSortChange={setSortKey}
        activeCount={activeFilterCount}
        onReset={resetFilters}
      />

      {/* Orders table */}
      <OrdersTable
        orders={filteredOrders}
        loading={loading}
        onSelect={(o) => {
          setSelectedId(o.id);
          setDrawerOpen(true);
        }}
        sortKey={sortKey}
        onSortChange={setSortKey}
        page={meta.page}
        pageSize={meta.limit}
        total={meta.total}
        totalPages={meta.totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Detail drawer */}
      <Drawer
        open={drawerOpen && !!selected}
        onClose={() => setDrawerOpen(false)}
        width="lg"
      >
        {selected && (
          <OrderDetail
            order={selected}
            onAdvance={advance}
            onCancel={cancel}
            onConfirmPayment={confirmPayment}
            onPrint={printReceipt}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </Drawer>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Stats strip
// ──────────────────────────────────────────────────────────────────────────

function StatsStrip({ stats, loading }: { stats: OrderStats | null; loading: boolean }) {
  const items = [
    { label: 'วันนี้', value: stats?.todayCount ?? 0, sub: `฿${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: Activity, color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
    { label: 'รอชำระ', value: stats?.byStatus?.PENDING ?? 0, sub: 'ต้องดำเนินการ', icon: Clock, color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
    { label: 'กำลังทำ', value: stats?.byStatus?.PREPARING ?? 0, sub: 'อยู่ในครัว', icon: Coffee, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    { label: 'พร้อมรับ', value: stats?.byStatus?.READY_FOR_PICKUP ?? 0, sub: 'รอลูกค้ารับ', icon: Package, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'รายได้รวม', value: `฿${(stats?.totalRevenue ?? 0).toLocaleString()}`, sub: 'all-time', icon: TrendingUp, color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((it, idx) => {
        const Icon = it.icon;
        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
          >
            <Card padded className="relative overflow-hidden">
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: it.bg }}
              />
              <div className="relative flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: it.bg, color: it.color }}
                >
                  <Icon size={16} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {it.label}
                </p>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-2/3" />
              ) : (
                <p className="relative text-2xl font-bold tracking-tight num truncate" style={{ color: 'var(--text)' }}>
                  {typeof it.value === 'number' ? it.value.toLocaleString() : it.value}
                </p>
              )}
              <p className="relative text-[11px] mt-1 num" style={{ color: 'var(--text-faint)' }}>
                {it.sub}
              </p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Filter bar
// ──────────────────────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  datePreset: DatePreset;
  onDatePresetChange: (d: DatePreset) => void;
  branchId: string;
  onBranchChange: (id: string) => void;
  branches: Branch[];
  statusSet: Set<string>;
  onToggleStatus: (s: string) => void;
  paymentSet: Set<string>;
  onTogglePayment: (p: string) => void;
  fulfillmentSet: Set<string>;
  onToggleFulfillment: (f: string) => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  activeCount: number;
  onReset: () => void;
}

function FilterBar(props: FilterBarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  return (
    <Card padded className="mb-4">
      {/* Top row: search + date preset + branch + sort */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            placeholder="ค้นหาเลขออเดอร์ / ชื่อลูกค้า..."
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date pills */}
          <div
            className="inline-flex h-10 items-center rounded-xl p-1"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {DATE_PRESETS.map((p) => {
              const active = props.datePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => props.onDatePresetChange(p.id)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                  style={{
                    background: active ? 'var(--surface)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {p.id === 'today' && <Calendar size={11} />}
                  {p.label}
                </button>
              );
            })}
          </div>

          <Select
            containerClassName="min-w-[140px]"
            value={props.branchId}
            onChange={(e) => props.onBranchChange(e.target.value)}
          >
            <option value="">ทุกสาขา</option>
            {props.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Select
            containerClassName="min-w-[160px]"
            value={props.sortKey}
            onChange={(e) => props.onSortChange(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>

          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all"
            style={{
              background: advancedOpen ? 'var(--accent-soft)' : 'var(--surface-2)',
              color: advancedOpen ? 'var(--accent)' : 'var(--text-2)',
              border: `1px solid ${advancedOpen ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <Filter size={14} />
            ตัวกรองเพิ่มเติม
            {props.activeCount > 0 && (
              <span
                className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                {props.activeCount}
              </span>
            )}
          </button>

          {props.activeCount > 0 && (
            <button
              onClick={props.onReset}
              className="h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all"
              style={{ color: 'var(--danger)' }}
            >
              <X size={14} />
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {advancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="mt-4 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-5"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {/* Status chips */}
              <FilterChipGroup
                label="สถานะออเดอร์"
                options={Object.entries(STATUS_CFG).map(([k, v]) => ({
                  id: k,
                  label: v.label,
                  color: v.color,
                  bg: v.bg,
                }))}
                selectedSet={props.statusSet}
                onToggle={props.onToggleStatus}
              />

              {/* Fulfillment */}
              <FilterChipGroup
                label="ประเภทการรับ"
                options={FULFILLMENT_TYPES.map((f) => ({
                  id: f,
                  label: FULFILLMENT_LABEL[f],
                  color: 'var(--info)',
                  bg: 'var(--info-soft)',
                  icon: f === 'DELIVERY' ? <Truck size={11} /> : <Store size={11} />,
                }))}
                selectedSet={props.fulfillmentSet}
                onToggle={props.onToggleFulfillment}
              />

              {/* Payment method */}
              <FilterChipGroup
                label="วิธีชำระเงิน"
                options={PAYMENT_METHODS.map((p) => ({
                  id: p,
                  label: PAYMENT_LABEL[p],
                  color: 'var(--accent)',
                  bg: 'var(--accent-soft)',
                  icon: <Wallet size={11} />,
                }))}
                selectedSet={props.paymentSet}
                onToggle={props.onTogglePayment}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function FilterChipGroup({
  label,
  options,
  selectedSet,
  onToggle,
}: {
  label: string;
  options: { id: string; label: string; color: string; bg: string; icon?: React.ReactNode }[];
  selectedSet: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selectedSet.has(o.id);
          return (
            <button
              key={o.id}
              onClick={() => onToggle(o.id)}
              className="h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
              style={{
                background: active ? o.bg : 'var(--surface-2)',
                color: active ? o.color : 'var(--text-muted)',
                border: `1px solid ${active ? o.color : 'var(--border)'}`,
              }}
            >
              {o.icon}
              {o.label}
              {active && <X size={11} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Orders table
// ──────────────────────────────────────────────────────────────────────────

function OrdersTable({
  orders,
  loading,
  onSelect,
  sortKey,
  onSortChange,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  orders: Order[];
  loading: boolean;
  onSelect: (o: Order) => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <Card padded={false} className="overflow-hidden">
      {loading ? (
        <div className="p-5 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title="ไม่พบออเดอร์"
          description="ลองล้างตัวกรองหรือเปลี่ยนช่วงเวลา"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                <th className="pl-5 pr-3 py-3 w-10" />
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  ออเดอร์
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  ลูกค้า
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  สาขา
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  ประเภท
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  สถานะ
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  ชำระ
                </th>
                <th
                  className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-right cursor-pointer select-none"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() =>
                    onSortChange(sortKey === 'amount-desc' ? 'amount-asc' : 'amount-desc')
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    ยอดเงิน
                    {sortKey === 'amount-desc' ? (
                      <ArrowDown size={10} />
                    ) : sortKey === 'amount-asc' ? (
                      <ArrowUp size={10} />
                    ) : (
                      <ArrowUpDown size={10} />
                    )}
                  </span>
                </th>
                <th
                  className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-right cursor-pointer select-none"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() =>
                    onSortChange(sortKey === 'newest' ? 'oldest' : 'newest')
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    เวลา
                    {sortKey === 'newest' ? (
                      <ArrowDown size={10} />
                    ) : sortKey === 'oldest' ? (
                      <ArrowUp size={10} />
                    ) : (
                      <ArrowUpDown size={10} />
                    )}
                  </span>
                </th>
                <th className="pl-3 pr-5 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {orders.map((o, idx) => {
                  const cfg = STATUS_CFG[o.status] || STATUS_CFG.PENDING;
                  const StatusIcon = cfg.icon;
                  const initial = (o.customerName || o.customerUid || '?').charAt(0).toUpperCase();
                  const paid = o.payment?.status === 'PAID';
                  return (
                    <motion.tr
                      key={o.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      className="cursor-pointer transition-colors group"
                      style={{ borderTop: '1px solid var(--border)' }}
                      onClick={() => onSelect(o)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Status indicator dot */}
                      <td className="pl-5 pr-3 py-3.5">
                        <span
                          className="block w-2 h-2 rounded-full"
                          style={{ background: cfg.color }}
                        />
                      </td>

                      {/* Order number */}
                      <td className="px-3 py-3.5">
                        <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>
                          {o.orderNo}
                        </p>
                        <p className="text-[10px] num" style={{ color: 'var(--text-faint)' }}>
                          #{o.id.slice(0, 8)}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0"
                            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                              {o.customerName || 'ลูกค้าหน้าร้าน'}
                            </p>
                            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                              {o.items.length} รายการ
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-3 py-3.5">
                        <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                          {o.branch?.name || '—'}
                        </p>
                      </td>

                      {/* Fulfillment type */}
                      <td className="px-3 py-3.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-semibold"
                          style={{
                            background: 'var(--surface-2)',
                            color: 'var(--text-2)',
                          }}
                        >
                          {o.fulfillmentType === 'DELIVERY' ? <Truck size={10} /> : <Store size={10} />}
                          {FULFILLMENT_LABEL[o.fulfillmentType] || o.fulfillmentType}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[11px] font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-3 py-3.5">
                        {o.payment ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-semibold"
                            style={{
                              background: paid ? 'var(--success-soft)' : 'var(--warning-soft)',
                              color: paid ? 'var(--success)' : 'var(--warning)',
                            }}
                          >
                            <Wallet size={10} />
                            {paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3.5 text-right">
                        <p className="font-bold text-sm num" style={{ color: 'var(--text)' }}>
                          ฿{o.totalAmount.toLocaleString()}
                        </p>
                        {o.payment && (
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {PAYMENT_LABEL[o.payment.method] || o.payment.method}
                          </p>
                        )}
                      </td>

                      {/* Time */}
                      <td className="px-3 py-3.5 text-right">
                        <p className="text-xs num font-semibold" style={{ color: 'var(--text-2)' }}>
                          {relativeTime(o.createdAt)}
                        </p>
                        <p className="text-[10px] num" style={{ color: 'var(--text-muted)' }}>
                          {new Date(o.createdAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Hover chevron */}
                      <td className="pl-3 pr-5 py-3.5">
                        <ChevronRight
                          size={16}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </td>
                    </motion.tr>
                  );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <OrdersPagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </Card>
  );
}

function OrdersPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const startPage = Math.min(
      Math.max(1, page - 2),
      Math.max(1, totalPages - 4),
    );
    return startPage + index;
  }).filter((p) => p <= totalPages);

  return (
    <div
      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
    >
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold num" style={{ color: 'var(--text-muted)' }}>
          แสดง {start.toLocaleString()}-{end.toLocaleString()} จาก {total.toLocaleString()} ออเดอร์
        </p>
        <Select
          containerClassName="w-[96px]"
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}/หน้า
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          แรก
        </button>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          ก่อนหน้า
        </button>
        {pages.map((p) => {
          const active = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="h-9 min-w-9 px-3 rounded-xl text-xs font-bold num"
              style={{
                background: active ? 'var(--accent)' : 'var(--surface)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                color: active ? 'var(--accent-fg)' : 'var(--text-2)',
              }}
            >
              {p}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          ถัดไป
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          ท้าย
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Order detail (inside Drawer)
// ──────────────────────────────────────────────────────────────────────────

function OrderDetail({
  order,
  onAdvance,
  onCancel,
  onConfirmPayment,
  onPrint,
  onClose,
}: {
  order: Order;
  onAdvance: (id: string, next: string) => void;
  onCancel: (id: string) => void;
  onConfirmPayment: (id: string) => void;
  onPrint: (order: Order) => void;
  onClose: () => void;
}) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
  const StatusIcon = cfg.icon;
  const idx = STATUS_FLOW.indexOf(order.status);
  const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  const canCancel = !['COMPLETED', 'PICKED_UP', 'CANCELLED'].includes(order.status);
  const paid = order.payment?.status === 'PAID';
  const initial = (order.customerName || order.customerUid || '?').charAt(0).toUpperCase();

  return (
    <>
      {/* Hero header — gradient with order number + amount */}
      <div
        className="px-6 py-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)`,
          color: '#fff',
        }}
      >
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-30"
          style={{ background: '#fff', filter: 'blur(60px)' }}
        />
        <div className="relative flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80 mb-1">
              Order
            </p>
            <h2 className="font-mono text-2xl font-bold tracking-tight">{order.orderNo}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-bold mb-2"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              <StatusIcon size={12} />
              {cfg.label}
            </span>
            <p className="text-[12px] opacity-90">
              {new Date(order.createdAt).toLocaleString('th-TH', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest opacity-80">ยอดรวม</p>
            <p className="text-3xl font-bold num">฿{order.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Customer + branch + fulfillment row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoTile
            icon={
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {initial}
              </div>
            }
            label="ลูกค้า"
            value={order.customerName || 'ลูกค้าหน้าร้าน'}
            sub={order.customerUid !== 'walk-in' ? order.customerUid : 'guest'}
          />
          <InfoTile
            icon={<Store size={14} />}
            label="สาขา"
            value={order.branch?.name || '—'}
          />
          <InfoTile
            icon={order.fulfillmentType === 'DELIVERY' ? <Truck size={14} /> : <Store size={14} />}
            label="ประเภท"
            value={FULFILLMENT_LABEL[order.fulfillmentType] || order.fulfillmentType}
          />
          <InfoTile
            icon={<Wallet size={14} />}
            label="ชำระเงิน"
            value={order.payment ? PAYMENT_LABEL[order.payment.method] || order.payment.method : '—'}
            sub={
              order.payment
                ? paid
                  ? 'จ่ายแล้ว'
                  : 'ยังไม่จ่าย'
                : undefined
            }
            tone={paid ? 'success' : order.payment ? 'warning' : 'neutral'}
          />
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
            รายการสั่งซื้อ ({order.items.length})
          </p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {order.items.map((item, i) => {
              const opts = (() => {
                try {
                  return typeof item.selectedOptions === 'string'
                    ? JSON.parse(item.selectedOptions)
                    : item.selectedOptions || [];
                } catch {
                  return [];
                }
              })();
              return (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    {item.product?.imageUrl ? (
                      <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Coffee size={16} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {item.productName || item.product?.name || 'เมนู'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] num font-medium" style={{ color: 'var(--text-muted)' }}>
                        ×{item.quantity} · ฿{item.unitPrice}
                      </span>
                      {Array.isArray(opts) &&
                        opts.map((o: any, j: number) => (
                          <span
                            key={j}
                            className="text-[10px] px-1.5 h-4 rounded inline-flex items-center font-medium"
                            style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
                          >
                            {o.label}
                          </span>
                        ))}
                    </div>
                  </div>
                  <p className="font-bold text-sm num shrink-0" style={{ color: 'var(--accent)' }}>
                    ฿{item.price}
                  </p>
                </div>
              );
            })}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                ยอดรวมทั้งหมด
              </span>
              <span className="text-lg font-bold num" style={{ color: 'var(--text)' }}>
                ฿{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        {order.note && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              หมายเหตุ
            </p>
            <p
              className="text-sm rounded-xl p-3.5"
              style={{
                background: 'var(--warning-soft)',
                color: 'var(--text-2)',
                border: '1px solid var(--warning)',
              }}
            >
              {order.note}
            </p>
          </div>
        )}

        {/* Status timeline */}
        {order.status !== 'CANCELLED' && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              เส้นทางสถานะ
            </p>
            <StatusTimeline current={order.status} />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div
        className="sticky bottom-0 px-6 py-4 flex items-center gap-2 flex-wrap"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        {order.payment?.status === 'UNPAID' && order.status !== 'CANCELLED' && (
          <Button variant="success" size="sm" onClick={() => onConfirmPayment(order.id)} leftIcon={<Check size={14} />}>
            ยืนยันชำระ
          </Button>
        )}
        {next && order.status !== 'CANCELLED' && (
          <Button size="sm" onClick={() => onAdvance(order.id, next)} rightIcon={<ChevronRight size={14} />}>
            {STATUS_CFG[next]?.label}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => onPrint(order)} leftIcon={<Printer size={14} />}>
          พิมพ์
        </Button>
        <div className="flex-1" />
        {canCancel && (
          <Button variant="ghost" size="sm" onClick={() => onCancel(order.id)} leftIcon={<Ban size={14} />}>
            ยกเลิก
          </Button>
        )}
      </div>
    </>
  );
}

function InfoTile({
  icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  const subColor =
    tone === 'success' ? 'var(--success)' : tone === 'warning' ? 'var(--warning)' : 'var(--text-muted)';
  return (
    <div
      className="rounded-xl p-3.5"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: subColor }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function StatusTimeline({ current }: { current: string }) {
  const steps = ['PENDING', 'PAID', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'];
  const cIdx = STATUS_FLOW.indexOf(current);
  return (
    <div className="flex items-start gap-2">
      {steps.map((s, i) => {
        const sIdx = STATUS_FLOW.indexOf(s);
        const reached = sIdx <= cIdx;
        const cfg = STATUS_CFG[s];
        const Icon = cfg.icon;
        return (
          <div key={s} className="flex-1 flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all relative"
              style={{
                background: reached ? cfg.color : 'var(--surface-2)',
                color: reached ? '#fff' : 'var(--text-muted)',
                border: reached ? 'none' : '1px solid var(--border)',
              }}
            >
              <Icon size={13} />
              {i < steps.length - 1 && (
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2 h-0.5 w-[calc(100%-8px)] ml-1 origin-left"
                  style={{
                    background: STATUS_FLOW.indexOf(steps[i + 1]) <= cIdx ? cfg.color : 'var(--border)',
                  }}
                />
              )}
            </div>
            <p
              className="text-[10px] font-semibold mt-1.5 text-center"
              style={{ color: reached ? cfg.color : 'var(--text-faint)' }}
            >
              {cfg.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
