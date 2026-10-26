import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

export interface ExportDropdownProps {
  onExport: (format: 'xlsx' | 'csv') => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  align?: 'left' | 'right';
  className?: string;
}

export function ExportDropdown({
  onExport,
  loading = false,
  disabled = false,
  label = 'ส่งออก',
  align = 'right',
  className = '',
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (format: 'xlsx' | 'csv') => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer select-none"
        style={{
          background: 'var(--surface-2)',
          color: disabled || loading ? 'var(--text-faint)' : 'var(--text-2)',
          border: '1px solid var(--border)',
          opacity: disabled ? 0.6 : 1,
        }}
        title="ส่งออกรายงาน (Excel / CSV)"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin text-amber-500" />
        ) : (
          <Download size={14} />
        )}
        <span>{label}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full mt-1.5 w-52 rounded-xl shadow-xl overflow-hidden z-40 ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 30px -4px rgba(0,0,0,0.25)',
            }}
          >
            <button
              type="button"
              onClick={() => handleSelect('xlsx')}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-medium text-left transition-colors hover:bg-emerald-500/10 cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}
              >
                <FileSpreadsheet size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: 'var(--text)' }}>
                  ส่งออก Excel (.xlsx)
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                  เปิดด้วย MS Excel ได้ทันที
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('csv')}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-medium text-left transition-colors hover:bg-blue-500/10 border-t cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}
              >
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: 'var(--text)' }}>
                  ส่งออก CSV (.csv)
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                  รองรับ UTF-8 ภาษาไทยสมบูรณ์
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
