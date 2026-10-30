import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Store,
  CheckSquare,
  Truck,
  LogOut,
  Settings,
  ChevronRight,
  Bell,
  HelpCircle,
  Lock,
  AlertTriangle,
  Loader2,
  X,
  Wifi,
  Sparkles,
  ArrowRight,
  Delete,
  ShieldCheck,
  MapPin,
  Boxes,
  Users,
  Clock,
  BarChart3,
  QrCode,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_BASE, SOCKET_URL, auth } from './api';

const POSView = lazy(() => import('./components/roles/POSView'));
const BaristaView = lazy(() => import('./components/roles/BaristaView'));
const QCView = lazy(() => import('./components/roles/QCView'));
const DispatchView = lazy(() => import('./components/roles/DispatchView'));
const QueueMonitorView = lazy(() => import('./components/roles/QueueMonitorView'));
const CustomerDisplayView = lazy(() => import('./components/roles/CustomerDisplayView'));
const StockCheckView = lazy(() => import('./components/roles/StockCheckView'));
const ManagerView = lazy(() => import('./components/roles/ManagerView'));
const MobileAttendanceView = lazy(() => import('./components/roles/MobileAttendanceView'));

type Role =
  | 'SELECTOR'
  | 'CASHIER'
  | 'BARISTA'
  | 'QC'
  | 'DISPATCHER'
  | 'QUEUE_MONITOR'
  | 'CUSTOMER_DISPLAY'
  | 'STOCK_CHECK'
  | 'MANAGER'
  | 'ATTENDANCE';

const VALID_ROLES: Role[] = [
  'SELECTOR',
  'CASHIER',
  'BARISTA',
  'QC',
  'DISPATCHER',
  'QUEUE_MONITOR',
  'CUSTOMER_DISPLAY',
  'STOCK_CHECK',
  'MANAGER',
  'ATTENDANCE',
];

function readRoleFromHash(): Role {
  const hashWithoutQuery = window.location.hash.split('?')[0];
  const normalized = hashWithoutQuery.replace(/^#\/?/, '').replace(/-/g, '_').toUpperCase() as Role;
  return VALID_ROLES.includes(normalized) ? normalized : 'SELECTOR';
}

function readBranchIdFromUrl(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('branchId')) return searchParams.get('branchId');
  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1];
    const hashParams = new URLSearchParams(hashQuery);
    if (hashParams.get('branchId')) return hashParams.get('branchId');
  }
  return null;
}

