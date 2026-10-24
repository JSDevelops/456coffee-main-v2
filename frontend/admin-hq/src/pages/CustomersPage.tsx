import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Phone,
  Mail,
  MessageCircle,
  Gift,
  History,
  ShoppingBag,
  Plus,
  Minus,
  RefreshCw,
  X,
  Star,
  Calendar,
  TrendingUp,
  Crown,
  ChevronRight,
  Download,
} from 'lucide-react';
import { api } from '../api';
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination, paginateItems } from '../components/ui/Pagination';

interface AuthProvider {
  id: string;
  provider: string;
  providerId: string;
}
interface PointTransaction {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
}
interface OrderRow {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  branch?: { name: string };
}
interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}
interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  points: number;
  role: string;
  createdAt: string;
  authProviders: AuthProvider[];
  pointHistory?: PointTransaction[];
  orders?: OrderRow[];
  addresses?: Address[];
  _count: { orders: number };
}

type SortKey = 'newest' | 'points' | 'orders';

export default function CustomersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [pointsModal, setPointsModal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Customer[]>(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setUsers(data);
    } catch (e: any) {
      toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    const t = setTimeout(fetchAll, 250);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const filtered = useMemo(() => {
    let list = users;
    if (providerFilter) {
      list = list.filter((u) => u.authProviders.some((p) => p.provider === providerFilter));
    }
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'newest': return +new Date(b.createdAt) - +new Date(a.createdAt);
        case 'points': return b.points - a.points;
        case 'orders': return b._count.orders - a._count.orders;
      }
    });
    return list;
  }, [users, providerFilter, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [search, providerFilter, sortKey, pageSize]);

  const pagedUsers = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  const stats = {
    total: users.length,
    newThisMonth: users.filter((u) => {
      const d = new Date(u.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    totalPoints: users.reduce((s, u) => s + u.points, 0),
    activeOrders: users.reduce((s, u) => s + u._count.orders, 0),
  };

  const openProfile = async (u: Customer) => {
    try {
      const full = await api.get<Customer>(`/users/${u.id}`);
      setSelected(full);
      setDrawerOpen(true);
    } catch (e: any) {
      toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
    }
  };

  const handleExportCsv = () => {
    if (!filtered || filtered.length === 0) {
      toast.error('ไม่มีข้อมูลลูกค้าสำหรับ Export');
      return;
    }

    const headers = [
      'ชื่อลูกค้า (Name)',
      'เบอร์โทร (Phone)',
      'อีเมล (Email)',
      'ช่องทางล็อกอิน (Channels)',
      'แต้มสะสม (Points)',
      'จำนวนออเดอร์ (Total Orders)',
      'วันที่สมัคร (Joined Date)',
    ];

    const rows = filtered.map((u) => {
      const providers = u.authProviders.map((p) => p.provider).join(', ') || 'DIRECT';
      const dateStr = new Date(u.createdAt).toLocaleDateString('th-TH');
      return [
        `"${(u.name || '-').replace(/"/g, '""')}"`,
        `"${u.phone || '-'}"`,
        `"${u.email || '-'}"`,
        `"${providers}"`,
        u.points,
        u._count.orders,
        `"${dateStr}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `456coffee_customers_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`ส่งออกข้อมูลลูกค้า ${filtered.length} รายการเป็น Excel / CSV สำเร็จ`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="ลูกค้า"
        description={`${filtered.length.toLocaleString()} สมาชิกตรงตามตัวกรอง · ทั้งหมด ${users.length.toLocaleString()}`}
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={fetchAll}>รีเฟรช</Button>
            <Button variant="secondary" leftIcon={<Download size={14} />} onClick={handleExportCsv}>Export CSV</Button>
          </>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile loading={loading} label="สมาชิกทั้งหมด" value={stats.total} icon={<Users size={16} />} color="#ea580c" bg="rgba(234,88,12,0.12)" />
        <StatTile loading={loading} label="สมาชิกใหม่ (เดือนนี้)" value={stats.newThisMonth} icon={<Star size={16} />} color="#a855f7" bg="rgba(168,85,247,0.12)" />
        <StatTile loading={loading} label="แต้มสะสมรวม" value={stats.totalPoints} icon={<Gift size={16} />} color="#10b981" bg="rgba(16,185,129,0.12)" />
        <StatTile loading={loading} label="ออเดอร์รวม" value={stats.activeOrders} icon={<ShoppingBag size={16} />} color="#0891b2" bg="rgba(8,145,178,0.12)" />
      </div>

      {/* Filter bar */}
      <Card padded className="mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา ชื่อ / เบอร์ / อีเมล..."
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex h-10 items-center rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[
                { id: '', label: 'ทุก channel' },
                { id: 'LINE', label: 'LINE' },
                { id: 'PHONE', label: 'OTP' },
                { id: 'GOOGLE', label: 'Google' },
              ].map((p) => {
                const active = providerFilter === p.id;
                return (
                  <button key={p.id || 'all'} onClick={() => setProviderFilter(p.id)} className="h-8 px-3 rounded-lg text-xs font-semibold transition-all" style={{
                    background: active ? 'var(--surface)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}>{p.label}</button>
                );
              })}
            </div>
            <Select containerClassName="min-w-[180px]" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="newest">สมัครล่าสุด</option>
              <option value="points">แต้มมากสุด</option>
              <option value="orders">ออเดอร์มากสุด</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={<Users size={28} />} title="ยังไม่มีสมาชิก" description="สมาชิกจะปรากฏที่นี่เมื่อมีคนสมัครผ่าน LINE หรือ OTP" /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {pagedUsers.map((u, idx) => (
                <motion.div key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.02 }}>
                  <CustomerCard customer={u} onOpen={() => openProfile(u)} />
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
            itemLabel="สมาชิก"
            className="mt-4"
          />
        </>
      )}

      {/* Detail drawer */}
      <Drawer open={drawerOpen && !!selected} onClose={() => setDrawerOpen(false)} width="lg">
        {selected && (
          <CustomerDrawer customer={selected} onClose={() => setDrawerOpen(false)} onAdjust={() => setPointsModal(true)} />
        )}
      </Drawer>

      {/* Points modal */}
      {selected && pointsModal && (
        <PointsModal
          customer={selected}
          onClose={() => setPointsModal(false)}
          onSaved={async () => {
            const fresh = await api.get<Customer>(`/users/${selected.id}`);
            setSelected(fresh);
            setPointsModal(false);
            fetchAll();
          }}
        />
      )}
    </>
  );
}

function StatTile({ loading, label, value, icon, color, bg }: { loading: boolean; label: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <Card padded className="relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: bg }} />
      <div className="relative flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg, color }}>{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      {loading ? <Skeleton className="h-8 w-2/3" /> : <p className="relative text-2xl font-bold tracking-tight num truncate" style={{ color: 'var(--text)' }}>{value.toLocaleString()}</p>}
    </Card>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'LINE') return <MessageCircle size={12} style={{ color: '#06C755' }} />;
  if (provider === 'PHONE') return <Phone size={12} style={{ color: 'var(--info)' }} />;
  if (provider === 'GOOGLE') return <Mail size={12} style={{ color: 'var(--danger)' }} />;
  return null;
}

function CustomerCard({ customer, onOpen }: { customer: Customer; onOpen: () => void }) {
  const tier = customer.points >= 1000 ? 'Gold' : customer.points >= 500 ? 'Silver' : 'Member';
  const tierColor = tier === 'Gold' ? '#d97706' : tier === 'Silver' ? '#71717a' : 'var(--accent)';
  return (
    <Card hover className="cursor-pointer group" onClick={onOpen}>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {(customer.name || '?').charAt(0).toUpperCase()}
          </div>
          {tier === 'Gold' && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: tierColor, color: '#fff' }}>
              <Crown size={10} />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
              {customer.name || 'ไม่ระบุชื่อ'}
            </p>
            <span className="inline-flex items-center px-1.5 h-4 rounded text-[9px] font-bold" style={{ color: tierColor, border: `1px solid ${tierColor}` }}>
              {tier}
            </span>
          </div>
          <p className="text-xs truncate num" style={{ color: 'var(--text-muted)' }}>
            {customer.phone || customer.email || customer.id.slice(0, 8) + '…'}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {customer.authProviders.slice(0, 3).map((p) => <ProviderIcon key={p.id} provider={p.provider} />)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <MiniStat icon={<ShoppingBag size={11} />} value={customer._count.orders.toLocaleString()} label="ออเดอร์" />
        <MiniStat icon={<Gift size={11} />} value={customer.points.toLocaleString()} label="แต้ม" />
        <MiniStat icon={<Calendar size={11} />} value={new Date(customer.createdAt).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })} label="สมาชิกตั้งแต่" />
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>กดเพื่อดูรายละเอียด</span>
        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Card>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--surface-2)' }}>
      <div className="inline-flex items-center gap-1 text-xs font-bold num" style={{ color: 'var(--text)' }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        {value}
      </div>
      <p className="text-[9px] uppercase font-semibold mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
    </div>
  );
}

function CustomerDrawer({ customer, onClose, onAdjust }: { customer: Customer; onClose: () => void; onAdjust: () => void }) {
  const tier = customer.points >= 1000 ? 'Gold' : customer.points >= 500 ? 'Silver' : 'Member';
  const orders = customer.orders ?? [];
  const ordersCount = customer._count?.orders ?? orders.length;
  const authProviders = customer.authProviders ?? [];
  const addresses = customer.addresses ?? [];
  const pointHistory = customer.pointHistory ?? [];
  const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  return (
    <>
      {/* Hero */}
      <div className="relative px-6 pt-6 pb-7 overflow-hidden" style={{
        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        color: '#fff',
      }}>
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-30" style={{ background: '#fcd34d', filter: 'blur(60px)' }} />
        <div className="relative flex items-start justify-between gap-4 mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-bold backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.20)', color: '#fff' }}>
            <Crown size={12} /> {tier}
          </span>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
            <X size={18} />
          </button>
        </div>
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-3xl shrink-0" style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}>
            {(customer.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight truncate">{customer.name || 'ไม่ระบุชื่อ'}</h2>
            <p className="text-sm opacity-90 num">{customer.phone || customer.email || customer.id.slice(0, 12) + '…'}</p>
            <p className="text-xs opacity-80 mt-1">สมาชิกตั้งแต่ {new Date(customer.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox icon={<Gift size={14} />} label="แต้มสะสม" value={customer.points.toLocaleString()} tone="accent" action={
            <button onClick={onAdjust} className="text-[10px] font-bold mt-1" style={{ color: 'var(--accent)' }}>ปรับแต้ม →</button>
          } />
          <StatBox icon={<ShoppingBag size={14} />} label="ออเดอร์รวม" value={ordersCount.toLocaleString()} tone="info" />
          <StatBox icon={<TrendingUp size={14} />} label="ใช้จ่ายรวม" value={`฿${totalSpent.toLocaleString()}`} tone="success" />
        </div>

        {/* Auth providers */}
        {authProviders.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>ช่องทางที่ใช้สมัคร</h3>
            <div className="flex gap-2 flex-wrap">
              {authProviders.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  <ProviderIcon provider={p.provider} />
                  {p.provider}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Addresses */}
        {addresses.length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-3 inline-flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)' }}>📍</span> ที่อยู่
            </h3>
            <div className="space-y-2">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-xl p-3 flex items-start gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold mb-0.5 inline-flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                      {a.label}
                      {a.isDefault && <Badge tone="accent">หลัก</Badge>}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent orders */}
        <div>
          <h3 className="text-sm font-bold mb-3 inline-flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <ShoppingBag size={14} style={{ color: 'var(--accent)' }} /> ออเดอร์ล่าสุด
          </h3>
          {!orders.length ? (
            <div className="rounded-xl p-6 text-center text-sm italic" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
              ยังไม่มีประวัติการสั่ง
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {orders.map((o) => (
                <div key={o.id} className="rounded-lg p-3 flex items-center justify-between gap-3" style={{ background: 'var(--surface-2)' }}>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{o.orderNo}</p>
                    <p className="text-[10px] num" style={{ color: 'var(--text-muted)' }}>
                      {o.branch?.name || '—'} · {new Date(o.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-sm font-bold num shrink-0" style={{ color: 'var(--accent)' }}>฿{o.totalAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Point history */}
        <div>
          <h3 className="text-sm font-bold mb-3 inline-flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <History size={14} style={{ color: 'var(--accent)' }} /> ประวัติแต้ม
          </h3>
          {!pointHistory.length ? (
            <div className="rounded-xl p-6 text-center text-sm italic" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
              ยังไม่มีประวัติแต้ม
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {pointHistory.map((p) => (
                <div key={p.id} className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-2)' }}>{p.reason}</p>
                    <p className="text-[10px] num" style={{ color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleString('th-TH')}</p>
                  </div>
                  <span className="text-sm font-bold num shrink-0" style={{ color: p.delta > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {p.delta > 0 ? '+' : ''}{p.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 px-6 py-4 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <Button size="sm" leftIcon={<Gift size={14} />} onClick={onAdjust}>ปรับแต้ม</Button>
        <div className="flex-1" />
        <Button size="sm" variant="secondary" onClick={onClose}>ปิด</Button>
      </div>
    </>
  );
}

function StatBox({ icon, label, value, tone, action }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'accent' | 'success' | 'info';
  action?: React.ReactNode;
}) {
  const colors: Record<typeof tone, { fg: string; bg: string }> = {
    accent: { fg: 'var(--accent)', bg: 'var(--accent-soft)' },
    success: { fg: 'var(--success)', bg: 'var(--success-soft)' },
    info: { fg: 'var(--info)', bg: 'var(--info-soft)' },
  };
  const c = colors[tone];
  return (
    <div className="rounded-xl p-3" style={{ background: c.bg }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: c.fg }}>
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-bold tracking-tight num truncate" style={{ color: c.fg }}>{value}</p>
      {action}
    </div>
  );
}

function PointsModal({ customer, onClose, onSaved }: { customer: Customer; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (sign: 1 | -1) => {
    const value = parseInt(delta || '0', 10);
    if (!value) return;
    setSaving(true);
    try {
      await api.patch(`/users/${customer.id}/points`, {
        delta: sign * Math.abs(value),
        reason: reason || (sign > 0 ? 'Manual credit' : 'Manual debit'),
      });
      toast.success('ปรับแต้มสำเร็จ');
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'ปรับไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="sm" title="ปรับแต้ม" description={`${customer.name || customer.phone || 'Customer'} · ปัจจุบัน ${customer.points} แต้ม`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button variant="danger" onClick={() => submit(-1)} loading={saving} leftIcon={<Minus size={14} />}>หัก</Button>
          <Button variant="success" onClick={() => submit(1)} loading={saving} leftIcon={<Plus size={14} />}>เพิ่ม</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="จำนวนแต้ม" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="เช่น 50" />
        <Textarea label="เหตุผล" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น โปรโมชันต้อนรับสมาชิกใหม่" />
      </div>
    </Modal>
  );
}
