'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, CircleX } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

type Toast = { id: number; text: string; tone: 'ok' | 'error' };
type ConfirmOpts = { title: string; body: string; confirm: string; danger?: boolean };

const Ctx = createContext<{ toast: (text: string, tone?: Toast['tone']) => void; confirm: (o: ConfirmOpts) => Promise<boolean> } | null>(null);

export function useFeedback() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
  return ctx;
}

/** Toasts and a confirm dialog shared by the dashboard pages. */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })), []);

  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-24 z-[120] flex flex-col items-end gap-2 lg:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-auto flex max-w-[360px] items-start gap-3 rounded-2xl bg-[linear-gradient(135deg,rgba(54,54,54,0.97),rgba(18,18,18,0.98))] px-4 py-3 text-sm shadow-[var(--gl-soft),0_20px_40px_rgba(0,0,0,0.5)]"
            >
              {t.tone === 'ok' ? <CircleCheck className="mt-0.5 size-4 flex-none text-ok" aria-hidden="true" /> : <CircleX className="mt-0.5 size-4 flex-none text-bad" aria-hidden="true" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Modal
        open={Boolean(dialog)}
        onClose={() => close(false)}
        title={dialog?.title ?? ''}
        description={dialog?.body}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => close(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => close(true)} data-autofocus>
              {dialog?.confirm}
            </Button>
          </div>
        }
      >
        <span />
      </Modal>
    </Ctx.Provider>
  );
}
