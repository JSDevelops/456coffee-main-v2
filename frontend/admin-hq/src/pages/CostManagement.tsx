import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Coffee,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Package,
  Percent,
  Coins,
} from 'lucide-react';
import { api } from '../api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Skeleton,
  useToast,
} from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination, paginateItems } from '../components/ui/Pagination';

interface Recipe {
  id: string;
  quantity: number;
  ingredient: { name: string; unit: string; costPerUnit: number };
}
interface Item {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: { name: string } | null;
  recipes: Recipe[];
  cogs: number;
  profit: number;
  marginPercentage: number;
}

type SortKey = 'margin-asc' | 'margin-desc' | 'profit-desc' | 'price-desc' | 'cogs-desc' | 'name';

const MARGIN_THRESHOLDS = {
  good: 50,    // ≥50% — green
  ok: 30,     // 30-50% — accent (orange)
  low: 0,     // <30% — warning
};

function marginTone(pct: number): { color: string; bg: string; label: string } {
  if (pct >= MARGIN_THRESHOLDS.good) return { color: 'var(--success)', bg: 'var(--success-soft)', label: 'ดีมาก' };
  if (pct >= MARGIN_THRESHOLDS.ok) return { color: 'var(--accent)', bg: 'var(--accent-soft)', label: 'ปกติ' };
  if (pct > 0) return { color: 'var(--warning)', bg: 'var(--warning-soft)', label: 'ต่ำ' };
  return { color: 'var(--danger)', bg: 'var(--danger-soft)', label: 'ขาดทุน' };
}

export default function CostManagement() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('margin-asc');
  const [filter, setFilter] = useState<'all' | 'low' | 'noRecipe'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetch = () => {
    setLoading(true);
    api
      .get<Item[]>('/menu/costing')
      .then(setItems)
      .catch((e: any) => toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    let list = items.filter((i) => {
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'low' && i.marginPercentage >= MARGIN_THRESHOLDS.ok) return false;
      if (filter === 'noRecipe' && i.recipes.length > 0) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'margin-asc':  return a.marginPercentage - b.marginPercentage;
        case 'margin-desc': return b.marginPercentage - a.marginPercentage;
        case 'profit-desc': return b.profit - a.profit;
        case 'price-desc':  return b.price - a.price;
        case 'cogs-desc':   return b.cogs - a.cogs;
        case 'name':        return a.name.localeCompare(b.name, 'th');
      }
    });
    return list;
  }, [items, search, filter, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, sortKey, pageSize]);

  const pagedItems = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  // Stats
  const totalRevenue = items.reduce((s, i) => s + i.price, 0);
  const totalCogs = items.reduce((s, i) => s + i.cogs, 0);
  const avgMargin = items.length ? items.reduce((s, i) => s + i.marginPercentage, 0) / items.length : 0;
  const lowMarginCount = items.filter((i) => i.marginPercentage < MARGIN_THRESHOLDS.ok && i.price > 0).length;
  const noRecipeCount = items.filter((i) => i.recipes.length === 0).length;

  return (
    <>
      <PageHeader
        eyebrow="Cost Analysis"
        title="ต้นทุน & กำไร"
        description="วิเคราะห์ต้นทุนวัตถุดิบและอัตรากำไรของแต่ละเมนู"
        actions={<Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={fetch}>รีเฟรช</Button>}
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile loading={loading} label="margin เฉลี่ย" value={`${avgMargin.toFixed(1)}%`} icon={<Percent size={16} />} color={marginTone(avgMargin).color} bg={marginTone(avgMargin).bg} />
        <StatTile loading={loading} label="ราคาขายรวม" value={`฿${totalRevenue.toFixed(0)}`} icon={<TrendingUp size={16} />} color="#10b981" bg="rgba(16,185,129,0.12)" />
        <StatTile loading={loading} label="COGS รวม" value={`฿${totalCogs.toFixed(0)}`} icon={<Coins size={16} />} color="#dc2626" bg="rgba(220,38,38,0.12)" />
        <StatTile loading={loading} label="margin ต่ำ" value={lowMarginCount} sub={`${noRecipeCount} ไม่มีสูตร`} icon={<AlertCircle size={16} />} color="#d97706" bg="rgba(217,119,6,0.12)" />
      </div>

      {/* Filter */}
      <Card padded className="mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเมนู..." className="w-full h-10 pl-10 pr-4 rounded-xl text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex h-10 items-center rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[
                { id: 'all', label: 'ทั้งหมด', count: items.length },
                { id: 'low', label: 'margin ต่ำ', count: lowMarginCount },
                { id: 'noRecipe', label: 'ไม่มีสูตร', count: noRecipeCount },
              ].map((p) => {
                const active = filter === p.id;
                return (
                  <button key={p.id} onClick={() => setFilter(p.id as any)} className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all" style={{
                    background: active ? 'var(--surface)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}>{p.label}<span className="text-[10px] num font-bold opacity-70">{p.count}</span></button>
                );
              })}
            </div>
            <Select containerClassName="min-w-[180px]" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="margin-asc">margin ต่ำ → สูง</option>
              <option value="margin-desc">margin สูง → ต่ำ</option>
              <option value="profit-desc">กำไรมากสุด</option>
              <option value="price-desc">ราคาสูงสุด</option>
              <option value="cogs-desc">COGS สูงสุด</option>
              <option value="name">ชื่อ A → Z</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={<Coffee size={28} />} title="ไม่พบเมนู" description="ลองล้างตัวกรองหรือเพิ่มเมนูใหม่" /></Card>
      ) : (
        <>
          <div className="space-y-3">
            {pagedItems.map((item, idx) => <ItemRow key={item.id} item={item} idx={idx} />)}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="เมนู"
            className="mt-4"
          />
        </>
      )}
    </>
  );
}

