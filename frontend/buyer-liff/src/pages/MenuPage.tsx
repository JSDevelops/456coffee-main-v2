import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Coffee, X, ShoppingBag, SlidersHorizontal, Flame } from 'lucide-react';
import { MenuCard } from '../components/MenuCard';
import MenuDetailSheet from '../components/MenuDetailSheet';
import CategoryRail from '../components/CategoryRail';
import TopBar, { IconButton } from '../components/TopBar';
import { Skeleton, EmptyState, PrimaryButton } from '../components/ui/Primitives';
import { useSWR } from '../lib/cache';
import type { Category, MenuItem, MenuOption, CartItem } from '../types';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

interface Props {
  cart: CartItem[];
  onAddToCart: (item: MenuItem, qty: number, opts: Record<string, MenuOption[]>, note: string) => void;
  onOpenCart: () => void;
  /** Lets HomePage open a specific item directly. */
  preselected?: MenuItem | null;
  onClearPreselected?: () => void;
}

type SortKey = 'recommended' | 'price-asc' | 'price-desc';

export default function MenuPage({ cart, onAddToCart, onOpenCart, preselected, onClearPreselected }: Props) {
  const { data: categoriesData } = useSWR<Category[]>(`${API}/categories`, { ttl: 120_000 });
  const { data: itemsData, loading } = useSWR<MenuItem[]>(`${API}/menu`, { ttl: 60_000 });

  const categories = categoriesData ?? [];
  const items = itemsData ?? [];

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [showFilter, setShowFilter] = useState(false);

  // External request to open an item.
  useEffect(() => {
    if (preselected) {
      setSelectedItem(preselected);
      onClearPreselected?.();
    }
  }, [preselected, onClearPreselected]);

  const filtered = useMemo(() => {
    let list = items.filter((i) => i.status !== 'HIDDEN');
    if (activeCat) list = list.filter((i) => i.category?.id === activeCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    if (sort === 'price-asc')  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [items, activeCat, search, sort]);

  const cartTotal = cart.reduce((s, i) => s + i.unitTotal, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden buyer-shell-bg">
      {/* ── Sticky TopBar ── */}
      <div className="sticky top-0 z-20">
        <TopBar
          variant="glass"
          kicker="✦ 456 Coffee · Menu"
          title="เมนูทั้งหมด"
          trailing={
            <>
              <IconButton onClick={() => setShowSearch((v) => !v)} label="ค้นหา">
                <Search size={18} />
              </IconButton>
              <IconButton onClick={() => setShowFilter((v) => !v)} label="ตัวกรอง" tone="gold">
                <SlidersHorizontal size={18} />
              </IconButton>
            </>
          }
        />

        <div className="px-5 pb-3 glass border-b border-[var(--hairline)]">
          <AnimatePresence initial={false}>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 ink-soft" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาเมนู..."
                    className="w-full bg-white hairline rounded-2xl h-11 pl-11 pr-10 text-[11.5px] ink outline-none focus:shadow-glow"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-paper-dim flex items-center justify-center"
                    >
                      <X size={14} className="ink-soft" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category rail */}
          <CategoryRail
            categories={categories}
            activeId={activeCat}
            onSelect={setActiveCat}
            variant="filter"
            totalCount={items.length}
          />

          <AnimatePresence initial={false}>
            {showFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pt-3">
                  {(['recommended', 'price-asc', 'price-desc'] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSort(k)}
                      className={`h-9 px-4 rounded-full text-[10.5px] font-semibold transition-all ${
                        sort === k
                          ? 'text-white shadow-rose'
                          : 'bg-white hairline ink-soft'
                      }`}
                      style={sort === k ? { background: 'linear-gradient(135deg, #f43f7a, #8b5cf6)' } : undefined}
                    >
                      {k === 'recommended' ? '✦ แนะนำ' : k === 'price-asc' ? 'ราคา ↑' : 'ราคา ↓'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-44 no-scrollbar">
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 pt-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden hairline">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Coffee size={32} />}
            title="ไม่พบเมนูที่ค้นหา"
            body={search ? `ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่` : 'หมวดหมู่นี้ยังไม่มีเมนู'}
            action={search ? (
              <button onClick={() => { setSearch(''); setActiveCat(null); }} className="text-[11.5px] font-semibold text-[var(--accent-deep)]">
                ล้างตัวกรอง
              </button>
            ) : null}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-3">
            {filtered.map((m) => (
              <MenuCard key={m.id} item={m} onSelect={() => setSelectedItem(m)} onAddQuick={() => setSelectedItem(m)} />
            ))}
          </div>
        )}
      </div>

      {/* Floating "View Cart" pill */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-24 w-full max-w-md px-5 z-30"
          >
            <button
              onClick={onOpenCart}
              className="w-full h-14 rounded-2xl text-white shadow-deep flex items-center justify-between px-5"
              style={{ background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 50%, #b9530a 100%)' }}
            >
              <span className="inline-flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-white/18 ring-1 ring-white/24 flex items-center justify-center">
                  <ShoppingBag size={16} />
                </span>
                <span className="font-display font-semibold text-[12.5px]">{cartCount} รายการในตะกร้า</span>
              </span>
              <span className="font-semibold text-[13px] inline-flex items-center gap-2 text-[var(--gold-1)]">
                ฿{cartTotal} <Flame size={16} />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <MenuDetailSheet
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToCart={onAddToCart}
          />
        )}
      </AnimatePresence>

      {/* unused — kept to silence the "unused PrimaryButton" warning if tree-shaking sees the file */}
      {false && <PrimaryButton>x</PrimaryButton>}
    </div>
  );
}
