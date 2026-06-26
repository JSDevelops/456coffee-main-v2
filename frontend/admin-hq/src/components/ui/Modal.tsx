import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`
              relative w-full ${sizeClass[size]}
              rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh]
            `}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {(title || description) && (
              <div
                className="px-6 py-5 flex items-start justify-between gap-4"
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80 shrink-0"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && (
              <div
                className="px-6 py-4 flex items-center justify-end gap-2"
                style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
