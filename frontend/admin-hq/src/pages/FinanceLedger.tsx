import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Search,
  X,
  Wallet,
} from 'lucide-react';
import { api } from '../api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination, paginateItems } from '../components/ui/Pagination';

interface Branch { id: string; name: string }
interface Cashflow {
  id: string;
  type: 'INCOME' | 'EXPENSE' | string;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  SALES: 'ยอดขาย', INGREDIENTS: 'ซื้อวัตถุดิบ', SALARY: 'เงินเดือน',
  UTILITIES: 'ค่าน้ำ-ไฟ', RENT: 'ค่าเช่า', PLATFORM_FEE: 'ค่าธรรมเนียมแพลตฟอร์ม', MISC: 'อื่นๆ',
};
const CATEGORIES = ['SALES', 'INGREDIENTS', 'SALARY', 'UTILITIES', 'RENT', 'PLATFORM_FEE', 'MISC'];

type DatePreset = 'today' | '7d' | '30d' | 'all';
const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'วันนี้' },
  { id: '7d', label: '7 วัน' },
  { id: '30d', label: '30 วัน' },
  { id: 'all', label: 'ทั้งหมด' },
];

function dateAfter(preset: DatePreset): Date | null {
  const d = new Date();
  if (preset === 'today') { d.setHours(0, 0, 0, 0); return d; }
  if (preset === '7d') { d.setDate(d.getDate() - 7); return d; }
  if (preset === '30d') { d.setDate(d.getDate() - 30); return d; }
  return null;
}

