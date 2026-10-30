import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, Coffee, Receipt, ClipboardList, ChevronRight, CheckCircle2, Clock, Package, MapPin, QrCode, Banknote,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Skeleton, EmptyState, Badge } from '../components/ui/Primitives';
import TopBar, { BackButton, IconButton } from '../components/TopBar';
import { getCached, setCached } from '../lib/cache';
import { STATUS_CFG, TONE_BG, type Order } from '../types';
import { API_BASE as API, SOCKET_URL } from '../api';

const STEPS = [
  { key: 'PENDING',   label: 'รับออเดอร์',    icon: Receipt },
  { key: 'PAID',      label: 'ชำระแล้ว',     icon: CheckCircle2 },
  { key: 'PREPARING', label: 'กำลังชง',      icon: Coffee },
  { key: 'READY',     label: 'พร้อมรับ',     icon: Package },
  { key: 'COMPLETED', label: 'เสร็จสิ้น',    icon: CheckCircle2 },
];

interface Props {
  customerUid: string;
}

export default function OrdersPage({ customerUid }: Props) {
  const cacheKey = `${API}/orders/customer/${customerUid}`;
  const [orders, setOrders] = useState<Order[]>(() => getCached<Order[]>(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => !getCached<Order[]>(cacheKey));
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(() => {
    fetch(cacheKey)
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setCached(cacheKey, arr);
        setOrders(arr);
      })
      .finally(() => setLoading(false));
  }, [cacheKey]);

  useEffect(() => {
    fetchOrders();
    if (!customerUid || customerUid === 'walk-in') return;

    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('authToken') || '' } });
    socket.on('connect', () => socket.emit('join-customer', customerUid));
    socket.on('new-order', (o: any) => {
      if (o?.customerUid !== customerUid) return;
      setOrders((prev) => {
        const next = [o, ...prev];
        setCached(cacheKey, next);
        return next;
      });
    });
    socket.on('update-order', (o: any) => {
      if (o?.customerUid !== customerUid) return;
      setOrders((prev) => {
        const next = prev.map((p) => (p.id === o.id ? { ...p, ...o } : p));
        setCached(cacheKey, next);
        return next;
      });
      setSelected((prev) => (prev && prev.id === o.id ? { ...prev, ...o } : prev));
    });
    // Light fallback poll every 2 minutes (socket should keep things current).
    const fallback = setInterval(fetchOrders, 120_000);
    return () => { socket.disconnect(); clearInterval(fallback); };
  }, [fetchOrders, customerUid, cacheKey]);

  if (selected) {
    return <OrderDetail order={selected} onBack={() => setSelected(null)} />;
  }

  const active = orders.filter((o) => ['PENDING', 'PAID', 'PREPARING', 'READY'].includes(o.status));
  const past   = orders.filter((o) => !active.includes(o));

  return (
    <div className="flex-1 flex flex-col overflow-hidden buyer-shell-bg">
      <TopBar
        variant="paper"
        kicker="✦ My Orders"
        title="คำสั่งซื้อ"
        trailing={
          <IconButton onClick={fetchOrders} label="โหลดใหม่">
            <RefreshCw size={18} />
          </IconButton>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-32 no-scrollbar space-y-6">
        {loading && orders.length === 0 ? (
          <div className="space-y-3 mt-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ClipboardList size={32} />} title="ยังไม่มีคำสั่งซื้อ" body="เมื่อคุณสั่งเครื่องดื่ม สถานะจะปรากฏที่นี่" />
        ) : (
          <>
            {active.length > 0 && (
              <Section title="กำลังดำเนินการ" count={active.length}>
                {active.map((o) => <ActiveOrderCard key={o.id} order={o} onOpen={() => setSelected(o)} />)}
              </Section>
            )}
            {past.length > 0 && (
              <Section title="ประวัติออเดอร์" count={past.length}>
                {past.map((o) => <PastOrderCard key={o.id} order={o} onOpen={() => setSelected(o)} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[9.5px] font-extrabold ink-mute tracking-[0.25em] uppercase mb-3">{title} · {count}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function getEstimatedWaitMinutes(order: Order): number {
  if (order.status === 'PREPARING') return 3;
  const q = order.queueNo || 1;
  return Math.max(3, Math.min(25, ((q - 1) % 7 + 1) * 3));
}

function ActiveOrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const cfg = STATUS_CFG[order.status];
  const stepIdx = Math.max(0, cfg?.step ?? 0);
  const totalSteps = STEPS.length;
  const isWaiting = ['PENDING', 'PAID', 'PREPARING'].includes(order.status);
  const estMins = getEstimatedWaitMinutes(order);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      layout
      className="w-full text-left bg-white hairline rounded-3xl p-5 shadow-soft active:shadow-pop transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[9.5px] font-bold text-accent-deep tracking-[0.2em] uppercase">{order.orderNo}</p>
          <p className="font-extrabold text-3xl ink mt-0.5 inline-flex items-baseline gap-1">
            <span className="text-accent-deep">#</span>
            {order.queueNo ?? '—'}
          </p>
        </div>
        <Badge className={`${TONE_BG[cfg?.tone || 'gray']} ${order.status === 'READY' ? 'pulse-ring' : ''}`}>
          {cfg?.label || order.status}
        </Badge>
      </div>

      {/* Step progress */}
      {order.status !== 'CANCELLED' && (
        <div className="flex gap-1.5 mt-1 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                i <= stepIdx ? 'bg-accent' : 'bg-paper-dim'
              }`}
            />
          ))}
        </div>
      )}

      {/* Estimated Wait Time Badge */}
      {isWaiting && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 text-amber-800">
          <Clock size={13} className="text-amber-600 animate-pulse shrink-0" />
          <span className="text-[10.5px] font-extrabold">
            รอประมาณ ~{estMins} นาที
          </span>
          <span className="ml-auto text-[9.5px] font-bold text-amber-700/80">
            {order.status === 'PREPARING' ? 'กำลังชงแก้วของคุณ' : `คิวที่ #${order.queueNo ?? '—'}`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px]">
        <p className="ink-soft truncate flex-1 mr-3 font-bold">
          {order.items?.slice(0, 2).map((i: any) => i.productName || i.product?.name).filter(Boolean).join(', ')}
          {(order.items?.length || 0) > 2 ? ` +${order.items.length - 2}` : ''}
        </p>
        <span className="font-extrabold ink">฿{order.totalAmount}</span>
      </div>

      {order.status === 'READY' && (
        <p className="mt-3 text-[10.5px] font-extrabold text-success inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success pulse-ring" />
          พร้อมรับที่ร้านแล้ว!
        </p>
      )}
      <span className="block text-[9.5px] ink-mute font-bold mt-2">
        {timeAgo(order.createdAt)} · ขั้นตอนที่ {stepIdx + 1}/{totalSteps}
      </span>
    </motion.button>
  );
}

function PastOrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const cfg = STATUS_CFG[order.status];
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="w-full bg-white hairline rounded-2xl p-4 flex items-center gap-4 text-left active:shadow-pop transition-shadow"
    >
      <div className="w-12 h-12 rounded-2xl bg-paper-dim text-ink-soft flex items-center justify-center shrink-0">
        <Receipt size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-extrabold text-[11px] ink">{order.orderNo}</p>
          <Badge className={TONE_BG[cfg?.tone || 'gray']}>{cfg?.label || order.status}</Badge>
        </div>
        <p className="text-[10.5px] ink-mute truncate">
          {order.items?.slice(0, 2).map((i: any) => i.productName || i.product?.name).filter(Boolean).join(', ')}
        </p>
        <p className="text-[9.5px] ink-mute font-bold mt-1">{new Date(order.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-[12.5px] ink">฿{order.totalAmount}</p>
      </div>
      <ChevronRight size={16} className="ink-mute shrink-0" />
    </motion.button>
  );
}

/* ── Order detail screen with vertical timeline ── */
function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const cfg = STATUS_CFG[order.status];
  const stepIdx = Math.max(0, cfg?.step ?? 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden buyer-shell-bg">
      <TopBar
        variant="glass"
        sticky
        title="รายละเอียดออเดอร์"
        subtitle={order.orderNo}
        leading={<BackButton onClick={onBack} />}
      />

      <div className="flex-1 overflow-y-auto px-5 pb-32 no-scrollbar space-y-4">
        {/* Hero status */}
        <div className="rounded-[1.8rem] p-6 mesh-warm text-white shadow-deep relative overflow-hidden luxe-border">
          <span className="aurora absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-md" />
          <p className="relative text-[9.5px] font-black tracking-[0.32em] uppercase text-[var(--gold-1)]">✦ คิวที่</p>
          <p className="font-display relative font-extrabold text-7xl leading-none mt-1 drop-shadow">#{order.queueNo ?? '—'}</p>
          <p className="relative mt-4 inline-flex items-center gap-2 text-[11px] font-extrabold bg-white/18 ring-1 ring-white/24 px-3 py-1.5 rounded-full backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-[var(--gold-1)] pulse-ring" />
            {cfg?.label || order.status}
          </p>

          {['PENDING', 'PAID', 'PREPARING'].includes(order.status) && (
            <div className="relative mt-4 flex items-center gap-2.5 rounded-2xl bg-white/16 p-3 ring-1 ring-white/25 backdrop-blur">
              <Clock size={18} className="text-[var(--gold-1)] animate-pulse shrink-0" />
              <div>
                <p className="text-[12px] font-extrabold text-white">
                  รอประมาณ ~{getEstimatedWaitMinutes(order)} นาที
                </p>
                <p className="text-[10px] font-medium text-white/80">
                  {order.status === 'PREPARING' ? 'บาริสต้ากำลังรังสรรค์แก้วของคุณ' : 'รอคิวเตรียมเครื่องดื่ม'}
                </p>
              </div>
            </div>
          )}

          <Coffee size={140} className="absolute -right-4 -bottom-6 text-white/[0.07] rotate-12" />
        </div>

        {/* Vertical timeline */}
        {order.status !== 'CANCELLED' && (
          <div className="bg-white hairline rounded-3xl p-5">
            <p className="text-[9.5px] font-extrabold ink-mute tracking-[0.25em] uppercase mb-4">สถานะการเตรียม</p>
            <div className="relative pl-9">
              <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-paper-dim" />
              <div
                className="absolute left-3.5 top-2 w-0.5 bg-accent transition-all duration-700"
                style={{ height: `${(stepIdx / (STEPS.length - 1)) * 100}%` }}
              />
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i <= stepIdx;
                const current = i === stepIdx;
                return (
                  <div key={s.key} className="relative pb-5 last:pb-0">
                    <div
                      className={`absolute -left-9 top-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        done ? 'bg-accent text-ink shadow-pop' : 'bg-paper-dim ink-mute'
                      } ${current ? 'pulse-ring' : ''}`}
                    >
                      <Icon size={13} strokeWidth={2.6} />
                    </div>
                    <p className={`font-extrabold text-[11.5px] ${done ? 'ink' : 'ink-mute'}`}>{s.label}</p>
                    {current && (
                      <p className="text-[10.5px] ink-mute mt-0.5">กำลังดำเนินการ...</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white hairline rounded-3xl p-5">
          <p className="text-[9.5px] font-extrabold ink-mute tracking-[0.25em] uppercase mb-4">
            รายการ ({order.items?.length || 0})
          </p>
          <div className="space-y-4">
            {order.items?.map((it: any, i: number) => {
              let opts: any[] = [];
              try { opts = JSON.parse(it.selectedOptions || '[]'); } catch {}
              return (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[11.5px] ink">
                      {it.productName || it.product?.name}
                      <span className="ml-2 ink-mute font-bold">×{it.quantity}</span>
                    </p>
                    {opts.length > 0 && (
                      <p className="text-[10.5px] ink-mute mt-0.5 truncate">
                        {opts.map((o: any) => o.label).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="font-extrabold text-[11.5px] ink shrink-0">฿{it.price}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-hairline flex items-center justify-between font-extrabold text-base ink">
            <span>ยอดรวม</span>
            <span>฿{order.totalAmount}</span>
          </div>
        </div>

        {/* Branch & payment summary */}
        {order.branch && (
          <div className="bg-white hairline rounded-3xl p-5 space-y-4">
            <p className="text-[9.5px] font-extrabold ink-mute tracking-[0.25em] uppercase">รายละเอียด</p>
            <SummaryLine icon={<MapPin size={14} />} label="สาขา" value={order.branch.name} />
            {order.payment?.method && (
              <SummaryLine
                icon={order.payment.method === 'QR' ? <QrCode size={14} /> : <Banknote size={14} />}
                label="ชำระเงิน"
                value={order.payment.method === 'QR' ? 'พร้อมเพย์' : 'เงินสด'}
              />
            )}
            <SummaryLine icon={<Clock size={14} />} label="สั่งเมื่อ" value={new Date(order.createdAt).toLocaleString('th-TH')} />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-paper-dim text-ink-soft flex items-center justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[9.5px] font-bold ink-mute tracking-[0.2em] uppercase">{label}</p>
        <p className="text-[11px] font-extrabold ink truncate">{value}</p>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

