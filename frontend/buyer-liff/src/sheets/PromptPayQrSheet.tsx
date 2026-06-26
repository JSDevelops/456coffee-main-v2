import { motion } from 'framer-motion';
import { QrCode, X, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Order } from '../types';

export default function PromptPayQrSheet({
  order, onClose,
}: { order: Order; onClose: () => void }) {
  const qr = order.paymentQr;
  const [copied, setCopied] = useState(false);

  if (!qr) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qr.promptpayId || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-end sm:items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ y: 24, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 24, scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-md bg-paper rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-deep flex flex-col max-h-[92vh]"
      >
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-32 mesh-warm" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl glass flex items-center justify-center"
          aria-label="ปิด"
        >
          <X size={18} className="ink" />
        </button>

        <div className="relative px-6 pt-8 pb-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white text-accent-deep flex items-center justify-center mx-auto shadow-pop">
            <QrCode size={26} />
          </div>
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-accent mt-3">PromptPay</p>
          <h3 className="font-extrabold text-xl text-white mt-1">สแกนเพื่อชำระเงิน</h3>
          <p className="text-[12px] text-white/85 mt-1.5 leading-relaxed">
            ออเดอร์ <span className="font-extrabold">{order.orderNo}</span> จะยืนยันอัตโนมัติเมื่อตรวจพบยอดเงินเข้า
          </p>
        </div>

        <div className="relative flex-1 overflow-y-auto px-5 pb-6 no-scrollbar">
          {/* QR card */}
          <div className="bg-white hairline rounded-3xl p-5 shadow-deep">
            <div className="aspect-square rounded-2xl bg-paper flex items-center justify-center p-4 hairline">
              {qr.qrImageDataUrl ? (
                <img src={qr.qrImageDataUrl} alt="PromptPay QR" className="w-full h-full object-contain" />
              ) : (
                <Loader2 className="animate-spin ink-mute" size={28} />
              )}
            </div>

            <div className="mt-5 text-center">
              <p className="text-[10px] font-extrabold ink-mute tracking-[0.25em] uppercase">ยอดชำระ</p>
              <p className="font-extrabold text-3xl ink mt-1">฿{Number(order.totalAmount || 0).toLocaleString()}</p>
            </div>

            <div className="mt-5 pt-5 border-t border-hairline">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-extrabold ink-mute tracking-[0.2em] uppercase">บัญชีรับเงิน</p>
                  <p className="font-extrabold text-[13px] ink mt-1 break-words">{qr.promptpayName || 'PromptPay'}</p>
                  <p className="text-[12px] text-accent-deep font-extrabold break-all">{qr.promptpayId}</p>
                </div>
                <button
                  onClick={copy}
                  className="w-11 h-11 rounded-2xl bg-paper-dim flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="คัดลอก"
                >
                  {copied ? <Check size={16} className="text-success" /> : <Copy size={16} className="ink-soft" />}
                </button>
              </div>
            </div>
          </div>

          {/* Steps */}
          <ol className="mt-4 bg-white hairline rounded-3xl p-5 space-y-3">
            {[
              'เปิดแอปธนาคารของคุณ',
              'เลือก "สแกน QR" และสแกนรูปด้านบน',
              'ตรวจสอบยอดเงินและกดยืนยันการโอน',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cream text-accent-deep text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-px">
                  {i + 1}
                </span>
                <p className="text-[13px] ink leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-[11px] text-center ink-mute">
            หากยอดยังไม่อัปเดต ระบบจะตรวจสอบซ้ำให้อัตโนมัติ
          </p>
        </div>

        <div className="px-5 pt-3 pb-6 bg-white border-t border-hairline">
          <button
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-accent text-ink font-extrabold pop-amber"
          >
            ไปดูสถานะออเดอร์
          </button>
        </div>
      </motion.div>
    </div>
  );
}
