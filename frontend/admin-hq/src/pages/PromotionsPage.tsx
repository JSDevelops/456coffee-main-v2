import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Percent, Banknote, Gift, ShoppingBag, X, Check, Loader2,
  Copy, AlertCircle, Search, Download,
} from 'lucide-react';
import { api } from '../api';
import { exportSingleSheetToExcel } from '../lib/excelExporter';

type PromotionType = 'PERCENT' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'PRODUCT_DISCOUNT';

interface Promotion {
  id: string;
  branchId: string | null;
  name: string;
  description?: string;
  code?: string;
  type: PromotionType;
  value: number;
  minOrderAmount: number;
  productIds: string[];
  buyQty?: number;
  getQty?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

interface Branch { id: string; name: string; }

const TYPE_LABELS: Record<PromotionType, { label: string; icon: any; color: string }> = {
  PERCENT:          { label: 'ลด %',            icon: Percent,    color: '#3b82f6' },
  FIXED_AMOUNT:     { label: 'ลดคงที่ (฿)',      icon: Banknote,   color: '#059669' },
  BUY_X_GET_Y:      { label: 'ซื้อ X แถม Y',    icon: Gift,       color: '#8b5cf6' },
  PRODUCT_DISCOUNT: { label: 'ลดสินค้าเฉพาะ',   icon: ShoppingBag, color: '#f59e0b' },
};

const EMPTY_FORM = {
  name: '',
  description: '',
  code: '',
  type: 'PERCENT' as PromotionType,
  value: 10,
  minOrderAmount: 0,
  productIds: [] as string[],
  buyQty: 2,
  getQty: 1,
  startDate: '',
  endDate: '',
  usageLimit: '',
  branchId: '',
  isActive: true,
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  // Product picker
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; category?: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [allProducts, productSearch]);

