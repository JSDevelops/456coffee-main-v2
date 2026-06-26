import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Sun,
  Moon,
  LogOut,
  Edit2,
  Key,
  Bell,
  Activity,
  Calendar,
  Globe,
  Palette,
  Crown,
  Sparkles,
  AtSign,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, Skeleton, useToast } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { auth, api } from '../api';

interface ProfilePageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout: () => void;
}

interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
  branchId?: string;
}

interface AdminProfile {
  username: string;
  displayName: string;
  email: string;
  phone: string;
  hasCustomPassword: boolean;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function relativeFromNow(epoch?: number): string {
  if (!epoch) return '—';
  const diffMs = epoch * 1000 - Date.now();
  if (diffMs <= 0) return 'หมดอายุแล้ว';
  const days = Math.floor(diffMs / 86_400_000);
  if (days > 0) return `อีก ${days} วัน`;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours > 0) return `อีก ${hours} ชั่วโมง`;
  const mins = Math.floor(diffMs / 60_000);
  return `อีก ${mins} นาที`;
}

export default function ProfilePage({ theme, onToggleTheme, onLogout }: ProfilePageProps) {
  const toast = useToast();
  const [payload, setPayload] = useState<JwtPayload | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileModal, setProfileModal] = useState(false);
  const [pwModal, setPwModal] = useState(false);

  useEffect(() => {
    const token = auth.getToken();
    if (token) setPayload(decodeJwt(token));

    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<AdminProfile>('/auth/admin-profile');
        if (!cancelled) {
          setProfile(data);
          // Mirror to localStorage so the TopBar avatar uses the same name
          localStorage.setItem('admin.displayName', data.displayName);
          localStorage.setItem('admin.email', data.email);
          localStorage.setItem('admin.phone', data.phone);
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || 'โหลดโปรไฟล์ไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issuedAt = payload?.iat ? new Date(payload.iat * 1000) : null;
  const expiresAt = payload?.exp ? new Date(payload.exp * 1000) : null;

  const displayName = profile?.displayName || 'Super Admin';
  const email = profile?.email || '';
  const phone = profile?.phone || '';
  const username = profile?.username || 'admin';

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="โปรไฟล์ของคุณ"
        description="ข้อมูลบัญชีแอดมินและการตั้งค่าส่วนตัว"
      />

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card padded={false} className="overflow-hidden mb-6">
          <div
            className="relative px-6 sm:px-8 py-8 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 35%, #db2777 100%)',
              color: '#fff',
            }}
          >
            <div
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30"
              style={{ background: '#fcd34d', filter: 'blur(80px)' }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-30"
              style={{ background: '#a855f7', filter: 'blur(80px)' }}
            />
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-bold text-3xl sm:text-4xl shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.20)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.30)',
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="inline-flex items-center gap-1.5 mb-2 px-2.5 h-7 rounded-md text-xs font-bold backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.20)' }}
                >
                  <Crown size={12} />
                  Super Admin
                  <Sparkles size={11} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {loading ? '—' : displayName}
                </h2>
                <p className="text-sm opacity-90 mt-1">
                  {loading ? 'กำลังโหลด...' : email || `@${username}`}
                </p>
                {phone && <p className="text-sm opacity-90 num">{phone}</p>}
              </div>
              <Button
                variant="light"
                size="sm"
                leftIcon={<Edit2 size={14} />}
                onClick={() => setProfileModal(true)}
                disabled={loading}
                style={{ background: '#fff', color: 'var(--accent)' }}
              >
                แก้ไขโปรไฟล์
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Left column: account details + session */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Account details */}
          <Card padded>
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-base inline-flex items-center gap-2"
                style={{ color: 'var(--text)' }}
              >
                <UserIcon size={16} style={{ color: 'var(--accent)' }} />
                ข้อมูลบัญชี
              </h3>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Edit2 size={12} />}
                onClick={() => setProfileModal(true)}
                disabled={loading}
              >
                แก้ไข
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ProfileRow icon={<UserIcon size={13} />} label="ชื่อแสดง" value={displayName} />
                <ProfileRow
                  icon={<AtSign size={13} />}
                  label="ชื่อผู้ใช้ (login)"
                  value={username}
                  mono
                />
                <ProfileRow icon={<Mail size={13} />} label="อีเมล" value={email || '—'} />
                <ProfileRow icon={<Phone size={13} />} label="เบอร์โทร" value={phone || '—'} mono />
                <ProfileRow
                  icon={<Shield size={13} />}
                  label="บทบาท"
                  value="ADMIN"
                  tone="accent"
                />
                <ProfileRow
                  icon={<Key size={13} />}
                  label="JWT Subject"
                  value={payload?.sub || '—'}
                  mono
                />
              </div>
            )}
          </Card>

          {/* Session info */}
          <Card padded>
            <h3
              className="font-bold text-base mb-4 inline-flex items-center gap-2"
              style={{ color: 'var(--text)' }}
            >
              <Activity size={16} style={{ color: 'var(--accent)' }} />
              เซสชั่นปัจจุบัน
            </h3>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SessionStat
                  icon={<Calendar size={14} />}
                  label="เข้าสู่ระบบเมื่อ"
                  value={
                    issuedAt?.toLocaleString('th-TH', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) || '—'
                  }
                />
                <SessionStat
                  icon={<Key size={14} />}
                  label="โทเคนหมดอายุ"
                  value={relativeFromNow(payload?.exp)}
                  sub={expiresAt?.toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })}
                />
                <SessionStat
                  icon={<Globe size={14} />}
                  label="ตำแหน่ง / IP"
                  value="ตอนนี้"
                  sub="local development"
                />
              </div>
            )}
          </Card>

          {/* Security section */}
          <Card padded>
            <h3
              className="font-bold text-base mb-4 inline-flex items-center gap-2"
              style={{ color: 'var(--text)' }}
            >
              <Shield size={16} style={{ color: 'var(--accent)' }} />
              ความปลอดภัย
            </h3>
            <div className="space-y-2.5">
              <SecurityRow
                icon={<Key size={16} />}
                title="รหัสผ่าน"
                description={
                  profile?.hasCustomPassword
                    ? 'ตั้งรหัสผ่านที่กำหนดเองแล้ว'
                    : 'ยังใช้รหัสผ่านจาก env (.env) — แนะนำให้เปลี่ยนทันที'
                }
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Key size={12} />}
                    onClick={() => setPwModal(true)}
                    disabled={loading}
                  >
                    เปลี่ยน
                  </Button>
                }
                badge={
                  profile?.hasCustomPassword ? (
                    <Badge tone="success">ปลอดภัย</Badge>
                  ) : (
                    <Badge tone="warning">env-based</Badge>
                  )
                }
              />
              <SecurityRow
                icon={<Shield size={16} />}
                title="2-Factor Authentication"
                description="ยืนยันตัวตนเพิ่มเติมด้วย OTP"
                badge={<Badge tone="neutral">เร็ว ๆ นี้</Badge>}
              />
              <SecurityRow
                icon={<Activity size={16} />}
                title="Session ทั้งหมด"
                description="ดูและ revoke session ของอุปกรณ์อื่น"
                badge={<Badge tone="neutral">เร็ว ๆ นี้</Badge>}
              />
            </div>
          </Card>
        </div>

        {/* Right column: preferences + actions */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Quick prefs */}
          <Card padded>
            <h3
              className="font-bold text-base mb-4 inline-flex items-center gap-2"
              style={{ color: 'var(--text)' }}
            >
              <Palette size={16} style={{ color: 'var(--accent)' }} />
              ค่าตั้งส่วนตัว
            </h3>
            <div className="space-y-3">
              {/* Theme toggle */}
              <div
                className="rounded-xl p-3.5 flex items-center gap-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      theme === 'dark' ? 'rgba(99,102,241,0.18)' : 'rgba(245,158,11,0.18)',
                    color: theme === 'dark' ? '#818cf8' : '#f59e0b',
                  }}
                >
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    ธีม
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {theme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'}
                  </p>
                </div>
                <button
                  onClick={onToggleTheme}
                  className="h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  สลับเป็น {theme === 'dark' ? 'สว่าง' : 'มืด'}
                </button>
              </div>

              <PrefRow
                icon={<Globe size={16} />}
                title="ภาษา"
                value="ไทย"
                action={<Badge tone="neutral">เร็ว ๆ นี้</Badge>}
              />
              <PrefRow
                icon={<Bell size={16} />}
                title="การแจ้งเตือน"
                value="เปิด · เสียง · เด่น"
                action={<Badge tone="neutral">เร็ว ๆ นี้</Badge>}
              />
            </div>
          </Card>

          {/* Danger zone */}
          <Card padded>
            <h3
              className="font-bold text-base mb-4 inline-flex items-center gap-2"
              style={{ color: 'var(--danger)' }}
            >
              <LogOut size={16} />
              ออกจากระบบ
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              ออกจากเซสชั่นปัจจุบันบนเบราว์เซอร์นี้ — คุณจะต้อง login ใหม่ครั้งถัดไปที่เปิดระบบ
            </p>
            <Button
              variant="danger"
              leftIcon={<LogOut size={14} />}
              onClick={onLogout}
              className="w-full"
            >
              ออกจากระบบ
            </Button>
          </Card>
        </div>
      </div>

      {/* Edit profile modal */}
      {profileModal && profile && (
        <EditProfileModal
          initial={profile}
          onClose={() => setProfileModal(false)}
          onSaved={(updated) => {
            setProfile(updated);
            localStorage.setItem('admin.displayName', updated.displayName);
            localStorage.setItem('admin.email', updated.email);
            localStorage.setItem('admin.phone', updated.phone);
            setProfileModal(false);
            toast.success('บันทึกโปรไฟล์แล้ว');
          }}
          onError={(msg) => toast.error(msg)}
        />
      )}

      {/* Change password modal */}
      {pwModal && (
        <ChangePasswordModal
          hasCustomPassword={!!profile?.hasCustomPassword}
          onClose={() => setPwModal(false)}
          onSaved={() => {
            setPwModal(false);
            toast.success('เปลี่ยนรหัสผ่านเรียบร้อย');
            // Mark profile as having a custom password locally
            setProfile((p) => (p ? { ...p, hasCustomPassword: true } : p));
          }}
          onError={(msg) => toast.error(msg)}
        />
      )}
    </>
  );
}

