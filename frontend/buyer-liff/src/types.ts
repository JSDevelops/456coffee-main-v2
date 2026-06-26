export interface Category {
  id: string;
  name: string;
  icon?: string;
  _count: { products: number };
}

export interface MenuOption {
  id: string;
  label: string;
  priceAddon: number;
  isDefault: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: MenuOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  status: string;
  tags: string;
  category?: Category;
  optionGroups: OptionGroup[];
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  _count: { orders: number };
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: Record<string, MenuOption[]>;
  note: string;
  unitTotal: number;
}

export interface Order {
  id: string;
  orderNo: string;
  queueNo?: number;
  status: string;
  totalAmount: number;
  items: any[];
  payment?: any;
  paymentQr?: any;
  createdAt: string;
  branch?: Branch;
  customerUid?: string;
}

export interface MemberAddress {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

export interface Member {
  id: string;
  name?: string;
  displayName?: string;
  pictureUrl?: string;
  points?: number;
  addresses?: MemberAddress[];
  pointHistory?: { id: string; reason: string; delta: number; createdAt: string }[];
}

export type TabId = 'home' | 'menu' | 'cart' | 'orders' | 'profile';

export const STATUS_CFG: Record<
  string,
  { label: string; tone: 'amber' | 'blue' | 'indigo' | 'emerald' | 'green' | 'gray' | 'rose'; step: number }
> = {
  PENDING:   { label: 'รอชำระเงิน',  tone: 'amber',   step: 0 },
  PAID:      { label: 'ชำระแล้ว',    tone: 'blue',    step: 1 },
  PREPARING: { label: 'กำลังทำ',     tone: 'indigo',  step: 2 },
  READY:     { label: 'พร้อมรับ!',   tone: 'emerald', step: 3 },
  COMPLETED: { label: 'เสร็จสิ้น',  tone: 'green',   step: 4 },
  PICKED_UP: { label: 'รับแล้ว',    tone: 'gray',    step: 5 },
  CANCELLED: { label: 'ยกเลิก',     tone: 'rose',    step: -1 },
};

export const TONE_BG: Record<string, string> = {
  amber:   'bg-accent-soft text-accent-deep',
  blue:    'bg-info-soft text-info',
  indigo:  'bg-sage-soft text-sage',
  emerald: 'bg-success-soft text-success',
  green:   'bg-success-soft text-success',
  gray:    'bg-stone-100  text-stone-600',
  rose:    'bg-danger-soft text-danger',
};

export const TAG_COLORS: Record<string, string> = {
  Bestseller:  'bg-[var(--accent-soft)] text-[var(--accent-deep)]',
  Recommended: 'bg-[var(--sage-soft)] text-[var(--sage)]',
  New:         'bg-[var(--success-soft)] text-[var(--success)]',
  Signature:   'bg-[var(--ink)] text-[var(--gold-1)]',
  Seasonal:    'bg-[var(--info-soft)] text-[var(--info)]',
};

/**
 * Some menu items have a `description` polluted by an automated dump of
 * option-group rows like `uuid: ร้อน (Hot) | uuid: เย็น (Iced)`.
 * Hide / clean those before showing to customers.
 */
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function cleanDescription(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  // If a UUID appears anywhere, the field is corrupt — drop it entirely.
  if (UUID_RE.test(raw)) return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

export function parseTags(t: string): string[] {
  try {
    const p = JSON.parse(t);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

/** Member tier derived from points. */
export function memberTier(points = 0): { name: string; next: number; min: number; cls: string; emoji: string } {
  if (points >= 1000) return { name: 'Gold',   next: 2000, min: 1000, cls: 'tier-gold',   emoji: '✦' };
  if (points >= 300)  return { name: 'Silver', next: 1000, min: 300,  cls: 'tier-silver', emoji: '✦' };
  return { name: 'Bronze', next: 300, min: 0, cls: 'tier-bronze', emoji: '✦' };
}
