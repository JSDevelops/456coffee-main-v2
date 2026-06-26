import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Tone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  msg: string;
  tone: Tone;
}

interface ToastCtx {
  show: (msg: string, tone?: Tone) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const palette: Record<Tone, { bg: string; icon: ReactNode }> = {
  success: { bg: 'var(--success)', icon: <Check size={16} /> },
  error:   { bg: 'var(--danger)',  icon: <AlertTriangle size={16} /> },
  info:    { bg: 'var(--info)',    icon: <Info size={16} /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((msg: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, msg, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const value: ToastCtx = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-semibold pointer-events-auto shadow-xl min-w-[260px]"
              style={{ background: palette[t.tone].bg }}
            >
              {palette[t.tone].icon}
              <span className="flex-1">{t.msg}</span>
              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                className="opacity-60 hover:opacity-100"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
