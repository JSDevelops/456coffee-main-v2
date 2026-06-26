import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, Trash2, Save, 
  AlertCircle, CheckCircle2, ChevronRight, Package,
  Search, RefreshCw, Layers, Info, Lock, Unlock, Clock,
  User, Banknote, TrendingDown, TrendingUp, Award,
  AlertTriangle, Activity, FileText, Check, DollarSign,
  Boxes, ArrowRight, History, Sparkles, X, Eye, KeyRound
} from 'lucide-react';
import { PaginationControls, useClientPagination } from '../Pagination';
import { API_BASE, authHeaders } from '../../api';

export default function StockCheckView({ branch }: any) {
  const [activeTab, setActiveTab] = useState<'open_shop' | 'live_tracker' | 'close_shop' | 'history'>('open_shop');
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [historyShifts, setHistoryShifts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Staff lists & verification state
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [clockedInStaff, setClockedInStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffPin, setSelectedStaffPin] = useState('');
  const [selectedCloseStaffId, setSelectedCloseStaffId] = useState('');
  const [selectedCloseStaffPin, setSelectedCloseStaffPin] = useState('');

  // Opening shift state
  const [openingCash, setOpeningCash] = useState('0');
  const [openingNote, setOpeningNote] = useState('');
  const [openingCounts, setOpeningCounts] = useState<Record<string, number>>({});

  // Closing shift state
  const [closingCash, setClosingCash] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [closingCounts, setClosingCounts] = useState<Record<string, number>>({});
  const [wastes, setWastes] = useState<Record<string, { qty: number, reason: string }>>({});

  // Detailed shift report modal
  const [selectedShift, setSelectedShift] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Data Saved Successfully!');

  useEffect(() => {
    if (branch?.id) {
      fetchCurrentShiftAndInventory();
      fetchHistory();
    }
  }, [branch?.id]);

  // Adjust default tab when shift status changes
  useEffect(() => {
    if (currentShift) {
      setActiveTab('live_tracker');
      // Fetch transactions for the current shift to calculate live deductions
      fetchTransactions(currentShift.openedAt);
      
      // Initialize closing counts with current quantities
      const initialCounts: Record<string, number> = {};
      inventory.forEach(item => {
        initialCounts[item.ingredientId] = item.quantity;
      });
      setClosingCounts(initialCounts);
    } else {
      setActiveTab('open_shop');
      // Initialize opening counts with current quantities
      const initialCounts: Record<string, number> = {};
      inventory.forEach(item => {
        initialCounts[item.ingredientId] = item.quantity;
      });
      setOpeningCounts(initialCounts);
    }
  }, [currentShift, inventory.length]);

  const fetchCurrentShiftAndInventory = async () => {
    if (!branch?.id) return;
    setLoading(true);
    try {
      // 1. Fetch current shift
      const resShift = await fetch(`${API_BASE}/branches/${branch.id}/shift/current`, {
        headers: authHeaders()
      });
      const shiftData = resShift.ok ? await resShift.json() : null;
      setCurrentShift(shiftData);

      // 2. Fetch inventory
      const resInv = await fetch(`${API_BASE}/branches/${branch.id}/inventory`, {
        headers: authHeaders()
      });
      const invData = await resInv.json();
      setInventory(invData);

      // 3. Fetch branch staff
      const resStaff = await fetch(`${API_BASE}/branches/${branch.id}/managers`, {
        headers: authHeaders()
      });
      if (resStaff.ok) {
        const staffData = await resStaff.json();
        setBranchStaff(staffData);
      }

      // 4. Fetch attendance
      const resAtt = await fetch(`${API_BASE}/hr/attendance?branchId=${branch.id}`, {
        headers: authHeaders()
      });
      if (resAtt.ok) {
        const attData = await resAtt.json();
        setClockedInStaff(attData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayStaff = useMemo(() => {
    const activeStaff = branchStaff.filter((s: any) => s.isActive);
    const workingStaff = clockedInStaff
      .filter((a: any) => !a.clockOut)
      .map((a: any) => activeStaff.find((s: any) => s.id === a.staffId))
      .filter(Boolean);
    return workingStaff.length > 0 ? workingStaff : activeStaff;
  }, [branchStaff, clockedInStaff]);

  const fetchHistory = async () => {
    if (!branch?.id) return;
    try {
      const res = await fetch(`${API_BASE}/branches/${branch.id}/shift/history?limit=30`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryShifts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async (openedAt: string) => {
    if (!branch?.id) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/transactions?branchId=${branch.id}&startDate=${openedAt}`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedInventory = useClientPagination(
    filteredInventory,
    8,
    `${activeTab}:${searchTerm.trim().toLowerCase()}`,
  );

  // Parse transaction summaries for the Live Stock Tracker
  const liveStockData = useMemo(() => {
    return inventory.map(item => {
      const ingredientId = item.ingredientId;
      const starting = currentShift?.openingStock?.find((s: any) => s.ingredientId === ingredientId)?.actualQty ?? 0;
      
      // Calculate sums from transactions during this shift
      const itemTxs = transactions.filter(tx => tx.ingredientId === ingredientId);
      const stockIn = itemTxs
        .filter(tx => tx.type === 'STOCK_IN')
        .reduce((sum, tx) => sum + Math.abs(tx.quantity), 0);
      const deductions = itemTxs
        .filter(tx => tx.type === 'ORDER_DEDUCTION')
        .reduce((sum, tx) => sum + tx.quantity, 0); // negative in DB
      const manualWaste = itemTxs
        .filter(tx => tx.type === 'WASTE')
        .reduce((sum, tx) => sum + tx.quantity, 0); // negative in DB
      const adjustments = itemTxs
        .filter(tx => tx.type === 'ADJUSTMENT' && tx.note !== 'Shift Opening Count Alignment')
        .reduce((sum, tx) => sum + tx.quantity, 0); // positive or negative

      return {
        ...item,
        starting,
        stockIn,
        deductions,
        manualWaste,
        adjustments,
        expected: starting + stockIn + adjustments + deductions + manualWaste
      };
    });
  }, [inventory, transactions, currentShift]);

  // Real-time calculations for previewing closing score
  const closingStatsPreview = useMemo(() => {
    let totalWasteCost = 0;
    let totalVarianceCost = 0;
    let totalOpeningStockCost = 0;

    inventory.forEach(item => {
      const ingredientId = item.ingredientId;
      const costPerUnit = item.ingredient.costPerUnit || 0;
      const expected = item.quantity; // current quantity
      const actual = closingCounts[ingredientId] ?? expected;
      const wasteQty = wastes[ingredientId]?.qty || 0;

      const variance = actual - (expected - wasteQty);
      
      totalWasteCost += wasteQty * costPerUnit;
      totalVarianceCost += variance * costPerUnit;

      const starting = currentShift?.openingStock?.find((s: any) => s.ingredientId === ingredientId)?.actualQty ?? 0;
      totalOpeningStockCost += starting * costPerUnit;
    });

    const revenue = currentShift?.liveTotalRevenue || 0;
    const absVarianceCost = Math.abs(totalVarianceCost);
    
    let varianceDeduction = 0;
    let wasteDeduction = 0;

    if (revenue > 0) {
      varianceDeduction = Math.min(50, (absVarianceCost / revenue) * 100 * 5);
      wasteDeduction = Math.min(50, (totalWasteCost / revenue) * 100 * 2);
    } else if (totalOpeningStockCost > 0) {
      varianceDeduction = Math.min(50, (absVarianceCost / totalOpeningStockCost) * 100 * 5);
      wasteDeduction = Math.min(50, (totalWasteCost / totalOpeningStockCost) * 100 * 2);
    } else {
      varianceDeduction = absVarianceCost > 0 ? 10 : 0;
      wasteDeduction = totalWasteCost > 0 ? 5 : 0;
    }

    const score = Math.max(0, 100 - varianceDeduction - wasteDeduction);
    let grade = 'A+';
    if (score >= 95) grade = 'A+';
    else if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      wasteCost: totalWasteCost,
      varianceCost: totalVarianceCost,
      score,
      grade
    };
  }, [inventory, closingCounts, wastes, currentShift]);

  // Handle Opening Shop
  const handleOpenShop = async () => {
    const cash = parseFloat(openingCash || '0');
    if (cash < 0 || isNaN(cash)) {
      alert('กรุณากรอกจำนวนเงินสดเริ่มต้นที่ถูกต้อง');
      return;
    }

    const staffMember = branchStaff.find((s: any) => s.id === selectedStaffId);
    if (!staffMember) {
      alert('กรุณาเลือกพนักงานที่ทำหน้าที่นับสต็อก');
      return;
    }
    if (staffMember.pin && staffMember.pin !== selectedStaffPin) {
      alert('รหัส PIN พนักงานไม่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    try {
      const stockArray = Object.entries(openingCounts).map(([ingredientId, actualQty]) => ({
        ingredientId,
        actualQty
      }));

      const res = await fetch(`${API_BASE}/branches/${branch.id}/shift/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          openingCash: cash,
          openedBy: staffMember.name,
          note: openingNote,
          openingStock: stockArray
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'เปิดร้านไม่สำเร็จ');
      }

      setSuccessMsg('เปิดร้านและบันทึกสต็อกเริ่มต้นเรียบร้อยแล้ว!');
      setShowSuccess(true);
      
      // Reset opening inputs
      setOpeningCash('0');
      setSelectedStaffId('');
      setSelectedStaffPin('');
      setOpeningNote('');
      setOpeningCounts({});

      await fetchCurrentShiftAndInventory();
      fetchHistory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  // Handle Closing Shop
  const handleCloseShop = async () => {
    const cash = parseFloat(closingCash || '0');
    if (cash < 0 || isNaN(cash) || closingCash === '') {
      alert('กรุณากรอกจำนวนเงินสดที่นับได้สิ้นวัน');
      return;
    }

    const staffMember = branchStaff.find((s: any) => s.id === selectedCloseStaffId);
    if (!staffMember) {
      alert('กรุณาเลือกพนักงานที่ทำหน้าที่นับสต็อก');
      return;
    }
    if (staffMember.pin && staffMember.pin !== selectedCloseStaffPin) {
      alert('รหัส PIN พนักงานไม่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    try {
      const stockArray = inventory.map(item => {
        const ingredientId = item.ingredientId;
        const actualQty = closingCounts[ingredientId] ?? item.quantity;
        const wasteQty = wastes[ingredientId]?.qty || 0;
        const wasteReason = wastes[ingredientId]?.reason || '';
        return {
          ingredientId,
          actualQty,
          wasteQty,
          wasteReason
        };
      });

      const res = await fetch(`${API_BASE}/shift/${currentShift.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          closingCash: cash,
          closedBy: staffMember.name,
          note: closingNote,
          closingStock: stockArray
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'ปิดร้านไม่สำเร็จ');
      }

      setSuccessMsg('ปิดร้านและบันทึกคะแนนสาขาเรียบร้อยแล้ว!');
      setShowSuccess(true);
      
      // Reset closing inputs
      setClosingCash('');
      setSelectedCloseStaffId('');
      setSelectedCloseStaffPin('');
      setClosingNote('');
      setWastes({});
      setClosingCounts({});

      await fetchCurrentShiftAndInventory();
      fetchHistory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return { text: '#10b981', bg: 'rgba(16,185,129,0.1)', border: '#10b981' };
      case 'B': return { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' };
      case 'C': return { text: '#eab308', bg: 'rgba(234,179,8,0.1)', border: '#eab308' };
      case 'D': return { text: '#f97316', bg: 'rgba(249,115,22,0.1)', border: '#f97316' };
      default: return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: '#ef4444' };
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#fdfaf6] overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-6 md:p-8 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 text-[#7c543c]">
              <div className="w-10 h-10 rounded-2xl bg-[#7c543c]/10 flex items-center justify-center">
                <Layers size={20} />
              </div>
              <div>
                <span className="font-black text-xs uppercase tracking-[0.2em]">Inventory Control</span>
                <span className="text-[10px] bg-amber-100 text-[#7c543c] px-2 py-0.5 rounded-full ml-2 font-bold">{branch?.name}</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight italic">
              Branch Stock Control & P&L Rating
            </h1>
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
            {currentShift ? (
              <>
                <button 
                  onClick={() => setActiveTab('live_tracker')}
                  className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[11px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'live_tracker' ? 'bg-white text-[#7c543c] shadow-sm' : 'text-gray-400'}`}
                >
                  <Activity size={15} /> Live Tracker
                </button>
                <button 
                  onClick={() => setActiveTab('close_shop')}
                  className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[11px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'close_shop' ? 'bg-white text-[#7c543c] shadow-sm' : 'text-gray-400'}`}
                >
                  <Lock size={15} /> Close Shop
                </button>
              </>
            ) : (
              <button 
                onClick={() => setActiveTab('open_shop')}
                className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[11px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'open_shop' ? 'bg-white text-[#7c543c] shadow-sm' : 'text-gray-400'}`}
              >
                <Unlock size={15} /> Open Shop
              </button>
            )}
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[11px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-[#7c543c] shadow-sm' : 'text-gray-400'}`}
            >
              <History size={15} /> Shift History
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6">
        
        {/* Status Alert Banner */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentShift ? 'bg-emerald-500/10 text-emerald-600 animate-pulse' : 'bg-rose-500/10 text-rose-500'}`}>
              {currentShift ? <Activity size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-sm">
                {currentShift ? 'สถานะ: ร้านเปิดอยู่ (Shift Active)' : 'สถานะ: ร้านปิดอยู่ (Shift Closed)'}
              </h2>
              <p className="text-xs font-bold text-gray-400">
                {currentShift 
                  ? `เปิดกะโดย ${currentShift.openedBy || 'System'} เมื่อ ${new Date(currentShift.openedAt).toLocaleString('th-TH')}` 
                  : 'กรุณาเปิดกะเพื่อเริ่มต้นนับยอดขายและตรวจสต็อกร้าน'}
              </p>
            </div>
          </div>
          {currentShift && (
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Live Revenue</span>
              <p className="text-lg font-black text-slate-800">฿{(currentShift.liveTotalRevenue || 0).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Tab 1: Open Shop counting */}
        {activeTab === 'open_shop' && !currentShift && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Ingredient Checklist */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">1. นับวัตถุดิบเปิดร้าน</h3>
                    <p className="text-xs text-gray-400 font-bold">กรอกจำนวนที่นับได้จริงของวัตถุดิบแต่ละรายการ ณ เวลาเปิดร้าน</p>
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="ค้นหาวัตถุดิบ..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 text-xs bg-gray-50 rounded-xl border border-gray-100 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c543c]/10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {paginatedInventory.pageItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-[#7c543c]/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-lg font-black text-slate-400">
                          {item.ingredient.name[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-xs">{item.ingredient.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">ระบบคาดไว้: {item.quantity} {item.ingredient.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-[#7c543c]/10">
                        <input 
                          type="number" 
                          placeholder="0"
                          value={openingCounts[item.ingredientId] ?? ''}
                          onChange={(e) => setOpeningCounts({...openingCounts, [item.ingredientId]: parseFloat(e.target.value) || 0})}
                          className="w-20 bg-transparent text-right font-black text-xs outline-none px-2 text-slate-700"
                        />
                        <span className="text-[10px] font-black text-gray-400 uppercase pr-2">{item.ingredient.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <PaginationControls
                    page={paginatedInventory.page}
                    totalPages={paginatedInventory.totalPages}
                    totalItems={paginatedInventory.totalItems}
                    pageSize={paginatedInventory.pageSize}
                    onPageChange={paginatedInventory.setPage}
                    itemLabel="วัตถุดิบ"
                    variant="neutral"
                  />
                </div>
              </div>
            </div>

            {/* Shift Setup Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-6 space-y-5">
                <h3 className="text-lg font-black text-slate-800">2. ข้อมูลลิ้นชักและผู้บันทึก</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">เงินทอนเริ่มต้น *</label>
                    <div className="relative">
                      <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="number" 
                        value={openingCash}
                        onChange={(e) => setOpeningCash(e.target.value)}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">พนักงานที่ทำหน้าที่นับสต็อก *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select 
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700 appearance-none"
                      >
                        <option value="">-- เลือกพนักงาน --</option>
                        {displayStaff.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role === 'STOCK' ? 'พนักงานสต็อก' : s.role === 'BRANCH_MANAGER' ? 'ผู้จัดการสาขา' : s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">รหัส PIN พนักงาน (4-12 หลัก) *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        value={selectedStaffPin}
                        onChange={(e) => setSelectedStaffPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="กรอก PIN เพื่อยืนยันการนับสต็อก"
                        maxLength={12}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700 tracking-widest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">หมายเหตุเพิ่มเติม</label>
                    <textarea 
                      value={openingNote}
                      onChange={(e) => setOpeningNote(e.target.value)}
                      placeholder="ระบุข้อความ..."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700 h-24"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button 
                    onClick={handleOpenShop}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[#7c543c] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#7c543c]/20 hover:scale-102 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Unlock size={16} />}
                    เปิดกะและบันท็อกสต็อกเริ่มต้น
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Stock Tracker */}
        {activeTab === 'live_tracker' && currentShift && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-6 flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">แผงติดตามความเคลื่อนไหวสต็อกระหว่างกะ (Live Inventory Audit)</h3>
                  <p className="text-xs text-gray-400 font-bold">แสดงสูตรที่หักออกจากการขาย POS และยอดเพิ่มเข้าแบบเรียลไทม์</p>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="ค้นหาวัตถุดิบ..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 text-xs bg-gray-50 rounded-xl border border-gray-100 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c543c]/10"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">วัตถุดิบ</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">เริ่มกะ (นับจริง)</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">รับเข้าสต็อก (+)</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">ตัดจำหน่ายการขาย (-)</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">ตัดขยะ/ปรับปรุง (±)</th>
                      <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">สต็อกระบบปัจจุบัน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveStockData.map((item) => (
                      <tr key={item.id} className="border-b border-gray-55 hover:bg-gray-55/50 transition-colors">
                        <td className="py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                            {item.ingredient.name[0]}
                          </div>
                          <div>
                            <span className="font-black text-slate-800 text-xs block">{item.ingredient.name}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{item.ingredient.unit}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center font-black text-slate-700 text-xs">
                          {item.starting} {item.ingredient.unit}
                        </td>
                        <td className="py-4 text-center font-black text-emerald-600 text-xs">
                          {item.stockIn > 0 ? `+${item.stockIn}` : '0'}
                        </td>
                        <td className="py-4 text-center font-black text-rose-500 text-xs">
                          {item.deductions < 0 ? item.deductions : '0'}
                        </td>
                        <td className="py-4 text-center font-black text-[#7c543c] text-xs">
                          {item.adjustments + item.manualWaste !== 0 ? (item.adjustments + item.manualWaste > 0 ? `+${item.adjustments + item.manualWaste}` : item.adjustments + item.manualWaste) : '0'}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${item.expected <= item.lowStockThreshold ? 'bg-rose-50 text-rose-505' : 'bg-emerald-50 text-emerald-600'}`}>
                            {item.expected} {item.ingredient.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {liveStockData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 italic text-xs">
                          ไม่พบข้อมูลความเคลื่อนไหวสต็อก
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Close Shop counting & P&L Rating */}
        {activeTab === 'close_shop' && currentShift && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Close Count Ingredients list */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">1. ตรวจนับสต็อกสิ้นวัน</h3>
                    <p className="text-xs text-gray-400 font-bold">นับจำนวนคงเหลือจริงบนเชลฟ์ และกรอกของเสียจากการทำกาแฟ/ทำหก (Waste)</p>
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="ค้นหาวัตถุดิบ..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 text-xs bg-gray-50 rounded-xl border border-gray-100 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c543c]/10"
                    />
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {paginatedInventory.pageItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xs font-black text-[#7c543c]">
                            {item.ingredient.name[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-xs">{item.ingredient.name}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">คาดว่าควรมี: {item.quantity} {item.ingredient.unit}</p>
                          </div>
                        </div>
                        
                        {/* Actual count input */}
                        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-[#7c543c]/10">
                          <span className="text-[9px] text-gray-400 font-bold uppercase pl-2">นับจริง:</span>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={closingCounts[item.ingredientId] ?? ''}
                            onChange={(e) => setClosingCounts({...closingCounts, [item.ingredientId]: parseFloat(e.target.value) || 0})}
                            className="w-16 bg-transparent text-right font-black text-xs outline-none px-2 text-slate-700"
                          />
                          <span className="text-[9px] font-black text-gray-300 uppercase pr-2">{item.ingredient.unit}</span>
                        </div>
                      </div>

                      {/* Waste entry */}
                      <div className="flex items-center gap-3 bg-rose-50/20 p-2 rounded-xl border border-rose-100/30">
                        <span className="text-[9px] font-black text-rose-500 shrink-0">แจ้งเสีย (Waste):</span>
                        <input 
                          type="number" 
                          placeholder="จำนวน"
                          value={wastes[item.ingredientId]?.qty ?? ''}
                          onChange={(e) => setWastes({
                            ...wastes, 
                            [item.ingredientId]: { ...wastes[item.ingredientId], qty: parseFloat(e.target.value) || 0, reason: wastes[item.ingredientId]?.reason || '' }
                          })}
                          className="w-16 p-2 bg-white rounded-lg border border-rose-100/50 font-black text-[10px] outline-none text-rose-600 placeholder:text-rose-300"
                        />
                        <input 
                          type="text" 
                          placeholder="เหตุผล (หมดอายุ, หกเลอะ, บูด...)"
                          value={wastes[item.ingredientId]?.reason ?? ''}
                          onChange={(e) => setWastes({
                            ...wastes, 
                            [item.ingredientId]: { ...wastes[item.ingredientId], reason: e.target.value, qty: wastes[item.ingredientId]?.qty || 0 }
                          })}
                          className="flex-1 p-2 bg-white rounded-lg border border-gray-100 font-bold text-[10px] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <PaginationControls
                    page={paginatedInventory.page}
                    totalPages={paginatedInventory.totalPages}
                    totalItems={paginatedInventory.totalItems}
                    pageSize={paginatedInventory.pageSize}
                    onPageChange={paginatedInventory.setPage}
                    itemLabel="วัตถุดิบ"
                    variant="neutral"
                  />
                </div>
              </div>

            </div>

            {/* Preview Rating Score & Submit */}
            <div className="space-y-6">
              
              {/* P&L Performance Circle Score */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-6 text-center space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">คะแนนประสิทธิภาพของร้าน</h3>
                
                {/* Glowing Circle Indicator */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center rounded-full border-8" style={{
                  borderColor: getGradeColor(closingStatsPreview.grade).border,
                  boxShadow: `0 0 20px ${getGradeColor(closingStatsPreview.grade).bg}`,
                  backgroundColor: getGradeColor(closingStatsPreview.grade).bg
                }}>
                  <div className="text-center">
                    <span className="block text-4xl font-black italic tracking-tighter" style={{ color: getGradeColor(closingStatsPreview.grade).text }}>
                      {closingStatsPreview.grade}
                    </span>
                    <span className="text-[10px] font-black text-slate-505 uppercase tracking-widest">
                      {Math.round(closingStatsPreview.score)} คะแนน
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-left">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">มูลค่าเสียหายตัดทิ้ง (Waste):</span>
                    <span className="text-rose-500 font-black">฿{closingStatsPreview.wasteCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">มูลค่าผิดพลาดสูญหาย (Shrinkage):</span>
                    <span className="font-black" style={{ color: closingStatsPreview.varianceCost < 0 ? '#ef4444' : '#10b981' }}>
                      {closingStatsPreview.varianceCost > 0 ? '+' : ''}
                      ฿{closingStatsPreview.varianceCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </span>
                  </div>
                </div>

                <div className="bg-[#fdfaf6] p-3.5 rounded-2xl border border-gray-100 text-[10px] font-bold text-slate-500 text-left flex gap-2">
                  <Sparkles size={14} className="shrink-0 text-amber-500" />
                  <p>
                    {closingStatsPreview.score >= 95 
                      ? 'ประสิทธิภาพยอดเยี่ยมมาก! มีการสูญเสียระหว่างกะที่ต่ำและรักษาต้นทุนได้อย่างเหมาะสม'
                      : closingStatsPreview.score >= 80
                      ? 'เกณฑ์ดี! แนะนำให้ปรับปรุงเรื่องส่วนสูงและสูญเสียน้ำตาล/นมเพิ่มเติมเพื่อต้นทุนที่ดีขึ้น'
                      : 'เกณฑ์ที่ต้องตรวจสอบ! มีความแตกต่างหรือความเสียหายรวมค่อนข้างสูง โปรดตรวจสอบผู้ชงหรือการขโมย'}
                  </p>
                </div>
              </div>

              {/* Drawer & Cash count fields */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-6 space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">2. ข้อมูลปิดกะ & เงินสด</h3>
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">ยอดเงินสดนับจริง *</label>
                  <div className="relative">
                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="number" 
                      value={closingCash}
                      onChange={(e) => setClosingCash(e.target.value)}
                      placeholder="ระบุเงินสดสุทธิในลิ้นชัก..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold block mt-1">
                    ยอดคาดการณ์ในระบบ: ฿{((currentShift?.openingCash || 0) + (currentShift?.liveCashOrdersTotal || 0)).toLocaleString()}
                  </span>
                </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">พนักงานที่ทำหน้าที่นับสต็อก *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select 
                        value={selectedCloseStaffId}
                        onChange={(e) => setSelectedCloseStaffId(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700 appearance-none"
                      >
                        <option value="">-- เลือกพนักงาน --</option>
                        {displayStaff.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role === 'STOCK' ? 'พนักงานสต็อก' : s.role === 'BRANCH_MANAGER' ? 'ผู้จัดการสาขา' : s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">รหัส PIN พนักงาน (4-12 หลัก) *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        value={selectedCloseStaffPin}
                        onChange={(e) => setSelectedCloseStaffPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="กรอก PIN เพื่อยืนยันการนับสต็อก"
                        maxLength={12}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700 tracking-widest"
                      />
                    </div>
                  </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">หมายเหตุการปิดร้าน</label>
                  <textarea 
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                    placeholder="ระบุประเด็นหรือข้อผิดพลาด..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-[#7c543c]/10 text-slate-700 h-20"
                  />
                </div>

                <button 
                  onClick={handleCloseShop}
                  disabled={isSubmitting || !closingCash}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#2d241e] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2d241e]/20 hover:scale-102 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                  ยืนยันปิดกะและบันทึกปิดร้าน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Shift History Reports */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-6 flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-6">ประวัติและคะแนนประสิทธิภาพบริหารสต็อกของสาขา</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">วันและเวลาเปิดร้าน</th>
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">ยอดขายสินค้า</th>
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">ส่วนต่างเงินสด</th>
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">ตัดของเสีย (Waste)</th>
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">ค่าคลาดเคลื่อนสต็อก</th>
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">คะแนนเกรด</th>
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">ดูรายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {historyShifts.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4">
                        <span className="font-black text-slate-800 text-xs block">
                          {new Date(s.openedAt).toLocaleDateString('th-TH', {day:'2-digit', month:'short'})}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold block">
                          {new Date(s.openedAt).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})} - {s.closedAt ? new Date(s.closedAt).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}) : 'กำลังขาย...'}
                        </span>
                      </td>
                      <td className="py-4 font-black text-slate-700 text-xs">
                        ฿{(s.totalRevenue || 0).toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-black text-xs">
                        {s.variance != null ? (
                          <span style={{ color: s.variance === 0 ? '#10b981' : '#ef4444' }}>
                            {s.variance > 0 ? '+' : ''}฿{s.variance.toLocaleString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-4 text-right font-black text-xs text-rose-500">
                        {s.wasteCost != null ? `฿${s.wasteCost.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-4 text-right font-black text-xs">
                        {s.stockVarianceCost != null ? (
                          <span style={{ color: s.stockVarianceCost < 0 ? '#ef4444' : '#10b981' }}>
                            {s.stockVarianceCost > 0 ? '+' : ''}฿{s.stockVarianceCost.toLocaleString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-4 text-center">
                        {s.status === 'OPEN' ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">กำลังเปิดกะ</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black" style={{
                            backgroundColor: getGradeColor(s.stockPerformanceGrade || 'A+').bg,
                            color: getGradeColor(s.stockPerformanceGrade || 'A+').text
                          }}>
                            {s.stockPerformanceGrade || '—'} ({Math.round(s.stockPerformanceScore ?? 100)})
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        <button 
                          onClick={() => setSelectedShift(s)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#7c543c]"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {historyShifts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 italic text-xs">
                        ไม่พบประวัติการเปิด-ปิดร้าน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 size={24} />
            <span className="font-black text-sm uppercase tracking-widest">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shift P&L Detail Modal */}
      <AnimatePresence>
        {selectedShift && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[#2d241e]/75 backdrop-blur-sm" onClick={() => setSelectedShift(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 text-white flex justify-between items-start" style={{ background: 'linear-gradient(135deg, #7c543c, #2d241e)' }}>
                <div>
                  <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Shift Report P&L</span>
                  <h2 className="text-xl md:text-2xl font-black mt-2">
                    สรุปผลต่างและคะแนนประสิทธิภาพสาขา
                  </h2>
                  <p className="text-xs font-bold opacity-80 mt-1">
                    กะวันที่ {new Date(selectedShift.openedAt).toLocaleString('th-TH')} - {selectedShift.closedAt ? new Date(selectedShift.closedAt).toLocaleString('th-TH') : 'เปิดอยู่'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedShift(null)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* Stats Summary Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">ยอดขายกะนี้</span>
                    <p className="text-lg font-black text-slate-800 mt-1">฿{(selectedShift.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">ส่วนต่างเงินสด</span>
                    <p className={`text-lg font-black mt-1 ${selectedShift.variance === 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      ฿{(selectedShift.variance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">มูลค่าเสียตัดทิ้ง</span>
                    <p className="text-lg font-black text-rose-500 mt-1">฿{(selectedShift.wasteCost || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#7c543c]/5 border border-[#7c543c]/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-[#7c543c] uppercase tracking-wide">เกรด P&L</span>
                      <p className="text-lg font-black text-[#7c543c] mt-1">{selectedShift.stockPerformanceGrade || '—'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-gray-400">Score</span>
                      <p className="text-xs font-black text-slate-700">{Math.round(selectedShift.stockPerformanceScore ?? 100)}/100</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients details list */}
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-sm">รายละเอียดความคลาดเคลื่อนสต็อกวัตถุดิบ</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-slate-400 text-[10px] font-black uppercase">
                          <th className="py-2">วัตถุดิบ</th>
                          <th className="py-2 text-center">คาดการณ์</th>
                          <th className="py-2 text-center">นับจริง</th>
                          <th className="py-2 text-center">สูญเสีย (Waste)</th>
                          <th className="py-2 text-center">คลาดเคลื่อน (Variance)</th>
                          <th className="py-2 text-right">มูลค่าสูญเสียสะสม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((selectedShift.closingStock || selectedShift.openingStock) as any[] || []).map((row, index) => {
                          const costPerUnit = row.costPerUnit || 0;
                          return (
                            <tr key={index} className="border-b border-gray-50 text-xs">
                              <td className="py-3 font-bold text-slate-800">
                                {row.name} <span className="text-[9px] text-gray-400">({row.unit})</span>
                              </td>
                              <td className="py-3 text-center text-slate-600 font-bold">
                                {row.expectedQty ?? row.systemQty ?? '—'}
                              </td>
                              <td className="py-3 text-center text-slate-800 font-black">
                                {row.actualQty}
                              </td>
                              <td className="py-3 text-center text-rose-500 font-bold">
                                {row.wasteQty > 0 ? `${row.wasteQty} ${row.wasteReason ? `(${row.wasteReason})` : ''}` : '0'}
                              </td>
                              <td className={`py-3 text-center font-black ${row.variance < 0 ? 'text-rose-500' : (row.variance > 0 ? 'text-emerald-600' : 'text-slate-400')}`}>
                                {row.variance > 0 ? `+${row.variance}` : (row.variance ?? '0')}
                              </td>
                              <td className="py-3 text-right font-black text-slate-700">
                                ฿{((Math.abs(row.variance || 0) + (row.wasteQty || 0)) * costPerUnit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </td>
                            </tr>
                          );
                        })}
                        {(!selectedShift.closingStock && !selectedShift.openingStock) && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-gray-400 italic">
                              ไม่มีประวัติภาพถ่ายสต็อก (Stock snapshots) สำหรับกะนี้
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {selectedShift.note && (
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">หมายเหตุกะ:</span>
                    <p className="text-xs font-bold text-slate-700">{selectedShift.note}</p>
                  </div>
                )}

              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 text-right">
                <button 
                  onClick={() => setSelectedShift(null)}
                  className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