// ─── Edit profile modal ───────────────────────────────────────────────────

function EditProfileModal({
  initial,
  onClose,
  onSaved,
  onError,
}: {
  initial: AdminProfile;
  onClose: () => void;
  onSaved: (next: AdminProfile) => void;
  onError: (msg: string) => void;
}) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [saving, setSaving] = useState(false);

  const dirty =
    displayName !== initial.displayName ||
    username.trim() !== initial.username ||
    email !== initial.email ||
    phone !== initial.phone;

  const submit = async () => {
    if (!username.trim()) {
      onError('ชื่อผู้ใช้ห้ามว่าง');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch<AdminProfile>('/auth/admin-profile', {
        username: username.trim(),
        displayName,
        email,
        phone,
      });
      onSaved(updated);
    } catch (e: any) {
      onError(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="แก้ไขโปรไฟล์"
      description="ข้อมูลนี้บันทึกที่เซิร์ฟเวอร์และใช้แสดงทั่วระบบ"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit} loading={saving} disabled={!dirty}>
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="ชื่อแสดง"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<UserIcon size={14} />}
          placeholder="เช่น Super Admin"
        />
        <Input
          label="ชื่อผู้ใช้สำหรับ login *"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          leftIcon={<AtSign size={14} />}
          placeholder="admin"
        />
        <Input
          label="อีเมล"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={14} />}
          placeholder="admin@example.com"
        />
        <Input
          label="เบอร์โทร"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone size={14} />}
          placeholder="08x-xxx-xxxx"
        />
      </div>
    </Modal>
  );
}