function StatTile({ loading, label, value, sub, icon, color, bg }: { loading: boolean; label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <Card padded className="relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: bg }} />
      <div className="relative flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg, color }}>{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      {loading ? <Skeleton className="h-8 w-2/3" /> : (
        <>
          <p className="relative text-2xl font-bold tracking-tight num truncate" style={{ color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="relative text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>{sub}</p>}
        </>
      )}
    </Card>
  );
}

function ItemRow({ item, idx }: { item: Item; idx: number }) {
  const tone = marginTone(item.marginPercentage);
  const noRecipe = item.recipes.length === 0;
  const cogsRatio = item.price > 0 ? (item.cogs / item.price) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
      <Card hover padded={false} className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Item info */}
          <div className="lg:col-span-3 p-4 sm:p-5 flex items-center gap-3" style={{ borderRight: '1px solid var(--border)' }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--surface-2)' }}>
              {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center"><Coffee size={20} style={{ color: 'var(--text-muted)' }} /></div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate" style={{ color: 'var(--text)' }}>{item.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.category?.name || '—'}</p>
              {noRecipe && <Badge tone="warning">ไม่มีสูตร</Badge>}
            </div>
          </div>

          {/* Numbers */}
          <div className="lg:col-span-5 p-4 sm:p-5 grid grid-cols-3 gap-3" style={{ borderRight: '1px solid var(--border)' }}>
            <NumTile icon={<DollarSign size={11} />} label="ราคาขาย" value={`฿${item.price.toFixed(2)}`} tone="info" />
            <NumTile icon={<Coins size={11} />} label="COGS" value={`฿${item.cogs.toFixed(2)}`} sub={`${cogsRatio.toFixed(0)}% ของราคา`} tone="danger" />
            <NumTile icon={item.profit > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} label="กำไร" value={`฿${item.profit.toFixed(2)}`} sub={`${item.marginPercentage.toFixed(1)}%`} tone={tone} />
          </div>

          {/* Margin visualization */}
          <div className="lg:col-span-2 p-4 sm:p-5 flex flex-col justify-center" style={{ borderRight: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>margin</p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-bold num" style={{ color: tone.color }}>{item.marginPercentage.toFixed(1)}%</span>
              <Badge tone={tone.color === 'var(--success)' ? 'success' : tone.color === 'var(--accent)' ? 'accent' : tone.color === 'var(--warning)' ? 'warning' : 'danger'}>
                {tone.label}
              </Badge>
            </div>
            {/* Bar */}
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(item.marginPercentage, 100))}%` }}
                transition={{ duration: 0.6, delay: idx * 0.02 }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: tone.color }}
              />
              {/* threshold ticks */}
              <div className="absolute top-0 bottom-0 w-px opacity-50" style={{ left: '30%', background: 'var(--text-faint)' }} />
              <div className="absolute top-0 bottom-0 w-px opacity-50" style={{ left: '50%', background: 'var(--text-faint)' }} />
            </div>
          </div>

          {/* Recipes */}
          <div className="lg:col-span-2 p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Package size={11} /> สูตร ({item.recipes.length})
            </p>
            {item.recipes.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--warning)' }}>ยังไม่ได้ตั้งค่าสูตร</p>
            ) : (
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {item.recipes.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className="truncate" style={{ color: 'var(--text-2)' }}>{r.ingredient.name}</span>
                    <span className="font-semibold whitespace-nowrap num shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                      {r.quantity}{r.ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function NumTile({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: 'info' | 'danger' | { color: string; bg: string; label: string } }) {
  const fg = typeof tone === 'string' ? (tone === 'info' ? 'var(--info)' : 'var(--danger)') : tone.color;
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center gap-1 mb-0.5" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <p className="text-[9px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-base font-bold num truncate" style={{ color: fg }}>{value}</p>
      {sub && <p className="text-[9px] font-semibold mt-0.5" style={{ color: fg }}>{sub}</p>}
    </div>
  );
}