export default function App() {
  const urlBranchId = readBranchIdFromUrl();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    () => urlBranchId || auth.getBranchId()
  );
  const [activeRole, setActiveRoleState] = useState<Role>(readRoleFromHash);
  const [branches, setBranches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(auth.isLoggedIn());
  const [now, setNow] = useState<Date>(new Date());

  // PIN-gate state
  const [pinModalBranch, setPinModalBranch] = useState<any>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Live clock for the entry screens
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Sync activeRole <-> URL hash so the browser back button works
  useEffect(() => {
    const onHashChange = () => setActiveRoleState(readRoleFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setActiveRole = useCallback((r: Role) => {
    const target = `#/${r.toLowerCase()}`;
    if (window.location.hash !== target) {
      // pushState lets the browser back button bring us to the previous role
      window.history.pushState(null, '', target);
    }
    setActiveRoleState(r);
  }, []);

  const mergeOrderIntoState = useCallback((order: any) => {
    if (!order?.id) return;
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx === -1) return [order, ...prev];
      const next = [...prev];
      next[idx] = { ...prev[idx], ...order };
      return next;
    });
  }, []);

  // 1. Fetch Branches
  useEffect(() => {
    fetch(`${API_BASE}/branches`)
      .then((res) => res.json())
      .then((data) => setBranches(data))
      .catch((err) => console.error('Fetch branches failed', err));
  }, []);

  // 2. Socket Connection — only after PIN auth
  useEffect(() => {
    if (!selectedBranchId || !isAuthed) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token: auth.getToken() || '' },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-branch', selectedBranchId);
      refreshOrders();
    });

    newSocket.on('new-order', mergeOrderIntoState);

    newSocket.on('update-order', mergeOrderIntoState);

    return () => {
      newSocket.disconnect();
    };
  }, [selectedBranchId, isAuthed, mergeOrderIntoState]);

  const refreshOrders = () => {
    if (!selectedBranchId) return;
    fetch(`${API_BASE}/branches/${selectedBranchId}/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(data));
  };

  const updateStatus = async (orderId: string, status: string, metadata?: any) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ status, metadata }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updatedOrder = await res.json();
      mergeOrderIntoState(updatedOrder);
      return updatedOrder;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };


  const handleSelectBranch = (branch: any) => {
    if (auth.isLoggedIn() && auth.getBranchId() === branch.id) {
      setSelectedBranchId(branch.id);
      return;
    }
    auth.clear();
    setPinModalBranch(branch);
    setPinValue('');
    setPinError('');
  };

  const handlePinSubmit = async () => {
    if (!pinModalBranch || pinValue.length < 4) return;
    setPinLoading(true);
    setPinError('');
    try {
      const res = await fetch(`${API_BASE}/auth/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: pinModalBranch.id, pin: pinValue }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'PIN ไม่ถูกต้อง');
      }
      const { token } = await res.json();
      auth.setSession(token, pinModalBranch.id);
      setIsAuthed(true);
      setSelectedBranchId(pinModalBranch.id);
      setPinModalBranch(null);
      setPinValue('');
    } catch (err: any) {
      setPinError(err.message || 'PIN ไม่ถูกต้อง');
      setPinValue('');
    } finally {
      setPinLoading(false);
    }
  };

  const handleSwitchBranch = () => {
    auth.clear();
    setIsAuthed(false);
    setSelectedBranchId(null);
    setActiveRole('SELECTOR');
  };

  // ─── Branch Selector ─────────────────────────────────────────────────────
  const isCustomerDisplay = activeRole === 'CUSTOMER_DISPLAY';
  if (activeRole !== 'ATTENDANCE' && !isCustomerDisplay && (!selectedBranchId || !isAuthed)) {
    return (
      <BranchSelectorScreen
        branches={branches}
        now={now}
        onSelect={handleSelectBranch}
        pinModalBranch={pinModalBranch}
        pinValue={pinValue}
        pinError={pinError}
        pinLoading={pinLoading}
        onPinChange={(v) => {
          setPinError('');
          setPinValue(v);
        }}
        onPinSubmit={handlePinSubmit}
        onPinClose={() => {
          if (!pinLoading) {
            setPinModalBranch(null);
            setPinValue('');
            setPinError('');
          }
        }}
      />
    );
  }

  // ─── Role Selector ───────────────────────────────────────────────────────
  if (activeRole === 'SELECTOR') {
    return (
      <RoleSelectorScreen
        branch={branches.find((b) => b.id === selectedBranchId)}
        now={now}
        onPick={(r) => setActiveRole(r)}
        onSwitchBranch={handleSwitchBranch}
        ordersCount={orders.length}
      />
    );
  }

  // ─── Mobile Attendance View (Public) ─────────────────────────────────────
  if (activeRole === 'ATTENDANCE') {
    return (
      <Suspense fallback={<div className="h-[100dvh] flex items-center justify-center bg-[#1a1410]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
        <MobileAttendanceView />
      </Suspense>
    );
  }

  // ─── Active Role View ────────────────────────────────────────────────────
  const activeBranch = branches.find((b) => b.id === (selectedBranchId || urlBranchId)) || branches[0];

  return (
    <ActiveRoleShell
      activeRole={activeRole}
      isCustomerDisplay={isCustomerDisplay}
      branchName={activeBranch?.name}
      onSwitchRole={setActiveRole}
      onSwitchBranch={handleSwitchBranch}
    >
      <Suspense fallback={<div className="h-full flex items-center justify-center bg-[#1a1410]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
        {activeRole === 'CASHIER' && (
          <POSView
            branch={activeBranch}
            orders={orders}
            updateStatus={updateStatus}
            onOrderUpdated={mergeOrderIntoState}
          />
        )}
        {activeRole === 'BARISTA' && <BaristaView orders={orders} updateStatus={updateStatus} />}
        {activeRole === 'QC' && <QCView orders={orders} updateStatus={updateStatus} />}
        {activeRole === 'DISPATCHER' && (
          <DispatchView orders={orders} updateStatus={updateStatus} />
        )}
        {activeRole === 'QUEUE_MONITOR' && (
          <QueueMonitorView
            branch={activeBranch}
            orders={orders}
          />
        )}
        {activeRole === 'CUSTOMER_DISPLAY' && (
          <CustomerDisplayView
            branch={activeBranch}
            orders={orders}
          />
        )}
        {activeRole === 'STOCK_CHECK' && (
          <StockCheckView branch={branches.find((b) => b.id === selectedBranchId)} />
        )}
        {activeRole === 'MANAGER' && (
          <ManagerView branch={branches.find((b) => b.id === selectedBranchId)} />
        )}
      </Suspense>
    </ActiveRoleShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Active Role Shell — Desktop top bar + Mobile bottom nav + Role popup sheet
// ════════════════════════════════════════════════════════════════════════════

const ROLE_NAV = [
  { id: 'MANAGER',          label: 'จัดการ',    icon: BarChart3,  color: '#7c543c' },
  { id: 'CASHIER',          label: 'POS',        icon: Store,      color: '#10b981' },
  { id: 'BARISTA',          label: 'บาริสต้า',  icon: Coffee,     color: '#f59e0b' },
  { id: 'QC',               label: 'QC',         icon: CheckSquare,color: '#3b82f6' },
  { id: 'DISPATCHER',       label: 'ส่งมอบ',    icon: Truck,      color: '#ea580c' },
  { id: 'QUEUE_MONITOR',    label: 'คิว',        icon: Bell,       color: '#e11d48' },
  { id: 'CUSTOMER_DISPLAY', label: 'ลูกค้า',    icon: QrCode,     color: '#0891b2' },
  { id: 'STOCK_CHECK',      label: 'สต็อก',     icon: Boxes,      color: '#6366f1' },
] as const;

function ActiveRoleShell({
  activeRole,
  isCustomerDisplay,
  branchName,
  onSwitchRole,
  onSwitchBranch,
  children,
}: {
  activeRole: Role;
  isCustomerDisplay: boolean;
  branchName?: string;
  onSwitchRole: (r: Role) => void;
  onSwitchBranch: () => void;
  children: React.ReactNode;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const current = ROLE_NAV.find((r) => r.id === activeRole);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* ── Desktop top bar (hidden on mobile) ── */}
      {!isCustomerDisplay && (
        <div className="hidden sm:flex h-10 bg-[#2d241e] text-white items-center justify-between px-6 z-50 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {branchName}
            </span>
            <span className="w-1 h-3 bg-white/20 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
              {activeRole} STATION
            </span>
          </div>
          <button
            onClick={() => onSwitchRole('SELECTOR')}
            className="text-[10px] font-black uppercase tracking-widest hover:text-rose-400 transition-colors flex items-center gap-2"
          >
            เปลี่ยนตำแหน่งงาน <Settings size={10} />
          </button>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* ── Mobile bottom nav bar (hidden on sm+) ── */}
      {!isCustomerDisplay && (
        <nav
          className="sm:hidden shrink-0 bg-[#2d241e] border-t border-white/10 flex items-stretch z-50"
          style={{ paddingBottom: 'var(--sab, 0px)', minHeight: '60px' }}
        >
          {/* Quick-access: show up to 4 most-used roles as icon tabs */}
          {ROLE_NAV.slice(0, 4).map((r) => {
            const Icon = r.icon;
            const isActive = activeRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onSwitchRole(r.id as Role)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all active:opacity-70"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isActive ? r.color : 'transparent',
                    boxShadow: isActive ? `0 0 12px ${r.color}55` : 'none',
                  }}
                >
                  <Icon size={16} color={isActive ? '#fff' : 'rgba(255,255,255,0.45)'} />
                </div>
                <span
                  className="text-[9px] font-black uppercase tracking-wide"
                  style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}
                >
                  {r.label}
                </span>
              </button>
            );
          })}

          {/* More button — opens full role sheet */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all active:opacity-70"
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: sheetOpen ? '#ea580c' : 'transparent' }}>
              <Settings size={16} color={sheetOpen ? '#fff' : 'rgba(255,255,255,0.45)'} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wide text-white/40">เพิ่มเติม</span>
          </button>
        </nav>
      )}

      {/* ── Role switcher bottom sheet popup ── */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sm:hidden fixed inset-0 z-[100] flex items-end"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
              className="relative w-full bg-[#fdfaf6] rounded-t-[2rem] shadow-2xl overflow-hidden"
              style={{ paddingBottom: 'max(1.25rem, var(--sab, 0px))' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-[#e8e2db]" />
              </div>

              {/* Sheet header */}
              <div className="px-6 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">สลับตำแหน่งงาน</p>
                  <p className="text-base font-black text-[#2d241e] tracking-tight">
                    {current ? current.label : activeRole}
                    <span className="text-[#ea580c]"> · กำลังใช้งาน</span>
                  </p>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-10 h-10 rounded-xl bg-[#f0e8de] flex items-center justify-center text-[#7c543c] active:bg-[#e8dcd0] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Role grid 2×4 */}
              <div className="px-4 pb-4 grid grid-cols-4 gap-2.5">
                {ROLE_NAV.map((r, idx) => {
                  const Icon = r.icon;
                  const isActive = activeRole === r.id;
                  return (
                    <motion.button
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => { onSwitchRole(r.id as Role); setSheetOpen(false); }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:opacity-80"
                      style={{
                        background: isActive ? `${r.color}18` : '#fff',
                        border: isActive ? `1.5px solid ${r.color}40` : '1.5px solid rgba(232,226,219,0.6)',
                        boxShadow: isActive ? `0 4px 14px ${r.color}22` : '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: isActive ? r.color : `${r.color}18`,
                          boxShadow: isActive ? `0 4px 12px ${r.color}55` : 'none',
                        }}
                      >
                        <Icon size={20} color={isActive ? '#fff' : r.color} />
                      </div>
                      <span
                        className="text-[10px] font-black text-center leading-tight"
                        style={{ color: isActive ? r.color : '#2d241e' }}
                      >
                        {r.label}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="mx-6 mb-3 border-t border-dashed border-[#e8e2db]" />

              {/* Branch / switch actions */}
              <div className="px-4 pb-2 flex flex-col gap-2">
                <button
                  onClick={() => { onSwitchRole('SELECTOR'); setSheetOpen(false); }}
                  className="w-full h-12 rounded-2xl bg-white border border-[#e8e2db] flex items-center gap-3 px-4 text-[#2d241e] font-black text-sm active:bg-[#fdfaf6] transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Settings size={16} className="text-amber-600" />
                  </div>
                  <span>เลือกตำแหน่งงานใหม่</span>
                  <ChevronRight size={16} className="ml-auto text-[#7c543c]/40" />
                </button>
                <button
                  onClick={() => { onSwitchBranch(); setSheetOpen(false); }}
                  className="w-full h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 px-4 text-rose-700 font-black text-sm active:bg-rose-100 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                    <LogOut size={16} className="text-rose-600" />
                  </div>
                  <span>เปลี่ยนสาขา / ออกจากระบบ</span>
                  <ChevronRight size={16} className="ml-auto text-rose-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// Branch Selector Screen
// ════════════════════════════════════════════════════════════════════════════

function BranchSelectorScreen({
  branches,
  now,
  onSelect,
  pinModalBranch,
  pinValue,
  pinError,
  pinLoading,
  onPinChange,
  onPinSubmit,
  onPinClose,
}: {
  branches: any[];
  now: Date;
  onSelect: (b: any) => void;
  pinModalBranch: any;
  pinValue: string;
  pinError: string;
  pinLoading: boolean;
  onPinChange: (v: string) => void;
  onPinSubmit: () => void;
  onPinClose: () => void;
}) {
  const dateStr = now.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-[100dvh] relative overflow-x-hidden flex flex-col">
      {/* Animated background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(234,88,12,0.10) 0%, transparent 55%), radial-gradient(circle at 85% 80%, rgba(124,84,60,0.12) 0%, transparent 60%), linear-gradient(180deg, #fdfaf6 0%, #f7efe3 100%)',
        }}
      />
      <div
        className="absolute -top-24 -right-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fcd34d 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 sm:w-[500px] sm:h-[500px] rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ea580c 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      {/* Top bar — always shows logo + clock on all breakpoints */}
      <header
        className="relative z-10 flex items-center justify-between gap-3"
        style={{ padding: 'max(1rem, calc(0.75rem + var(--sat))) 1.25rem 0.75rem' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)' }}
          >
            <Coffee className="text-white" size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight text-[#2d241e] truncate">456 COFFEE</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#7c543c]/70">Branch Ops</p>
          </div>
        </div>

        {/* Clock — always visible (compact on mobile) */}
        <div className="flex items-center gap-1.5 text-[#7c543c] shrink-0">
          <Clock size={13} className="opacity-60" />
          <div className="text-right">
            <p className="text-sm font-black tracking-tight text-[#2d241e] leading-tight">{timeStr}</p>
            <p className="text-[9px] font-semibold text-[#7c543c]/60 leading-tight hidden xs:block sm:block">{dateStr}</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col px-5 sm:px-8 lg:px-10 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-6 sm:mb-10"
        >
          <span className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-white/80 backdrop-blur text-[11px] font-bold uppercase tracking-widest text-[#7c543c] shadow-sm border border-white">
            <Sparkles size={11} /> Welcome back
          </span>
          <h1 className="mt-3 text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#2d241e] leading-tight">
            เลือกสาขา<span className="text-[#ea580c]">ที่ปฏิบัติงาน</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base font-semibold text-[#7c543c]/80">
            แตะเลือกสาขา แล้วใส่ PIN เพื่อเข้าใช้งาน
          </p>
        </motion.div>

        {branches.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-xl border border-[#e8e2db] p-10 text-center max-w-sm w-full">
              <Loader2 className="mx-auto mb-4 animate-spin text-[#7c543c]" size={28} />
              <p className="text-sm font-bold text-[#2d241e]">กำลังโหลดรายการสาขา...</p>
            </div>
          </div>
        ) : (
          /* Mobile: horizontal scroll pill list + desktop: grid */
          <div className="w-full max-w-5xl mx-auto">
            {/* Mobile scroll (< sm) */}
            <div className="sm:hidden -mx-5 px-5 overflow-x-auto pb-3 scroll-smooth-y">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {branches.map((b, idx) => (
                  <motion.button
                    key={b.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onSelect(b)}
                    className="relative overflow-hidden bg-white rounded-2xl shadow-md border border-white/80 p-4 text-left"
                    style={{ width: '200px', borderColor: 'rgba(232,226,219,0.8)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                        style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
                      >
                        <Store className="text-white" size={18} />
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />Open
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-[#2d241e] tracking-tight leading-tight mb-1">{b.name}</h3>
                    {b.location && (
                      <p className="text-[11px] font-semibold text-[#7c543c]/70 flex items-center gap-1 truncate">
                        <MapPin size={10} />{b.location}
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-dashed border-[#e8e2db] flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/50">ID·{b.id.slice(0,5)}</span>
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-[#ea580c]">
                        เลือก <ArrowRight size={11} />
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* sm+ grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b, idx) => (
                <motion.button
                  key={b.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(b)}
                  className="group relative overflow-hidden bg-white rounded-3xl shadow-lg shadow-amber-900/5 border border-white hover:border-[#ea580c]/30 hover:shadow-2xl hover:shadow-amber-900/10 transition-all p-6 text-left"
                  style={{ borderColor: 'rgba(232,226,219,0.7)' }}
                >
                  <div
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.15), transparent 70%)' }}
                  />
                  <div className="relative flex items-start justify-between mb-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                      style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
                    >
                      <Store className="text-white" size={20} />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Open
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-[#2d241e] tracking-tight mb-1">{b.name}</h3>
                  {b.location && (
                    <p className="text-xs font-semibold text-[#7c543c]/70 mb-5 inline-flex items-center gap-1">
                      <MapPin size={11} />{b.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#e8e2db]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#7c543c]/60">ID · {b.id.slice(0, 6)}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-[#ea580c] group-hover:gap-2 transition-all">
                      เลือกสาขา <ArrowRight size={14} />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 flex items-center justify-center gap-4 sm:gap-6 text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 flex-wrap"
        style={{ padding: '0.75rem 1.25rem max(1rem, calc(0.5rem + var(--sab)))' }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Connected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Wifi size={11} />Cloud sync
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={11} />PIN secured
        </span>
      </footer>

      {/* PIN modal */}
      <AnimatePresence>
        {pinModalBranch && (
          <PinModal
            branch={pinModalBranch}
            value={pinValue}
            error={pinError}
            loading={pinLoading}
            onChange={onPinChange}
            onSubmit={onPinSubmit}
            onClose={onPinClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PIN Modal — large numeric keypad for touch-screen POS
// ════════════════════════════════════════════════════════════════════════════

function PinModal({
  branch,
  value,
  error,
  loading,
  onChange,
  onSubmit,
  onClose,
}: {
  branch: any;
  value: string;
  error: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const press = (digit: string) => {
    if (loading) return;
    if (value.length >= 8) return;
    onChange(value + digit);
  };
  const back = () => {
    if (loading) return;
    onChange(value.slice(0, -1));
  };

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (value.length === 4 && !loading) {
      const t = setTimeout(() => onSubmit(), 150);
      return () => clearTimeout(t);
    }
  }, [value, loading, onSubmit]);

  // Hardware keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        if (value.length < 8) onChange(value + e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onChange(value.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [value, loading, onChange, onSubmit, onClose]);

  const dots = Array.from({ length: 4 }, (_, i) => i < value.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Mobile bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        className="sm:hidden relative w-full bg-white rounded-t-[2rem] shadow-2xl overflow-hidden"
        style={{ paddingBottom: 'max(1rem, var(--sab))' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e8e2db]" />
        </div>
        {/* Header */}
        <div className="px-6 pt-2 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
              <Lock className="text-white" size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">Staff PIN · 4 หลัก</p>
              <p className="font-black text-base text-[#2d241e] tracking-tight truncate max-w-[200px]">{branch.name}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-11 h-11 rounded-xl text-[#7c543c]/60 flex items-center justify-center hover:bg-[#fdfaf6] active:bg-[#efe8de] transition-colors disabled:opacity-30">
            <X size={18} />
          </button>
        </div>
        {/* Dots */}
        <div className="px-6 pb-1">
          <motion.div
            key={error ? 'err' : 'ok'}
            animate={error ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-5 py-3"
          >
            {dots.map((filled, i) => (
              <motion.div key={i} animate={{ scale: filled ? 1.1 : 0.8 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-5 h-5 rounded-full"
                style={{
                  background: error ? '#e11d48' : filled ? '#ea580c' : 'rgba(124,84,60,0.18)',
                  boxShadow: filled && !error ? '0 0 0 8px rgba(234,88,12,0.12)' : 'none',
                }}
              />
            ))}
          </motion.div>
          <div className="h-6 text-center">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#7c543c]">
                <Loader2 size={12} className="animate-spin" /> กำลังตรวจสอบ...
              </span>
            ) : error ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <AlertTriangle size={12} /> {error}
              </span>
            ) : (
              <span className="text-xs font-bold text-[#7c543c]/60">ใส่รหัส PIN เพื่อเข้าใช้งาน</span>
            )}
          </div>
        </div>
        {/* Large keypad for mobile touch */}
        <div className="px-4 pb-2 grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map((d) => (
            <KeypadButton key={d} onClick={() => press(d)} disabled={loading} size="lg">{d}</KeypadButton>
          ))}
          <KeypadButton variant="muted" onClick={back} disabled={loading || value.length === 0} size="lg">
            <Delete size={22} />
          </KeypadButton>
          <KeypadButton onClick={() => press('0')} disabled={loading} size="lg">0</KeypadButton>
          <KeypadButton variant="primary" onClick={onSubmit} disabled={loading || value.length < 4} size="lg">
            {loading ? <Loader2 size={22} className="animate-spin" /> : <ArrowRight size={22} />}
          </KeypadButton>
        </div>
        <p className="text-center text-[9px] font-black uppercase tracking-widest text-[#7c543c]/40 pb-2">
          PIN เริ่มต้น 4567 · ตั้งใหม่ผ่าน env POS_PIN
        </p>
      </motion.div>

      {/* Desktop centered card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="hidden sm:block relative w-full max-w-sm bg-white rounded-[2.25rem] shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
              <Lock className="text-white" size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">Staff PIN · 4 หลัก</p>
              <p className="font-black text-base text-[#2d241e] tracking-tight truncate max-w-[180px]">{branch.name}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            className="p-2 rounded-xl text-[#7c543c]/60 hover:bg-[#fdfaf6] transition-colors disabled:opacity-30">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-2">
          <motion.div
            key={error ? 'err' : 'ok'}
            animate={error ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-4 py-4"
          >
            {dots.map((filled, i) => (
              <motion.div key={i} animate={{ scale: filled ? 1 : 0.85 }}
                className="w-4 h-4 rounded-full transition-colors"
                style={{
                  background: error ? '#e11d48' : filled ? '#ea580c' : 'rgba(124,84,60,0.18)',
                  boxShadow: filled && !error ? '0 0 0 6px rgba(234,88,12,0.12)' : 'none',
                }}
              />
            ))}
          </motion.div>
          <div className="h-6 text-center">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#7c543c]">
                <Loader2 size={12} className="animate-spin" /> กำลังตรวจสอบ...
              </span>
            ) : error ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <AlertTriangle size={12} /> {error}
              </span>
            ) : (
              <span className="text-xs font-bold text-[#7c543c]/60">ใส่รหัส PIN เพื่อเข้าใช้งาน</span>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map((d) => (
            <KeypadButton key={d} onClick={() => press(d)} disabled={loading}>{d}</KeypadButton>
          ))}
          <KeypadButton variant="muted" onClick={back} disabled={loading || value.length === 0}>
            <Delete size={20} />
          </KeypadButton>
          <KeypadButton onClick={() => press('0')} disabled={loading}>0</KeypadButton>
          <KeypadButton variant="primary" onClick={onSubmit} disabled={loading || value.length < 4}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
          </KeypadButton>
        </div>
        <div className="px-6 pb-5 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/40">
            PIN เริ่มต้น 4567 · ตั้งใหม่ผ่าน env POS_PIN
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KeypadButton({
  children,
  onClick,
  disabled,
  variant = 'default',
  size = 'md',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'muted';
  size?: 'md' | 'lg';
}) {
  const palette = {
    default: { bg: '#fdfaf6', color: '#2d241e', shadow: 'rgba(124,84,60,0.08)' },
    primary: { bg: 'linear-gradient(135deg, #ea580c, #7c543c)', color: '#fff', shadow: 'rgba(234,88,12,0.30)' },
    muted: { bg: '#f1ebe3', color: '#7c543c', shadow: 'rgba(124,84,60,0.05)' },
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.90 }}
      onClick={onClick}
      disabled={disabled}
      className={`keypad-btn aspect-square rounded-2xl font-black flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none ${
        size === 'lg' ? 'text-3xl min-h-[56px]' : 'text-2xl min-h-[48px]'
      }`}
      style={{
        background: palette.bg,
        color: palette.color,
        boxShadow: `0 4px 14px ${palette.shadow}`,
      }}
    >
      {children}
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Role Selector Screen
// ════════════════════════════════════════════════════════════════════════════

const ROLES = [
  {
    id: 'MANAGER',
    label: 'ผู้จัดการสาขา',
    sub: 'Dashboard',
    desc: 'ภาพรวมยอดขาย, ประวัติออเดอร์, จัดการกะ/เงินสด',
    icon: BarChart3,
    color: '#7c543c',
    soft: 'rgba(124,84,60,0.14)',
  },
  {
    id: 'CASHIER',
    label: 'แคชเชียร์',
    sub: 'POS / สั่งอาหาร',
    desc: 'รับออเดอร์และชำระเงินสำหรับลูกค้าหน้าร้าน',
    icon: Store,
    color: '#10b981',
    soft: 'rgba(16,185,129,0.12)',
  },
  {
    id: 'BARISTA',
    label: 'บาริสต้า',
    sub: 'KDS / เครื่องดื่ม',
    desc: 'แสดงรายการและขั้นตอนเตรียมเครื่องดื่ม',
    icon: Coffee,
    color: '#f59e0b',
    soft: 'rgba(245,158,11,0.14)',
  },
  {
    id: 'QC',
    label: 'ตรวจคุณภาพ',
    sub: 'QC / Quality',
    desc: 'ตรวจรายการให้ถูกต้องครบก่อนส่งมอบ',
    icon: CheckSquare,
    color: '#3b82f6',
    soft: 'rgba(59,130,246,0.14)',
  },
  {
    id: 'DISPATCHER',
    label: 'ส่งมอบสินค้า',
    sub: 'Dispatch',
    desc: 'เรียกคิวลูกค้าและส่งมอบออเดอร์',
    icon: Truck,
    color: '#ea580c',
    soft: 'rgba(234,88,12,0.14)',
  },
  {
    id: 'QUEUE_MONITOR',
    label: 'จอแสดงคิว',
    sub: 'Customer display',
    desc: 'จอแสดงสถานะออเดอร์ให้ลูกค้าดู',
    icon: Bell,
    color: '#e11d48',
    soft: 'rgba(225,29,72,0.14)',
  },
  {
    id: 'CUSTOMER_DISPLAY',
    label: 'จอฝั่งลูกค้า',
    sub: 'QR / Payment',
    desc: 'แสดงคิวล่าสุด สถานะออเดอร์ และ QR ชำระเงินสำหรับลูกค้า',
    icon: QrCode,
    color: '#0891b2',
    soft: 'rgba(8,145,178,0.14)',
  },
  {
    id: 'STOCK_CHECK',
    label: 'นับสต็อก',
    sub: 'Stock count',
    desc: 'นับวัตถุดิบเปิด-ปิดร้านให้ตรงคลัง',
    icon: Boxes,
    color: '#6366f1',
    soft: 'rgba(99,102,241,0.14)',
  },
] as const;

function RoleSelectorScreen({
  branch,
  now,
  onPick,
  onSwitchBranch,
  ordersCount,
}: {
  branch: any;
  now: Date;
  onPick: (r: Role) => void;
  onSwitchBranch: () => void;
  ordersCount: number;
}) {
  const dateStr = now.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-[100dvh] relative overflow-x-hidden flex flex-col">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 0%, rgba(234,88,12,0.08) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(124,84,60,0.10) 0%, transparent 60%), linear-gradient(180deg, #fdfaf6 0%, #f4ebdc 100%)',
        }}
      />

      {/* Top bar — compact, full info on all breakpoints */}
      <header
        className="relative z-10 flex items-center justify-between gap-3"
        style={{ padding: 'max(1rem, calc(0.75rem + var(--sat))) 1.25rem 0.5rem' }}
      >
        {/* Branch info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
          >
            <Store className="text-white" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/70">Active Branch</p>
            <p className="text-sm font-black tracking-tight text-[#2d241e] truncate">{branch?.name || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Time — visible on all screens */}
          <div className="text-right mr-1 hidden xs:block sm:block">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 leading-tight">{dateStr}</p>
            <p className="text-sm font-black tracking-tight text-[#2d241e] leading-tight">{timeStr}</p>
          </div>
          {/* Switch branch */}
          <button
            onClick={onSwitchBranch}
            className="h-10 px-3 sm:px-4 rounded-2xl bg-white border border-[#e8e2db] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-[#7c543c] font-black text-[11px] uppercase tracking-widest inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">เปลี่ยนสาขา</span>
            <span className="sm:hidden">ออก</span>
          </button>
        </div>
      </header>

      {/* Hero — compact on mobile */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-10 pt-4 sm:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-white/80 backdrop-blur text-[11px] font-bold uppercase tracking-widest text-[#7c543c] shadow-sm border border-white">
            <Sparkles size={11} /> เลือกตำแหน่งงาน
          </span>
          <h1 className="mt-2 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#2d241e] leading-tight">
            สวัสดีตอนทำงาน <span className="text-[#ea580c]">·</span>{' '}
            <span className="text-[#7c543c]">เริ่มจากที่ไหนดี?</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm font-semibold text-[#7c543c]/80">
            แตะเลือกตำแหน่งงานที่คุณรับผิดชอบในรอบนี้ — สลับได้ตลอดเวลา
          </p>
          {/* Mini-stats */}
          <div className="mt-3 flex flex-wrap gap-2">
            <MiniBadge icon={<Bell size={11} />} label="คิวรอ" value={ordersCount.toString()} />
            <MiniBadge icon={<Users size={11} />} label="7 สถานี" />
            <MiniBadge icon={<Wifi size={11} />} label="Online" />
          </div>
        </motion.div>
      </section>

      {/* Role grid — 2 cols on mobile, 3 cols on lg */}
      <main
        className="relative z-10 flex-1 px-5 sm:px-8 lg:px-10 py-5 sm:py-8 scroll-smooth-y"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {ROLES.map((r, idx) => {
            const Icon = r.icon;
            return (
              <motion.button
                key={r.id}
                onClick={() => onPick(r.id as Role)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
                className="group relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl shadow-md shadow-amber-900/5 border text-left transition-all active:shadow-none"
                style={{ borderColor: 'rgba(232,226,219,0.7)' }}
              >
                {/* Glow on hover */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: r.soft, filter: 'blur(30px)' }}
                />

                {/* Mobile compact layout */}
                <div className="sm:hidden relative p-3.5">
                  <div className="flex items-start justify-between mb-2.5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow group-hover:rotate-3 transition-transform"
                      style={{ background: r.color }}
                    >
                      <Icon size={20} color="#fff" />
                    </div>
                    <span
                      className="inline-flex items-center px-1.5 h-5 rounded text-[9px] font-black uppercase tracking-wide"
                      style={{ background: r.soft, color: r.color }}
                    >
                      {r.sub.split('/')[0].trim()}
                    </span>
                  </div>
                  <h3 className="font-black text-[13px] text-[#2d241e] tracking-tight leading-tight mb-1">{r.label}</h3>
                  <div className="flex items-center gap-0.5" style={{ color: r.color }}>
                    <span className="text-[11px] font-black">เข้าใช้งาน</span>
                    <ChevronRight size={11} />
                  </div>
                </div>

                {/* Desktop full layout */}
                <div className="hidden sm:block relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-13 h-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-3 transition-transform"
                      style={{ background: r.color }}
                    >
                      <Icon size={24} color="#fff" />
                    </div>
                    <span
                      className="inline-flex items-center px-2 h-6 rounded-md text-[10px] font-black uppercase tracking-widest"
                      style={{ background: r.soft, color: r.color }}
                    >
                      {r.sub}
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-[#2d241e] tracking-tight mb-1.5">{r.label}</h3>
                  <p className="text-xs font-semibold text-[#7c543c]/70 leading-relaxed line-clamp-2 mb-4">{r.desc}</p>
                  <div className="flex items-center justify-between pt-3.5 border-t border-dashed border-[#e8e2db]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50">เปิดหน้าจอ</span>
                    <span className="inline-flex items-center gap-1 text-xs font-black group-hover:gap-2 transition-all" style={{ color: r.color }}>
                      เข้าใช้งาน <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50"
        style={{ padding: '0.5rem 1.25rem max(1rem, calc(0.5rem + var(--sab)))' }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Settings size={11} />Cloud sync
        </span>
        <span className="inline-flex items-center gap-1.5">
          <HelpCircle size={11} />Help center
        </span>
      </footer>
    </div>
  );
}

function MiniBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-white/80 backdrop-blur text-[11px] font-black uppercase tracking-widest text-[#7c543c] border border-white shadow-sm">
      {icon}
      {label}
      {value && (
        <span className="ml-1 px-1.5 h-4 inline-flex items-center rounded text-[10px] num bg-[#ea580c] text-white">
          {value}
        </span>
      )}
    </span>
  );
}