// ─── Change password modal ────────────────────────────────────────────────

function ChangePasswordModal({
  hasCustomPassword,
  onClose,
  onSaved,
  onError,
}: {
  hasCustomPassword: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const tooShort = next.length > 0 && next.length < 6;
  const mismatch = confirm.length > 0 && next !== confirm;
  const valid = current.length > 0 && next.length >= 6 && next === confirm;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await api.post('/auth/admin-change-password', {
        currentPassword: current,
        newPassword: next,
      });
      onSaved();
    } catch (e: any) {
      onError(e?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="เปลี่ยนรหัสผ่าน"
      description="ใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit} loading={saving} disabled={!valid}>
            ยืนยัน
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {!hasCustomPassword && (
          <div
            className="rounded-xl p-3 flex items-start gap-2.5 text-xs"
            style={{
              background: 'var(--warning-soft)',
              color: 'var(--warning)',
              border: '1px solid var(--border)',
            }}
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p>
              ตอนนี้คุณยังใช้รหัสผ่านจาก <code className="font-bold">.env</code> —
              ใส่ค่าจาก <code className="font-bold">ADMIN_PASSWORD</code> ในช่องรหัสผ่านปัจจุบัน
            </p>
          </div>
        )}
        <Input
          label="รหัสผ่านปัจจุบัน *"
          type={show ? 'text' : 'password'}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          leftIcon={<Key size={14} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />
        <Input
          label="รหัสผ่านใหม่ *"
          type={show ? 'text' : 'password'}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          leftIcon={<Key size={14} />}
          error={tooShort ? 'อย่างน้อย 6 ตัวอักษร' : undefined}
        />
        <Input
          label="ยืนยันรหัสผ่านใหม่ *"
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          leftIcon={<Key size={14} />}
          error={mismatch ? 'รหัสผ่านไม่ตรงกัน' : undefined}
          rightIcon={
            valid ? (
              <Check size={14} style={{ color: 'var(--success)' }} />
            ) : undefined
          }
        />
      </div>
    </Modal>
  );
}

// ─── Small layout pieces ──────────────────────────────────────────────────

function ProfileRow({
  icon,
  label,
  value,
  mono,
  fullWidth,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  fullWidth?: boolean;
  tone?: 'accent';
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
        className={`text-sm font-semibold truncate ${mono ? 'num' : ''}`}
        style={{ color: tone === 'accent' ? 'var(--accent)' : 'var(--text)' }}
      >
        {value}
      </p>
    </div>
  );
}

function SessionStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--accent)' }}>
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-bold num truncate" style={{ color: 'var(--text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SecurityRow({
  icon,
  title,
  description,
  action,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-3.5 flex items-center gap-3"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {title}
          </p>
          {badge}
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function PrefRow({
  icon,
  title,
  value,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  action: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-3.5 flex items-center gap-3"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
          {title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {value}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
