import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Coffee,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { API_BASE, auth } from '../api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      const { token } = await res.json();
      if (!token) throw new Error('ไม่ได้รับ token จากเซิร์ฟเวอร์');
      auth.setToken(token);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3eee4] text-[#1d1915]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(193,121,53,.25),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(35,96,83,.18),transparent_28%),linear-gradient(135deg,#f8f2e8_0%,#eee4d4_48%,#e5eee8_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(43,32,23,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(43,32,23,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d28a43]/20 blur-3xl" />

      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[29rem]"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-[#1f4d43] text-[#f7d08a] shadow-[0_18px_45px_rgba(31,77,67,.26)]">
              <Coffee size={25} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#976536]">
                456 Coffee
              </p>
              <p className="text-lg font-black tracking-tight text-[#1d1915]">Admin Console</p>
            </div>
          </div>

          <div className="rounded-[2.15rem] border border-white/70 bg-white/72 p-6 shadow-[0_30px_90px_rgba(58,42,25,.18)] backdrop-blur-2xl sm:p-8">
            <div className="mb-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfc7a8] bg-[#fff8ea] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#8a572b]">
                <ShieldCheck size={14} />
                Secure access
              </div>
              <h1 className="text-4xl font-black leading-none tracking-[-0.045em] text-[#191611] sm:text-5xl">
                เข้าสู่ระบบ
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#76695b]">
                สำหรับผู้ดูแลระบบ 456 Coffee เพื่อจัดการร้าน รายงาน เมนู สต็อก และสาขา
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-[#8a572b]">
                  ชื่อผู้ใช้
                </span>
                <div className="group flex h-14 items-center gap-3 rounded-2xl border border-[#e3d2ba] bg-[#fffdf8] px-4 shadow-sm transition focus-within:border-[#1f4d43] focus-within:ring-4 focus-within:ring-[#1f4d43]/10">
                  <UserRound size={19} className="text-[#9a856f]" />
                  <input
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="h-full min-w-0 flex-1 bg-transparent text-base font-bold text-[#1d1915] outline-none placeholder:text-[#b7a897]"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-[#8a572b]">
                  รหัสผ่าน
                </span>
                <div className="group flex h-14 items-center gap-3 rounded-2xl border border-[#e3d2ba] bg-[#fffdf8] px-4 shadow-sm transition focus-within:border-[#1f4d43] focus-within:ring-4 focus-within:ring-[#1f4d43]/10">
                  <LockKeyhole size={19} className="text-[#9a856f]" />
                  <input
                    autoComplete="current-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="h-full min-w-0 flex-1 bg-transparent text-base font-bold text-[#1d1915] outline-none placeholder:text-[#b7a897]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8b7a68] transition hover:bg-[#efe4d3] hover:text-[#1d1915]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-2xl border border-[#f1b8a8] bg-[#fff0ec] px-4 py-3 text-sm font-bold text-[#a43d25]"
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1f4d43] px-5 text-base font-black text-[#fff8e9] shadow-[0_20px_46px_rgba(31,77,67,.28)] transition hover:bg-[#173f37] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบหลังบ้าน'}
                {!loading && (
                  <ArrowRight
                    size={19}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  auth.setToken('demo-admin-token');
                  onLoginSuccess();
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d5a068] bg-[#fffbf2] text-sm font-black text-[#965a25] transition hover:bg-[#faebd7] active:scale-[0.985]"
              >
                <span>⚡ เข้าดูเดโมระบบ Super Admin (ไม่ต้องใช้รหัส)</span>
              </button>
            </form>

            <div className="mt-6 border-t border-[#ebdfcc] pt-5">
              <p className="text-xs font-bold text-[#8a7662] mb-2.5">
                💡 บุคคลทั่วไปที่สนใจเรียนหรือจองต้นพันธุ์ (ไม่ต้องล็อกอิน):
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href="https://coffee-cafe.shop/#academy"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f5ede0] hover:bg-[#ebdcc8] text-[#6d461f] font-bold transition-colors"
                >
                  ☕ หลักสูตร Academy
                </a>
                <a
                  href="https://coffee-cafe.shop/#plantations"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#e6f3ee] hover:bg-[#d0e8dd] text-[#1f5c49] font-bold transition-colors"
                >
                  🌱 จองต้นพันธุ์กาแฟ
                </a>
                <a
                  href="https://coffee-cafe.shop/#map"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#edf1f7] hover:bg-[#dbe4f1] text-[#2c4d75] font-bold transition-colors"
                >
                  📍 แผนที่ปักหมุด
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 hidden min-h-[42rem] lg:block"
        >
          <div className="absolute inset-0 rounded-[3rem] bg-[#1d1915] shadow-[0_38px_110px_rgba(38,25,13,.28)]" />
          <div className="absolute inset-0 overflow-hidden rounded-[3rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(247,208,138,.26),transparent_28%),radial-gradient(circle_at_74%_32%,rgba(55,124,106,.36),transparent_30%),linear-gradient(145deg,#2c2018_0%,#17130f_58%,#123d35_100%)]" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute bottom-20 left-12 h-36 w-36 rounded-full border border-white/10" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="relative flex h-full min-h-[42rem] flex-col justify-between p-10 text-[#fff9ed]">
            <div>
              <div className="mb-20 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#f7d08a] backdrop-blur">
                Operations dashboard
              </div>
              <h2 className="max-w-xl text-6xl font-black leading-[0.96] tracking-[-0.07em]">
                คุมทุกอย่างของร้านในหน้าจอเดียว
              </h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-white/68">
                ระบบหลังบ้านสำหรับยอดขาย ออเดอร์ เมนู สต็อก สาขา และพนักงาน ออกแบบให้ข้อมูลชัดและทำงานเร็ว
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['Live Orders', 'Real-time'],
                ['Inventory', 'Stock flow'],
                ['Reports', 'Revenue'],
              ].map(([title, caption]) => (
                <div
                  key={title}
                  className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-sm font-black">{title}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/45">
                    {caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
