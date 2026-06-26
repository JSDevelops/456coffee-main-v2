import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, CheckCircle2, Home, Loader2, MapPin, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import type { Member, MemberAddress } from '../types';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

const labelIcon = (label: string) =>
  label === 'Home' ? <Home size={18} /> : label === 'Office' ? <Briefcase size={18} /> : <MapPin size={18} />;

/** Reusable bottom-sheet shell. */
function SheetShell({
  open, onClose, title, kicker, children,
}: { open: boolean; onClose: () => void; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[160] flex items-end justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-paper rounded-t-[2rem] max-h-[88vh] flex flex-col shadow-deep"
          >
            <div className="pt-3 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-line" /></div>
            <div className="px-6 pt-4 pb-3 flex items-center justify-between">
              <div>
                {kicker && <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent-deep">{kicker}</p>}
                <h3 className="font-extrabold text-xl ink mt-0.5">{title}</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white hairline flex items-center justify-center">
                <X size={18} className="ink" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Address picker (used in checkout) ── */
export function AddressPickerSheet({
  open, onClose, member, selectedId, onSelect, onAddNew,
}: {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  selectedId?: string;
  onSelect: (a: MemberAddress) => void;
  onAddNew: () => void;
}) {
  return (
    <SheetShell open={open} onClose={onClose} title="ที่อยู่จัดส่ง" kicker="Delivery to">
      <div className="px-6 pb-8 space-y-3">
        {member?.addresses?.length ? (
          member.addresses.map((a) => {
            const isSel = selectedId === a.id;
            return (
              <motion.button
                key={a.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onSelect(a); onClose(); }}
                className={[
                  'w-full p-4 rounded-3xl flex items-center gap-4 text-left transition-all',
                  isSel ? 'text-white shadow-deep' : 'bg-white hairline',
                ].join(' ')}
                style={isSel ? { background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' } : undefined}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  isSel ? 'bg-white/15' : 'bg-cream text-accent-deep'
                }`}>
                  {labelIcon(a.label)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[13px] uppercase tracking-wider">{a.label}</p>
                  <p className={`text-[11px] truncate mt-0.5 ${isSel ? 'text-white/70' : 'ink-mute'}`}>{a.address}</p>
                </div>
                {isSel && <CheckCircle2 size={20} className="text-accent shrink-0" />}
              </motion.button>
            );
          })
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm ink-mute">ยังไม่มีที่อยู่ที่บันทึกไว้</p>
          </div>
        )}
        <button
          onClick={onAddNew}
          className="w-full p-4 rounded-3xl border-2 border-dashed border-line text-[13px] font-extrabold ink-soft inline-flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={2.6} /> เพิ่มที่อยู่ใหม่
        </button>
      </div>
    </SheetShell>
  );
}

/* ── Address form (create/edit) ── */
export function AddressFormSheet({
  open, onClose, onSaved, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: MemberAddress | null;
}) {
  const [label, setLabel] = useState('Home');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel(initial?.label || 'Home');
      setAddress(initial?.address || '');
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!address.trim()) return;
    setLoading(true);
    try {
      const memberId = localStorage.getItem('memberId');
      const method = initial?.id ? 'PATCH' : 'POST';
      const url = initial?.id ? `${API}/addresses/${initial.id}` : `${API}/addresses`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId, label, address }),
      });
      if (res.ok) { onSaved(); onClose(); }
    } finally { setLoading(false); }
  };

  return (
    <SheetShell open={open} onClose={onClose} title={initial ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'} kicker="Address">
      <div className="px-6 pb-8 space-y-5">
        <div>
          <label className="text-[10px] font-extrabold ink-mute tracking-[0.2em] uppercase mb-2 block">ประเภทที่อยู่</label>
          <div className="grid grid-cols-3 gap-2">
            {['Home', 'Office', 'Other'].map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`h-12 rounded-2xl font-semibold text-[11.5px] inline-flex items-center justify-center gap-1.5 transition-all ${
                  label === l ? 'text-white shadow-pop' : 'bg-white hairline ink-soft'
                }`}
                style={label === l ? { background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' } : undefined}
              >
                {labelIcon(l)} {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-extrabold ink-mute tracking-[0.2em] uppercase mb-2 block">รายละเอียด</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
            className="w-full p-4 rounded-2xl bg-white hairline text-[13px] outline-none focus:shadow-glow transition-shadow resize-none h-32 no-scrollbar"
          />
        </div>

        <button
          disabled={loading || !address.trim()}
          onClick={handleSave}
          className="w-full h-14 rounded-2xl bg-accent text-ink font-extrabold pop-amber inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pop-shadow"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (
            <><CheckCircle2 size={20} /> บันทึกข้อมูล</>
          )}
        </button>
      </div>
    </SheetShell>
  );
}

/* ── Address list manager ── */
export function AddressManagementSheet({
  open, onClose, member, onRefresh, onAdd, onEdit,
}: {
  open: boolean;
  onClose: () => void;
  member: Member | null;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (a: MemberAddress) => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบที่อยู่นี้?')) return;
    try {
      const res = await fetch(`${API}/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <SheetShell open={open} onClose={onClose} title="ที่อยู่ของฉัน" kicker="My addresses">
      <div className="px-6 pb-32 space-y-3">
        {member?.addresses?.map((a) => (
          <div
            key={a.id}
            className="bg-white hairline p-4 rounded-3xl flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-cream text-accent-deep flex items-center justify-center">
              {labelIcon(a.label)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-[13px] uppercase ink">{a.label}</p>
                {a.isDefault && (
                  <span className="text-[9px] bg-accent text-ink px-2 py-0.5 rounded-full font-extrabold">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="text-[11px] ink-mute truncate mt-0.5">{a.address}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(a)}
                aria-label="แก้ไข"
                className="w-9 h-9 rounded-xl bg-paper-dim flex items-center justify-center ink-soft active:scale-95 transition-transform"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                aria-label="ลบ"
                className="w-9 h-9 rounded-xl bg-danger-soft text-danger flex items-center justify-center active:scale-95 transition-transform"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {(!member?.addresses || member.addresses.length === 0) && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-paper-dim mx-auto flex items-center justify-center mb-3">
              <MapPin size={28} className="ink-mute" />
            </div>
            <p className="font-extrabold text-sm ink">คุณยังไม่มีที่อยู่</p>
            <p className="text-[12px] ink-mute mt-1">เพิ่มที่อยู่เพื่อจัดส่งถึงบ้าน</p>
          </div>
        )}
      </div>

      {/* Sticky add button */}
      <div className="absolute left-0 right-0 bottom-0 px-6 pb-6 pt-8 bg-gradient-to-t from-paper via-paper/95 to-transparent">
        <button
          onClick={onAdd}
          className="w-full h-14 rounded-2xl bg-accent text-ink font-extrabold pop-amber inline-flex items-center justify-center gap-2"
        >
          <Plus size={20} strokeWidth={2.6} /> เพิ่มที่อยู่ใหม่
        </button>
      </div>
    </SheetShell>
  );
}
