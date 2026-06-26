import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Plus,
  Search,
  MapPin,
  Phone,
  Clock,
  Edit2,
  Trash2,
  Power,
  ShoppingBag,
  Users,
  RefreshCw,
  X,
  ChevronRight,
  TrendingUp,
  Coffee,
  CalendarClock,
  Mail,
  Crown,
  User as UserIcon,
  Shield,
  Navigation,
  CheckCircle2,
  XCircle,
  Activity,
  Key,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../api';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  ImageUpload,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination, paginateItems } from '../components/ui/Pagination';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

interface Manager {
  id: string;
  branchId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  lineUid: string | null;
  pin: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PaymentDevice {
  id: string;
  branchId: string;
  name: string;
  username: string;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  phone: string | null;
  promptpayId: string | null;
  promptpayName: string | null;
  imageUrl: string | null;
  managers: Manager[];
  paymentDevices: PaymentDevice[];
  createdAt: string;
  _count: { orders: number; inventory: number };
}

interface BranchDashboard {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  recentOrders: any[];
  topProducts: { productId: string; name: string; totalSold: number }[];
}

interface GlobalStats {
  todayRevenue: number;
  todayOrders: number;
  branches: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────

const ROLE_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number }> }> = {
  OWNER:          { label: 'เจ้าของร้าน',    color: '#d97706', bg: 'rgba(217,119,6,0.12)',  icon: Crown },
  BRANCH_MANAGER: { label: 'ผู้จัดการสาขา', color: '#ea580c', bg: 'rgba(234,88,12,0.12)',  icon: Shield },
  CASHIER:        { label: 'แคชเชียร์',     color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: UserIcon },
  BARISTA:        { label: 'บาริสต้า',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: UserIcon },
  QC:             { label: 'ตรวจคุณภาพ',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: UserIcon },
  DISPATCHER:     { label: 'ส่งมอบสินค้า', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: UserIcon },
  STOCK:          { label: 'นับสต็อก',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: UserIcon },
  STAFF:          { label: 'พนักงาน',       color: '#71717a', bg: 'rgba(113,113,122,0.12)', icon: UserIcon },
};

type StatusFilter = 'all' | 'open' | 'closed';
type SortKey = 'name' | 'newest' | 'orders' | 'managers';

const STATUS_PILLS: { id: StatusFilter; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'all',    label: 'ทั้งหมด', icon: Store },
  { id: 'open',   label: 'เปิดอยู่', icon: CheckCircle2 },
  { id: 'closed', label: 'ปิด',      icon: XCircle },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'name',     label: 'ชื่อ A → Z' },
  { id: 'newest',   label: 'สร้างล่าสุด' },
  { id: 'orders',   label: 'ออเดอร์มากสุด' },
  { id: 'managers', label: 'ผู้จัดการมากสุด' },
];

const emptyForm = {
  name: '',
  location: '',
  address: '',
  latitude: '',
  longitude: '',
  openTime: '08:00',
  closeTime: '22:00',
  phone: '',
  promptpayId: '',
  promptpayName: '',
  imageUrl: '',
};

// ──────────────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────────────

