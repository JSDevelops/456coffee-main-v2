import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  Banknote,
  BarChart3,
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard,
  DollarSign,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  History,
  ImageIcon,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Unlock,
  User,
  Users,
  Wallet,
  X,
  Zap,
  Loader2,
  UserCheck,
  UserX,
  ClipboardList,
  BadgeDollarSign,
  LogIn,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ArrowUpRight,
  Bell,
  BookOpen,
  Pin,
  Link,
} from 'lucide-react';
import { API_BASE, auth, authHeaders } from '../../api';
import { PaginationControls, useClientPagination } from '../Pagination';

// ════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════

interface DashboardData {
  kpis: {
    ordersToday: number;
    revenueToday: number;
    avgTicket: number;
    liveOrders: number;
    cancelledToday: number;
  };
  hourly: Array<{ hour: number; orders: number; revenue: number }>;
  statusBreakdown: Record<string, number>;
  platformBreakdown: Record<string, { orders: number; revenue: number }>;
  paymentBreakdown: Record<string, { count: number; amount: number }>;
  topProducts: Array<{
    productId: string;
    name: string;
    imageUrl: string | null;
    soldQty: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    ingredientId: string;
    name: string;
    unit: string;
    quantity: number;
    threshold: number;
  }>;
  recentOrders: any[];
}

interface HistoryData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  rows: any[];
}

