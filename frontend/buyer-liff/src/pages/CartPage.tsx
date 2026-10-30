import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, Minus, Plus, ShoppingBag, Store as StoreIcon, ChevronRight, X,
} from 'lucide-react';
import { EmptyState } from '../components/ui/Primitives';
import TopBar from '../components/TopBar';
import BranchPickerSheet from '../sheets/BranchPickerSheet';
import CheckoutSheet from '../sheets/CheckoutSheet';
import { AddressPickerSheet } from '../sheets/AddressSheets';
import { useSWR } from '../lib/cache';
import type { Branch, CartItem, MemberAddress, Member, TabId } from '../types';
import { API_BASE as API } from '../api';

interface Props {
  cart: CartItem[];
  onUpdateQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onCheckout: (params: { method: string; type: string; note: string; address?: string }) => Promise<void>;
  selectedBranch: Branch | null;
  setSelectedBranch: (b: Branch | null) => void;
  member: Member | null;
  onOpenAuth: () => void;
  onAddNewAddress: () => void;
  onNavigate: (t: TabId) => void;
}

export default function CartPage({
  cart, onUpdateQty, onRemove, onCheckout, selectedBranch, setSelectedBranch,
  member, onOpenAuth, onAddNewAddress, onNavigate,
}: Props) {
  const { data: branchesData } = useSWR<Branch[]>(`${API}/branches`, { ttl: 60_000 });
  const branches = branchesData ?? [];

  const [showBranches, setShowBranches] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<MemberAddress | null>(
    member?.addresses?.find((a) => a.isDefault) || member?.addresses?.[0] || null,
  );

  useEffect(() => {
    if (!selectedAddress && member?.addresses?.length) {
      setSelectedAddress(member.addresses.find((a) => a.isDefault) || member.addresses[0]);
    }
  }, [member, selectedAddress]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unitTotal, 0), [cart]);

  const proceed = () => {
    if (!selectedBranch) { setShowBranches(true); return; }
    if (!localStorage.getItem('authToken')) { onOpenAuth(); return; }
    setShowCheckout(true);
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col buyer-shell-bg">
        <TopBar variant="paper" kicker="✦ My Cart" title="ตะกร้าของฉัน" />
        <div className="flex-1 flex items-center justify-center -mt-10">
          <EmptyState
            icon={<ShoppingBag size={32} />}
            title="ตะกร้าว่างเปล่า"
            body="มาเริ่มสำรวจเมนูแสนอร่อยและเติมคาเฟอีนกัน"
            action={
              <button
                onClick={() => onNavigate('menu')}
                className="h-12 px-6 rounded-2xl text-ink font-extrabold pop-amber inline-flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ffd166 0%, #f5b301 50%, #ff9b1c 100%)' }}
              >
                <Coffee size={18} /> เลือกเมนู
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden buyer-shell-bg">
      <TopBar
        variant="paper"
        kicker="✦ My Cart"
        title="ตะกร้าของฉัน"
        subtitle={cart.length > 0 ? `${cart.length} รายการ` : undefined}
      />

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-72 no-scrollbar space-y-3">
        <AnimatePresence>
          {cart.map((item, idx) => {
            const optsLabel = Object.values(item.selectedOptions).flat().map((o) => o.label).join(' · ');
            return (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="bg-white hairline rounded-3xl p-3 flex gap-3"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-paper-dim">
                  {item.menuItem.imageUrl ? (
                    <img src={item.menuItem.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center mesh-cream">
                      <Coffee size={26} className="text-accent" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-extrabold text-[12.5px] ink truncate">{item.menuItem.name}</p>
                      {optsLabel && <p className="text-[10.5px] ink-mute truncate mt-0.5">{optsLabel}</p>}
                      {item.note && <p className="text-[9.5px] text-accent-deep mt-0.5 truncate">📝 {item.note}</p>}
                    </div>
                    <button
                      onClick={() => onRemove(idx)}
                      aria-label="ลบ"
                      className="w-7 h-7 rounded-full bg-paper-dim flex items-center justify-center ink-mute"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="font-extrabold text-[13px] ink">฿{item.unitTotal}</span>
                    <div className="inline-flex items-center bg-paper rounded-xl hairline">
                      <button
                        onClick={() => onUpdateQty(idx, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center ink-soft active:scale-95 transition-transform"
                        aria-label="ลด"
                      >
                        <Minus size={14} strokeWidth={2.6} />
                      </button>
                      <span className="font-extrabold text-[11px] w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(idx, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center ink active:scale-95 transition-transform"
                        aria-label="เพิ่ม"
                      >
                        <Plus size={14} strokeWidth={2.6} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Sticky summary bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-28 pt-4 bg-gradient-to-t from-[var(--paper)] via-[var(--paper)]/95 to-transparent">
        <div className="luxe-border bg-white rounded-[1.8rem] p-4 shadow-deep space-y-3">
          <button
            onClick={() => setShowBranches(true)}
            className="w-full bg-[var(--paper-dim)] rounded-2xl p-3 flex items-center gap-3 hairline active:scale-[0.99] transition-transform"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold-1)] text-ink flex items-center justify-center shrink-0 shadow-amber">
              <StoreIcon size={18} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[9.5px] font-black text-gold tracking-[0.24em] uppercase">✦ สาขาที่รับ</p>
              <p className="font-display font-extrabold text-[12.5px] ink truncate">{selectedBranch?.name || 'เลือกสาขา'}</p>
            </div>
            <ChevronRight size={18} className="ink-mute" />
          </button>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-[9.5px] font-black ink-mute tracking-[0.24em] uppercase">ยอดรวม</p>
              <p className="font-display font-extrabold text-3xl ink">
                <span className="text-[12.5px] ink-mute font-bold mr-0.5">฿</span>
                <span className="text-gold">{subtotal}</span>
              </p>
            </div>
            <button
              onClick={proceed}
              className="h-14 px-6 rounded-2xl text-ink font-extrabold pop-amber inline-flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #ffd166 0%, #f5b301 50%, #ff9b1c 100%)' }}
            >
              ดำเนินการ <ChevronRight size={18} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      <BranchPickerSheet
        open={showBranches}
        onClose={() => setShowBranches(false)}
        branches={branches}
        selected={selectedBranch}
        onSelect={setSelectedBranch}
      />

      <CheckoutSheet
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        selectedBranch={selectedBranch}
        selectedAddress={selectedAddress}
        onPickAddress={() => setShowAddressPicker(true)}
        onCheckout={({ method, fulfillType, note, address }) =>
          onCheckout({ method, type: fulfillType, note, address })
        }
      />

      <AddressPickerSheet
        open={showAddressPicker}
        onClose={() => setShowAddressPicker(false)}
        member={member}
        selectedId={selectedAddress?.id}
        onSelect={setSelectedAddress}
        onAddNew={() => { setShowAddressPicker(false); onAddNewAddress(); }}
      />
    </div>
  );
}

