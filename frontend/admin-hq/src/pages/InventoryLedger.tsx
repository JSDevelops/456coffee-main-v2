import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Package, ArrowDown, ArrowUp, RotateCcw,
  Boxes, Search, AlertTriangle, TrendingDown, Coins, Activity,
  Edit2, Trash2, RefreshCw, ChevronRight, BookOpen, BarChart3,
  Bell, CheckCircle, X, Save, Beaker, Download,
} from 'lucide-react';
import { api } from '../api';
import {
  Badge, Button, Card, EmptyState, Input, Modal, Select,
  Skeleton, Textarea, useToast,
} from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination, paginateItems } from '../components/ui/Pagination';
import { exportToExcel } from '../lib/excelExporter';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Branch { id: string; name: string }
interface Ingredient {
  id: string; name: string; unit: string; costPerUnit: number; sku: string | null;
  recipeCount?: number; inventoryCount?: number;
}
interface InventoryRow {
  id: string; branchId: string; ingredientId: string;
  quantity: number; lowStockThreshold: number;
  ingredient: Ingredient;
  branch?: { id: string; name: string };
}
interface Tx {
  id: string; branchId: string; ingredientId: string; type: string;
  quantity: number; unitCost: number; totalCost: number;
  note: string | null; createdAt: string;
  ingredient: { name: string; unit: string };
}
interface SummaryItem {
  ingredientId: string; name: string; unit: string; sku: string | null;
  costPerUnit: number; quantity: number; lowStockThreshold: number;
  totalValue: number; status: 'OK' | 'LOW' | 'OUT_OF_STOCK';
}
interface SummaryData {
  totalValue: number; itemCount: number; lowStockCount: number; outOfStockCount: number;
  items: SummaryItem[];
}
interface Product { id: string; name: string; recipes: RecipeItem[] }
interface RecipeItem {
  id: string; productId: string; ingredientId: string; quantity: number;
  ingredient: { name: string; unit: string; costPerUnit: number };
}

const TYPE_CFG: Record<string, { label: string; tone: 'success'|'warning'|'danger'|'info'|'neutral'; icon: React.ComponentType<{size?:number}> }> = {
  STOCK_IN:        { label: 'รับเข้า',     tone: 'success', icon: ArrowDown },
  STOCK_OUT:       { label: 'จ่ายออก',     tone: 'warning', icon: ArrowUp },
  WASTE:           { label: 'ของเสีย',     tone: 'danger',  icon: AlertTriangle },
  ORDER_DEDUCTION: { label: 'ตัดออเดอร์',  tone: 'info',    icon: Activity },
  ADJUSTMENT:      { label: 'ปรับยอด',     tone: 'neutral', icon: RotateCcw },
};