export default function FinanceLedger() {
  const toast = useToast();
  const [transactions, setTransactions] = useState<Cashflow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>(localStorage.getItem('admin.branchId') || '');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (branchId) localStorage.setItem('admin.branchId', branchId);
  }, [branchId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchId) params.set('branchId', branchId);
      const [txs, brs] = await Promise.all([
        api.get<Cashflow[]>(`/finance/cashflow?${params}`),
        api.get<Branch[]>('/branches/admin'),
      ]);
      setTransactions(txs);
      setBranches(brs);
      if (!branchId && brs.length > 0) setBranchId(brs[0].id);
    } catch (e: any) {
      toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [branchId, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Apply filters
  const filtered = useMemo(() => {
    const after = dateAfter(datePreset);
    return transactions.filter((tx) => {
      if (after && new Date(tx.createdAt) < after) return false;
      if (typeFilter && tx.type !== typeFilter) return false;
      if (categoryFilter && tx.category !== categoryFilter) return false;
      if (search && !(tx.note || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, datePreset, typeFilter, categoryFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [branchId, datePreset, typeFilter, categoryFilter, search, pageSize]);

  const pagedTransactions = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  // Compute summaries from filtered data
  const totals = useMemo(() => {
    let income = 0, expense = 0;
    filtered.forEach((tx) => {
      if (tx.type === 'INCOME') income += tx.amount;
      else if (tx.type === 'EXPENSE') expense += tx.amount;
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  // Mini chart: last 7 days totals
  const chartData = useMemo(() => {
    const days = 7;
    const buckets: { date: Date; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({ date: d, income: 0, expense: 0 });
    }
    transactions.forEach((tx) => {
      const txDate = new Date(tx.createdAt);
      const idx = buckets.findIndex(
        (b) => b.date.toDateString() === txDate.toDateString(),
      );
      if (idx >= 0) {
        if (tx.type === 'INCOME') buckets[idx].income += tx.amount;
        else if (tx.type === 'EXPENSE') buckets[idx].expense += tx.amount;
      }
    });
    return buckets;
  }, [transactions]);

  const activeCount =
    (datePreset !== '30d' ? 1 : 0) + (typeFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (search ? 1 : 0);
  const reset = () => { setDatePreset('30d'); setTypeFilter(''); setCategoryFilter(''); setSearch(''); };

  return (
    <>
      <PageHeader
        eyebrow="Cashflow"
        title="รายรับ-รายจ่าย"
        description="สมุดบัญชีกระแสเงินสดของแต่ละสาขา พร้อมแยกตามหมวดและประเภท"
        actions={
          <>
            <Select containerClassName="min-w-[180px]" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">— เลือกสาขา —</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={fetchAll}>รีเฟรช</Button>
            <Button leftIcon={<Plus size={14} />} disabled={!branchId} onClick={() => setModalOpen(true)}>ลงบันทึก</Button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard loading={loading} icon={<ArrowDownRight size={18} />} label="รายรับรวม" value={totals.income} tone="success" />
        <SummaryCard loading={loading} icon={<ArrowUpRight size={18} />} label="รายจ่ายรวม" value={totals.expense} tone="danger" />
        <SummaryCard loading={loading} icon={<TrendingUp size={18} />} label="กำไรสุทธิ" value={totals.net} tone={totals.net >= 0 ? 'success' : 'danger'} />
      </div>

      {/* 7-day chart */}
      <Card padded className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>กระแสเงิน 7 วันล่าสุด</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>รายรับ vs รายจ่าย ทุกหมวด</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--success)' }}>
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--success)' }} /> รายรับ
            </span>
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--danger)' }}>
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--danger)' }} /> รายจ่าย
            </span>
          </div>
        </div>
        <CashflowChart data={chartData} loading={loading} />
      </Card>

      {/* Filter bar */}
      <Card padded className="mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาในหมายเหตุ..." className="w-full h-10 pl-10 pr-4 rounded-xl text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex h-10 items-center rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {DATE_PRESETS.map((p) => {
                const active = datePreset === p.id;
                return (
                  <button key={p.id} onClick={() => setDatePreset(p.id)} className="h-8 px-3 rounded-lg text-xs font-semibold transition-all" style={{
                    background: active ? 'var(--surface)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}>{p.label}</button>
                );
              })}
            </div>
            <div className="inline-flex h-10 items-center rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[
                { id: '', label: 'ทั้งหมด', color: 'var(--text-muted)' },
                { id: 'INCOME', label: 'รายรับ', color: 'var(--success)' },
                { id: 'EXPENSE', label: 'รายจ่าย', color: 'var(--danger)' },
              ].map((p) => {
                const active = typeFilter === p.id;
                return (
                  <button key={p.id || 'all'} onClick={() => setTypeFilter(p.id)} className="h-8 px-3 rounded-lg text-xs font-semibold transition-all" style={{
                    background: active ? 'var(--surface)' : 'transparent',
                    color: active ? p.color : 'var(--text-muted)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}>{p.label}</button>
                );
              })}
            </div>
            <Select containerClassName="min-w-[160px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">ทุกหมวด</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </Select>
            {activeCount > 0 && (
              <button onClick={reset} className="h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
                <X size={14} /> ล้าง <span className="text-[10px] num font-bold">{activeCount}</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Ledger */}
      <Card padded={false}>
        {loading ? (
          <div className="p-5 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !branchId ? (
          <EmptyState icon={<Banknote size={28} />} title="กรุณาเลือกสาขา" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Banknote size={28} />} title="ไม่พบรายการ" description="ลองล้างตัวกรองหรือเปลี่ยนช่วงเวลา" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th className="px-4 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>เวลา</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>หมวด</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>หมายเหตุ</th>
                    <th className="px-4 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>จำนวน</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTransactions.map((tx, idx) => {
                    const income = tx.type === 'INCOME';
                    return (
                      <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 sm:px-6 py-3 text-xs num" style={{ color: 'var(--text-muted)' }}>
                          {new Date(tx.createdAt).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={income ? 'success' : 'danger'} icon={income ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}>
                            {CATEGORY_LABEL[tx.category] || tx.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-2)' }}>{tx.note || '—'}</td>
                        <td className="px-4 sm:px-6 py-3 text-right font-bold num" style={{ color: income ? 'var(--success)' : 'var(--danger)' }}>
                          {income ? '+' : '-'}฿{tx.amount.toLocaleString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="รายการ"
              className="m-4"
            />
          </>
        )}
      </Card>

      {modalOpen && branchId && (
        <FinanceModal branchId={branchId} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchAll(); }} />
      )}
    </>
  );
}

function SummaryCard({ loading, icon, label, value, tone }: { loading: boolean; icon: React.ReactNode; label: string; value: number; tone: 'success' | 'danger' }) {
  const fg = tone === 'success' ? 'var(--success)' : 'var(--danger)';
  const bg = tone === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)';
  return (
    <Card padded className="relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: bg }} />
      <div className="relative flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg, color: fg }}>{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      {loading ? <Skeleton className="h-9 w-2/3" /> : (
        <p className="relative text-3xl font-bold tracking-tight num truncate" style={{ color: fg }}>
          {value < 0 ? '-' : ''}฿{Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      )}
    </Card>
  );
}

function CashflowChart({ data, loading }: { data: { date: Date; income: number; expense: number }[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-44 w-full" />;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-44">
      {data.map((d, idx) => {
        const incomeRatio = (d.income / max) * 100;
        const expenseRatio = (d.expense / max) * 100;
        const isToday = idx === data.length - 1;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '100%' }}>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(incomeRatio, d.income > 0 ? 4 : 0)}%` }} transition={{ duration: 0.6, delay: idx * 0.05 }}
                className="flex-1 rounded-t" style={{ background: 'var(--success)', minHeight: d.income > 0 ? '4px' : '0' }} />
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(expenseRatio, d.expense > 0 ? 4 : 0)}%` }} transition={{ duration: 0.6, delay: idx * 0.05 + 0.05 }}
                className="flex-1 rounded-t" style={{ background: 'var(--danger)', minHeight: d.expense > 0 ? '4px' : '0' }} />
            </div>
            <p className="text-[10px] font-bold" style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>
              {d.date.toLocaleDateString('th-TH', { weekday: 'short' })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FinanceModal({ branchId, onClose, onSaved }: { branchId: string; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('INGREDIENTS');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!amount) return;
    setSaving(true);
    try {
      await api.post('/finance/cashflow', { branchId, type, category, amount: parseFloat(amount), note });
      toast.success('ลงบันทึกสำเร็จ');
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="ลงบันทึกรายการเงิน"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={submit} loading={saving} disabled={!amount}>บันทึก</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>ประเภท</label>
          <div className="grid grid-cols-2 gap-2">
            {(['INCOME', 'EXPENSE'] as const).map((t) => {
              const active = type === t;
              const success = t === 'INCOME';
              return (
                <button key={t} onClick={() => setType(t)} className="h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{
                  background: active ? (success ? 'var(--success-soft)' : 'var(--danger-soft)') : 'var(--surface-2)',
                  color: active ? (success ? 'var(--success)' : 'var(--danger)') : 'var(--text-2)',
                  border: `1px solid ${active ? (success ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                }}>
                  {success ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                  {success ? 'รายรับ' : 'รายจ่าย'}
                </button>
              );
            })}
          </div>
        </div>
        <Select label="หมวด" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </Select>
        <Input leftIcon={<Wallet size={14} />} label="จำนวนเงิน (฿)" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Textarea label="หมายเหตุ" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
