import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const widthClass: Record<NonNullable<DrawerProps['width']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'lg',
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={`absolute right-0 top-0 bottom-0 w-full ${widthClass[width]} flex flex-col`}
            style={{
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {(title || description) && (
              <div
                className="px-6 py-5 flex items-start justify-between gap-4 shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  {title && (
                    <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:opacity-80"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && (
              <div
                className="px-6 py-4 flex items-center justify-end gap-2 shrink-0"
                style={{
                  borderTop: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                {footer}
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