type Tab = 'stock' | 'history' | 'recipes' | 'alerts' | 'report';

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InventoryLedger() {
  const toast = useToast();
  const [tab, setTab]     = useState<Tab>('stock');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>(localStorage.getItem('admin.branchId') || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stock, setStock] = useState<InventoryRow[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [lowStock, setLowStock] = useState<InventoryRow[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stockPage, setStockPage]   = useState(1);
  const [histPage, setHistPage]     = useState(1);
  const [pageSize, setPageSize]     = useState(25);
  const [reportSearch, setReportSearch] = useState('');

  // Modals
  const [txModal, setTxModal]     = useState(false);
  const [ingModal, setIngModal]   = useState(false);
  const [thrModal, setThrModal]   = useState<InventoryRow | null>(null);

  useEffect(() => { if (branchId) localStorage.setItem('admin.branchId', branchId); }, [branchId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (branchId) p.set('branchId', branchId);
      const [txs, ings, brs, stockData, lowData, sumData, prods] = await Promise.all([
        api.get<Tx[]>(`/inventory/transactions?${p}`),
        api.get<Ingredient[]>('/products/ingredients/usage'),
        api.get<Branch[]>('/branches/admin'),
        branchId ? api.get<InventoryRow[]>(`/branches/${branchId}/inventory`) : Promise.resolve<InventoryRow[]>([]),
        branchId ? api.get<InventoryRow[]>(`/inventory/low-stock?${p}`) : Promise.resolve<InventoryRow[]>([]),
        branchId ? api.get<SummaryData>(`/inventory/summary?${p}`) : Promise.resolve<SummaryData | null>(null),
        api.get<Product[]>('/products'),
      ]);
      setTransactions(txs); setIngredients(ings); setBranches(brs);
      setStock(stockData); setLowStock(lowData); setSummary(sumData); setProducts(prods);
      if (!branchId && brs.length > 0) setBranchId(brs[0].id);
    } catch (e: any) { toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ'); }
    finally { setLoading(false); }
  }, [branchId, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filtered
  const filteredTxs = useMemo(() => transactions.filter(tx => {
    if (typeFilter && tx.type !== typeFilter) return false;
    if (search) { const q = search.toLowerCase(); return tx.ingredient?.name.toLowerCase().includes(q) || (tx.note||'').toLowerCase().includes(q); }
    return true;
  }), [transactions, typeFilter, search]);

  const filteredStock = useMemo(() => {
    if (!search) return stock;
    return stock.filter(s => s.ingredient.name.toLowerCase().includes(search.toLowerCase()));
  }, [stock, search]);

  const filteredReport = useMemo(() => {
    if (!summary) return [];
    if (!reportSearch) return summary.items;
    return summary.items.filter(i => i.name.toLowerCase().includes(reportSearch.toLowerCase()));
  }, [summary, reportSearch]);

  useEffect(() => { setStockPage(1); setHistPage(1); }, [branchId, tab, search, typeFilter, pageSize]);

  const pagedStock = useMemo(() => paginateItems(filteredStock, stockPage, pageSize), [filteredStock, stockPage, pageSize]);
  const pagedTxs   = useMemo(() => paginateItems(filteredTxs, histPage, pageSize), [filteredTxs, histPage, pageSize]);

  // Stats
  const lowStockCount = stock.filter(s => s.quantity <= s.lowStockThreshold).length;
  const totalValue    = stock.reduce((s, r) => s + r.quantity * (r.ingredient.costPerUnit || 0), 0);
  const todayTxs      = transactions.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length;

  const TABS: Array<{id:Tab; label:string; icon:React.ReactNode; count?:number; warn?:boolean}> = [
    { id:'stock',   label:'สต็อก',     icon:<Package size={14}/>, count:stock.length },
    { id:'history', label:'ประวัติ',   icon:<ClipboardList size={14}/>, count:transactions.length },
    { id:'recipes', label:'สูตร',      icon:<Beaker size={14}/>, count:products.length },
    { id:'alerts',  label:'แจ้งเตือน', icon:<Bell size={14}/>, count:lowStock.length, warn:lowStock.length>0 },
    { id:'report',  label:'รายงาน',   icon:<BarChart3 size={14}/> },
  ];

  const handleExportCsv = () => {
    const stockRows = (filteredStock || []).map((s) => {
      const totalVal = s.quantity * (s.ingredient.costPerUnit || 0);
      const statusLabel = s.quantity <= 0 ? 'หมดสต็อก' : s.quantity <= s.lowStockThreshold ? 'สต็อกต่ำ' : 'ปกติ';
      return {
        'ชื่อวัตถุดิบ': s.ingredient.name,
        'SKU': s.ingredient.sku || '-',
        'คงเหลือ': s.quantity,
        'หน่วย': s.ingredient.unit,
        'ต้นทุน/หน่วย (บาท)': s.ingredient.costPerUnit,
        'มูลค่ารวมสต็อก (บาท)': Number(totalVal.toFixed(2)),
        'จุดสั่งซื้อขั้นต่ำ': s.lowStockThreshold,
        'สถานะสต็อก': statusLabel,
      };
    });

    const txRows = (filteredTxs || []).map((t) => {
      const typeLabel = TYPE_CFG[t.type]?.label || t.type;
      const dateStr = new Date(t.createdAt).toLocaleString('th-TH');
      return {
        'วันเวลา': dateStr,
        'ประเภทรายการ': typeLabel,
        'วัตถุดิบ': t.ingredient?.name || '-',
        'จำนวน': t.quantity,
        'หน่วย': t.ingredient?.unit || '',
        'ต้นทุน/หน่วย (บาท)': t.unitCost,
        'มูลค่ารวม (บาท)': t.totalCost,
        'หมายเหตุ': t.note || '-',
      };
    });

    if (stockRows.length === 0 && txRows.length === 0) {
      toast.error('ไม่มีข้อมูลสต็อกหรือประวัติสำหรับ Export');
      return;
    }

    const sheets = [];
    if (stockRows.length > 0) {
      sheets.push({ sheetName: 'สต็อกคงเหลือ', data: stockRows });
    }
    if (txRows.length > 0) {
      sheets.push({ sheetName: 'ประวัติการรับ-เบิก', data: txRows });
    }

    exportToExcel({
      filename: '456coffee_inventory',
      sheets,
    });

    toast.success('ส่งออกข้อมูลคลังวัตถุดิบเป็นไฟล์ Excel (.xlsx) สำเร็จ');
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="คลังวัตถุดิบ"
        description="จัดการสต็อก สูตรวัตถุดิบ และรายงานมูลค่าคลัง"
        actions={
          <>
            <Select containerClassName="min-w-[180px]" value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">— เลือกสาขา —</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Button variant="secondary" leftIcon={<RefreshCw size={14}/>} onClick={fetchAll}>รีเฟรช</Button>
            <Button variant="secondary" leftIcon={<Download size={14}/>} onClick={handleExportCsv}>Export Excel</Button>
            <Button variant="secondary" leftIcon={<Boxes size={14}/>} onClick={() => setIngModal(true)}>วัตถุดิบ</Button>
            <Button leftIcon={<Plus size={14}/>} disabled={!branchId} onClick={() => setTxModal(true)}>ลงบันทึก</Button>
          </>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile loading={loading} label="วัตถุดิบทั้งหมด" value={ingredients.length} icon={<Boxes size={16}/>} color="#ea580c" bg="rgba(234,88,12,0.12)"/>
        <StatTile loading={loading} label="มูลค่าสต็อก" value={`฿${totalValue.toFixed(0)}`} icon={<Coins size={16}/>} color="#10b981" bg="rgba(16,185,129,0.12)"/>
        <StatTile loading={loading} label="ต่ำกว่าขั้นต่ำ" value={lowStockCount} icon={<TrendingDown size={16}/>} color="#dc2626" bg="rgba(220,38,38,0.12)"/>
        <StatTile loading={loading} label="เคลื่อนไหววันนี้" value={todayTxs} icon={<Activity size={16}/>} color="#0891b2" bg="rgba(8,145,178,0.12)"/>
      </div>

      {/* Tabs + filter */}
      <Card padded className="mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="inline-flex h-10 items-center rounded-xl p-1 shrink-0 flex-wrap gap-1"
            style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 relative"
                  style={{background:active?'var(--surface)':'transparent',color:active?'var(--accent)':'var(--text-muted)',boxShadow:active?'var(--shadow-sm)':'none'}}>
                  {t.icon}{t.label}
                  {t.count !== undefined && <span className="text-[10px] font-bold opacity-70">{t.count}</span>}
                  {t.warn && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"/>}
                </button>
              );
            })}
          </div>

          {(tab === 'stock' || tab === 'history') && (
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--text-muted)'}}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={tab==='stock' ? 'ค้นหาวัตถุดิบ...' : 'ค้นหาประวัติ / หมายเหตุ...'}
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm"
                style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text)'}}/>
            </div>
          )}
          {tab === 'history' && (
            <Select containerClassName="min-w-[160px]" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">ทุกประเภท</option>
              {Object.entries(TYPE_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          )}
          {tab === 'report' && (
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--text-muted)'}}/>
              <input value={reportSearch} onChange={e => setReportSearch(e.target.value)}
                placeholder="ค้นหาวัตถุดิบในรายงาน..."
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm"
                style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text)'}}/>
            </div>
          )}
        </div>
      </Card>

      {/* Content */}
      {!branchId && tab !== 'recipes' ? (
        <Card><EmptyState icon={<ClipboardList size={28}/>} title="กรุณาเลือกสาขา" description="เลือกสาขาที่มุมขวาบนเพื่อดูข้อมูลคลัง"/></Card>
      ) : loading ? (
        <Card padded><Skeleton className="h-72 w-full"/></Card>
      ) : (
        <>
          {tab === 'stock' && (
            <>
              <StockGrid items={pagedStock} total={filteredStock.length}
                onThreshold={row => setThrModal(row)}
                onQuickStockIn={row => {
                  // open tx modal pre-filled — handled via state
                  setTxModal(true);
                }}
              />
              {filteredStock.length > 0 && (
                <Pagination page={stockPage} pageSize={pageSize} total={filteredStock.length}
                  onPageChange={setStockPage} onPageSizeChange={setPageSize} itemLabel="วัตถุดิบ" className="mt-4"/>
              )}
            </>
          )}

          {tab === 'history' && (
            <>
              <HistoryTable txs={pagedTxs} total={filteredTxs.length}/>
              {filteredTxs.length > 0 && (
                <Pagination page={histPage} pageSize={pageSize} total={filteredTxs.length}
                  onPageChange={setHistPage} onPageSizeChange={setPageSize} itemLabel="รายการ" className="mt-4"/>
              )}
            </>
          )}

          {tab === 'recipes' && (
            <RecipesTab products={products} ingredients={ingredients} onSaved={fetchAll}/>
          )}

          {tab === 'alerts' && (
            <AlertsTab
              lowStock={lowStock}
              branchId={branchId}
              onSaved={fetchAll}
              onThreshold={row => setThrModal(row)}
            />
          )}

          {tab === 'report' && (
            <ReportTab summary={summary} items={filteredReport} loading={loading}/>
          )}
        </>
      )}

      {/* Modals */}
      {txModal && branchId && (
        <TxModal branchId={branchId} ingredients={ingredients} onClose={() => setTxModal(false)} onSaved={() => { setTxModal(false); fetchAll(); }}/>
      )}
      {ingModal && (
        <IngredientsModal ingredients={ingredients} onClose={() => setIngModal(false)} onSaved={fetchAll}/>
      )}
      {thrModal && branchId && (
        <ThresholdModal row={thrModal} branchId={branchId} onClose={() => setThrModal(null)} onSaved={() => { setThrModal(null); fetchAll(); }}/>
      )}
    </>
  );
}

