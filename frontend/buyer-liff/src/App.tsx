import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

import { useLiff } from './hooks/useLiff';
import BottomNav from './components/BottomNav';
import Splash from './components/Splash';

import HomePage from './pages/HomePage';
// Pages other than Home are loaded on demand to keep first paint fast.
const MenuPage    = lazy(() => import('./pages/MenuPage'));
const CartPage    = lazy(() => import('./pages/CartPage'));
const OrdersPage  = lazy(() => import('./pages/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Modals & sheets are mounted infrequently — split them out.
const AuthModal = lazy(() => import('./components/AuthModal'));
const AddressFormSheet       = lazy(() => import('./sheets/AddressSheets').then((m) => ({ default: m.AddressFormSheet })));
const AddressManagementSheet = lazy(() => import('./sheets/AddressSheets').then((m) => ({ default: m.AddressManagementSheet })));
const PromptPayQrSheet       = lazy(() => import('./sheets/PromptPayQrSheet'));

import { auth } from './api';
import { swr, cachedFetch, invalidate, getCached, setCached } from './lib/cache';
import type { Branch, CartItem, MemberAddress, MenuItem, MenuOption, Member, Order, TabId } from './types';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

/** Lightweight loader shown while a lazy page chunk arrives. */
function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center buyer-shell-bg">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Prefetch lazy chunks for likely-next tabs while the user is reading the
 *  current one. Browsers idle-load JS in parallel with rendering, so the
 *  next tab is usually already parsed before the user taps it. */
function prefetchPages() {
  // Fire-and-forget — errors surface as console warnings only.
  void import('./pages/MenuPage');
  void import('./pages/CartPage');
  void import('./pages/OrdersPage');
  void import('./pages/ProfilePage');
}

export default function App() {
  const { user, isLiffLoading } = useLiff();

  const [tab, setTab] = useState<TabId>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingQrOrder, setPendingQrOrder] = useState<Order | null>(null);
  const [justOrdered, setJustOrdered] = useState(false);

  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isAddressManageOpen, setIsAddressManageOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<MemberAddress | null>(null);

  // For HomePage → MenuPage deep link to a specific item.
  const [pendingMenuItem, setPendingMenuItem] = useState<MenuItem | null>(null);

  /* ── Member sync ───────────────────────────────────── */
  const refreshMember = useCallback((opts?: { force?: boolean }) => {
    if (!localStorage.getItem('authToken')) return;
    return swr<Member | null>(
      `${API}/auth/me`,
      (m) => setMember(m),
      { ttl: 30_000, force: opts?.force },
    );
  }, []);

  useEffect(() => { refreshMember(); }, [refreshMember]);

  /* ── Catalog warmup & lazy chunk prefetch ───────────── */
  // Populate the cache with /menu, /branches, /categories the moment LIFF
  // resolves. By the time HomePage mounts the data is usually already there.
  // Also prefetch the JS chunks for the other tabs in idle time.
  useEffect(() => {
    if (isLiffLoading) return;
    cachedFetch(`${API}/menu`,       { ttl: 60_000  }).catch(() => {});
    cachedFetch(`${API}/branches`,   { ttl: 60_000  }).catch(() => {});
    cachedFetch(`${API}/categories`, { ttl: 120_000 }).catch(() => {});

    const ric = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
    if (ric) ric(prefetchPages); else setTimeout(prefetchPages, 1500);
  }, [isLiffLoading]);

  // Pull recent orders for HomePage quick-reorder once we know who the user is.
  useEffect(() => {
    const uid = user?.userId || member?.id;
    if (!uid || uid === 'walk-in') return;
    return swr<Order[]>(
      `${API}/orders/customer/${uid}`,
      (d) => setRecentOrders(Array.isArray(d) ? d : []),
      { ttl: 30_000 },
    );
  }, [user, member]);

  /* ── Cart helpers ──────────────────────────────────── */
  const addToCart = (item: MenuItem, qty: number, opts: Record<string, MenuOption[]>, note: string) => {
    const optionsPrice = Object.values(opts).flat().reduce((s, o) => s + o.priceAddon, 0);
    const unitTotal = (item.price + optionsPrice) * qty;
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) => c.menuItem.id === item.id
            && JSON.stringify(c.selectedOptions) === JSON.stringify(opts)
            && c.note === note,
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + qty,
          unitTotal: updated[idx].unitTotal + unitTotal,
        };
        return updated;
      }
      return [...prev, { menuItem: item, quantity: qty, selectedOptions: opts, note, unitTotal }];
    });
  };

  const updateQty = (idx: number, q: number) => {
    if (q <= 0) { setCart((prev) => prev.filter((_, i) => i !== idx)); return; }
    setCart((prev) => {
      const u = [...prev];
      const item = u[idx];
      const optPx = Object.values(item.selectedOptions).flat().reduce((s, o) => s + o.priceAddon, 0);
      u[idx] = { ...item, quantity: q, unitTotal: (item.menuItem.price + optPx) * q };
      return u;
    });
  };

  /* ── Reorder a previous order ──────────────────────── */
  const reorder = async (order: Order) => {
    try {
      const menu = await cachedFetch<MenuItem[]>(`${API}/menu`, { ttl: 60_000 });
      const next: CartItem[] = [];
      for (const it of order.items || []) {
        const product = menu.find((m) => m.id === (it.productId || it.product?.id));
        if (!product) continue;
        let opts: any[] = [];
        try { opts = JSON.parse(it.selectedOptions || '[]'); } catch {}
        const grouped: Record<string, MenuOption[]> = {};
        // Group flat option list back into selectedOptions shape using product groups.
        product.optionGroups.forEach((g) => {
          const matches = opts.filter((o: any) => g.options.some((p) => p.id === o.id));
          if (matches.length) {
            grouped[g.id] = matches.map((m: any) => g.options.find((o) => o.id === m.id)!).filter(Boolean);
          }
        });
        const optionsPrice = Object.values(grouped).flat().reduce((s, o) => s + o.priceAddon, 0);
        next.push({
          menuItem: product,
          quantity: it.quantity,
          selectedOptions: grouped,
          note: it.note || '',
          unitTotal: (product.price + optionsPrice) * it.quantity,
        });
      }
      setCart((prev) => [...prev, ...next]);
      if (order.branch) setSelectedBranch(order.branch);
      setTab('cart');
    } catch (err) {
      console.error('reorder failed', err);
    }
  };

  /* ── Checkout ──────────────────────────────────────── */
  const handleCheckout = async ({ method, type, note, address }: { method: string; type: string; note: string; address?: string }) => {
    if (!selectedBranch || cart.length === 0) return;
    const total = cart.reduce((s, i) => s + i.unitTotal, 0);
    const userId = member?.id || user?.id || localStorage.getItem('memberId');

    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId: selectedBranch.id,
        userId,
        customerUid: user?.userId || member?.id || 'walk-in',
        customerName: (user as any)?.displayName || member?.name,
        totalAmount: total,
        fulfillmentType: type,
        paymentMethod: method,
        note,
        address,
        items: cart.map((i) => ({
          productId: i.menuItem.id,
          productName: i.menuItem.name,
          quantity: i.quantity,
          unitPrice: i.menuItem.price,
          optionsPrice: Object.values(i.selectedOptions).flat().reduce((s, o) => s + o.priceAddon, 0),
          price: i.unitTotal / i.quantity,
          selectedOptions: Object.values(i.selectedOptions).flat(),
        })),
      }),
    });
    if (!res.ok) { alert('ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่'); return; }
    const created: Order = await res.json();

    setCart([]);
    setJustOrdered(true);
    setTab('orders');
    setPendingQrOrder(method === 'QR' ? created : null);
    setTimeout(() => setJustOrdered(false), 3000);

    // Optimistically prepend the new order into the cache so OrdersPage paints
    // it instantly, then mark stale so the next visit refreshes from server.
    const uid = user?.userId || member?.id;
    if (uid && created?.id) {
      const key = `${API}/orders/customer/${uid}`;
      const cur = getCached<Order[]>(key) ?? [];
      setCached(key, [created, ...cur]);
    } else if (uid) {
      invalidate(`${API}/orders/customer/${uid}`);
    }

    if (userId) {
      setTimeout(() => refreshMember(), 1500);
    }
  };

  /* ── Logout ────────────────────────────────────────── */
  const handleLogout = () => {
    if (!confirm('ยืนยันการออกจากระบบ?')) return;
    auth.clear();
    setMember(null);
  };

  /* ── Splash ────────────────────────────────────────── */
  if (isLiffLoading) return <Splash />;

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-paper md:my-4 md:rounded-[2.5rem] md:max-h-[calc(100vh-2rem)] md:shadow-deep md:luxe-border">
      {/* Success toast */}
      <AnimatePresence>
        {justOrdered && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -32, scale: 0.92 }}
            className="fixed top-4 left-4 right-4 z-[180] max-w-md mx-auto text-white p-4 rounded-[1.6rem] shadow-deep flex items-center justify-between luxe-border"
            style={{ background: 'linear-gradient(135deg, #2b1530 0%, #4d2546 60%, #b9530a 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/18 ring-1 ring-white/24 text-[var(--gold-1)] flex items-center justify-center shrink-0">
                <Check size={18} strokeWidth={3} />
              </div>
              <div>
                <p className="font-display font-extrabold text-[12.5px]">สั่งซื้อสำเร็จ!</p>
                <p className="text-[10.5px] opacity-80 font-medium">เรากำลังเตรียมเครื่องดื่มของคุณ</p>
              </div>
            </div>
            <span className="text-[9.5px] font-extrabold bg-gradient-to-r from-[var(--gold-1)] to-[var(--accent)] text-ink px-2.5 py-1 rounded-full shadow-amber">
              +{Math.floor(cart.reduce((s, i) => s + i.unitTotal, 0) / 10)} แต้ม
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <Suspense fallback={<PageFallback />}>
              {tab === 'home' && (
                <HomePage
                  user={user}
                  member={member}
                  recentOrders={recentOrders}
                  onNavigate={setTab}
                  onSelectBranch={(b) => { setSelectedBranch(b); setTab('menu'); }}
                  onOpenMenu={(item) => { if (item) setPendingMenuItem(item); setTab('menu'); }}
                  onReorder={reorder}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              )}
              {tab === 'menu' && (
                <MenuPage
                  cart={cart}
                  onAddToCart={addToCart}
                  onOpenCart={() => setTab('cart')}
                  preselected={pendingMenuItem}
                  onClearPreselected={() => setPendingMenuItem(null)}
                />
              )}
              {tab === 'cart' && (
                <CartPage
                  cart={cart}
                  onUpdateQty={updateQty}
                  onRemove={(idx) => setCart((p) => p.filter((_, i) => i !== idx))}
                  onCheckout={handleCheckout}
                  selectedBranch={selectedBranch}
                  setSelectedBranch={setSelectedBranch}
                  member={member}
                  onOpenAuth={() => setIsAuthOpen(true)}
                  onAddNewAddress={() => { setEditingAddress(null); setIsAddressFormOpen(true); }}
                  onNavigate={setTab}
                />
              )}
              {tab === 'orders' && (
                <OrdersPage customerUid={user?.userId || member?.id || 'walk-in'} />
              )}
              {tab === 'profile' && (
                <ProfilePage
                  member={member}
                  onNavigate={setTab}
                  onOpenAddresses={() => setIsAddressManageOpen(true)}
                  onOpenAuth={() => setIsAuthOpen(true)}
                  onLogout={handleLogout}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <BottomNav tab={tab} onChange={setTab} cartCount={cartCount} />

      {/* Modals & sheets — lazy-loaded only when first opened */}
      <Suspense fallback={null}>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={(m: any) => {
              setMember(m);
              if (m?.id) localStorage.setItem('memberId', m.id);
              refreshMember();
            }}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isAddressManageOpen && (
          <AddressManagementSheet
            open={isAddressManageOpen}
            onClose={() => setIsAddressManageOpen(false)}
            member={member}
            onRefresh={refreshMember}
            onAdd={() => { setEditingAddress(null); setIsAddressFormOpen(true); }}
            onEdit={(a) => { setEditingAddress(a); setIsAddressFormOpen(true); }}
          />
        )}
        {isAddressFormOpen && (
          <AddressFormSheet
            open={isAddressFormOpen}
            onClose={() => { setIsAddressFormOpen(false); setEditingAddress(null); }}
            onSaved={refreshMember}
            initial={editingAddress}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <AnimatePresence>
          {pendingQrOrder?.paymentQr && (
            <PromptPayQrSheet order={pendingQrOrder} onClose={() => setPendingQrOrder(null)} />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
