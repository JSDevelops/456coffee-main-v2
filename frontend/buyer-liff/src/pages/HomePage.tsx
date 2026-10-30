import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Coffee,
  Crown,
  Gift,
  MapPin,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  Zap,
} from 'lucide-react';
import { MenuCardLarge } from '../components/MenuCard';
import CategoryRail from '../components/CategoryRail';
import { Skeleton, SectionTitle } from '../components/ui/Primitives';
import { useSWR, preloadImages } from '../lib/cache';
import { memberTier, type Branch, type Category, type MenuItem, type Member, type Order, type TabId } from '../types';
import { API_BASE as API } from '../api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  pinned: boolean;
  startDate?: string | null;
  endDate?: string | null;
  responseUrl?: string | null;
  createdAt: string;
}

interface Props {
  user: Member | null | { displayName?: string; pictureUrl?: string };
  member: Member | null;
  recentOrders: Order[];
  onNavigate: (tab: TabId) => void;
  onSelectBranch: (b: Branch) => void;
  onOpenMenu: (item?: MenuItem) => void;
  onReorder: (order: Order) => void;
  onOpenAuth: () => void;
}

export default function HomePage({
  user,
  member,
  recentOrders,
  onNavigate,
  onSelectBranch,
  onOpenMenu,
  onReorder,
  onOpenAuth,
}: Props) {
  const { data: branchesData, loading: branchesLoading } = useSWR<Branch[]>(`${API}/branches`, { ttl: 60_000 });
  const { data: menuData, loading: menuLoading } = useSWR<MenuItem[]>(`${API}/menu`, { ttl: 60_000 });
  const { data: categoriesData } = useSWR<Category[]>(`${API}/categories`, { ttl: 120_000 });
  const { data: announcementsData } = useSWR<Announcement[]>(`${API}/announcements/customer`, { ttl: 60_000 });

  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  const branches = branchesData ?? [];
  const featured = useMemo(() => (menuData ?? []).slice(0, 8), [menuData]);
  const categories = categoriesData ?? [];
  const loading = branchesLoading && menuLoading;

  // Warm the image cache for featured items so the Menu page paints instantly
  // and the detail sheet's hero image shows up without the usual blink.
  useEffect(() => {
    if (!menuData?.length) return;
    preloadImages(menuData.slice(0, 12).map((m) => m.imageUrl));
  }, [menuData]);

  const tier = useMemo(() => memberTier(member?.points || 0), [member?.points]);
  const points = member?.points || 0;
  const progress = Math.min(100, ((points - tier.min) / (tier.next - tier.min)) * 100);
  const rawDisplay = (member as any)?.name || (user as any)?.displayName || '';
  const display = /mock/i.test(rawDisplay)
    ? rawDisplay.replace(/\s*\(mock\)\s*/gi, '').trim() || 'ลูกค้า 456 Coffee'
    : rawDisplay || 'ลูกค้า 456 Coffee';
  const picture = (member as any)?.pictureUrl || (user as any)?.pictureUrl;
  const openBranches = branches.filter((b) => b.isOpen);
  const readyMenuCount = featured.filter((m) => m.status === 'AVAILABLE').length;
  const firstBranch = openBranches[0] || branches[0];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return 'อรุณสวัสดิ์';
    if (h < 17) return 'พักบ่ายอย่างมีระดับ';
    return 'ค่ำคืนนี้ ดื่มด่ำกับรสกาแฟ';
  }, []);

  const greetingSub = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return 'เริ่มต้นวันใหม่ ด้วยแก้วโปรดของคุณ';
    if (h < 17) return 'เติมพลังบ่าย ด้วยกาแฟแก้วพิเศษ';
    return 'ผ่อนคลาย กับรสชาติที่ปรุงด้วยใจ';
  }, []);

  const quickActions = [
    {
      label: 'ดูเมนู',
      desc: `${readyMenuCount || featured.length || 0} เมนูพร้อมเสิร์ฟ`,
      icon: Coffee,
      className: 'buyer-action-orange',
      onClick: () => onNavigate('menu'),
    },
    {
      label: 'สั่งซ้ำ',
      desc: recentOrders[0] ? 'แก้วโปรดล่าสุด' : 'เริ่มจากเมนูขายดี',
      icon: RefreshCw,
      className: 'buyer-action-mint',
      onClick: () => (recentOrders[0] ? onReorder(recentOrders[0]) : onNavigate('menu')),
    },
    {
      label: 'ตะกร้า',
      desc: 'ตรวจรายการก่อนจ่าย',
      icon: ShoppingBag,
      className: 'buyer-action-pink',
      onClick: () => onNavigate('cart'),
    },
    {
      label: 'เลือกสาขา',
      desc: firstBranch?.name || 'ดูสาขาที่เปิด',
      icon: StoreIcon,
      className: 'buyer-action-blue',
      onClick: () => {
        document.getElementById('branch-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },
  ];

  return (
    <div className="buyer-shell-bg relative flex-1 overflow-y-auto no-scrollbar pb-32">
      {/* Decorative orbs floating in background */}
      <span className="aurora pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(245,179,1,0.45), transparent 70%)' }} />
      <span className="aurora pointer-events-none absolute top-1/2 -left-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.30), transparent 70%)' }} />

      <header className="relative px-5 pt-7">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={member ? undefined : onOpenAuth}
            className="min-w-0 flex items-center gap-3 text-left"
          >
            <span className="relative shrink-0">
              <span className="absolute -inset-[3px] rounded-[1.55rem] spin-slow opacity-90"
                    style={{ background: 'conic-gradient(from 90deg, #ffd166, #f43f7a, #8b5cf6, #14b8a6, #ffd166)' }} />
              {picture ? (
                <img src={picture} alt="" className="relative h-12 w-12 rounded-[1.35rem] object-cover ring-2 ring-white shadow-soft" />
              ) : (
                <span className="relative grid h-12 w-12 place-items-center rounded-[1.35rem] bg-[var(--ink)] text-white shadow-soft">
                  <Coffee size={21} />
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-[9.5px] font-black uppercase tracking-[0.32em] text-gold">
                ✦ 456 Coffee Atelier
              </span>
              <span className="font-display block truncate text-[13.5px] font-extrabold leading-tight ink">
                {display}
              </span>
            </span>
          </button>

          <button
            onClick={() => onNavigate('orders')}
            className="grid h-12 w-12 place-items-center rounded-[1.35rem] bg-white text-ink hairline-gold shadow-soft active:scale-95 transition-transform"
            aria-label="ดูออเดอร์"
          >
            <ReceiptText size={20} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative px-5 pt-5">
        <div className="buyer-hero relative overflow-hidden rounded-[2.2rem] p-6 shadow-deep luxe-border">
          <span className="aurora absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/12 blur-md" />
          <span className="aurora absolute -left-12 -bottom-14 h-44 w-44 rounded-full bg-white/8 blur-md" />

          <div className="relative">
            <div className="buyer-hero-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9.5px] font-black uppercase tracking-[0.24em]">
              <Sparkles size={12} className="text-[var(--gold-1)]" />
              Premium Coffee · Live Order
            </div>

            <h1 className="font-display mt-4 max-w-[290px] text-[18px] font-extrabold leading-[1.04] tracking-tight">
              {greeting}
            </h1>
            <p className="buyer-hero-muted mt-2 max-w-[280px] text-[11px] font-semibold leading-relaxed">
              {greetingSub}
            </p>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
              <button
                onClick={() => onNavigate('menu')}
                className="buyer-contrast-dark group relative h-[54px] overflow-hidden rounded-2xl bg-white px-5 text-left text-[11.5px] font-extrabold shadow-soft active:scale-[.98] transition-transform"
              >
                <span className="font-display mr-1">สั่งเลย</span>
                <span className="text-[11px] ink-mute font-semibold">— ปรุงให้คุณ</span>
                <span className="ml-2 inline-flex align-middle text-[var(--accent-deep)]">
                  <ArrowRight size={16} />
                </span>
                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
              </button>
              <button
                onClick={() => (recentOrders[0] ? onReorder(recentOrders[0]) : onNavigate('menu'))}
                className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-white/16 text-white ring-1 ring-white/30 active:scale-95 transition-transform backdrop-blur"
                aria-label="สั่งซ้ำ"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            {/* Inline trust badges */}
            <div className="mt-5 flex items-center gap-2 text-[9.5px] font-extrabold uppercase tracking-[0.18em] buyer-hero-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <Zap size={11} className="text-[var(--gold-1)]" /> Live
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <Crown size={11} className="text-[var(--gold-1)]" /> Atelier
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <Sparkles size={11} className="text-[var(--gold-1)]" /> Crafted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="relative px-5 pt-4">
        <button
          onClick={() => onNavigate('menu')}
          className="flex h-14 w-full items-center gap-3 rounded-[1.4rem] bg-white px-4 text-left hairline shadow-soft active:scale-[.99] transition-transform"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-deep)]">
            <Search size={17} />
          </span>
          <span className="min-w-0 flex-1 text-[11px] font-semibold ink-soft">
            ค้นหากาแฟ ชา เมนูสดชื่น...
          </span>
          <span className="rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--gold-1)] px-3 py-1 text-[9.5px] font-black text-[var(--ink)] shadow-pop">
            ค้นหา
          </span>
        </button>
      </section>

      {/* QUICK ACTIONS */}
      <section className="relative px-5 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ icon: Icon, label, desc, className, onClick }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.97 }}
              onClick={onClick}
              className={`buyer-action-card relative min-h-[120px] overflow-hidden rounded-[1.7rem] ${className} p-4 text-left`}
            >
              <span className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/22 blur-md" />
              <span className="absolute -left-3 -bottom-3 h-16 w-16 rounded-full bg-white/12 blur" />
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/26 ring-1 ring-white/30 backdrop-blur">
                <Icon size={20} />
              </span>
              <span className="font-display relative mt-4 block text-[13px] font-extrabold leading-tight drop-shadow-sm">
                {label}
              </span>
              <span className="relative mt-1 block truncate text-[10.5px] font-bold text-white/85">
                {desc}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* MEMBER CARD */}
      <section className="relative mt-6 px-5">
        <div className="luxe-border relative rounded-[1.9rem] bg-white p-5 shadow-soft overflow-hidden">
          <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(245,179,1,0.55), transparent 70%)' }} />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-[0.28em] text-gold">
                <Crown size={11} /> Member · {tier.name}
              </p>
              <p className="font-display mt-1 text-[18px] font-extrabold leading-none ink">
                {points.toLocaleString()}
                <span className="font-body ml-1.5 text-sm font-extrabold ink-soft">แต้ม</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[var(--rose)] to-[var(--lavender)] px-3.5 text-[10.5px] font-black text-white shadow-rose active:scale-95 transition-transform"
            >
              <Gift size={14} />
              สิทธิ์ของฉัน
            </button>
          </div>

          <div className="relative mt-4">
            <div className="mb-2 flex items-center justify-between text-[9.5px] font-black tracking-wider ink-mute">
              <span className="uppercase">{tier.name}</span>
              <span>{tier.next.toLocaleString()} แต้ม</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--paper-dim)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #c98315 0%, #f5b301 45%, #f43f7a 100%)' }}
              />
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[var(--mint-soft)] px-3 py-3">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-[var(--mint)]">สาขาเปิด</p>
              <p className="font-display mt-1 text-xl font-extrabold ink">
                {openBranches.length}<span className="text-sm ink-mute font-bold">/{branches.length || 0}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--lavender-soft)] px-3 py-3">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-[var(--lavender)]">เมนูพร้อมขาย</p>
              <p className="font-display mt-1 text-xl font-extrabold ink">{readyMenuCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS / PROMOTIONS */}
      {announcementsData && announcementsData.length > 0 && (
        <section className="relative mt-6">
          <SectionTitle
            kicker="✦ Promotions & News"
            title="ข่าวสาร & โปรโมชั่นพิเศษ"
          />
          <div className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-2.5 no-scrollbar">
            {announcementsData.map((ann) => (
              <motion.button
                key={ann.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAnn(ann)}
                className="relative snap-start flex h-[105px] w-[270px] shrink-0 flex-col justify-between rounded-3xl bg-white p-4 text-left hairline shadow-soft overflow-hidden"
              >
                {/* Decorative gradients */}
                <span className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-gradient-to-tr from-pink-400/20 to-orange-400/20 blur" />
                
                <div className="relative space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider ${
                      ann.pinned ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {ann.pinned ? 'สำคัญ' : 'โปรโมชั่น'}
                    </span>
                    <span className="text-[8.5px] font-bold text-stone-400">
                      {new Date(ann.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-[12px] text-stone-850 line-clamp-1 leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-[10px] font-bold text-stone-500 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="relative mt-7">
          <SectionTitle
            title="เลือกตามอารมณ์"
            kicker="✦ Categories"
            action={
              <button onClick={() => onNavigate('menu')} className="text-[10.5px] font-semibold text-gold inline-flex items-center gap-1">
                ดูทั้งหมด <ArrowRight size={12} />
              </button>
            }
          />
          <div className="px-5">
            <CategoryRail
              categories={categories}
              activeId={null}
              onSelect={() => onNavigate('menu')}
              variant="preview"
            />
          </div>
        </section>
      )}

      {/* FEATURED */}
      <section className="relative mt-7">
        <SectionTitle
          kicker="✦ จากเมนูจริง"
          title="เมนูที่น่าลองวันนี้"
          action={
            <button onClick={() => onNavigate('menu')} className="text-[10.5px] font-black text-gold inline-flex items-center gap-1">
              ดูทั้งหมด <ArrowRight size={12} />
            </button>
          }
        />
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
          {loading
            ? [0, 1].map((i) => <Skeleton key={i} className="h-56 w-[70%] shrink-0 rounded-[1.8rem]" />)
            : featured.map((item) => (
                <MenuCardLarge key={item.id} item={item} onSelect={() => onOpenMenu(item)} />
              ))}
        </div>
      </section>

      {/* RECENT */}
      {recentOrders.length > 0 && (
        <section className="relative mt-7">
          <SectionTitle title="รายการล่าสุด" kicker="✦ Reorder" />
          <div className="space-y-3 px-5">
            {recentOrders.slice(0, 2).map((order) => {
              const items = order.items?.slice(0, 2)
                .map((item: any) => item.productName || item.product?.name)
                .filter(Boolean)
                .join(', ') || 'รายการล่าสุด';

              return (
                <motion.button
                  key={order.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onReorder(order)}
                  className="flex w-full items-center gap-3 rounded-[1.6rem] bg-white p-3 text-left hairline shadow-soft"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--mint)] to-[var(--mint-soft)] text-white shadow-soft">
                    <RefreshCw size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block truncate text-[11.5px] font-extrabold ink">{items}</span>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] font-bold ink-mute">
                      <Clock size={11} />
                      {new Date(order.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      <span>·</span>
                      <span className="text-gold font-black">฿{order.totalAmount}</span>
                    </span>
                  </span>
                  <ChevronRight size={18} className="ink-mute" />
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* BRANCHES */}
      <section id="branch-section" className="relative mt-7 px-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[9.5px] font-black uppercase tracking-[0.28em] text-gold">✦ Stores</p>
            <h2 className="font-display text-[13.5px] font-extrabold leading-tight ink">เลือกสาขารับสินค้า</h2>
          </div>
          <span className="rounded-full bg-[var(--success-soft)] px-3 py-1 text-[9.5px] font-black text-[var(--success)]">
            ● เปิด {openBranches.length}
          </span>
        </div>

        <div className="space-y-3">
          {loading
            ? [0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-[1.6rem]" />)
            : branches.map((branch) => (
                <motion.button
                  key={branch.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectBranch(branch)}
                  className="flex w-full items-center gap-3 rounded-[1.6rem] bg-white p-3 text-left hairline shadow-soft"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--ink)] to-[var(--espresso-2)] text-[var(--gold-1)]">
                    <StoreIcon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display truncate text-[11.5px] font-extrabold ink">{branch.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${
                        branch.isOpen ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {branch.isOpen ? '● เปิด' : 'ปิด'}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 truncate text-[10.5px] font-bold ink-mute">
                      <MapPin size={11} />
                      <span className="truncate">{branch.address || 'รายละเอียดสถานที่'}</span>
                    </span>
                  </span>
                  <ChevronRight size={18} className="ink-mute" />
                </motion.button>
              ))}
        </div>
      </section>
      {/* ANNOUNCEMENT DETAIL MODAL */}
      <AnimatePresence>
        {selectedAnn && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAnn(null)}>
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-t-[2.2rem] sm:rounded-[2.2rem] bg-white p-6 shadow-deep max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              {/* Drag indicator for mobile */}
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-200 sm:hidden" />

              <div className="flex justify-between items-start gap-4 mb-4">
                <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider ${
                  selectedAnn.pinned ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-stone-100 text-stone-600'
                }`}>
                  {selectedAnn.pinned ? 'ประกาศสำคัญ' : 'ข่าวสาร & โปรโมชั่น'}
                </span>
                <span className="text-[10px] font-bold text-stone-400">
                  {new Date(selectedAnn.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <h2 className="font-display font-extrabold text-[16px] text-stone-850 leading-snug mb-3">
                {selectedAnn.title}
              </h2>

              <div className="text-[11.5px] font-bold text-stone-600 leading-relaxed whitespace-pre-wrap mb-6 max-h-[40vh] overflow-y-auto pr-1">
                {selectedAnn.content}
              </div>

              {/* Event Dates if present */}
              {(selectedAnn.startDate || selectedAnn.endDate) && (
                <div className="mb-6 rounded-2xl bg-amber-50/60 p-4 border border-amber-100/50 flex flex-col gap-1 text-[11px] font-extrabold text-amber-800">
                  <span className="text-[9.5px] font-black text-amber-600 uppercase tracking-wider">ระยะเวลากิจกรรม / โปรโมชั่น</span>
                  <span>
                    {selectedAnn.startDate ? new Date(selectedAnn.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    {selectedAnn.endDate && selectedAnn.endDate !== selectedAnn.startDate ? ` ถึง ${new Date(selectedAnn.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {selectedAnn.responseUrl && (
                  <a
                    href={selectedAnn.responseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--rose)] to-[var(--lavender)] text-white text-[12.5px] font-black tracking-wider shadow-rose active:scale-95 transition-transform text-center"
                  >
                    รับสิทธิ์ / ตอบรับเข้าร่วม
                  </a>
                )}
                <button
                  onClick={() => setSelectedAnn(null)}
                  className="flex h-[50px] w-full items-center justify-center rounded-2xl bg-stone-100 text-stone-600 text-[11.5px] font-extrabold active:scale-95 transition-transform"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
