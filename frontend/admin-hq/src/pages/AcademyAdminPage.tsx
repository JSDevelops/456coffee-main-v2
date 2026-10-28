import { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import {
  GraduationCap,
  Search,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  DollarSign,
  Award,
  Filter,
  Download,
  Calendar,
  AlertCircle,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';

interface AcademyEnrollment {
  id: string;
  studentName: string;
  phone: string;
  lineId: string | null;
  courseTrack: string;
  planStatus: string | null;
  preferredDate: string | null;
  notes: string | null;
  status: string;
  batchNo: number | null;
  adminNotes: string | null;
  createdAt: string;
}

export default function AcademyAdminPage() {
  const [enrollments, setEnrollments] = useState<AcademyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<AcademyEnrollment | null>(null);
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [editBatchNo, setEditBatchNo] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/ecosystem/admin/academy');
      if (res?.data) {
        setEnrollments(res.data);
      }
    } catch (err) {
      console.error('Failed to load academy enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
      );
      await api.patch(`/ecosystem/admin/academy/${id}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchEnrollments();
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedItem) return;
    try {
      setIsUpdating(true);
      await api.patch(`/ecosystem/admin/academy/${selectedItem.id}`, {
        adminNotes: editAdminNotes,
        batchNo: editBatchNo === '' ? null : Number(editBatchNo),
      });
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === selectedItem.id
            ? { ...e, adminNotes: editAdminNotes, batchNo: editBatchNo === '' ? null : Number(editBatchNo) }
            : e,
        ),
      );
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to update notes:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบข้อมูลผู้สมัคร "${name}" ใช่หรือไม่?`)) return;
    try {
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
      await api.delete(`/ecosystem/admin/academy/${id}`);
    } catch (err) {
      console.error('Failed to delete:', err);
      fetchEnrollments();
    }
  };

  const filtered = useMemo(() => {
    return enrollments.filter((item) => {
      const matchSearch =
        !search ||
        item.studentName.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.includes(search) ||
        (item.lineId && item.lineId.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchCourse = courseFilter === 'ALL' || item.courseTrack === courseFilter;

      return matchSearch && matchStatus && matchCourse;
    });
  }, [enrollments, search, statusFilter, courseFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = enrollments.length;
    const pending = enrollments.filter((e) => e.status === 'PENDING').length;
    const confirmed = enrollments.filter((e) => ['CONFIRMED', 'PAID'].includes(e.status)).length;
    const completed = enrollments.filter((e) => e.status === 'COMPLETED').length;
    return { total, pending, confirmed, completed };
  }, [enrollments]);

  const exportCSV = () => {
    const headers = ['วันที่สมัคร', 'ชื่อ-นามสกุล', 'เบอร์โทร', 'LINE ID', 'หลักสูตร', 'สถานะ', 'รุ่นที่', 'บันทึก'];
    const rows = filtered.map((e) => [
      new Date(e.createdAt).toLocaleDateString('th-TH'),
      `"${e.studentName}"`,
      `"${e.phone}"`,
      `"${e.lineId || '-'}"`,
      `"${e.courseTrack}"`,
      `"${e.status}"`,
      e.batchNo || '-',
      `"${e.adminNotes || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `456_Academy_Enrollments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCourseBadge = (track: string) => {
    switch (track) {
      case 'BARISTA_PRO':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">☕ บาริสต้ามืออาชีพ</span>;
      case 'CAFE_MANAGEMENT':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">📊 บริหารจัดการคาเฟ่</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">⭐ เปิดร้านครบวงจร (Complete)</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 animate-pulse">รอติดต่อ</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">ติดต่อแล้ว</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400">ยืนยันรอบแล้ว</span>;
      case 'PAID':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">ชำระเงินแล้ว</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400">จบหลักสูตร 🎓</span>;
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F59E0B] flex items-center justify-center text-white shadow-md">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
                456 Coffee Academy
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                ระบบบริหารจัดการผู้สมัครเรียนหลักสูตรบาริสต้า & บริหารจัดการร้านคาเฟ่
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEnrollments}
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
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>ผู้สมัครทั้งหมด</span>
            <Users size={16} className="text-[#EA580C]" />
          </div>
          <div className="text-2xl font-bold mt-2" style={{ color: 'var(--text)' }}>
            {stats.total} <span className="text-xs font-normal text-[var(--muted)]">ท่าน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-500">รอติดต่อกลับ</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-500">
            {stats.pending} <span className="text-xs font-normal text-[var(--muted)]">ท่าน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-500">ยืนยัน / ชำระแล้ว</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-500">
            {stats.confirmed} <span className="text-xs font-normal text-[var(--muted)]">ท่าน</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-500">จบหลักสูตรแล้ว</span>
            <Award size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-purple-500">
            {stats.completed} <span className="text-xs font-normal text-[var(--muted)]">ท่าน</span>
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
              placeholder="ค้นหาชื่อ, เบอร์โทร, หรือ LINE ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs sm:text-sm outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs sm:text-sm outline-none"
            >
              <option value="ALL">ทุกลักสูตร</option>
              <option value="COMPLETE_SOLUTION">⭐ เปิดร้านครบวงจร (Complete Solution)</option>
              <option value="BARISTA_PRO">☕ บาริสต้ามืออาชีพ</option>
              <option value="CAFE_MANAGEMENT">📊 บริหารจัดการคาเฟ่</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs sm:text-sm outline-none"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PENDING">รอติดต่อ</option>
              <option value="CONTACTED">ติดต่อแล้ว</option>
              <option value="CONFIRMED">ยืนยันรอบแล้ว</option>
              <option value="PAID">ชำระเงินแล้ว</option>
              <option value="COMPLETED">จบหลักสูตร</option>
              <option value="CANCELLED">ยกเลิก</option>
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
                <th className="p-3.5 font-bold">ผู้สมัครเรียน</th>
                <th className="p-3.5 font-bold">ติดต่อ</th>
                <th className="p-3.5 font-bold">หลักสูตร</th>
                <th className="p-3.5 font-bold">ช่วงเวลา / แผนเปิดร้าน</th>
                <th className="p-3.5 font-bold">สถานะ</th>
                <th className="p-3.5 font-bold">รุ่น</th>
                <th className="p-3.5 font-bold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--muted)]">
                    กำลังโหลดข้อมูลผู้สมัคร...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--muted)]">
                    ไม่พบข้อมูลผู้สมัครเรียนตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    {/* Name */}
                    <td className="p-3.5">
                      <div className="font-bold" style={{ color: 'var(--text)' }}>
                        {item.studentName}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        สมัครเมื่อ: {new Date(item.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </td>

                    {/* Contact Buttons */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone size={13} className="text-[#EA580C]" />
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

                    {/* Course */}
                    <td className="p-3.5">{getCourseBadge(item.courseTrack)}</td>

                    {/* Dates & Plan */}
                    <td className="p-3.5">
                      <div className="text-xs text-[var(--text)]">
                        {item.preferredDate || 'ไม่ระบุวันที่'}
                      </div>
                      {item.planStatus && (
                        <div className="text-[11px] text-[var(--muted)]">
                          {item.planStatus === 'ready_location'
                            ? '📍 มีทำเลพร้อม'
                            : item.planStatus === 'planning'
                            ? '🗓️ วางแผนเปิดร้าน'
                            : '☕ พัฒนาทักษะ'}
                        </div>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-3.5">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs font-semibold bg-[var(--surface-hover)] outline-none"
                      >
                        <option value="PENDING">รอติดต่อ</option>
                        <option value="CONTACTED">ติดต่อแล้ว</option>
                        <option value="CONFIRMED">ยืนยันรอบ</option>
                        <option value="PAID">ชำระเงินแล้ว</option>
                        <option value="COMPLETED">จบหลักสูตร</option>
                        <option value="CANCELLED">ยกเลิก</option>
                      </select>
                    </td>

                    {/* Batch No */}
                    <td className="p-3.5">
                      <span className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                        {item.batchNo ? `รุ่น ${item.batchNo}` : '-'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setEditAdminNotes(item.adminNotes || '');
                            setEditBatchNo(item.batchNo || '');
                          }}
                          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-blue-400"
                          title="แก้ไขบันทึก / ระบุรุ่น"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id, item.studentName)}
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

      {/* Edit Notes Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] p-6 shadow-2xl space-y-4" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                บันทึกข้อมูลผู้เรียน: {selectedItem.studentName}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-[var(--muted)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>
                  รุ่นที่เข้าอบรม (Batch Number)
                </label>
                <input
                  type="number"
                  placeholder="เช่น 1, 2, 3"
                  value={editBatchNo}
                  onChange={(e) => setEditBatchNo(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>
                  บันทึกเพิ่มเติมของแอดมิน / ผู้สอน
                </label>
                <textarea
                  rows={4}
                  placeholder="เช่น โทรคอนเฟิร์มแล้ว นัดเรียนวันเสาร์ที่ 15, โอนเงินมัดจำแล้ว..."
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#EA580C] hover:bg-[#D94E06] disabled:opacity-50"
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
