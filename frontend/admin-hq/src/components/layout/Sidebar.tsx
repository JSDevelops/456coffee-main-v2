import {
  BarChart3,
  Store,
  Coffee,
  ShoppingBag,
  Users,
  ClipboardList,
  DollarSign,
  Banknote,
  Settings,
  LogOut,
  Coffee as Logo,
  User as UserIcon,
  X,
  Tag,
  Bell,
  GraduationCap,
  Sprout,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type Page =
  | 'overview'
  | 'branches'
  | 'products'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'cost'
  | 'finance'
  | 'promotions'
  | 'channels'
  | 'settings'
  | 'profile'
  | 'announcements'
  | 'academy'
  | 'plantations';

interface NavGroup {
  label: string;
  items: Array<{ id: Page; icon: ReactNode; label: string; badge?: string }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ id: 'overview', icon: <BarChart3 size={18} />, label: 'แดชบอร์ด' }],
  },
  {
    label: 'Ecosystem & Academy',
    items: [
      { id: 'academy',     icon: <GraduationCap size={18} />, label: '456 Academy' },
      { id: 'plantations', icon: <Sprout size={18} />,        label: 'เครือข่ายแปลงปลูก' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'orders',    icon: <ShoppingBag size={18} />,    label: 'ออเดอร์' },
      { id: 'branches',  icon: <Store size={18} />,          label: 'สาขา' },
      { id: 'products',  icon: <Coffee size={18} />,         label: 'เมนูสินค้า' },
      { id: 'customers', icon: <Users size={18} />,          label: 'ลูกค้า' },
      { id: 'announcements', icon: <Bell size={18} />,       label: 'ประกาศ & ข่าวสาร' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'inventory', icon: <ClipboardList size={18} />, label: 'คลังวัตถุดิบ' },
      { id: 'cost',      icon: <DollarSign size={18} />,    label: 'ต้นทุน & กำไร' },
      { id: 'finance',   icon: <Banknote size={18} />,      label: 'รายรับ-รายจ่าย' },
      { id: 'promotions', icon: <Tag size={18} />,          label: 'โปรโมชั่น & ส่วนลด' },
      { id: 'channels',  icon: <Store size={18} />,         label: 'ช่องทางการขาย' },
    ],
  },
];

interface SidebarProps {
  active: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ active, onNavigate, onLogout, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-72 lg:w-64 shrink-0
          flex flex-col
          transform transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Brand */}
        <div
          className="h-16 px-5 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <Logo size={18} className="text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
                456 HQ
              </div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Admin console
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-1.5"
                style={{ color: 'var(--text-faint)' }}
              >
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-2)',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span
                        className="text-[10px] font-bold px-1.5 h-5 inline-flex items-center rounded-md"
                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {[
            { id: 'profile' as Page, label: 'โปรไฟล์', icon: UserIcon },
            { id: 'settings' as Page, label: 'ตั้งค่า', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--danger)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--danger-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
