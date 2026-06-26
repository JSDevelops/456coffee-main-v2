import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, Briefcase, CheckCircle2, Clock, Home, Loader2, MapPin, Plus, QrCode, Truck, X,
} from 'lucide-react';
import type { Branch, CartItem, MemberAddress } from '../types';

const labelIcon = (label: string) =>
  label === 'Home' ? <Home size={16} /> : label === 'Office' ? <Briefcase size={16} /> : <MapPin size={16} />;

interface Props {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  selectedBranch: Branch | null;
  selectedAddress: MemberAddress | null;
  onPickAddress: () => void;
  onCheckout: (params: {
    method: 'QR' | 'CASH';
    fulfillType: 'PICKUP' | 'DELIVERY';
    note: string;
    address?: string;
  }) => Promise<void>;
}

export default function CheckoutSheet({
  open, onClose, cart, selectedBranch, selectedAddress, onPickAddress, onCheckout,
}: Props) {
  const [payMethod, setPayMethod] = useState<'QR' | 'CASH'>('QR');
  const [fulfillType, setFulfillType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.unitTotal, 0);
  const fee = fulfillType === 'DELIVERY' ? 20 : 0;
  const total = subtotal + fee;
  const earnPoints = Math.floor(total / 10);

  const handleSubmit = async () => {
    if (!selectedBranch) return;
    if (fulfillType === 'DELIVERY' && !selectedAddress) {
      onPickAddress();
      return;
    }
    setBusy(true);
    try {
      await onCheckout({
        method: payMethod,
        fulfillType,
        note,
        address: selectedAddress?.address,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-paper rounded-t-[2rem] max-h-[92vh] flex flex-col shadow-deep"
          >
            <div className="pt-3 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-line" /></div>
            <div className="px-6 pt-4 pb-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent-deep">Checkout</p>
                <h3 className="font-extrabold text-xl ink mt-0.5">ดำเนินการสั่งซื้อ</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white hairline flex items-center justify-center">
                <X size={18} className="ink" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar space-y-6">
              {/* Fulfillment toggle */}
              <section>
                <Label>วิธีรับสินค้า</Label>
                <div className="bg-white hairline rounded-2xl p-1 grid grid-cols-2 gap-1">
                  <ToggleOption
                    icon={<Clock size={16} />}
                    title="รับที่ร้าน"
                    active={fulfillType === 'PICKUP'}
                    onClick={() => setFulfillType('PICKUP')}
                  />
                  <ToggleOption
                    icon={<Truck size={16} />}
                    title="จัดส่ง +฿20"
                    active={fulfillType === 'DELIVERY'}
                    onClick={() => setFulfillType('DELIVERY')}
                  />
                </div>

                {fulfillType === 'DELIVERY' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3"
                  >
                    {selectedAddress ? (
                      <button
                        onClick={onPickAddress}
                        className="w-full bg-white hairline rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-cream text-accent-deep flex items-center justify-center">
                          {labelIcon(selectedAddress.label)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-[12px] uppercase ink">{selectedAddress.label}</p>
                          <p className="text-[11px] ink-mute truncate">{selectedAddress.address}</p>
                        </div>
                        <span className="text-[11px] font-extrabold text-accent-deep">เปลี่ยน</span>
                      </button>
                    ) : (
                      <button
                        onClick={onPickAddress}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-line text-[13px] font-extrabold ink-soft inline-flex items-center justify-center gap-2"
                      >
                        <Plus size={16} strokeWidth={2.6} /> เลือก / เพิ่มที่อยู่จัดส่ง
                      </button>
                    )}
                  </motion.div>
                )}
              </section>

              {/* Branch */}
              <section>
                <Label>สาขา</Label>
                <div className="bg-white hairline rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cream text-accent-deep flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-[13px] ink">{selectedBranch?.name || 'ยังไม่ได้เลือกสาขา'}</p>
                    <p className="text-[11px] ink-mute truncate">{selectedBranch?.address}</p>
                  </div>
                </div>
              </section>

              {/* Payment method */}
              <section>
                <Label>วิธีชำระเงิน</Label>
                <div className="grid grid-cols-2 gap-2">
                  <PaymentTile
                    icon={<QrCode size={22} />}
                    title="พร้อมเพย์"
                    sub="QR Code"
                    active={payMethod === 'QR'}
                    onClick={() => setPayMethod('QR')}
                  />
                  <PaymentTile
                    icon={<Banknote size={22} />}
                    title="เงินสด"
                    sub="ชำระที่ร้าน"
                    active={payMethod === 'CASH'}
                    onClick={() => setPayMethod('CASH')}
                  />
                </div>
              </section>

              {/* Note */}
              <section>
                <Label>หมายเหตุ (ถ้ามี)</Label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ไม่ใส่น้ำตาล, แพ้นมวัว..."
                  className="w-full p-4 rounded-2xl bg-white hairline text-[13px] outline-none focus:shadow-glow transition-shadow resize-none h-24 no-scrollbar"
                />
              </section>

              {/* Summary */}
              <section className="rounded-2xl bg-white hairline p-4 space-y-2">
                <Row label="ราคาสินค้า" value={`฿${subtotal}`} />
                <Row label="ค่าจัดส่ง" value={fee ? `฿${fee}` : 'ฟรี'} />
                <div className="h-px bg-hairline my-1" />
                <Row label="ยอดสุทธิ" value={`฿${total}`} bold />
                <p className="text-[11px] ink-mute text-right pt-1">
                  คุณจะได้รับ <span className="text-accent-deep font-extrabold">+{earnPoints} แต้ม</span>
                </p>
              </section>
            </div>

            {/* Submit */}
            <div className="px-6 pt-3 pb-7 bg-white border-t border-hairline">
              <button
                disabled={busy || !selectedBranch || cart.length === 0}
                onClick={handleSubmit}
                className="w-full h-14 rounded-2xl bg-accent text-ink font-extrabold pop-amber inline-flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pop-shadow"
              >
                {busy ? <Loader2 className="animate-spin" size={20} /> : (
                  <><CheckCircle2 size={20} /> ยืนยันชำระ ฿{total}</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-extrabold ink-mute tracking-[0.2em] uppercase mb-2">{children}</p>;
}

function ToggleOption({
  icon, title, active, onClick,
}: { icon: React.ReactNode; title: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-12 rounded-xl inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold transition-all ${
        active ? 'text-white shadow-pop' : 'ink-soft'
      }`}
      style={active ? { background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' } : undefined}
    >
      {icon}{title}
    </button>
  );
}

function PaymentTile({
  icon, title, sub, active, onClick,
}: { icon: React.ReactNode; title: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={[
        'p-4 rounded-2xl flex flex-col items-start gap-1 transition-all',
        active ? 'text-white shadow-pop' : 'bg-white hairline',
      ].join(' ')}
      style={active ? { background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' } : undefined}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-white/18 text-[var(--gold-1)]' : 'bg-cream text-accent-deep'}`}>
        {icon}
      </div>
      <p className="font-semibold text-[12px] mt-1">{title}</p>
      <p className={`text-[10px] font-medium ${active ? 'text-white/75' : 'ink-mute'}`}>{sub}</p>
    </motion.button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'text-base font-extrabold ink' : 'text-[12px] font-bold ink-soft'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
