import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, MapPin, Gift, History, LogOut, ChevronRight, Receipt, Sparkles, Coffee,
} from 'lucide-react';
import { memberTier, type Member, type TabId } from '../types';
import PointHistorySheet from '../sheets/PointHistorySheet';

interface Props {
  member: Member | null;
  onNavigate: (t: TabId) => void;
  onOpenAddresses: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function ProfilePage({ member, onNavigate, onOpenAddresses, onOpenAuth, onLogout }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  const tier = useMemo(() => memberTier(member?.points || 0), [member?.points]);
  const points = member?.points || 0;
  const progress = Math.min(100, ((points - tier.min) / (tier.next - tier.min)) * 100);

  const isLoggedIn = !!member;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar buyer-shell-bg pb-32">
      {/* Hero */}
      <header className={`relative overflow-hidden px-6 pt-8 pb-24 ${tier.cls} text-white luxe-border rounded-b-[2rem]`}>
        <span className="aurora absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/16 blur-md" />
        <span className="aurora absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-md" />

        <p className="relative text-[9.5px] font-black tracking-[0.32em] uppercase text-[var(--gold-1)]">✦ My Profile</p>
        <div className="relative flex items-center gap-4 mt-3">
          <span className="relative">
            <span className="absolute -inset-[3px] rounded-[1.55rem] spin-slow opacity-90"
                  style={{ background: 'conic-gradient(from 90deg, #ffd166, #f43f7a, #8b5cf6, #14b8a6, #ffd166)' }} />
            {member?.pictureUrl ? (
              <img src={member.pictureUrl} alt="" className="relative w-16 h-16 rounded-2xl object-cover ring-2 ring-white/40" />
            ) : (
              <div className="relative w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center ring-2 ring-white/40">
                <User size={28} className="text-white" />
              </div>
            )}
          </span>
          <div>
            <h2 className="font-display font-extrabold text-2xl drop-shadow">{member?.name || member?.displayName || 'Guest'}</h2>
            <p className="text-[10.5px] opacity-90 mt-1 inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-[var(--gold-1)]" /> {tier.name} Member · Atelier
            </p>
          </div>
        </div>

        <Coffee size={150} className="absolute -right-8 -bottom-10 text-white/[0.08] rotate-12" />
      </header>

      {/* Member stat card (overlapping) */}
      <section className="-mt-14 px-5 space-y-3 relative z-10">
        <div className="luxe-border bg-white rounded-[1.9rem] p-5 shadow-deep">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[9.5px] font-black text-gold tracking-[0.28em] uppercase">✦ Points balance</p>
              <p className="font-display font-extrabold text-4xl ink mt-0.5 inline-flex items-baseline gap-1.5">
                <span className="text-gold">{points.toLocaleString()}</span>
                <span className="font-body text-sm ink-mute font-bold">แต้ม</span>
              </p>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="h-10 px-4 rounded-2xl text-white text-[10.5px] font-extrabold inline-flex items-center gap-1.5 shadow-rose"
              style={{ background: 'linear-gradient(135deg, #f43f7a, #8b5cf6)' }}
            >
              <Gift size={14} /> แลกแต้ม
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[9.5px] font-bold ink-mute mb-1.5">
              <span>{tier.name}</span>
              <span>{tier.next.toLocaleString()} แต้ม → ระดับถัดไป</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--paper-dim)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #c98315 0%, #f5b301 45%, #f43f7a 100%)' }}
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-hairline">
            <Stat label="ออเดอร์" value={String(member?.pointHistory?.filter(h => h.delta > 0).length || 0)} />
            <Stat label="ที่อยู่" value={String(member?.addresses?.length || 0)} />
            <Stat label="ระดับ" value={tier.name} />
          </div>
        </div>

        {/* Saved addresses summary */}
        <button
          onClick={onOpenAddresses}
          className="w-full bg-white hairline rounded-3xl p-5 flex items-center gap-4 active:shadow-pop transition-shadow text-left"
        >
          <div className="w-11 h-11 rounded-2xl bg-cream text-accent-deep flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9.5px] font-extrabold ink-mute tracking-[0.2em] uppercase">My addresses</p>
            <p className="font-extrabold text-[11.5px] ink mt-0.5 truncate">
              {member?.addresses?.length
                ? `${member.addresses.length} ที่อยู่`
                : 'ยังไม่มีที่อยู่ที่บันทึก'}
            </p>
          </div>
          <ChevronRight size={18} className="ink-mute" />
        </button>

        {/* Menu list */}
        <div className="bg-white hairline rounded-3xl overflow-hidden">
          <MenuRow icon={Receipt} label="ประวัติคำสั่งซื้อ"      onClick={() => onNavigate('orders')} />
          <Divider />
          <MenuRow icon={History} label="ประวัติการรับแต้ม"      onClick={() => setShowHistory(true)} />
        </div>

        {/* Auth action */}
        {isLoggedIn ? (
          <button
            onClick={onLogout}
            className="w-full h-14 rounded-3xl bg-[var(--danger-soft)] text-[var(--danger)] font-extrabold inline-flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full h-14 rounded-3xl text-ink font-extrabold pop-amber inline-flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #ffd166 0%, #f5b301 50%, #ff9b1c 100%)' }}
          >
            ✦ เข้าสู่ระบบ / สมัครสมาชิก
          </button>
        )}
      </section>

      <PointHistorySheet open={showHistory} onClose={() => setShowHistory(false)} member={member} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-extrabold text-base ink">{value}</p>
      <p className="text-[9.5px] ink-mute font-bold tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function MenuRow({
  icon: Icon, label, sub, onClick,
}: { icon: React.ComponentType<{ size?: number }>; label: string; sub?: string; onClick?: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full px-5 py-4 flex items-center gap-4 text-left active:bg-paper-dim transition-colors"
    >
      <div className="w-10 h-10 rounded-2xl bg-cream text-accent-deep flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="font-extrabold text-[11.5px] ink">{label}</p>
        {sub && <p className="text-[10.5px] ink-mute font-bold mt-0.5">{sub}</p>}
      </div>
      <ChevronRight size={16} className="ink-mute" />
    </motion.button>
  );
}

function Divider() { return <div className="h-px bg-hairline mx-5" />; }
