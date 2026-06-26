import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationVariant = 'warm' | 'dark' | 'blue' | 'orange' | 'neutral';

interface VariantStyle {
  surface: string;
  border: string;
  text: string;
  muted: string;
  buttonBg: string;
  buttonBorder: string;
  buttonText: string;
  activeBg: string;
  activeText: string;
}

const VARIANTS: Record<PaginationVariant, VariantStyle> = {
  warm: {
    surface: '#fdfaf6',
    border: '#ece5da',
    text: '#7c543c',
    muted: 'rgba(124,84,60,0.72)',
    buttonBg: '#ffffff',
    buttonBorder: '#ece5da',
    buttonText: '#7c543c',
    activeBg: 'linear-gradient(135deg, #fbbf24, #ea580c)',
    activeText: '#ffffff',
  },
  dark: {
    surface: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.10)',
    text: '#f5e7d8',
    muted: 'rgba(255,255,255,0.68)',
    buttonBg: 'rgba(255,255,255,0.08)',
    buttonBorder: 'rgba(255,255,255,0.12)',
    buttonText: '#ffffff',
    activeBg: 'linear-gradient(135deg, #fbbf24, #ea580c)',
    activeText: '#ffffff',
  },
  blue: {
    surface: '#f8fbff',
    border: '#dbeafe',
    text: '#1d4ed8',
    muted: '#64748b',
    buttonBg: '#ffffff',
    buttonBorder: '#dbeafe',
    buttonText: '#334155',
    activeBg: '#3b82f6',
    activeText: '#ffffff',
  },
  orange: {
    surface: '#fff7ed',
    border: '#fed7aa',
    text: '#c2410c',
    muted: '#78716c',
    buttonBg: '#ffffff',
    buttonBorder: '#fed7aa',
    buttonText: '#9a3412',
    activeBg: '#ea580c',
    activeText: '#ffffff',
  },
  neutral: {
    surface: '#f8fafc',
    border: '#e5e7eb',
    text: '#475569',
    muted: '#64748b',
    buttonBg: '#ffffff',
    buttonBorder: '#e5e7eb',
    buttonText: '#334155',
    activeBg: '#334155',
    activeText: '#ffffff',
  },
};

function buildPageItems(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, 'end-gap', totalPages];
  }

  if (page >= totalPages - 2) {
    return [1, 'start-gap', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'start-gap', page - 1, page, page + 1, 'end-gap', totalPages];
}

export function useClientPagination<T>(
  items: T[],
  pageSize: number,
  resetKey?: string | number | null,
) {
  const [page, setPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, resetKey]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return {
    page,
    setPage,
    pageItems,
    pageSize,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
  };
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'รายการ',
  variant = 'warm',
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  variant?: PaginationVariant;
}) {
  if (totalItems === 0) return null;

  const style = VARIANTS[variant];
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);
  const pageItems = buildPageItems(page, totalPages);

  return (
    <div
      className="mt-4 rounded-2xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ background: style.surface, border: `1px solid ${style.border}` }}
    >
      <div className="text-xs font-bold" style={{ color: style.muted }}>
        <span className="font-black" style={{ color: style.text }}>
          {rangeStart}-{rangeEnd}
        </span>{' '}
        จาก {totalItems.toLocaleString()} {itemLabel} · หน้า {page} / {totalPages}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-35"
          style={{
            background: style.buttonBg,
            border: `1px solid ${style.buttonBorder}`,
            color: style.buttonText,
          }}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {pageItems.map((item, index) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className="min-w-[36px] h-9 px-3 rounded-xl text-xs font-black transition-all"
              style={{
                background: item === page ? style.activeBg : style.buttonBg,
                border: `1px solid ${item === page ? 'transparent' : style.buttonBorder}`,
                color: item === page ? style.activeText : style.buttonText,
              }}
            >
              {item}
            </button>
          ) : (
            <span
              key={`${item}-${index}`}
              className="min-w-[36px] h-9 px-2 rounded-xl text-xs font-black inline-flex items-center justify-center"
              style={{ color: style.muted }}
            >
              ...
            </span>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-35"
          style={{
            background: style.buttonBg,
            border: `1px solid ${style.buttonBorder}`,
            color: style.buttonText,
          }}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