interface Shift {
  id: string;
  branchId: string;
  openedAt: string;
  openedBy?: string | null;
  openingCash: number;
  closedAt?: string | null;
  closedBy?: string | null;
  closingCash?: number | null;
  expectedCash?: number | null;
  cashOrdersTotal?: number | null;
  variance?: number | null;
  ordersCount?: number | null;
  totalRevenue?: number | null;
  note?: string | null;
  status: 'OPEN' | 'CLOSED' | string;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'รอชำระ',
  PAID: 'ชำระแล้ว',
  PREPARING: 'กำลังทำ',
  READY_FOR_QC: 'รอตรวจ',
  READY_FOR_PICKUP: 'พร้อมรับ',
  DISPATCHED: 'จัดส่งแล้ว',
  PICKED_UP: 'รับแล้ว',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

const STATUS_TONE: Record<string, { fg: string; bg: string; dot: string }> = {
  PENDING: { fg: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  PAID: { fg: '#155e75', bg: '#cffafe', dot: '#06b6d4' },
  PREPARING: { fg: '#1e3a8a', bg: '#dbeafe', dot: '#3b82f6' },
  READY_FOR_QC: { fg: '#581c87', bg: '#f3e8ff', dot: '#a855f7' },
  READY_FOR_PICKUP: { fg: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  DISPATCHED: { fg: '#3730a3', bg: '#e0e7ff', dot: '#6366f1' },
  PICKED_UP: { fg: '#374151', bg: '#f3f4f6', dot: '#6b7280' },
  COMPLETED: { fg: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  CANCELLED: { fg: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
};

const PLATFORM_TONE: Record<string, { fg: string; bg: string; label: string }> = {
  STORE: { fg: '#7c543c', bg: 'rgba(124,84,60,0.10)', label: 'หน้าร้าน' },
  GRAB: { fg: '#00b14f', bg: 'rgba(0,177,79,0.10)', label: 'Grab' },
  LINE: { fg: '#06c755', bg: 'rgba(6,199,85,0.10)', label: 'LINE' },
  FOODPANDA: { fg: '#d70f64', bg: 'rgba(215,15,100,0.10)', label: 'Foodpanda' },
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'เงินสด',
  QR: 'QR',
  TRANSFER: 'โอน',
  ONLINE: 'ออนไลน์',
};

// ════════════════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════════════════

type Tab = 'overview' | 'history' | 'shift' | 'menu' | 'staff' | 'promos' | 'hr';

interface JwtClaims {
  sub: string;
  role: string;
  branchId?: string;
  exp?: number;
}

function decodeJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function getRole(): string {
  const t = auth.getToken();
  if (!t) return '';
  return decodeJwt(t)?.role || '';
}

export default function ManagerView({ branch }: { branch: any }) {
  const [role, setRole] = useState<string>(getRole());
  const isManager = role === 'MANAGER' || role === 'ADMIN';

  // If the staff PIN that opened this view doesn't have manager privileges,
  // gate the dashboard behind a manager PIN entry.
  if (!isManager) {
    return (
      <ManagerLoginGate
        branch={branch}
        onAuthorized={() => setRole(getRole())}
      />
    );
  }

  return <ManagerDashboard branch={branch} />;
}

function ManagerDashboard({ branch }: { branch: any }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: '#f8f5f1' }}>
      {/* Top bar */}
      <header
        className="h-16 shrink-0 flex items-center gap-3 px-5 overflow-x-auto"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece5da' }}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
          >
            <BarChart3 className="text-white" size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">
              Branch Manager
            </p>
            <p className="text-sm font-black tracking-tight text-[#2d241e] truncate max-w-[180px]">
              {branch?.name || '—'}
            </p>
          </div>
        </div>

        <div
          className="inline-flex h-10 items-center rounded-2xl p-1 shrink-0"
          style={{ background: '#f3ece1', border: '1px solid #ece5da' }}
        >
          <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={<TrendingUp size={13} />}>
            ภาพรวม
          </TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History size={13} />}>
            ออเดอร์
          </TabButton>
          <TabButton active={tab === 'shift'} onClick={() => setTab('shift')} icon={<Wallet size={13} />}>
            กะ
          </TabButton>
          <TabButton active={tab === 'menu'} onClick={() => setTab('menu')} icon={<Coffee size={13} />}>
            เมนู
          </TabButton>
          <TabButton active={tab === 'promos'} onClick={() => setTab('promos')} icon={<Tag size={13} />}>
            โปรโมชั่น
          </TabButton>
          <TabButton active={tab === 'hr'} onClick={() => setTab('hr')} icon={<ClipboardList size={13} />}>
            HR
          </TabButton>
          <TabButton active={tab === 'staff'} onClick={() => setTab('staff')} icon={<Users size={13} />}>
            พนักงาน
          </TabButton>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Calendar size={14} className="text-[#7c543c]/60" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#7c543c]/70">
              {now.toLocaleDateString('th-TH', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="text-sm font-black num text-[#2d241e]">
              {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && <OverviewTab branchId={branch?.id} />}
        {tab === 'history' && <HistoryTab branchId={branch?.id} />}
        {tab === 'shift' && <ShiftTab branchId={branch?.id} />}
        {tab === 'menu' && <MenuTab branchId={branch?.id} />}
        {tab === 'promos' && <BranchPromotionTab branchId={branch?.id} />}
        {tab === 'hr' && <HRTab branchId={branch?.id} />}
        {tab === 'staff' && <StaffTab branchId={branch?.id} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Manager Login Gate
// ════════════════════════════════════════════════════════════════════════════
function ManagerLoginGate({
  branch,
  onAuthorized,
}: {
  branch: any;
  onAuthorized: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const press = (digit: string) => {
    if (loading) return;
    if (pin.length >= 12) return;
    setError('');
    setPin((p) => p + digit);
  };
  const back = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
  };

  const submit = useCallback(async () => {
    if (!branch?.id || pin.length < 4 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: branch.id, pin }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'PIN ไม่ถูกต้อง');
      }
      const data = await res.json();
      const claims = decodeJwt(data.token);
      if (claims?.role !== 'MANAGER' && claims?.role !== 'ADMIN') {
        throw new Error('PIN นี้ไม่มีสิทธิ์ผู้จัดการ');
      }
      auth.setSession(data.token, branch.id);
      onAuthorized();
    } catch (e: any) {
      setError(e.message || 'เข้าสู่ระบบไม่สำเร็จ');
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [branch?.id, pin, loading, onAuthorized]);

  // Hardware keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        if (pin.length < 12) {
          setError('');
          setPin((p) => p + e.key);
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((p) => p.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pin, loading, submit]);

  const dots = Array.from({ length: Math.max(4, pin.length) }, (_, i) => i < pin.length);

  return (
    <div className="h-full relative overflow-hidden flex items-center justify-center p-6">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(234,88,12,0.10) 0%, transparent 55%), radial-gradient(circle at 85% 80%, rgba(124,84,60,0.12) 0%, transparent 60%), linear-gradient(180deg, #fdfaf6 0%, #f7efe3 100%)',
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fcd34d 0%, transparent 70%)', filter: 'blur(70px)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white rounded-[2.25rem] shadow-2xl overflow-hidden"
      >
        <div
          className="px-6 pt-7 pb-5 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}
          >
            <Shield size={22} />
          </div>
          <h2 className="font-black text-xl mt-3 tracking-tight">เข้าสู่ระบบผู้จัดการ</h2>
          <p className="text-xs font-bold opacity-90 mt-1">
            {branch?.name || '—'}
          </p>
        </div>

        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 text-center">
            ใส่ PIN ผู้จัดการ
          </p>
          <motion.div
            key={error ? 'err' : 'ok'}
            animate={error ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-3 py-4"
          >
            {dots.map((filled, i) => (
              <motion.div
                key={i}
                animate={{ scale: filled ? 1 : 0.85 }}
                className="w-3.5 h-3.5 rounded-full"
                style={{
                  background: error
                    ? '#e11d48'
                    : filled
                    ? '#ea580c'
                    : 'rgba(124,84,60,0.18)',
                  boxShadow: filled && !error ? '0 0 0 5px rgba(234,88,12,0.12)' : 'none',
                }}
              />
            ))}
          </motion.div>

          <div className="h-6 text-center">
            {loading ? (
              <span className="text-xs font-bold text-[#7c543c]">กำลังตรวจสอบ...</span>
            ) : error ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <AlertTriangle size={12} /> {error}
              </span>
            ) : (
              <span className="text-xs font-bold text-[#7c543c]/60">
                เฉพาะ PIN ของผู้จัดการเท่านั้น
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <KeypadButton key={d} onClick={() => press(d)} disabled={loading}>
              {d}
            </KeypadButton>
          ))}
          <KeypadButton variant="muted" onClick={back} disabled={loading || pin.length === 0}>
            ⌫
          </KeypadButton>
          <KeypadButton onClick={() => press('0')} disabled={loading}>
            0
          </KeypadButton>
          <KeypadButton variant="primary" onClick={submit} disabled={loading || pin.length < 4}>
            <ArrowRight size={20} />
          </KeypadButton>
        </div>
      </motion.div>
    </div>
  );
}

function KeypadButton({
  children,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'muted';
}) {
  const palette = {
    default: { bg: '#fdfaf6', color: '#2d241e' },
    primary: { bg: 'linear-gradient(135deg, #ea580c, #7c543c)', color: '#fff' },
    muted: { bg: '#f1ebe3', color: '#7c543c' },
  }[variant];
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      className="aspect-square rounded-2xl text-2xl font-black flex items-center justify-center disabled:opacity-30 transition-all"
      style={{
        background: palette.bg,
        color: palette.color,
        boxShadow: '0 4px 12px rgba(124,84,60,0.10)',
      }}
    >
      {children}
    </motion.button>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
      style={{
        background: active ? '#ffffff' : 'transparent',
        color: active ? '#7c543c' : '#7c543c80',
        boxShadow: active ? '0 1px 3px rgba(124,84,60,0.12)' : 'none',
      }}
    >
      {icon}
      {children}
    </button>
  );
}
function OverviewTab({ branchId }: { branchId?: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/branches/${branchId}/manager/dashboard`);
      if (!res.ok) throw new Error('Dashboard fetch failed');
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  const fetchAnnouncements = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`${API_BASE}/announcements/branch/${branchId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
    fetchAnnouncements();
    const id = setInterval(() => {
      fetchData();
      fetchAnnouncements();
    }, 30_000);
    return () => clearInterval(id);
  }, [fetchData, fetchAnnouncements, refreshKey]);

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-white/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="p-5 sm:p-6 space-y-5">
      {/* Announcements Board */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#7c543c] font-black text-sm px-1">
            <Bell size={16} className="animate-bounce" />
            <span>ประกาศและข่าวสารจาก HQ</span>
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
              {announcements.length} ใหม่
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.slice(0, 2).map((ann) => {
              const isTraining = ann.type === 'TRAINING';
              const isCourse = ann.type === 'COURSE';
              const isEvent = ann.type === 'EVENT';
              
              const borderStyle = ann.pinned 
                ? '2.5px solid #f59e0b' 
                : '1px solid #ece5da';
              
              const bgStyle = isTraining 
                ? '#eff6ff' 
                : isCourse 
                ? '#ecfdf5' 
                : isEvent 
                ? '#fffbeb' 
                : '#fafaf9';

              const iconColor = isTraining 
                ? '#3b82f6' 
                : isCourse 
                ? '#10b981' 
                : isEvent 
                ? '#f59e0b' 
                : '#7c543c';

              const typeText = isTraining 
                ? 'อบรมพนักงาน' 
                : isCourse 
                ? 'หลักสูตรสูตรอาหาร' 
                : isEvent 
                ? 'อีเวนต์ / กิจกรรม' 
                : 'ประกาศทั่วไป';

              const Icon = isTraining || isCourse 
                ? BookOpen 
                : isEvent 
                ? Sparkles 
                : Bell;

              return (
                <div
                  key={ann.id}
                  onClick={() => {
                    if (ann.responseUrl) {
                      window.open(ann.responseUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      setSelectedAnnouncement(ann);
                    }
                  }}
                  className="p-4 rounded-3xl cursor-pointer hover:shadow-sm transition-all flex items-start gap-4"
                  style={{ background: bgStyle, border: borderStyle }}
                >
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" 
                    style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    <Icon size={18} style={{ color: iconColor }} />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: iconColor }}>
                        {typeText}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ann.responseUrl && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                            <Link size={10} /> มีลิงก์ตอบรับ
                          </span>
                        )}
                        {ann.pinned && (
                          <span className="text-[9px] bg-[#f59e0b]/10 text-[#f59e0b] px-1.5 py-0.5 rounded font-black">
                            ปักหมุด
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-[#2d241e] truncate">{ann.title}</h4>
                    <p className="text-[11px] font-bold text-[#7c543c]/70 line-clamp-1">{ann.content}</p>
                    {ann.startDate && (
                      <span className="inline-block mt-1 text-[9px] font-bold text-[#7c543c]/50">
                        กำหนดจัด: {new Date(ann.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {announcements.length > 2 && (
            <div className="text-right">
              <button 
                onClick={() => setShowAllAnnouncements(true)} 
                className="text-[10px] font-black text-amber-700 hover:underline animate-pulse"
              >
                ดูประกาศทั้งหมด ({announcements.length}) →
              </button>
            </div>
          )}
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          icon={<DollarSign size={18} />}
          label="ยอดขายวันนี้"
          value={`฿${Number(data.kpis.revenueToday).toLocaleString()}`}
          color="#ea580c"
          bg="rgba(234,88,12,0.12)"
          hint={data.kpis.revenueToday > 0 ? 'รายได้รวมหลังหักยกเลิก' : '—'}
        />
        <KpiTile
          icon={<ShoppingBag size={18} />}
          label="ออเดอร์วันนี้"
          value={data.kpis.ordersToday.toLocaleString()}
          color="#10b981"
          bg="rgba(16,185,129,0.12)"
          hint={data.kpis.cancelledToday > 0 ? `ยกเลิก ${data.kpis.cancelledToday}` : 'ทั้งหมด'}
        />
        <KpiTile
          icon={<Receipt size={18} />}
          label="บิลเฉลี่ย"
          value={`฿${Number(data.kpis.avgTicket).toFixed(0)}`}
          color="#3b82f6"
          bg="rgba(59,130,246,0.12)"
          hint="ต่อออเดอร์"
        />
        <KpiTile
          icon={<Activity size={18} />}
          label="ออเดอร์ค้าง"
          value={data.kpis.liveOrders.toLocaleString()}
          color="#a855f7"
          bg="rgba(168,85,247,0.12)"
          hint="กำลังดำเนินการ"
        />
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* Hourly chart */}
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <SectionHeader
              icon={<BarChart3 size={16} />}
              title="ยอดขายแยกตามชั่วโมง"
              hint="วันนี้ · 0–24 น."
              action={
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="h-8 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-1.5"
                  style={{ background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}
                >
                  <RefreshCw size={11} /> รีเฟรช
                </button>
              }
            />
            <HourlyChart data={data.hourly} />
          </Card>
        </div>

        {/* Status breakdown */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <SectionHeader icon={<Activity size={16} />} title="สถานะออเดอร์" hint="วันนี้" />
            <div className="space-y-2">
              {Object.entries(data.statusBreakdown).length === 0 ? (
                <p className="text-xs text-[#7c543c]/50 font-bold py-6 text-center">
                  ยังไม่มีออเดอร์วันนี้
                </p>
              ) : (
                Object.entries(data.statusBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => {
                    const tone = STATUS_TONE[status] || STATUS_TONE.PENDING;
                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between p-2.5 rounded-2xl border transition-all hover:bg-[#fafaf9]"
                        style={{ border: '1px solid #ece5da', background: '#fdfaf6' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot }} />
                          <span className="text-xs font-black" style={{ color: 'var(--text)' }}>
                            {STATUS_LABEL[status] || status}
                          </span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider text-right"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot }} />
                          {STATUS_LABEL[status] || status}
                        </span>
                        <span className="text-sm font-black num text-[#2d241e]">{count}</span>
                      </div>
                    );
                  })
              )}
            </div>
          </Card>
        </div>

        {/* Top products */}
        <div className="col-span-12 lg:col-span-7">
          <Card>
            <SectionHeader icon={<TrendingUp size={16} />} title="สินค้าขายดีวันนี้" hint="Top 6" />
            {data.topProducts.length === 0 ? (
              <EmptyMini icon={<Coffee size={28} />} text="ยังไม่มีรายการขาย" />
            ) : (
              <div className="space-y-2">
                {data.topProducts.map((p, idx) => (
                  <TopProductRow key={p.productId} idx={idx} item={p} max={data.topProducts[0]?.soldQty || 1} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Payment + platform breakdown */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <Card>
            <SectionHeader icon={<Wallet size={16} />} title="ช่องทางชำระเงิน" hint="วันนี้" />
            {Object.keys(data.paymentBreakdown).length === 0 ? (
              <EmptyMini icon={<CreditCard size={28} />} text="—" />
            ) : (
              <div className="space-y-2">
                {Object.entries(data.paymentBreakdown).map(([method, info]) => (
                  <PaymentRow key={method} method={method} info={info} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader icon={<Sparkles size={16} />} title="แพลตฟอร์ม" hint="วันนี้" />
            {Object.keys(data.platformBreakdown).length === 0 ? (
              <EmptyMini icon={<ShoppingBag size={28} />} text="—" />
            ) : (
              <div className="space-y-2">
                {Object.entries(data.platformBreakdown).map(([p, info]) => {
                  const tone = PLATFORM_TONE[p] || PLATFORM_TONE.STORE;
                  return (
                    <div
                      key={p}
                      className="flex items-center justify-between p-2.5 rounded-xl"
                      style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
                    >
                      <span
                        className="inline-flex items-center px-2 h-6 rounded-md text-[10px] font-black"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        {tone.label}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-black num text-[#2d241e]">
                          ฿{Number(info.revenue).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-[#7c543c]/60 num">{info.orders} ออเดอร์</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Low stock */}
        <div className="col-span-12 lg:col-span-7">
          <Card>
            <SectionHeader
              icon={<AlertTriangle size={16} />}
              title="วัตถุดิบใกล้หมด"
              hint={`${data.lowStockItems.length} รายการ`}
              danger={data.lowStockItems.length > 0}
            />
            {data.lowStockItems.length === 0 ? (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)' }}>
                <Check size={16} className="text-emerald-600" />
                <p className="text-xs font-black text-emerald-800">วัตถุดิบทั้งหมดอยู่เหนือเกณฑ์ — เยี่ยมมาก</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.lowStockItems.map((it) => {
                  const pct = it.threshold > 0 ? Math.min(100, (it.quantity / it.threshold) * 100) : 100;
                  const critical = pct < 30;
                  return (
                    <div
                      key={it.ingredientId}
                      className="rounded-xl p-3"
                      style={{ background: '#fdfaf6', border: `1px solid ${critical ? '#fecaca' : '#ece5da'}` }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-black text-[#2d241e] truncate">{it.name}</p>
                        <p
                          className="text-xs font-black num"
                          style={{ color: critical ? '#dc2626' : '#d97706' }}
                        >
                          {it.quantity} / {it.threshold} {it.unit}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#ece5da' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: critical
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                              : 'linear-gradient(90deg, #f59e0b, #d97706)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Recent orders */}
        <div className="col-span-12 lg:col-span-5">
          <Card>
            <SectionHeader icon={<Clock size={16} />} title="ออเดอร์ล่าสุด" hint="8 รายการ" />
            {data.recentOrders.length === 0 ? (
              <EmptyMini icon={<ShoppingBag size={28} />} text="—" />
            ) : (
              <div className="space-y-1.5">
                {data.recentOrders.slice(0, 8).map((o) => {
                  const status = STATUS_TONE[o.status] || STATUS_TONE.PENDING;
                  return (
                    <div
                      key={o.id}
                      className="rounded-xl p-2.5 flex items-center gap-2.5"
                      style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-[11px] num shrink-0"
                        style={{ background: '#7c543c', color: '#fff' }}
                      >
                        #{o.queueNo || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-[#2d241e] truncate">
                          {o.customerName || 'Walk-in'}
                        </p>
                        <p className="text-[10px] text-[#7c543c]/60 num">
                          {new Date(o.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          {' · ฿'}{o.totalAmount}
                        </p>
                      </div>
                      <span
                        className="inline-flex items-center px-1.5 h-5 rounded text-[9px] font-black shrink-0"
                        style={{ background: status.bg, color: status.fg }}
                      >
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Announcement Detail Overlay Modal */}
      {selectedAnnouncement && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div 
            className="w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto text-left"
            style={{ background: 'white' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-[#ece5da]">
              <div className="space-y-1 min-w-0 flex-1">
                <span 
                  className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block"
                  style={{
                    background: selectedAnnouncement.type === 'TRAINING' ? '#eff6ff' : selectedAnnouncement.type === 'COURSE' ? '#ecfdf5' : selectedAnnouncement.type === 'EVENT' ? '#fffbeb' : '#fafaf9',
                    color: selectedAnnouncement.type === 'TRAINING' ? '#3b82f6' : selectedAnnouncement.type === 'COURSE' ? '#10b981' : selectedAnnouncement.type === 'EVENT' ? '#f59e0b' : '#7c543c',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  {selectedAnnouncement.type === 'TRAINING' 
                    ? 'อบรมพนักงาน' 
                    : selectedAnnouncement.type === 'COURSE' 
                    ? 'หลักสูตรสูตรอาหาร' 
                    : selectedAnnouncement.type === 'EVENT' 
                    ? 'อีเวนต์ / กิจกรรม' 
                    : 'ประกาศทั่วไป'}
                </span>
                <h3 className="text-base font-black text-[#2d241e] leading-snug break-words pr-2">{selectedAnnouncement.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="w-7 h-7 rounded-full bg-[#fdfaf6] border border-[#ece5da] flex items-center justify-center text-[#7c543c] shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Body */}
            <div className="text-xs font-semibold text-[#7c543c]/90 leading-relaxed whitespace-pre-wrap py-2 break-words">
              {selectedAnnouncement.content}
            </div>

            {/* Event Dates & Publication Info */}
            <div className="pt-3 border-t border-dashed border-[#ece5da] flex flex-col gap-1.5 text-[10px] font-bold text-[#7c543c]/60">
              {(selectedAnnouncement.startDate || selectedAnnouncement.endDate) && (
                <div className="text-blue-600 bg-blue-50/50 p-2 rounded-xl border border-blue-100 flex items-center gap-1.5">
                  <Sparkles size={11} className="shrink-0" />
                  <span>กำหนดการจัดกิจกรรม: </span>
                  <span>
                    {selectedAnnouncement.startDate ? new Date(selectedAnnouncement.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    {selectedAnnouncement.endDate && selectedAnnouncement.endDate !== selectedAnnouncement.startDate ? ` ถึง ${new Date(selectedAnnouncement.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center px-1">
                <span>เผยแพร่เมื่อ: {new Date(selectedAnnouncement.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</span>
                {selectedAnnouncement.pinned && (
                  <span className="text-amber-600 flex items-center gap-0.5 shrink-0">
                    <Pin size={10} className="rotate-45" /> ประกาศสำคัญปักหมุด
                  </span>
                )}
              </div>
            </div>

            {/* Close & Action Buttons */}
            <div className="pt-2 flex justify-end gap-3">
              {selectedAnnouncement.responseUrl && (
                <a 
                  href={selectedAnnouncement.responseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm inline-flex items-center gap-1.5 transition-colors"
                >
                  <Link size={13} /> ตอบรับประกาศ / ลงทะเบียน
                </a>
              )}
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-[#7c543c] text-white rounded-xl text-xs font-black shadow-sm"
              >
                รับทราบประกาศ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show All Announcements List Modal */}
      {showAllAnnouncements && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          onClick={() => setShowAllAnnouncements(false)}
        >
          <div 
            className="w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-xl max-h-[80vh] flex flex-col text-left"
            style={{ background: 'white' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-[#ece5da] shrink-0">
              <div>
                <h3 className="text-base font-black text-[#2d241e]">ประกาศและข่าวสารทั้งหมด ({announcements.length})</h3>
                <p className="text-[10px] font-bold text-[#7c543c]/60 font-medium">รายการข่าวสารและอบรมล่าสุดจาก HQ</p>
              </div>
              <button 
                onClick={() => setShowAllAnnouncements(false)}
                className="w-7 h-7 rounded-full bg-[#fdfaf6] border border-[#ece5da] flex items-center justify-center text-[#7c543c]"
              >
                <X size={14} />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 no-scrollbar">
              {announcements.map((ann) => {
                const isTraining = ann.type === 'TRAINING';
                const isCourse = ann.type === 'COURSE';
                const isEvent = ann.type === 'EVENT';
                
                const borderStyle = ann.pinned 
                  ? '2.5px solid #f59e0b' 
                  : '1px solid #ece5da';
                
                const bgStyle = isTraining 
                  ? '#eff6ff' 
                  : isCourse 
                  ? '#ecfdf5' 
                  : isEvent 
                  ? '#fffbeb' 
                  : '#fafaf9';

                const iconColor = isTraining 
                  ? '#3b82f6' 
                  : isCourse 
                  ? '#10b981' 
                  : isEvent 
                  ? '#f59e0b' 
                  : '#7c543c';

                const typeText = isTraining 
                  ? 'อบรมพนักงาน' 
                  : isCourse 
                  ? 'หลักสูตรสูตรอาหาร' 
                  : isEvent 
                  ? 'อีเวนต์ / กิจกรรม' 
                  : 'ประกาศทั่วไป';

                const Icon = isTraining || isCourse 
                  ? BookOpen 
                  : isEvent 
                  ? Sparkles 
                  : Bell;

                return (
                  <div
                    key={ann.id}
                    onClick={() => {
                      if (ann.responseUrl) {
                        window.open(ann.responseUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        setSelectedAnnouncement(ann);
                      }
                    }}
                    className="p-4 rounded-3xl cursor-pointer hover:shadow-sm transition-all flex items-start gap-4"
                    style={{ background: bgStyle, border: borderStyle }}
                  >
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" 
                      style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}
                    >
                      <Icon size={18} style={{ color: iconColor }} />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: iconColor }}>
                          {typeText}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ann.responseUrl && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                              <Link size={10} /> มีลิงก์ตอบรับ
                            </span>
                          )}
                          {ann.pinned && (
                            <span className="text-[9px] bg-[#f59e0b]/10 text-[#f59e0b] px-1.5 py-0.5 rounded font-black">
                              ปักหมุด
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-[#7c543c]/50">
                            {new Date(ann.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-[#2d241e] truncate">{ann.title}</h4>
                      <p className="text-[11px] font-bold text-[#7c543c]/70 line-clamp-2 leading-relaxed">{ann.content}</p>
                      {ann.startDate && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          กำหนดจัด: {new Date(ann.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#ece5da] flex justify-end shrink-0">
              <button 
                onClick={() => setShowAllAnnouncements(false)}
                className="px-5 py-2.5 bg-[#7c543c] text-white rounded-xl text-xs font-black shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────
function KpiTile({
  icon,
  label,
  value,
  hint,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none" style={{ background: bg }} />
      <div className="relative flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
          {icon}
        </div>
        {hint && (
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
            {hint}
          </span>
        )}
      </div>
      <p className="relative text-2xl sm:text-3xl font-black tracking-tight num text-[#2d241e]">
        {value}
      </p>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70 mt-1">
        {label}
      </p>
    </Card>
  );
}

// ─── Hourly Chart ─────────────────────────────────────────────────────────
function HourlyChart({ data }: { data: Array<{ hour: number; orders: number; revenue: number }> }) {
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-44">
        {data.map((d) => {
          const h = (d.revenue / maxRev) * 100;
          const isPeak = d.revenue === maxRev && d.revenue > 0;
          return (
            <div key={d.hour} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full relative h-full flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: d.hour * 0.01 }}
                  className="w-full rounded-t-md relative"
                  style={{
                    background: isPeak
                      ? 'linear-gradient(180deg, #ea580c, #fbbf24)'
                      : d.revenue > 0
                      ? 'linear-gradient(180deg, #7c543c, #b78b6c)'
                      : '#ece5da',
                    minHeight: d.revenue > 0 ? 4 : 2,
                  }}
                >
                  {d.revenue > 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 z-10 px-2 py-1.5 rounded-lg whitespace-nowrap shadow-lg" style={{ background: '#2d241e', color: '#fff' }}>
                      <p className="text-[10px] font-black num">฿{d.revenue.toLocaleString()}</p>
                      <p className="text-[9px] font-bold opacity-80 num">{d.orders} ออเดอร์</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d) => (
          <div key={d.hour} className="flex-1 text-center">
            {d.hour % 3 === 0 && (
              <span className="text-[9px] font-black num text-[#7c543c]/60">{d.hour}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Product Row ──────────────────────────────────────────────────────
function TopProductRow({
  idx,
  item,
  max,
}: {
  idx: number;
  item: { name: string; imageUrl: string | null; soldQty: number; revenue: number };
  max: number;
}) {
  const pct = max > 0 ? (item.soldQty / max) * 100 : 0;
  const medals = ['#fbbf24', '#94a3b8', '#cd7f32'];
  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3"
      style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden font-black text-sm num"
        style={{
          background: idx < 3 ? medals[idx] : '#ece5da',
          color: idx < 3 ? '#fff' : '#7c543c',
        }}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          `#${idx + 1}`
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#2d241e] truncate">{item.name}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#ece5da' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full"
              style={{
                background: idx === 0
                  ? 'linear-gradient(90deg, #fbbf24, #ea580c)'
                  : 'linear-gradient(90deg, #b78b6c, #7c543c)',
              }}
            />
          </div>
          <span className="text-[10px] font-black num text-[#7c543c]/70 shrink-0">
            {item.soldQty} ขาย
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-[#ea580c] num">
          ฿{Number(item.revenue).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ─── Payment Row ──────────────────────────────────────────────────────────
function PaymentRow({
  method,
  info,
}: {
  method: string;
  info: { count: number; amount: number };
}) {
  const icon = method === 'CASH' ? <Banknote size={14} /> : method === 'QR' ? <QrCode size={14} /> : <CreditCard size={14} />;
  const color = method === 'CASH' ? '#10b981' : method === 'QR' ? '#3b82f6' : '#7c543c';
  return (
    <div
      className="flex items-center justify-between p-2.5 rounded-xl"
      style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}1f`, color }}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-black text-[#2d241e]">{PAYMENT_LABEL[method] || method}</p>
          <p className="text-[10px] font-bold text-[#7c543c]/60 num">{info.count} บิล</p>
        </div>
      </div>
      <span className="text-sm font-black num text-[#2d241e]">
        ฿{Number(info.amount).toLocaleString()}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// History Tab
// ════════════════════════════════════════════════════════════════════════════
function HistoryTab({ branchId }: { branchId?: string }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [refundOrder, setRefundOrder] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', new Date(from + 'T00:00:00').toISOString());
      if (to) params.set('to', new Date(to + 'T23:59:59').toISOString());
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (platform) params.set('platform', platform);
      params.set('page', String(page));
      params.set('pageSize', '20');
      const res = await fetch(
        `${API_BASE}/branches/${branchId}/manager/history?${params.toString()}`,
      );
      if (!res.ok) throw new Error('History fetch failed');
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId, from, to, search, status, platform, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [from, to, search, status, platform]);

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c543c]/50 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขออเดอร์ / ชื่อลูกค้า..."
              className="w-full h-10 pl-10 pr-3 rounded-xl text-sm font-medium outline-none"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <DateInput value={from} onChange={setFrom} />
            <span className="self-center text-xs font-black text-[#7c543c]/60">→</span>
            <DateInput value={to} onChange={setTo} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 px-3 rounded-xl text-sm font-medium outline-none cursor-pointer"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
            >
              <option value="">ทุกสถานะ</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-10 px-3 rounded-xl text-sm font-medium outline-none cursor-pointer"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
            >
              <option value="">ทุกที่มา</option>
              <option value="STORE">หน้าร้าน</option>
              <option value="GRAB">Grab</option>
              <option value="LINE">LINE</option>
              <option value="FOODPANDA">Foodpanda</option>
            </select>
          </div>
        </div>
      </Card>

      <Card padded={false}>
        {loading && !data ? (
          <div className="p-8 text-center text-[#7c543c]/50 font-black text-xs">กำลังโหลด...</div>
        ) : !data || data.rows.length === 0 ? (
          <div className="p-12 text-center text-[#7c543c]/40">
            <Receipt size={40} strokeWidth={1.5} className="mx-auto mb-3" />
            <p className="font-black text-sm uppercase tracking-widest">ไม่พบออเดอร์ในช่วงนี้</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left" style={{ borderBottom: '1px solid #ece5da' }}>
                    <Th>คิว</Th>
                    <Th>เลขออเดอร์</Th>
                    <Th>เวลา</Th>
                    <Th>ลูกค้า</Th>
                    <Th>ที่มา</Th>
                    <Th>สถานะ</Th>
                    <Th align="right">ยอด</Th>
                    <Th align="right">การกระทำ</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((o: any) => {
                    const tone = STATUS_TONE[o.status] || STATUS_TONE.PENDING;
                    const platform = PLATFORM_TONE[o.platform] || PLATFORM_TONE.STORE;
                    return (
                      <tr key={o.id} className="hover:bg-[#fdfaf6] transition-colors" style={{ borderBottom: '1px solid #ece5da' }}>
                        <Td>
                          <span className="font-black num text-[#2d241e]">#{o.queueNo || '?'}</span>
                        </Td>
                        <Td>
                          <span className="text-[11px] font-bold num text-[#7c543c]/60">{o.orderNo}</span>
                        </Td>
                        <Td>
                          <span className="text-xs num text-[#2d241e]">
                            {new Date(o.createdAt).toLocaleString('th-TH', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-xs font-bold text-[#2d241e]">
                            {o.customerName || 'Walk-in'}
                          </span>
                        </Td>
                        <Td>
                          <span
                            className="inline-flex items-center px-2 h-5 rounded text-[9px] font-black"
                            style={{ background: platform.bg, color: platform.fg }}
                          >
                            {platform.label}
                          </span>
                        </Td>
                        <Td>
                          <span
                            className="inline-flex items-center gap-1 px-2 h-5 rounded text-[9px] font-black"
                            style={{ background: tone.bg, color: tone.fg }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ background: tone.dot }} />
                            {STATUS_LABEL[o.status] || o.status}
                          </span>
                        </Td>
                        <Td align="right">
                          <span className="text-sm font-black num text-[#ea580c]">
                            ฿{Number(o.totalAmount).toLocaleString()}
                          </span>
                        </Td>
                        <Td align="right">
                          <div className="inline-flex items-center gap-1">
                            <IconBtn title="ดู" onClick={() => setViewing(o)} icon={<Eye size={12} />} />
                            <IconBtn title="พิมพ์" onClick={() => printReceipt(o)} icon={<Printer size={12} />} />
                            {o.status !== 'CANCELLED' && (
                              <IconBtn
                                title="คืนเงิน"
                                onClick={() => setRefundOrder(o)}
                                icon={<RotateCcw size={12} />}
                                danger
                              />
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4" style={{ borderTop: '1px solid #ece5da', background: '#ffffff' }}>
              <PaginationControls
                page={data.page}
                totalPages={data.totalPages}
                totalItems={data.total}
                pageSize={data.pageSize}
                onPageChange={setPage}
                itemLabel="ออเดอร์"
              />
            </div>
          </>
        )}
      </Card>

      <AnimatePresence>
        {viewing && (
          <OrderDetailModal
            order={viewing}
            onClose={() => setViewing(null)}
            onRefund={() => {
              setRefundOrder(viewing);
              setViewing(null);
            }}
            onPrint={() => printReceipt(viewing)}
          />
        )}
        {refundOrder && (
          <RefundModal
            order={refundOrder}
            onClose={() => setRefundOrder(null)}
            onDone={() => {
              setRefundOrder(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <CalendarDays size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#7c543c]/50" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-8 pr-3 rounded-xl text-sm font-medium num outline-none"
        style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
      />
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th
      className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 py-3 px-3"
      style={{ textAlign: align || 'left' }}
    >
      {children}
    </th>
  );
}
function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <td className="py-2.5 px-3" style={{ textAlign: align || 'left' }}>
      {children}
    </td>
  );
}

function IconBtn({
  icon,
  onClick,
  title,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
      style={{
        background: '#fdfaf6',
        color: danger ? '#dc2626' : '#7c543c',
        border: '1px solid #ece5da',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? '#fee2e2' : '#f3ece1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#fdfaf6';
      }}
    >
      {icon}
    </button>
  );
}

function printReceipt(order: any) {
  // Open a new window with a minimal receipt and call print().
  const w = window.open('', '_blank', 'width=380,height=600');
  if (!w) return;
  const itemsRows = (order.items || [])
    .map(
      (it: any) =>
        `<tr><td>×${it.quantity} ${it.productName || it.product?.name || ''}</td><td style="text-align:right">฿${(it.price || 0).toLocaleString()}</td></tr>`,
    )
    .join('');
  w.document.write(`
    <!doctype html><html><head><meta charset="utf-8"/>
    <title>Receipt ${order.orderNo}</title>
    <style>
      body { font-family: Prompt, sans-serif; padding: 16px; }
      h1 { text-align: center; margin: 0; font-size: 18px; }
      .queue { text-align: center; font-size: 48px; font-weight: 900; color: #ea580c; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 4px 0; font-size: 12px; }
      .total { font-weight: 900; border-top: 1px dashed #999; padding-top: 6px; }
      .meta { text-align: center; font-size: 11px; color: #999; margin-bottom: 12px; }
    </style>
    </head><body>
      <h1>456 Coffee</h1>
      <p class="meta">${order.orderNo}<br/>${new Date(order.createdAt).toLocaleString('th-TH')}</p>
      <div class="queue">#${order.queueNo || '?'}</div>
      <table>${itemsRows}<tr class="total"><td>ยอดรวม</td><td style="text-align:right">฿${Number(order.totalAmount).toLocaleString()}</td></tr></table>
      <p style="text-align:center; font-size:10px; color:#999; margin-top:16px;">ขอบคุณที่ใช้บริการ</p>
      <script>window.print(); window.close();</script>
    </body></html>
  `);
  w.document.close();
}

// ─── Order detail modal ───────────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
  onRefund,
  onPrint,
}: {
  order: any;
  onClose: () => void;
  onRefund: () => void;
  onPrint: () => void;
}) {
  const status = STATUS_TONE[order.status] || STATUS_TONE.PENDING;
  const refunded =
    order.status === 'CANCELLED' || order.payment?.status === 'REFUNDED';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)', color: '#fff' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base num"
              style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}
            >
              #{order.queueNo}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 num">
                {order.orderNo}
              </p>
              <p className="font-black text-base">{order.customerName || 'Walk-in'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black"
            style={{ background: status.bg, color: status.fg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
            {STATUS_LABEL[order.status] || order.status}
          </span>
          <span className="text-[10px] font-bold num text-[#7c543c]/70">
            {new Date(order.createdAt).toLocaleString('th-TH')}
          </span>
          {refunded && (
            <span className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black bg-rose-50 text-rose-700">
              <RotateCcw size={10} /> คืนเงินแล้ว
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2 no-scrollbar">
          {(order.items || []).map((it: any, idx: number) => (
            <div
              key={idx}
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] num" style={{ background: '#ece5da', color: '#7c543c' }}>
                ×{it.quantity}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#2d241e] truncate">
                  {it.productName || it.product?.name}
                </p>
                {it.selectedOptions && Array.isArray(it.selectedOptions) && it.selectedOptions.length > 0 && (
                  <p className="text-[10px] font-bold text-[#7c543c]/60 truncate">
                    {it.selectedOptions.map((o: any) => o.label).join(' · ')}
                  </p>
                )}
              </div>
              <span className="text-sm font-black num text-[#ea580c]">
                ฿{Number(it.price || 0).toLocaleString()}
              </span>
            </div>
          ))}
          {order.note && (
            <div className="rounded-xl p-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">หมายเหตุ</p>
              <p className="text-xs text-amber-900 whitespace-pre-line">{order.note}</p>
            </div>
          )}
        </div>

        <div
          className="px-5 py-3 flex items-end justify-between"
          style={{ borderTop: '1px solid #ece5da', background: '#fdfaf6' }}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">
            ยอดสุทธิ
          </span>
          <span className="text-2xl font-black num text-[#2d241e]">
            ฿{Number(order.totalAmount).toLocaleString()}
          </span>
        </div>

        <div className="p-3 flex gap-2" style={{ borderTop: '1px solid #ece5da' }}>
          <button
            onClick={onPrint}
            className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
            style={{ background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}
          >
            <Printer size={13} /> พิมพ์
          </button>
          {!refunded && (
            <button
              onClick={onRefund}
              className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
            >
              <RotateCcw size={13} /> คืนเงิน
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Refund modal ─────────────────────────────────────────────────────────
function RefundModal({
  order,
  onClose,
  onDone,
}: {
  order: any;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผล');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'คืนเงินไม่สำเร็จ');
      }
      onDone();
    } catch (e: any) {
      setError(e.message || 'คืนเงินไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md" onClick={() => !submitting && onClose()} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="p-5 text-center" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: '#dc2626', color: '#fff' }}>
            <RotateCcw size={22} />
          </div>
          <h2 className="font-black text-lg text-[#2d241e] mt-3">ยืนยันคืนเงิน</h2>
          <p className="text-xs font-bold text-rose-700 mt-1 num">
            {order.orderNo} · ฿{Number(order.totalAmount).toLocaleString()}
          </p>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs font-bold text-[#7c543c]/80">
            การกระทำนี้จะ <strong className="text-rose-600">ยกเลิกออเดอร์</strong> และบันทึกเป็นรายจ่ายในระบบ Cashflow ทันที
          </p>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
              เหตุผลการคืนเงิน *
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="เช่น ลูกค้าเปลี่ยนใจ / ทำผิด / สินค้าไม่ตรงตามสั่ง..."
              className="w-full p-3 rounded-xl text-sm font-medium outline-none resize-none"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
            />
          </div>
          {error && (
            <div className="rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold bg-rose-50 text-rose-700">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid #ece5da' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest"
            style={{ background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
          >
            {submitting ? 'กำลังบันทึก...' : (
              <>
                <Check size={13} /> ยืนยันคืนเงิน
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Shift Tab
// ════════════════════════════════════════════════════════════════════════════
function ShiftTab({ branchId }: { branchId?: string }) {
  const [current, setCurrent] = useState<Shift | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const paginatedHistory = useClientPagination(history, 8, branchId || null);

  const fetchAll = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [cur, hist] = await Promise.all([
        fetch(`${API_BASE}/branches/${branchId}/shift/current`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/branches/${branchId}/shift/history?limit=100`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setCurrent(cur);
      setHistory(hist);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="p-5 sm:p-6 space-y-5">
      {/* Current shift / Open shift */}
      <Card>
        <SectionHeader
          icon={<Wallet size={16} />}
          title="กะปัจจุบัน"
          hint={current ? 'เปิดอยู่' : 'ยังไม่เปิดกะ'}
        />
        {loading ? (
          <div className="h-20 rounded-2xl bg-[#fdfaf6] animate-pulse" />
        ) : current ? (
          <CurrentShiftCard shift={current} onCloseShift={() => setCloseModal(true)} />
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#fdfaf6', border: '1px dashed #d4c5b0' }}
          >
            <Lock size={28} className="mx-auto mb-2 text-[#7c543c]/40" />
            <p className="text-sm font-black text-[#2d241e]">ยังไม่เปิดกะวันนี้</p>
            <p className="text-xs font-bold text-[#7c543c]/60 mt-1">
              เปิดกะเพื่อบันทึกเงินสดเริ่มต้นและเริ่มนับยอดประจำวัน
            </p>
            <button
              onClick={() => setOpenModal(true)}
              className="mt-4 h-11 px-5 rounded-2xl text-xs font-black uppercase tracking-widest text-white inline-flex items-center gap-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)', boxShadow: '0 8px 24px rgba(234,88,12,0.30)' }}
            >
              <Unlock size={14} /> เปิดกะ
            </button>
          </div>
        )}
      </Card>

      {/* History */}
      <Card>
        <SectionHeader
          icon={<History size={16} />}
          title="ประวัติกะ"
          hint={`${history.length} กะล่าสุด`}
        />
        {loading ? (
          <div className="h-20 rounded-2xl bg-[#fdfaf6] animate-pulse" />
        ) : history.length === 0 ? (
          <EmptyMini icon={<FileText size={28} />} text="ยังไม่มีประวัติกะ" />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full">
              <thead>
                <tr className="text-left" style={{ borderBottom: '1px solid #ece5da' }}>
                  <Th>เปิดกะ</Th>
                  <Th>ปิดกะ</Th>
                  <Th align="right">เงินเริ่ม</Th>
                  <Th align="right">ขายเงินสด</Th>
                  <Th align="right">คาดว่าควรมี</Th>
                  <Th align="right">นับจริง</Th>
                  <Th align="right">ส่วนต่าง</Th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.pageItems.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #ece5da' }} className="hover:bg-[#fdfaf6]">
                    <Td>
                      <span className="text-xs num text-[#2d241e]">
                        {new Date(s.openedAt).toLocaleString('th-TH', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </Td>
                    <Td>
                      {s.closedAt ? (
                        <span className="text-xs num text-[#2d241e]">
                          {new Date(s.closedAt).toLocaleString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded text-[9px] font-black bg-emerald-100 text-emerald-700">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> เปิดอยู่
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      <span className="text-xs font-black num text-[#7c543c]">
                        ฿{Number(s.openingCash).toLocaleString()}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="text-xs font-black num text-[#7c543c]">
                        {s.cashOrdersTotal != null ? `฿${Number(s.cashOrdersTotal).toLocaleString()}` : '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="text-xs font-black num text-[#2d241e]">
                        {s.expectedCash != null ? `฿${Number(s.expectedCash).toLocaleString()}` : '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="text-xs font-black num text-[#2d241e]">
                        {s.closingCash != null ? `฿${Number(s.closingCash).toLocaleString()}` : '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      {s.variance != null ? (
                        <span
                          className="text-xs font-black num"
                          style={{
                            color:
                              s.variance === 0
                                ? '#10b981'
                                : Math.abs(s.variance) < 50
                                ? '#d97706'
                                : '#dc2626',
                          }}
                        >
                          {s.variance > 0 ? '+' : ''}
                          ฿{Number(s.variance).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs num text-[#7c543c]/40">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PaginationControls
              page={paginatedHistory.page}
              totalPages={paginatedHistory.totalPages}
              totalItems={paginatedHistory.totalItems}
              pageSize={paginatedHistory.pageSize}
              onPageChange={paginatedHistory.setPage}
              itemLabel="กะ"
            />
          </div>
        )}
      </Card>

      <AnimatePresence>
        {openModal && (
          <OpenShiftModal
            branchId={branchId!}
            onClose={() => setOpenModal(false)}
            onDone={() => {
              setOpenModal(false);
              fetchAll();
            }}
          />
        )}
        {closeModal && current && (
          <CloseShiftModal
            shift={current}
            onClose={() => setCloseModal(false)}
            onDone={() => {
              setCloseModal(false);
              fetchAll();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Current shift card ───────────────────────────────────────────────────
function CurrentShiftCard({
  shift,
  onCloseShift,
}: {
  shift: Shift;
  onCloseShift: () => void;
}) {
  const openedAt = new Date(shift.openedAt);
  const elapsedMin = Math.floor((Date.now() - openedAt.getTime()) / 60_000);
  const hours = Math.floor(elapsedMin / 60);
  const mins = elapsedMin % 60;
  return (
    <div
      className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)' }}
    >
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-30 pointer-events-none"
        style={{ background: '#fcd34d', filter: 'blur(40px)' }}
      />
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}>
            <Unlock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">เปิดเมื่อ</p>
            <p className="text-base font-black num">
              {openedAt.toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[10px] font-black backdrop-blur"
          style={{ background: 'rgba(255,255,255,0.20)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> OPEN
        </span>
      </div>

      <div className="relative grid grid-cols-2 gap-3 mb-4">
        <ShiftStat label="เงินสดเริ่มต้น" value={`฿${Number(shift.openingCash).toLocaleString()}`} />
        <ShiftStat
          label="เปิดมาแล้ว"
          value={hours > 0 ? `${hours} ชม. ${mins} นาที` : `${mins} นาที`}
        />
      </div>

      <button
        onClick={onCloseShift}
        className="relative w-full h-12 rounded-2xl bg-white text-rose-600 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg"
      >
        <Lock size={14} /> ปิดกะ + นับเงิน
      </button>
    </div>
  );
}

function ShiftStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{label}</p>
      <p className="text-lg font-black num">{value}</p>
    </div>
  );
}

// ─── Open shift modal ─────────────────────────────────────────────────────
function OpenShiftModal({
  branchId,
  onClose,
  onDone,
}: {
  branchId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [openingCash, setOpeningCash] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [clockedInStaff, setClockedInStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffPin, setSelectedStaffPin] = useState('');
  const [openingCounts, setOpeningCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const resStaff = await fetch(`${API_BASE}/branches/${branchId}/managers`, {
          headers: authHeaders()
        });
        if (resStaff.ok) {
          const staffData = await resStaff.json();
          setBranchStaff(staffData);
        }

        const resAtt = await fetch(`${API_BASE}/hr/attendance?branchId=${branchId}`, {
          headers: authHeaders()
        });
        if (resAtt.ok) {
          const attData = await resAtt.json();
          setClockedInStaff(attData);
        }

        const resInv = await fetch(`${API_BASE}/branches/${branchId}/inventory`, {
          headers: authHeaders()
        });
        if (resInv.ok) {
          const invData = await resInv.json();
          setInventory(invData);
          const initialCounts: Record<string, number> = {};
          invData.forEach((item: any) => {
            initialCounts[item.ingredientId] = item.quantity;
          });
          setOpeningCounts(initialCounts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [branchId]);

  const displayStaff = useMemo(() => {
    const activeStaff = branchStaff.filter((s: any) => s.isActive);
    const workingStaff = clockedInStaff
      .filter((a: any) => !a.clockOut)
      .map((a: any) => activeStaff.find((s: any) => s.id === a.staffId))
      .filter(Boolean);
    return workingStaff.length > 0 ? workingStaff : activeStaff;
  }, [branchStaff, clockedInStaff]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const paginatedInventory = useClientPagination(filteredInventory, 5, branchId);

  const submit = async () => {
    const cash = parseFloat(openingCash || '0');
    if (cash < 0 || isNaN(cash)) {
      setError('กรุณากรอกจำนวนเงินสดเริ่มต้นที่ถูกต้อง');
      return;
    }

    const staffMember = branchStaff.find((s: any) => s.id === selectedStaffId);
    if (!staffMember) {
      setError('กรุณาเลือกพนักงานที่ทำหน้าที่นับสต็อก');
      return;
    }
    if (staffMember.pin && staffMember.pin !== selectedStaffPin) {
      setError('รหัส PIN พนักงานไม่ถูกต้อง');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const stockArray = Object.entries(openingCounts).map(([ingredientId, actualQty]) => ({
        ingredientId,
        actualQty
      }));

      const res = await fetch(`${API_BASE}/branches/${branchId}/shift/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          openingCash: cash,
          openedBy: staffMember.name,
          note,
          openingStock: stockArray
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'เปิดกะไม่สำเร็จ');
      }
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d241e]/70 backdrop-blur-md"
    >
      <div className="absolute inset-0" onClick={() => !submitting && onClose()} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl bg-[#fdfaf6] rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 text-center text-white shrink-0 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}>
              <Unlock size={22} />
            </div>
            <div className="text-left">
              <h2 className="font-black text-lg">เปิดกะใหม่ (Open Shop Shift)</h2>
              <p className="text-xs font-bold opacity-90 mt-0.5">กรอกเงินทอนเริ่มต้นในลิ้นชัก และตรวจนับสต็อกวัตถุดิบตอนเช้า</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#7c543c]">
            <RefreshCw size={36} className="animate-spin mb-4 animate-duration-1000" />
            <p className="text-sm font-black uppercase tracking-widest opacity-60">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Ingredient Checklist */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-3xl border border-[#ece5da] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">1. นับวัตถุดิบเปิดร้าน</h3>
                      <p className="text-[10px] text-gray-400 font-bold">กรอกจำนวนที่นับได้จริงของวัตถุดิบ ณ เวลาเปิดร้าน</p>
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="ค้นหาวัตถุดิบ..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-xs bg-[#fdfaf6] rounded-xl border border-[#ece5da] font-bold text-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {paginatedInventory.pageItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#fdfaf6] border border-[#ece5da]/50 hover:bg-[#7c543c]/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#ece5da] flex items-center justify-center text-xs font-black text-slate-400">
                            {item.ingredient.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-xs">{item.ingredient.name}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">ระบบคาดไว้: {item.quantity} {item.ingredient.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-[#ece5da]">
                          <input 
                            type="number" 
                            placeholder="0"
                            value={openingCounts[item.ingredientId] ?? ''}
                            onChange={(e) => setOpeningCounts({...openingCounts, [item.ingredientId]: parseFloat(e.target.value) || 0})}
                            className="w-16 bg-transparent text-right font-black text-xs outline-none px-2 text-slate-700"
                          />
                          <span className="text-[9px] font-black text-gray-400 uppercase pr-2">{item.ingredient.unit}</span>
                        </div>
                      </div>
                    ))}
                    {filteredInventory.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-400 italic">ไม่พบรายการวัตถุดิบ</div>
                    )}
                  </div>

                  {filteredInventory.length > 0 && (
                    <PaginationControls
                      page={paginatedInventory.page}
                      totalPages={paginatedInventory.totalPages}
                      totalItems={paginatedInventory.totalItems}
                      pageSize={paginatedInventory.pageSize}
                      onPageChange={paginatedInventory.setPage}
                      itemLabel="วัตถุดิบ"
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Drawer & Verification */}
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-[#ece5da] p-5 space-y-4">
                  <h3 className="text-sm font-black text-slate-800">2. ข้อมูลลิ้นชักและผู้บันทึก</h3>
                  
                  <div className="space-y-3">
                    <NumberField
                      label="เงินสดเริ่มต้น *"
                      icon={<Banknote size={14} />}
                      value={openingCash}
                      onChange={setOpeningCash}
                      placeholder="0"
                    />

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">พนักงานที่ทำหน้าที่นับสต็อก *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select 
                          value={selectedStaffId}
                          onChange={(e) => setSelectedStaffId(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700 appearance-none"
                        >
                          <option value="">-- เลือกพนักงาน --</option>
                          {displayStaff.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role === 'STOCK' ? 'พนักงานสต็อก' : s.role === 'BRANCH_MANAGER' ? 'ผู้จัดการ' : s.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">รหัส PIN พนักงาน *</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="password" 
                          value={selectedStaffPin}
                          onChange={(e) => setSelectedStaffPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="กรอก PIN 4-12 หลักเพื่อยืนยัน"
                          maxLength={12}
                          className="w-full pl-9 pr-3 py-2.5 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-black text-xs outline-none text-slate-700 tracking-widest"
                        />
                      </div>
                    </div>

                    <TextArea 
                      label="หมายเหตุ" 
                      value={note} 
                      onChange={setNote} 
                      placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)" 
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold bg-rose-50 text-rose-700">
                      <AlertTriangle size={14} className="shrink-0" /> {error}
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={onClose}
                      disabled={submitting}
                      className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest bg-[#fdfaf6] text-[#7c543c] border border-[#ece5da] hover:bg-[#ece5da]/20"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={submit}
                      disabled={submitting || !openingCash || !selectedStaffId || !selectedStaffPin}
                      className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 disabled:opacity-55"
                      style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
                    >
                      {submitting ? 'กำลังบันทึก...' : (
                        <>
                          <Unlock size={13} /> เปิดกะ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Close shift modal ────────────────────────────────────────────────────
function CloseShiftModal({
  shift,
  onClose,
  onDone,
}: {
  shift: Shift;
  onClose: () => void;
  onDone: () => void;
}) {
  const [closingCash, setClosingCash] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [clockedInStaff, setClockedInStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedCloseStaffId, setSelectedCloseStaffId] = useState('');
  const [selectedCloseStaffPin, setSelectedCloseStaffPin] = useState('');
  const [closingCounts, setClosingCounts] = useState<Record<string, number>>({});
  const [wastes, setWastes] = useState<Record<string, { qty: number; reason: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentShiftData, setCurrentShiftData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const resShift = await fetch(`${API_BASE}/branches/${shift.branchId}/shift/current`, {
          headers: authHeaders()
        });
        if (resShift.ok) {
          const shiftData = await resShift.json();
          setCurrentShiftData(shiftData);
        }

        const resStaff = await fetch(`${API_BASE}/branches/${shift.branchId}/managers`, {
          headers: authHeaders()
        });
        if (resStaff.ok) {
          const staffData = await resStaff.json();
          setBranchStaff(staffData);
        }

        const resAtt = await fetch(`${API_BASE}/hr/attendance?branchId=${shift.branchId}`, {
          headers: authHeaders()
        });
        if (resAtt.ok) {
          const attData = await resAtt.json();
          setClockedInStaff(attData);
        }

        const resInv = await fetch(`${API_BASE}/branches/${shift.branchId}/inventory`, {
          headers: authHeaders()
        });
        if (resInv.ok) {
          const invData = await resInv.json();
          setInventory(invData);
          const initialCounts: Record<string, number> = {};
          invData.forEach((item: any) => {
            initialCounts[item.ingredientId] = item.quantity;
          });
          setClosingCounts(initialCounts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [shift.branchId, shift.id]);

  const displayStaff = useMemo(() => {
    const activeStaff = branchStaff.filter((s: any) => s.isActive);
    const workingStaff = clockedInStaff
      .filter((a: any) => !a.clockOut)
      .map((a: any) => activeStaff.find((s: any) => s.id === a.staffId))
      .filter(Boolean);
    return workingStaff.length > 0 ? workingStaff : activeStaff;
  }, [branchStaff, clockedInStaff]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const paginatedInventory = useClientPagination(filteredInventory, 5, shift.branchId);

  // Real-time calculations for previewing closing score
  const closingStatsPreview = useMemo(() => {
    let totalWasteCost = 0;
    let totalVarianceCost = 0;
    let totalOpeningStockCost = 0;

    inventory.forEach(item => {
      const ingredientId = item.ingredientId;
      const costPerUnit = item.ingredient.costPerUnit || 0;
      const expected = item.quantity;
      const actual = closingCounts[ingredientId] ?? expected;
      const wasteQty = wastes[ingredientId]?.qty || 0;

      const variance = actual - (expected - wasteQty);
      
      totalWasteCost += wasteQty * costPerUnit;
      totalVarianceCost += variance * costPerUnit;

      const starting = currentShiftData?.openingStock?.find((s: any) => s.ingredientId === ingredientId)?.actualQty ?? 0;
      totalOpeningStockCost += starting * costPerUnit;
    });

    const revenue = currentShiftData?.liveTotalRevenue || 0;
    const absVarianceCost = Math.abs(totalVarianceCost);
    
    let varianceDeduction = 0;
    let wasteDeduction = 0;

    if (revenue > 0) {
      varianceDeduction = Math.min(50, (absVarianceCost / revenue) * 100 * 5);
      wasteDeduction = Math.min(50, (totalWasteCost / revenue) * 100 * 2);
    } else if (totalOpeningStockCost > 0) {
      varianceDeduction = Math.min(50, (absVarianceCost / totalOpeningStockCost) * 100 * 5);
      wasteDeduction = Math.min(50, (totalWasteCost / totalOpeningStockCost) * 100 * 2);
    } else {
      varianceDeduction = absVarianceCost > 0 ? 10 : 0;
      wasteDeduction = totalWasteCost > 0 ? 5 : 0;
    }

    const score = Math.max(0, 100 - varianceDeduction - wasteDeduction);
    let grade = 'A+';
    if (score >= 95) grade = 'A+';
    else if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      wasteCost: totalWasteCost,
      varianceCost: totalVarianceCost,
      score,
      grade
    };
  }, [inventory, closingCounts, wastes, currentShiftData]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return { text: '#10b981', bg: 'rgba(16,185,129,0.1)', border: '#10b981' };
      case 'B': return { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' };
      case 'C': return { text: '#eab308', bg: 'rgba(234,179,8,0.1)', border: '#eab308' };
      case 'D': return { text: '#f97316', bg: 'rgba(249,115,22,0.1)', border: '#f97316' };
      default: return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: '#ef4444' };
    }
  };

  const submit = async () => {
    const cash = parseFloat(closingCash || '0');
    if (cash < 0 || isNaN(cash) || closingCash === '') {
      setError('กรุณากรอกจำนวนเงินสดที่นับได้สิ้นวัน');
      return;
    }

    const staffMember = branchStaff.find((s: any) => s.id === selectedCloseStaffId);
    if (!staffMember) {
      setError('กรุณาเลือกพนักงานที่ทำหน้าที่นับสต็อก');
      return;
    }
    if (staffMember.pin && staffMember.pin !== selectedCloseStaffPin) {
      setError('รหัส PIN พนักงานไม่ถูกต้อง');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const stockArray = inventory.map(item => {
        const ingredientId = item.ingredientId;
        const actualQty = closingCounts[ingredientId] ?? item.quantity;
        const wasteQty = wastes[ingredientId]?.qty || 0;
        const wasteReason = wastes[ingredientId]?.reason || '';
        return {
          ingredientId,
          actualQty,
          wasteQty,
          wasteReason
        };
      });

      const res = await fetch(`${API_BASE}/shift/${shift.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          closingCash: cash,
          closedBy: staffMember.name,
          note,
          closingStock: stockArray
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'ปิดกะไม่สำเร็จ');
      }
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d241e]/70 backdrop-blur-md"
    >
      <div className="absolute inset-0" onClick={() => !submitting && onClose()} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl bg-[#fdfaf6] rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 text-center text-white shrink-0 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2d241e, #7c543c)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}>
              <Lock size={22} />
            </div>
            <div className="text-left">
              <h2 className="font-black text-lg">ปิดกะ + นับเงินสดและตรวจสต็อกสิ้นวัน</h2>
              <p className="text-xs font-bold opacity-80 mt-0.5">
                เปิดเมื่อ {new Date(shift.openedAt).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#7c543c]">
            <RefreshCw size={36} className="animate-spin mb-4 animate-duration-1000" />
            <p className="text-sm font-black uppercase tracking-widest opacity-60">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Ingredient Checklist */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-3xl border border-[#ece5da] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">1. ตรวจนับสต็อกสิ้นวัน</h3>
                      <p className="text-[10px] text-gray-400 font-bold">นับจำนวนคงเหลือจริงบนเชลฟ์ และกรอกของเสีย (Waste)</p>
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="ค้นหาวัตถุดิบ..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-xs bg-[#fdfaf6] rounded-xl border border-[#ece5da] font-bold text-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {paginatedInventory.pageItems.map((item) => (
                      <div key={item.id} className="p-3 rounded-2xl bg-[#fdfaf6]/50 border border-[#ece5da] space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white border border-[#ece5da] flex items-center justify-center text-xs font-black text-[#7c543c]">
                              {item.ingredient.name[0]}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 text-xs">{item.ingredient.name}</h4>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">คาดว่าควรมี: {item.quantity} {item.ingredient.unit}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-[#ece5da]">
                            <span className="text-[9px] text-gray-400 font-bold uppercase pl-2">นับจริง:</span>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={closingCounts[item.ingredientId] ?? ''}
                              onChange={(e) => setClosingCounts({...closingCounts, [item.ingredientId]: parseFloat(e.target.value) || 0})}
                              className="w-16 bg-transparent text-right font-black text-xs outline-none px-2 text-slate-700"
                            />
                            <span className="text-[9px] font-black text-gray-300 pr-2">{item.ingredient.unit}</span>
                          </div>
                        </div>

                        {/* Waste entry */}
                        <div className="flex items-center gap-2 bg-rose-50/20 p-2 rounded-xl border border-rose-100/30">
                          <span className="text-[9px] font-black text-rose-500 shrink-0">ของเสีย:</span>
                          <input 
                            type="number" 
                            placeholder="จำนวน"
                            value={wastes[item.ingredientId]?.qty ?? ''}
                            onChange={(e) => setWastes({
                              ...wastes, 
                              [item.ingredientId]: { ...wastes[item.ingredientId], qty: parseFloat(e.target.value) || 0, reason: wastes[item.ingredientId]?.reason || '' }
                            })}
                            className="w-14 p-1 bg-white rounded-lg border border-rose-100/50 font-black text-[10px] outline-none text-rose-600"
                          />
                          <input 
                            type="text" 
                            placeholder="เหตุผล (ทิ้ง, ทำหก, บูด...)"
                            value={wastes[item.ingredientId]?.reason ?? ''}
                            onChange={(e) => setWastes({
                              ...wastes, 
                              [item.ingredientId]: { ...wastes[item.ingredientId], reason: e.target.value, qty: wastes[item.ingredientId]?.qty || 0 }
                            })}
                            className="flex-1 p-1 bg-white rounded-lg border border-gray-100 font-bold text-[10px] outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    {filteredInventory.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-400 italic">ไม่พบรายการวัตถุดิบ</div>
                    )}
                  </div>

                  {filteredInventory.length > 0 && (
                    <PaginationControls
                      page={paginatedInventory.page}
                      totalPages={paginatedInventory.totalPages}
                      totalItems={paginatedInventory.totalItems}
                      pageSize={paginatedInventory.pageSize}
                      onPageChange={paginatedInventory.setPage}
                      itemLabel="วัตถุดิบ"
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Preview Score & Verification */}
              <div className="space-y-4">
                {/* Rating score preview card */}
                <div className="bg-white rounded-3xl border border-[#ece5da] p-5 text-center space-y-3 animate-pulse-once">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">คะแนนประสิทธิภาพของกะ</h3>
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center rounded-full border-4 animate-duration-1000" style={{
                    borderColor: getGradeColor(closingStatsPreview.grade).border,
                    boxShadow: `0 0 15px ${getGradeColor(closingStatsPreview.grade).bg}`,
                    backgroundColor: getGradeColor(closingStatsPreview.grade).bg
                  }}>
                    <div className="text-center">
                      <span className="block text-2xl font-black italic tracking-tighter" style={{ color: getGradeColor(closingStatsPreview.grade).text }}>
                        {closingStatsPreview.grade}
                      </span>
                      <span className="text-[9px] font-black text-slate-500 uppercase">
                        {Math.round(closingStatsPreview.score)} คะแนน
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-left text-xs font-bold">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ของเสีย (Waste):</span>
                      <span className="text-rose-500 font-black">฿{closingStatsPreview.wasteCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ผิดพลาด (Shrinkage):</span>
                      <span className="font-black" style={{ color: closingStatsPreview.varianceCost < 0 ? '#ef4444' : '#10b981' }}>
                        {closingStatsPreview.varianceCost > 0 ? '+' : ''}
                        ฿{closingStatsPreview.varianceCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Closing Cash & Submit */}
                <div className="bg-white rounded-3xl border border-[#ece5da] p-5 space-y-4">
                  <h3 className="text-sm font-black text-slate-800">2. ข้อมูลปิดกะ & เงินสด</h3>

                  <div className="space-y-3">
                    <div className="rounded-xl p-3 flex justify-between items-center bg-[#fdfaf6] border border-[#ece5da]">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/70">เงินเริ่มต้น</span>
                      <span className="text-xs font-black num text-[#2d241e]">
                        ฿{Number(shift.openingCash).toLocaleString()}
                      </span>
                    </div>

                    <NumberField
                      label="เงินสดที่นับได้ *"
                      icon={<Banknote size={14} />}
                      value={closingCash}
                      onChange={setClosingCash}
                      placeholder="0"
                    />
                    <span className="text-[9px] text-gray-400 font-bold block -mt-2">
                      ระบบคาดการณ์: ฿{((currentShiftData?.openingCash || 0) + (currentShiftData?.liveCashOrdersTotal || 0)).toLocaleString()}
                    </span>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">พนักงานที่ทำหน้าที่นับสต็อก *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select 
                          value={selectedCloseStaffId}
                          onChange={(e) => setSelectedCloseStaffId(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700 appearance-none"
                        >
                          <option value="">-- เลือกพนักงาน --</option>
                          {displayStaff.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role === 'STOCK' ? 'พนักงานสต็อก' : s.role === 'BRANCH_MANAGER' ? 'ผู้จัดการ' : s.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">รหัส PIN พนักงาน *</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="password" 
                          value={selectedCloseStaffPin}
                          onChange={(e) => setSelectedCloseStaffPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="กรอก PIN เพื่อยืนยันการนับสต็อก"
                          maxLength={12}
                          className="w-full pl-9 pr-3 py-2.5 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-black text-xs outline-none text-slate-700 tracking-widest"
                        />
                      </div>
                    </div>

                    <TextArea 
                      label="หมายเหตุ" 
                      value={note} 
                      onChange={setNote} 
                      placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)" 
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold bg-rose-50 text-rose-700">
                      <AlertTriangle size={14} className="shrink-0" /> {error}
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={onClose}
                      disabled={submitting}
                      className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest bg-[#fdfaf6] text-[#7c543c] border border-[#ece5da] hover:bg-[#ece5da]/20"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={submit}
                      disabled={submitting || !closingCash || !selectedCloseStaffId || !selectedCloseStaffPin}
                      className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 disabled:opacity-55"
                      style={{ background: 'linear-gradient(135deg, #2d241e, #7c543c)' }}
                    >
                      {submitting ? 'กำลังบันทึก...' : (
                        <>
                          <ArrowDownCircle size={13} /> ปิดกะ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Generic UI bits
// ════════════════════════════════════════════════════════════════════════════

function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div
      className={`relative rounded-3xl overflow-hidden shadow-sm ${padded ? 'p-5' : ''}`}
      style={{ background: '#ffffff', border: '1px solid #ece5da' }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  hint,
  action,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span style={{ color: danger ? '#dc2626' : '#7c543c' }}>{icon}</span>
        <h3 className="font-black text-sm text-[#2d241e]">{title}</h3>
        {hint && (
          <span
            className="text-[10px] font-black uppercase tracking-widest px-1.5 h-5 rounded inline-flex items-center"
            style={{
              background: danger ? '#fee2e2' : '#fdfaf6',
              color: danger ? '#dc2626' : '#7c543c80',
            }}
          >
            {hint}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-[#7c543c]/40">
      {icon}
      <p className="mt-2 text-xs font-black uppercase tracking-widest">{text}</p>
    </div>
  );
}

function NumberField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c543c]/50">
            {icon}
          </span>
        )}
        <input
          autoFocus={autoFocus}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder={placeholder}
          className={`w-full h-11 rounded-xl text-base font-black num outline-none ${icon ? 'pl-9' : 'pl-3'} pr-3`}
          style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-xl text-sm font-medium outline-none"
        style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full p-3 rounded-xl text-sm font-medium outline-none resize-none"
        style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Menu Tab — table view with per-branch availability toggle
// ════════════════════════════════════════════════════════════════════════════

interface BranchProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: string; // global
  effectiveStatus: string; // what the branch sees
  globalStatus: string;
  categoryId: string | null;
  category: { id: string; name: string; icon: string | null } | null;
  branchOverride: { status: string; reason: string | null; updatedAt: string } | null;
  optionGroups: any[];
  _count?: { orderItems: number };
}

function MenuTab({ branchId }: { branchId?: string }) {
  const [products, setProducts] = useState<BranchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'OVERRIDE'>('ALL');
  const [activeCat, setActiveCat] = useState<string>('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const prods = await fetch(`${API_BASE}/branches/${branchId}/menu`).then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      });
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string | null; count: number }>();
    for (const p of products) {
      if (!p.category) continue;
      const cur = map.get(p.category.id);
      if (cur) cur.count += 1;
      else map.set(p.category.id, { ...p.category, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat) list = list.filter((p) => p.categoryId === activeCat);
    if (statusFilter === 'AVAILABLE')
      list = list.filter((p) => p.effectiveStatus === 'AVAILABLE');
    else if (statusFilter === 'OUT_OF_STOCK')
      list = list.filter((p) => p.effectiveStatus === 'OUT_OF_STOCK');
    else if (statusFilter === 'OVERRIDE')
      list = list.filter((p) => !!p.branchOverride);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCat, statusFilter, search]);
  const paginatedProducts = useClientPagination(
    filtered,
    10,
    `${branchId || ''}:${activeCat}:${statusFilter}:${search.trim().toLowerCase()}`,
  );

  const stats = useMemo(() => {
    const total = products.length;
    const avail = products.filter((p) => p.effectiveStatus === 'AVAILABLE').length;
    const out = products.filter((p) => p.effectiveStatus === 'OUT_OF_STOCK').length;
    const overridden = products.filter((p) => !!p.branchOverride).length;
    return { total, avail, out, overridden };
  }, [products]);

  const toggleStatus = async (p: BranchProduct) => {
    if (!branchId || pendingId) return;
    const next = p.effectiveStatus === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE';
    setPendingId(p.id);
    setError('');
    // Optimistic update
    setProducts((prev) =>
      prev.map((it) =>
        it.id === p.id
          ? {
              ...it,
              effectiveStatus: next,
              branchOverride:
                next === it.globalStatus
                  ? null
                  : { status: next, reason: null, updatedAt: new Date().toISOString() },
            }
          : it,
      ),
    );
    try {
      // If next status equals the global default → clear override (revert to inherit)
      if (next === p.globalStatus) {
        const res = await fetch(`${API_BASE}/branches/${branchId}/menu/${p.id}/status`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('clear failed');
      } else {
        const res = await fetch(`${API_BASE}/branches/${branchId}/menu/${p.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || 'update failed');
        }
      }
    } catch (e: any) {
      setError(e.message || 'อัปเดตไม่สำเร็จ');
      // Rollback
      fetchAll();
    } finally {
      setPendingId(null);
    }
  };

  const setAllInView = async (target: 'AVAILABLE' | 'OUT_OF_STOCK') => {
    if (!branchId || filtered.length === 0) return;
    if (
      !confirm(
        `${target === 'AVAILABLE' ? 'เปิดขาย' : 'ปิดขาย'} ${filtered.length} เมนูที่กำลังแสดงทั้งหมด?`,
      )
    )
      return;
    setLoading(true);
    try {
      await Promise.all(
        filtered.map((p) =>
          p.effectiveStatus === target
            ? Promise.resolve()
            : fetch(`${API_BASE}/branches/${branchId}/menu/${p.id}/status`, {
                method: target === p.globalStatus ? 'DELETE' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:
                  target === p.globalStatus
                    ? undefined
                    : JSON.stringify({ status: target }),
              }),
        ),
      );
      await fetchAll();
    } catch (e: any) {
      setError(e.message || 'อัปเดตไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          icon={<Coffee size={18} />}
          label="พร้อมขาย"
          value={stats.avail.toLocaleString()}
          color="#10b981"
          bg="rgba(16,185,129,0.12)"
          hint={`/ ${stats.total} เมนู`}
        />
        <KpiTile
          icon={<AlertTriangle size={18} />}
          label="ปิดขายที่สาขา"
          value={stats.out.toLocaleString()}
          color="#d97706"
          bg="rgba(217,119,6,0.12)"
          hint={stats.out > 0 ? 'ต้องเติม' : 'ครบ'}
        />
        <KpiTile
          icon={<Sparkles size={18} />}
          label="ตั้งค่าเฉพาะสาขา"
          value={stats.overridden.toLocaleString()}
          color="#a855f7"
          bg="rgba(168,85,247,0.12)"
          hint="override"
        />
        <KpiTile
          icon={<Coffee size={18} />}
          label="หมวดหมู่"
          value={categories.length.toLocaleString()}
          color="#7c543c"
          bg="rgba(124,84,60,0.12)"
        />
      </div>

      {/* Filter bar */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c543c]/50 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเมนู..."
              className="w-full h-10 pl-10 pr-3 rounded-xl text-sm font-medium outline-none"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
            />
          </div>

          {/* Status segmented */}
          <div
            className="inline-flex h-10 items-center rounded-xl p-1 shrink-0"
            style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
          >
            {(
              [
                { id: 'ALL', label: 'ทั้งหมด', dot: '#7c543c' },
                { id: 'AVAILABLE', label: 'เปิด', dot: '#10b981' },
                { id: 'OUT_OF_STOCK', label: 'ปิด', dot: '#d97706' },
                { id: 'OVERRIDE', label: 'Override', dot: '#a855f7' },
              ] as const
            ).map((p) => {
              const active = statusFilter === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setStatusFilter(p.id)}
                  className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 transition-all"
                  style={{
                    background: active ? '#ffffff' : 'transparent',
                    color: active ? '#2d241e' : '#7c543c80',
                    boxShadow: active ? '0 1px 3px rgba(124,84,60,0.12)' : 'none',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: p.dot }}
                  />
                  {p.label}
                </button>
              );
            })}
          </div>

          <select
            value={activeCat}
            onChange={(e) => setActiveCat(e.target.value)}
            className="h-10 px-3 rounded-xl text-sm font-medium outline-none cursor-pointer min-w-[140px]"
            style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
          >
            <option value="">ทุกหมวด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon || '☕'} {c.name} ({c.count})
              </option>
            ))}
          </select>

          <button
            onClick={fetchAll}
            className="h-10 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-1.5"
            style={{ background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}
          >
            <RefreshCw size={11} /> รีเฟรช
          </button>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold text-[#7c543c]/70">
            แสดง <span className="num font-black text-[#2d241e]">{filtered.length}</span> /{' '}
            {products.length} เมนู
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setAllInView('AVAILABLE')}
              disabled={filtered.length === 0 || loading}
              className="h-8 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 disabled:opacity-40 transition-all"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.30)' }}
            >
              <Check size={11} /> เปิดทั้งหมด
            </button>
            <button
              onClick={() => setAllInView('OUT_OF_STOCK')}
              disabled={filtered.length === 0 || loading}
              className="h-8 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 disabled:opacity-40 transition-all"
              style={{ background: 'rgba(217,119,6,0.12)', color: '#d97706', border: '1px solid rgba(217,119,6,0.30)' }}
            >
              <X size={11} /> ปิดทั้งหมด
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-2.5 mb-3 flex items-center gap-2 text-xs font-bold bg-rose-50 text-rose-700">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Table */}
        {loading && products.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[#fdfaf6] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyMini icon={<Coffee size={32} />} text="ไม่พบเมนูที่ตรงกับตัวกรอง" />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full">
              <thead>
                <tr className="text-left" style={{ borderBottom: '1px solid #ece5da' }}>
                  <Th>เมนู</Th>
                  <Th>หมวด</Th>
                  <Th align="right">ราคา</Th>
                  <Th align="right">ขาย</Th>
                  <Th>สถานะที่สาขา</Th>
                  <Th align="right">เปิดขาย</Th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.pageItems.map((p) => (
                  <MenuRow
                    key={p.id}
                    product={p}
                    pending={pendingId === p.id}
                    onToggle={() => toggleStatus(p)}
                  />
                ))}
              </tbody>
            </table>

            <PaginationControls
              page={paginatedProducts.page}
              totalPages={paginatedProducts.totalPages}
              totalItems={paginatedProducts.totalItems}
              pageSize={paginatedProducts.pageSize}
              onPageChange={paginatedProducts.setPage}
              itemLabel="เมนู"
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function MenuRow({
  product,
  pending,
  onToggle,
}: {
  product: BranchProduct;
  pending: boolean;
  onToggle: () => void;
}) {
  const isOpen = product.effectiveStatus === 'AVAILABLE';
  const isOverride = !!product.branchOverride;
  const tags: string[] = useMemo(() => {
    try {
      return JSON.parse((product as any).tags || '[]');
    } catch {
      return [];
    }
  }, [product]);

  return (
    <tr
      style={{
        borderBottom: '1px solid #ece5da',
        opacity: isOpen ? 1 : 0.6,
      }}
      className="hover:bg-[#fdfaf6] transition-colors"
    >
      <Td>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fef3c7, #fed7aa)' }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={18} className="text-[#7c543c]/40" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#2d241e] truncate">{product.name}</p>
            {tags[0] && (
              <span className="text-[10px] font-bold text-[#7c543c]/60">
                {tags[0]}
              </span>
            )}
          </div>
        </div>
      </Td>
      <Td>
        {product.category ? (
          <span
            className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black"
            style={{ background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}
          >
            {product.category.icon || '☕'} {product.category.name}
          </span>
        ) : (
          <span className="text-[10px] text-[#7c543c]/40">—</span>
        )}
      </Td>
      <Td align="right">
        <span className="text-sm font-black num text-[#ea580c]">
          ฿{product.price.toLocaleString()}
        </span>
      </Td>
      <Td align="right">
        <span className="text-xs font-bold num text-[#7c543c]/70">
          {(product._count?.orderItems || 0).toLocaleString()}
        </span>
      </Td>
      <Td>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black"
            style={{
              background: isOpen ? 'rgba(16,185,129,0.12)' : 'rgba(217,119,6,0.12)',
              color: isOpen ? '#059669' : '#d97706',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isOpen ? '#10b981' : '#d97706' }}
            />
            {isOpen ? 'เปิดขาย' : 'ปิด'}
          </span>
          {isOverride && (
            <span
              className="inline-flex items-center gap-1 px-1.5 h-5 rounded text-[9px] font-black"
              style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}
              title="ปรับเฉพาะสาขานี้ — ต่างจากค่ากลาง"
            >
              <Sparkles size={9} /> เฉพาะสาขา
            </span>
          )}
        </div>
      </Td>
      <Td align="right">
        <ToggleSwitch on={isOpen} pending={pending} onChange={onToggle} />
      </Td>
    </tr>
  );
}

function ToggleSwitch({
  on,
  pending,
  onChange,
}: {
  on: boolean;
  pending: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      disabled={pending}
      role="switch"
      aria-checked={on}
      className="relative w-12 h-7 rounded-full transition-all disabled:opacity-50"
      style={{
        background: on ? 'linear-gradient(135deg, #10b981, #059669)' : '#d1d5db',
        boxShadow: on
          ? '0 0 0 4px rgba(16,185,129,0.15)'
          : 'inset 0 1px 2px rgba(0,0,0,0.10)',
      }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="absolute top-0.5 left-0 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
      >
        {pending ? (
          <RefreshCw size={11} className="animate-spin text-[#7c543c]/60" />
        ) : on ? (
          <Check size={11} className="text-emerald-600" />
        ) : (
          <X size={11} className="text-[#7c543c]/60" />
        )}
      </motion.div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HR Tab — Attendance · Leave · Payroll
// ════════════════════════════════════════════════════════════════════════════
type HRSubTab = 'overview' | 'attendance' | 'leave' | 'payroll' | 'schedule';

const LEAVE_TYPE_LABEL: Record<string, string> = {
  SICK: 'ลาป่วย', PERSONAL: 'ลากิจ', VACATION: 'ลาพักร้อน', OTHER: 'อื่นๆ',
};
const LEAVE_TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  SICK:     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  PERSONAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  VACATION: { color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  OTHER:    { color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
};
const LEAVE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ',
};
const LEAVE_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  PENDING:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  APPROVED: { color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
};
const PAY_TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'รายเดือน', HOURLY: 'รายชั่วโมง', DAILY: 'รายวัน',
};
const TH_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function HRTab({ branchId }: { branchId?: string }) {
  const [sub, setSub] = useState<HRSubTab>('overview');

  const subTabs: { id: HRSubTab; label: string; icon: JSX.Element }[] = [
    { id: 'overview',    label: 'ภาพรวม',    icon: <TrendingUp size={13} /> },
    { id: 'attendance',  label: 'เวลาทำงาน', icon: <Clock size={13} /> },
    { id: 'leave',       label: 'ใบลา',       icon: <ClipboardList size={13} /> },
    { id: 'payroll',     label: 'เงินเดือน',  icon: <BadgeDollarSign size={13} /> },
    { id: 'schedule',    label: 'ตารางงาน',  icon: <Calendar size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex gap-1 px-5 pt-4 pb-2 overflow-x-auto">
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all shrink-0"
            style={sub === t.id
              ? { background: 'linear-gradient(135deg, #fbbf24, #ea580c)', color: '#fff', boxShadow: '0 2px 8px rgba(234,88,12,0.3)' }
              : { background: '#f3ece1', color: '#7c543c', border: '1px solid #ece5da' }
            }>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {sub === 'overview'   && <HROverview   branchId={branchId} />}
        {sub === 'attendance' && <HRAttendance branchId={branchId} />}
        {sub === 'leave'      && <HRLeave      branchId={branchId} />}
        {sub === 'payroll'    && <HRPayroll    branchId={branchId} />}
        {sub === 'schedule'   && <HRSchedule   branchId={branchId} />}
      </div>
    </div>
  );
}

// ── HRSchedule ────────────────────────────────────────────────────────────────
function HRSchedule({ branchId }: { branchId?: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

  // Modal Form State
  const [formStaffId, setFormStaffId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formShiftType, setFormShiftType] = useState('MORNING');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formScheduleMode, setFormScheduleMode] = useState<'SINGLE' | 'RANGE'>('SINGLE');
  const [formEndDate, setFormEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [formWorkDays, setFormWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formOffDays, setFormOffDays] = useState<number[]>([0, 6]);

  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Monthly Plan Form State
  const [formPlanTitle, setFormPlanTitle] = useState('');
  const [formPlanDate, setFormPlanDate] = useState(new Date().toISOString().slice(0, 10));
  const [formPlanNote, setFormPlanNote] = useState('');
  const [formPlanError, setFormPlanError] = useState('');
  const [formPlanSubmitting, setFormPlanSubmitting] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const startStr = selectedWeekStart.toISOString().slice(0, 10);
      const end = new Date(selectedWeekStart);
      end.setDate(end.getDate() + 6);
      const endStr = end.toISOString().slice(0, 10);

      const res = await fetch(`${API_BASE}/hr/schedule?branchId=${branchId}&startDate=${startStr}&endDate=${endStr}`, {
        headers: authHeaders()
      });
      if (res.ok) {
        setSchedules(await res.json());
      }

      const planRes = await fetch(`${API_BASE}/hr/monthly-plan?branchId=${branchId}&startDate=${startStr}&endDate=${endStr}`, {
        headers: authHeaders()
      });
      if (planRes.ok) {
        setMonthlyPlans(await planRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedWeekStart]);

  const fetchLeaves = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`${API_BASE}/hr/leave?branchId=${branchId}&status=APPROVED`, {
        headers: authHeaders()
      });
      if (res.ok) {
        setLeaves(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, [branchId]);

  useEffect(() => {
    fetchSchedules();
    fetchLeaves();
  }, [fetchSchedules, fetchLeaves]);

  useEffect(() => {
    if (!branchId) return;
    fetch(`${API_BASE}/branches/${branchId}/managers`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setStaff(Array.isArray(d) ? d.filter(s => s.isActive) : []))
      .catch(console.error);
  }, [branchId]);

  const changeWeek = (direction: number) => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setSelectedWeekStart(newStart);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบตารางงานนี้หรือไม่?')) return;
    try {
      const res = await fetch(`${API_BASE}/hr/schedule/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        setShowModal(false);
        fetchSchedules();
      } else {
        const body = await res.json();
        alert(body?.message || 'ลบไม่สำเร็จ');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStaffId) {
      setFormError('กรุณาเลือกพนักงาน');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    if (formScheduleMode === 'RANGE') {
      if (formDate > formEndDate) {
        setFormError('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
        setFormSubmitting(false);
        return;
      }
      if (formWorkDays.length === 0 && formOffDays.length === 0) {
        setFormError('กรุณาเลือกวันทำงานหรือวันหยุดอย่างน้อย 1 วัน');
        setFormSubmitting(false);
        return;
      }

      // Check range leaves conflicts
      const start = new Date(formDate);
      const end = new Date(formEndDate);
      const conflictDates: string[] = [];

      let current = new Date(start);
      let limit = 0;
      while (current <= end && limit < 366) {
        const dayOfWeek = current.getDay();
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const isWorkDay = formWorkDays.includes(dayOfWeek);
        const isOffDay = formOffDays.includes(dayOfWeek);

        if (isWorkDay || isOffDay) {
          const targetShiftType = isOffDay ? 'OFF_DAY' : formShiftType;
          if (targetShiftType !== 'OFF_DAY') {
            const hasConflict = leaves.find(l => 
              l.staffId === formStaffId && 
              dateStr >= l.startDate && 
              dateStr <= l.endDate
            );
            if (hasConflict) {
              conflictDates.push(dateStr);
            }
          }
        }
        current.setDate(current.getDate() + 1);
        limit++;
      }

      if (conflictDates.length > 0) {
        const warningMsg = `พบวันลาที่อนุมัติแล้วของพนักงานในวันที่: ${conflictDates.slice(0, 5).join(', ')}${conflictDates.length > 5 ? '... และวันอื่นๆ' : ''} ต้องการดำเนินการกำหนดงานต่อไปหรือไม่?`;
        if (!confirm(warningMsg)) {
          setFormSubmitting(false);
          return;
        }
      }

      try {
        const payload = {
          branchId,
          staffId: formStaffId,
          startDate: formDate,
          endDate: formEndDate,
          shiftType: formShiftType,
          startTime: formStartTime,
          endTime: formEndTime,
          note: formNote || undefined,
          workDays: formWorkDays,
          offDays: formOffDays,
        };

        const res = await fetch(`${API_BASE}/hr/schedule/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowModal(false);
          setEditingSchedule(null);
          setFormStaffId('');
          setFormNote('');
          fetchSchedules();
        } else {
          const body = await res.json();
          setFormError(body?.message || 'บันทึกช่วงตารางงานไม่สำเร็จ');
        }
      } catch (err: any) {
        setFormError(err.message);
      } finally {
        setFormSubmitting(false);
      }
    } else {
      // Warn on leave conflicts
      const leaveConflict = leaves.find(l => 
        l.staffId === formStaffId && 
        formDate >= l.startDate && 
        formDate <= l.endDate
      );

      if (leaveConflict && formShiftType !== 'OFF_DAY') {
        const typeLabel = leaveConflict.type === 'SICK' ? 'ลาป่วย' : leaveConflict.type === 'PERSONAL' ? 'ลากิจ' : leaveConflict.type === 'VACATION' ? 'ลาพักร้อน' : 'อื่นๆ';
        if (!confirm(`พนักงานมีใบลาที่อนุมัติแล้ว (${typeLabel}: ${leaveConflict.startDate} ถึง ${leaveConflict.endDate}) ในวันนี้ ต้องการกำหนดงานต่อไปหรือไม่?`)) {
          setFormSubmitting(false);
          return;
        }
      }

      try {
        const payload = {
          id: editingSchedule?.id || undefined,
          branchId,
          staffId: formStaffId,
          date: formDate,
          shiftType: formShiftType,
          startTime: formStartTime,
          endTime: formEndTime,
          note: formNote || undefined
        };

        const res = await fetch(`${API_BASE}/hr/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowModal(false);
          setEditingSchedule(null);
          setFormStaffId('');
          setFormNote('');
          fetchSchedules();
        } else {
          const body = await res.json();
          setFormError(body?.message || 'บันทึกไม่สำเร็จ');
        }
      } catch (err: any) {
        setFormError(err.message);
      } finally {
        setFormSubmitting(false);
      }
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlanTitle.trim()) {
      setFormPlanError('กรุณากรอกหัวข้อแผนงาน');
      return;
    }

    setFormPlanSubmitting(true);
    setFormPlanError('');

    try {
      const payload = {
        id: editingPlan?.id || undefined,
        branchId,
        title: formPlanTitle,
        date: formPlanDate,
        note: formPlanNote || undefined,
      };

      const res = await fetch(`${API_BASE}/hr/monthly-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowPlanModal(false);
        setEditingPlan(null);
        setFormPlanTitle('');
        setFormPlanNote('');
        fetchSchedules();
      } else {
        const body = await res.json();
        setFormPlanError(body?.message || 'บันทึกแผนงานไม่สำเร็จ');
      }
    } catch (err: any) {
      setFormPlanError(err.message);
    } finally {
      setFormPlanSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('ต้องการลบแผนงานนี้หรือไม่?')) return;
    try {
      const res = await fetch(`${API_BASE}/hr/monthly-plan/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        setShowPlanModal(false);
        fetchSchedules();
      } else {
        const body = await res.json();
        alert(body?.message || 'ลบไม่สำเร็จ');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  useEffect(() => {
    if (editingPlan) {
      setFormPlanTitle(editingPlan.title);
      setFormPlanDate(editingPlan.date);
      setFormPlanNote(editingPlan.note || '');
    } else {
      setFormPlanTitle('');
      setFormPlanDate(new Date().toISOString().slice(0, 10));
      setFormPlanNote('');
    }
    setFormPlanError('');
  }, [editingPlan, showPlanModal]);

  useEffect(() => {
    if (editingSchedule) {
      setFormStaffId(editingSchedule.staffId);
      setFormDate(editingSchedule.date);
      setFormShiftType(editingSchedule.shiftType);
      setFormStartTime(editingSchedule.startTime);
      setFormEndTime(editingSchedule.endTime);
      setFormNote(editingSchedule.note || '');
      setFormScheduleMode('SINGLE');
    } else {
      setFormStaffId('');
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormEndDate(new Date().toISOString().slice(0, 10));
      setFormShiftType('MORNING');
      setFormStartTime('08:00');
      setFormEndTime('17:00');
      setFormNote('');
      setFormScheduleMode('SINGLE');
      setFormWorkDays([1, 2, 3, 4, 5]);
      setFormOffDays([0, 6]);
    }
    setFormError('');
  }, [editingSchedule, showModal]);

  // Adjust defaults when shift type changes
  useEffect(() => {
    if (formShiftType === 'OFF_DAY') {
      setFormStartTime('00:00');
      setFormEndTime('00:00');
    } else if (formShiftType === 'MORNING' && formStartTime === '00:00') {
      setFormStartTime('08:00');
      setFormEndTime('17:00');
    } else if (formShiftType === 'AFTERNOON' && formStartTime === '00:00') {
      setFormStartTime('13:00');
      setFormEndTime('22:00');
    } else if (formShiftType === 'NIGHT' && formStartTime === '00:00') {
      setFormStartTime('22:00');
      setFormEndTime('07:00');
    } else if (formShiftType === 'FULL_DAY' && formStartTime === '00:00') {
      setFormStartTime('08:00');
      setFormEndTime('22:00');
    }
  }, [formShiftType]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedWeekStart]);

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'MORNING': return 'กะเช้า';
      case 'AFTERNOON': return 'กะบ่าย';
      case 'NIGHT': return 'กะดึก';
      case 'FULL_DAY': return 'เต็มวัน';
      case 'OFF_DAY': return 'วันหยุด';
      default: return type;
    }
  };

  const getShiftTypeBadge = (type: string) => {
    switch (type) {
      case 'MORNING': return { color: '#7c543c', bg: 'rgba(124,84,60,0.06)', border: '#ece5da' };
      case 'AFTERNOON': return { color: '#d97706', bg: 'rgba(217,119,6,0.06)', border: '#fcd34d' };
      case 'NIGHT': return { color: '#4f46e5', bg: 'rgba(79,70,229,0.06)', border: '#c7d2fe' };
      case 'FULL_DAY': return { color: '#059669', bg: 'rgba(5,150,105,0.06)', border: '#a7f3d0' };
      case 'OFF_DAY': return { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: '#d1d5db' };
      default: return { color: '#7c543c', bg: '#fdfaf6', border: '#ece5da' };
    }
  };

  const getLeavesForDate = (dateStr: string) => {
    return leaves.filter(l => dateStr >= l.startDate && dateStr <= l.endDate);
  };

  const startStr = selectedWeekStart.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
  const end = new Date(selectedWeekStart);
  end.setDate(end.getDate() + 6);
  const endStr = end.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-5 space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => changeWeek(-1)} className="p-2 rounded-xl bg-white border border-[#ece5da] text-[#7c543c] hover:bg-[#ece5da]/20">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-black text-[#2d241e] num bg-white px-3 py-2 rounded-xl border border-[#ece5da]">
            สัปดาห์: {startStr} - {endStr}
          </span>
          <button onClick={() => changeWeek(1)} className="p-2 rounded-xl bg-white border border-[#ece5da] text-[#7c543c] hover:bg-[#ece5da]/20">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingPlan(null);
              setShowPlanModal(true);
            }}
            className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:scale-102 transition-transform"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Plus size={14} /> เพิ่มแผนงาน/เตือนความจำ
          </button>
          <button 
            onClick={() => {
              setEditingSchedule(null);
              setShowModal(true);
            }}
            className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5 shadow-md shadow-[#ea580c]/20 hover:scale-102 transition-transform"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
          >
            <Plus size={14} /> เพิ่มตารางงาน
          </button>
        </div>
      </div>

      {/* Week Calendar Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#7c543c]">
          <RefreshCw size={36} className="animate-spin mb-4" />
          <p className="text-sm font-black uppercase tracking-widest opacity-60">กำลังโหลดตารางงาน...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const dateStr = day.toISOString().slice(0, 10);
            const daySchedules = schedules.filter(s => s.date === dateStr);
            const dayLeaves = getLeavesForDate(dateStr);
            const dayPlans = monthlyPlans.filter(p => p.date === dateStr);
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;

            return (
              <div 
                key={idx} 
                className={`rounded-2xl border p-3.5 space-y-3 transition-colors ${
                  isToday ? 'bg-amber-50/50 border-amber-300 shadow-md shadow-amber-100' : 'bg-white border-[#ece5da]'
                }`}
              >
                <div className="text-center pb-2 border-b border-[#ece5da]">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {day.toLocaleDateString('th-TH', { weekday: 'short' })}
                  </p>
                  <p className={`text-base font-black num ${isToday ? 'text-amber-600' : 'text-[#2d241e]'}`}>
                    {day.getDate()}
                  </p>
                </div>

                <div className="space-y-2 min-h-[220px] max-h-[350px] overflow-y-auto pr-0.5">
                  {/* Monthly Plans / Events */}
                  {dayPlans.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setEditingPlan(p);
                        setShowPlanModal(true);
                      }}
                      className="group relative rounded-xl p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 cursor-pointer hover:bg-emerald-100/50 transition-colors"
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(p.id);
                        }}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase shrink-0">
                          แผนงาน
                        </span>
                      </div>
                      <p className="text-[10px] font-black truncate">{p.title}</p>
                      {p.note && (
                        <p className="text-[8px] font-bold opacity-80 truncate italic">
                          "{p.note}"
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Leaves first */}
                  {dayLeaves.map(l => (
                    <div key={l.id} className="rounded-xl p-2 bg-purple-50 border border-purple-200 text-purple-700 space-y-1">
                      <p className="text-[10px] font-black truncate">{l.staffName}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-purple-100 uppercase">
                          วันลา ({l.type === 'SICK' ? 'ป่วย' : l.type === 'PERSONAL' ? 'กิจ' : l.type === 'VACATION' ? 'พักร้อน' : 'อื่นๆ'})
                        </span>
                      </div>
                      {l.reason && (
                        <p className="text-[8px] font-bold opacity-80 truncate italic">
                          "{l.reason}"
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Shifts */}
                  {daySchedules.map(s => {
                    const badge = getShiftTypeBadge(s.shiftType);
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => {
                          setEditingSchedule(s);
                          setShowModal(true);
                        }}
                        className="group relative rounded-xl p-2.5 bg-[#fdfaf6] border border-[#ece5da] hover:border-[#7c543c]/30 hover:bg-white transition-all space-y-1.5 cursor-pointer"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(s.id);
                          }}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-opacity"
                        >
                          <Trash2 size={11} />
                        </button>

                        <p className="text-xs font-black text-[#2d241e] truncate pr-4">{s.staffName}</p>
                        
                        <div className="flex flex-wrap items-center gap-1">
                          <span 
                            className="text-[9px] font-black px-1.5 py-0.5 rounded border"
                            style={{ color: badge.color, backgroundColor: badge.bg, borderColor: badge.border }}
                          >
                            {getShiftTypeLabel(s.shiftType)}
                          </span>
                          {s.shiftType !== 'OFF_DAY' && (
                            <span className="text-[9px] font-black text-gray-400 num">
                              {s.startTime}-{s.endTime}
                            </span>
                          )}
                        </div>

                        {s.note && (
                          <p className="text-[9px] text-[#7c543c]/60 font-bold bg-[#fdfaf6] p-1 rounded italic truncate">
                            {s.note}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {daySchedules.length === 0 && dayLeaves.length === 0 && dayPlans.length === 0 && (
                    <div className="h-28 flex items-center justify-center text-[9px] font-bold text-gray-400 italic text-center">
                      ไม่มีเวรทำงาน
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d241e]/70 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => !formSubmitting && setShowModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 text-white flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2d241e, #7c543c)' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <h3 className="font-black text-sm">
                    {editingSchedule ? 'แก้ไขตารางงานพนักงาน' : 'เพิ่มเวรการทำงานพนักงาน'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">เลือกพนักงาน *</label>
                  <select 
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    disabled={!!editingSchedule}
                    className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700 disabled:opacity-60"
                  >
                    <option value="">-- เลือกพนักงาน --</option>
                    {staff.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                {!editingSchedule && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">รูปแบบการตั้งตารางงาน</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormScheduleMode('SINGLE')}
                        className={`flex-1 h-9 rounded-xl text-xs font-black transition-colors border ${
                          formScheduleMode === 'SINGLE'
                            ? 'bg-[#7c543c] text-white border-[#7c543c]'
                            : 'bg-[#fdfaf6] text-gray-500 border-[#ece5da] hover:bg-gray-50'
                        }`}
                      >
                        วันเดียว (Single Day)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormScheduleMode('RANGE')}
                        className={`flex-1 h-9 rounded-xl text-xs font-black transition-colors border ${
                          formScheduleMode === 'RANGE'
                            ? 'bg-[#7c543c] text-white border-[#7c543c]'
                            : 'bg-[#fdfaf6] text-gray-500 border-[#ece5da] hover:bg-gray-50'
                        }`}
                      >
                        ช่วงวันที่ (Date Range)
                      </button>
                    </div>
                  </div>
                )}

                {formScheduleMode === 'RANGE' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">วันที่เริ่มต้น *</label>
                        <input 
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">วันที่สิ้นสุด *</label>
                        <input 
                          type="date"
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                          className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">ประเภทกะที่จะใช้กำหนดงาน *</label>
                      <select 
                        value={formShiftType}
                        onChange={(e) => setFormShiftType(e.target.value)}
                        className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700"
                      >
                        <option value="MORNING">กะเช้า (Morning)</option>
                        <option value="AFTERNOON">กะบ่าย (Afternoon)</option>
                        <option value="NIGHT">กะดึก (Night)</option>
                        <option value="FULL_DAY">เต็มวัน (Full Day)</option>
                      </select>
                    </div>

                    <div className="space-y-3 p-3.5 bg-amber-50/30 rounded-2xl border border-amber-100">
                      <div>
                        <span className="block text-[10px] font-black uppercase text-[#7c543c] tracking-wider mb-2">
                          วันทำงานประจำสัปดาห์ (Workdays)
                        </span>
                        <div className="flex justify-between gap-1">
                          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, idx) => {
                            const isSelected = formWorkDays.includes(idx);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormWorkDays(formWorkDays.filter(d => d !== idx));
                                  } else {
                                    setFormWorkDays([...formWorkDays, idx]);
                                    setFormOffDays(formOffDays.filter(d => d !== idx));
                                  }
                                }}
                                className={`w-9 h-9 rounded-full text-xs font-black transition-colors ${
                                  isSelected
                                    ? 'bg-[#7c543c] text-white'
                                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">
                          วันหยุดประจำสัปดาห์ (Off days / แทรกวันหยุดอัตโนมัติ)
                        </span>
                        <div className="flex justify-between gap-1">
                          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, idx) => {
                            const isSelected = formOffDays.includes(idx);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormOffDays(formOffDays.filter(d => d !== idx));
                                  } else {
                                    setFormOffDays([...formOffDays, idx]);
                                    setFormWorkDays(formWorkDays.filter(d => d !== idx));
                                  }
                                }}
                                className={`w-9 h-9 rounded-full text-xs font-black transition-colors ${
                                  isSelected
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">วันที่ *</label>
                      <input 
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        disabled={!!editingSchedule}
                        className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">ประเภทกะ *</label>
                      <select 
                        value={formShiftType}
                        onChange={(e) => setFormShiftType(e.target.value)}
                        className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700"
                      >
                        <option value="MORNING">กะเช้า (Morning)</option>
                        <option value="AFTERNOON">กะบ่าย (Afternoon)</option>
                        <option value="NIGHT">กะดึก (Night)</option>
                        <option value="FULL_DAY">เต็มวัน (Full Day)</option>
                        <option value="OFF_DAY">วันหยุด (Off Day)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">เวลาเริ่มงาน *</label>
                    <input 
                      type="text" 
                      value={formStartTime} 
                      onChange={(e) => setFormStartTime(e.target.value)} 
                      placeholder="เช่น 08:00"
                      disabled={formShiftType === 'OFF_DAY' && formScheduleMode === 'SINGLE'}
                      className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">เวลาเลิกงาน *</label>
                    <input 
                      type="text" 
                      value={formEndTime} 
                      onChange={(e) => setFormEndTime(e.target.value)} 
                      placeholder="เช่น 17:00"
                      disabled={formShiftType === 'OFF_DAY' && formScheduleMode === 'SINGLE'}
                      className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                <TextArea 
                  label="หมายเหตุเวร" 
                  value={formNote} 
                  onChange={setFormNote} 
                  placeholder="เช่น หน้าเคาน์เตอร์, บาริสต้าหลัก..." 
                />

                {formError && (
                  <div className="rounded-xl p-2.5 flex items-center gap-2 text-xs bg-rose-50 text-rose-700 font-bold">
                    <AlertTriangle size={14} className="shrink-0" /> {formError}
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  {editingSchedule && (
                    <button 
                      type="button" 
                      onClick={() => handleDelete(editingSchedule.id)}
                      disabled={formSubmitting}
                      className="h-11 px-3 rounded-xl text-xs font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                    >
                      ลบตาราง
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    disabled={formSubmitting}
                    className="flex-1 h-11 rounded-xl text-xs font-black uppercase bg-[#fdfaf6] border border-[#ece5da] text-[#7c543c]"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="flex-1 h-11 rounded-xl text-xs font-black uppercase text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #2d241e, #7c543c)' }}
                  >
                    {formSubmitting ? 'กำลังบันทึก...' : 'บันทึกตารางงาน'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Monthly Plan Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d241e]/70 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => !formPlanSubmitting && setShowPlanModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 text-white flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <h3 className="font-black text-sm">
                    {editingPlan ? 'แก้ไขแผนงาน / เตือนความจำ' : 'เพิ่มแผนงานประจำเดือน / เตือนความจำ'}
                  </h3>
                </div>
                <button onClick={() => setShowPlanModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">หัวข้อแผนงาน *</label>
                  <input 
                    type="text" 
                    value={formPlanTitle} 
                    onChange={(e) => setFormPlanTitle(e.target.value)} 
                    placeholder="เช่น ออกบูธ, ตลาดนัด, อบรม..." 
                    className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">วันที่ *</label>
                  <input 
                    type="date"
                    value={formPlanDate}
                    onChange={(e) => setFormPlanDate(e.target.value)}
                    className="w-full h-11 px-3 bg-[#fdfaf6] border border-[#ece5da] rounded-xl font-bold text-xs outline-none text-slate-700"
                  />
                </div>

                <TextArea 
                  label="หมายเหตุ / รายละเอียดเพิ่มเติม" 
                  value={formPlanNote} 
                  onChange={setFormPlanNote} 
                  placeholder="เช่น สถานที่, รายละเอียดเวลา..." 
                />

                {formPlanError && (
                  <div className="rounded-xl p-2.5 flex items-center gap-2 text-xs bg-rose-50 text-rose-700 font-bold">
                    <AlertTriangle size={14} className="shrink-0" /> {formPlanError}
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  {editingPlan && (
                    <button 
                      type="button" 
                      onClick={() => handleDeletePlan(editingPlan.id)}
                      disabled={formPlanSubmitting}
                      className="h-11 px-3 rounded-xl text-xs font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                    >
                      ลบแผนงาน
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setShowPlanModal(false)}
                    disabled={formPlanSubmitting}
                    className="flex-1 h-11 rounded-xl text-xs font-black uppercase bg-[#fdfaf6] border border-[#ece5da] text-[#7c543c]"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={formPlanSubmitting}
                    className="flex-1 h-11 rounded-xl text-xs font-black uppercase text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                  >
                    {formPlanSubmitting ? 'กำลังบันทึก...' : 'บันทึกแผนงาน'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── HROverview ────────────────────────────────────────────────────────────────
function HROverview({ branchId }: { branchId?: string }) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/hr/attendance?branchId=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/hr/leave?branchId=${branchId}&status=PENDING`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/branches/${branchId}/managers`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([att, lv, st]) => {
      setAttendance(Array.isArray(att) ? att : []);
      setLeaves(Array.isArray(lv) ? lv : []);
      setStaff(Array.isArray(st) ? st : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [branchId]);

  const present = attendance.filter(a => !a.clockOut).length;
  const completed = attendance.filter(a => a.clockOut).length;
  const absent = Math.max(0, staff.filter(s => s.isActive).length - attendance.length);

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile icon={<Users size={18} />} label="พนักงานทั้งหมด" value={String(staff.filter(s => s.isActive).length)} color="#7c543c" bg="rgba(124,84,60,0.10)" hint="คน" />
        <KpiTile icon={<UserCheck size={18} />} label="มาทำงานวันนี้" value={String(attendance.length)} color="#10b981" bg="rgba(16,185,129,0.10)" hint="คน" />
        <KpiTile icon={<UserX size={18} />} label="ขาดงานวันนี้" value={String(absent)} color="#ef4444" bg="rgba(239,68,68,0.10)" hint="คน" />
        <KpiTile icon={<ClipboardList size={18} />} label="รออนุมัติลา" value={String(leaves.length)} color="#f59e0b" bg="rgba(245,158,11,0.10)" hint="ใบ" />
      </div>

      <Card>
        <SectionHeader icon={<Clock size={16} />} title="เช็คอินวันนี้" hint={`${attendance.length} รายการ`} />
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-2xl bg-[#fdfaf6] animate-pulse" />)}</div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-8 text-[#7c543c]/50">
            <Clock size={28} className="mx-auto mb-2" />
            <p className="text-xs font-bold">ยังไม่มีพนักงานเช็คอินวันนี้</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendance.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: a.clockOut ? 'rgba(16,185,129,0.12)' : 'rgba(234,88,12,0.12)', color: a.clockOut ? '#10b981' : '#ea580c' }}>
                  {a.staffName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#2d241e] truncate">{a.staffName}</p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#7c543c]/60 num">
                    <span className="flex items-center gap-1"><LogIn size={10} /> {new Date(a.clockIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    {a.clockOut && <span className="flex items-center gap-1"><LogOut size={10} /> {new Date(a.clockOut).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>}
                    {a.hoursWorked && <span>{a.hoursWorked.toFixed(1)} ชม.</span>}
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 h-5 rounded inline-flex items-center ${a.clockOut ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600'}`}>
                  {a.clockOut ? 'เสร็จ' : 'กำลังทำงาน'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── HRAttendance ──────────────────────────────────────────────────────────────
function HRAttendance({ branchId }: { branchId?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const fetchRecords = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hr/attendance?branchId=${branchId}&date=${date}`, { headers: authHeaders() });
      setRecords(Array.isArray(await res.json()) ? await res.clone().json() : []);
    } catch { } finally { setLoading(false); }
  }, [branchId, date]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  async function submitPin() {
    if (!pin || pin.length < 4) { setPinError('กรุณากรอก PIN 4-12 หลัก'); return; }
    setPinLoading(true); setPinError(''); setPinSuccess('');
    try {
      const endpoint = mode === 'in' ? 'clock-in' : 'clock-out';
      const res = await fetch(`${API_BASE}/hr/attendance/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ branchId, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด');
      setPinSuccess(`✅ ${data.staffName} — ${mode === 'in' ? 'บันทึกเวลาเข้า' : 'บันทึกเวลาออก'}สำเร็จ`);
      setPin('');
      fetchRecords();
    } catch (e: any) {
      setPinError(e.message);
    } finally {
      setPinLoading(false);
      setTimeout(() => { setPinError(''); setPinSuccess(''); }, 4000);
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm('ลบรายการนี้?')) return;
    await fetch(`${API_BASE}/hr/attendance/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchRecords();
  }

  return (
    <div className="p-5 space-y-5">
      {/* Mobile QR Code Clock In/Out Card */}
      <Card>
        <SectionHeader icon={<QrCode size={16} />} title="สแกนคิวอาร์โค้ดลงเวลาทำงาน" hint="สำหรับพนักงานสแกนด้วยมือถือตัวเอง" />
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
          <div className="bg-white p-3.5 rounded-2xl border border-[#ece5da] shadow-sm shrink-0">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/#/attendance?branchId=${branchId}`)}`} 
              alt="Clock In/Out QR Code" 
              className="w-40 h-40 object-contain" 
            />
          </div>
          <div className="space-y-3 text-center sm:text-left">
            <h4 className="text-sm font-black text-[#2d241e]">ขั้นตอนการลงเวลาด้วยมือถือ:</h4>
            <ol className="list-decimal pl-5 text-xs font-bold text-[#7c543c]/80 space-y-1.5 text-left">
              <li>ใช้มือถือสแกนคิวอาร์โค้ดนี้เพื่อเปิดหน้าลงเวลา</li>
              <li>กรอกรหัส PIN ของตัวเองเพื่อบันทึกเวลา</li>
              <li>ระบบจะบันทึกเวลาเข้างาน (ครั้งที่ 1) และออกงาน (ครั้งที่ 2) ให้โดยอัตโนมัติ</li>
            </ol>
            <div className="pt-2">
              <a 
                href={`${window.location.origin}/#/attendance?branchId=${branchId}`}
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100"
              >
                เปิดในหน้าต่างใหม่
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Clock in/out widget */}
      <Card>
        <SectionHeader icon={<Clock size={16} />} title="บันทึกเวลาเข้า-ออกงาน" hint="กด PIN ของพนักงาน" />
        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          {(['in','out'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setPinError(''); setPinSuccess(''); }}
              className="flex-1 h-10 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
              style={mode === m
                ? { background: m === 'in' ? 'rgba(16,185,129,0.15)' : 'rgba(234,88,12,0.15)', color: m === 'in' ? '#10b981' : '#ea580c', border: `2px solid ${m === 'in' ? '#10b981' : '#ea580c'}` }
                : { background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}>
              {m === 'in' ? <><LogIn size={13} /> เข้างาน</> : <><LogOut size={13} /> ออกงาน</>}
            </button>
          ))}
        </div>
        {/* PIN pad */}
        <div className="space-y-3">
          <input
            type="password" inputMode="numeric" maxLength={12}
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && submitPin()}
            placeholder="กรอก PIN ของพนักงาน"
            className="w-full h-12 px-4 rounded-2xl text-center text-xl font-black tracking-[0.5em] outline-none num"
            style={{ background: '#fdfaf6', border: '2px solid #ece5da' }}
          />
          <div className="grid grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <button key={i} disabled={k === ''}
                onClick={() => {
                  if (k === '⌫') setPin(p => p.slice(0, -1));
                  else if (k && pin.length < 12) setPin(p => p + k);
                }}
                className="h-12 rounded-2xl text-base font-black transition-all active:scale-95 disabled:opacity-0"
                style={{ background: k === '⌫' ? 'rgba(239,68,68,0.10)' : '#f3ece1', color: k === '⌫' ? '#ef4444' : '#2d241e', border: '1px solid #ece5da' }}>
                {k}
              </button>
            ))}
          </div>
          <button onClick={submitPin} disabled={pinLoading || pin.length < 4}
            className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: mode === 'in' ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
            {pinLoading ? <Loader2 size={16} className="animate-spin" /> : mode === 'in' ? <><LogIn size={14} /> บันทึกเข้างาน</> : <><LogOut size={14} /> บันทึกออกงาน</>}
          </button>
          {pinError && <p className="text-xs font-bold text-red-600 text-center">{pinError}</p>}
          {pinSuccess && <p className="text-xs font-bold text-emerald-600 text-center">{pinSuccess}</p>}
        </div>
      </Card>

      {/* Records */}
      <Card>
        <SectionHeader
          icon={<CalendarDays size={16} />}
          title="รายการวันที่"
          hint={`${records.length} รายการ`}
          action={
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="h-9 px-3 rounded-xl text-xs font-bold outline-none"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#7c543c' }} />
          }
        />
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-2xl bg-[#fdfaf6] animate-pulse" />)}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-[#7c543c]/50">
            <Clock size={28} className="mx-auto mb-2" />
            <p className="text-xs font-bold">ไม่มีรายการวันนี้</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: r.clockOut ? 'rgba(16,185,129,0.12)' : 'rgba(234,88,12,0.12)', color: r.clockOut ? '#10b981' : '#ea580c' }}>
                  {r.staffName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#2d241e]">{r.staffName}</p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#7c543c]/60 num">
                    <span className="flex items-center gap-1"><LogIn size={10} />{new Date(r.clockIn).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</span>
                    {r.clockOut && <span className="flex items-center gap-1"><LogOut size={10} />{new Date(r.clockOut).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</span>}
                    {r.hoursWorked && <span className="text-emerald-600">{r.hoursWorked.toFixed(1)} ชม.</span>}
                  </div>
                </div>
                <button onClick={() => deleteRecord(r.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-colors shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── HRLeave ───────────────────────────────────────────────────────────────────
function HRLeave({ branchId }: { branchId?: string }) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [creating, setCreating] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const [lv, st] = await Promise.all([
      fetch(`${API_BASE}/hr/leave?branchId=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/branches/${branchId}/managers`, { headers: authHeaders() }).then(r => r.json()),
    ]);
    setLeaves(Array.isArray(lv) ? lv : []);
    setStaff(Array.isArray(st) ? st : []);
    setLoading(false);
  }, [branchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter);

  async function updateStatus(id: string, status: string, managerNote?: string) {
    await fetch(`${API_BASE}/hr/leave/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status, managerNote }),
    });
    setApproveId(null);
    fetchAll();
  }

  async function deleteLeave(id: string) {
    if (!confirm('ลบใบลานี้?')) return;
    await fetch(`${API_BASE}/hr/leave/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchAll();
  }

  const pending = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <KpiTile icon={<ClipboardList size={18} />} label="ทั้งหมด" value={String(leaves.length)} color="#7c543c" bg="rgba(124,84,60,0.10)" hint="ใบ" />
        <KpiTile icon={<Clock size={18} />} label="รออนุมัติ" value={String(pending)} color="#f59e0b" bg="rgba(245,158,11,0.10)" hint="ใบ" />
        <KpiTile icon={<UserCheck size={18} />} label="อนุมัติแล้ว" value={String(leaves.filter(l=>l.status==='APPROVED').length)} color="#10b981" bg="rgba(16,185,129,0.10)" hint="ใบ" />
      </div>

      <Card>
        <SectionHeader
          icon={<ClipboardList size={16} />} title="รายการใบลา" hint={`${filtered.length} รายการ`}
          action={
            <button onClick={() => setCreating(true)}
              className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-white inline-flex items-center gap-1.5 shadow-md"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
              <Plus size={13} /> บันทึกใบลา
            </button>
          }
        />
        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {['ALL','PENDING','APPROVED','REJECTED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="h-7 px-3 rounded-xl text-[10px] font-black transition-all"
              style={filter === s
                ? { background: 'rgba(234,88,12,0.15)', color: '#ea580c', border: '2px solid #ea580c' }
                : { background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}>
              {s === 'ALL' ? 'ทั้งหมด' : LEAVE_STATUS_LABEL[s]}
              {s === 'PENDING' && pending > 0 && <span className="ml-1 bg-amber-500 text-white text-[8px] px-1 rounded">{pending}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-[#fdfaf6] animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-[#7c543c]/50">
            <ClipboardList size={28} className="mx-auto mb-2" />
            <p className="text-xs font-bold">ไม่มีใบลา</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(l => {
              const tc = LEAVE_TYPE_COLOR[l.type] || LEAVE_TYPE_COLOR.OTHER;
              const sc = LEAVE_STATUS_COLOR[l.status] || LEAVE_STATUS_COLOR.PENDING;
              return (
                <div key={l.id} className="rounded-2xl p-3.5"
                  style={{ background: '#fff', border: '1px solid #ece5da' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: tc.bg, color: tc.color }}>
                      {l.staffName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-[#2d241e]">{l.staffName}</p>
                        <span className="text-[9px] font-black px-2 h-5 rounded inline-flex items-center" style={tc}>{LEAVE_TYPE_LABEL[l.type]}</span>
                        <span className="text-[9px] font-black px-2 h-5 rounded inline-flex items-center" style={sc}>{LEAVE_STATUS_LABEL[l.status]}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#7c543c]/70 mt-0.5 num">
                        {l.startDate} — {l.endDate} ({l.days} วัน)
                      </p>
                      {l.reason && <p className="text-[10px] text-[#7c543c]/60 mt-0.5">{l.reason}</p>}
                    </div>
                  </div>
                  {l.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => updateStatus(l.id, 'APPROVED')}
                        className="flex-1 h-9 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                        <ThumbsUp size={12} /> อนุมัติ
                      </button>
                      <button onClick={() => updateStatus(l.id, 'REJECTED')}
                        className="flex-1 h-9 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                        <ThumbsDown size={12} /> ปฏิเสธ
                      </button>
                    </div>
                  )}
                  {l.status !== 'PENDING' && (
                    <button onClick={() => deleteLeave(l.id)}
                      className="mt-2 text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors">
                      ลบรายการ
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AnimatePresence>
        {creating && (
          <LeaveModal branchId={branchId!} staff={staff}
            onClose={() => setCreating(false)}
            onDone={() => { setCreating(false); fetchAll(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function LeaveModal({ branchId, staff, onClose, onDone }: {
  branchId: string;
  staff: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [staffId, setStaffId] = useState(staff[0]?.id || '');
  const [type, setType] = useState('SICK');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0,10));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!staffId) { setError('กรุณาเลือกพนักงาน'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/hr/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ branchId, staffId, type, startDate, endDate, reason }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'เกิดข้อผิดพลาด');
      onDone();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  const inputCls = "w-full h-10 px-3 rounded-xl text-sm font-medium outline-none";
  const inputStyle = { background: '#fdfaf6', border: '1px solid #ece5da' };
  const labelCls = "text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1 block";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md" onClick={() => !saving && onClose()} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-black">บันทึกใบลา</p>
            <button onClick={() => !saving && onClose()} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><X size={14} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>พนักงาน</label>
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className={inputCls} style={inputStyle}>
              {staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>ประเภทการลา</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LEAVE_TYPE_LABEL).map(([k,v]) => {
                const tc = LEAVE_TYPE_COLOR[k];
                return (
                  <button key={k} onClick={() => setType(k)}
                    className="h-9 rounded-xl text-xs font-black transition-all"
                    style={type === k ? { ...tc, border: `2px solid ${tc.color}` } : { background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>วันเริ่ม</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls}>วันสิ้นสุด</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className={labelCls}>เหตุผล (ไม่บังคับ)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="ระบุเหตุผล..." className={inputCls} style={inputStyle} />
          </div>
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => !saving && onClose()}
              className="flex-1 h-11 rounded-xl text-sm font-black"
              style={{ background: '#fff', color: '#7c543c', border: '1px solid #ece5da' }}>ยกเลิก</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} บันทึก
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── HRPayroll ─────────────────────────────────────────────────────────────────
function HRPayroll({ branchId }: { branchId?: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editSalary, setEditSalary] = useState<any | null>(null);

  const fetchAll = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const [ps, sal, st] = await Promise.all([
      fetch(`${API_BASE}/hr/payslip?branchId=${branchId}&year=${year}&month=${month}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/hr/salary?branchId=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/branches/${branchId}/managers`, { headers: authHeaders() }).then(r => r.json()),
    ]);
    setPayslips(Array.isArray(ps) ? ps : []);
    setSalaries(Array.isArray(sal) ? sal : []);
    setStaff(Array.isArray(st) ? st : []);
    setLoading(false);
  }, [branchId, year, month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function generate() {
    setGenerating(true);
    try {
      await fetch(`${API_BASE}/hr/payslip/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ branchId, year, month }),
      });
      fetchAll();
    } finally { setGenerating(false); }
  }

  async function markPaid(id: string) {
    await fetch(`${API_BASE}/hr/payslip/${id}/paid`, { method: 'PATCH', headers: authHeaders() });
    fetchAll();
  }

  const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);
  const staffWithNoSalary = staff.filter(s => s.isActive && !salaries.find(sal => sal.staffId === s.id));

  return (
    <div className="p-5 space-y-5">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={() => { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#f3ece1', border: '1px solid #ece5da' }}>
          <ChevronLeft size={14} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-base font-black text-[#2d241e]">{TH_MONTHS[month-1]} {year + 543}</p>
        </div>
        <button onClick={() => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#f3ece1', border: '1px solid #ece5da' }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiTile icon={<Users size={18} />} label="พนักงาน" value={String(payslips.length)} color="#7c543c" bg="rgba(124,84,60,0.10)" hint="คน" />
        <KpiTile icon={<BadgeDollarSign size={18} />} label="รวมจ่าย" value={`฿${(totalNet/1000).toFixed(1)}K`} color="#10b981" bg="rgba(16,185,129,0.10)" hint="สุทธิ" />
        <KpiTile icon={<Check size={18} />} label="จ่ายแล้ว" value={String(payslips.filter(p=>p.paidAt).length)} color="#6366f1" bg="rgba(99,102,241,0.10)" hint="คน" />
      </div>

      {/* Warning: staff without salary config */}
      {staffWithNoSalary.length > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-700">พนักงาน {staffWithNoSalary.length} คน ยังไม่ได้ตั้งค่าเงินเดือน</p>
            <p className="text-[10px] text-amber-600">{staffWithNoSalary.map(s=>s.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Salary config */}
      <Card>
        <SectionHeader icon={<BadgeDollarSign size={16} />} title="ตั้งค่าเงินเดือนพนักงาน" hint={`${salaries.length} คน`} />
        <div className="space-y-2">
          {staff.filter(s => s.isActive).map(s => {
            const sal = salaries.find(x => x.staffId === s.id);
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: 'rgba(124,84,60,0.12)', color: '#7c543c' }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#2d241e] truncate">{s.name}</p>
                  {sal ? (
                    <p className="text-[11px] font-bold text-[#7c543c]/70 num">
                      {PAY_TYPE_LABEL[sal.payType]} · ฿{(sal.baseSalary || sal.hourlyRate).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-[11px] font-bold text-amber-500">ยังไม่ได้ตั้งค่า</p>
                  )}
                </div>
                <button onClick={() => setEditSalary({ ...sal, staffId: s.id, staffName: s.name, branchId })}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7c543c]/60 hover:bg-white transition-colors">
                  <Edit2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payslips */}
      <Card>
        <SectionHeader
          icon={<FileText size={16} />} title={`สลิปเงินเดือน ${TH_MONTHS[month-1]} ${year+543}`}
          hint={`${payslips.length} คน`}
          action={
            <button onClick={generate} disabled={generating}
              className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-white inline-flex items-center gap-1.5 shadow-md disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)' }}>
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              คำนวณอัตโนมัติ
            </button>
          }
        />
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-[#fdfaf6] animate-pulse" />)}</div>
        ) : payslips.length === 0 ? (
          <div className="text-center py-8 text-[#7c543c]/50">
            <FileText size={28} className="mx-auto mb-2" />
            <p className="text-xs font-bold">ยังไม่มีสลิป กด "คำนวณอัตโนมัติ" เพื่อสร้าง</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payslips.map(p => (
              <div key={p.id} className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid #ece5da' }}>
                <div className="flex items-center gap-3 p-3" style={{ background: p.paidAt ? 'rgba(16,185,129,0.06)' : '#fff' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: 'rgba(124,84,60,0.12)', color: '#7c543c' }}>
                    {p.staffName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#2d241e]">{p.staffName}</p>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#7c543c]/60 flex-wrap">
                      <span>มา {p.daysWorked} วัน</span>
                      {p.daysLeave > 0 && <span>ลา {p.daysLeave} วัน</span>}
                      {p.daysAbsent > 0 && <span className="text-red-500">ขาด {p.daysAbsent} วัน</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-emerald-600 num">฿{p.netPay.toLocaleString()}</p>
                    <p className="text-[9px] text-[#7c543c]/50 num">หัก ฿{p.deductions.toLocaleString()}</p>
                  </div>
                </div>
                {/* Details row */}
                <div className="px-3 py-2 flex items-center justify-between" style={{ background: '#fdfaf6', borderTop: '1px solid #ece5da' }}>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-[#7c543c]/60 num">
                    <span>พื้นฐาน ฿{p.baseSalary.toLocaleString()}</span>
                    {p.hoursWorked > 0 && <span>{p.hoursWorked.toFixed(1)} ชม.</span>}
                  </div>
                  {p.paidAt ? (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 h-5 rounded inline-flex items-center gap-1">
                      <Check size={8} /> จ่ายแล้ว
                    </span>
                  ) : (
                    <button onClick={() => markPaid(p.id)}
                      className="text-[9px] font-black text-white bg-emerald-500 hover:bg-emerald-600 px-3 h-6 rounded-lg transition-colors">
                      ทำเครื่องหมายจ่ายแล้ว
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Salary modal */}
      <AnimatePresence>
        {editSalary && (
          <SalaryModal
            data={editSalary}
            onClose={() => setEditSalary(null)}
            onDone={() => { setEditSalary(null); fetchAll(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SalaryModal({ data, onClose, onDone }: { data: any; onClose: () => void; onDone: () => void }) {
  const [payType, setPayType] = useState(data.payType || 'MONTHLY');
  const [baseSalary, setBaseSalary] = useState(String(data.baseSalary ?? ''));
  const [hourlyRate, setHourlyRate] = useState(String(data.hourlyRate ?? ''));
  const [socialSec, setSocialSec] = useState(String(data.socialSec ?? 750));
  const [tax, setTax] = useState(String(data.tax ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/hr/salary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          staffId: data.staffId,
          branchId: data.branchId,
          payType,
          baseSalary: Number(baseSalary) || 0,
          hourlyRate: Number(hourlyRate) || 0,
          socialSec: Number(socialSec) || 0,
          tax: Number(tax) || 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'เกิดข้อผิดพลาด');
      onDone();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  const inputCls = "w-full h-10 px-3 rounded-xl text-sm font-medium outline-none num";
  const inputStyle = { background: '#fdfaf6', border: '1px solid #ece5da' };
  const labelCls = "text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1 block";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md" onClick={() => !saving && onClose()} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest opacity-70">ตั้งค่าเงินเดือน</p>
              <p className="text-sm font-black">{data.staffName}</p>
            </div>
            <button onClick={() => !saving && onClose()} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><X size={14} /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>ประเภทค่าจ้าง</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PAY_TYPE_LABEL).map(([k,v]) => (
                <button key={k} onClick={() => setPayType(k)}
                  className="h-9 rounded-xl text-xs font-black transition-all"
                  style={payType === k
                    ? { background: 'rgba(234,88,12,0.15)', color: '#ea580c', border: '2px solid #ea580c' }
                    : { background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          {payType !== 'HOURLY' && (
            <div>
              <label className={labelCls}>{payType === 'MONTHLY' ? 'เงินเดือน (฿/เดือน)' : 'ค่าจ้าง (฿/วัน)'}</label>
              <input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          )}
          {payType === 'HOURLY' && (
            <div>
              <label className={labelCls}>ค่าจ้าง (฿/ชั่วโมง)</label>
              <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ประกันสังคม (฿/เดือน)</label>
              <input type="number" value={socialSec} onChange={e => setSocialSec(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls}>ภาษีหัก ณ ที่จ่าย (฿)</label>
              <input type="number" value={tax} onChange={e => setTax(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          </div>
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => !saving && onClose()}
              className="flex-1 h-11 rounded-xl text-sm font-black"
              style={{ background: '#fff', color: '#7c543c', border: '1px solid #ece5da' }}>ยกเลิก</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} บันทึก
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Branch Promotion Tab — สาขาสร้าง/จัดการโปรโมชั่นเอง
// ════════════════════════════════════════════════════════════════════════════
const PROMO_TYPE_LABEL: Record<string, string> = {
  PERCENT: 'ลด %',
  FIXED_AMOUNT: 'ลดคงที่ ฿',
  BUY_X_GET_Y: 'ซื้อ X แถม Y',
  PRODUCT_DISCOUNT: 'ลดเฉพาะสินค้า',
};

const PROMO_TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  PERCENT: { color: '#ea580c', bg: 'rgba(234,88,12,0.10)' },
  FIXED_AMOUNT: { color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  BUY_X_GET_Y: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  PRODUCT_DISCOUNT: { color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
};

interface Promotion {
  id: string;
  name: string;
  type: string;
  value: number;
  code?: string | null;
  minOrderAmount: number;
  maxDiscount?: number | null;
  isActive: boolean;
  description?: string | null;
  buyQty?: number | null;
  getQty?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

function BranchPromotionTab({ branchId }: { branchId?: string }) {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/promotions/all`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const active = promos.filter(p => p.isActive).length;
  const withCode = promos.filter(p => p.code).length;

  async function toggleActive(p: Promotion) {
    await fetch(`${API_BASE}/promotions/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    fetchPromos();
  }

  async function handleDelete(p: Promotion) {
    if (!confirm(`ลบโปรโมชั่น "${p.name}"?`)) return;
    await fetch(`${API_BASE}/promotions/${p.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    fetchPromos();
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <KpiTile icon={<Tag size={18} />} label="ทั้งหมด" value={promos.length.toString()}
          color="#7c543c" bg="rgba(124,84,60,0.10)" hint="โปรโมชั่น" />
        <KpiTile icon={<Zap size={18} />} label="เปิดใช้" value={active.toString()}
          color="#10b981" bg="rgba(16,185,129,0.10)" hint="Active" />
        <KpiTile icon={<KeyRound size={18} />} label="มี Code" value={withCode.toString()}
          color="#f59e0b" bg="rgba(245,158,11,0.10)" hint="Coupon" />
      </div>

      {/* List */}
      <Card>
        <SectionHeader
          icon={<Tag size={16} />}
          title="โปรโมชั่นทั้งหมด"
          hint={`${promos.length} รายการ`}
          action={
            <button
              onClick={() => setCreating(true)}
              className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-white inline-flex items-center gap-1.5 shadow-md"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
            >
              <Plus size={13} /> สร้างโปรโมชั่น
            </button>
          }
        />

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-[#fdfaf6] animate-pulse" />
            ))}
          </div>
        ) : promos.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#fdfaf6', border: '1px dashed #d4c5b0' }}>
            <Tag size={32} className="mx-auto mb-2 text-[#7c543c]/40" />
            <p className="text-sm font-black text-[#2d241e]">ยังไม่มีโปรโมชั่น</p>
            <p className="text-xs font-bold text-[#7c543c]/60 mt-1">สร้างโปรโมชั่นแรก เพื่อดึงดูดลูกค้า</p>
          </div>
        ) : (
          <div className="space-y-2">
            {promos.map(p => {
              const tc = PROMO_TYPE_COLOR[p.type] || { color: '#7c543c', bg: 'rgba(124,84,60,0.10)' };
              return (
                <div key={p.id}
                  className="rounded-2xl p-3.5 flex items-center gap-3"
                  style={{ background: p.isActive ? '#ffffff' : '#fdfaf6', border: '1px solid #ece5da', opacity: p.isActive ? 1 : 0.65 }}>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: tc.bg, color: tc.color }}>
                    <Tag size={18} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-[#2d241e] truncate">{p.name}</p>
                      <span className="inline-flex items-center px-2 h-5 rounded text-[9px] font-black"
                        style={{ background: tc.bg, color: tc.color }}>
                        {PROMO_TYPE_LABEL[p.type] || p.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] font-bold text-[#7c543c]/70 flex-wrap">
                      <span className="num">
                        {p.type === 'PERCENT' ? `${p.value}%` : `฿${p.value.toLocaleString()}`}
                      </span>
                      {p.code && (
                        <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded bg-[#fdfaf6] border border-[#ece5da] text-[#7c543c] font-mono font-black text-[9px]">
                          {p.code}
                        </span>
                      )}
                      {p.minOrderAmount > 0 && (
                        <span className="text-[9px]">ขั้นต่ำ ฿{p.minOrderAmount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(p)}
                      className={`w-10 h-6 rounded-full relative transition-colors ${p.isActive ? 'bg-emerald-500' : 'bg-[#d4c5b0]'}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.isActive ? 'right-1' : 'left-1'}`} />
                    </button>
                    <button onClick={() => setEditing(p)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7c543c]/60 hover:bg-[#fdfaf6] transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(p)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <AnimatePresence>
        {creating && (
          <BranchPromoModal
            onClose={() => setCreating(false)}
            onDone={() => { setCreating(false); fetchPromos(); }}
          />
        )}
        {editing && (
          <BranchPromoModal
            promo={editing}
            onClose={() => setEditing(null)}
            onDone={() => { setEditing(null); fetchPromos(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BranchPromoModal({
  promo,
  onClose,
  onDone,
}: {
  promo?: Promotion;
  onClose: () => void;
  onDone: () => void;
}) {
  const isEdit = !!promo;
  const [name, setName] = useState(promo?.name || '');
  const [type, setType] = useState(promo?.type || 'PERCENT');
  const [value, setValue] = useState(String(promo?.value ?? ''));
  const [code, setCode] = useState(promo?.code || '');
  const [description, setDescription] = useState(promo?.description || '');
  const [minOrder, setMinOrder] = useState(String(promo?.minOrderAmount ?? 0));
  const [maxDiscount, setMaxDiscount] = useState(String(promo?.maxDiscount ?? ''));
  const [buyQty, setBuyQty] = useState(String(promo?.buyQty ?? 2));
  const [getQty, setGetQty] = useState(String(promo?.getQty ?? 1));
  const [isActive, setIsActive] = useState(promo?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Product selector (PRODUCT_DISCOUNT)
  const [productIds, setProductIds] = useState<string[]>((promo as any)?.productIds ?? []);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; category?: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (type !== 'PRODUCT_DISCOUNT') return;
    if (allProducts.length > 0) return;
    fetch(`${API_BASE}/products`)
      .then(r => r.json())
      .then((data: any[]) => {
        setAllProducts(data.map(p => ({ id: p.id, name: p.name, category: p.category?.name })));
      })
      .catch(console.error);
  }, [type, allProducts.length]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [allProducts, productSearch]);

  function toggleProduct(id: string) {
    setProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function submit() {
    if (!name.trim()) { setError('กรุณากรอกชื่อโปรโมชั่น'); return; }
    if (type !== 'BUY_X_GET_Y' && (!value || isNaN(Number(value)) || Number(value) <= 0)) { setError('กรุณากรอกค่าส่วนลด'); return; }
    if (type === 'PRODUCT_DISCOUNT' && productIds.length === 0) { setError('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'); return; }
    setSaving(true);
    setError('');
    try {
      const body: any = {
        name: name.trim(),
        type,
        value: Number(value),
        code: code.trim().toUpperCase() || null,
        description: description.trim() || null,
        minOrderAmount: Number(minOrder) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        isActive,
      };
      if (type === 'BUY_X_GET_Y') {
        body.buyQty = Number(buyQty) || 2;
        body.getQty = Number(getQty) || 1;
      }
      if (type === 'PRODUCT_DISCOUNT') {
        body.productIds = productIds;
      }
      const url = isEdit
        ? `${API_BASE}/promotions/${promo!.id}`
        : `${API_BASE}/promotions`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'บันทึกไม่สำเร็จ');
      }
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full h-10 px-3 rounded-xl text-sm font-medium outline-none";
  const inputStyle = { background: '#fdfaf6', border: '1px solid #ece5da' };
  const labelCls = "text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1 block";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md" onClick={() => !saving && onClose()} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Tag size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
                {isEdit ? 'แก้ไข' : 'สร้างใหม่'}
              </p>
              <p className="text-sm font-black">{isEdit ? promo!.name : 'โปรโมชั่นใหม่'}</p>
            </div>
          </div>
          <button onClick={() => !saving && onClose()} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className={labelCls}>ชื่อโปรโมชั่น *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น ลด 10% สำหรับสมาชิก"
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls}>ประเภทโปรโมชั่น</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PROMO_TYPE_LABEL).map(([k, v]) => {
                const tc = PROMO_TYPE_COLOR[k];
                const active2 = type === k;
                return (
                  <button key={k} onClick={() => setType(k)}
                    className="h-10 rounded-xl text-xs font-black transition-all"
                    style={active2 ? { background: tc.bg, color: tc.color, border: `2px solid ${tc.color}` }
                      : { background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product picker — PRODUCT_DISCOUNT only */}
          {type === 'PRODUCT_DISCOUNT' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>เลือกสินค้าที่ลดราคา *</label>
                {productIds.length > 0 && (
                  <span className="text-[9px] font-black text-[#6366f1] bg-[rgba(99,102,241,0.10)] px-2 h-5 rounded inline-flex items-center">
                    เลือก {productIds.length} รายการ
                  </span>
                )}
              </div>
              {/* Search */}
              <div className="relative mb-2">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c543c]/40" />
                <input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="ค้นหาเมนู..."
                  className="w-full h-9 pl-8 pr-3 rounded-xl text-xs font-medium outline-none"
                  style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
                />
              </div>
              {/* List */}
              <div className="rounded-2xl overflow-hidden max-h-52 overflow-y-auto"
                style={{ border: '1px solid #ece5da' }}>
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-xs text-[#7c543c]/50 py-6">ไม่พบสินค้า</p>
                ) : filteredProducts.map(p => {
                  const selected = productIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#fdfaf6]"
                      style={{ borderBottom: '1px solid #f3ece1', background: selected ? 'rgba(99,102,241,0.06)' : '#fff' }}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-[#6366f1]' : 'bg-white border border-[#d4c5b0]'}`}>
                        {selected && <Check size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-[#2d241e] truncate">{p.name}</p>
                        {p.category && <p className="text-[9px] font-bold text-[#7c543c]/60">{p.category}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {productIds.length > 0 && (
                <button onClick={() => setProductIds([])}
                  className="mt-1.5 text-[10px] font-bold text-[#7c543c]/50 hover:text-rose-500 transition-colors">
                  ล้างการเลือกทั้งหมด
                </button>
              )}
            </div>
          )}

          {type === 'BUY_X_GET_Y' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>ซื้อ (ชิ้น)</label>
                <input type="number" value={buyQty} onChange={e => setBuyQty(e.target.value)} min="1"
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls}>แถม (ชิ้น)</label>
                <input type="number" value={getQty} onChange={e => setGetQty(e.target.value)} min="1"
                  className={inputCls} style={inputStyle} />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelCls}>ค่าส่วนลด {type === 'PERCENT' ? '(%)' : '(฿)'} *</label>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} min="0"
                placeholder={type === 'PERCENT' ? 'เช่น 10' : 'เช่น 50'}
                className={inputCls} style={inputStyle} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ยอดขั้นต่ำ (฿)</label>
              <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} min="0"
                className={inputCls} style={inputStyle} />
            </div>
            {type === 'PERCENT' && (
              <div>
                <label className={labelCls}>ลดสูงสุด (฿)</label>
                <input type="number" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} min="0"
                  placeholder="ไม่จำกัด" className={inputCls} style={inputStyle} />
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Coupon Code (ไม่บังคับ)</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="เช่น COFFEE10" className={`${inputCls} font-mono tracking-widest`} style={inputStyle} />
          </div>

          <div>
            <label className={labelCls}>คำอธิบาย</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม" className={inputCls} style={inputStyle} />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-2xl p-4" style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}>
            <div>
              <p className="text-sm font-black text-[#2d241e]">เปิดใช้งาน</p>
              <p className="text-[11px] font-bold text-[#7c543c]/60">ลูกค้าสามารถใช้โปรโมชั่นนี้ได้</p>
            </div>
            <button onClick={() => setIsActive(!isActive)}
              className={`w-12 h-7 rounded-full relative transition-colors ${isActive ? 'bg-emerald-500' : 'bg-[#d4c5b0]'}`}>
              <span className={`absolute top-1.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'right-1.5' : 'left-1.5'}`} />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl p-3 bg-rose-50 text-rose-700">
              <AlertTriangle size={14} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex gap-2 shrink-0" style={{ borderTop: '1px solid #ece5da', background: '#fdfaf6' }}>
          <button onClick={() => !saving && onClose()}
            className="flex-1 h-11 rounded-xl text-sm font-black"
            style={{ background: '#fff', color: '#7c543c', border: '1px solid #ece5da' }}>
            ยกเลิก
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 h-11 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? 'บันทึก' : 'สร้างโปรโมชั่น'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Staff Tab — branch staff CRUD with PIN
// ════════════════════════════════════════════════════════════════════════════
const STAFF_ROLES: Array<{ id: string; label: string; color: string; bg: string }> = [
  { id: 'BRANCH_MANAGER', label: 'ผู้จัดการสาขา', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  { id: 'CASHIER', label: 'แคชเชียร์', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'BARISTA', label: 'บาริสต้า', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'QC', label: 'ตรวจคุณภาพ', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { id: 'DISPATCHER', label: 'ส่งมอบสินค้า', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { id: 'STOCK', label: 'นับสต็อก', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
];

interface StaffMember {
  id: string;
  branchId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  pin?: string | null;
  isActive: boolean;
  createdAt: string;
}

function StaffTab({ branchId }: { branchId?: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [creating, setCreating] = useState(false);
  const paginatedStaff = useClientPagination(staff, 10, branchId || null);

  const fetchStaff = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/branches/${branchId}/managers`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error('Fetch failed');
      setStaff(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const stats = useMemo(() => {
    const active = staff.filter((s) => s.isActive).length;
    const managers = staff.filter((s) => s.role === 'BRANCH_MANAGER' && s.isActive).length;
    const withPin = staff.filter((s) => s.pin && s.isActive).length;
    return { active, total: staff.length, managers, withPin };
  }, [staff]);

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          icon={<Users size={18} />}
          label="พนักงานทั้งหมด"
          value={stats.total.toLocaleString()}
          color="#7c543c"
          bg="rgba(124,84,60,0.12)"
          hint={`active ${stats.active}`}
        />
        <KpiTile
          icon={<Shield size={18} />}
          label="ผู้จัดการ"
          value={stats.managers.toLocaleString()}
          color="#ea580c"
          bg="rgba(234,88,12,0.12)"
          hint="BRANCH_MANAGER"
        />
        <KpiTile
          icon={<KeyRound size={18} />}
          label="มี PIN"
          value={stats.withPin.toLocaleString()}
          color="#10b981"
          bg="rgba(16,185,129,0.12)"
          hint="ใช้ login ได้"
        />
        <KpiTile
          icon={<ShieldCheck size={18} />}
          label="ระดับความปลอดภัย"
          value={stats.withPin > 0 ? 'OK' : 'LOW'}
          color={stats.withPin > 0 ? '#10b981' : '#dc2626'}
          bg={stats.withPin > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(220,38,38,0.12)'}
          hint={stats.withPin === 0 ? 'env-only' : 'per-staff PIN'}
        />
      </div>

      <Card>
        <SectionHeader
          icon={<Users size={16} />}
          title="พนักงานในสาขา"
          hint={`${stats.total} คน`}
          action={
            <button
              onClick={() => setCreating(true)}
              className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-white inline-flex items-center gap-1.5 shadow-md"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
            >
              <Plus size={13} /> เพิ่มพนักงาน
            </button>
          }
        />

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#fdfaf6] animate-pulse" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: '#fdfaf6', border: '1px dashed #d4c5b0' }}
          >
            <Users size={32} className="mx-auto mb-2 text-[#7c543c]/40" />
            <p className="text-sm font-black text-[#2d241e]">ยังไม่มีพนักงาน</p>
            <p className="text-xs font-bold text-[#7c543c]/60 mt-1">
              เพิ่มพนักงานคนแรก แล้วตั้ง PIN ให้เขา login เข้าสถานีต่าง ๆ
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedStaff.pageItems.map((s) => (
              <StaffRow key={s.id} staff={s} onEdit={() => setEditing(s)} />
            ))}

            <PaginationControls
              page={paginatedStaff.page}
              totalPages={paginatedStaff.totalPages}
              totalItems={paginatedStaff.totalItems}
              pageSize={paginatedStaff.pageSize}
              onPageChange={paginatedStaff.setPage}
              itemLabel="พนักงาน"
            />
          </div>
        )}
      </Card>

      <AnimatePresence>
        {creating && (
          <StaffModal
            branchId={branchId!}
            existingPins={staff
              .filter((s) => s.isActive && s.pin)
              .map((s) => s.pin as string)}
            onClose={() => setCreating(false)}
            onDone={() => {
              setCreating(false);
              fetchStaff();
            }}
          />
        )}
        {editing && (
          <StaffModal
            branchId={branchId!}
            staff={editing}
            existingPins={staff
              .filter((s) => s.isActive && s.pin && s.id !== editing.id)
              .map((s) => s.pin as string)}
            onClose={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              fetchStaff();
            }}
            onDelete={async () => {
              if (!confirm(`ลบพนักงาน "${editing.name}"?`)) return;
              try {
                const res = await fetch(`${API_BASE}/branches/managers/${editing.id}`, {
                  method: 'DELETE',
                  headers: { ...authHeaders() },
                });
                if (!res.ok) throw new Error('ลบไม่สำเร็จ');
                setEditing(null);
                fetchStaff();
              } catch (e: any) {
                alert(e.message);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StaffRow({ staff, onEdit }: { staff: StaffMember; onEdit: () => void }) {
  const roleCfg =
    STAFF_ROLES.find((r) => r.id === staff.role) || STAFF_ROLES[1];
  return (
    <button
      onClick={onEdit}
      className="w-full text-left rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:shadow-md"
      style={{
        background: staff.isActive ? '#ffffff' : '#fdfaf6',
        border: '1px solid #ece5da',
        opacity: staff.isActive ? 1 : 0.6,
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-sm"
        style={{ background: roleCfg.bg, color: roleCfg.color }}
      >
        {staff.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-[#2d241e] truncate">{staff.name}</p>
          <span
            className="inline-flex items-center px-2 h-5 rounded text-[9px] font-black"
            style={{ background: roleCfg.bg, color: roleCfg.color }}
          >
            {roleCfg.label}
          </span>
          {!staff.isActive && (
            <span className="inline-flex items-center px-2 h-5 rounded text-[9px] font-black bg-rose-100 text-rose-700">
              ปิดใช้งาน
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-[#7c543c]/70">
          {staff.phone && (
            <span className="inline-flex items-center gap-1 num">
              <Phone size={10} /> {staff.phone}
            </span>
          )}
          {staff.email && (
            <span className="inline-flex items-center gap-1 truncate">
              <Mail size={10} /> {staff.email}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {staff.pin ? (
          <span
            className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700"
            title="มี PIN"
          >
            <KeyRound size={11} /> PIN
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[10px] font-black bg-rose-50 text-rose-700"
            title="ยังไม่ได้ตั้ง PIN"
          >
            <KeyRound size={11} /> ไม่มี
          </span>
        )}
        <Edit2 size={14} className="text-[#7c543c]/50" />
      </div>
    </button>
  );
}

function StaffModal({
  branchId,
  staff,
  existingPins,
  onClose,
  onDone,
  onDelete,
}: {
  branchId: string;
  staff?: StaffMember;
  existingPins: string[];
  onClose: () => void;
  onDone: () => void;
  onDelete?: () => void;
}) {
  const isEdit = !!staff;
  const [name, setName] = useState(staff?.name || '');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [role, setRole] = useState(staff?.role || 'CASHIER');
  const [pin, setPin] = useState(staff?.pin || '');
  const [showPin, setShowPin] = useState(false);
  const [isActive, setIsActive] = useState(staff?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pinError = useMemo(() => {
    if (!pin) return '';
    if (!/^\d{4,12}$/.test(pin)) return 'PIN ต้องเป็นตัวเลข 4-12 หลัก';
    if (existingPins.includes(pin)) return 'PIN นี้ถูกใช้โดยพนักงานคนอื่นแล้ว';
    return '';
  }, [pin, existingPins]);

  const submit = async () => {
    if (!name.trim()) {
      setError('กรุณากรอกชื่อ');
      return;
    }
    if (pinError) {
      setError(pinError);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role,
        pin: pin.trim() || null,
        isActive,
      };
      const url = isEdit
        ? `${API_BASE}/branches/managers/${staff!.id}`
        : `${API_BASE}/branches/${branchId}/managers`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'บันทึกไม่สำเร็จ');
      }
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md" onClick={() => !submitting && onClose()} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div
          className="px-5 py-4 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}
            >
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                {isEdit ? 'แก้ไข' : 'เพิ่ม'}
              </p>
              <p className="font-black text-base">
                {isEdit ? staff!.name : 'พนักงานคนใหม่'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
          <TextField label="ชื่อ - นามสกุล *" value={name} onChange={setName} placeholder="เช่น สมชาย ใจดี" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="เบอร์โทร" value={phone} onChange={setPhone} placeholder="08x-xxx-xxxx" />
            <TextField label="อีเมล" value={email} onChange={setEmail} placeholder="(ไม่บังคับ)" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
              ตำแหน่ง *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STAFF_ROLES.map((r) => {
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className="h-12 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center text-center px-1"
                    style={{
                      background: active ? r.bg : '#fdfaf6',
                      color: active ? r.color : '#7c543c80',
                      border: `1.5px solid ${active ? r.color : '#ece5da'}`,
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            {role === 'BRANCH_MANAGER' && (
              <p className="mt-2 text-[10px] font-bold text-[#ea580c]">
                ⚡ ผู้จัดการจะเข้าหน้า Dashboard ได้ — ใช้ PIN นี้ login เพื่อปลดล็อก
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
              PIN (4-12 หลัก)
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c543c]/50 pointer-events-none" />
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="เช่น 1234"
                className="w-full h-11 pl-9 pr-12 rounded-xl text-base font-black num outline-none tracking-[0.3em]"
                style={{
                  background: '#fdfaf6',
                  border: `1px solid ${pinError ? '#dc2626' : '#ece5da'}`,
                  color: '#2d241e',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#7c543c]/60"
                tabIndex={-1}
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {pinError && (
              <p className="mt-1.5 text-[10px] font-bold text-rose-600">{pinError}</p>
            )}
            {!pin && (
              <p className="mt-1.5 text-[10px] font-bold text-[#7c543c]/60">
                เว้นว่างได้ถ้ายังไม่ต้องการให้ login
              </p>
            )}
          </div>

          <label
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
            style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <p className="text-xs font-black text-[#2d241e]">เปิดใช้งาน</p>
              <p className="text-[10px] font-bold text-[#7c543c]/60">
                ปิดเพื่อ revoke PIN ชั่วคราว (ไม่ต้องลบทิ้ง)
              </p>
            </div>
          </label>

          {error && (
            <div className="rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold bg-rose-50 text-rose-700">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid #ece5da', background: '#fdfaf6' }}>
          {isEdit && onDelete && (
            <button
              onClick={onDelete}
              disabled={submitting}
              className="h-11 w-11 rounded-xl flex items-center justify-center text-rose-600 disabled:opacity-50"
              style={{ background: '#fee2e2', border: '1px solid #fecaca' }}
              title="ลบพนักงาน"
            >
              <Trash2 size={14} />
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={submitting}
            className="h-11 px-4 rounded-xl text-xs font-black uppercase tracking-widest"
            style={{ background: '#ffffff', color: '#7c543c', border: '1px solid #ece5da' }}
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={submitting || !name.trim() || !!pinError}
            className="h-11 px-5 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
          >
            {submitting ? 'กำลังบันทึก...' : (
              <>
                <Check size={13} /> {isEdit ? 'อัปเดต' : 'สร้าง'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