  function toggleProduct(id: string) {
    setForm(f => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter(x => x !== id)
        : [...f.productIds, id],
    }));
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [promos, brs] = await Promise.all([
        api.get<Promotion[]>('/promotions/all'),
        api.get<Branch[]>('/branches'),
      ]);
      setPromotions(Array.isArray(promos) ? promos : []);
      setBranches(Array.isArray(brs) ? brs : []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products when PRODUCT_DISCOUNT selected
  useEffect(() => {
    if (form.type !== 'PRODUCT_DISCOUNT') return;
    if (allProducts.length > 0) return;
    api.get<any[]>('/products')
      .then(data => setAllProducts(data.map(p => ({ id: p.id, name: p.name, category: p.category?.name }))))
      .catch(console.error);
  }, [form.type, allProducts.length]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: Promotion) {
    setForm({
      name: p.name,
      description: p.description || '',
      code: p.code || '',
      type: p.type,
      value: p.value,
      minOrderAmount: p.minOrderAmount,
      productIds: p.productIds,
      buyQty: p.buyQty ?? 2,
      getQty: p.getQty ?? 1,
      startDate: p.startDate ? p.startDate.split('T')[0] : '',
      endDate: p.endDate ? p.endDate.split('T')[0] : '',
      usageLimit: p.usageLimit ? String(p.usageLimit) : '',
      branchId: p.branchId || '',
      isActive: p.isActive,
    });
    setEditingId(p.id);
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('กรุณาระบุชื่อโปรโมชั่น'); return; }
    if (form.value <= 0) { setError('ค่าส่วนลดต้องมากกว่า 0'); return; }

    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        branchId: form.branchId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        code: form.code.trim().toUpperCase() || undefined,
      };

      const url = editingId
        ? `/promotions/${editingId}`
        : `/promotions`;

      if (editingId) {
        await api.patch(url, body);
      } else {
        await api.post(url, body);
      }

      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Promotion) {
    await api.patch(`/promotions/${p.id}`, { isActive: !p.isActive });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('ปิดการใช้งานโปรโมชั่นนี้?')) return;
    await api.delete(`/promotions/${id}`);
    await load();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatValue(p: Promotion) {
    if (p.type === 'PERCENT') return `${p.value}%`;
    if (p.type === 'FIXED_AMOUNT') return `฿${p.value.toLocaleString()}`;
    if (p.type === 'BUY_X_GET_Y') return `ซื้อ ${p.buyQty} แถม ${p.getQty}`;
    return `฿${p.value.toLocaleString()} / สินค้าที่ระบุ`;
  }

  function handleExportExcel() {
    if (!promotions || promotions.length === 0) {
      alert('ไม่มีข้อมูลโปรโมชั่นสำหรับ Export');
      return;
    }

    const rows = promotions.map((p) => {
      const branchName = branches.find((b) => b.id === p.branchId)?.name || 'ทุกสาขา';
      const typeLabel = TYPE_LABELS[p.type]?.label || p.type;
      return {
        'ชื่อโปรโมชั่น': p.name,
        'โค้ดส่วนลด': p.code || '-',
        'ประเภท': typeLabel,
        'มูลค่าส่วนลด': formatValue(p),
        'ยอดสั่งซื้อขั้นต่ำ (บาท)': p.minOrderAmount,
        'สาขาที่ร่วมรายการ': branchName,
        'จำนวนครั้งที่ใช้แล้ว': p.usageCount,
        'จำกัดการใช้ (ครั้ง)': p.usageLimit || 'ไม่จำกัด',
        'สถานะ': p.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
        'วันที่เริ่มต้น': p.startDate ? new Date(p.startDate).toLocaleDateString('th-TH') : '-',
        'วันที่สิ้นสุด': p.endDate ? new Date(p.endDate).toLocaleDateString('th-TH') : '-',
      };
    });

    exportSingleSheetToExcel(
      '456coffee_promotions',
      'โปรโมชั่นและส่วนลด',
      rows,
    );
  }

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
            <Tag size={24} className="text-[#ea580c]" />
            โปรโมชั่น & ส่วนลด
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            สร้างและจัดการโปรโมชั่นสำหรับทุกสาขา
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all"
          >
            <Download size={16} /> Export Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg,#ea580c,#7c543c)' }}
          >
            <Plus size={16} /> สร้างโปรโมชั่น
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'ทั้งหมด',    val: promotions.length,                     color: '#3b82f6' },
          { label: 'ใช้งานอยู่', val: promotions.filter(p => p.isActive).length, color: '#059669' },
          { label: 'มี Code',   val: promotions.filter(p => p.code).length,  color: '#8b5cf6' },
          { label: 'ใช้ไปแล้ว', val: promotions.reduce((s,p)=>s+p.usageCount,0), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 bg-[var(--color-surface)]">
            <p className="text-xs font-bold text-[var(--color-text-secondary)]">{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Promotion cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#ea580c]" />
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-secondary)]">
          <Tag size={48} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
          <p className="font-black">ยังไม่มีโปรโมชั่น</p>
          <p className="text-sm mt-1">กด "+ สร้างโปรโมชั่น" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {promotions.map(p => {
            const meta = TYPE_LABELS[p.type];
            const Icon = meta.icon;
            const expired = p.endDate && new Date(p.endDate) < new Date();
            return (
              <div
                key={p.id}
                className="rounded-2xl p-5 bg-[var(--color-surface)] border transition-all"
                style={{
                  borderColor: p.isActive && !expired ? meta.color + '40' : 'transparent',
                  opacity: (!p.isActive || expired) ? 0.55 : 1,
                }}
              >
                {/* Type badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: meta.color + '20', color: meta.color }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: meta.color }}>{meta.label}</p>
                      <p className="font-black text-[var(--color-text-primary)] text-sm leading-tight">{p.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => toggleActive(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-border)]"
                      style={{ color: p.isActive ? '#059669' : '#94a3b8' }}>
                      {p.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-100 text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Value */}
                <div className="text-3xl font-black mb-2" style={{ color: meta.color }}>
                  {formatValue(p)}
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-[var(--color-text-secondary)] mb-3">
                  {p.minOrderAmount > 0 && <p>ยอดขั้นต่ำ ฿{p.minOrderAmount.toLocaleString()}</p>}
                  {p.endDate && (
                    <p className={expired ? 'text-red-500 font-bold' : ''}>
                      {expired ? '⚠ หมดอายุแล้ว' : `หมดอายุ ${new Date(p.endDate).toLocaleDateString('th-TH')}`}
                    </p>
                  )}
                  {p.usageLimit && (
                    <p>ใช้แล้ว {p.usageCount}/{p.usageLimit} ครั้ง</p>
                  )}
                  {!p.branchId && <p className="font-bold text-[#ea580c]">ใช้ได้ทุกสาขา</p>}
                  {p.branchId && <p>สาขา: {branches.find(b=>b.id===p.branchId)?.name || p.branchId}</p>}
                </div>

                {/* Coupon code */}
                {p.code && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 rounded-xl text-xs font-black tracking-widest"
                      style={{ background: 'var(--color-border)', color: meta.color }}>
                      {p.code}
                    </code>
                    <button onClick={() => copyCode(p.code!)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-border)]"
                      style={{ color: copiedCode === p.code ? '#059669' : 'var(--color-text-secondary)' }}>
                      {copiedCode === p.code ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create / Edit Form Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-[var(--color-surface)] rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[90dvh] flex flex-col">
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between shrink-0 border-b border-[var(--color-border)]">
              <h2 className="font-black text-lg text-[var(--color-text-primary)]">
                {editingId ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่นใหม่'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="w-9 h-9 rounded-xl bg-[var(--color-border)] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Name */}
              <Field label="ชื่อโปรโมชั่น *">
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="เช่น ลด 10% เฉลิมฉลองครบรอบ"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
              </Field>

              {/* Description */}
              <Field label="รายละเอียด">
                <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
              </Field>

              {/* Type */}
              <Field label="ประเภทโปรโมชั่น">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_LABELS) as PromotionType[]).map(t => {
                    const meta = TYPE_LABELS[t];
                    const Icon = meta.icon;
                    return (
                      <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                        className="flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left"
                        style={{
                          borderColor: form.type===t ? meta.color : 'var(--color-border)',
                          background: form.type===t ? meta.color+'15' : 'transparent',
                          color: form.type===t ? meta.color : 'var(--color-text-secondary)',
                        }}>
                        <Icon size={14} />
                        <span className="text-xs font-bold">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Value */}
              {form.type !== 'BUY_X_GET_Y' && (
                <Field label={form.type==='PERCENT' ? 'ลดกี่ % *' : 'ลดเท่าไหร่ (฿) *'}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--color-text-secondary)]">
                      {form.type==='PERCENT' ? '%' : '฿'}
                    </span>
                    <input type="number" value={form.value}
                      onChange={e=>setForm(f=>({...f,value:Number(e.target.value)}))}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
                  </div>
                </Field>
              )}

              {/* BUY_X_GET_Y */}
              {form.type === 'BUY_X_GET_Y' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ซื้อกี่ชิ้น (X)">
                    <input type="number" min={1} value={form.buyQty}
                      onChange={e=>setForm(f=>({...f,buyQty:Number(e.target.value)}))}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
                  </Field>
                  <Field label="แถมกี่ชิ้น (Y)">
                    <input type="number" min={1} value={form.getQty}
                      onChange={e=>setForm(f=>({...f,getQty:Number(e.target.value)}))}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
                  </Field>
                </div>
              )}

              {/* Product picker — PRODUCT_DISCOUNT only */}
              {form.type === 'PRODUCT_DISCOUNT' && (
                <Field label="เลือกสินค้าที่ลดราคา *">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                      <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                        placeholder="ค้นหาเมนู..."
                        className="w-full h-9 pl-8 pr-3 rounded-xl text-xs outline-none bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[#ea580c]" />
                    </div>
                    {form.productIds.length > 0 && (
                      <span className="text-[9px] font-black shrink-0 px-2 h-7 rounded-lg flex items-center"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                        {form.productIds.length} รายการ
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl overflow-hidden max-h-52 overflow-y-auto border border-[var(--color-border)]">
                    {filteredProducts.length === 0 ? (
                      <p className="text-center text-xs text-[var(--color-text-secondary)] py-6">ไม่พบสินค้า</p>
                    ) : filteredProducts.map(p => {
                      const sel = form.productIds.includes(p.id);
                      return (
                        <button key={p.id} onClick={() => toggleProduct(p.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-bg)]"
                          style={{ borderBottom: '1px solid var(--color-border)', background: sel ? 'rgba(245,158,11,0.07)' : 'transparent' }}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors`}
                            style={sel ? { background: '#f59e0b', borderColor: '#f59e0b' } : { borderColor: 'var(--color-border)' }}>
                            {sel && <Check size={10} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">{p.name}</p>
                            {p.category && <p className="text-[9px] text-[var(--color-text-secondary)]">{p.category}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {form.productIds.length > 0 && (
                    <button onClick={() => setForm(f => ({...f, productIds: []}) )}
                      className="mt-1 text-[10px] text-[var(--color-text-secondary)] hover:text-red-500 transition-colors">
                      ล้างการเลือกทั้งหมด
                    </button>
                  )}
                </Field>
              )}

              {/* Min order */}
              <Field label="ยอดขั้นต่ำ (฿)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--color-text-secondary)]">฿</span>
                  <input type="number" value={form.minOrderAmount}
                    onChange={e=>setForm(f=>({...f,minOrderAmount:Number(e.target.value)}))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
                </div>
              </Field>

              {/* Coupon code */}
              <Field label="Coupon Code (ไม่บังคับ)">
                <input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))}
                  placeholder="เช่น COFFEE10"
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono font-black outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c] tracking-widest" />
              </Field>

              {/* Branch */}
              <Field label="สาขา">
                <select value={form.branchId} onChange={e=>setForm(f=>({...f,branchId:e.target.value}))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]">
                  <option value="">ทุกสาขา</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="เริ่มต้น">
                  <input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
                </Field>
                <Field label="หมดอายุ">
                  <input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
                </Field>
              </div>

              {/* Usage limit */}
              <Field label="จำกัดจำนวนครั้ง (ว่าง = ไม่จำกัด)">
                <input type="number" value={form.usageLimit}
                  onChange={e=>setForm(f=>({...f,usageLimit:e.target.value}))}
                  placeholder="ไม่จำกัด"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[#ea580c]" />
              </Field>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg)]">
                <div>
                  <p className="text-sm font-black text-[var(--color-text-primary)]">เปิดใช้งานทันที</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">ปิดเพื่อบันทึกเป็นร่าง</p>
                </div>
                <button onClick={()=>setForm(f=>({...f,isActive:!f.isActive}))}
                  style={{ color: form.isActive ? '#059669' : '#94a3b8' }}>
                  {form.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            </div>

            {/* Save button */}
            <div className="px-6 pb-6 pt-4 shrink-0 border-t border-[var(--color-border)]">
              <button onClick={handleSave} disabled={saving}
                className="w-full h-12 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ea580c,#7c543c)' }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'สร้างโปรโมชั่น'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
