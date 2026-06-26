import { motion, AnimatePresence } from 'framer-motion';
import { Home, Coffee, ShoppingBag, ClipboardList, User } from 'lucide-react';
import type { TabId } from '../types';

// Touch/hover prefetch — kicks off the chunk download before navigation.
const PREFETCHERS: Partial<Record<TabId, () => Promise<unknown>>> = {
  menu:    () => import('../pages/MenuPage'),
  cart:    () => import('../pages/CartPage'),
  orders:  () => import('../pages/OrdersPage'),
  profile: () => import('../pages/ProfilePage'),
};

const TABS: { id: TabId; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[] = [
  { id: 'home',    icon: Home,           label: 'หน้าแรก' },
  { id: 'menu',    icon: Coffee,         label: 'เมนู' },
  { id: 'cart',    icon: ShoppingBag,    label: 'ตะกร้า' },
  { id: 'orders',  icon: ClipboardList,  label: 'ออเดอร์' },
  { id: 'profile', icon: User,           label: 'ฉัน' },
];

export default function BottomNav({
  tab, onChange, cartCount,
}: { tab: TabId; onChange: (t: TabId) => void; cartCount: number }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-4 pb-safe">
      <div className="relative mt-3 mb-3 rounded-[2.2rem] shadow-deep luxe-border glass">
        <div className="grid grid-cols-5 h-[68px] relative px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            const showBadge = t.id === 'cart' && cartCount > 0;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                onPointerDown={() => PREFETCHERS[t.id]?.()}
                onMouseEnter={() => PREFETCHERS[t.id]?.()}
                className="relative flex flex-col items-center justify-center"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                    className="absolute top-1.5 w-12 h-12 rounded-2xl shadow-amber"
                    style={{ background: 'linear-gradient(135deg, #ffd166 0%, #f5b301 55%, #ff7eb6 100%)' }}
                  />
                )}
                <div className={`relative z-10 ${isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9.5px] font-extrabold flex items-center justify-center shadow-rose border-2 border-white"
                        style={{ background: 'linear-gradient(135deg, #f43f7a, #8b5cf6)' }}
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={`text-[9.5px] mt-1 font-semibold tracking-wide transition-colors relative z-10 ${
                    isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]/75'
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
