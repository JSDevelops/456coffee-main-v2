import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell, Plus, Pencil, Trash2, X, Check, Loader2,
  AlertCircle, Search, BookOpen, Sparkles, Pin,
  Volume2, CheckSquare, Square, Link
} from 'lucide-react';
import { api } from '../api';

type AnnouncementType = 'TRAINING' | 'COURSE' | 'EVENT' | 'GENERAL';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  targetBranches: string[];
  targetAudience?: string;
  pinned: boolean;
  startDate?: string | null;
  endDate?: string | null;
  responseUrl?: string | null;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
}

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: any; color: string; bg: string; border: string }> = {
  TRAINING: { label: 'อบรมพนักงาน', icon: BookOpen, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' },
  COURSE: { label: 'หลักสูตรสูตรอาหาร', icon: BookOpen, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' },
  EVENT: { label: 'อีเวนต์ / กิจกรรม', icon: Sparkles, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)' },
  GENERAL: { label: 'ประกาศทั่วไป', icon: Bell, color: '#7c543c', bg: 'rgba(124, 84, 60, 0.08)', border: 'rgba(124, 84, 60, 0.2)' },
};

const EMPTY_FORM = {
  title: '',
  content: '',
  type: 'GENERAL' as AnnouncementType,
  targetBranches: ['ALL'] as string[],
  targetAudience: 'MANAGER',
  pinned: false,
  startDate: '',
  endDate: '',
  responseUrl: '',
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [annList, branchList] = await Promise.all([
        api.get<Announcement[]>('/announcements'),
        api.get<Branch[]>('/branches'),
      ]);
      setAnnouncements(Array.isArray(annList) ? annList : []);
      setBranches(Array.isArray(branchList) ? branchList : []);
    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถดึงข้อมูลข่าวสารได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      const matchesSearch = 
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || ann.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [announcements, searchQuery, typeFilter]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(ann: Announcement) {
    setForm({
      title: ann.title,
      content: ann.content,
      type: ann.type,
      targetBranches: ann.targetBranches || ['ALL'],
      targetAudience: ann.targetAudience || 'MANAGER',
      pinned: ann.pinned,
      startDate: ann.startDate || '',
      endDate: ann.endDate || '',
      responseUrl: ann.responseUrl || '',
    });
    setEditingId(ann.id);
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('กรุณาระบุหัวข้อประกาศ'); return; }
    if (!form.content.trim()) { setError('กรุณาระบุรายละเอียดประกาศ'); return; }
    if (form.targetAudience === 'MANAGER' && form.targetBranches.length === 0) { setError('กรุณาเลือกอย่างน้อยหนึ่งสาขา หรือเลือกทุกสาขา'); return; }

    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        targetBranches: form.targetAudience === 'CUSTOMER' ? ['ALL'] : form.targetBranches,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        responseUrl: form.responseUrl || null,
      };

      const url = editingId ? `/announcements/${editingId}` : '/announcements';

      if (editingId) {
        await api.put(url, body);
      } else {
        await api.post(url, body);
      }

      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || 'เกิดข้อผิดพลาดในการบันทึกประกาศ');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันที่จะลบประกาศนี้?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      await load();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบประกาศได้');
    }
  }

  function toggleBranchSelection(branchId: string) {
    setForm(f => {
      let targets = [...f.targetBranches];
      if (branchId === 'ALL') {
        if (targets.includes('ALL')) {
          targets = [];
        } else {
          targets = ['ALL'];
        }
      } else {
        // If ALL was selected, remove it when clicking a specific branch
        targets = targets.filter(x => x !== 'ALL');
        if (targets.includes(branchId)) {
          targets = targets.filter(x => x !== branchId);
        } else {
          targets.push(branchId);
        }
        // If targets contain all branch ids, switch to ALL
        if (targets.length === branches.length) {
          targets = ['ALL'];
        }
      }
      return { ...f, targetBranches: targets };
    });
  }

  function getBranchNamesString(targetList: string[]) {
    if (targetList.includes('ALL')) return 'ทุกสาขา';
    return targetList
      .map(id => branches.find(b => b.id === id)?.name || id)
      .join(', ');
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            ประกาศ & แจ้งข่าวสารสาขา
          </h1>
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            ส่งข้อความ ประกาศอบรม หลักสูตร กิจกรรม ไปยังผู้จัดการสาขา
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider uppercase inline-flex items-center gap-2 text-white transition-transform active:scale-95"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={16} /> สร้างประกาศใหม่
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-3xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหาประกาศตามหัวข้อ หรือเนื้อหา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', focusRingColor: 'var(--accent)' }}
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTypeFilter('ALL')}
            className="px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-colors shrink-0"
            style={{
              background: typeFilter === 'ALL' ? 'var(--accent)' : 'var(--surface)',
              color: typeFilter === 'ALL' ? 'white' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            ทั้งหมด
          </button>
          {(['TRAINING', 'COURSE', 'EVENT', 'GENERAL'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-colors shrink-0"
              style={{
                background: typeFilter === type ? TYPE_CONFIG[type].color : 'var(--surface)',
                color: typeFilter === type ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {TYPE_CONFIG[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-3xl bg-white/50 animate-pulse" style={{ border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-white/20 border border-dashed border-[#ece5da]">
          <AlertCircle size={32} className="mx-auto" style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
            ยังไม่มีรายการประกาศในระบบ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnnouncements.map(ann => {
            const config = TYPE_CONFIG[ann.type] || TYPE_CONFIG.GENERAL;
            const Icon = config.icon;
            return (
              <div
                key={ann.id}
                className="relative rounded-3xl p-5 flex flex-col justify-between transition-all hover:shadow-md"
                style={{
                  background: 'var(--surface)',
                  border: ann.pinned ? `2.5px solid #f59e0b` : `1px solid var(--border)`,
                }}
              >
                {/* Pinned Badge */}
                {ann.pinned && (
                  <div className="absolute -top-3 right-5 bg-[#f59e0b] text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Pin size={10} /> สำคัญ / ปักหมุด
                  </div>
                )}

                <div className="space-y-3">
                  {/* Category and date row */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                        style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                      >
                        <Icon size={12} />
                        {config.label}
                      </span>
                      {ann.targetAudience === 'CUSTOMER' ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-pink-50 text-pink-600 border border-pink-100">
                          ลูกค้า
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                          ผู้จัดการสาขา
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-faint)' }}>
                      {new Date(ann.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black leading-snug line-clamp-1" style={{ color: 'var(--text)' }}>
                    {ann.title}
                  </h3>

                  {/* Content snippet */}
                  <p className="text-xs font-bold leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                    {ann.content}
                  </p>

                  {/* Target branches */}
                  {ann.targetAudience !== 'CUSTOMER' && (
                    <div className="pt-2 text-[10px] font-bold" style={{ color: 'var(--text-faint)' }}>
                      <span className="text-gray-400">กลุ่มสาขาเป้าหมาย: </span>
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        {getBranchNamesString(ann.targetBranches)}
                      </span>
                    </div>
                  )}

                  {/* Event range dates if specified */}
                  {(ann.startDate || ann.endDate) && (
                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                      <Sparkles size={11} className="shrink-0" />
                      <span>วันที่จัด: </span>
                      <span>
                        {ann.startDate ? new Date(ann.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—'}
                        {ann.endDate && ann.endDate !== ann.startDate ? ` - ${new Date(ann.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}` : ''}
                      </span>
                    </div>
                  )}

                  {ann.responseUrl && (
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 truncate">
                      <Link size={11} className="shrink-0" />
                      <span className="shrink-0">ลิ้งค์ตอบรับ: </span>
                      <a href={ann.responseUrl} target="_blank" rel="noreferrer" className="underline truncate hover:text-emerald-800 flex-1">
                        {ann.responseUrl}
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions bottom row */}
                <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => openEdit(ann)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100 text-gray-500"
                    style={{ border: '1px solid var(--border)' }}
                    title="แก้ไขประกาศ"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-red-50 text-red-500"
                    style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    title="ลบประกาศ"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--surface)' }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  {editingId ? 'แก้ไขรายละเอียดประกาศ' : 'สร้างประกาศและข่าวสารใหม่'}
                </h2>
                <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                  ประกาศนี้จะส่งไปยังแดชบอร์ดผู้จัดการสาขาที่ระบุทันที
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Fields */}
            <div className="space-y-4 text-xs font-bold">
              {/* Title, Audience, & Type */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label style={{ color: 'var(--text-muted)' }}>หัวข้อประกาศ *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="เช่น ด่วน! อบรมสูตรบาริสต้าใหม่ประจำเดือน"
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="space-y-1">
                  <label style={{ color: 'var(--text-muted)' }}>กลุ่มเป้าหมาย</label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                  >
                    <option value="MANAGER">ผู้จัดการสาขา</option>
                    <option value="CUSTOMER">ลูกค้า (ข่าวสาร/โปรโมชั่น)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label style={{ color: 'var(--text-muted)' }}>ประเภทประกาศ</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as AnnouncementType })}
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                  >
                    <option value="GENERAL">ประกาศทั่วไป</option>
                    <option value="TRAINING">อบรมพนักงาน</option>
                    <option value="COURSE">หลักสูตรสูตรอาหาร</option>
                    <option value="EVENT">อีเวนต์ / กิจกรรม</option>
                  </select>
                </div>
              </div>

              {/* Content text */}
              <div className="space-y-1">
                <label style={{ color: 'var(--text-muted)' }}>รายละเอียดประกาศ *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="กรอกรายละเอียดข่าวสาร ลิงก์อบรม เอกสารแนบ หรือตารางเวลา..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl border focus:outline-none font-medium"
                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                />
              </div>

              {/* Target branches */}
              {form.targetAudience === 'MANAGER' && (
                <div className="space-y-2">
                  <label style={{ color: 'var(--text-muted)' }}>สาขาที่ต้องการส่งถึง *</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                    <button
                      type="button"
                      onClick={() => toggleBranchSelection('ALL')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                      style={{
                        background: form.targetBranches.includes('ALL') ? 'var(--accent)' : 'var(--surface)',
                        color: form.targetBranches.includes('ALL') ? 'white' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {form.targetBranches.includes('ALL') ? <CheckSquare size={13} /> : <Square size={13} />}
                      ทุกสาขา
                    </button>
                    {branches.map(b => {
                      const isSelected = form.targetBranches.includes(b.id) || form.targetBranches.includes('ALL');
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBranchSelection(b.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
                          style={{
                            background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                            color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                            border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                          }}
                        >
                          {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Response URL Link */}
              <div className="space-y-1">
                <label style={{ color: 'var(--text-muted)' }}>ลิ้งค์ตอบรับ / สมัคร (URL) (ถ้ามี)</label>
                <input
                  type="url"
                  value={form.responseUrl}
                  onChange={(e) => setForm({ ...form, responseUrl: e.target.value })}
                  placeholder="เช่น https://forms.gle/... หรือลิ้งค์ลงทะเบียนอื่นๆ"
                  className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                />
              </div>

              {/* Event Dates & Pinned */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label style={{ color: 'var(--text-muted)' }}>วันที่เริ่มกิจกรรม (ถ้ามี)</label>
                  <input
                    type="date"
                    value={form.startDate || ''}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="space-y-1">
                  <label style={{ color: 'var(--text-muted)' }}>วันที่สิ้นสุด (ถ้ามี)</label>
                  <input
                    type="date"
                    value={form.endDate || ''}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="flex items-center h-11">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.pinned}
                      onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                      className="w-4.5 h-4.5 rounded accent-amber-500"
                    />
                    <span className="text-amber-800 flex items-center gap-1">
                      <Pin size={13} className="rotate-45" /> ปักหมุดประกาศสำคัญไว้บนสุด
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions bottom */}
            <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border font-bold text-xs"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-white font-black text-xs inline-flex items-center gap-1.5"
                style={{ background: 'var(--accent)' }}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> บันทึก...
                  </>
                ) : (
                  <>
                    <Check size={14} /> บันทึกประกาศ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
