import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, ArrowRight, Loader2, CheckCircle2, Coffee, ChevronLeft, ShieldCheck,
} from 'lucide-react';
import { auth } from '../api';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const LineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#06C755] shrink-0">
    <path d="M22 10.155c0-4.664-4.786-8.455-10.667-8.455S.667 5.491.667 10.155c0 4.181 3.8 7.679 8.94 8.351.348.074.82.23.94.526.108.261.07.671.034.935-.038.286-.182 1.139-.222 1.554-.056.58-.261 2.274 1.127 1.241 1.388-1.033 6.012-4.428 8.2-7.562 2.378-3.411 2.316-6.425 2.316-6.425zm-14.869 3.01H5.532a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377zm3.178 0h-1.599a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377zm3.178 0a.377.377 0 0 1-.377-.377v-2.311l-1.782-2.148c-.066-.08-.063-.198.006-.275l.135-.152a.377.377 0 0 1 .536-.006l1.305 1.573 1.305-1.573a.377.377 0 0 1 .536.006l.135.152a.377.377 0 0 1 .006.275L13.86 10.457v2.311a.377.377 0 0 1-.377.377zm3.178 0h-1.599a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377z" />
  </svg>
);

type Step = 'methods' | 'phone' | 'otp' | 'success';

export default function AuthModal({
  isOpen, onClose, onLoginSuccess,
}: { isOpen: boolean; onClose: () => void; onLoginSuccess: (user: any) => void }) {
  const [step, setStep] = useState<Step>('methods');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfigLoading(true);
      fetch(`${API}/settings`)
        .then((res) => res.json())
        .then((data) => setConfig(data))
        .catch((err) => console.error('Failed to load settings:', err))
        .finally(() => setConfigLoading(false));
    }
  }, [isOpen]);

  const reset = () => { setStep('methods'); setPhone(''); setOtp(''); setError(''); };
  const close = () => { reset(); onClose(); };

  const sendOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/otp/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) setStep('otp');
      else setError('ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่');
    } catch { setError('เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/otp/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      if (res.ok) {
        const user = await res.json();
        if (user.token) auth.setToken(user.token);
        setStep('success');
        setTimeout(() => { onLoginSuccess(user); close(); }, 1400);
      } else {
        setError('รหัส OTP ไม่ถูกต้อง');
      }
    } catch { setError('เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    const clientId = config['login.google.clientId'];
    if (!clientId) {
      setError('ไม่ได้ตั้งค่า Google Client ID ในระบบ');
      return;
    }
    setLoading(true);
    setError('');

    const initAndRequest = () => {
      try {
        const client = (window as any).google?.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (response: any) => {
            if (response.error) {
              setLoading(false);
              setError('Google Login ถูกยกเลิก');
              return;
            }
            try {
              const res = await fetch(`${API}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: response.access_token }),
              });
              if (res.ok) {
                const user = await res.json();
                if (user.token) auth.setToken(user.token);
                setStep('success');
                setTimeout(() => {
                  onLoginSuccess(user);
                  close();
                }, 1400);
              } else {
                setError('ไม่สามารถลงชื่อเข้าใช้งานด้วย Google ได้');
              }
            } catch {
              setError('เกิดข้อผิดพลาดในการเชื่อมต่อ Google');
            } finally {
              setLoading(false);
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการเรียกใช้ Google Login');
        setLoading(false);
      }
    };

    if (!(window as any).google?.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initAndRequest;
      document.head.appendChild(script);
    } else {
      initAndRequest();
    }
  };

  const handleLineLogin = async () => {
    try {
      const liffModule = await import('@line/liff');
      const targetLiff = liffModule.default;
      if (targetLiff.isInClient() || (window as any).liff?.id) {
        if (!targetLiff.isLoggedIn()) {
          targetLiff.login();
        }
      } else {
        // Fallback for browser/dev: mock LINE login
        setLoading(true);
        setError('');
        const res = await fetch(`${API}/auth/line`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUid: 'mock-line-uid-' + Math.floor(Math.random() * 1000000),
            displayName: 'Mock LINE User',
            pictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
            email: 'mock.line@example.com'
          })
        });
        if (res.ok) {
          const user = await res.json();
          if (user.token) auth.setToken(user.token);
          setStep('success');
          setTimeout(() => {
            onLoginSuccess(user);
            close();
          }, 1400);
        } else {
          setError('LINE Login จำลองล้มเหลว');
        }
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ LINE');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close}
          className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-paper rounded-t-[2rem] overflow-hidden shadow-deep"
        >
          <div className="pt-3 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-line" /></div>
          <div className="px-6 pt-3 pb-2 flex items-center justify-between">
            {step !== 'methods' && step !== 'success' ? (
              <button
                onClick={() => setStep(step === 'otp' ? 'phone' : 'methods')}
                className="w-10 h-10 rounded-2xl bg-white hairline flex items-center justify-center"
                aria-label="ย้อนกลับ"
              >
                <ChevronLeft size={18} className="ink" />
              </button>
            ) : <span className="w-10" />}
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-accent-deep">456 Coffee</span>
            <button
              onClick={close}
              className="w-10 h-10 rounded-2xl bg-white hairline flex items-center justify-center"
              aria-label="ปิด"
            >
              <X size={18} className="ink" />
            </button>
          </div>

          <div className="px-7 pt-2 pb-8">
            <AnimatePresence mode="wait">
              {step === 'methods' && (
                <motion.div key="methods" initial={{ x: 12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -12, opacity: 0 }}>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accent via-accent-deep to-sage mx-auto mb-4 flex items-center justify-center shadow-deep">
                      <Coffee size={28} className="text-white" />
                    </div>
                    <h2 className="font-extrabold text-[22px] ink leading-tight">เข้าสู่ระบบสมาชิก</h2>
                    <p className="text-[13px] ink-soft mt-1.5 leading-relaxed">
                      ยืนยันตัวตนเพื่อสะสมแต้มและติดตามคำสั่งซื้อ
                    </p>
                  </div>

                  {configLoading ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader2 className="animate-spin text-accent-deep" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {config['login.phone.enabled'] !== 'false' && (
                        <MethodButton
                          icon={<Phone size={20} className="text-accent-deep" />}
                          iconBg="bg-cream"
                          title="ใช้เบอร์โทรศัพท์"
                          sub="รับ OTP ทาง SMS"
                          onClick={() => setStep('phone')}
                          featured
                        />
                      )}
                      {config['login.google.enabled'] === 'true' && (
                        <MethodButton
                          icon={<GoogleIcon />}
                          iconBg="bg-white border border-line"
                          title="เข้าสู่ระบบด้วย Google"
                          sub="ใช้งานผ่านบัญชี Google"
                          onClick={handleGoogleLogin}
                        />
                      )}
                      {config['login.line.enabled'] === 'true' && (
                        <MethodButton
                          icon={<LineIcon />}
                          iconBg="bg-white border border-line"
                          title="เข้าสู่ระบบด้วย LINE"
                          sub="สะดวกและปลอดภัยผ่านแอป LINE"
                          onClick={handleLineLogin}
                        />
                      )}
                      {error && <p className="text-danger text-[12px] font-extrabold mt-3 text-center">{error}</p>}
                      <MethodButton
                        icon={<ShieldCheck size={20} className="text-sage" />}
                        iconBg="bg-sage-soft"
                        title="ข้อมูลปลอดภัย"
                        sub="ใช้เฉพาะสำหรับคำสั่งซื้อและแต้มสะสม"
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-center ink-mute mt-6 leading-relaxed">
                    เข้าใช้งานคือยอมรับ <span className="font-bold">เงื่อนไขการให้บริการ</span> และ <span className="font-bold">นโยบายความเป็นส่วนตัว</span>
                  </p>
                </motion.div>
              )}

              {step === 'phone' && (
                <motion.div key="phone" initial={{ x: 12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -12, opacity: 0 }}>
                  <h3 className="font-extrabold text-xl ink">ระบุเบอร์โทรศัพท์</h3>
                  <p className="text-[12px] ink-soft mt-1.5">เราจะส่งรหัส 6 หลักไปทาง SMS</p>

                  <div className="relative mt-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold ink text-sm pr-3 border-r border-line">
                      🇹🇭 +66
                    </span>
                    <input
                      autoFocus
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="08x-xxx-xxxx"
                      className="w-full bg-white hairline rounded-2xl h-14 pl-[88px] pr-4 font-extrabold text-base outline-none focus:shadow-glow"
                    />
                  </div>

                  {error && <p className="text-danger text-[12px] font-extrabold mt-3">{error}</p>}

                  <button
                    disabled={loading || phone.length < 9}
                    onClick={sendOtp}
                    className="w-full h-14 mt-6 rounded-2xl bg-accent text-ink font-extrabold pop-amber inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pop-shadow"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (<>รับรหัส OTP <ArrowRight size={18} /></>)}
                  </button>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div key="otp" initial={{ x: 12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -12, opacity: 0 }}>
                  <h3 className="font-extrabold text-xl ink">ยืนยันรหัส OTP</h3>
                  <p className="text-[12px] ink-soft mt-1.5">รหัสส่งไปที่ <span className="font-extrabold ink">{phone}</span></p>

                  <input
                    autoFocus
                    type="number"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="• • • • • •"
                    className="w-full mt-5 bg-white hairline rounded-2xl h-16 px-6 font-extrabold text-center text-3xl tracking-[0.5em] outline-none focus:shadow-glow"
                  />

                  {error && <p className="text-danger text-[12px] font-extrabold mt-3">{error}</p>}

                  <button
                    disabled={loading || otp.length !== 6}
                    onClick={verifyOtp}
                    className="w-full h-14 mt-6 rounded-2xl bg-accent text-ink font-extrabold pop-amber inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pop-shadow"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (<>ยืนยัน <CheckCircle2 size={18} /></>)}
                  </button>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="py-10 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-3xl bg-success-soft text-success flex items-center justify-center mb-5 shadow-deep">
                    <CheckCircle2 size={40} strokeWidth={2.4} />
                  </div>
                  <h3 className="font-extrabold text-2xl ink">ยินดีต้อนรับ!</h3>
                  <p className="text-[13px] ink-soft mt-2">เข้าสู่ระบบสำเร็จแล้ว</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function MethodButton({
  icon, iconBg, title, sub, onClick, featured,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  onClick?: () => void;
  featured?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={!onClick}
      className={[
        'w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all',
        featured
          ? 'bg-gradient-to-r from-accent-deep via-berry to-sage text-white shadow-deep'
          : 'bg-white hairline',
        !onClick ? 'cursor-default' : 'active:shadow-pop',
      ].join(' ')}
    >
      <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-[14px]">{title}</p>
        <p className={`text-[11px] mt-0.5 ${featured ? 'text-white/65' : 'ink-mute'}`}>{sub}</p>
      </div>
      {onClick && <ArrowRight size={16} className={featured ? 'text-white/65' : 'ink-mute'} />}
    </motion.button>
  );
}
