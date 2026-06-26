import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { useToast } from '../components/ui';
import {
  Store, TrendingUp, Percent, ToggleLeft, ToggleRight,
  Save, RotateCcw, Info, ChevronDown, ChevronUp,
  Plus, Trash2, Pencil, X, Check, AlertTriangle,
} from 'lucide-react';
import type { ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChannelConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  gpPercent: number;
  commissionPercent: number;
  vatIncluded: boolean;
  defaultMarkupPercent: number;
  note: string;
  isDefault?: boolean; // ป้องกัน delete channels หลัก
}

const CHANNEL_DEFAULTS: ChannelConfig[] = [
  { id:'STORE',  label:'หน้าร้าน',       icon:'🏪', color:'#7c543c', enabled:true,  gpPercent:65, commissionPercent:0,  vatIncluded:false, defaultMarkupPercent:0,  note:'ราคาปกติ ไม่มีค่าธรรมเนียม', isDefault:true },
  { id:'GRAB',   label:'Grab Food',      icon:'🟢', color:'#00b14f', enabled:true,  gpPercent:40, commissionPercent:30, vatIncluded:true,  defaultMarkupPercent:15, note:'Grab เก็บ 30% (รวม VAT)', isDefault:true },
  { id:'LINE',   label:'LINE MAN',       icon:'🟡', color:'#06c755', enabled:true,  gpPercent:42, commissionPercent:25, vatIncluded:false, defaultMarkupPercent:10, note:'LINE MAN เก็บ 25%', isDefault:true },
  { id:'SHOPEE', label:'Shopee Food',    icon:'🛍️', color:'#ee4d2d', enabled:false, gpPercent:38, commissionPercent:30, vatIncluded:false, defaultMarkupPercent:15, note:'Shopee เก็บ 30%', isDefault:true },
  { id:'BOOTH',  label:'ออกบูธ / Event', icon:'🎪', color:'#7c3aed', enabled:false, gpPercent:55, commissionPercent:10, vatIncluded:false, defaultMarkupPercent:0,  note:'ค่าพื้นที่บูธโดยประมาณ', isDefault:true },
  { id:'OTHER',  label:'ช่องทางอื่น',    icon:'📦', color:'#64748b', enabled:false, gpPercent:50, commissionPercent:0,  vatIncluded:false, defaultMarkupPercent:0,  note:'', isDefault:true },
];

const SETTINGS_KEY = 'salesChannels.config';
const ICON_OPTS = ['🏪','🚀','🌐','🛒','📱','🎯','💼','🏬','🎁','🌟','🍔','☕','🍕','🍣','🎉','🏷️','💳','📲','🖥️','🏅'];
const COLOR_OPTS = ['#7c543c','#00b14f','#06c755','#ee4d2d','#7c3aed','#64748b','#0ea5e9','#f59e0b','#ec4899','#10b981','#6366f1','#ef4444'];

function genId() { return 'CH_' + Math.random().toString(36).slice(2,8).toUpperCase(); }