// ─── StatTile ─────────────────────────────────────────────────────────────────
function StatTile({ loading, label, value, icon, color, bg }:
  { loading:boolean; label:string; value:number|string; icon:React.ReactNode; color:string; bg:string }) {
  return (
    <Card padded className="relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{background:bg}}/>
      <div className="relative flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:bg,color}}>{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--text-muted)'}}>{label}</p>
      </div>
      {loading ? <Skeleton className="h-8 w-2/3"/> : (
        <p className="relative text-2xl font-bold tracking-tight num truncate" style={{color:'var(--text)'}}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      )}
    </Card>
  );
}

// ─── StockGrid ────────────────────────────────────────────────────────────────
function StockGrid({ items, total, onThreshold, onQuickStockIn }:
  { items:InventoryRow[]; total:number; onThreshold:(r:InventoryRow)=>void; onQuickStockIn:(r:InventoryRow)=>void }) {
  if (total === 0) return <Card><EmptyState icon={<Package size={28}/>} title="ไม่พบวัตถุดิบในสต็อก" description="เพิ่มสต็อกใหม่ผ่านปุ่ม 'ลงบันทึก'"/></Card>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((s, idx) => {
        const low   = s.quantity <= s.lowStockThreshold;
        const out   = s.quantity <= 0;
        const value = s.quantity * (s.ingredient.costPerUnit || 0);
        const pct   = Math.min((s.quantity / Math.max(s.lowStockThreshold * 3, 1)) * 100, 100);
        return (
          <motion.div key={s.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.02}}>
            <Card padded className="relative overflow-hidden">
              {out && <div className="absolute top-0 left-0 right-0 h-1" style={{background:'var(--danger)'}}/>}
              {!out && low && <div className="absolute top-0 left-0 right-0 h-1" style={{background:'#f59e0b'}}/>}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{background: out?'rgba(239,68,68,0.1)':low?'rgba(245,158,11,0.1)':'var(--accent-soft)',
                            color: out?'var(--danger)':low?'#f59e0b':'var(--accent)'}}>
                    <Package size={16}/>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{color:'var(--text)'}}>{s.ingredient.name}</p>
                    <p className="text-[10px]" style={{color:'var(--text-muted)'}}>
                      {s.ingredient.sku ? `${s.ingredient.sku} · ` : ''}฿{s.ingredient.costPerUnit.toFixed(2)}/{s.ingredient.unit}
                    </p>
                  </div>
                </div>
                {out ? <Badge tone="danger">หมด</Badge> : low ? <Badge tone="warning">ต่ำ</Badge> : null}
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{color:'var(--text-muted)'}}>คงเหลือ</p>
                  <p className="text-2xl font-bold num" style={{color:out?'var(--danger)':low?'#f59e0b':'var(--text)'}}>
                    {s.quantity.toLocaleString()} <span className="text-sm font-medium" style={{color:'var(--text-muted)'}}>{s.ingredient.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{color:'var(--text-muted)'}}>มูลค่า</p>
                  <p className="text-base font-bold num" style={{color:'var(--accent)'}}>฿{value.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{background:'var(--surface-2)'}}>
                <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:out?'var(--danger)':low?'#f59e0b':'var(--accent)'}}/>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px]" style={{color:'var(--text-faint)'}}>ขั้นต่ำ {s.lowStockThreshold.toLocaleString()} {s.ingredient.unit}</p>
                <button onClick={() => onThreshold(s)}
                  className="text-[10px] font-bold px-2 h-5 rounded-md flex items-center gap-1"
                  style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>
                  <Edit2 size={10}/> ขั้นต่ำ
                </button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── HistoryTable ─────────────────────────────────────────────────────────────
