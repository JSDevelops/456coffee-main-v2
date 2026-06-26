import { Menu as MenuIcon, Search, Sun, Moon, Bell, ChevronRight } from 'lucide-react';
import type { Page } from './Sidebar';

interface TopBarProps {
  onSidebarOpen: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  searchPlaceholder?: string;
  onSearchChange?: (q: string) => void;
  active?: Page;
  onProfileClick?: () => void;
}

const PAGE_LABEL: Record<Page, string> = {
  overview:  'แดชบอร์ด',
  orders:    'ออเดอร์',
  branches:  'สาขา',
  products:  'เมนูสินค้า',
  customers: 'ลูกค้า',
  inventory: 'คลังวัตถุดิบ',
  cost:      'ต้นทุน & กำไร',
  finance:   'รายรับ-รายจ่าย',
  settings:  'ตั้งค่า',
  profile:   'โปรไฟล์',
};

export function TopBar({
  onSidebarOpen,
  theme,
  onToggleTheme,
  searchPlaceholder = 'ค้นหา ออเดอร์ / สาขา / เมนู / ลูกค้า...',
  onSearchChange,
  active = 'overview',
  onProfileClick,
}: TopBarProps) {
  const displayName = (typeof window !== 'undefined' && localStorage.getItem('admin.displayName')) || 'Super Admin';
  const email = (typeof window !== 'undefined' && localStorage.getItem('admin.email')) || 'admin@456coffee';
  return (
    <header
      className="h-16 shrink-0 sticky top-0 z-30"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'saturate(180%) blur(12px)',
      }}
    >
      {/* Full right-pane width — no max-w constraint */}
      <div className="h-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile: hamburger */}
        <button
          onClick={onSidebarOpen}
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
        >
          <MenuIcon size={18} />
        </button>

        {/* Breadcrumb / page title (left, fixed) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--text-faint)' }}
          >
            456 HQ
          </span>
          <ChevronRight size={12} style={{ color: 'var(--text-faint)' }} />
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--text)' }}
          >
            {PAGE_LABEL[active]}
          </span>
        </div>

        {/* Search — grows to fill ALL available space between breadcrumb and right icons */}
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            size={16}
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            onChange={(e) => onSearchChange?.(e.target.value)}
            type="text"
            placeholder={searchPlaceholder}
            className="w-full h-10 pl-10 pr-16 rounded-xl text-sm transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <kbd
            className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-mono font-semibold"
            style={{
              background: 'var(--surface-3)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Right side: actions + user */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleTheme}
            aria-label="toggle theme"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            aria-label="notifications"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            <Bell size={16} />
            <span
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
          </button>
          <button
            onClick={onProfileClick}
            className="hidden sm:flex items-center gap-3 pl-3 ml-1 transition-all hover:opacity-80"
            style={{ borderLeft: '1px solid var(--border)' }}
            title="ดูโปรไฟล์"
          >
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {displayName}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {email}
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-transform hover:scale-105"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
