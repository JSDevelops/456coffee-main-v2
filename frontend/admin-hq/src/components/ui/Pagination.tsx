import { Select } from './Select';
import type { ReactNode } from 'react';

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPagesFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'รายการ',
  className = '',
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
  className?: string;
}) {
  const totalPages = totalPagesFor(total, pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const startPage = Math.min(Math.max(1, safePage - 2), Math.max(1, totalPages - 4));
    return startPage + index;
  }).filter((p) => p <= totalPages);

  if (total === 0) return null;

  return (
    <div
      className={`px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold num" style={{ color: 'var(--text-muted)' }}>
          แสดง {start.toLocaleString()}-{end.toLocaleString()} จาก {total.toLocaleString()} {itemLabel}
        </p>
        <Select
          containerClassName="w-[96px]"
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}/หน้า
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <PagerButton disabled={safePage <= 1} onClick={() => onPageChange(1)}>
          แรก
        </PagerButton>
        <PagerButton disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
          ก่อนหน้า
        </PagerButton>
        {pages.map((p) => {
          const active = p === safePage;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="h-9 min-w-9 px-3 rounded-xl text-xs font-bold num"
              style={{
                background: active ? 'var(--accent)' : 'var(--surface-2)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                color: active ? 'var(--accent-fg)' : 'var(--text-2)',
              }}
            >
              {p}
            </button>
          );
        })}
        <PagerButton disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>
          ถัดไป
        </PagerButton>
        <PagerButton disabled={safePage >= totalPages} onClick={() => onPageChange(totalPages)}>
          ท้าย
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="h-9 px-3 rounded-xl text-xs font-bold disabled:opacity-40"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
    >
      {children}
    </button>
  );
}
