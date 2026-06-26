import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Lock, CheckCircle2, AlertTriangle, Delete, ArrowLeft, LogIn, LogOut, Clock } from 'lucide-react';
import { API_BASE } from '../../api';

export default function MobileAttendanceView() {
  const query = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const branchId = query.get('branchId');

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Success state holding response info
  const [successInfo, setSuccessInfo] = useState<{
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    staffName: string;
    time: string;
  } | null>(null);

  // Clear success screen after a timeout
  useEffect(() => {
    if (successInfo) {
      const timer = setTimeout(() => {
        setSuccessInfo(null);
        setPin('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successInfo]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setError('');
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!branchId) {
      setError('ไม่พบรหัสสาขา กรุณาสแกนคิวอาร์โค้ดจากเครื่องหน้าร้าน');
      return;
    }
    if (pin.length < 4) {
      setError('กรุณากรอกรหัสผ่านอย่างน้อย 4 หลัก');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/hr/public/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, pin }),
      });

      if (res.ok) {
        const data = await res.json();
        const localTime = new Date(data.time).toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setSuccessInfo({
          type: data.type,
          staffName: data.staffName,
          time: localTime,
        });
      } else {
        const body = await res.json();
        setError(body?.message || 'รหัสพนักงานไม่ถูกต้อง');
        setPin('');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger submit automatically if PIN is 6 digits (or wait for manual tap)
  useEffect(() => {
    if (pin.length === 6) {
      handleSubmit();
    }
  }, [pin]);

  if (!branchId) {
    return (
      <div className="min-h-screen bg-[#2d241e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle size={48} className="text-amber-500" />
        <h2 className="text-xl font-black">ไม่พบข้อมูลสาขา</h2>
        <p className="text-xs text-gray-400 max-w-xs">
          กรุณาสแกนคิวอาร์โค้ดที่แสดงอยู่ในหน้าตารางงานของร้านค้า เพื่อเข้าสู่ระบบลงเวลาทำงาน
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2d241e] text-white flex flex-col justify-between p-6 select-none relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#7c543c]/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-[#ea580c]/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="text-center pt-8 space-y-2 z-10">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-lg backdrop-blur-md">
          <Coffee size={28} className="text-amber-500" />
        </div>
        <h1 className="text-lg font-black tracking-wider uppercase text-amber-500">456 Coffee</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          ระบบลงเวลาเข้า-ออกงาน (Attendance)
        </p>
      </div>

      {/* PIN entry container */}
      <div className="my-auto py-6 flex flex-col items-center space-y-6 z-10">
        {/* Passcode dots */}
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2, 3, 4, 5].map(idx => {
            const hasChar = pin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={hasChar ? { scale: 1.15 } : { scale: 1 }}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  hasChar 
                    ? 'bg-amber-500 border-amber-500 shadow-md shadow-amber-500/50' 
                    : 'bg-transparent border-gray-500'
                }`}
              />
            );
          })}
        </div>

        {/* Error Alert */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs font-bold text-rose-500 flex items-center gap-1.5"
              >
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleKeyPress(val)}
              className="w-16 h-16 rounded-full bg-white/5 border border-white/5 text-lg font-bold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all outline-none"
            >
              {val}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="w-16 h-16 text-xs font-black uppercase text-gray-400 hover:text-white flex items-center justify-center outline-none active:scale-95 transition-transform"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/5 text-lg font-bold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all outline-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-16 text-gray-400 hover:text-white flex items-center justify-center outline-none active:scale-95 transition-transform"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Submit button for manual override */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || pin.length < 4}
          className="w-full max-w-[280px] h-12 bg-amber-500 text-[#2d241e] font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {submitting ? 'กำลังบันทึก...' : 'บันทึกเวลาทำงาน'}
        </button>
      </div>

      {/* Footer info */}
      <div className="text-center pb-6 text-[9px] text-gray-500 font-bold z-10 flex items-center justify-center gap-1">
        <Lock size={10} /> การเชื่อมต่อเข้ารหัสและปลอดภัย
      </div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {successInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2d241e] z-50 flex flex-col items-center justify-center p-6 text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${
                successInfo.type === 'CLOCK_IN' 
                  ? 'bg-emerald-500 shadow-emerald-500/20' 
                  : 'bg-blue-500 shadow-blue-500/20'
              }`}
            >
              {successInfo.type === 'CLOCK_IN' ? (
                <LogIn size={48} className="text-white animate-pulse" />
              ) : (
                <LogOut size={48} className="text-white animate-pulse" />
              )}
            </motion.div>

            <div className="space-y-2">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                successInfo.type === 'CLOCK_IN'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
                {successInfo.type === 'CLOCK_IN' ? 'เข้างาน (CLOCK IN)' : 'ออกงาน (CLOCK OUT)'}
              </span>
              <h2 className="text-2xl font-black">{successInfo.staffName}</h2>
              <p className="text-sm text-gray-400">บันทึกเวลาสำเร็จเรียบร้อยแล้ว</p>
            </div>

            <div className="bg-white/5 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-2 font-bold num text-lg text-amber-500">
              <Clock size={20} />
              {successInfo.time} น.
            </div>

            <p className="text-[10px] text-gray-500">
              หน้านี้จะปิดอัตโนมัติภายใน 5 วินาที
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
