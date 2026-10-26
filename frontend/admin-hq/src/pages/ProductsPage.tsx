import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Coffee,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Settings2,
  Layers,
  X,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Package,
  AlertCircle,
  Tag,
  DollarSign,
  Sparkles,
  ImageIcon,
  Crown,
  Pencil,
  Download,
} from 'lucide-react';
import { api } from '../api';
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  ImageUpload,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
  ExportDropdown,
} from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination, paginateItems } from '../components/ui/Pagination';
import { exportToExcel, exportToCsv } from '../lib/excelExporter';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isVisible: boolean;
  sortOrder: number;
  _count: { products: number };
}
interface MenuOption {
  id: string;
  groupId: string;
  label: string;
  priceAddon: number;
  isDefault: boolean;
  sortOrder: number;
}
interface OptionGroup {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  sortOrder: number;
  options: MenuOption[];
}
interface Recipe {
  id: string;
  quantity: number;
  ingredient: { id: string; name: string; unit: string; costPerUnit: number };
}
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  category?: Category;
  imageUrl?: string;
  status: string;
  tags: string;
  platforms: string[];
  sortOrder: number;
  optionGroups: OptionGroup[];
  recipes: Recipe[];
  _count: { orderItems: number };
}

const TAG_OPTIONS = ['Bestseller', 'Recommended', 'New', 'Seasonal', 'Signature'];

const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string; ring: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  AVAILABLE: {
    label: 'พร้อมขาย',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    ring: 'rgba(16,185,129,0.35)',
    tone: 'success',
  },
  OUT_OF_STOCK: {
    label: 'หมดชั่วคราว',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.12)',
    ring: 'rgba(217,119,6,0.35)',
    tone: 'warning',
  },
  HIDDEN: {
    label: 'ซ่อน',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.12)',
    ring: 'rgba(107,114,128,0.35)',
    tone: 'neutral',
  },
};

