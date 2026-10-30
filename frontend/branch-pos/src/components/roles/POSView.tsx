import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Search,
  Plus,
  Printer,
  CreditCard,
  User,
  ShoppingBag,
  X,
  Check,
  CheckCircle2,
  Trash2,
  Banknote,
  QrCode,
  Star,
  Minus,
  ListOrdered,
  Sparkles,
  Filter,
  ImageIcon,
  ArrowRight,
  Delete as Backspace,
  Receipt,
  Wallet,
  ChevronRight,
  Tag,
  CircleAlert,
  Loader2,
  Percent,
  Gift,
  Bell,
} from 'lucide-react';
import { PaginationControls, useClientPagination } from '../Pagination';
import { API_BASE, SOCKET_URL } from '../../api';

const CUSTOMER_DISPLAY_CHANNEL_PREFIX = 'pos.customerDisplay';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'รอชำระ',
  PAID: 'ชำระแล้ว',
  PREPARING: 'กำลังทำ',
  READY_FOR_QC: 'รอตรวจสอบ',
  READY_FOR_PICKUP: 'พร้อมรับ',
  DISPATCHED: 'จัดส่งแล้ว',
  PICKED_UP: 'รับแล้ว',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

const STATUS_TONE: Record<string, { fg: string; bg: string; dot: string }> = {
  PENDING: { fg: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  PAID: { fg: '#155e75', bg: '#cffafe', dot: '#06b6d4' },
  PREPARING: { fg: '#1e3a8a', bg: '#dbeafe', dot: '#3b82f6' },
  READY_FOR_QC: { fg: '#581c87', bg: '#f3e8ff', dot: '#a855f7' },
  READY_FOR_PICKUP: { fg: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  DISPATCHED: { fg: '#3730a3', bg: '#e0e7ff', dot: '#6366f1' },
  PICKED_UP: { fg: '#374151', bg: '#f3f4f6', dot: '#6b7280' },
  COMPLETED: { fg: '#374151', bg: '#f3f4f6', dot: '#6b7280' },
  CANCELLED: { fg: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
};

const PLATFORM_TONE: Record<string, { fg: string; bg: string; label: string }> = {
  STORE:     { fg: '#7c543c', bg: 'rgba(124,84,60,0.10)',  label: 'หน้าร้าน' },
  GRAB:      { fg: '#00b14f', bg: 'rgba(0,177,79,0.10)',   label: 'Grab' },
  LINE:      { fg: '#06c755', bg: 'rgba(6,199,85,0.10)',   label: 'LINE MAN' },
  SHOPEE:    { fg: '#ee4d2d', bg: 'rgba(238,77,45,0.10)',    label: 'Shopee Food' },
  BOOTH:     { fg: '#7c3aed', bg: 'rgba(124,58,237,0.10)', label: 'ออกบูธ' },
  OTHER:     { fg: '#64748b', bg: 'rgba(100,116,139,0.10)',label: 'อื่นๆ' },
};

const ALL_PLATFORMS = ['ALL','STORE','GRAB','LINE','SHOPEE','BOOTH','OTHER'] as const;
type PlatformKey = typeof ALL_PLATFORMS[number];

type CartItem = {
  productId: string;
  productName: string;
  imageUrl?: string;
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
  quantity: number;
  selectedOptions: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    label: string;
    priceAddon: number;
  }>;
};

function customerDisplayKey(branchId: string) {
  return `${CUSTOMER_DISPLAY_CHANNEL_PREFIX}.${branchId}`;
}

export default function POSView({ branch, orders, onOrderUpdated }: any) {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPromoPanel, setShowPromoPanel] = useState(false);
  const [promoList, setPromoList]   = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedCartPromo, setAppliedCartPromo] = useState<{ id: string; name: string; discountAmount: number } | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [configuringProduct, setConfiguringProduct] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState('');

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customerName: 'ลูกค้าหน้าร้าน',
    paymentMethod: 'CASH',
    platform: 'STORE',
    note: '',
  });
  const [cashReceived, setCashReceived] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [searchingMember, setSearchingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [memberOpen, setMemberOpen] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [createCustomerData, setCreateCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [feedFilter, setFeedFilter] = useState<PlatformKey>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [posAnnouncements, setPosAnnouncements] = useState<any[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<any | null>(null);

  // Fetch branch announcements from HQ
  useEffect(() => {
    if (!branch?.id) return;
    fetch(`${API_BASE}/announcements/branch/${branch.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosAnnouncements(data);
        }
      })
      .catch((err) => console.warn('Could not load announcements for POS:', err));
  }, [branch?.id]);

  // Fetch menu with Cache-First strategy — loads instantly from LocalStorage, then revalidates
  useEffect(() => {
    if (!branch?.id) return;

    const cacheKeyCats = `pos_cache_cats_${branch.id}`;
    const cacheKeyMenu = `pos_cache_menu_${branch.id}`;

    // 1. Instant load from cache (Zero latency / Offline ready)
    try {
      const cachedCats = localStorage.getItem(cacheKeyCats);
      const cachedMenu = localStorage.getItem(cacheKeyMenu);
      if (cachedCats && cachedMenu) {
        setCategories(JSON.parse(cachedCats));
        setProducts(JSON.parse(cachedMenu));
      }
    } catch { }

    // 2. Fetch fresh data in background and update cache
    Promise.all([
      fetch(`${API_BASE}/categories`).then((r) => r.json()),
      fetch(`${API_BASE}/branches/${branch.id}/menu`).then((r) => r.json()),
    ])
      .then(([cats, prods]) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
          try { localStorage.setItem(cacheKeyCats, JSON.stringify(cats)); } catch { }
        }
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
          try { localStorage.setItem(cacheKeyMenu, JSON.stringify(prods)); } catch { }
        }
      })
      .catch((err) => {
        console.warn('POS background menu sync failed, continuing with cache:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch?.id]);

  // Fetch promotions (active, for this branch or global)
  const fetchPromos = async () => {
    if (!branch?.id) return;
    setPromoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/promotions?branchId=${branch.id}`);
      const data = await res.json();
      setPromoList(Array.isArray(data) ? data.filter((p: any) => p.isActive) : []);
    } catch { } finally { setPromoLoading(false); }
  };

  const openPromoPanel = () => {
    setShowPromoPanel(true);
    if (promoList.length === 0) fetchPromos();
  };

  const applyPromoToCart = async (promo: any) => {
    if (cart.length === 0) {
      alert('กรุณาเพิ่มสินค้าก่อนใช้โปรโมชั่น');
      return;
    }
    try {
      const cartTotal = cart.reduce((s, i) => s + i.totalPrice * i.quantity, 0);
      const cartItems = cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.totalPrice }));
      const res = await fetch(`${API_BASE}/promotions/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionId: promo.id,
          orderSubtotal: cartTotal,   // ✅ field ที่ backend ต้องการ
          cart: cartItems,            // ✅ field ที่ backend ต้องการ
        }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || 'ใช้โปรโมชั่นไม่ได้'); return; }
      const applied = { id: promo.id, name: promo.name, discountAmount: json.discountAmount };
      setAppliedCartPromo(applied);
      // Sync into checkoutData so checkout modal picks it up
      setCheckoutData((d: any) => ({ ...d, appliedPromo: applied }));
      setShowPromoPanel(false);
    } catch (e: any) { alert(e.message); }
  };

  const removePromo = () => {
    setAppliedCartPromo(null);
    setCheckoutData((d: any) => ({ ...d, appliedPromo: null }));
  };

  const filteredProducts = useMemo(() => {
    // effectiveStatus comes from /branches/:id/menu; fall back to plain status
    // if a legacy global endpoint slipped through.
    let list = products.filter(
      (p) => (p.effectiveStatus || p.status) === 'AVAILABLE',
    );
    if (selectedCategory) list = list.filter((p) => p.categoryId === selectedCategory);
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, selectedCategory, productSearch]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o: any) => feedFilter === 'ALL' || o.platform === feedFilter)
      .filter((o: any) => {
        if (!orderSearch) return true;
        const q = orderSearch.toLowerCase();
        return (
          o.orderNo?.toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          String(o.queueNo || '').includes(q)
        );
      });
  }, [orders, feedFilter, orderSearch]);
  const menuPagination = useClientPagination(
    filteredProducts,
    12,
    `${activeTab}:${selectedCategory || 'ALL'}:${productSearch.trim().toLowerCase()}`,
  );
  const orderPagination = useClientPagination(
    filteredOrders,
    9,
    `${activeTab}:${feedFilter}:${orderSearch.trim().toLowerCase()}`,
  );

  const liveOrdersCount = orders.filter(
    (o: any) =>
      o.status &&
      !['COMPLETED', 'CANCELLED', 'PICKED_UP', 'DISPATCHED'].includes(o.status),
  ).length;

  useEffect(() => {
    if (activeTab !== 'orders') {
      setSelectedOrder(null);
    }
  }, [activeTab]);

  useEffect(() => {
    setSelectedOrder(null);
  }, [feedFilter, orderSearch, orderPagination.page]);

  const openConfigureProduct = (product: any) => {
    setConfiguringProduct(product);
    const defaults: Record<string, string> = {};
    (product.optionGroups || []).forEach((g: any) => {
      const def = g.options.find((o: any) => o.isDefault);
      if (def) defaults[g.id] = def.id;
    });
    setSelectedOptions(defaults);
  };

  const addToCart = () => {
    if (!configuringProduct) return;
    const missing = (configuringProduct.optionGroups || []).filter(
      (g: any) => g.isRequired && !selectedOptions[g.id],
    );
    if (missing.length > 0) {
      alert(`กรุณาเลือก: ${missing.map((g: any) => g.name).join(', ')}`);
      return;
    }
    let optionsPrice = 0;
    const selection: CartItem['selectedOptions'] = [];
    Object.keys(selectedOptions).forEach((groupId) => {
      const group = configuringProduct.optionGroups.find((g: any) => g.id === groupId);
      const option = group?.options.find((o: any) => o.id === selectedOptions[groupId]);
      if (option) {
        optionsPrice += option.priceAddon;
        selection.push({
          groupId,
          groupName: group.name,
          optionId: option.id,
          label: option.label,
          priceAddon: option.priceAddon,
        });
      }
    });
    setCart((prev) => [
      ...prev,
      {
        productId: configuringProduct.id,
        productName: configuringProduct.name,
        imageUrl: configuringProduct.imageUrl,
        basePrice: configuringProduct.price,
        optionsPrice,
        totalPrice: configuringProduct.price + optionsPrice,
        quantity: 1,
        selectedOptions: selection,
      },
    ]);
    setConfiguringProduct(null);
    setSelectedOptions({});
  };

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((it, i) => (i === idx ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0),
    );
  };
  const removeFromCart = (idx: number) => setCart((prev) => prev.filter((_, i) => i !== idx));
  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('ล้างตะกร้าทั้งหมด?')) setCart([]);
  };

  const handleSearchMember = async () => {
    if (!memberSearch.trim()) return;
    setSearchingMember(true);
    try {
      const res = await fetch(`${API_BASE}/users?search=${encodeURIComponent(memberSearch)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setMemberResults(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) {
        alert('ไม่พบสมาชิกในระบบ');
      }
    } catch (err) {
      console.error(err);
      alert('ค้นหาลูกค้าไม่สำเร็จ');
    } finally {
      setSearchingMember(false);
    }
  };

  const selectMember = (member: any) => {
    setSelectedMember(member);
    setCheckoutData((prev) => ({ ...prev, customerName: member.name || 'ลูกค้าหน้าร้าน' }));
    setMemberSearch('');
    setMemberResults([]);
    setMemberOpen(false);
  };

  const clearMember = () => {
    setSelectedMember(null);
    setCheckoutData((prev) => ({ ...prev, customerName: 'ลูกค้าหน้าร้าน' }));
  };

  const handleCreateCustomer = async () => {
    if (creatingCustomer) return;
    if (!createCustomerData.name.trim() && !createCustomerData.phone.trim() && !createCustomerData.email.trim()) {
      alert('กรุณากรอกชื่อ เบอร์โทร หรืออีเมล อย่างน้อย 1 อย่าง');
      return;
    }

    setCreatingCustomer(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createCustomerData),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Create customer failed');
      selectMember(body);
      setCreateCustomerData({ name: '', phone: '', email: '' });
      setShowCreateCustomer(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'เพิ่มลูกค้าใหม่ไม่สำเร็จ');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);
  const discount = (checkoutData as any).appliedPromo?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const cashNum = parseFloat(cashReceived || '0');
  const change = cashNum > 0 ? cashNum - total : 0;

  useEffect(() => {
    if (!branch?.id) return;

    const sourceItems = viewingReceipt
      ? (viewingReceipt.items || []).map((item: any) => ({
          name: item.productName || item.product?.name || item.name || 'สินค้า',
          quantity: item.quantity || 1,
          unitPrice: Number(item.unitPrice || 0),
          optionsPrice: Number(item.optionsPrice || 0),
          totalPrice: Number(item.price || 0),
          selectedOptions: formatReceiptOptions(item.selectedOptions),
        }))
      : cart.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.basePrice,
          optionsPrice: item.optionsPrice,
          totalPrice: item.totalPrice * item.quantity,
          selectedOptions: item.selectedOptions.map((option) => option.label),
        }));

    const payload = {
      branchId: branch.id,
      branchName: branch.name,
      status: viewingReceipt
        ? viewingReceipt.paymentQr
          ? 'QR_READY'
          : 'ORDER_CREATED'
        : isPosting
          ? 'PROCESSING'
          : showCheckout
            ? 'CHECKOUT'
            : cart.length > 0
              ? 'BUILDING'
              : 'IDLE',
      items: sourceItems,
      subtotal: viewingReceipt ? Number(viewingReceipt.totalAmount || 0) : subtotal,
      discount,
      total: viewingReceipt ? Number(viewingReceipt.totalAmount || 0) : total,
      paymentMethod: viewingReceipt?.payment?.method || checkoutData.paymentMethod,
      customerName:
        viewingReceipt?.customerName ||
        checkoutData.customerName ||
        selectedMember?.name ||
        'ลูกค้าหน้าร้าน',
      cashReceived: cashNum,
      change,
      orderNo: viewingReceipt?.orderNo || null,
      queueNo: viewingReceipt?.queueNo || null,
      qr: viewingReceipt?.paymentQr || null,
      updatedAt: new Date().toISOString(),
    };

    const key = customerDisplayKey(branch.id);
    localStorage.setItem(key, JSON.stringify(payload));

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(key);
      channel.postMessage(payload);
      channel.close();
    }
  }, [
    branch?.id,
    branch?.name,
    cart,
    cashNum,
    change,
    checkoutData.customerName,
    checkoutData.paymentMethod,
    discount,
    isPosting,
    selectedMember?.name,
    showCheckout,
    subtotal,
    total,
    viewingReceipt,
  ]);

  const handleCheckout = async () => {
    if (cart.length === 0 || !branch?.id || isPosting) return;
    if (checkoutData.paymentMethod === 'CASH' && cashNum > 0 && cashNum < total) {
      alert(`เงินที่รับยังไม่พอชำระ ขาดอีก ฿${(total - cashNum).toFixed(0)}`);
      return;
    }
    setIsPosting(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branch.id,
          platform: checkoutData.platform || 'STORE',
          customerName:
            selectedMember?.name || checkoutData.customerName || 'ลูกค้าหน้าร้าน',
          note: checkoutData.note,
          totalAmount: total,
          userId: selectedMember?.id,
          items: cart.map((item) => ({
            productId: item.productId,
            name: item.productName,
            quantity: item.quantity,
            price: item.basePrice + item.optionsPrice,
            unitPrice: item.basePrice,
            optionsPrice: item.optionsPrice,
            selectedOptions: item.selectedOptions,
          })),
          paymentMethod: checkoutData.paymentMethod,
        }),
      });
      if (!res.ok) throw new Error('Checkout failed');
      const createdOrder = await res.json();
      onOrderUpdated?.(createdOrder);
      setCart([]);
      setShowCheckout(false);
      setCheckoutData({ customerName: 'ลูกค้าหน้าร้าน', paymentMethod: 'CASH', platform: 'STORE', note: '' });
      setCashReceived('');
      setSelectedMember(null);
      setAutoPrintReceipt(createdOrder?.payment?.status === 'PAID' || createdOrder?.status === 'PAID');
      setViewingReceipt(createdOrder);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่');
    } finally {
      setIsPosting(false);
    }
  };

  const handleMarkPaid = async (order: any) => {
    if (!order?.id || markingPaidId) return;
    setMarkingPaidId(order.id);
    try {
      const method = order.payment?.method || (order.paymentQr ? 'QR' : checkoutData.paymentMethod || 'CASH');
      const res = await fetch(`${API_BASE}/orders/${order.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          method,
          transactionId: `MANUAL-${Date.now()}`,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'ไม่สามารถยืนยันชำระเงินได้');

      const detailRes = await fetch(`${API_BASE}/orders/${order.id}`);
      const paidOrder = body?.id
        ? body
        : detailRes.ok
        ? await detailRes.json()
        : {
            ...order,
            status: 'PAID',
            payment: {
              ...(order.payment || {}),
              status: 'PAID',
              method,
              transactionId: `MANUAL-${Date.now()}`,
            },
          };

      onOrderUpdated?.(paidOrder);
      setSelectedOrder((prev: any) => (prev?.id === paidOrder.id ? paidOrder : prev));
      setAutoPrintReceipt(true);
      setViewingReceipt(paidOrder);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'ไม่สามารถยืนยันชำระเงินได้');
    } finally {
      setMarkingPaidId(null);
    }
  };

  // ─ mobile cart sheet state
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-full" style={{ background: '#f8f5f1' }}>

      {/* ── Top bar — shared desktop+mobile ────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4"
        style={{ height: '56px', background: '#ffffff', borderBottom: '1px solid #ece5da' }}
      >
        {/* Logo (desktop only) */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
          >
            <Coffee className="text-white" size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">Point of Sale</p>
            <p className="text-sm font-black tracking-tight text-[#2d241e] truncate max-w-[160px]">{branch?.name || '—'}</p>
          </div>
        </div>

        {/* Tabs (desktop) */}
        <div
          className="hidden md:inline-flex h-10 items-center rounded-2xl p-1 shrink-0"
          style={{ background: '#f3ece1', border: '1px solid #ece5da' }}
        >
          <TabButton active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} icon={<Coffee size={13} />}>สั่งสินค้า</TabButton>
          <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ListOrdered size={13} />} badge={liveOrdersCount > 0 ? liveOrdersCount : undefined}>ออเดอร์</TabButton>
        </div>

        {/* Mobile: tab pills */}
        <div
          className="md:hidden inline-flex h-9 items-center rounded-2xl p-1 shrink-0"
          style={{ background: '#f3ece1', border: '1px solid #ece5da' }}
        >
          <TabButton active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} icon={<Coffee size={12} />}>เมนู</TabButton>
          <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ListOrdered size={12} />} badge={liveOrdersCount > 0 ? liveOrdersCount : undefined}>ออเดอร์</TabButton>
        </div>

        {/* Search — full width on mobile */}
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7c543c]/50" />
          {activeTab === 'menu' ? (
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              type="text"
              placeholder="ค้นหาเมนู..."
              className="w-full h-9 pl-9 pr-4 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
            />
          ) : (
            <input
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              type="text"
              placeholder="ค้นหาออเดอร์..."
              className="w-full h-9 pl-9 pr-4 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
            />
          )}
        </div>

        {/* Announcement Bell (HQ News Alert) */}
        {posAnnouncements.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveAnnouncement(posAnnouncements[0])}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl shrink-0 transition-all text-xs font-bold shadow-sm"
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#b45309',
            }}
            title="ประกาศจาก HQ"
          >
            <Bell size={14} className="text-amber-600 animate-bounce" />
            <span className="hidden sm:inline">ประกาศ HQ</span>
            <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center">
              {posAnnouncements.length}
            </span>
          </button>
        )}

        {/* Live badge (desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-xl shrink-0" style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]">Live</span>
          <span className="text-xs font-black num text-[#2d241e] ml-1">{liveOrdersCount}</span>
        </div>
      </header>

      {/* ── Active Announcement Popup Modal ── */}
      {activeAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-[#ece5da] relative">
            <button
              onClick={() => setActiveAnnouncement(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="ปิดประกาศ"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="pr-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {activeAnnouncement.type || 'ประกาศสาขา'}
                </span>
                <h3 className="text-base font-black text-[#2d241e] mt-1 leading-snug">
                  {activeAnnouncement.title}
                </h3>
                <p className="text-[11px] text-[#7c543c]/70 mt-0.5">
                  {activeAnnouncement.createdAt ? new Date(activeAnnouncement.createdAt).toLocaleDateString('th-TH', { dateStyle: 'long' }) : ''}
                </p>
              </div>
            </div>

            <div className="text-sm text-[#2d241e] whitespace-pre-line bg-[#fdfaf6] p-3.5 rounded-xl border border-[#ece5da] leading-relaxed max-h-60 overflow-y-auto">
              {activeAnnouncement.content}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setActiveAnnouncement(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#ea580c] hover:bg-[#d94e07] shadow-sm transition-all"
              >
                รับทราบประกาศ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ MOBILE LAYOUT (< md) ════════ */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        {activeTab === 'menu' ? (
          <>
            {/* ① Category horizontal scroll */}
            <div
              className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5"
              style={{ background: '#fff', borderBottom: '1px solid #ece5da' }}
            >
              {/* ── Promotion shortcut — first button ── */}
              <button
                onClick={openPromoPanel}
                className="shrink-0 h-8 px-3.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap relative"
                style={{
                  background: appliedCartPromo ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                  color: '#fff',
                  boxShadow: '0 3px 10px rgba(109,40,217,0.30)',
                }}
              >
                {appliedCartPromo ? <Check size={12} /> : <Tag size={12} />}
                {appliedCartPromo ? appliedCartPromo.name : 'โปรโมชั่น'}
                {promoList.length > 0 && !appliedCartPromo && (
                  <span className="px-1.5 h-4 rounded text-[9px] font-black inline-flex items-center"
                    style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                    {promoList.length}
                  </span>
                )}
              </button>

              {/* ALL button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="shrink-0 h-8 px-3.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap"
                style={{
                  background: !selectedCategory ? 'linear-gradient(135deg,#fbbf24,#ea580c)' : '#f3ece1',
                  color: !selectedCategory ? '#fff' : '#7c543c',
                  boxShadow: !selectedCategory ? '0 3px 10px rgba(234,88,12,0.30)' : 'none',
                }}
              >
                <Coffee size={12} /> ทั้งหมด
                <span
                  className="px-1.5 h-4 rounded text-[9px] font-black inline-flex items-center"
                  style={{ background: !selectedCategory ? 'rgba(255,255,255,0.25)' : '#ece5da', color: !selectedCategory ? '#fff' : '#7c543c' }}
                >
                  {products.filter((p: any) => p.status === 'AVAILABLE').length}
                </span>
              </button>

              {categories.map((cat: any) => {
                const active = selectedCategory === cat.id;
                const count = products.filter((p: any) => p.categoryId === cat.id && p.status === 'AVAILABLE').length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="shrink-0 h-8 px-3.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap"
                    style={{
                      background: active ? 'linear-gradient(135deg,#fbbf24,#ea580c)' : '#f3ece1',
                      color: active ? '#fff' : '#7c543c',
                      boxShadow: active ? '0 3px 10px rgba(234,88,12,0.30)' : 'none',
                    }}
                  >
                    <span className="text-sm leading-none">{cat.icon || '📂'}</span>
                    {cat.name}
                    <span
                      className="px-1.5 h-4 rounded text-[9px] font-black inline-flex items-center"
                      style={{ background: active ? 'rgba(255,255,255,0.25)' : '#ece5da', color: active ? '#fff' : '#7c543c' }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ② Menu grid — full width, fills remaining height */}
            <main className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
              {filteredProducts.length === 0 ? (
                <EmptyState icon={<Coffee size={48} strokeWidth={1.5} />} title={productSearch ? 'ไม่พบเมนูที่ค้นหา' : 'ไม่มีเมนูในหมวดนี้'} hint="ลองเปลี่ยนหมวดหมู่หรือลบคำค้นหา" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {menuPagination.pageItems.map((product: any) => (
                      <ProductCard key={product.id} product={product} onClick={() => openConfigureProduct(product)} />
                    ))}
                  </div>
                  <PaginationControls
                    page={menuPagination.page}
                    totalPages={menuPagination.totalPages}
                    totalItems={menuPagination.totalItems}
                    pageSize={menuPagination.pageSize}
                    onPageChange={menuPagination.setPage}
                    itemLabel="เมนู"
                  />
                </>
              )}
              {/* bottom padding so FAB doesn’t cover last row */}
              <div className="h-24" />
            </main>

            {/* ③ Floating cart FAB */}
            {cartCount > 0 && (
              <motion.button
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                exit={{ y: 80 }}
                onClick={() => setCartSheetOpen(true)}
                className="fixed left-4 right-4 bottom-[72px] z-40 h-14 rounded-2xl flex items-center px-5 shadow-xl"
                style={{ background: 'linear-gradient(135deg,#fbbf24,#ea580c)' }}
              >
                <ShoppingBag size={20} className="text-white" />
                <span className="flex-1 text-center text-base font-black text-white">
                  ดูตะกร้า ({cartCount} รายการ)
                </span>
                <span className="text-white font-black text-base">&#3647;{total.toLocaleString()}</span>
              </motion.button>
            )}
          </>
        ) : (
          /* — Orders tab mobile — */
          <>
            {/* Order filter chips */}
            <div
              className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5"
              style={{ background: '#fff', borderBottom: '1px solid #ece5da' }}
            >
              {(['ALL','STORE','GRAB','LINE'] as const).map((f) => {
                const labels: Record<string, string> = { ALL:'ทั้งหมด', STORE:'หน้าร้าน', GRAB:'Grab', LINE:'LINE' };
                const counts = {
                  ALL: orders.length,
                  STORE: orders.filter((o: any) => o.platform === 'STORE').length,
                  GRAB: orders.filter((o: any) => o.platform === 'GRAB').length,
                  LINE: orders.filter((o: any) => o.platform === 'LINE').length,
                };
                const isActive = feedFilter === f;
                return (
                  <button key={f} onClick={() => setFeedFilter(f)}
                    className="shrink-0 h-8 px-4 rounded-full text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all"
                    style={{
                      background: isActive ? '#ea580c' : '#f3ece1',
                      color: isActive ? '#fff' : '#7c543c',
                      boxShadow: isActive ? '0 3px 10px rgba(234,88,12,0.30)' : 'none',
                    }}
                  >
                    {labels[f]}
                    <span className="px-1.5 h-4 rounded text-[9px] font-black inline-flex items-center"
                      style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#ece5da', color: isActive ? '#fff' : '#7c543c' }}>
                      {counts[f]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orders list */}
            <main className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
              {filteredOrders.length === 0 ? (
                <EmptyState icon={<Receipt size={48} strokeWidth={1.5} />} title="ยังไม่มีออเดอร์" hint="ออเดอร์ใหม่จะปรากฏที่นี่ทันทีที่มีคนสั่ง" />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {orderPagination.pageItems.map((order: any) => (
                      <OrderFeedCard
                        key={order.id}
                        order={order}
                        active={selectedOrder?.id === order.id}
                        onClick={() => setSelectedOrder(order)}
                      />
                    ))}
                  </div>
                  <PaginationControls
                    page={orderPagination.page}
                    totalPages={orderPagination.totalPages}
                    totalItems={orderPagination.totalItems}
                    pageSize={orderPagination.pageSize}
                    onPageChange={orderPagination.setPage}
                    itemLabel="ออเดอร์"
                  />
                </>
              )}
              <div className="h-4" />
            </main>
          </>
        )}
      </div>

      {/* ════════ DESKTOP LAYOUT (≥ md) ════════ */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left rail */}
        {activeTab === 'menu' ? (
          <CategoryRail categories={categories} products={products} selected={selectedCategory} onSelect={setSelectedCategory} onPromo={openPromoPanel} appliedPromo={appliedCartPromo} />
        ) : (
          <OrderFilterRail value={feedFilter} onChange={setFeedFilter} orders={orders} />
        )}

        {/* Center */}
        <main className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {activeTab === 'menu' ? (
            filteredProducts.length === 0 ? (
              <EmptyState icon={<Coffee size={48} strokeWidth={1.5} />} title={productSearch ? 'ไม่พบเมนูที่ค้นหา' : 'ไม่มีเมนูในหมวดนี้'} hint="ลองเปลี่ยนหมวดหมู่หรือลบคำค้นหา" />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {menuPagination.pageItems.map((product: any) => (
                    <ProductCard key={product.id} product={product} onClick={() => openConfigureProduct(product)} />
                  ))}
                </div>
                <PaginationControls
                  page={menuPagination.page}
                  totalPages={menuPagination.totalPages}
                  totalItems={menuPagination.totalItems}
                  pageSize={menuPagination.pageSize}
                  onPageChange={menuPagination.setPage}
                  itemLabel="เมนู"
                />
              </>
            )
          ) : filteredOrders.length === 0 ? (
            <EmptyState icon={<Receipt size={48} strokeWidth={1.5} />} title="ยังไม่มีออเดอร์" hint="ออเดอร์ใหม่จะปรากฏที่นี่ทันทีที่มีคนสั่ง" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {orderPagination.pageItems.map((order: any) => (
                  <OrderFeedCard key={order.id} order={order} active={selectedOrder?.id === order.id} onClick={() => setSelectedOrder(order)} />
                ))}
              </div>
              <PaginationControls
                page={orderPagination.page}
                totalPages={orderPagination.totalPages}
                totalItems={orderPagination.totalItems}
                pageSize={orderPagination.pageSize}
                onPageChange={orderPagination.setPage}
                itemLabel="ออเดอร์"
              />
            </>
          )}
        </main>

        {/* Right: cart */}
        <aside className="w-[360px] shrink-0 flex flex-col" style={{ background: '#ffffff', borderLeft: '1px solid #ece5da' }}>
          {activeTab === 'orders' && selectedOrder ? (
            <OrderDetailPanel
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onShowReceipt={() => setViewingReceipt(selectedOrder)}
              onMarkPaid={() => handleMarkPaid(selectedOrder)}
              markingPaid={markingPaidId === selectedOrder?.id}
            />
          ) : (
            <CartPanel
              cart={cart} subtotal={subtotal} discount={discount} total={total}
              member={selectedMember} memberSearch={memberSearch} memberResults={memberResults}
              memberOpen={memberOpen} searchingMember={searchingMember}
              onMemberSearchChange={setMemberSearch} onMemberSearch={handleSearchMember}
              onMemberSelect={selectMember} onMemberClear={clearMember}
              onMemberToggle={() => setMemberOpen((s) => !s)}
              onCreateCustomer={() => setShowCreateCustomer(true)}
              onUpdateQty={updateQty} onRemove={removeFromCart} onClear={clearCart}
              onCheckout={() => setShowCheckout(true)}
            />
          )}
        </aside>
      </div>

      {/* ════════ MOBILE CART BOTTOM SHEET ════════ */}
      <AnimatePresence>
        {cartSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-x-0 top-0 z-[60] flex flex-col justify-end"
            style={{ bottom: 'calc(60px + var(--sab, 0px))' }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartSheetOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              className="relative bg-white rounded-t-[2rem] flex flex-col"
              style={{ maxHeight: 'calc(100dvh - 68px)', overflow: 'hidden' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#e8e2db]" />
              </div>
              {/* Sheet header */}
              <div className="px-5 pb-3 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">ตะกร้าสินค้า</p>
                  <p className="text-base font-black text-[#2d241e] tracking-tight">{cartCount} รายการ · <span className="text-[#ea580c]">&#3647;{total.toLocaleString()}</span></p>
                </div>
                <button onClick={() => setCartSheetOpen(false)}
                  className="w-10 h-10 rounded-xl bg-[#f3ece1] flex items-center justify-center text-[#7c543c]">
                  <X size={18} />
                </button>
              </div>
              {/* CartPanel — fills remaining height with internal scroll */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <CartPanel
                  cart={cart} subtotal={subtotal} discount={discount} total={total}
                  member={selectedMember} memberSearch={memberSearch} memberResults={memberResults}
                  memberOpen={memberOpen} searchingMember={searchingMember}
                  onMemberSearchChange={setMemberSearch} onMemberSearch={handleSearchMember}
                  onMemberSelect={selectMember} onMemberClear={clearMember}
                  onMemberToggle={() => setMemberOpen((s) => !s)}
                  onCreateCustomer={() => setShowCreateCustomer(true)}
                  onUpdateQty={updateQty} onRemove={removeFromCart} onClear={clearCart}
                  onCheckout={() => { setCartSheetOpen(false); setShowCheckout(true); }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configure product sheet */}
      <AnimatePresence>
        {configuringProduct && (
          <ConfigureSheet
            product={configuringProduct}
            selectedOptions={selectedOptions}
            onSelectOption={(gid, oid) => setSelectedOptions((prev) => ({ ...prev, [gid]: oid }))}
            onAdd={addToCart}
            onClose={() => setConfiguringProduct(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateCustomer && (
          <CreateCustomerModal
            data={createCustomerData}
            saving={creatingCustomer}
            onChange={(patch) => setCreateCustomerData((prev) => ({ ...prev, ...patch }))}
            onClose={() => !creatingCustomer && setShowCreateCustomer(false)}
            onSubmit={handleCreateCustomer}
          />
        )}
      </AnimatePresence>

      {/* ── Promo panel ── */}
      <AnimatePresence>
        {showPromoPanel && (
          <motion.div
            key="promo-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setShowPromoPanel(false)}
          >
            <motion.div
              key="promo-sheet"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden"
              style={{ background: '#fff' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3"
                style={{ borderBottom: '1px solid #ece5da' }}>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.12)' }}>
                    <Tag size={16} style={{ color: '#8b5cf6' }} />
                  </span>
                  <div>
                    <p className="text-sm font-black" style={{ color: '#3b2205' }}>โปรโมชั่น</p>
                    <p className="text-[10px] font-bold" style={{ color: '#7c543c' }}>เลือกโปรโมชั่นที่ต้องการใช้</p>
                  </div>
                </div>
                <button onClick={() => setShowPromoPanel(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#f3ece1' }}>
                  <X size={14} style={{ color: '#7c543c' }} />
                </button>
              </div>

              {/* Applied badge */}
              {appliedCartPromo && (
                <div className="mx-5 mt-3 mb-1 flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.10)', border: '1.5px solid #10b981' }}>
                  <div className="flex items-center gap-2">
                    <Check size={14} style={{ color: '#059669' }} />
                    <span className="text-xs font-black" style={{ color: '#059669' }}>
                      กำลังใช้: {appliedCartPromo.name}
                    </span>
                  </div>
                  <button onClick={removePromo}
                    className="text-[10px] font-black px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#059669' }}>
                    ยกเลิก
                  </button>
                </div>
              )}

              {/* Promo list */}
              <div className="px-5 py-3 space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar pb-8">
                {promoLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin" style={{ color: '#8b5cf6' }} />
                  </div>
                ) : promoList.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift size={40} className="mx-auto mb-2" style={{ color: '#c9b49a' }} />
                    <p className="text-sm font-bold" style={{ color: '#7c543c' }}>ยังไม่มีโปรโมชั่น</p>
                    <p className="text-xs mt-1" style={{ color: '#7c543c', opacity: 0.6 }}>ผู้จัดการสามารถสร้างได้ที่ แท็บโปรโมชั่น</p>
                  </div>
                ) : (
                  promoList.map((promo: any) => {
                    const isApplied = appliedCartPromo?.id === promo.id;
                    return (
                      <button
                        key={promo.id}
                        onClick={() => isApplied ? removePromo() : applyPromoToCart(promo)}
                        className="w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3"
                        style={{
                          background: isApplied ? 'rgba(16,185,129,0.10)' : '#faf7f2',
                          border: `1.5px solid ${isApplied ? '#10b981' : '#ece5da'}`,
                        }}
                      >
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: isApplied ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)' }}>
                          {isApplied ? <Check size={16} style={{ color: '#059669' }} /> : <Percent size={16} style={{ color: '#8b5cf6' }} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate" style={{ color: isApplied ? '#059669' : '#3b2205' }}>
                            {promo.name}
                          </p>
                          <p className="text-[10px] mt-0.5 font-bold" style={{ color: '#7c543c', opacity: 0.7 }}>
                            {promo.type === 'PERCENT' ? `ลด ${promo.value}%`
                              : promo.type === 'FIXED_AMOUNT' ? `ลด ฿${promo.value}`
                              : promo.type === 'BUY_X_GET_Y' ? `ซื้อ ${promo.buyQty ?? 2} แถม ${promo.getQty ?? 1}`
                              : promo.type}
                            {promo.minOrderAmount > 0 ? ` • ขั้นต่ำ ฿${promo.minOrderAmount}` : ''}
                          </p>
                          {promo.couponCode && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black"
                              style={{ background: 'rgba(139,92,246,0.12)', color: '#6d28d9' }}>
                              CODE: {promo.couponCode}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full"
                          style={{
                            background: isApplied ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)',
                            color: isApplied ? '#059669' : '#6d28d9',
                          }}>
                          {isApplied ? 'ใช้งาน' : 'เลือก'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            cart={cart} subtotal={subtotal} total={total}
            data={checkoutData} cashReceived={cashReceived} change={change}
            isPosting={isPosting}
            onChangeData={(patch) => setCheckoutData((prev) => ({ ...prev, ...patch }))}
            onCashChange={setCashReceived}
            onClose={() => !isPosting && setShowCheckout(false)}
            onSubmit={handleCheckout}
          />
        )}
      </AnimatePresence>

      {/* Receipt */}
      <AnimatePresence>
        {viewingReceipt && (
          <ReceiptModal
            branch={branch}
            order={viewingReceipt}
            autoPrint={autoPrintReceipt}
            markingPaid={markingPaidId === viewingReceipt?.id}
            onMarkPaid={() => handleMarkPaid(viewingReceipt)}
            onPrinted={() => setAutoPrintReceipt(false)}
            onClose={() => { setAutoPrintReceipt(false); setViewingReceipt(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Tab button
// ════════════════════════════════════════════════════════════════════════════
function TabButton({
  active,
  onClick,
  icon,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
      style={{
        background: active ? '#ffffff' : 'transparent',
        color: active ? '#7c543c' : '#7c543c80',
        boxShadow: active ? '0 1px 3px rgba(124,84,60,0.12)' : 'none',
      }}
    >
      {icon}
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          className="ml-0.5 px-1.5 h-4 inline-flex items-center justify-center rounded-md text-[10px] num font-black"
          style={{ background: '#ea580c', color: '#fff' }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Category rail
// ════════════════════════════════════════════════════════════════════════════
function CategoryRail({
  categories,
  products,
  selected,
  onSelect,
  onPromo,
  appliedPromo,
}: {
  categories: any[];
  products: any[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onPromo?: () => void;
  appliedPromo?: { id: string; name: string; discountAmount: number } | null;
}) {
  const totalAvailable = products.filter((p) => p.status === 'AVAILABLE').length;
  return (
    <aside
      className="w-[180px] shrink-0 overflow-y-auto no-scrollbar p-3 space-y-1"
      style={{ background: '#ffffff', borderRight: '1px solid #ece5da' }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50 px-2 py-2">
        หมวดหมู่
      </p>
      {/* ── Promotions shortcut ── */}
      <button
        onClick={onPromo}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl mb-1 transition-all text-left"
        style={appliedPromo
          ? { background: 'rgba(16,185,129,0.12)', border: '1.5px solid #10b981' }
          : { background: 'linear-gradient(135deg,rgba(139,92,246,0.10),rgba(109,40,217,0.10))', border: '1.5px solid rgba(139,92,246,0.30)' }
        }
      >
        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: appliedPromo ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)' }}>
          {appliedPromo ? <Check size={14} style={{ color: '#10b981' }} /> : <Tag size={14} style={{ color: '#8b5cf6' }} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black truncate" style={{ color: appliedPromo ? '#059669' : '#6d28d9' }}>
            {appliedPromo ? appliedPromo.name : 'โปรโมชั่น'}
          </p>
          {appliedPromo && (
            <p className="text-[9px] font-bold text-emerald-600">ใช้งานอยู่</p>
          )}
        </div>
      </button>

      <CatRailButton
        active={!selected}
        icon={<Coffee size={14} />}
        label="ทั้งหมด"
        count={totalAvailable}
        onClick={() => onSelect(null)}
      />
      {categories.map((cat) => {
        const count = products.filter(
          (p) => p.categoryId === cat.id && p.status === 'AVAILABLE',
        ).length;
        return (
          <CatRailButton
            key={cat.id}
            active={selected === cat.id}
            icon={<span className="text-base leading-none">{cat.icon || '📂'}</span>}
            label={cat.name}
            count={count}
            onClick={() => onSelect(cat.id)}
          />
        );
      })}
    </aside>
  );
}

function CatRailButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full h-11 px-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
      style={{
        background: active
          ? 'linear-gradient(135deg, #fbbf24, #ea580c)'
          : 'transparent',
        color: active ? '#ffffff' : '#7c543c',
        boxShadow: active ? '0 4px 12px rgba(234,88,12,0.25)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#fdfaf6';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      <span
        className="text-[10px] num font-black px-1.5 h-4 inline-flex items-center rounded"
        style={{
          background: active ? 'rgba(255,255,255,0.22)' : '#f3ece1',
          color: active ? '#ffffff' : '#7c543c80',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Order filter rail
// ════════════════════════════════════════════════════════════════════════════
function OrderFilterRail({
  value,
  onChange,
  orders,
}: {
  value: PlatformKey;
  onChange: (v: PlatformKey) => void;
  orders: any[];
}) {
  const filters: Array<{ id: PlatformKey; label: string; icon: string; color: string }> = [
    { id: 'ALL',       label: 'ทั้งหมด',   icon: '📋', color: '#7c543c' },
    { id: 'STORE',     label: 'หน้าร้าน', icon: '🏪', color: '#7c543c' },
    { id: 'GRAB',      label: 'Grab',      icon: '🟢', color: '#00b14f' },
    { id: 'LINE',      label: 'LINE MAN',  icon: '🟡', color: '#06c755' },
    { id: 'SHOPEE', label: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
    { id: 'BOOTH',     label: 'ออกบูธ',   icon: '🎪', color: '#7c3aed' },
    { id: 'OTHER',     label: 'อื่นๆ',     icon: '📦', color: '#64748b' },
  ];
  return (
    <aside
      className="w-[180px] shrink-0 overflow-y-auto no-scrollbar p-3 space-y-1"
      style={{ background: '#ffffff', borderRight: '1px solid #ece5da' }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50 px-2 py-2">
        ที่มา
      </p>
      {filters.map((f) => {
        const count = f.id === 'ALL'
          ? orders.length
          : orders.filter((o: any) => o.platform === f.id).length;
        const active = value === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className="w-full h-11 px-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
            style={{
              background: active ? f.color : 'transparent',
              color: active ? '#ffffff' : '#7c543c',
              boxShadow: active ? `0 4px 12px ${f.color}40` : 'none',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#fdfaf6'; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="shrink-0 text-base leading-none">{f.icon}</span>
            <span className="flex-1 text-left truncate text-xs">{f.label}</span>
            <span
              className="text-[10px] num font-black px-1.5 h-4 inline-flex items-center rounded"
              style={{
                background: active ? 'rgba(255,255,255,0.22)' : '#f3ece1',
                color: active ? '#ffffff' : '#7c543c80',
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Product card
// ════════════════════════════════════════════════════════════════════════════
function ProductCard({ product, onClick }: { product: any; onClick: () => void }) {
  const hasOptions = (product.optionGroups || []).length > 0;
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative bg-white rounded-3xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all flex flex-col"
      style={{ border: '1px solid #ece5da' }}
    >
      <div
        className="aspect-square relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fef3c7, #fed7aa)' }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={36} className="text-[#7c543c]/30" />
          </div>
        )}
        {hasOptions && (
          <span
            className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.95)', color: '#7c543c' }}
          >
            <Sparkles size={10} /> ปรับแต่งได้
          </span>
        )}
        <div
          className="absolute bottom-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}
        >
          <Plus className="text-white" size={18} />
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h4 className="font-black text-sm text-[#2d241e] leading-tight line-clamp-2">
          {product.name}
        </h4>
        {product.description && (
          <p className="text-[11px] text-[#7c543c]/60 line-clamp-1 font-medium">
            {product.description}
          </p>
        )}
        <p className="font-black text-base text-[#ea580c] mt-auto num">
          ฿{product.price}
        </p>
      </div>
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Order feed card
// ════════════════════════════════════════════════════════════════════════════
function OrderFeedCard({
  order,
  active,
  onClick,
}: {
  order: any;
  active: boolean;
  onClick: () => void;
}) {
  const status = STATUS_TONE[order.status] || STATUS_TONE.PENDING;
  const platform = PLATFORM_TONE[order.platform] || PLATFORM_TONE.STORE;
  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all p-4 text-left flex flex-col gap-3"
      style={{
        border: active ? '2px solid #ea580c' : '1px solid #ece5da',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg num shadow-md"
            style={{
              background: `linear-gradient(135deg, ${platform.fg}, ${platform.fg}cc)`,
              color: '#ffffff',
            }}
          >
            #{order.queueNo || '?'}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50 num">
              {order.orderNo}
            </p>
            <p className="font-black text-sm text-[#2d241e] truncate max-w-[140px]">
              {order.customerName || 'ลูกค้า Walk-in'}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black"
          style={{ background: platform.bg, color: platform.fg }}
        >
          {platform.label}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px dashed #ece5da' }}>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black"
            style={{ background: status.bg, color: status.fg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
            {STATUS_LABEL[order.status] || order.status}
          </span>
          <span className="text-[10px] font-bold text-[#7c543c]/60">
            {order.items?.length || 0} รายการ
          </span>
        </div>
        <span className="font-black text-base text-[#ea580c] num">฿{order.totalAmount}</span>
      </div>
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Empty state
// ════════════════════════════════════════════════════════════════════════════
function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-[#7c543c]/40">
      {icon}
      <p className="mt-4 font-black text-sm uppercase tracking-widest">{title}</p>
      {hint && <p className="mt-1 text-xs font-semibold max-w-xs">{hint}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Cart panel (right side, always visible)
// ════════════════════════════════════════════════════════════════════════════
function CartPanel({
  cart,
  subtotal,
  discount,
  total,
  member,
  memberSearch,
  memberResults,
  memberOpen,
  searchingMember,
  onMemberSearchChange,
  onMemberSearch,
  onMemberSelect,
  onMemberClear,
  onMemberToggle,
  onCreateCustomer,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
}: {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  member: any;
  memberSearch: string;
  memberResults: any[];
  memberOpen: boolean;
  searchingMember: boolean;
  onMemberSearchChange: (v: string) => void;
  onMemberSearch: () => void;
  onMemberSelect: (member: any) => void;
  onMemberClear: () => void;
  onMemberToggle: () => void;
  onCreateCustomer: () => void;
  onUpdateQty: (idx: number, delta: number) => void;
  onRemove: (idx: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#fdfaf6', color: '#7c543c' }}
          >
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">
              ออเดอร์ปัจจุบัน
            </p>
            <p className="font-black text-base text-[#2d241e] num">
              {itemCount} {itemCount === 1 ? 'รายการ' : 'รายการ'}
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7c543c]/50 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title="ล้างตะกร้า"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Member section */}
      <div className="px-5 pb-3">
        {member ? (
          <div
            className="rounded-2xl p-3 flex items-center gap-2.5"
            style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #a7f3d0' }}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
              <Star size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-emerald-800 truncate">
                {member.name || 'สมาชิก'}
              </p>
              <p className="text-[10px] font-bold text-emerald-700 num">
                {member.phone || member.email || '—'} · {member.points || 0} แต้ม
              </p>
            </div>
            <button
              onClick={onMemberClear}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-700 hover:bg-emerald-200/60"
            >
              <X size={12} />
            </button>
          </div>
        ) : memberOpen ? (
          <div
            className="rounded-2xl p-3 space-y-2"
            style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">
                  ลูกค้าหน้าร้าน
                </p>
                <p className="text-xs font-black text-[#2d241e]">ค้นหาหรือเพิ่มสมาชิก</p>
              </div>
              <button
                onClick={onCreateCustomer}
                className="h-8 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white inline-flex items-center gap-1"
                style={{ background: '#ea580c' }}
              >
                <Plus size={12} /> เพิ่ม
              </button>
            </div>
            <input
              autoFocus
              value={memberSearch}
              onChange={(e) => onMemberSearchChange(e.target.value)}
              placeholder="ชื่อ / เบอร์ / อีเมล"
              onKeyDown={(e) => e.key === 'Enter' && onMemberSearch()}
              className="w-full h-9 px-3 rounded-xl text-xs font-medium outline-none"
              style={{ background: '#ffffff', border: '1px solid #ece5da' }}
            />
            <div className="flex gap-2">
              <button
                onClick={onMemberSearch}
                disabled={searchingMember || !memberSearch.trim()}
                className="flex-1 h-9 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
                style={{ background: '#7c543c', color: '#ffffff' }}
              >
                {searchingMember ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} ค้นหา
              </button>
              <button
                onClick={onMemberToggle}
                className="px-3 h-9 rounded-xl text-[11px] font-black uppercase tracking-widest"
                style={{ background: '#ffffff', color: '#7c543c80', border: '1px solid #ece5da' }}
              >
                ปิด
              </button>
            </div>
            {memberResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                {memberResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => onMemberSelect(result)}
                    className="w-full rounded-xl bg-white border border-[#ece5da] p-2.5 text-left hover:border-[#ea580c] transition-colors"
                  >
                    <p className="text-xs font-black text-[#2d241e] truncate">
                      {result.name || 'ลูกค้า'}
                    </p>
                    <p className="text-[10px] font-bold text-[#7c543c]/65 truncate">
                      {result.phone || result.email || 'ไม่มีเบอร์ติดต่อ'} · {result.points || 0} แต้ม
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-3" style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#7c543c]">
                <User size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#2d241e]">ลูกค้าหน้าร้าน</p>
                <p className="text-[10px] font-bold text-[#7c543c]/65">
                  ค่าเริ่มต้นสำหรับ Walk-in
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={onMemberToggle}
                className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                style={{ background: '#ffffff', color: '#7c543c', border: '1px solid #ece5da' }}
              >
                ค้นหา
              </button>
              <button
                onClick={onCreateCustomer}
                className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-white"
                style={{ background: '#ea580c' }}
              >
                เพิ่มลูกค้า
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2 no-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#7c543c]/30">
            <ShoppingBag size={48} strokeWidth={1.5} />
            <p className="mt-3 font-black text-xs uppercase tracking-widest">ตะกร้าว่าง</p>
            <p className="mt-1 text-[10px] font-bold">แตะเมนูฝั่งซ้ายเพื่อเพิ่ม</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="rounded-2xl p-3"
              style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
            >
              <div className="flex items-start gap-2.5 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: '#ece5da' }}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Coffee size={16} className="text-[#7c543c]/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-[#2d241e] truncate">
                    {item.productName}
                  </p>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-[10px] font-medium text-[#7c543c]/70 truncate">
                      {item.selectedOptions.map((o) => o.label).join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemove(idx)}
                  className="text-[#7c543c]/30 hover:text-rose-500 transition-colors p-1"
                  title="ลบ"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div
                  className="inline-flex items-center rounded-xl"
                  style={{ background: '#ffffff', border: '1px solid #ece5da' }}
                >
                  <button
                    onClick={() => onUpdateQty(idx, -1)}
                    className="w-7 h-7 flex items-center justify-center text-[#7c543c] hover:bg-[#fdfaf6] rounded-l-xl"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-black text-xs num w-7 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(idx, 1)}
                    className="w-7 h-7 flex items-center justify-center text-[#7c543c] hover:bg-[#fdfaf6] rounded-r-xl"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="font-black text-sm text-[#ea580c] num">
                  ฿{(item.totalPrice * item.quantity).toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary + checkout */}
      <div
        className="px-5 pt-4 pb-4 space-y-2 shrink-0"
        style={{
          borderTop: '1px solid #ece5da',
          background: '#fdfaf6',
          paddingBottom: 'max(1rem, var(--sab, 0px))',
        }}
      >
        <div className="flex justify-between text-xs font-bold text-[#7c543c]/70">
          <span>ยอดย่อย</span>
          <span className="num">฿{subtotal.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs font-bold text-rose-600">
            <span>ส่วนลด</span>
            <span className="num">-฿{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-2" style={{ borderTop: '1px dashed #d4c5b0' }}>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">
            ยอดสุทธิ
          </span>
          <span className="text-2xl font-black tracking-tight text-[#2d241e] num">
            ฿{total.toLocaleString()}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={cart.length === 0}
          onClick={onCheckout}
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm text-white flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none transition-all"
          style={{
            background:
              cart.length === 0
                ? '#94a3b8'
                : 'linear-gradient(135deg, #ea580c, #7c543c)',
            boxShadow: cart.length === 0 ? 'none' : '0 8px 24px rgba(234,88,12,0.30)',
          }}
        >
          <Wallet size={16} /> ดำเนินการชำระเงิน
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Order detail panel (right side when in orders tab)
// ════════════════════════════════════════════════════════════════════════════
function OrderDetailPanel({
  order,
  onClose,
  onShowReceipt,
  onMarkPaid,
  markingPaid,
}: {
  order: any;
  onClose: () => void;
  onShowReceipt: () => void;
  onMarkPaid: () => void;
  markingPaid: boolean;
}) {
  const status = STATUS_TONE[order.status] || STATUS_TONE.PENDING;
  const platform = PLATFORM_TONE[order.platform] || PLATFORM_TONE.STORE;
  const isPaid = order.payment?.status === 'PAID' || order.status === 'PAID';
  const canMarkPaid = !isPaid && order.status !== 'CANCELLED';
  return (
    <>
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${platform.fg}, ${platform.fg}dd)`,
          color: '#ffffff',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg num shadow-md"
            style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}
          >
            #{order.queueNo || '?'}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 num">
              {order.orderNo}
            </p>
            <p className="font-black text-base truncate max-w-[140px]">
              {order.customerName || 'Walk-in'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.20)' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-3 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black"
          style={{ background: status.bg, color: status.fg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
          {STATUS_LABEL[order.status] || order.status}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-black"
          style={{ background: platform.bg, color: platform.fg }}
        >
          {platform.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2 no-scrollbar">
        {(order.items || []).map((item: any, idx: number) => (
          <div
            key={idx}
            className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs num shrink-0"
              style={{ background: '#ece5da', color: '#7c543c' }}
            >
              ×{item.quantity}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-[#2d241e] truncate">
                {item.productName || item.product?.name || 'สินค้า'}
              </p>
              {item.selectedOptions && item.selectedOptions.length > 0 && (
                <p className="text-[10px] font-medium text-[#7c543c]/70 truncate">
                  {item.selectedOptions.map((o: any) => o.label).join(' · ')}
                </p>
              )}
            </div>
            <span className="font-black text-sm text-[#ea580c] num shrink-0">
              ฿{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
            </span>
          </div>
        ))}

        {order.note && (
          <div
            className="rounded-2xl p-3 flex items-start gap-2"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <CircleAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                หมายเหตุ
              </p>
              <p className="text-xs font-bold text-amber-900 mt-0.5">{order.note}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-2" style={{ borderTop: '1px solid #ece5da', background: '#fdfaf6' }}>
        <div className="flex items-end justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">
            ยอดรวม
          </span>
          <span className="text-2xl font-black tracking-tight text-[#2d241e] num">
            ฿{Number(order.totalAmount || 0).toLocaleString()}
          </span>
        </div>
        {canMarkPaid && (
          <button
            onClick={onMarkPaid}
            disabled={markingPaid}
            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#059669', color: '#ffffff' }}
          >
            {markingPaid ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            ชำระแล้ว
          </button>
        )}
        <button
          onClick={onShowReceipt}
          className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
          style={{ background: '#7c543c', color: '#ffffff' }}
        >
          <Receipt size={14} /> ดูใบเสร็จ
        </button>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Configure product sheet
// ════════════════════════════════════════════════════════════════════════════
function ConfigureSheet({
  product,
  selectedOptions,
  onSelectOption,
  onAdd,
  onClose,
}: {
  product: any;
  selectedOptions: Record<string, string>;
  onSelectOption: (gid: string, oid: string) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  const optionsSubtotal = useMemo(() => {
    let sum = 0;
    (product.optionGroups || []).forEach((g: any) => {
      const oid = selectedOptions[g.id];
      if (!oid) return;
      const opt = g.options.find((o: any) => o.id === oid);
      if (opt) sum += opt.priceAddon || 0;
    });
    return sum;
  }, [product, selectedOptions]);
  const total = product.price + optionsSubtotal;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      /* On mobile we must stop the overlay above the bottom nav bar (60 px + safe-area).
         On sm+ it is a centred dialog so inset-0 is fine. */
      className="fixed inset-0 sm:inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ bottom: 'calc(max(60px, calc(60px + var(--sab, 0px))))' }}
    >
      <div className="absolute inset-0 bg-[#2d241e]/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full sm:max-w-2xl bg-white rounded-t-[2rem] sm:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl"
        style={{ maxHeight: 'calc(100dvh - 68px)', ['--sheet-pb' as any]: 'max(1rem, var(--sab, 0px))' }}
      >
        {/* Hero */}
        <div className="relative aspect-[16/9] overflow-hidden" style={{ background: 'linear-gradient(135deg, #fef3c7, #fed7aa)' }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Coffee size={64} className="text-[#7c543c]/40" />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))' }} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.20)', color: '#ffffff' }}
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <h2 className="font-black text-2xl tracking-tight">{product.name}</h2>
            {product.description && (
              <p className="text-xs opacity-90 line-clamp-2 mt-1 font-medium">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 no-scrollbar">
          {(product.optionGroups || []).length === 0 ? (
            <div className="text-center py-10 text-[#7c543c]/50">
              <Sparkles size={28} className="mx-auto mb-2" />
              <p className="text-sm font-black">เมนูนี้ไม่มีตัวเลือก กดเพิ่มได้เลย</p>
            </div>
          ) : (
            (product.optionGroups || []).map((group: any) => (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-[#2d241e]">{group.name}</h3>
                    {group.isRequired && (
                      <span className="text-[9px] px-1.5 h-4 inline-flex items-center rounded font-black bg-rose-100 text-rose-700">
                        จำเป็น
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/50">
                    เลือก {group.maxSelect || 1}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.options.map((opt: any) => {
                    const active = selectedOptions[group.id] === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelectOption(group.id, opt.id)}
                        className="px-3 py-2.5 rounded-2xl text-sm font-black transition-all flex flex-col items-start"
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, #fbbf24, #ea580c)'
                            : '#fdfaf6',
                          color: active ? '#ffffff' : '#2d241e',
                          border: `2px solid ${active ? '#ea580c' : '#ece5da'}`,
                          boxShadow: active ? '0 4px 12px rgba(234,88,12,0.25)' : 'none',
                        }}
                      >
                        <span className="leading-tight">{opt.label}</span>
                        {opt.priceAddon > 0 && (
                          <span
                            className="text-[10px] font-bold mt-0.5 num"
                            style={{ opacity: active ? 0.85 : 0.6 }}
                          >
                            +฿{opt.priceAddon}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — sits flush at bottom, above the mobile nav */}
        <div
          className="shrink-0 px-5 sm:px-6 pt-4 flex items-center gap-3"
          style={{
            borderTop: '1px solid #ece5da',
            background: '#fdfaf6',
            paddingBottom: 'max(1rem, var(--sab, 0px))',
          }}
        >
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">
              ยอดรวม
            </p>
            <p className="text-2xl font-black tracking-tight text-[#2d241e] num">
              ฿{total.toLocaleString()}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAdd}
            className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-sm text-white flex items-center gap-2 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #ea580c, #7c543c)',
              boxShadow: '0 8px 24px rgba(234,88,12,0.30)',
            }}
          >
            <Plus size={16} /> เพิ่มลงตะกร้า
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateCustomerModal({
  data,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  data: { name: string; phone: string; email: string };
  saving: boolean;
  onChange: (patch: Partial<{ name: string; phone: string; email: string }>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">
              New Customer
            </p>
            <h2 className="text-2xl font-black tracking-tight text-[#2d241e]">
              เพิ่มลูกค้าใหม่
            </h2>
            <p className="text-xs font-semibold text-[#7c543c]/70 mt-1">
              กรอกเท่าที่มี ระบบจะใช้สำหรับค้นหาและสะสมแต้ม
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7c543c]/60 hover:bg-[#fdfaf6]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-6 pb-5 space-y-3">
          <FieldInput
            label="ชื่อลูกค้า"
            value={data.name}
            placeholder="เช่น คุณสมชาย"
            onChange={(value) => onChange({ name: value })}
          />
          <FieldInput
            label="เบอร์โทร"
            value={data.phone}
            placeholder="เช่น 0812345678"
            onChange={(value) => onChange({ phone: value })}
          />
          <FieldInput
            label="อีเมล"
            value={data.email}
            placeholder="customer@email.com"
            onChange={(value) => onChange({ email: value })}
          />
        </div>

        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid #ece5da', background: '#fdfaf6' }}>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-widest"
            style={{ background: '#ffffff', color: '#7c543c', border: '1px solid #ece5da' }}
          >
            ยกเลิก
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-white inline-flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            บันทึก
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FieldInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3.5 rounded-2xl text-sm font-medium outline-none"
        style={{ background: '#fdfaf6', border: '1px solid #ece5da', color: '#2d241e' }}
      />
    </label>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Checkout modal
// ════════════════════════════════════════════════════════════════════════════
function CheckoutModal({
  cart,
  subtotal,
  total,
  data,
  cashReceived,
  change,
  isPosting,
  onChangeData,
  onCashChange,
  onClose,
  onSubmit,
}: {
  cart: CartItem[];
  subtotal: number;
  total: number;
  data: { customerName: string; paymentMethod: string; note: string };
  cashReceived: string;
  change: number;
  isPosting: boolean;
  onChangeData: (patch: Partial<{ customerName: string; paymentMethod: string; note: string }>) => void;
  onCashChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isCash = data.paymentMethod === 'CASH';
  const cashOk = !isCash || (parseFloat(cashReceived || '0') >= total);

  const press = (digit: string) => {
    if (isPosting) return;
    if (cashReceived === '0' && digit !== '.') {
      onCashChange(digit);
      return;
    }
    if (digit === '.' && cashReceived.includes('.')) return;
    onCashChange(cashReceived + digit);
  };
  const back = () => {
    if (isPosting) return;
    onCashChange(cashReceived.slice(0, -1));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center md:p-4"
    >
      <div
        className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md"
        onClick={() => !isPosting && onClose()}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full md:max-w-3xl bg-white md:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 flex-col md:flex-none"
        style={{
          maxHeight: 'calc(100dvh - 68px)',
          marginTop: 'auto',
          display: 'grid',
        }}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden absolute top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-[#e8e2db]" />
        </div>

        {/* Left: summary */}
        <div className="p-5 sm:p-6 flex flex-col overflow-y-auto max-h-[45dvh] md:max-h-none" style={{ background: '#fdfaf6', borderBottom: '1px solid #ece5da' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">
                Checkout
              </p>
              <p className="font-black text-lg text-[#2d241e]">สรุปคำสั่งซื้อ</p>
            </div>
            <button
              onClick={onClose}
              disabled={isPosting}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7c543c]/60 hover:bg-[#ece5da] disabled:opacity-30"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar mb-4">
            {cart.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl p-2.5 flex items-center justify-between gap-2"
                style={{ background: '#ffffff', border: '1px solid #ece5da' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] num shrink-0"
                    style={{ background: '#fdfaf6', color: '#7c543c' }}
                  >
                    ×{item.quantity}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-xs text-[#2d241e] truncate">
                      {item.productName}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-[9px] font-bold text-[#7c543c]/60 truncate">
                        {item.selectedOptions.map((o) => o.label).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-black text-xs text-[#ea580c] num shrink-0">
                  ฿{(item.totalPrice * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            {/* ── ช่องทางสั่งซื้อ ── */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1.5 block">
                ช่องทางสั่งซื้อ
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { id: 'STORE',     label: 'หน้าร้าน', icon: '🏪', color: '#7c543c' },
                  { id: 'GRAB',      label: 'Grab',      icon: '🟢', color: '#00b14f' },
                  { id: 'LINE',      label: 'LINE MAN',  icon: '🟡', color: '#06c755' },
                  { id: 'SHOPEE', label: 'Shopee', icon: '🛍️', color: '#ee4d2d' },
                  { id: 'BOOTH',     label: 'ออกบูธ',   icon: '🎪', color: '#7c3aed' },
                  { id: 'OTHER',     label: 'อื่นๆ',     icon: '📦', color: '#64748b' },
                ] as const).map((p) => {
                  const active = (data as any).platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChangeData({ platform: p.id } as any)}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-black transition-all"
                      style={{
                        background: active ? p.color : '#f3ece1',
                        color: active ? '#fff' : '#7c543c',
                        boxShadow: active ? `0 3px 8px ${p.color}40` : 'none',
                        transform: active ? 'scale(1.04)' : 'scale(1)',
                      }}
                    >
                      <span className="text-lg leading-none">{p.icon}</span>
                      <span className="leading-tight text-center">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1 block">
                ชื่อลูกค้า
              </label>
              <input
                value={data.customerName}
                onChange={(e) => onChangeData({ customerName: e.target.value })}
                placeholder="ลูกค้าหน้าร้าน"
                className="w-full h-10 px-3 rounded-xl text-sm font-medium outline-none"
                style={{ background: '#ffffff', border: '1px solid #ece5da' }}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1 block">
                หมายเหตุ
              </label>
              <input
                value={data.note}
                onChange={(e) => onChangeData({ note: e.target.value })}
                placeholder="เช่น ไม่ใส่น้ำแข็ง"
                className="w-full h-10 px-3 rounded-xl text-sm font-medium outline-none"
                style={{ background: '#ffffff', border: '1px solid #ece5da' }}
              />
            </div>
          </div>


          {/* Promotion / coupon code */}
          <PromoSection
            subtotal={subtotal}
            cart={cart}
            appliedPromo={data.appliedPromo}
            onApply={(promo) => onChangeData({ appliedPromo: promo } as any)}
            onRemove={() => onChangeData({ appliedPromo: undefined } as any)}
          />

          <div
            className="rounded-2xl p-3.5 space-y-1.5"
            style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)', color: '#ffffff' }}
          >
            <div className="flex justify-between text-xs font-bold opacity-90">
              <span>ยอดย่อย</span>
              <span className="num">฿{subtotal.toLocaleString()}</span>
            </div>
            {(data as any).appliedPromo && (
              <div className="flex justify-between text-xs font-bold" style={{ color: '#bbf7d0' }}>
                <span>🏷 {(data as any).appliedPromo.name}</span>
                <span className="num">-฿{(data as any).appliedPromo.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-1.5" style={{ borderTop: '1px dashed rgba(255,255,255,0.30)' }}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-90">
                ยอดสุทธิ
              </span>
              <span className="text-3xl font-black tracking-tight num">
                ฿{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: payment */}
        <div className="p-5 sm:p-6 flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-2">
            วิธีชำระเงิน
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <PayMethodButton
              active={data.paymentMethod === 'CASH'}
              onClick={() => onChangeData({ paymentMethod: 'CASH' })}
              icon={<Banknote size={20} />}
              label="เงินสด"
            />
            <PayMethodButton
              active={data.paymentMethod === 'QR'}
              onClick={() => onChangeData({ paymentMethod: 'QR' })}
              icon={<QrCode size={20} />}
              label="QR"
            />
            <PayMethodButton
              active={data.paymentMethod === 'TRANSFER'}
              onClick={() => onChangeData({ paymentMethod: 'TRANSFER' })}
              icon={<CreditCard size={20} />}
              label="โอน"
            />
          </div>

          {isCash && (
            <>
              {/* Cash received + change — single row, large */}
              <div
                className="rounded-2xl mb-3 overflow-hidden"
                style={{ border: '1px solid #ece5da' }}
              >
                <div className="grid grid-cols-2 divide-x" style={{ borderColor: '#ece5da' }}>
                  {/* Left: received */}
                  <div className="p-4" style={{ background: '#fdfaf6' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/50 mb-1">
                      รับเงินมา
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-[#7c543c]/60 num">฿</span>
                      <span className="text-3xl font-black tracking-tight text-[#2d241e] num leading-none">
                        {cashReceived || '0'}
                      </span>
                    </div>
                  </div>

                  {/* Right: change */}
                  <div
                    className="p-4 transition-colors"
                    style={{
                      background: parseFloat(cashReceived || '0') <= 0
                        ? '#fdfaf6'
                        : change >= 0
                          ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)'
                          : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                    }}
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1"
                      style={{
                        color: parseFloat(cashReceived || '0') <= 0
                          ? '#7c543c80'
                          : change >= 0 ? '#059669' : '#dc2626',
                        opacity: 0.8,
                      }}
                    >
                      {parseFloat(cashReceived || '0') <= 0
                        ? 'เงินทอน'
                        : change >= 0 ? 'เงินทอน' : 'ขาดอยู่'}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-sm font-black num"
                        style={{
                          color: parseFloat(cashReceived || '0') <= 0
                            ? '#7c543c40'
                            : change >= 0 ? '#059669' : '#dc2626',
                        }}
                      >
                        ฿
                      </span>
                      <span
                        className="text-3xl font-black tracking-tight num leading-none"
                        style={{
                          color: parseFloat(cashReceived || '0') <= 0
                            ? '#7c543c30'
                            : change >= 0 ? '#059669' : '#dc2626',
                        }}
                      >
                        {parseFloat(cashReceived || '0') <= 0
                          ? '0'
                          : Math.abs(change).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[50, 100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => onCashChange(String(amt))}
                    className="h-9 rounded-xl text-xs font-black num transition-all"
                    style={{ background: '#fdfaf6', color: '#7c543c', border: '1px solid #ece5da' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3ece1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fdfaf6';
                    }}
                  >
                    ฿{amt}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <KeypadCell key={d} onClick={() => press(d)}>
                    {d}
                  </KeypadCell>
                ))}
                <KeypadCell muted onClick={back}>
                  <Backspace size={16} />
                </KeypadCell>
                <KeypadCell onClick={() => press('0')}>0</KeypadCell>
                <KeypadCell muted onClick={() => press('.')}>
                  .
                </KeypadCell>
              </div>
            </>
          )}

          {!isCash && (
            <div
              className="flex-1 flex items-center justify-center rounded-2xl p-6 text-center"
              style={{ background: '#fdfaf6', border: '1px dashed #d4c5b0' }}
            >
              <div>
                <QrCode size={48} className="mx-auto mb-3 text-[#7c543c]/40" />
                <p className="text-sm font-black text-[#2d241e]">
                  แจ้งลูกค้าให้สแกน / โอน
                </p>
                <p className="text-xs font-bold text-[#7c543c]/60 mt-1">
                  ยืนยันยอดเข้าก่อนกดปุ่มข้างล่าง
                </p>
              </div>
            </div>
          )}

          {/* Confirm button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSubmit}
            disabled={isPosting || !cashOk || cart.length === 0}
            className="mt-4 h-14 rounded-2xl font-black uppercase tracking-widest text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none transition-all shrink-0"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 8px 24px rgba(16,185,129,0.30)',
              paddingBottom: 'max(0px, var(--sab, 0px))',
            }}
          >
            {isPosting ? (
              <>กำลังบันทึก...</>
            ) : (
              <>
                <Check size={16} /> ยืนยันการชำระเงิน <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PayMethodButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all"
      style={{
        background: active ? 'linear-gradient(135deg, #fbbf24, #ea580c)' : '#fdfaf6',
        color: active ? '#ffffff' : '#7c543c',
        border: `2px solid ${active ? '#ea580c' : '#ece5da'}`,
        boxShadow: active ? '0 4px 12px rgba(234,88,12,0.20)' : 'none',
      }}
    >
      {icon}
      <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function KeypadCell({
  children,
  onClick,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="h-11 rounded-xl text-lg font-black flex items-center justify-center transition-all"
      style={{
        background: muted ? '#f3ece1' : '#fdfaf6',
        color: '#7c543c',
        border: '1px solid #ece5da',
      }}
    >
      {children}
    </motion.button>
  );
}

function formatReceiptOptions(selectedOptions: any): string[] {
  if (!selectedOptions) return [];
  if (Array.isArray(selectedOptions)) {
    return selectedOptions
      .map((option) => {
        const label = option?.label || option?.name || option?.optionName;
        const group = option?.groupName;
        return label ? `${group ? `${group}: ` : ''}${label}` : '';
      })
      .filter(Boolean);
  }
  if (typeof selectedOptions === 'object') {
    return Object.values(selectedOptions)
      .map((value: any) => {
        if (typeof value === 'string') return value;
        return value?.label || value?.name || value?.optionName || '';
      })
      .filter(Boolean);
  }
  return [];
}

function PrintableReceipt({ branch, order }: { branch: any; order: any }) {
  const items = order.items || [];
  const paymentMethod = order.payment?.method || (order.paymentQr ? 'QR' : 'CASH');
  const paymentStatus = order.payment?.status || (order.status === 'PAID' ? 'PAID' : 'UNPAID');
  const paymentLabel: Record<string, string> = {
    CASH: 'เงินสด',
    QR: 'PromptPay QR',
    CARD: 'บัตร',
    TRANSFER: 'โอนเงิน',
  };

  return (
    <div id="printable-receipt">
      <div className="print-receipt-brand">456 Coffee</div>
      <div className="print-receipt-center print-receipt-muted">
        {branch?.name || 'สาขาหลัก'}
      </div>
      <div className="print-receipt-center print-receipt-muted">
        {order.createdAt ? new Date(order.createdAt).toLocaleString('th-TH') : new Date().toLocaleString('th-TH')}
      </div>

      <div className="print-receipt-queue">#{order.queueNo || '-'}</div>
      <div className="print-receipt-center print-receipt-muted">{order.orderNo || '-'}</div>

      <div className="print-receipt-divider" />

      {items.map((item: any, idx: number) => {
        const name = item.productName || item.product?.name || item.name || 'สินค้า';
        const options = formatReceiptOptions(item.selectedOptions);
        const itemTotal = Number(item.price ?? item.totalPrice ?? 0);
        return (
          <div key={`${item.id || name}-${idx}`} className="print-receipt-item">
            <div className="print-receipt-row">
              <span>×{item.quantity || 1} {name}</span>
              <strong>฿{itemTotal.toLocaleString()}</strong>
            </div>
            {options.map((option, optionIdx) => (
              <div key={optionIdx} className="print-receipt-option">
                {option}
              </div>
            ))}
          </div>
        );
      })}

      <div className="print-receipt-divider" />

      <div className="print-receipt-row print-receipt-total">
        <span>ยอดรวม</span>
        <strong>฿{Number(order.totalAmount || 0).toLocaleString()}</strong>
      </div>
      <div className="print-receipt-row print-receipt-muted">
        <span>วิธีชำระเงิน</span>
        <span>{paymentLabel[paymentMethod] || paymentMethod}</span>
      </div>
      <div className="print-receipt-row print-receipt-muted">
        <span>สถานะ</span>
        <span>{paymentStatus === 'PAID' ? 'ชำระแล้ว' : 'รอชำระ'}</span>
      </div>

      {order.paymentQr?.qrImageDataUrl && (
        <div className="print-receipt-qr">
          <img src={order.paymentQr.qrImageDataUrl} alt="PromptPay QR" />
          <div className="print-receipt-muted">
            {order.paymentQr.promptpayName} · {order.paymentQr.promptpayId}
          </div>
        </div>
      )}

      {order.note && (
        <>
          <div className="print-receipt-divider" />
          <div className="print-receipt-muted">หมายเหตุ: {order.note}</div>
        </>
      )}

      <div className="print-receipt-thanks">ขอบคุณที่ใช้บริการ</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Receipt modal
// ════════════════════════════════════════════════════════════════════════════
function ReceiptModal({
  branch,
  order,
  autoPrint,
  markingPaid,
  onMarkPaid,
  onPrinted,
  onClose,
}: {
  branch: any;
  order: any;
  autoPrint: boolean;
  markingPaid: boolean;
  onMarkPaid: () => void;
  onPrinted: () => void;
  onClose: () => void;
}) {
  const receiptItems = order.items || [];
  const visibleItems = receiptItems.slice(0, 3);
  const hiddenItemsCount = Math.max(0, receiptItems.length - visibleItems.length);
  const isPaid = order.payment?.status === 'PAID' || order.status === 'PAID';
  const canMarkPaid = !isPaid && order.status !== 'CANCELLED';

  useEffect(() => {
    if (!autoPrint || !isPaid) return;
    const timer = window.setTimeout(() => {
      window.print();
      onPrinted();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [autoPrint, isPaid, order.id, onPrinted]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
    >
      <div
        className="absolute inset-0 bg-[#2d241e]/70 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="relative w-full max-w-[360px] bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[calc(100dvh-1rem)] flex flex-col"
      >
        <div
          className="px-5 py-4 text-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)' }}
        >
          <div
            className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)' }}
          >
            <Coffee size={19} />
          </div>
          <h2 className="font-black text-lg mt-1.5 tracking-tight">456 Coffee</h2>
          <p className="text-xs font-bold opacity-80">{branch?.name}</p>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="px-5 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/60">
              หมายเลขคิว
            </p>
            <p className="text-5xl font-black tracking-tight text-[#ea580c] num leading-none mt-1">
              #{order.queueNo}
            </p>
            <p className="text-[10px] font-bold text-[#7c543c]/60 mt-1 num">{order.orderNo}</p>
          </div>

          <div
            className="px-5 py-2.5 space-y-1"
            style={{ borderTop: '1px dashed #ece5da', borderBottom: '1px dashed #ece5da' }}
          >
            {visibleItems.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="font-bold text-[#2d241e] truncate pr-2">
                  ×{item.quantity} {item.productName || item.product?.name}
                </span>
                <span className="font-black text-[#ea580c] num shrink-0">
                  ฿{Number(item.price || 0).toLocaleString()}
                </span>
              </div>
            ))}
            {hiddenItemsCount > 0 && (
              <div className="text-[10px] font-bold text-[#7c543c]/60 text-center">
                + อีก {hiddenItemsCount} รายการในใบเสร็จพิมพ์
              </div>
            )}
          </div>

          <div className="px-5 py-2.5 flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7c543c]/70">
              ยอดสุทธิ
            </span>
            <span className="text-[1.6rem] leading-none font-black tracking-tight text-[#2d241e] num">
              ฿{Number(order.totalAmount || 0).toLocaleString()}
            </span>
          </div>

          {order.paymentQr && (
            <div
              className="mx-4 mb-3 rounded-[1.5rem] p-3 text-center"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.18), transparent 55%), #fff7ed',
                border: '1px solid #fed7aa',
                boxShadow: '0 16px 36px rgba(124,84,60,0.10)',
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ea580c]">
                PromptPay QR
              </p>
              <img
                src={order.paymentQr.qrImageDataUrl}
                alt="PromptPay QR"
                className="w-full mx-auto mt-2 rounded-[1.35rem] bg-white p-2 shadow-lg shadow-amber-900/10"
                style={{ maxWidth: 'min(54vw, 205px)', maxHeight: 'min(31dvh, 205px)' }}
              />
              <p className="text-[11px] font-black text-[#2d241e] mt-2">
                รอระบบตรวจเงินเข้าอัตโนมัติ
              </p>
              <p className="text-[10px] text-[#7c543c] mt-0.5 truncate">
                {order.paymentQr.promptpayName} · {order.paymentQr.promptpayId}
              </p>
            </div>
          )}
        </div>

        <div className="p-2.5 flex gap-2 shrink-0" style={{ borderTop: '1px solid #ece5da', background: '#fdfaf6' }}>
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest"
            style={{ background: '#ffffff', color: '#7c543c', border: '1px solid #ece5da' }}
          >
            <ChevronRight size={14} className="inline -mr-1" /> ปิด
          </button>
          {canMarkPaid && (
            <button
              onClick={onMarkPaid}
              disabled={markingPaid}
              className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: '#059669' }}
            >
              {markingPaid ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              ชำระแล้ว
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #ea580c, #7c543c)' }}
          >
            <Printer size={13} /> พิมพ์ใบเสร็จ
          </button>
        </div>
        </motion.div>
      <PrintableReceipt branch={branch} order={order} />
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PromoSection — coupon code input + promotion picker inside CheckoutModal
// ════════════════════════════════════════════════════════════════════════════
function PromoSection({
  subtotal,
  cart,
  appliedPromo,
  onApply,
  onRemove,
}: {
  subtotal: number;
  cart: CartItem[];
  appliedPromo?: { id: string; name: string; discountAmount: number } | undefined;
  onApply: (promo: { id: string; name: string; discountAmount: number }) => void;
  onRemove: () => void;
}) {
  const API_URL = SOCKET_URL;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showList, setShowList] = useState(false);
  const [promos, setPromos] = useState<any[]>([]);

  async function applyCode() {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/promotions/calculate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          cart: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.totalPrice,
          })),
          orderSubtotal: subtotal,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'โค้ดไม่ถูกต้อง');
      onApply({ id: json.promotionId, name: code.toUpperCase(), discountAmount: json.discountAmount });
      setCode('');
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPromos() {
    const res = await fetch(`${API_URL}/api/promotions`);
    const data = await res.json();
    setPromos(Array.isArray(data) ? data.filter((p: any) => !p.code) : []);
    setShowList(true);
  }

  async function applyPromo(p: any) {
    setLoading(true);
    setError('');
    setShowList(false);
    try {
      const res = await fetch(`${API_URL}/api/promotions/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionId: p.id,
          cart: cart.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.totalPrice,
          })),
          orderSubtotal: subtotal,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'ไม่สามารถใช้โปรโมชั่นได้');
      onApply({ id: p.id, name: p.name, discountAmount: json.discountAmount });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (appliedPromo) {
    return (
      <div
        className="flex items-center justify-between rounded-xl px-3 py-2.5 mb-3"
        style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}
      >
        <div className="flex items-center gap-2">
          <Tag size={14} style={{ color: '#059669' }} />
          <div>
            <p className="text-xs font-black text-emerald-800">{appliedPromo.name}</p>
            <p className="text-[10px] font-bold text-emerald-700">
              ลด ฿{appliedPromo.discountAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <button onClick={onRemove}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-emerald-700 hover:bg-emerald-200/60">
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/60 mb-1 block">
        โปรโมชั่น / Coupon Code
      </label>
      <div className="flex gap-2 mb-1">
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && applyCode()}
          placeholder="ใส่โค้ด เช่น COFFEE10"
          className="flex-1 h-9 px-3 rounded-xl text-xs font-black font-mono tracking-widest outline-none"
          style={{ background: '#fff', border: '1px solid #ece5da' }}
        />
        <button onClick={applyCode} disabled={loading || !code.trim()}
          className="h-9 px-3 rounded-xl text-xs font-black text-white disabled:opacity-40"
          style={{ background: '#7c543c' }}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'ใช้'}
        </button>
        <button onClick={loadPromos}
          className="h-9 px-3 rounded-xl text-xs font-black text-[#7c543c]"
          style={{ background: '#fdfaf6', border: '1px solid #ece5da' }}>
          <Tag size={13} />
        </button>
      </div>
      {error && <p className="text-[10px] font-bold text-red-500 mt-1">{error}</p>}

      {/* Promo picker dropdown */}
      {showList && (
        <div className="rounded-xl mt-1 overflow-hidden shadow-lg"
          style={{ border: '1px solid #ece5da', background: '#fff' }}>
          <div className="flex items-center justify-between px-3 py-2 bg-[#fdfaf6]">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#7c543c]/70">
              โปรโมชั่นที่ใช้ได้
            </p>
            <button onClick={() => setShowList(false)} className="text-[#7c543c]/50">
              <X size={12} />
            </button>
          </div>
          {promos.length === 0 ? (
            <p className="text-center text-xs text-[#7c543c]/50 py-4">ไม่มีโปรโมชั่นที่ใช้ได้</p>
          ) : (
            promos.map(p => (
              <button key={p.id} onClick={() => applyPromo(p)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#fdfaf6] transition-colors"
                style={{ borderTop: '1px solid #f3ece1' }}>
                <div>
                  <p className="text-xs font-black text-[#2d241e]">{p.name}</p>
                  <p className="text-[9px] font-bold text-[#7c543c]/60">{p.description || ''}</p>
                </div>
                <span className="text-xs font-black text-[#ea580c] num">
                  {p.type === 'PERCENT' ? `${p.value}%` : `฿${p.value}`}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
