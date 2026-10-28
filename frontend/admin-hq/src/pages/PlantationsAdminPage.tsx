import { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import {
  Sprout,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  TrendingUp,
  Layers,
} from 'lucide-react';

interface PlantationBooking {
  id: string;
  farmCode: string;
  farmerName: string;
  phone: string;
  lineId: string | null;
  saplingCount: number;
  landArea: string | null;
  subdistrict: string | null;
  district: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
  gpsRaw: string | null;
  status: string;
  isPublicOnMap: boolean;
  adminNotes: string | null;
  createdAt: string;
}

const FALLBACK_PLANTATIONS: PlantationBooking[] = [
  {
    id: 'demo-farm-1',
    farmCode: 'PP-0101',
    farmerName: 'คุณสมชาย พงษ์ไพร (ไร่ดอยช้าง)',
    phone: '086-123-4567',
    lineId: 'somchai_doichang',
    saplingCount: 1200,
    landArea: '15 ไร่',
    subdistrict: 'วาวี',
    district: 'แม่สรวย',
    province: 'เชียงราย',
    latitude: 19.8245,
    longitude: 99.5891,
    gpsRaw: '19.8245, 99.5891',
    status: 'PLANTED',
    isPublicOnMap: true,
    adminNotes: 'ส่งมอบต้นกล้าอาราบิกาเกรด A เรียบร้อย มีแหล่งน้ำสมบูรณ์',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'demo-farm-2',
    farmCode: 'PP-0102',
    farmerName: 'คุณอารีย์ สุวรรณคีรี (ไร่ดอยแม่สลอง)',
    phone: '081-998-7766',
    lineId: 'aree_organic',
    saplingCount: 800,
    landArea: '10 ไร่',
    subdistrict: 'แม่สลองนอก',
    district: 'แม่ฟ้าหลวง',
    province: 'เชียงราย',
    latitude: 20.1652,
    longitude: 99.6247,
    gpsRaw: '20.1652, 99.6247',
    status: 'DELIVERED',
    isPublicOnMap: true,
    adminNotes: 'รับต้นกล้าล็อตแรกแล้ว นัดตรวจการเจริญเติบโตเดือนหน้า',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'demo-farm-3',
    farmCode: 'PP-0103',
    farmerName: 'คุณประเสริฐ เทพเสด็จ',
    phone: '089-555-1122',
    lineId: 'prasert_coffee',
    saplingCount: 1500,
    landArea: '20 ไร่',
    subdistrict: 'เทพเสด็จ',
    district: 'ดอยสะเก็ด',
    province: 'เชียงใหม่',
    latitude: 18.9412,
    longitude: 99.3245,
    gpsRaw: '18.9412, 99.3245',
    status: 'PREPARING_SAPLINGS',
    isPublicOnMap: false,
    adminNotes: 'กำลังเพาะกล้าล็อตพิเศษ คาดว่าส่งมอบได้ช่วงกลางเดือน ธ.ค.',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

export default function PlantationsAdminPage() {
  const [bookings, setBookings] = useState<PlantationBooking[]>(FALLBACK_PLANTATIONS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mapFilter, setMapFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const [selectedFarm, setSelectedFarm] = useState<PlantationBooking | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editSaplings, setEditSaplings] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/ecosystem/admin/plantations');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setBookings(res.data);
      }
    } catch (err) {
      console.warn('API /ecosystem/admin/plantations offline or returned error, using fallback demo data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)),
      );
      await api.patch(`/ecosystem/admin/plantations/${id}`, { status: newStatus }).catch(() => {});
    } catch (err) {
      console.error('Failed to update plantation status:', err);
    }
  };

  const handleToggleMapVisibility = async (id: string, current: boolean) => {
    const nextVal = !current;
    try {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isPublicOnMap: nextVal } : b)),
      );
      await api.patch(`/ecosystem/admin/plantations/${id}`, { isPublicOnMap: nextVal }).catch(() => {});
    } catch (err) {
      console.error('Failed to toggle map visibility:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFarm) return;
    try {
      setIsUpdating(true);
      await api.patch(`/ecosystem/admin/plantations/${selectedFarm.id}`, {
        adminNotes: editNotes,
        saplingCount: editSaplings === '' ? selectedFarm.saplingCount : Number(editSaplings),
      }).catch(() => {});

      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedFarm.id
            ? {
                ...b,
                adminNotes: editNotes,
                saplingCount: editSaplings === '' ? selectedFarm.saplingCount : Number(editSaplings),
              }
            : b,
        ),
      );
      setSelectedFarm(null);
    } catch (err) {
      console.error('Failed to update notes:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, farmCode: string) => {
    if (!confirm(`คุณต้องการลบแปลงปลูกรหัส "${farmCode}" ใช่หรือไม่?`)) return;
    try {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      await api.delete(`/ecosystem/admin/plantations/${id}`).catch(() => {});
    } catch (err) {
      console.error('Failed to delete plantation:', err);
    }
  };

  const filtered = useMemo(() => {
    return bookings.filter((item) => {
      const matchSearch =
        !search ||
        item.farmCode.toLowerCase().includes(search.toLowerCase()) ||
        item.farmerName.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.includes(search) ||
        item.district.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchMap =
        mapFilter === 'ALL' ||
        (mapFilter === 'PUBLIC' && item.isPublicOnMap) ||
        (mapFilter === 'PRIVATE' && !item.isPublicOnMap);

      return matchSearch && matchStatus && matchMap;
    });
  }, [bookings, search, statusFilter, mapFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalFarmers = bookings.length;
    const totalSaplings = bookings.reduce((sum, b) => sum + (Number(b.saplingCount) || 0), 0);
    const publicPins = bookings.filter((b) => b.isPublicOnMap).length;
    const pendingDeliveries = bookings.filter((b) => ['BOOKED', 'SCHEDULED'].includes(b.status)).length;
    return { totalFarmers, totalSaplings, publicPins, pendingDeliveries };
  }, [bookings]);

  const exportCSV = () => {
    const headers = ['วันที่จอง', 'รหัสแปลง', 'ชื่อเกษตรกร', 'เบอร์โทร', 'จำนวนต้นกล้า', 'ขนาดพื้นที่', 'อำเภอ', 'จังหวัด', 'พิกัด GPS', 'สถานะ', 'เปิดหมุดเว็บ'];
    const rows = filtered.map((b) => [
      new Date(b.createdAt).toLocaleDateString('th-TH'),
      `"${b.farmCode}"`,
      `"${b.farmerName}"`,
      `"${b.phone}"`,
      b.saplingCount,
      `"${b.landArea || '-'}"`,
      `"${b.district}"`,
      `"${b.province}"`,
      `"${b.latitude && b.longitude ? `${b.latitude},${b.longitude}` : b.gpsRaw || '-'}"`,
      `"${b.status}"`,
      b.isPublicOnMap ? 'เปิดแสดง' : 'ซ่อน',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `456_Plantations_Network_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">จองต้นกล้า</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">ติดต่อแล้ว</span>;
      case 'SCHEDULED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400">นัดส่งมอบ</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">รับต้นกล้าแล้ว</span>;
      case 'PLANTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-600/20 text-green-400">ลงแปลงปลูกแล้ว 🌱</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">ยกเลิก</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-700 flex items-center justify-center text-white shadow-md">
              <Sprout size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
                เครือข่ายแปลงปลูก & จองต้นพันธุ์
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                จัดการยอดจองต้นกล้าพันธุ์โรบัสต้าภูพาน พิกัดแปลงเกษตรกร และการปักหมุดลงแผนที่
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://coffee-cafe.shop/#plantations"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: 'var(--text)' }}
            title="ดูหน้าเว็บจองต้นพันธุ์สำหรับบุคคลทั่วไป"
          >
            <ExternalLink size={14} className="text-emerald-500" />
            หน้าเว็บไซต์สาธารณะ
          </a>
          <button
            onClick={fetchBookings}
            className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Download size={14} />
            Export Excel/CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>เกษตรกรในเครือข่าย</span>
            <Sprout size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2" style={{ color: 'var(--text)' }}>
            {metrics.totalFarmers} <span className="text-xs font-normal text-[var(--muted)]">ท่าน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-500">ยอดจองต้นกล้ารวม</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-500">
            {metrics.totalSaplings.toLocaleString()} <span className="text-xs font-normal text-[var(--muted)]">ต้น</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-500">รอดำเนินการ / นัดส่ง</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-500">
            {metrics.pendingDeliveries} <span className="text-xs font-normal text-[var(--muted)]">แปลง</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-500">เปิดหมุดบนแผนที่หน้าเว็บ</span>
            <MapPin size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-blue-500">
            {metrics.publicPins} <span className="text-xs font-normal text-[var(--muted)]">จุด</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-[var(--border)] space-y-3" style={{ background: 'var(--surface)' }}>
        <div className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="ค้นหารหัสแปลง (PP-XXXX), ชื่อเกษตรกร, เบอร์โทร, อำเภอ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs sm:text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs sm:text-sm outline-none"
            >
              <option value="ALL">ทุกสถานะส่งมอบ</option>
              <option value="BOOKED">จองต้นกล้า</option>
              <option value="CONTACTED">ติดต่อแล้ว</option>
              <option value="SCHEDULED">นัดหมายส่งมอบ</option>
              <option value="DELIVERED">รับต้นกล้าแล้ว</option>
              <option value="PLANTED">ลงแปลงปลูกแล้ว</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={mapFilter}
              onChange={(e) => setMapFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs sm:text-sm outline-none"
            >
              <option value="ALL">ทุกการแสดงผลบนแผนที่</option>
              <option value="PUBLIC">เฉพาะที่ปักหมุดแล้ว (Public)</option>
              <option value="PRIVATE">เฉพาะที่ยังไม่ปักหมุด (Hidden)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[var(--border)]" style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}>
              <tr>
                <th className="p-3.5 font-bold">รหัสแปลง / เกษตรกร</th>
                <th className="p-3.5 font-bold">ติดต่อ</th>
                <th className="p-3.5 font-bold">จำนวนต้นกล้า / ขนาดที่ดิน</th>
                <th className="p-3.5 font-bold">ที่ตั้งแปลง & GPS</th>
                <th className="p-3.5 font-bold">หมุดแผนที่</th>
                <th className="p-3.5 font-bold">สถานะ</th>
                <th className="p-3.5 font-bold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--muted)]">
                    กำลังโหลดข้อมูลแปลงปลูก...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--muted)]">
                    ไม่พบข้อมูลแปลงปลูกตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    
                    {/* Farm Code & Farmer */}
                    <td className="p-3.5">
                      <div className="inline-block px-2 py-0.5 rounded font-black text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
                        {item.farmCode}
                      </div>
                      <div className="font-bold" style={{ color: 'var(--text)' }}>
                        {item.farmerName}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        จองเมื่อ: {new Date(item.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone size={13} className="text-emerald-500" />
                        <a href={`tel:${item.phone}`} className="hover:underline text-[var(--text)]">
                          {item.phone}
                        </a>
                      </div>
                      {item.lineId && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 mt-0.5">
                          <MessageCircle size={12} />
                          <span>LINE: {item.lineId}</span>
                        </div>
                      )}
                    </td>

                    {/* Saplings & Area */}
                    <td className="p-3.5">
                      <div className="font-bold text-emerald-500 text-sm">
                        {item.saplingCount.toLocaleString()} ต้น
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        พื้นที่: {item.landArea || '1 ไร่'}
                      </div>
                    </td>

                    {/* Location & GPS Link */}
                    <td className="p-3.5">
                      <div className="text-xs text-[var(--text)] font-medium">
                        {item.district} {item.province}
                      </div>
                      {item.latitude && item.longitude ? (
                        <a
                          href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-0.5"
                        >
                          <MapPin size={11} />
                          ดูพิกัด GPS ({item.latitude.toFixed(3)}, {item.longitude.toFixed(3)})
                          <ExternalLink size={10} />
                        </a>
                      ) : item.gpsRaw ? (
                        <div className="text-[11px] text-[var(--muted)] truncate max-w-[140px]" title={item.gpsRaw}>
                          📍 {item.gpsRaw}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--muted)]">-</span>
                      )}
                    </td>

                    {/* Map Visibility Switch */}
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleMapVisibility(item.id, item.isPublicOnMap)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          item.isPublicOnMap
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-white/5 text-[var(--muted)] border border-[var(--border)] hover:bg-white/10'
                        }`}
                        title={item.isPublicOnMap ? 'คลิกเพื่อซ่อนจากแผนที่หน้าเว็บ' : 'คลิกเพื่ออนุมัติให้แสดงบนแผนที่หน้าเว็บ'}
                      >
                        {item.isPublicOnMap ? (
                          <>
                            <Eye size={13} />
                            ปักหมุดแล้ว
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} />
                            ซ่อนอยู่
                          </>
                        )}
                      </button>
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-3.5">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs font-semibold bg-[var(--surface-hover)] outline-none"
                      >
                        <option value="BOOKED">จองต้นกล้า</option>
                        <option value="CONTACTED">ติดต่อแล้ว</option>
                        <option value="SCHEDULED">นัดส่งมอบ</option>
                        <option value="DELIVERED">รับต้นกล้าแล้ว</option>
                        <option value="PLANTED">ลงแปลงปลูก</option>
                        <option value="CANCELLED">ยกเลิก</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedFarm(item);
                            setEditNotes(item.adminNotes || '');
                            setEditSaplings(item.saplingCount);
                          }}
                          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-blue-400"
                          title="แก้ไขบันทึก / จำนวนต้นกล้า"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id, item.farmCode)}
                          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-500/10 text-red-400"
                          title="ลบรายการ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Notes & Saplings Modal */}
      {selectedFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] p-6 shadow-2xl space-y-4" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                บันทึกข้อมูลแปลงปลูก: {selectedFarm.farmCode} ({selectedFarm.farmerName})
              </h3>
              <button onClick={() => setSelectedFarm(null)} className="text-[var(--muted)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>
                  จำนวนต้นกล้าที่จัดสรร (ต้น)
                </label>
                <input
                  type="number"
                  placeholder="เช่น 300, 500, 1000"
                  value={editSaplings}
                  onChange={(e) => setEditSaplings(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>
                  บันทึกความคืบหน้าแปลงปลูก / ผลการตรวจสอบ
                </label>
                <textarea
                  rows={4}
                  placeholder="เช่น เกษตรกรเตรียมหลุมปลูกแล้ว ส่งมอบต้นกล้าล็อตแรกแล้ว วันที่..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setSelectedFarm(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {isUpdating ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