type SortKey = 'newest' | 'name' | 'price-asc' | 'price-desc' | 'sales';

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [itemModal, setItemModal] = useState<{ open: boolean; item?: MenuItem }>({ open: false });
  const [catModal, setCatModal] = useState<{ open: boolean; cat?: Category }>({ open: false });
  const [optDrawer, setOptDrawer] = useState<MenuItem | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<MenuItem[]>('/menu'),
      ]);
      setCategories(cats);
      setItems(prods);
    } catch (e: any) {
      toast.error(e?.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(() => {
    let list = items.filter((i) => {
      if (activeCat && i.categoryId !== activeCat) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'newest':
          return b.sortOrder - a.sortOrder;
        case 'name':
          return a.name.localeCompare(b.name, 'th');
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'sales':
          return b._count.orderItems - a._count.orderItems;
      }
    });
    return list;
  }, [items, activeCat, statusFilter, search, sortKey]);

  useEffect(() => {
    setPage(1);
  }, [activeCat, statusFilter, search, sortKey, pageSize]);

  const pagedItems = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  const selected = items.find((i) => i.id === selectedId) || null;
  const stats = {
    total: items.length,
    available: items.filter((i) => i.status === 'AVAILABLE').length,
    outOfStock: items.filter((i) => i.status === 'OUT_OF_STOCK').length,
    hidden: items.filter((i) => i.status === 'HIDDEN').length,
  };
  // top sales for "Bestseller" badge — top 3 by orderItems if any sales
  const bestsellerIds = useMemo(() => {
    return new Set(
      [...items]
        .filter((i) => i._count.orderItems > 0)
        .sort((a, b) => b._count.orderItems - a._count.orderItems)
        .slice(0, 3)
        .map((i) => i.id),
    );
  }, [items]);

  const activeCount =
    (search ? 1 : 0) + (activeCat ? 1 : 0) + (statusFilter ? 1 : 0) + (sortKey !== 'newest' ? 1 : 0);
  const reset = () => {
    setSearch('');
    setActiveCat(null);
    setStatusFilter('');
    setSortKey('newest');
  };

  const toggleStatus = async (item: MenuItem) => {
    const next =
      item.status === 'AVAILABLE'
        ? 'OUT_OF_STOCK'
        : item.status === 'OUT_OF_STOCK'
        ? 'HIDDEN'
        : 'AVAILABLE';
    try {
      await api.patch(`/menu/${item.id}/status`, { status: next });
      toast.success(`สถานะ → ${STATUS_CFG[next].label}`);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'อัปเดตไม่สำเร็จ');
    }
  };

  const remove = async (item: MenuItem) => {
    if (!confirm(`ลบเมนู "${item.name}" ?`)) return;
    try {
      await api.delete(`/menu/${item.id}`);
      toast.success('ลบเมนูสำเร็จ');
      setDrawerOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'ลบไม่สำเร็จ');
    }
  };

  const handleExportExcel = () => {
    if (!filtered || filtered.length === 0) {
      toast.error('ไม่มีรายการสินค้าสำหรับ Export');
      return;
    }

    const STATUS_MAP: Record<string, string> = {
      AVAILABLE: 'เปิดขายปกติ',
      OUT_OF_STOCK: 'หมดสต็อก',
      HIDDEN: 'ซ่อนเมนู',
    };

    const productRows = filtered.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || '-';
      return {
        'ชื่อเมนู': p.name,
        'หมวดหมู่': cat,
        'ราคาหน้าร้าน (บาท)': p.price,
        'ราคาเดลิเวอรี (บาท)': p.deliveryPrice || p.price,
        'สถานะ': STATUS_MAP[p.status] || p.status,
        'ลำดับการแสดง': p.sortOrder,
        'ยอดสั่งซื้อ (ครั้ง)': p._count.orderItems,
        'รายละเอียด': p.description || '-',
      };
    });

    const categoryRows = categories.map((c) => ({
      'ชื่อหมวดหมู่': c.name,
      'ลำดับการแสดง': c.sortOrder,
      'จำนวนสินค้าในหมวด': items.filter((it) => it.categoryId === c.id).length,
    }));

    if (format === 'xlsx') {
      exportToExcel({
        filename: '456coffee_products',
        sheets: [
          { sheetName: 'รายการเมนูสินค้า', data: productRows },
          { sheetName: 'หมวดหมู่สินค้า', data: categoryRows },
        ],
      });
      toast.success(`ส่งออก ${filtered.length} เมนูเป็นไฟล์ Excel (.xlsx) สำเร็จ`);
    } else {
      exportToCsv('456coffee_products', productRows);
      toast.success(`ส่งออก ${filtered.length} เมนูเป็นไฟล์ CSV (.csv) สำเร็จ`);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="เมนูสินค้า"
        description={`${filtered.length.toLocaleString()} เมนูตรงตามตัวกรอง · ทั้งหมด ${stats.total.toLocaleString()} เมนู · ${categories.length} หมวด`}
        actions={
          <>
            <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={fetchAll}>
              รีเฟรช
            </Button>
            <ExportDropdown onExport={handleExportExcel} />
            <Button variant="secondary" leftIcon={<Layers size={14} />} onClick={() => setCatModal({ open: true })}>
              จัดการหมวด
            </Button>
            <Button leftIcon={<Plus size={14} />} onClick={() => setItemModal({ open: true })}>
              เพิ่มเมนู
            </Button>
          </>
        }
      />

      {/* Stats — compact 4-tile strip */}
      <StatsStrip loading={loading} stats={stats} />

      {/* Category chip rail */}
      <CategoryRail
        categories={categories}
        active={activeCat}
        totalCount={items.length}
        countByCat={(id) => items.filter((it) => it.categoryId === id).length}
        onSelect={setActiveCat}
        onAdd={() => setCatModal({ open: true })}
        onEdit={(c) => setCatModal({ open: true, cat: c })}
        loading={loading}
      />

      {/* Filter bar */}
      <Card padded className="mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเมนูตามชื่อ..."
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div
              className="inline-flex h-10 items-center rounded-xl p-1"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              {[
                { id: '', label: 'ทุกสถานะ', count: stats.total, dot: 'var(--text-muted)' },
                { id: 'AVAILABLE', label: 'พร้อมขาย', count: stats.available, dot: '#10b981' },
                { id: 'OUT_OF_STOCK', label: 'หมด', count: stats.outOfStock, dot: '#d97706' },
                { id: 'HIDDEN', label: 'ซ่อน', count: stats.hidden, dot: '#6b7280' },
              ].map((p) => {
                const active = statusFilter === p.id;
                return (
                  <button
                    key={p.id || 'all'}
                    onClick={() => setStatusFilter(p.id)}
                    className="h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: active ? 'var(--surface)' : 'transparent',
                      color: active ? 'var(--text)' : 'var(--text-muted)',
                      boxShadow: active ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: p.dot }}
                    />
                    {p.label}
                    <span className="text-[10px] num font-bold opacity-60">
                      {p.count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>

            <Select
              containerClassName="min-w-[170px]"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="newest">ใหม่สุดก่อน</option>
              <option value="name">ชื่อ A → Z</option>
              <option value="price-asc">ราคาต่ำ → สูง</option>
              <option value="price-desc">ราคาสูง → ต่ำ</option>
              <option value="sales">ขายดีสุด</option>
            </Select>

            {activeCount > 0 && (
              <button
                onClick={reset}
                className="h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                style={{ color: 'var(--danger)' }}
              >
                <X size={14} />
                ล้างตัวกรอง
                <span
                  className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--danger)', color: '#fff' }}
                >
                  {activeCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Coffee size={28} />}
            title={
              activeCount > 0 ? 'ไม่พบเมนูที่ตรงกับตัวกรอง' : 'ยังไม่มีเมนู'
            }
            description={
              activeCount > 0
                ? 'ลองล้างตัวกรองหรือปรับคำค้นหา'
                : 'เริ่มสร้างเมนูแรกของคุณเพื่อให้ลูกค้าสั่งซื้อได้'
            }
            action={
              activeCount > 0 ? (
                <Button variant="secondary" onClick={reset} leftIcon={<X size={14} />}>
                  ล้างตัวกรอง
                </Button>
              ) : (
                <Button onClick={() => setItemModal({ open: true })} leftIcon={<Plus size={14} />}>
                  เพิ่มเมนูแรก
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {pagedItems.map((m, idx) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                >
                  <ProductCard
                    item={m}
                    bestseller={bestsellerIds.has(m.id)}
                    onOpen={() => {
                      setSelectedId(m.id);
                      setDrawerOpen(true);
                    }}
                    onEdit={() => setItemModal({ open: true, item: m })}
                    onOptions={() => setOptDrawer(m)}
                    onToggle={() => toggleStatus(m)}
                    onDelete={() => remove(m)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
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

      {/* Modals */}
      {catModal.open && (
        <CategoryModal
          cat={catModal.cat}
          onClose={() => setCatModal({ open: false })}
          onSaved={() => {
            setCatModal({ open: false });
            fetchAll();
          }}
        />
      )}
      {itemModal.open && (
        <ItemModal
          item={itemModal.item}
          categories={categories}
          onClose={() => setItemModal({ open: false })}
          onSaved={() => {
            setItemModal({ open: false });
            fetchAll();
          }}
        />
      )}
      {optDrawer && (
        <OptionsDrawer
          item={optDrawer}
          onClose={() => setOptDrawer(null)}
          onChanged={fetchAll}
        />
      )}

      {/* Detail drawer */}
      <Drawer open={drawerOpen && !!selected} onClose={() => setDrawerOpen(false)} width="lg">
        {selected && (
          <ProductDetail
            item={selected}
            bestseller={bestsellerIds.has(selected.id)}
            onClose={() => setDrawerOpen(false)}
            onEdit={() => {
              setDrawerOpen(false);
              setItemModal({ open: true, item: selected });
            }}
            onOptions={() => {
              setDrawerOpen(false);
              setOptDrawer(selected);
            }}
            onToggle={() => toggleStatus(selected)}
            onDelete={() => remove(selected)}
          />
        )}
      </Drawer>
    </>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────

function StatsStrip({
  stats,
  loading,
}: {
  stats: { total: number; available: number; outOfStock: number; hidden: number };
  loading: boolean;
}) {
  const items = [
    {
      label: 'เมนูทั้งหมด',
      value: stats.total,
      hint: 'รายการ',
      icon: Coffee,
      color: '#ea580c',
      bg: 'rgba(234,88,12,0.12)',
    },
    {
      label: 'พร้อมขาย',
      value: stats.available,
      hint: stats.total > 0 ? `${Math.round((stats.available / stats.total) * 100)}%` : '0%',
      icon: Eye,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      label: 'หมดชั่วคราว',
      value: stats.outOfStock,
      hint: 'ต้องเติม',
      icon: AlertCircle,
      color: '#d97706',
      bg: 'rgba(217,119,6,0.12)',
    },
    {
      label: 'ซ่อนอยู่',
      value: stats.hidden,
      hint: 'ไม่แสดง',
      icon: EyeOff,
      color: '#6b7280',
      bg: 'rgba(107,114,128,0.12)',
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map((it, idx) => {
        const Icon = it.icon;
        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
          >
            <Card padded className="relative overflow-hidden">
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: it.bg }}
              />
              <div className="relative flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: it.bg, color: it.color }}
                >
                  <Icon size={18} />
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: it.color }}
                >
                  {it.hint}
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-7 w-2/3 mb-1" />
              ) : (
                <p
                  className="relative text-2xl sm:text-3xl font-bold tracking-tight num"
                  style={{ color: 'var(--text)' }}
                >
                  {it.value.toLocaleString()}
                </p>
              )}
              <p
                className="text-[11px] font-semibold uppercase tracking-wider mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {it.label}
              </p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Category rail (horizontal chips) ─────────────────────────────────────

function CategoryRail({
  categories,
  active,
  totalCount,
  countByCat,
  onSelect,
  onAdd,
  onEdit,
  loading,
}: {
  categories: Category[];
  active: string | null;
  totalCount: number;
  countByCat: (id: string) => number;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onEdit: (c: Category) => void;
  loading: boolean;
}) {
  return (
    <Card padded={false} className="mb-4">
      <div className="px-4 py-3 flex items-center gap-3">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.14em] shrink-0"
          style={{ color: 'var(--text-faint)' }}
        >
          หมวด
        </span>
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <CatChip
            active={!active}
            icon={<Coffee size={13} />}
            label="ทั้งหมด"
            count={totalCount}
            onClick={() => onSelect(null)}
          />
          {loading
            ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-lg" />)
            : categories.map((c) => (
                <CatChip
                  key={c.id}
                  active={active === c.id}
                  icon={<span className="text-sm leading-none">{c.icon || '📂'}</span>}
                  label={c.name}
                  count={countByCat(c.id)}
                  onClick={() => onSelect(c.id)}
                  onEdit={() => onEdit(c)}
                />
              ))}
          <button
            onClick={onAdd}
            className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-all border-2 border-dashed"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Plus size={12} /> เพิ่มหมวด
          </button>
        </div>
      </div>
    </Card>
  );
}

function CatChip({
  active,
  icon,
  label,
  count,
  onClick,
  onEdit,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
  onEdit?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group relative h-8 pl-2.5 pr-3 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all"
      style={{
        background: active ? 'var(--accent)' : 'var(--surface-2)',
        color: active ? 'var(--accent-fg)' : 'var(--text-2)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: active ? 'var(--shadow-sm)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--hover)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--surface-2)';
      }}
    >
      {icon}
      <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
      <span
        className="text-[10px] font-bold num px-1 rounded"
        style={{
          background: active ? 'rgba(255,255,255,0.22)' : 'var(--surface)',
          color: active ? 'var(--accent-fg)' : 'var(--text-muted)',
        }}
      >
        {count}
      </span>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="opacity-0 group-hover:opacity-100 ml-0.5 transition-opacity"
          style={{ color: active ? 'var(--accent-fg)' : 'var(--text-muted)' }}
          aria-label={`แก้ไขหมวด ${label}`}
        >
          <Pencil size={10} />
        </button>
      )}
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────

function ProductCard({
  item,
  bestseller,
  onOpen,
  onEdit,
  onOptions,
  onToggle,
  onDelete,
}: {
  item: MenuItem;
  bestseller: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onOptions: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.AVAILABLE;
  const tags: string[] = (() => {
    try {
      return JSON.parse(item.tags || '[]');
    } catch {
      return [];
    }
  })();
  const dim = item.status === 'HIDDEN';

  return (
    <Card
      padded={false}
      className="overflow-hidden flex flex-col h-full group transition-all"
      style={{
        opacity: dim ? 0.78 : 1,
      }}
    >
      {/* Image */}
      <div
        className="relative aspect-[16/10] overflow-hidden cursor-pointer"
        style={{ background: 'var(--surface-2)' }}
        onClick={onOpen}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
              color: 'var(--text-faint)',
            }}
          >
            <ImageIcon size={32} />
            <span className="text-[10px] font-semibold">ไม่มีรูป</span>
          </div>
        )}

        {/* Top-left: status pill */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1.5 pl-2 pr-2.5 h-6 rounded-md text-[11px] font-bold backdrop-blur"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: cfg.color,
              boxShadow: `0 0 0 1px ${cfg.ring}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color }}
            />
            {cfg.label}
          </span>
        </div>

        {/* Top-right: bestseller / tags */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {bestseller && (
            <span
              className="inline-flex items-center gap-1 pl-1.5 pr-2 h-6 rounded-md text-[10px] font-bold"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(234,88,12,0.35)',
              }}
            >
              <Crown size={10} /> ขายดี
            </span>
          )}
          {tags.length > 0 && !bestseller && (
            <span
              className="inline-flex items-center gap-1 pl-1.5 pr-2 h-6 rounded-md text-[10px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.92)',
                color: 'var(--accent)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Sparkles size={10} /> {tags[0]}
            </span>
          )}
        </div>

        {/* Bottom hover hint */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span
            className="inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] font-semibold backdrop-blur"
            style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
          >
            ดูรายละเอียด <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-2 mb-1.5 cursor-pointer" onClick={onOpen}>
          <h3
            className="font-bold text-[15px] leading-tight flex-1 line-clamp-2"
            style={{ color: 'var(--text)' }}
          >
            {item.name}
          </h3>
          <div className="text-right shrink-0">
            <span
              className="font-bold text-lg leading-none num"
              style={{ color: 'var(--accent)' }}
            >
              ฿{item.price}
            </span>
          </div>
        </div>

        {item.description && (
          <p
            className="text-xs line-clamp-1 mb-2.5 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onClick={onOpen}
          >
            {item.description}
          </p>
        )}

        <div
          className="flex items-center gap-2.5 text-[11px] font-medium mb-3 mt-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          {item.category && (
            <span className="inline-flex items-center gap-1 truncate">
              <span className="text-sm leading-none">{item.category.icon || '📂'}</span>
              <span className="truncate">{item.category.name}</span>
            </span>
          )}
          {item.optionGroups.length > 0 && (
            <>
              {item.category && <span className="opacity-40">·</span>}
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Settings2 size={10} />
                {item.optionGroups.length} ตัวเลือก
              </span>
            </>
          )}
          <span className="ml-auto inline-flex items-center gap-1 num shrink-0">
            <TrendingUp size={10} />
            {item._count.orderItems.toLocaleString()}
          </span>
        </div>

        {/* Action bar */}
        <div
          className="grid grid-cols-4 gap-1.5 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <ActionBtn icon={<Edit2 size={12} />} label="แก้ไข" onClick={onEdit} primary />
          <ActionBtn
            icon={<Settings2 size={12} />}
            label="ออปชัน"
            onClick={onOptions}
          />
          <ActionBtn
            icon={item.status === 'AVAILABLE' ? <EyeOff size={12} /> : <Eye size={12} />}
            label="สลับ"
            onClick={onToggle}
          />
          <ActionBtn
            icon={<Trash2 size={12} />}
            label="ลบ"
            onClick={onDelete}
            danger
          />
        </div>
      </div>
    </Card>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  primary,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
      style={{
        background: primary ? 'var(--accent-soft)' : 'var(--surface-2)',
        color: primary ? 'var(--accent)' : danger ? 'var(--text-muted)' : 'var(--text-2)',
      }}
      onMouseEnter={(e) => {
        if (danger) {
          e.currentTarget.style.background = 'var(--danger-soft)';
          e.currentTarget.style.color = 'var(--danger)';
        } else if (!primary) {
          e.currentTarget.style.background = 'var(--hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (danger) {
          e.currentTarget.style.background = 'var(--surface-2)';
          e.currentTarget.style.color = 'var(--text-muted)';
        } else if (!primary) {
          e.currentTarget.style.background = 'var(--surface-2)';
        }
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Product detail drawer ────────────────────────────────────────────────

function ProductDetail({
  item,
  bestseller,
  onClose,
  onEdit,
  onOptions,
  onToggle,
  onDelete,
}: {
  item: MenuItem;
  bestseller: boolean;
  onClose: () => void;
  onEdit: () => void;
  onOptions: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CFG[item.status];
  const tags: string[] = (() => {
    try {
      return JSON.parse(item.tags || '[]');
    } catch {
      return [];
    }
  })();
  const cogs = item.recipes.reduce((s, r) => s + r.quantity * r.ingredient.costPerUnit, 0);
  const profit = item.price - cogs;
  const margin = item.price > 0 ? (profit / item.price) * 100 : 0;
  const marginTone =
    margin >= 50 ? 'success' : margin >= 30 ? 'info' : margin > 0 ? 'warning' : 'danger';

  return (
    <>
      {/* Hero image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            <Coffee size={64} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.7) 100%)',
          }}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur"
          style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
        >
          <X size={18} />
        </button>
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-md text-[11px] font-bold backdrop-blur"
              style={{ background: 'rgba(255,255,255,0.92)', color: cfg.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
              {cfg.label}
            </span>
            {bestseller && (
              <span
                className="inline-flex items-center gap-1 px-2 h-6 rounded text-[10px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  color: '#fff',
                }}
              >
                <Crown size={10} /> ขายดี
              </span>
            )}
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 h-6 rounded text-[10px] font-bold backdrop-blur"
                style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}
              >
                {t}
              </span>
            ))}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{item.name}</h2>
          {item.description && (
            <p className="text-sm opacity-90 line-clamp-2 mt-1">{item.description}</p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Pricing summary */}
        <div className="grid grid-cols-3 gap-3">
          <PriceTile label="ราคาขาย" value={`฿${item.price.toLocaleString()}`} tone="info" />
          <PriceTile label="ต้นทุน" value={`฿${cogs.toFixed(2)}`} tone="neutral" />
          <PriceTile
            label="กำไร"
            value={`฿${profit.toFixed(2)}`}
            sub={`Margin ${margin.toFixed(1)}%`}
            tone={marginTone}
          />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoBox
            label="หมวดหมู่"
            icon={<Tag size={13} />}
            value={
              item.category
                ? `${item.category.icon || ''} ${item.category.name}`.trim()
                : 'ยังไม่ระบุ'
            }
          />
          <InfoBox
            label="ยอดขาย"
            icon={<TrendingUp size={13} />}
            value={`${item._count.orderItems.toLocaleString()} แก้ว`}
            mono
          />
          <InfoBox
            label="ตัวเลือก"
            icon={<Settings2 size={13} />}
            value={`${item.optionGroups.length} กลุ่ม`}
          />
          <InfoBox
            label="วัตถุดิบ"
            icon={<Package size={13} />}
            value={`${item.recipes.length} รายการ`}
          />
        </div>

        {/* Recipes */}
        {item.recipes.length > 0 && (
          <div>
            <h3
              className="text-sm font-bold mb-3 inline-flex items-center gap-2"
              style={{ color: 'var(--text)' }}
            >
              <Package size={14} style={{ color: 'var(--accent)' }} /> สูตรวัตถุดิบ
              <span
                className="ml-1 px-1.5 h-5 inline-flex items-center rounded text-[10px] font-bold num"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              >
                {item.recipes.length}
              </span>
            </h3>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
            >
              {item.recipes.map((r, i) => (
                <div
                  key={r.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)',
                  }}
                >
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text)' }}
                  >
                    {r.ingredient.name}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-xs num"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {r.quantity} {r.ingredient.unit}
                    </span>
                    <span
                      className="text-xs num font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                      ฿{(r.quantity * r.ingredient.costPerUnit).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{
                  background: 'var(--accent-soft)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent)' }}
                >
                  ต้นทุนรวม
                </span>
                <span className="text-sm font-bold num" style={{ color: 'var(--accent)' }}>
                  ฿{cogs.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Options */}
        {item.optionGroups.length > 0 && (
          <div>
            <h3
              className="text-sm font-bold mb-3 inline-flex items-center gap-2"
              style={{ color: 'var(--text)' }}
            >
              <Settings2 size={14} style={{ color: 'var(--accent)' }} /> ตัวเลือก
              <span
                className="ml-1 px-1.5 h-5 inline-flex items-center rounded text-[10px] font-bold num"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              >
                {item.optionGroups.length}
              </span>
            </h3>
            <div className="space-y-2">
              {item.optionGroups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl p-3"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: 'var(--text)' }}
                    >
                      {g.name}
                    </span>
                    {g.isRequired && <Badge tone="danger">จำเป็น</Badge>}
                    <Badge tone="neutral">เลือกได้ {g.maxSelect}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.options.map((o) => (
                      <span
                        key={o.id}
                        className="inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-medium"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-2)',
                        }}
                      >
                        {o.label}
                        {o.priceAddon > 0 && (
                          <span
                            className="num font-bold"
                            style={{ color: 'var(--accent)' }}
                          >
                            +฿{o.priceAddon}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="sticky bottom-0 px-6 py-4 flex items-center gap-2 flex-wrap"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <Button size="sm" leftIcon={<Edit2 size={14} />} onClick={onEdit}>
          แก้ไขเมนู
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Settings2 size={14} />}
          onClick={onOptions}
        >
          ตัวเลือก
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={item.status === 'AVAILABLE' ? <EyeOff size={14} /> : <Eye size={14} />}
          onClick={onToggle}
        >
          สลับสถานะ
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" leftIcon={<Trash2 size={14} />} onClick={onDelete}>
          ลบ
        </Button>
      </div>
    </>
  );
}

function PriceTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
  const colors: Record<typeof tone, { fg: string; bg: string }> = {
    success: { fg: 'var(--success)', bg: 'var(--success-soft)' },
    warning: { fg: 'var(--warning)', bg: 'var(--warning-soft)' },
    danger: { fg: 'var(--danger)', bg: 'var(--danger-soft)' },
    info: { fg: 'var(--info)', bg: 'var(--info-soft)' },
    neutral: { fg: 'var(--text)', bg: 'var(--surface-2)' },
  };
  const c = colors[tone];
  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: c.bg, border: '1px solid var(--border)' }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: c.fg, opacity: 0.85 }}
      >
        {label}
      </p>
      <p className="text-xl font-bold num" style={{ color: c.fg }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] font-semibold mt-1" style={{ color: c.fg, opacity: 0.85 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function InfoBox({
  label,
  icon,
  value,
  mono,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center gap-1.5 mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p
        className={`text-sm font-semibold truncate ${mono ? 'num' : ''}`}
        style={{ color: 'var(--text)' }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Item modal ───────────────────────────────────────────────────────────

function ItemModal({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item?: MenuItem;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    categoryId: item?.categoryId || '',
    imageUrl: item?.imageUrl || '',
    status: item?.status || 'AVAILABLE',
    tags: item ? JSON.parse(item.tags || '[]') : ([] as string[]),
    platforms: item?.platforms || ([] as string[]),
    platformPrices: item?.platformPrices
      ? (JSON.parse(item.platformPrices) as Record<string, string>)
      : ({} as Record<string, string>),
  });
  const [saving, setSaving] = useState(false);

  const toggleTag = (t: string) =>
    setForm((p) => ({
      ...p,
      tags: p.tags.includes(t)
        ? p.tags.filter((x: string) => x !== t)
        : [...p.tags, t],
    }));

  const submit = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        categoryId: form.categoryId || null,
        tags: JSON.stringify(form.tags),
        platforms: form.platforms,
        platformPrices: JSON.stringify(
          Object.fromEntries(
            Object.entries(form.platformPrices)
              .filter(([, v]) => v !== '' && !isNaN(Number(v)))
              .map(([k, v]) => [k, parseFloat(v as string)])
          )
        ),
      };
      if (item) await api.patch(`/menu/${item.id}`, payload);
      else await api.post('/menu', payload);
      toast.success(item ? 'อัปเดตเมนูสำเร็จ' : 'เพิ่มเมนูสำเร็จ');
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={item ? `แก้ไข ${item.name}` : 'เพิ่มเมนูใหม่'}
      description={item ? 'อัปเดตข้อมูลเมนูที่มีอยู่' : 'กรอกข้อมูลเมนูใหม่ให้พร้อมขาย'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            onClick={submit}
            loading={saving}
            disabled={!form.name.trim() || !form.price}
          >
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ImageUpload
          label="รูปภาพเมนู"
          aspect="16/9"
          value={form.imageUrl || null}
          onChange={(url) => setForm({ ...form, imageUrl: url || '' })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            containerClassName="sm:col-span-2"
            label="ชื่อเมนู *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="เช่น Latte"
          />
          <Input
            leftIcon={<DollarSign size={14} />}
            label="ราคา *"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="0"
          />
        </div>
        <Textarea
          label="คำอธิบาย"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="รสชาติ ส่วนผสม จุดเด่น..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="หมวดหมู่"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">— ไม่ระบุ —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="สถานะ"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            แท็ก
          </label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => {
              const active = form.tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--surface-2)',
                    color: active ? 'var(--accent-fg)' : 'var(--text-muted)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ช่องทางขาย ── */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            ช่องทางที่ขายได้ &amp; ราคาเฉพาะช่องทาง
          </label>
          <p className="text-[11px] mb-2.5" style={{ color: 'var(--text-muted)' }}>
            ไม่ติ๊กอะไร = ขายได้ทุกช่องทาง • ราคาว่าง = ใช้ราคาเริ่มต้น
          </p>
          <div className="space-y-2">
            {([
              { id: 'STORE',  label: 'หน้าร้าน', icon: '🏪' },
              { id: 'GRAB',   label: 'Grab',      icon: '🟢' },
              { id: 'LINE',   label: 'LINE MAN',  icon: '🟡' },
              { id: 'SHOPEE', label: 'Shopee',    icon: '🛍️' },
              { id: 'BOOTH',  label: 'ออกบูธ',   icon: '🎪' },
              { id: 'OTHER',  label: 'อื่นๆ',     icon: '📦' },
            ] as const).map((p) => {
              const enabled = form.platforms.includes(p.id);
              const priceVal = (form.platformPrices as Record<string, string>)[p.id] ?? '';
              return (
                <div
                  key={p.id}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    border: `1.5px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
                    background: enabled ? 'rgba(234,88,12,0.04)' : 'var(--surface-2)',
                  }}
                >
                  <label className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-orange-500 shrink-0"
                      checked={enabled}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          platforms: enabled
                            ? prev.platforms.filter((x) => x !== p.id)
                            : [...prev.platforms, p.id],
                        }))
                      }
                    />
                    <span className="text-base leading-none">{p.icon}</span>
                    <span
                      className="text-xs font-semibold flex-1"
                      style={{ color: enabled ? 'var(--accent)' : 'var(--text-muted)' }}
                    >
                      {p.label}
                    </span>
                    {priceVal && (
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        {'\u0e3f'}{parseFloat(priceVal).toLocaleString()}
                      </span>
                    )}
                    {!priceVal && enabled && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {'\u0e23\u0e32\u0e04\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e15\u0e49\u0e19'}
                      </span>
                    )}
                  </label>
                  {enabled && (
                    <div
                      className="px-3 pb-2.5 flex items-center gap-2"
                      style={{ borderTop: '1px dashed var(--border)' }}
                    >
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {'\u0e3f'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={`\u0e23\u0e32\u0e04\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e15\u0e49\u0e19 (${form.price || '0'})`}
                        value={priceVal}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            platformPrices: {
                              ...(prev.platformPrices as Record<string, string>),
                              [p.id]: e.target.value,
                            },
                          }))
                        }
                        className="flex-1 h-8 px-2 rounded-lg text-sm font-semibold outline-none"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                      />
                      {priceVal && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => {
                              const next = { ...(prev.platformPrices as Record<string, string>) };
                              delete next[p.id];
                              return { ...prev, platformPrices: next };
                            })
                          }
                          className="text-[10px] font-bold px-2 h-7 rounded-lg"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                        >
                          {'\u0e25\u0e1a'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] font-medium space-y-0.5" style={{ color: 'var(--text-muted)' }}>
            {form.platforms.length === 0 ? (
              <p>{'\u2714 \u0e02\u0e32\u0e22\u0e44\u0e14\u0e49\u0e17\u0e38\u0e01\u0e0a\u0e48\u0e2d\u0e07\u0e17\u0e32\u0e07 (\u0e04\u0e48\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e15\u0e49\u0e19)'}</p>
            ) : (
              <p style={{ color: 'var(--accent)' }}>{'\u2714 \u0e02\u0e32\u0e22\u0e40\u0e09\u0e1e\u0e32\u0e30:'} {form.platforms.join(', ')}</p>
            )}
            {Object.entries(form.platformPrices as Record<string, string>)
              .filter(([, v]) => v !== '')
              .map(([k, v]) => (
                <p key={k}>{'\u2022'} {k}: {'\u0e3f'}{parseFloat(v).toLocaleString()}</p>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CategoryModal({
  cat,
  onClose,
  onSaved,
}: {
  cat?: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(cat?.name || '');
  const [icon, setIcon] = useState(cat?.icon || '☕');
  const [description, setDescription] = useState(cat?.description || '');
  const [saving, setSaving] = useState(false);
  const ICONS = ['☕', '🧋', '🍰', '🥐', '🧁', '🍵', '🥤', '🍩', '🌿', '✨', '🍪', '🥛'];

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name, icon, description };
      if (cat) await api.patch(`/categories/${cat.id}`, payload);
      else await api.post('/categories', payload);
      toast.success(cat ? 'อัปเดตหมวดหมู่สำเร็จ' : 'สร้างหมวดหมู่สำเร็จ');
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!cat || !confirm(`ลบหมวด "${cat.name}" ?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      toast.success('ลบหมวดหมู่สำเร็จ');
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={cat ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
      description={cat ? `${cat._count.products} เมนูในหมวดนี้` : 'จัดกลุ่มเมนูให้หาง่าย'}
      footer={
        <>
          {cat && (
            <Button variant="ghost" onClick={remove} leftIcon={<Trash2 size={14} />}>
              ลบ
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit} loading={saving} disabled={!name.trim()}>
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            ไอคอน
          </label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className="w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all"
                style={{
                  background: icon === i ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border:
                    icon === i ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  transform: icon === i ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <Input
          label="ชื่อหมวดหมู่ *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น Coffee"
        />
        <Input
          label="คำอธิบาย"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="คำอธิบายสั้น ๆ (ไม่บังคับ)"
        />
      </div>
    </Modal>
  );
}

function OptionsDrawer({
  item,
  onClose,
  onChanged,
}: {
  item: MenuItem;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [groups, setGroups] = useState<OptionGroup[]>(item.optionGroups || []);
  const [addGroup, setAddGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', isRequired: false, maxSelect: 1 });
  const [addingOption, setAddingOption] = useState<string | null>(null);
  const [newOpt, setNewOpt] = useState({ label: '', priceAddon: '' });

  const refresh = async () => {
    const updated = await api.get<MenuItem>(`/menu/${item.id}`);
    setGroups(updated.optionGroups || []);
    onChanged();
  };
  const createGroup = async () => {
    if (!newGroup.name.trim()) return;
    try {
      await api.post(`/menu/${item.id}/option-groups`, newGroup);
      setNewGroup({ name: '', isRequired: false, maxSelect: 1 });
      setAddGroup(false);
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'ไม่สำเร็จ');
    }
  };
  const deleteGroup = async (gid: string) => {
    if (!confirm('ลบกลุ่มตัวเลือกนี้?')) return;
    await api.delete(`/menu/option-groups/${gid}`);
    refresh();
  };
  const createOption = async (gid: string) => {
    if (!newOpt.label.trim()) return;
    await api.post(`/menu/option-groups/${gid}/options`, {
      label: newOpt.label,
      priceAddon: newOpt.priceAddon ? parseFloat(newOpt.priceAddon) : 0,
    });
    setNewOpt({ label: '', priceAddon: '' });
    setAddingOption(null);
    refresh();
  };
  const deleteOption = async (oid: string) => {
    await api.delete(`/menu/options/${oid}`);
    refresh();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`ตัวเลือกของ ${item.name}`}
      description={`${groups.length} กลุ่ม · ${groups.reduce((s, g) => s + g.options.length, 0)} ตัวเลือก`}
    >
      <div className="space-y-4">
        {groups.map((g) => (
          <div
            key={g.id}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {g.name}
                </span>
                {g.isRequired && <Badge tone="danger">จำเป็น</Badge>}
                <Badge tone="neutral">เลือกได้ {g.maxSelect}</Badge>
              </div>
              <button
                onClick={() => deleteGroup(g.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--danger-soft)';
                  e.currentTarget.style.color = 'var(--danger)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="p-3 space-y-1.5">
              {g.options.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-1 group">
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                    {o.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {o.priceAddon > 0 && (
                      <span
                        className="text-xs font-semibold num"
                        style={{ color: 'var(--accent)' }}
                      >
                        +฿{o.priceAddon}
                      </span>
                    )}
                    <button
                      onClick={() => deleteOption(o.id)}
                      className="opacity-0 group-hover:opacity-100"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {addingOption === g.id ? (
                <div className="flex gap-2 pt-2">
                  <Input
                    containerClassName="flex-1"
                    placeholder="ชื่อตัวเลือก"
                    value={newOpt.label}
                    onChange={(e) => setNewOpt({ ...newOpt, label: e.target.value })}
                  />
                  <Input
                    containerClassName="w-24"
                    placeholder="+฿"
                    type="number"
                    value={newOpt.priceAddon}
                    onChange={(e) => setNewOpt({ ...newOpt, priceAddon: e.target.value })}
                  />
                  <Button size="sm" onClick={() => createOption(g.id)}>
                    เพิ่ม
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingOption(g.id)}
                  className="text-xs font-semibold flex items-center gap-1 mt-2"
                  style={{ color: 'var(--accent)' }}
                >
                  <Plus size={11} /> เพิ่มตัวเลือก
                </button>
              )}
            </div>
          </div>
        ))}
        {addGroup ? (
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <Input
              placeholder="ชื่อกลุ่ม เช่น เลือก Size"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <div
              className="flex items-center gap-4 text-sm flex-wrap"
              style={{ color: 'var(--text-2)' }}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGroup.isRequired}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, isRequired: e.target.checked })
                  }
                />
                บังคับเลือก
              </label>
              <div className="flex items-center gap-2">
                เลือกได้
                <input
                  type="number"
                  min={1}
                  className="w-14 h-9 rounded-lg px-2 text-center text-sm"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  value={newGroup.maxSelect}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, maxSelect: parseInt(e.target.value) || 1 })
                  }
                />
                รายการ
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createGroup} disabled={!newGroup.name.trim()}>
                สร้าง
              </Button>
              <Button variant="secondary" onClick={() => setAddGroup(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddGroup(true)}
            className="w-full py-3.5 border-2 border-dashed rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Plus size={14} /> เพิ่มกลุ่มตัวเลือก
          </button>
        )}
      </div>
    </Modal>
  );
}