function HistoryTable({ txs, total }: { txs:Tx[]; total:number }) {
  if (total === 0) return <Card><EmptyState icon={<ClipboardList size={28}/>} title="ยังไม่มีประวัติ"/></Card>;
  return (
    <Card padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr style={{background:'var(--surface-2)'}}>
              {['เวลา','วัตถุดิบ','ประเภท','จำนวน','ต้นทุน/หน่วย','มูลค่า','หมายเหตุ'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{color:'var(--text-muted)'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txs.map((tx, idx) => {
              const cfg = TYPE_CFG[tx.type] || TYPE_CFG.ADJUSTMENT;
              const Icon = cfg.icon;
              return (
                <motion.tr key={tx.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:idx*0.01}}
                  style={{borderTop:'1px solid var(--border)'}}>
                  <td className="px-4 py-3 text-xs num" style={{color:'var(--text-muted)'}}>
                    {new Date(tx.createdAt).toLocaleString('th-TH',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td className="px-4 py-3 font-semibold text-sm" style={{color:'var(--text)'}}>{tx.ingredient?.name}</td>
                  <td className="px-4 py-3"><Badge tone={cfg.tone} icon={<Icon size={11}/>}>{cfg.label}</Badge></td>
                  <td className="px-4 py-3 text-right text-sm font-bold num" style={{color:tx.quantity>0?'var(--success)':'var(--danger)'}}>
                    {tx.quantity>0?'+':''}{tx.quantity} {tx.ingredient?.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-sm num" style={{color:'var(--text-2)'}}>฿{tx.unitCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold num" style={{color:'var(--text)'}}>฿{Math.abs(tx.totalCost).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs" style={{color:'var(--text-muted)'}}>{tx.note||'—'}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── RecipesTab ───────────────────────────────────────────────────────────────
function RecipesTab({ products, ingredients, onSaved }:
  { products:Product[]; ingredients:Ingredient[]; onSaved:()=>void }) {
  const toast = useToast();
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [addIng, setAddIng]   = useState('');
  const [addQty, setAddQty]   = useState('');
  const [saving, setSaving]   = useState(false);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const cur = selected ? products.find(p => p.id === selected.id) : null;

  const addRecipe = async () => {
    if (!selected || !addIng || !addQty) return;
    setSaving(true);
    try {
      await api.post(`/products/${selected.id}/recipes`, { ingredientId: addIng, quantity: parseFloat(addQty) });
      toast.success('เพิ่มวัตถุดิบในสูตรสำเร็จ');
      setAddIng(''); setAddQty('');
      await onSaved();
    } catch (e:any) { toast.error(e?.message||'เพิ่มไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const removeRecipe = async (recipeId: string) => {
    try {
      await api.delete(`/recipes/${recipeId}`);
      toast.success('ลบออกจากสูตรแล้ว');
      await onSaved();
    } catch (e:any) { toast.error(e?.message||'ลบไม่สำเร็จ'); }
  };

  const updateRecipe = async (recipeId: string, qty: number) => {
    try {
      await api.patch(`/recipes/${recipeId}`, { quantity: qty });
      toast.success('อัปเดตแล้ว');
      await onSaved();
    } catch (e:any) { toast.error(e?.message||'อัปเดตไม่สำเร็จ'); }
  };

  const totalCost = (cur?.recipes || []).reduce((s, r) => s + r.quantity * r.ingredient.costPerUnit, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Product list */}
      <Card padded={false}>
        <div className="p-3 border-b" style={{borderColor:'var(--border)'}}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--text-muted)'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเมนู..."
              className="w-full h-9 pl-9 pr-3 rounded-lg text-sm"
              style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text)'}}/>
          </div>
        </div>
        <div className="overflow-y-auto" style={{maxHeight:'500px'}}>
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelected(p)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
              style={{
                background: selected?.id===p.id ? 'var(--accent-soft)' : 'transparent',
                borderBottom: '1px solid var(--border)',
                color: selected?.id===p.id ? 'var(--accent)' : 'var(--text)',
              }}>
              <div>
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-[10px]" style={{color:'var(--text-muted)'}}>{p.recipes.length} วัตถุดิบ</p>
              </div>
              <ChevronRight size={14} style={{color:'var(--text-muted)'}}/>
            </button>
          ))}
          {filtered.length === 0 && <p className="p-6 text-sm text-center" style={{color:'var(--text-muted)'}}>ไม่พบเมนู</p>}
        </div>
      </Card>

      {/* Recipe detail */}
      <div className="lg:col-span-2 space-y-3">
        {!selected ? (
          <Card><EmptyState icon={<BookOpen size={28}/>} title="เลือกเมนูเพื่อดูสูตร" description="คลิกเมนูทางซ้าย"/></Card>
        ) : (
          <>
            <Card padded>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-base" style={{color:'var(--text)'}}>{selected.name}</h3>
                  <p className="text-xs" style={{color:'var(--text-muted)'}}>สูตรวัตถุดิบต่อ 1 แก้ว/ชิ้น</p>
                </div>
                {totalCost > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase" style={{color:'var(--text-muted)'}}>ต้นทุนต่อหน่วย</p>
                    <p className="text-xl font-extrabold num" style={{color:'var(--accent)'}}>฿{totalCost.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Recipe items */}
              <div className="space-y-2 mb-4">
                {(cur?.recipes || []).map(r => (
                  <RecipeRow key={r.id} recipe={r} onDelete={() => removeRecipe(r.id)} onUpdate={(qty) => updateRecipe(r.id, qty)}/>
                ))}
                {(cur?.recipes||[]).length === 0 && (
                  <p className="text-sm italic text-center py-4" style={{color:'var(--text-muted)'}}>ยังไม่มีวัตถุดิบในสูตร</p>
                )}
              </div>

              {/* Add */}
              <div className="flex gap-2 items-end pt-3" style={{borderTop:'1px solid var(--border)'}}>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{color:'var(--text-muted)'}}>วัตถุดิบ</label>
                  <select value={addIng} onChange={e=>setAddIng(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm"
                    style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text)'}}>
                    <option value="">— เลือก —</option>
                    {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-bold uppercase mb-1" style={{color:'var(--text-muted)'}}>จำนวน</label>
                  <input type="number" step="any" min="0" value={addQty} onChange={e=>setAddQty(e.target.value)}
                    placeholder="0" className="w-full h-9 px-3 rounded-lg text-sm"
                    style={{background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text)'}}/>
                </div>
                <Button onClick={addRecipe} disabled={!addIng||!addQty||saving} leftIcon={<Plus size={14}/>}>
                  เพิ่ม
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function RecipeRow({ recipe, onDelete, onUpdate }:
  { recipe:RecipeItem; onDelete:()=>void; onUpdate:(qty:number)=>void }) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty]         = useState(recipe.quantity.toString());
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{color:'var(--text)'}}>{recipe.ingredient.name}</p>
        <p className="text-[10px]" style={{color:'var(--text-muted)'}}>
          ฿{recipe.ingredient.costPerUnit.toFixed(2)}/{recipe.ingredient.unit}
          {' · '}รวม ฿{(recipe.quantity*recipe.ingredient.costPerUnit).toFixed(2)}
        </p>
      </div>
      {editing ? (
        <>
          <input type="number" step="any" min="0" value={qty} onChange={e=>setQty(e.target.value)}
            className="w-20 h-8 px-2 rounded-lg text-sm text-center"
            style={{background:'var(--surface)',border:'1.5px solid var(--accent)',color:'var(--text)'}}/>
          <span className="text-xs" style={{color:'var(--text-muted)'}}>{recipe.ingredient.unit}</span>
          <button onClick={() => { onUpdate(parseFloat(qty)||0); setEditing(false); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'var(--accent)',color:'#fff'}}>
            <Save size={12}/>
          </button>
          <button onClick={() => setEditing(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'var(--surface)',color:'var(--text-muted)'}}>
            <X size={12}/>
          </button>
        </>
      ) : (
        <>
          <span className="text-sm font-bold num" style={{color:'var(--text)'}}>{recipe.quantity} {recipe.ingredient.unit}</span>
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'var(--surface)',color:'var(--text-muted)'}}>
            <Edit2 size={12}/>
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'rgba(239,68,68,0.08)',color:'#ef4444'}}>
            <Trash2 size={12}/>
          </button>
        </>
      )}
    </div>
  );
}

// ─── AlertsTab ────────────────────────────────────────────────────────────────
function AlertsTab({ lowStock, branchId, onSaved, onThreshold }:
  { lowStock:InventoryRow[]; branchId:string; onSaved:()=>void; onThreshold:(r:InventoryRow)=>void }) {
  const toast = useToast();
  const [quickIn, setQuickIn] = useState<{row:InventoryRow;qty:string}|null>(null);
  const [saving, setSaving]   = useState(false);

  const doStockIn = async () => {
    if (!quickIn||!quickIn.qty) return;
    setSaving(true);
    try {
      await api.post('/inventory/transactions', {
        branchId,
        ingredientId: quickIn.row.ingredientId,
        type: 'STOCK_IN',
        quantity: parseFloat(quickIn.qty),
        note: 'เติมสต็อก (Quick Stock-In)',
      });
      toast.success(`เติมสต็อก ${quickIn.row.ingredient.name} สำเร็จ`);
      setQuickIn(null);
      await onSaved();
    } catch (e:any) { toast.error(e?.message||'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  if (lowStock.length === 0) {
    return (
      <Card padded className="text-center">
        <CheckCircle size={40} className="mx-auto mb-3" style={{color:'#10b981'}}/>
        <p className="font-bold text-lg" style={{color:'var(--text)'}}>สต็อกปกติทั้งหมด 🎉</p>
        <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>ไม่มีวัตถุดิบต่ำกว่าขั้นต่ำ</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle size={16} style={{color:'#ef4444'}}/>
        <p className="text-sm font-bold" style={{color:'#ef4444'}}>มี {lowStock.length} รายการ ต่ำกว่าขั้นต่ำ</p>
      </div>
      {lowStock.map(row => {
        const out = row.quantity <= 0;
        const pct = Math.max(0, Math.min((row.quantity / Math.max(row.lowStockThreshold, 1)) * 100, 100));
        return (
          <Card padded key={row.id} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{background: out?'var(--danger)':'#f59e0b'}}/>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{background: out?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',
                        color: out?'var(--danger)':'#f59e0b'}}>
                {out ? <AlertTriangle size={20}/> : <TrendingDown size={20}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm" style={{color:'var(--text)'}}>{row.ingredient.name}</p>
                  <Badge tone={out?'danger':'warning'}>{out?'หมด':'ต่ำ'}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{color:'var(--text-muted)'}}>
                  <span>คงเหลือ <strong className="num" style={{color:out?'var(--danger)':'#f59e0b'}}>{row.quantity}</strong> {row.ingredient.unit}</span>
                  <span>ขั้นต่ำ {row.lowStockThreshold} {row.ingredient.unit}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{background:'var(--surface-2)'}}>
                  <div className="h-full rounded-full" style={{width:`${pct}%`,background:out?'var(--danger)':'#f59e0b'}}/>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onThreshold(row)}
                  className="h-9 px-3 rounded-xl text-xs font-bold"
                  style={{background:'var(--surface-2)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>
                  แก้ขั้นต่ำ
                </button>
                {quickIn?.row.id === row.id ? (
                  <div className="flex items-center gap-1">
                    <input type="number" step="any" min="0" value={quickIn.qty}
                      onChange={e=>setQuickIn({...quickIn,qty:e.target.value})}
                      autoFocus placeholder="จำนวน"
                      className="w-20 h-9 px-2 rounded-lg text-sm text-center"
                      style={{background:'var(--surface-2)',border:'1.5px solid var(--accent)',color:'var(--text)'}}/>
                    <span className="text-xs" style={{color:'var(--text-muted)'}}>{row.ingredient.unit}</span>
                    <button onClick={doStockIn} disabled={saving}
                      className="h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-50"
                      style={{background:'#10b981',color:'#fff'}}>
                      {saving?'..':'ยืนยัน'}
                    </button>
                    <button onClick={() => setQuickIn(null)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center"
                      style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>
                      <X size={14}/>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setQuickIn({row,qty:''})}
                    className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    style={{background:'var(--accent)',color:'#fff'}}>
                    <ArrowDown size={13}/> Stock-In
                  </button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── ReportTab ────────────────────────────────────────────────────────────────
function ReportTab({ summary, items, loading }:
  { summary:SummaryData|null; items:SummaryItem[]; loading:boolean }) {
  if (loading) return <Card padded><Skeleton className="h-72 w-full"/></Card>;
  if (!summary) return <Card><EmptyState icon={<BarChart3 size={28}/>} title="เลือกสาขาเพื่อดูรายงาน"/></Card>;

  const statusColor = (s:string) => s==='OUT_OF_STOCK'?'#ef4444':s==='LOW'?'#f59e0b':'#10b981';

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'มูลค่าคลังรวม', value:`฿${summary.totalValue.toLocaleString('th-TH',{maximumFractionDigits:0})}`, color:'#10b981'},
          {label:'รายการทั้งหมด', value:summary.itemCount, color:'var(--accent)'},
          {label:'สต็อกต่ำ', value:summary.lowStockCount, color:'#f59e0b'},
          {label:'สต็อกหมด', value:summary.outOfStockCount, color:'#ef4444'},
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
            <p className="text-xs font-semibold mb-1" style={{color:'var(--text-muted)'}}>{s.label}</p>
            <p className="text-2xl font-extrabold num" style={{color:s.color}}>{typeof s.value==='number'?s.value.toLocaleString():s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr style={{background:'var(--surface-2)'}}>
                {['วัตถุดิบ','SKU','คงเหลือ','ขั้นต่ำ','ต้นทุน/หน่วย','มูลค่า','สถานะ'].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{color:'var(--text-muted)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.ingredientId} style={{borderTop:'1px solid var(--border)',background:idx%2===0?'transparent':'var(--surface-2)'}}>
                  <td className="px-4 py-2.5 font-semibold text-sm" style={{color:'var(--text)'}}>{item.name}</td>
                  <td className="px-4 py-2.5 text-xs num" style={{color:'var(--text-muted)'}}>{item.sku||'—'}</td>
                  <td className="px-4 py-2.5 text-sm font-bold num" style={{color:statusColor(item.status)}}>
                    {item.quantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-4 py-2.5 text-sm num" style={{color:'var(--text-muted)'}}>{item.lowStockThreshold}</td>
                  <td className="px-4 py-2.5 text-sm num" style={{color:'var(--text)'}}>฿{item.costPerUnit.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-sm font-bold num" style={{color:'var(--accent)'}}>฿{item.totalValue.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{background:`${statusColor(item.status)}18`,color:statusColor(item.status)}}>
                      {item.status==='OK'?'ปกติ':item.status==='LOW'?'ต่ำ':'หมด'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid var(--border)',background:'var(--surface-2)'}}>
                <td colSpan={5} className="px-4 py-3 text-sm font-bold" style={{color:'var(--text)'}}>รวม</td>
                <td className="px-4 py-3 text-sm font-extrabold num" style={{color:'#10b981'}}>
                  ฿{items.reduce((s,i)=>s+i.totalValue,0).toFixed(2)}
                </td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── TxModal ──────────────────────────────────────────────────────────────────
function TxModal({ branchId, ingredients, onClose, onSaved }:
  { branchId:string; ingredients:Ingredient[]; onClose:()=>void; onSaved:()=>void }) {
  const toast = useToast();
  const [type, setType]         = useState('STOCK_IN');
  const [ingredientId, setIngId] = useState('');
  const [quantity, setQty]      = useState('');
  const [unitCost, setCost]     = useState('');
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);

  const TYPES = [
    { id:'STOCK_IN', label:'รับเข้า', icon:<ArrowDown size={14}/>},
    { id:'WASTE', label:'ของเสีย', icon:<AlertTriangle size={14}/>},
    { id:'ADJUSTMENT', label:'ปรับยอด', icon:<RotateCcw size={14}/>},
    { id:'STOCK_OUT', label:'จ่ายออก', icon:<ArrowUp size={14}/>},
  ];

  const submit = async () => {
    if (!ingredientId||!quantity) { toast.error('กรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    try {
      await api.post('/inventory/transactions', {
        branchId, ingredientId, type,
        quantity: parseFloat(quantity),
        unitCost: unitCost ? parseFloat(unitCost) : undefined, note,
      });
      toast.success('ลงบันทึกสำเร็จ');
      onSaved();
    } catch (e:any) { toast.error(e?.message||'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="ลงบันทึกสต็อก"
      footer={<><Button variant="secondary" onClick={onClose}>ยกเลิก</Button><Button onClick={submit} loading={saving}>บันทึก</Button></>}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'var(--text-muted)'}}>ประเภท</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map(t => {
              const active = type === t.id;
              return (
                <button key={t.id} onClick={() => setType(t.id)}
                  className="h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{background:active?'var(--accent-soft)':'var(--surface-2)',color:active?'var(--accent)':'var(--text-2)',border:`1px solid ${active?'var(--accent)':'var(--border)'}`}}>
                  {t.icon}{t.label}
                </button>
              );
            })}
          </div>
        </div>
        <Select label="วัตถุดิบ" value={ingredientId} onChange={e => setIngId(e.target.value)}>
          <option value="">— เลือก —</option>
          {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="จำนวน" type="number" step="any" value={quantity} onChange={e=>setQty(e.target.value)}/>
          <Input label="ต้นทุน/หน่วย" type="number" step="any" value={unitCost} onChange={e=>setCost(e.target.value)} placeholder="ปล่อยว่างใช้ค่าเดิม"/>
        </div>
        <Textarea label="หมายเหตุ" rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="เช่น ซื้อจากแม็คโคร"/>
      </div>
    </Modal>
  );
}

// ─── IngredientsModal ─────────────────────────────────────────────────────────
function IngredientsModal({ ingredients, onClose, onSaved }:
  { ingredients:Ingredient[]; onClose:()=>void; onSaved:()=>void }) {
  const toast = useToast();
  const [editing, setEditing] = useState<Ingredient|null>(null);
  const [form, setForm] = useState({ name:'', unit:'', costPerUnit:'', sku:'' });
  const [delTarget, setDelTarget] = useState<Ingredient|null>(null);

  const reset = () => { setEditing(null); setForm({ name:'', unit:'', costPerUnit:'', sku:'' }); };

  const submit = async () => {
    if (!form.name||!form.unit) return;
    try {
      const p = { name:form.name, unit:form.unit, costPerUnit:form.costPerUnit?parseFloat(form.costPerUnit):0, sku:form.sku };
      if (editing) await api.patch(`/products/ingredients/${editing.id}`, p);
      else await api.post('/products/ingredients', p);
      toast.success('บันทึกสำเร็จ');
      reset(); onSaved();
    } catch (e:any) { toast.error(e?.message||'บันทึกไม่สำเร็จ'); }
  };

  const deleteIng = async () => {
    if (!delTarget) return;
    try {
      await api.delete(`/products/ingredients/${delTarget.id}`);
      toast.success('ลบวัตถุดิบสำเร็จ');
      setDelTarget(null); reset(); onSaved();
    } catch (e:any) { toast.error(e?.message||'ลบไม่สำเร็จ'); }
  };

  return (
    <Modal open onClose={onClose} size="lg" title="จัดการวัตถุดิบ">
      <div className="space-y-5">
        {/* Form */}
        <div className="rounded-xl border p-4 space-y-3" style={{borderColor:'var(--border)'}}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{color:'var(--text-muted)'}}>
            {editing ? `แก้ไข: ${editing.name}` : 'เพิ่มวัตถุดิบใหม่'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="ชื่อ *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="เช่น เมล็ดกาแฟ"/>
            <Input label="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/>
            <Input label="หน่วยนับ *" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="g / ml / pcs"/>
            <Input label="ต้นทุน/หน่วย (฿)" type="number" step="any" value={form.costPerUnit} onChange={e=>setForm({...form,costPerUnit:e.target.value})}/>
          </div>
          <div className="flex gap-2">
            {editing && <Button variant="secondary" onClick={reset}>ยกเลิกแก้ไข</Button>}
            <Button onClick={submit} disabled={!form.name||!form.unit}>{editing?'อัปเดต':'เพิ่ม'}</Button>
          </div>
        </div>

        {/* List */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'var(--text-muted)'}}>วัตถุดิบทั้งหมด ({ingredients.length})</p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {ingredients.map(ig => (
              <div key={ig.id} className="flex items-center gap-2 py-2.5 px-3 rounded-lg"
                style={{background:editing?.id===ig.id?'var(--accent-soft)':'var(--surface-2)'}}>
                <button onClick={() => { setEditing(ig); setForm({name:ig.name,unit:ig.unit,costPerUnit:ig.costPerUnit?.toString()||'0',sku:ig.sku||''}); }}
                  className="flex items-center gap-3 flex-1 text-left">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{background:'var(--surface)',color:'var(--text-muted)'}}><Package size={14}/></div>
                  <div>
                    <p className="font-semibold text-sm" style={{color:'var(--text)'}}>{ig.name}</p>
                    <p className="text-[10px]" style={{color:'var(--text-muted)'}}>
                      {ig.unit}{ig.sku?` · ${ig.sku}`:''} 
                      {ig.recipeCount !== undefined && ` · ใช้ใน ${ig.recipeCount} สูตร`}
                    </p>
                  </div>
                </button>
                <span className="text-sm font-bold num" style={{color:'var(--accent)'}}>฿{ig.costPerUnit.toFixed(2)}/{ig.unit}</span>
                <button onClick={() => setDelTarget(ig)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{background:'rgba(239,68,68,0.08)',color:'#ef4444'}}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
            {ingredients.length === 0 && <p className="text-sm italic text-center py-6" style={{color:'var(--text-muted)'}}>ยังไม่มีวัตถุดิบ</p>}
          </div>
        </div>
      </div>

      {/* Delete confirm overlay */}
      <AnimatePresence>
        {delTarget && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="absolute inset-0 flex items-center justify-center rounded-2xl p-6"
            style={{background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',zIndex:10}}>
            <div className="rounded-2xl p-5 space-y-3 max-w-xs w-full" style={{background:'var(--surface)'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'rgba(239,68,68,0.1)'}}>
                  <AlertTriangle size={20} style={{color:'#ef4444'}}/>
                </div>
                <div>
                  <p className="font-bold text-sm" style={{color:'var(--text)'}}>ลบ "{delTarget.name}"?</p>
                  {delTarget.recipeCount && delTarget.recipeCount > 0 ? (
                    <p className="text-xs mt-0.5" style={{color:'#ef4444'}}>⚠ ใช้ใน {delTarget.recipeCount} สูตร — ไม่สามารถลบได้</p>
                  ) : (
                    <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>จะลบประวัติสต็อกทั้งหมดด้วย</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDelTarget(null)}
                  className="h-8 px-3 rounded-lg text-sm font-semibold"
                  style={{background:'var(--surface-2)',color:'var(--text-muted)'}}>ยกเลิก</button>
                {(!delTarget.recipeCount || delTarget.recipeCount === 0) && (
                  <button onClick={deleteIng}
                    className="h-8 px-3 rounded-lg text-sm font-bold"
                    style={{background:'#ef4444',color:'#fff'}}>ลบ</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

// ─── ThresholdModal ───────────────────────────────────────────────────────────
function ThresholdModal({ row, branchId, onClose, onSaved }:
  { row:InventoryRow; branchId:string; onClose:()=>void; onSaved:()=>void }) {
  const toast = useToast();
  const [thr, setThr]     = useState(row.lowStockThreshold.toString());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.patch(`/inventory/threshold/${branchId}/${row.ingredientId}`, { threshold: parseFloat(thr)||0 });
      toast.success('อัปเดตขั้นต่ำสำเร็จ');
      onSaved();
    } catch (e:any) { toast.error(e?.message||'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`ปรับขั้นต่ำ: ${row.ingredient.name}`}
      footer={<><Button variant="secondary" onClick={onClose}>ยกเลิก</Button><Button onClick={submit} loading={saving}>บันทึก</Button></>}>
      <div className="space-y-4">
        <div className="rounded-xl p-4" style={{background:'var(--surface-2)'}}>
          <p className="text-xs font-semibold mb-1" style={{color:'var(--text-muted)'}}>คงเหลือปัจจุบัน</p>
          <p className="text-2xl font-bold num" style={{color:'var(--text)'}}>{row.quantity} {row.ingredient.unit}</p>
        </div>
        <Input
          label={`ขั้นต่ำ (${row.ingredient.unit})`}
          type="number" step="1" min="0"
          value={thr}
          onChange={e => setThr(e.target.value)}
          hint="เมื่อสต็อกต่ำกว่าค่านี้จะแจ้งเตือน"
        />
      </div>
    </Modal>
  );
}