export default function BranchesPage() {
  const toast = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // UI
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        api.get<Branch[]>('/branches/admin'),
        api.get<GlobalStats>('/stats/global'),
      ]);
      setBranches(list);
      setGlobalStats(stats);
    } catch (e: any) {
      toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Filter + sort ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = branches.filter((b) => {
      if (statusFilter === 'open' && !b.isOpen) return false;
      if (statusFilter === 'closed' && b.isOpen) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [b.name, b.location, b.address, b.phone].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name':     return a.name.localeCompare(b.name, 'th');
        case 'newest':   return +new Date(b.createdAt) - +new Date(a.createdAt);
        case 'orders':   return b._count.orders - a._count.orders;
        case 'managers': return b.managers.length - a.managers.length;
      }
    });
    return list;
  }, [branches, statusFilter, sortKey, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortKey, pageSize]);

  const pagedBranches = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  const selected = branches.find((b) => b.id === selectedId) || null;
  const editing = branches.find((b) => b.id === editingId) || null;

  const activeFilterCount =
    (search ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (sortKey !== 'newest' ? 1 : 0);
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortKey('newest');
  };

  // ─── Stats values ─────────────────────────────────────────────────────
  const openCount = branches.filter((b) => b.isOpen).length;
  const closedCount = branches.length - openCount;

  // ─── Mutations ────────────────────────────────────────────────────────
  const toggleOpen = async (id: string, name: string) => {
    try {
      await api.patch(`/branches/${id}/toggle-open`);
      toast.success(`สลับสถานะ ${name} แล้ว`);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'อัปเดตไม่สำเร็จ');
    }
  };

  const remove = async (b: Branch) => {
    if (!confirm(`ลบสาขา "${b.name}" ?\nการลบไม่สามารถย้อนกลับได้`)) return;
    try {
      await api.delete(`/branches/${b.id}`);
      toast.success('ลบสาขาสำเร็จ');
      setDrawerOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'ลบไม่สำเร็จ');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditingId(b.id);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="Branches"
        title="จัดการสาขา"
        description={`${filtered.length.toLocaleString()} สาขาตรงตามตัวกรอง · ทั้งหมดในระบบ ${branches.length.toLocaleString()}`}
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={fetchAll}>
              รีเฟรช
            </Button>
            <Button leftIcon={<Plus size={14} />} onClick={openCreate}>
              เพิ่มสาขา
            </Button>
          </>
        }
      />

      {/* Stats strip */}
      <BranchStatsStrip
        loading={loading}
        total={branches.length}
        open={openCount}
        closed={closedCount}
        todayOrders={globalStats?.todayOrders ?? 0}
        todayRevenue={globalStats?.todayRevenue ?? 0}
      />

      {/* Filters */}
      <BranchFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortKey={sortKey}
        onSortChange={setSortKey}
        activeCount={activeFilterCount}
        onReset={resetFilters}
        openCount={openCount}
        closedCount={closedCount}
        totalCount={branches.length}
      />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Store size={28} />}
            title={branches.length === 0 ? 'ยังไม่มีสาขา' : 'ไม่พบสาขาที่ตรงตามตัวกรอง'}
            description={branches.length === 0 ? 'เริ่มต้นโดยกด "เพิ่มสาขา" ด้านขวาบน' : 'ลองล้างตัวกรองเพื่อดูสาขาทั้งหมด'}
            action={
              branches.length === 0 ? (
                <Button onClick={openCreate} leftIcon={<Plus size={14} />}>
                  เพิ่มสาขาแรก
                </Button>
              ) : (
                <Button variant="secondary" onClick={resetFilters}>
                  ล้างตัวกรอง
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {pagedBranches.map((b, idx) => (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <BranchCard
                    branch={b}
                    onOpen={() => {
                      setSelectedId(b.id);
                      setDrawerOpen(true);
                    }}
                    onEdit={() => openEdit(b)}
                    onToggle={() => toggleOpen(b.id, b.name)}
                    onDelete={() => remove(b)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="สาขา"
            className="mt-4"
          />
        </>
      )}

      {/* Detail drawer */}
      <Drawer open={drawerOpen && !!selected} onClose={() => setDrawerOpen(false)} width="xl">
        {selected && (
          <BranchDrawerContent
            branch={selected}
            onClose={() => setDrawerOpen(false)}
            onEdit={() => {
              setDrawerOpen(false);
              openEdit(selected);
            }}
            onToggle={() => toggleOpen(selected.id, selected.name)}
            onDelete={() => remove(selected)}
            onChanged={fetchAll}
          />
        )}
      </Drawer>

      {/* Create / Edit modal */}
      <BranchFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          fetchAll();
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Stats strip
// ──────────────────────────────────────────────────────────────────────────

function BranchStatsStrip({
  loading,
  total,
  open,
  closed,
  todayOrders,
  todayRevenue,
}: {
  loading: boolean;
  total: number;
  open: number;
  closed: number;
  todayOrders: number;
  todayRevenue: number;
}) {
  const items = [
    { label: 'สาขาทั้งหมด',    value: total,            sub: 'ในระบบ',          icon: Store,        color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
    { label: 'เปิดอยู่',         value: open,             sub: `${closed} ปิด`,    icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'ออเดอร์วันนี้',   value: todayOrders,      sub: 'รวมทุกสาขา',      icon: ShoppingBag,  color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
    { label: 'รายได้วันนี้',    value: `฿${todayRevenue.toLocaleString()}`, sub: 'รวมทุกสาขา', icon: TrendingUp, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
                <p className="relative text-2xl sm:text-3xl font-bold tracking-tight num truncate" style={{ color: 'var(--text)' }}>
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

function BranchFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortKey,
  onSortChange,
  activeCount,
  onReset,
  openCount,
  closedCount,
  totalCount,
}: {
  search: string;
  onSearchChange: (s: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  activeCount: number;
  onReset: () => void;
  openCount: number;
  closedCount: number;
  totalCount: number;
}) {
  return (
    <Card padded className="mb-4">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อสาขา / พื้นที่ / ที่อยู่ / เบอร์..."
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status pills (segmented) */}
          <div
            className="inline-flex h-10 items-center rounded-xl p-1"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {STATUS_PILLS.map((p) => {
              const active = statusFilter === p.id;
              const Icon = p.icon;
              const count = p.id === 'all' ? totalCount : p.id === 'open' ? openCount : closedCount;
              return (
                <button
                  key={p.id}
                  onClick={() => onStatusChange(p.id)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                  style={{
                    background: active ? 'var(--surface)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  <Icon size={12} />
                  {p.label}
                  <span
                    className="text-[10px] num font-bold ml-0.5"
                    style={{ color: active ? 'var(--accent)' : 'var(--text-faint)' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <Select
            containerClassName="min-w-[180px]"
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>

          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all"
              style={{ color: 'var(--danger)' }}
            >
              <X size={14} />
              ล้างตัวกรอง
              <span
                className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--danger)', color: '#fff' }}
              >
                {activeCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Branch card
// ──────────────────────────────────────────────────────────────────────────

function BranchCard({
  branch,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
}: {
  branch: Branch;
  onOpen: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card padded={false} className="overflow-hidden flex flex-col h-full group transition-all">
      {/* Cover image */}
      <div
        className="aspect-[16/9] relative overflow-hidden cursor-pointer"
        style={{ background: 'var(--surface-2)' }}
        onClick={onOpen}
      >
        {branch.imageUrl ? (
          <img
            src={branch.imageUrl}
            alt={branch.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
            }}
          >
            <Store size={48} style={{ color: 'var(--text-faint)' }} />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-bold backdrop-blur-md"
            style={{
              background: branch.isOpen ? 'rgba(16,185,129,0.92)' : 'rgba(0,0,0,0.55)',
              color: '#fff',
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              {branch.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80" />
              )}
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            {branch.isOpen ? 'เปิดอยู่' : 'ปิด'}
          </span>
        </div>
        {/* Hover hint */}
        <div
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
          }}
        >
          <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] font-semibold">
            ดูรายละเอียด <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3 cursor-pointer" onClick={onOpen}>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base truncate" style={{ color: 'var(--text)' }}>
              {branch.name}
            </h3>
            <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={11} />
              {branch.location || 'ยังไม่ระบุพื้นที่'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs mb-4 flex-1" style={{ color: 'var(--text-muted)' }}>
          {branch.address && (
            <p className="line-clamp-2 leading-snug">{branch.address}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {branch.phone && (
              <span className="inline-flex items-center gap-1 num">
                <Phone size={11} />
                {branch.phone}
              </span>
            )}
            {branch.openTime && branch.closeTime && (
              <span className="inline-flex items-center gap-1 num">
                <Clock size={11} />
                {branch.openTime}–{branch.closeTime}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 gap-2 mb-4 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <BranchStat icon={<ShoppingBag size={11} />} value={branch._count.orders} label="ออเดอร์" />
          <BranchStat icon={<Users size={11} />} value={branch.managers.length} label="ผู้จัดการ" />
          <BranchStat icon={<Coffee size={11} />} value={branch._count.inventory} label="วัตถุดิบ" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={onEdit} leftIcon={<Edit2 size={12} />}>
            แก้ไข
          </Button>
          <Button size="sm" variant="secondary" onClick={onToggle} leftIcon={<Power size={12} />}>
            {branch.isOpen ? 'ปิด' : 'เปิด'}
          </Button>
          <button
            onClick={onDelete}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--danger-soft)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function BranchStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <span className="text-base font-bold num" style={{ color: 'var(--text)' }}>
          {value.toLocaleString()}
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-faint)' }}>
        {label}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Drawer detail
// ──────────────────────────────────────────────────────────────────────────

function BranchDrawerContent({
  branch,
  onClose,
  onEdit,
  onToggle,
  onDelete,
  onChanged,
}: {
  branch: Branch;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [dashboard, setDashboard] = useState<BranchDashboard | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [managerModal, setManagerModal] = useState<{ open: boolean; manager?: Manager }>({ open: false });
  const [deviceModal, setDeviceModal] = useState<{ open: boolean; device?: PaymentDevice }>({ open: false });

  useEffect(() => {
    setLoadingDash(true);
    api
      .get<BranchDashboard>(`/branches/${branch.id}/dashboard`)
      .then(setDashboard)
      .catch((e) => console.error(e))
      .finally(() => setLoadingDash(false));
  }, [branch.id]);

  return (
    <>
      {/* Hero header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: branch.imageUrl
            ? 'transparent'
            : 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: '#fff',
        }}
      >
        {branch.imageUrl && (
          <>
            <img
              src={branch.imageUrl}
              alt={branch.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.78) 100%)' }}
            />
          </>
        )}
        <div className="relative px-6 pt-6 pb-7">
          <div className="flex items-start justify-between gap-4 mb-12">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-bold backdrop-blur-md"
              style={{
                background: branch.isOpen ? 'rgba(16,185,129,0.95)' : 'rgba(0,0,0,0.55)',
                color: '#fff',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                {branch.isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80" />
                )}
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              {branch.isOpen ? 'เปิดอยู่' : 'ปิด'}
            </span>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              <X size={18} />
            </button>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{branch.name}</h2>
          <p className="text-sm opacity-90 inline-flex items-center gap-1.5">
            <MapPin size={13} />
            {branch.location || 'ยังไม่ระบุพื้นที่'}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Today / total stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DrawerStat
            icon={<Activity size={14} />}
            label="ออเดอร์วันนี้"
            value={loadingDash ? '…' : (dashboard?.todayOrders ?? 0).toLocaleString()}
            tone="accent"
          />
          <DrawerStat
            icon={<TrendingUp size={14} />}
            label="รายได้วันนี้"
            value={loadingDash ? '…' : `฿${(dashboard?.todayRevenue ?? 0).toLocaleString()}`}
            tone="success"
          />
          <DrawerStat
            icon={<ShoppingBag size={14} />}
            label="ออเดอร์รวม"
            value={loadingDash ? '…' : (dashboard?.totalOrders ?? 0).toLocaleString()}
            tone="info"
          />
          <DrawerStat
            icon={<Users size={14} />}
            label="ผู้จัดการ"
            value={branch.managers.length.toString()}
            tone="warning"
          />
        </div>

        {/* Info */}
        <Section title="ข้อมูลสาขา" icon={<Store size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {branch.phone && (
              <InfoRow icon={<Phone size={13} />} label="เบอร์โทร" value={branch.phone} mono />
            )}
            {branch.openTime && branch.closeTime && (
              <InfoRow
                icon={<Clock size={13} />}
                label="เวลาเปิด"
                value={`${branch.openTime} – ${branch.closeTime}`}
                mono
              />
            )}
            {branch.address && (
              <InfoRow icon={<MapPin size={13} />} label="ที่อยู่" value={branch.address} fullWidth />
            )}
            {(branch.latitude != null || branch.longitude != null) && (
              <InfoRow
                icon={<Navigation size={13} />}
                label="พิกัด"
                value={
                  <a
                    href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)' }}
                  >
                    {branch.latitude}, {branch.longitude} ↗
                  </a>
                }
                mono
              />
            )}
            <InfoRow
              icon={<CalendarClock size={13} />}
              label="สร้างเมื่อ"
              value={new Date(branch.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </div>
        </Section>

        {/* Managers */}
        <Section
          title={`พนักงานสาขา (${branch.managers.length})`}
          icon={<Users size={14} />}
          actions={
            <Button size="sm" variant="secondary" onClick={() => setManagerModal({ open: true })} leftIcon={<Plus size={12} />}>
              เพิ่มผู้จัดการ
            </Button>
          }
        >
          {branch.managers.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center text-sm italic"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              ยังไม่มีผู้จัดการ — กดเพิ่มเพื่อเริ่มต้น
            </div>
          ) : (
            <div className="space-y-2">
              {branch.managers.map((m) => {
                const cfg = ROLE_CFG[m.role] || ROLE_CFG.STAFF;
                const RoleIcon = cfg.icon;
                return (
                  <div
                    key={m.id}
                    className="rounded-xl p-3 flex items-center gap-3 group"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {(m.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                          {m.name}
                        </p>
                        <span
                          className="inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-bold"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <RoleIcon size={9} />
                          {cfg.label}
                        </span>
                        {m.isActive === false && (
                          <span
                            className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-bold"
                            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                          >
                            ปิดใช้งาน
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {m.phone && (
                          <span className="inline-flex items-center gap-1 num">
                            <Phone size={10} />
                            {m.phone}
                          </span>
                        )}
                        {m.email && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Mail size={10} />
                            {m.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-1.5 h-6 rounded text-[10px] font-bold shrink-0"
                      style={{
                        background: m.pin ? 'var(--success-soft)' : 'var(--danger-soft)',
                        color: m.pin ? 'var(--success)' : 'var(--danger)',
                      }}
                      title={m.pin ? 'ตั้ง PIN แล้ว' : 'ยังไม่ได้ตั้ง PIN'}
                    >
                      <Key size={10} />
                      {m.pin ? 'PIN' : 'ไม่มี PIN'}
                    </span>
                    <button
                      onClick={() => setManagerModal({ open: true, manager: m })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section
          title={`อุปกรณ์รับแจ้งชำระเงิน (${branch.paymentDevices.length})`}
          icon={<Smartphone size={14} />}
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDeviceModal({ open: true })}
              leftIcon={<Plus size={12} />}
            >
              เพิ่มอุปกรณ์
            </Button>
          }
        >
          {branch.paymentDevices.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center text-sm italic"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              ยังไม่มีบัญชีสำหรับแอพ Android ดักแจ้งเตือน
            </div>
          ) : (
            <div className="space-y-2">
              {branch.paymentDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setDeviceModal({ open: true, device })}
                  className="w-full rounded-xl p-3 text-left flex items-center gap-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: device.isActive ? 'var(--accent-soft)' : 'var(--surface-3)',
                      color: device.isActive ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    <Smartphone size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                        {device.name}
                      </p>
                      <span
                        className="inline-flex items-center px-1.5 h-5 rounded text-[10px] font-bold"
                        style={{
                          background: device.isActive ? 'var(--success-soft)' : 'var(--danger-soft)',
                          color: device.isActive ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {device.isActive ? 'พร้อมใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 num" style={{ color: 'var(--text-muted)' }}>
                      Username: {device.username}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      ล่าสุด:{' '}
                      {device.lastSeenAt
                        ? new Date(device.lastSeenAt).toLocaleString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'ยังไม่เคยเชื่อมต่อ'}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-faint)' }} />
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Top products */}
        <Section title="สินค้าขายดี (Top 5)" icon={<TrendingUp size={14} />}>
          {loadingDash ? (
            <Skeleton className="h-32 w-full" />
          ) : !dashboard?.topProducts.length ? (
            <div
              className="rounded-xl p-6 text-center text-sm italic"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              ยังไม่มีข้อมูลขาย
            </div>
          ) : (
            <div className="space-y-2">
              {dashboard.topProducts.map((p, idx) => {
                const max = Math.max(...dashboard.topProducts.map((x) => x.totalSold), 1);
                const ratio = (p.totalSold / max) * 100;
                return (
                  <div key={p.productId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                          style={{
                            background: idx === 0 ? 'var(--accent)' : 'var(--surface-3)',
                            color: idx === 0 ? 'var(--accent-fg)' : 'var(--text-2)',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {p.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold num" style={{ color: 'var(--text-muted)' }}>
                        {p.totalSold.toLocaleString()} แก้ว
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--surface-2)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ratio}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            idx === 0
                              ? 'linear-gradient(90deg, var(--accent-2), var(--accent))'
                              : 'var(--accent-soft)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Recent orders */}
        <Section title="ออเดอร์ล่าสุด" icon={<ShoppingBag size={14} />}>
          {loadingDash ? (
            <Skeleton className="h-32 w-full" />
          ) : !dashboard?.recentOrders.length ? (
            <div
              className="rounded-xl p-6 text-center text-sm italic"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              ยังไม่มีออเดอร์
            </div>
          ) : (
            <div className="space-y-1.5">
              {dashboard.recentOrders.slice(0, 5).map((o: any) => (
                <div
                  key={o.id}
                  className="rounded-lg p-3 flex items-center justify-between gap-3"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                      {o.orderNo}
                    </p>
                    <p className="text-[10px] num" style={{ color: 'var(--text-muted)' }}>
                      {new Date(o.createdAt).toLocaleString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-bold num shrink-0" style={{ color: 'var(--accent)' }}>
                    ฿{o.totalAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Footer actions */}
      <div
        className="sticky bottom-0 px-6 py-4 flex items-center gap-2 flex-wrap"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <Button size="sm" leftIcon={<Edit2 size={14} />} onClick={onEdit}>
          แก้ไขสาขา
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Power size={14} />} onClick={onToggle}>
          {branch.isOpen ? 'ปิดสาขา' : 'เปิดสาขา'}
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" leftIcon={<Trash2 size={14} />} onClick={onDelete}>
          ลบ
        </Button>
      </div>

      {/* Manager add/edit modal */}
      {managerModal.open && (
        <ManagerFormModal
          branchId={branch.id}
          editing={managerModal.manager}
          onClose={() => setManagerModal({ open: false })}
          onSaved={() => {
            setManagerModal({ open: false });
            onChanged();
          }}
        />
      )}
      {deviceModal.open && (
        <PaymentDeviceFormModal
          branchId={branch.id}
          editing={deviceModal.device}
          onClose={() => setDeviceModal({ open: false })}
          onSaved={() => {
            setDeviceModal({ open: false });
            onChanged();
          }}
        />
      )}
    </>
  );
}

function Section({
  title,
  icon,
  actions,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <span style={{ color: 'var(--accent)' }}>{icon}</span>
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${fullWidth ? 'sm:col-span-2' : ''}`}
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p
        className={`text-sm font-semibold ${mono ? 'num' : ''}`}
        style={{ color: 'var(--text)' }}
      >
        {value}
      </p>
    </div>
  );
}

function DrawerStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'accent' | 'success' | 'info' | 'warning';
}) {
  const colors: Record<typeof tone, { fg: string; bg: string }> = {
    accent:  { fg: 'var(--accent)',  bg: 'var(--accent-soft)' },
    success: { fg: 'var(--success)', bg: 'var(--success-soft)' },
    info:    { fg: 'var(--info)',    bg: 'var(--info-soft)' },
    warning: { fg: 'var(--warning)', bg: 'var(--warning-soft)' },
  };
  const c = colors[tone];
  return (
    <div className="rounded-xl p-3" style={{ background: c.bg }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: c.fg }}>
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-bold tracking-tight num truncate" style={{ color: c.fg }}>
        {value}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Branch form modal (create / edit)
// ──────────────────────────────────────────────────────────────────────────

function BranchFormModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Branch | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        location: editing.location || '',
        address: editing.address || '',
        latitude: editing.latitude?.toString() || '',
        longitude: editing.longitude?.toString() || '',
        openTime: editing.openTime || '08:00',
        closeTime: editing.closeTime || '22:00',
        phone: editing.phone || '',
        promptpayId: editing.promptpayId || '',
        promptpayName: editing.promptpayName || '',
        imageUrl: editing.imageUrl || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editing]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อสาขา');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      if (editing) {
        await api.patch(`/branches/${editing.id}`, payload);
        toast.success('อัปเดตสาขาสำเร็จ');
      } else {
        await api.post('/branches', payload);
        toast.success('สร้างสาขาใหม่สำเร็จ');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? `แก้ไข ${editing.name}` : 'เพิ่มสาขาใหม่'}
      description="กรอกข้อมูลให้ครบถ้วน — ข้อมูลที่ถูกต้องจะช่วยให้ระบบประสานงานได้ดีที่สุด"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit} loading={saving}>
            {editing ? 'บันทึก' : 'สร้างสาขา'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Section: General */}
        <FormSection title="ข้อมูลทั่วไป" icon={<Store size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              containerClassName="sm:col-span-2"
              label="ชื่อสาขา *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="456 Coffee — เซ็นทรัลลาดพร้าว"
            />
            <Input
              label="ย่าน / พื้นที่"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="ลาดพร้าว"
            />
          </div>
          <ImageUpload
            label="รูปภาพหน้าร้าน"
            aspect="16/9"
            value={form.imageUrl || null}
            onChange={(url) => setForm({ ...form, imageUrl: url || '' })}
            hint="คลิกเลือกไฟล์ หรือลากรูปมาวาง — จะถูกอัปโหลดและบันทึกลงเซิร์ฟเวอร์อัตโนมัติ"
          />
        </FormSection>

        {/* Section: Contact */}
        <FormSection title="ติดต่อ & ที่ตั้ง" icon={<MapPin size={14} />}>
          <Input
            leftIcon={<Phone size={14} />}
            label="เบอร์โทร"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="08x-xxx-xxxx"
          />
          <Textarea
            label="ที่อยู่"
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="ที่อยู่เต็มของสาขา"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ละติจูด"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              placeholder="13.7563"
            />
            <Input
              label="ลองจิจูด"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              placeholder="100.5018"
            />
          </div>
        </FormSection>

        {/* Section: Hours / Payment */}
        <FormSection title="เวลาทำการ" icon={<Clock size={14} />}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="เวลาเปิด"
              type="time"
              value={form.openTime}
              onChange={(e) => setForm({ ...form, openTime: e.target.value })}
            />
            <Input
              label="เวลาปิด"
              type="time"
              value={form.closeTime}
              onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
            />
          </div>
          <div
            className="rounded-xl p-3 text-sm"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            พร้อมเพย์ที่ใช้แสดงใน QR ถูกตั้งค่าจากหน้า Settings ของระบบ ไม่ได้ดึงจากรายสาขา
          </div>
        </FormSection>
      </div>
    </Modal>
  );
}

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4
        className="text-xs font-bold uppercase tracking-wider mb-3 inline-flex items-center gap-2"
        style={{ color: 'var(--accent)' }}
      >
        {icon}
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Payment device modal
// ──────────────────────────────────────────────────────────────────────────

function PaymentDeviceFormModal({
  branchId,
  editing,
  onClose,
  onSaved,
}: {
  branchId: string;
  editing?: PaymentDevice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(editing?.name || '');
  const [username, setUsername] = useState(editing?.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const usernameError =
    username.trim().length > 0 && !/^[a-zA-Z0-9._-]{3,80}$/.test(username.trim())
      ? 'Username ใช้ได้เฉพาะ a-z, 0-9, dot, dash, underscore'
      : '';
  const passwordError =
    password && password.trim().length < 6 ? 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร' : '';

  const submit = async () => {
    if (!name.trim() || !username.trim()) {
      toast.error('กรุณากรอกชื่ออุปกรณ์และ username');
      return;
    }
    if (usernameError || passwordError) {
      toast.error(usernameError || passwordError);
      return;
    }
    if (!editing && !password.trim()) {
      toast.error('กรุณากำหนดรหัสผ่านเริ่มต้น');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        username: username.trim(),
        isActive,
      };
      if (password.trim()) payload.password = password.trim();

      if (editing) {
        await api.patch(`/branches/payment-devices/${editing.id}`, payload);
        toast.success('อัปเดตอุปกรณ์สำเร็จ');
      } else {
        await api.post(`/branches/${branchId}/payment-devices`, {
          ...payload,
          password: password.trim(),
        });
        toast.success('สร้างบัญชีอุปกรณ์สำเร็จ');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing || !confirm(`ลบบัญชีอุปกรณ์ "${editing.name}" ?`)) return;
    try {
      await api.delete(`/branches/payment-devices/${editing.id}`);
      toast.success('ลบบัญชีอุปกรณ์สำเร็จ');
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={editing ? `แก้ไข ${editing.name}` : 'เพิ่มอุปกรณ์รับแจ้งชำระ'}
      description="ใช้ credential นี้ login ในแอพ Android เพื่อ forward notification / SMS จากเครื่องนี้เข้าสู่ระบบ"
      footer={
        <>
          {editing && (
            <Button variant="ghost" onClick={remove} leftIcon={<Trash2 size={14} />}>
              ลบ
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!name.trim() || !username.trim() || !!usernameError || !!passwordError}
          >
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="ชื่ออุปกรณ์ *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น Android เครื่องแคชเชียร์ 1"
        />
        <Input
          leftIcon={<UserIcon size={14} />}
          label="Username *"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="เช่น android-forwarder-01"
          error={usernameError || undefined}
        />
        <Input
          leftIcon={<Key size={14} />}
          type={showPassword ? 'text' : 'password'}
          label={editing ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่านเริ่มต้น *'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={editing ? 'ใส่เมื่อต้องการ reset password' : 'อย่างน้อย 6 ตัวอักษร'}
          error={passwordError || undefined}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              style={{ color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />

        {editing?.lastSeenAt && (
          <div
            className="rounded-xl p-3 text-xs"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            เชื่อมต่อล่าสุด{' '}
            <span className="num">
              {new Date(editing.lastSeenAt).toLocaleString('th-TH')}
            </span>
          </div>
        )}

        <label
          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              เปิดใช้งาน
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ปิดเพื่อหยุดรับ payment notifications จากเครื่องนี้ชั่วคราว
            </p>
          </div>
        </label>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Manager modal
// ──────────────────────────────────────────────────────────────────────────

function ManagerFormModal({
  branchId,
  editing,
  onClose,
  onSaved,
}: {
  branchId: string;
  editing?: Manager;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(editing?.name || '');
  const [phone, setPhone] = useState(editing?.phone || '');
  const [email, setEmail] = useState(editing?.email || '');
  const [role, setRole] = useState(editing?.role || 'BRANCH_MANAGER');
  const [lineUid, setLineUid] = useState(editing?.lineUid || '');
  const [pin, setPin] = useState(editing?.pin || '');
  const [showPin, setShowPin] = useState(false);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const pinError = (() => {
    if (!pin) return '';
    if (!/^\d{4,12}$/.test(pin)) return 'PIN ต้องเป็นตัวเลข 4-12 หลัก';
    return '';
  })();

  const submit = async () => {
    if (!name.trim()) return;
    if (pinError) {
      toast.error(pinError);
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
        lineUid: lineUid.trim(),
        pin: pin.trim() || null,
        isActive,
      };
      if (editing) {
        await api.patch(`/branches/managers/${editing.id}`, payload);
        toast.success('อัปเดตพนักงานสำเร็จ');
      } else {
        await api.post(`/branches/${branchId}/managers`, payload);
        toast.success('เพิ่มพนักงานสำเร็จ');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing || !confirm(`ลบพนักงาน "${editing.name}" ?`)) return;
    try {
      await api.delete(`/branches/managers/${editing.id}`);
      toast.success('ลบพนักงานสำเร็จ');
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={editing ? `แก้ไข ${editing.name}` : 'เพิ่มพนักงาน'}
      description="กำหนด PIN เพื่อให้พนักงานคนนี้ login ที่ branch-pos ได้"
      footer={
        <>
          {editing && (
            <Button variant="ghost" onClick={remove} leftIcon={<Trash2 size={14} />}>
              ลบ
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit} loading={saving} disabled={!name.trim() || !!pinError}>
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="ชื่อ-นามสกุล *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น สมชาย ใจดี"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            leftIcon={<Phone size={14} />}
            label="เบอร์โทร"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08x-xxx-xxxx"
          />
          <Input
            leftIcon={<Mail size={14} />}
            label="อีเมล"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <Select label="ตำแหน่ง" value={role} onChange={(e) => setRole(e.target.value)}>
          {Object.entries(ROLE_CFG)
            .filter(([k]) => k !== 'STAFF' && k !== 'OWNER')
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
        </Select>

        {/* PIN field */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            PIN (4-12 หลัก) — ใช้ login ที่ POS
          </label>
          <Input
            leftIcon={<Key size={14} />}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="เช่น 1234"
            error={pinError || undefined}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {role === 'BRANCH_MANAGER'
              ? '⚡ ผู้จัดการใช้ PIN นี้ปลดล็อคหน้า Dashboard ของสาขา'
              : 'พนักงานใช้ PIN นี้ login เข้าสถานีทำงานที่ branch-pos'}
          </p>
        </div>

        <Input
          label="LINE UID (optional)"
          value={lineUid}
          onChange={(e) => setLineUid(e.target.value)}
          placeholder="U..."
        />

        {/* Active toggle */}
        <label
          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              เปิดใช้งาน
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ปิดเพื่อ revoke PIN ชั่วคราว (ไม่ต้องลบทิ้ง)
            </p>
          </div>
        </label>
      </div>
    </Modal>
  );
}
