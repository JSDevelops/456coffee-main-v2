import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Store,
  Coffee,
  ArrowRight,
  Sparkles,
  Plus,
  ClipboardList,
  Receipt,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { Card, EmptyState, Skeleton } from '../components/ui';

interface Stats {
  revenue: number;
  todayRevenue: number;
  revenueDelta: number;
  totalOrders: number;
  todayOrders: number;
  ordersDelta: number;
  customers: number;
  newCustomersThisMonth: number;
  customersDelta: number;
  branches: number;
}

interface TopProduct {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  sold: number;
  revenue: number;
}

interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RecentOrder {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  customerName: string | null;
  customerUid: string;
  createdAt: string;
  branch?: { name: string };
  items?: any[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; bg: string; fg: string }
> = {
  PENDING:          { label: 'รอชำระ',     dot: '#d97706', bg: 'rgba(217,119,6,0.12)', fg: '#d97706' },
  PAID:             { label: 'ชำระแล้ว',   dot: '#0891b2', bg: 'rgba(8,145,178,0.12)',  fg: '#0891b2' },
  PREPARING:        { label: 'กำลังทำ',    dot: '#ea580c', bg: 'rgba(234,88,12,0.12)',  fg: '#ea580c' },
  READY_FOR_QC:     { label: 'รอตรวจ',    dot: '#a855f7', bg: 'rgba(168,85,247,0.12)', fg: '#a855f7' },
  READY_FOR_PICKUP: { label: 'พร้อมรับ',  dot: '#10b981', bg: 'rgba(16,185,129,0.14)', fg: '#10b981' },
  DISPATCHED:       { label: 'จัดส่งแล้ว', dot: '#3b82f6', bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6' },
  PICKED_UP:        { label: 'รับแล้ว',   dot: '#10b981', bg: 'rgba(16,185,129,0.12)', fg: '#059669' },
  COMPLETED:        { label: 'เสร็จสิ้น', dot: '#10b981', bg: 'rgba(16,185,129,0.12)', fg: '#059669' },
  CANCELLED:        { label: 'ยกเลิก',    dot: '#6b7280', bg: 'rgba(107,114,128,0.12)', fg: '#6b7280' },
};

interface DashboardPageProps {
  onJumpToOrders: () => void;
  onJumpToProducts: () => void;
}

export default function DashboardPage({ onJumpToOrders, onJumpToProducts }: DashboardPageProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [trend, setTrend] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/stats/global'),
      api.get<RecentOrder[]>('/orders/recent?limit=8'),
      api.get<TopProduct[]>('/stats/top-products?days=30&limit=5'),
      api.get<RevenuePoint[]>('/stats/revenue-trend?days=7'),
    ])
      .then(([s, o, t, r]) => {
        setStats(s);
        setOrders(o);
        setTopProducts(t);
        setTrend(r);
      })
      .catch((e) => console.error('Dashboard fetch failed', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner stats={stats} loading={loading} onJumpToOrders={onJumpToOrders} />

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ColorStat
          loading={loading}
          gradient="linear-gradient(135deg, #f97316, #ea580c)"
          tint="rgba(249,115,22,0.10)"
          icon={<TrendingUp size={20} />}
          label="รายได้วันนี้"
          value={`฿${(stats?.todayRevenue ?? 0).toLocaleString()}`}
          delta={stats?.revenueDelta}
          deltaLabel="vs เมื่อวาน"
        />
        <ColorStat
          loading={loading}
          gradient="linear-gradient(135deg, #06b6d4, #0891b2)"
          tint="rgba(6,182,212,0.10)"
          icon={<ShoppingBag size={20} />}
          label="ออเดอร์วันนี้"
          value={(stats?.todayOrders ?? 0).toLocaleString()}
          delta={stats?.ordersDelta}
          deltaLabel="vs เมื่อวาน"
        />
        <ColorStat
          loading={loading}
          gradient="linear-gradient(135deg, #a855f7, #7c3aed)"
          tint="rgba(168,85,247,0.10)"
          icon={<Users size={20} />}
          label="ลูกค้าใหม่ (เดือนนี้)"
          value={(stats?.newCustomersThisMonth ?? 0).toLocaleString()}
          delta={stats?.customersDelta}
          deltaLabel="vs เดือนก่อน"
        />
        <ColorStat
          loading={loading}
          gradient="linear-gradient(135deg, #10b981, #059669)"
          tint="rgba(16,185,129,0.10)"
          icon={<Store size={20} />}
          label="สาขาในระบบ"
          value={(stats?.branches ?? 0).toString()}
        />
      </div>

      {/* Revenue chart + Top products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <RevenueChartCard
          className="xl:col-span-2"
          trend={trend}
          loading={loading}
          todayRevenue={stats?.todayRevenue ?? 0}
          delta={stats?.revenueDelta ?? 0}
        />
        <TopProductsCard
          products={topProducts}
          loading={loading}
          onSeeAll={onJumpToProducts}
        />
      </div>

      {/* Recent orders */}
      <RecentOrdersFeed orders={orders} loading={loading} onSeeAll={onJumpToOrders} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hero banner — gradient + greeting + live + quick actions
// ────────────────────────────────────────────────────────────────────────────

function HeroBanner({
  stats,
  loading,
  onJumpToOrders,
}: {
  stats: Stats | null;
  loading: boolean;
  onJumpToOrders: () => void;
}) {
  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #ea580c 0%, #f97316 35%, #db2777 100%)',
        color: '#fff',
        boxShadow: '0 24px 60px rgba(234, 88, 12, 0.30)',
      }}
    >
      {/* Decorative blurry blobs */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30 pointer-events-none"
        style={{ background: '#fcd34d', filter: 'blur(80px)' }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-30 pointer-events-none"
        style={{ background: '#a855f7', filter: 'blur(80px)' }}
      />
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col xl:flex-row xl:items-end gap-6 xl:gap-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">
              Live · {today}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-2">
            สวัสดี, Super Admin
            <Sparkles className="inline-block ml-2 -mt-2" size={28} />
          </h1>
          <p className="text-sm sm:text-base opacity-90 max-w-2xl">
            ภาพรวมของทุกสาขาในระบบ พร้อมข้อมูลเรียลไทม์ — กดสำรวจรายงานได้จาก action
            ด้านล่างหรือเมนูซ้ายมือ
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={onJumpToOrders}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl font-semibold text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#fff',
                backdropFilter: 'blur(8px)',
              }}
            >
              <ClipboardList size={16} />
              ดูออเดอร์ทั้งหมด
              <ArrowRight size={14} />
            </button>
            <button
              className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl font-semibold text-sm transition-all"
              style={{
                background: '#fff',
                color: '#ea580c',
                boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
              }}
            >
              <Plus size={16} />
              สร้างรายงานใหม่
            </button>
          </div>
        </div>

        {/* Live mini-stats panel */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:min-w-[420px]">
          <HeroStat
            label="รายได้วันนี้"
            value={loading ? '…' : `฿${(stats?.todayRevenue ?? 0).toLocaleString()}`}
            sub={
              loading
                ? null
                : `${(stats?.revenueDelta ?? 0) >= 0 ? '+' : ''}${(stats?.revenueDelta ?? 0).toFixed(1)}% vs เมื่อวาน`
            }
            positive={(stats?.revenueDelta ?? 0) >= 0}
          />
          <HeroStat
            label="ออเดอร์วันนี้"
            value={loading ? '…' : (stats?.todayOrders ?? 0).toLocaleString()}
            sub={
              loading
                ? null
                : `${(stats?.ordersDelta ?? 0) >= 0 ? '+' : ''}${(stats?.ordersDelta ?? 0).toFixed(1)}% vs เมื่อวาน`
            }
            positive={(stats?.ordersDelta ?? 0) >= 0}
          />
        </div>
      </div>
    </motion.div>
  );
}

function HeroStat({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub: string | null;
  positive: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: 'rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.20)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-90 mb-1.5">
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-bold num leading-tight">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1.5 text-[11px] font-semibold opacity-95">
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ColorStat — modern stat card with gradient icon
// ────────────────────────────────────────────────────────────────────────────

function ColorStat({
  loading,
  gradient,
  tint,
  icon,
  label,
  value,
  delta,
  deltaLabel,
}: {
  loading?: boolean;
  gradient: string;
  tint: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative rounded-2xl p-5 overflow-hidden transition-all"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
    >
      {/* Tint bg */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: tint }}
      />

      <div className="relative flex items-center justify-between mb-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
          style={{ background: gradient, boxShadow: '0 10px 24px rgba(0,0,0,0.10)' }}
        >
          {icon}
        </div>
        {delta != null && !loading && (
          <span
            className="inline-flex items-center gap-1 text-xs font-bold"
            style={{
              color:
                Math.abs(delta) < 0.01
                  ? 'var(--text-muted)'
                  : delta > 0
                    ? 'var(--success)'
                    : 'var(--danger)',
            }}
          >
            {Math.abs(delta) < 0.01 ? null : delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta) < 0.01 ? 'คงที่' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
          </span>
        )}
      </div>

      <p className="relative text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      {loading ? (
        <div className="animate-shimmer h-8 w-2/3 rounded-md" />
      ) : (
        <h3 className="relative text-2xl sm:text-3xl font-bold tracking-tight num truncate" style={{ color: 'var(--text)' }}>
          {value}
        </h3>
      )}
      {deltaLabel && (
        <p className="relative text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
          {deltaLabel}
        </p>
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Revenue chart card with SVG bar chart
// ────────────────────────────────────────────────────────────────────────────

function RevenueChartCard({
  trend,
  loading,
  todayRevenue,
  delta,
  className = '',
}: {
  trend: RevenuePoint[];
  loading: boolean;
  todayRevenue: number;
  delta: number;
  className?: string;
}) {
  const max = useMemo(() => {
    const m = Math.max(...trend.map((p) => p.revenue), 1);
    return m;
  }, [trend]);

  return (
    <Card padded className={className}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            รายได้ 7 วันล่าสุด
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight num" style={{ color: 'var(--text)' }}>
              ฿{todayRevenue.toLocaleString()}
            </h2>
            <span
              className="inline-flex items-center gap-1 text-sm font-bold"
              style={{
                color:
                  Math.abs(delta) < 0.01
                    ? 'var(--text-muted)'
                    : delta > 0
                      ? 'var(--success)'
                      : 'var(--danger)',
              }}
            >
              {Math.abs(delta) < 0.01 ? null : delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(delta) < 0.01 ? 'คงที่' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
            </span>
          </div>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Activity size={20} />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : trend.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
          ยังไม่มีข้อมูล
        </div>
      ) : (
        <BarChart data={trend} max={max} />
      )}
    </Card>
  );
}

function BarChart({ data, max }: { data: RevenuePoint[]; max: number }) {
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-44">
      {data.map((p, idx) => {
        const ratio = max > 0 ? p.revenue / max : 0;
        const barHeight = Math.max(ratio * 100, p.revenue > 0 ? 6 : 2); // % of container
        const isToday = idx === data.length - 1;
        const date = new Date(p.date);
        const dayLabel = date.toLocaleDateString('th-TH', { weekday: 'short' });
        return (
          <div key={p.date} className="flex-1 flex flex-col items-center gap-2 group">
            {/* Tooltip on hover */}
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-2 py-1 rounded-md"
              style={{ background: 'var(--text)', color: 'var(--surface)' }}
            >
              ฿{p.revenue.toLocaleString()}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ duration: 0.6, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-t-lg relative overflow-hidden"
              style={{
                background: isToday
                  ? 'linear-gradient(180deg, #f97316, #ea580c)'
                  : p.revenue > 0
                    ? 'var(--accent-soft)'
                    : 'var(--surface-2)',
                minHeight: '4px',
              }}
            >
              {!isToday && p.revenue > 0 && (
                <div
                  className="absolute inset-x-0 bottom-0 h-1 rounded-t-lg"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <p
                className="text-[10px] font-bold"
                style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {dayLabel}
              </p>
              <p className="text-[9px] num" style={{ color: 'var(--text-faint)' }}>
                {date.getDate()}/{date.getMonth() + 1}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Top products with progress bars
// ────────────────────────────────────────────────────────────────────────────

function TopProductsCard({
  products,
  loading,
  onSeeAll,
}: {
  products: TopProduct[];
  loading: boolean;
  onSeeAll: () => void;
}) {
  const max = useMemo(() => Math.max(...products.map((p) => p.sold), 1), [products]);

  return (
    <Card padded>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <Coffee size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
              สินค้าขายดี
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              30 วันล่าสุด
            </p>
          </div>
        </div>
        <button
          onClick={onSeeAll}
          className="inline-flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2"
          style={{ color: 'var(--accent)' }}
        >
          ดู <ChevronRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={<Coffee size={24} />} title="ยังไม่มีข้อมูลขาย" />
      ) : (
        <div className="space-y-4">
          {products.map((p, idx) => {
            const ratio = max > 0 ? (p.sold / max) * 100 : 0;
            return (
              <motion.div
                key={p.productId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="relative shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
                      style={{ background: 'var(--surface-2)' }}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Coffee size={16} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{
                        background: idx === 0 ? 'var(--accent)' : 'var(--surface-3)',
                        color: idx === 0 ? 'var(--accent-fg)' : 'var(--text-2)',
                      }}
                    >
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {p.name}
                    </p>
                    <p className="text-xs num" style={{ color: 'var(--text-muted)' }}>
                      {p.sold.toLocaleString()} แก้ว · ฿{p.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="ml-13 sm:ml-13 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        idx === 0
                          ? 'linear-gradient(90deg, #f97316, #ea580c)'
                          : 'var(--accent)',
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Recent orders feed — timeline style
// ────────────────────────────────────────────────────────────────────────────

function RecentOrdersFeed({
  orders,
  loading,
  onSeeAll,
}: {
  orders: RecentOrder[];
  loading: boolean;
  onSeeAll: () => void;
}) {
  return (
    <Card padded={false}>
      <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <Receipt size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
              ออเดอร์ล่าสุด
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              อัปเดตเรียลไทม์
            </p>
          </div>
        </div>
        <button
          onClick={onSeeAll}
          className="inline-flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2"
          style={{ color: 'var(--accent)' }}
        >
          ดูทั้งหมด <ArrowRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="px-5 sm:px-6 pb-5 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title="ยังไม่มีออเดอร์"
          description="ออเดอร์ใหม่จะปรากฏที่นี่ทันทีเมื่อมีการสั่งซื้อ"
        />
      ) : (
        <div className="px-5 sm:px-6 pb-5">
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-[19px] top-2 bottom-2 w-px"
              style={{ background: 'var(--border)' }}
            />

            <div className="space-y-1">
              {orders.map((o, idx) => {
                const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING;
                const initial = (o.customerName || o.customerUid || '?').charAt(0).toUpperCase();
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="relative flex items-center gap-4 py-2.5 px-2 -mx-2 rounded-xl cursor-pointer group transition-colors"
                    onClick={onSeeAll}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Timeline dot */}
                    <div
                      className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        background: 'var(--surface)',
                        border: `2px solid ${cfg.dot}`,
                        color: cfg.dot,
                      }}
                    >
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 items-center">
                      <div className="sm:col-span-4 min-w-0">
                        <p className="font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>
                          {o.orderNo}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {o.customerName || 'ลูกค้าหน้าร้าน'}
                        </p>
                      </div>

                      <div className="sm:col-span-3 min-w-0 hidden sm:block">
                        <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>
                          {o.branch?.name || '—'}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(o.createdAt).toLocaleString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>

                      <div className="sm:col-span-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-md text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.fg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="sm:col-span-2 text-right">
                        <p className="font-bold text-sm num" style={{ color: 'var(--text)' }}>
                          ฿{o.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