const EMPTY_CHANNEL = (): ChannelConfig => ({
  id: genId(), label:'', icon:'🏪', color:'#7c543c',
  enabled:true, gpPercent:50, commissionPercent:0,
  vatIncluded:false, defaultMarkupPercent:0, note:'', isDefault:false,
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalesChannelsPage() {
  const toast = useToast();
  const [channels, setChannels] = useState<ChannelConfig[]>(CHANNEL_DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [dirty,   setDirty]     = useState(false);

  // Modals
  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<ChannelConfig|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelConfig|null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const raw = res[SETTINGS_KEY];
      if (raw) {
        const saved = JSON.parse(raw) as ChannelConfig[];
        const merged = CHANNEL_DEFAULTS.map(def => { const s = saved.find(x=>x.id===def.id); return s ? {...def,...s} : def; });
        const customs = saved.filter(s => !CHANNEL_DEFAULTS.find(d=>d.id===s.id));
        setChannels([...merged, ...customs]);
      }
    } catch { /* defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings', { settings:[{ key:SETTINGS_KEY, value:JSON.stringify(channels) }] });
      toast.success('บันทึกการตั้งค่าช่องทางขายสำเร็จ');
      setDirty(false);
    } catch (e:any) { toast.error(e?.message||'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const update = (id:string, patch:Partial<ChannelConfig>) => {
    setChannels(prev => prev.map(c => c.id===id ? {...c,...patch} : c));
    setDirty(true);
  };

  const handleAdd = (ch: ChannelConfig) => {
    setChannels(prev => [...prev, ch]);
    setDirty(true);
    setAddOpen(false);
    setExpanded(ch.id);
  };

  const handleEditSave = (ch: ChannelConfig) => {
    setChannels(prev => prev.map(c => c.id===ch.id ? ch : c));
    setDirty(true);
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setChannels(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDirty(true);
    setDeleteTarget(null);
    if (expanded === deleteTarget.id) setExpanded(null);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeCount = channels.filter(c=>c.enabled).length;
  const avgGP   = channels.filter(c=>c.enabled).reduce((s,c)=>s+c.gpPercent,0) / (activeCount||1);
  const delCh   = channels.filter(c=>c.enabled && c.commissionPercent>0);
  const avgComm = delCh.reduce((s,c)=>s+c.commissionPercent,0) / (delCh.length||1);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'var(--accent)'}}/>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{color:'var(--text)'}}>ช่องทางการขาย</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>จัดการ GP, commission และช่องทางทุก platform</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { setChannels(CHANNEL_DEFAULTS); setDirty(true); }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold"
            style={{background:'var(--surface-2)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>
            <RotateCcw size={13}/> รีเซ็ต
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold"
            style={{background:'var(--surface-2)',color:'var(--text)',border:'1px solid var(--border)'}}>
            <Plus size={13}/> เพิ่มช่องทาง
          </button>
          <button onClick={handleSave} disabled={saving||!dirty}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold disabled:opacity-50"
            style={{background:'var(--accent)',color:'#fff'}}>
            <Save size={13}/> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {icon:<Store size={18}/>,      label:'ช่องทางที่เปิด',              value:`${activeCount} / ${channels.length}`, color:'var(--accent)'},
          {icon:<TrendingUp size={18}/>, label:'GP เฉลี่ย (ช่องเปิด)',         value:`${avgGP.toFixed(1)}%`,               color:'#10b981'},
          {icon:<Percent size={18}/>,    label:'Commission เฉลี่ย (delivery)', value:`${avgComm.toFixed(1)}%`,              color:'#f59e0b'},
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
            <div className="flex items-center gap-2 mb-2" style={{color:s.color}}>
              {s.icon}
              <span className="text-xs font-semibold" style={{color:'var(--text-muted)'}}>{s.label}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{color:s.color}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* GP guide */}
      <div className="rounded-2xl p-4 flex gap-3 items-start text-sm"
        style={{background:'rgba(59,130,246,0.07)',border:'1px solid rgba(59,130,246,0.18)'}}>
        <Info size={16} className="shrink-0 mt-0.5" style={{color:'#3b82f6'}}/>
        <div style={{color:'var(--text-muted)'}}>
          <strong style={{color:'#3b82f6'}}>GP (Gross Profit)</strong>{' '}
          = % กำไรขั้นต้นหลังหักต้นทุนสินค้า (Food Cost) ตัวอย่าง: ราคา 100 บาท ต้นทุน 35 บาท = GP 65%
          เมื่อขายผ่าน Grab ที่เก็บ 30% → GP สุทธิ ~35–40%
        </div>
      </div>

      {/* Channel list */}
      <div className="space-y-3">
        {channels.map(ch => {
          const isOpen = expanded === ch.id;
          const netGP  = Math.max(0, ch.gpPercent - ch.commissionPercent);
          return (
            <div key={ch.id} className="rounded-2xl overflow-hidden transition-all"
              style={{background:'var(--surface)',border:`1.5px solid ${ch.enabled ? ch.color+'55' : 'var(--border)'}`,opacity:ch.enabled?1:0.65}}>

              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{background:ch.color+'18'}}>{ch.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{color:'var(--text)'}}>{ch.label}</p>
                  <p className="text-[11px] truncate" style={{color:'var(--text-muted)'}}>{ch.note || ch.id}</p>
                </div>

                {/* Badges */}
                <div className="hidden sm:flex flex-col items-center px-3 py-1 rounded-xl shrink-0"
                  style={{background:'rgba(16,185,129,0.1)'}}>
                  <span className="text-[10px] font-bold" style={{color:'#10b981'}}>GP สุทธิ</span>
                  <span className="text-base font-extrabold" style={{color:'#10b981'}}>{ch.enabled ? `${netGP.toFixed(0)}%` : '—'}</span>
                </div>
                {ch.commissionPercent > 0 && (
                  <div className="hidden sm:flex flex-col items-center px-3 py-1 rounded-xl shrink-0"
                    style={{background:'rgba(245,158,11,0.1)'}}>
                    <span className="text-[10px] font-bold" style={{color:'#f59e0b'}}>Commission</span>
                    <span className="text-base font-extrabold" style={{color:'#f59e0b'}}>{ch.commissionPercent}%</span>
                  </div>
                )}

                {/* Action buttons */}
                <button onClick={() => setEditTarget({...ch})} title="แก้ไข"
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                  style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>
                  <Pencil size={13}/>
                </button>
                {!ch.isDefault && (
                  <button onClick={() => setDeleteTarget(ch)} title="ลบช่องทาง"
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                    style={{background:'rgba(239,68,68,0.08)',color:'#ef4444'}}>
                    <Trash2 size={13}/>
                  </button>
                )}

                {/* Toggle enable */}
                <button onClick={() => update(ch.id,{enabled:!ch.enabled})} className="shrink-0">
                  {ch.enabled
                    ? <ToggleRight size={30} style={{color:ch.color}}/>
                    : <ToggleLeft size={30} style={{color:'var(--text-faint)'}}/>}
                </button>

                {/* Expand */}
                <button onClick={() => setExpanded(isOpen ? null : ch.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>
                  {isOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                </button>
              </div>

              {/* Expanded view */}
              {isOpen && (
                <div className="px-4 pb-5 pt-3 space-y-4" style={{borderTop:'1px dashed var(--border)'}}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="GP เป้าหมาย" tooltip="กำไรขั้นต้นก่อนหักค่า commission">
                      <NumInput value={ch.gpPercent} onChange={v=>update(ch.id,{gpPercent:v})} min={0} max={100} step={1} suffix="%" color="#10b981"/>
                    </Field>
                    <Field label="Commission" tooltip="% ค่าธรรมเนียม platform">
                      <NumInput value={ch.commissionPercent} onChange={v=>update(ch.id,{commissionPercent:v})} min={0} max={100} step={0.5} suffix="%" color="#f59e0b"/>
                    </Field>
                    <Field label="Markup อัตโนมัติ" tooltip="% บวกเพิ่มจากราคาหน้าร้าน">
                      <NumInput value={ch.defaultMarkupPercent} onChange={v=>update(ch.id,{defaultMarkupPercent:v})} min={0} max={100} step={1} suffix="%" color="var(--accent)"/>
                    </Field>
                    <Field label="GP สุทธิ (คำนวณ)">
                      <div className="h-9 px-3 rounded-lg flex items-center gap-1.5 text-sm font-extrabold"
                        style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',color:'#10b981'}}>
                        <TrendingUp size={14}/>{netGP.toFixed(1)}%
                      </div>
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <TogField label="VAT 7% รวมใน commission" checked={ch.vatIncluded}
                      onChange={v=>update(ch.id,{vatIncluded:v})} color={ch.color}/>
                  </div>
                  <GPBar gpPercent={ch.gpPercent} commissionPercent={ch.commissionPercent}/>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky save */}
      {dirty && (
        <div className="sticky bottom-4 rounded-2xl px-5 py-3 flex items-center justify-between"
          style={{background:'var(--accent)',color:'#fff',boxShadow:'0 8px 32px rgba(0,0,0,0.25)'}}>
          <span className="text-sm font-bold">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold bg-white disabled:opacity-60"
            style={{color:'var(--accent)'}}>
            <Save size={14}/> {saving ? 'กำลังบันทึก...' : 'บันทึกเลย'}
          </button>
        </div>
      )}

      {/* ── Modal: Add/Edit ── */}
      {(addOpen || editTarget) && (
        <ChannelModal
          initial={editTarget || EMPTY_CHANNEL()}
          isEdit={!!editTarget}
          onClose={() => { setAddOpen(false); setEditTarget(null); }}
          onSave={(ch) => editTarget ? handleEditSave(ch) : handleAdd(ch)}
        />
      )}

      {/* ── Modal: Confirm Delete ── */}
      {deleteTarget && (
        <DeleteConfirm
          channel={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// ─── Channel Modal (Add & Edit) ───────────────────────────────────────────────
function ChannelModal({ initial, isEdit, onClose, onSave }:
  { initial:ChannelConfig; isEdit:boolean; onClose:()=>void; onSave:(ch:ChannelConfig)=>void }) {
  const [form, setForm] = useState<ChannelConfig>({...initial});
  const [iconOpen, setIconOpen] = useState(false);

  const upd = (p: Partial<ChannelConfig>) => setForm(prev => ({...prev,...p}));
  const valid = form.label.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{background:'var(--surface)',border:'1px solid var(--border)',maxHeight:'90vh'}}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid var(--border)'}}>
          <div>
            <h2 className="text-base font-extrabold" style={{color:'var(--text)'}}>
              {isEdit ? 'แก้ไขช่องทาง' : 'เพิ่มช่องทางใหม่'}
            </h2>
            <p className="text-xs" style={{color:'var(--text-muted)'}}>กำหนดข้อมูล GP และค่า commission</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>
            <X size={16}/>
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Icon + Color + Label */}
          <div className="flex gap-3 items-end">
            {/* Icon picker */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{color:'var(--text-muted)'}}>ไอคอน</label>
              <button onClick={() => setIconOpen(!iconOpen)}
                className="w-14 h-9 rounded-xl text-xl flex items-center justify-center"
                style={{background:form.color+'22',border:`2px solid ${form.color}`}}>
                {form.icon}
              </button>
              {iconOpen && (
                <div className="absolute top-full left-0 mt-1 z-10 p-2 rounded-xl grid grid-cols-5 gap-1"
                  style={{background:'var(--surface)',border:'1px solid var(--border)',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
                  {ICON_OPTS.map(ico => (
                    <button key={ico} onClick={() => { upd({icon:ico}); setIconOpen(false); }}
                      className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all"
                      style={{background: form.icon===ico ? 'var(--accent-soft)' : 'transparent'}}>
                      {ico}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Label */}
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{color:'var(--text-muted)'}}>ชื่อช่องทาง *</label>
              <input value={form.label} onChange={e=>upd({label:e.target.value})}
                placeholder="เช่น TikTok Shop, Facebook"
                className="w-full h-9 px-3 rounded-xl text-sm font-semibold outline-none"
                style={{background:'var(--surface-2)',border:`1.5px solid ${valid?'var(--border)':'#ef444488'}`,color:'var(--text)'}}/>
            </div>
          </div>

          {/* Color palette */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{color:'var(--text-muted)'}}>สี</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTS.map(c => (
                <button key={c} onClick={() => upd({color:c})}
                  className="w-8 h-8 rounded-lg transition-all"
                  style={{background:c, outline: form.color===c ? `3px solid ${c}` : 'none', outlineOffset:'2px', transform: form.color===c ? 'scale(1.15)' : 'scale(1)'}}>
                  {form.color===c && <Check size={14} className="m-auto text-white"/>}
                </button>
              ))}
              {/* Custom color */}
              <label className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer"
                style={{borderColor:'var(--border)',color:'var(--text-muted)'}}>
                <Plus size={14}/>
                <input type="color" className="sr-only" value={form.color} onChange={e=>upd({color:e.target.value})}/>
              </label>
            </div>
          </div>

          {/* Numbers row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="GP เป้าหมาย" tooltip="กำไรขั้นต้น %">
              <NumInput value={form.gpPercent} onChange={v=>upd({gpPercent:v})} min={0} max={100} step={1} suffix="%" color="#10b981"/>
            </Field>
            <Field label="Commission" tooltip="% platform เก็บ">
              <NumInput value={form.commissionPercent} onChange={v=>upd({commissionPercent:v})} min={0} max={100} step={0.5} suffix="%" color="#f59e0b"/>
            </Field>
            <Field label="Markup %" tooltip="% บวกเพิ่มอัตโนมัติ">
              <NumInput value={form.defaultMarkupPercent} onChange={v=>upd({defaultMarkupPercent:v})} min={0} max={100} step={1} suffix="%" color="var(--accent)"/>
            </Field>
            <Field label="GP สุทธิ">
              <div className="h-9 px-3 rounded-lg flex items-center gap-1 text-sm font-extrabold"
                style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',color:'#10b981'}}>
                <TrendingUp size={14}/>{Math.max(0,form.gpPercent-form.commissionPercent).toFixed(1)}%
              </div>
            </Field>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-3">
            <TogField label="เปิดใช้งาน" checked={form.enabled} onChange={v=>upd({enabled:v})} color={form.color}/>
            <TogField label="VAT 7% รวมใน commission" checked={form.vatIncluded} onChange={v=>upd({vatIncluded:v})} color={form.color}/>
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{color:'var(--text-muted)'}}>หมายเหตุ / คำอธิบาย</label>
            <input value={form.note} onChange={e=>upd({note:e.target.value})}
              placeholder="เช่น เก็บ commission 30% รวม VAT"
              className="w-full h-9 px-3 rounded-xl text-sm font-medium outline-none"
              style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text)'}}/>
          </div>

          {/* GP Bar preview */}
          <GPBar gpPercent={form.gpPercent} commissionPercent={form.commissionPercent}/>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-5 py-4" style={{borderTop:'1px solid var(--border)'}}>
          <button onClick={onClose}
            className="h-9 px-4 rounded-xl text-sm font-semibold"
            style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>ยกเลิก</button>
          <button onClick={() => { if(valid) onSave(form); }} disabled={!valid}
            className="h-9 px-5 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
            style={{background:'var(--accent)',color:'#fff'}}>
            <Check size={14}/> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มช่องทาง'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ────────────────────────────────────────────────────────────
function DeleteConfirm({ channel, onCancel, onConfirm }:
  { channel:ChannelConfig; onCancel:()=>void; onConfirm:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{background:'rgba(239,68,68,0.1)'}}>
            <AlertTriangle size={22} style={{color:'#ef4444'}}/>
          </div>
          <div>
            <p className="font-extrabold text-sm" style={{color:'var(--text)'}}>ลบช่องทาง "{channel.label}"?</p>
            <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>การกระทำนี้ไม่สามารถเรียกคืนได้</p>
          </div>
        </div>
        <div className="p-3 rounded-xl text-xs" style={{background:'rgba(239,68,68,0.07)',color:'#ef4444'}}>
          ⚠ เมนูสินค้าที่กำหนดช่องทางนี้ไว้อาจได้รับผลกระทบ ควรอัปเดตเมนูหลังลบ
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="h-9 px-4 rounded-xl text-sm font-semibold"
            style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>ยกเลิก</button>
          <button onClick={onConfirm}
            className="h-9 px-4 rounded-xl text-sm font-bold flex items-center gap-1.5"
            style={{background:'#ef4444',color:'#fff'}}>
            <Trash2 size={14}/> ลบช่องทาง
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, tooltip, children }:{ label:string; tooltip?:string; children:ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-[10px] font-bold uppercase tracking-wider" style={{color:'var(--text-muted)'}}>{label}</label>
        {tooltip && <span title={tooltip} className="cursor-help" style={{color:'var(--text-faint)'}}><Info size={11}/></span>}
      </div>
      {children}
    </div>
  );
}

function NumInput({ value,onChange,min,max,step,suffix,color }:
  { value:number;onChange:(v:number)=>void;min:number;max:number;step:number;suffix?:string;color?:string }) {
  return (
    <div className="relative">
      <input type="number" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Math.min(max,Math.max(min,parseFloat(e.target.value)||0)))}
        className="w-full h-9 px-3 pr-8 rounded-lg text-sm font-bold outline-none"
        style={{background:'var(--surface-2)',border:`1.5px solid ${color||'var(--border)'}`,color:color||'var(--text)'}}/>
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold pointer-events-none"
          style={{color:color||'var(--text-muted)'}}>{suffix}</span>
      )}
    </div>
  );
}

function TogField({ label,checked,onChange,color }:{ label:string;checked:boolean;onChange:(v:boolean)=>void;color:string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl"
      style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
      <button type="button" onClick={()=>onChange(!checked)}>
        {checked ? <ToggleRight size={22} style={{color}}/> : <ToggleLeft size={22} style={{color:'var(--text-faint)'}}/>}
      </button>
      <span className="text-xs font-semibold" style={{color:checked?color:'var(--text-muted)'}}>{label}</span>
    </label>
  );
}

function GPBar({ gpPercent,commissionPercent }:{ gpPercent:number;commissionPercent:number }) {
  const foodCost = Math.max(0,100-gpPercent);
  const comm     = Math.min(gpPercent,commissionPercent);
  const netGP    = Math.max(0,gpPercent-commissionPercent);
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'var(--text-muted)'}}>
        โครงสร้างราคา (ต่อ 100 บาท)
      </p>
      <div className="flex h-8 rounded-xl overflow-hidden text-[10px] font-bold">
        <div className="flex items-center justify-center" style={{width:`${foodCost}%`,background:'#ef4444',color:'#fff'}}>
          {foodCost>10 && `ต้นทุน ${foodCost}%`}
        </div>
        <div className="flex items-center justify-center" style={{width:`${comm}%`,background:'#f59e0b',color:'#fff'}}>
          {comm>10 && `Comm ${comm}%`}
        </div>
        <div className="flex items-center justify-center flex-1" style={{background:'#10b981',color:'#fff'}}>
          {netGP>5 && `GP ${netGP.toFixed(0)}%`}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px]" style={{color:'var(--text-muted)'}}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm shrink-0 inline-block" style={{background:'#ef4444'}}/>ต้นทุน {foodCost}%</span>
        {comm>0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm shrink-0 inline-block" style={{background:'#f59e0b'}}/>Commission {comm}%</span>}
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm shrink-0 inline-block" style={{background:'#10b981'}}/>GP สุทธิ {netGP.toFixed(1)}%</span>
      </div>
    </div>
  );
}
