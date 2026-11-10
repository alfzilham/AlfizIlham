'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { lockScroll } from '@/components/smooth-scroll';
import { cn } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  /** Keeps the dialog open on overlay click, for forms with unsaved input. */
  persistent?: boolean;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children, footer, size = 'md', persistent }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    lockScroll(true);
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // A dropdown inside the dialog handles its own Escape first.
        if (e.defaultPrevented) return;
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      lockScroll(false);
      returnFocus.current?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[rgba(4,4,4,0.68)] backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={persistent ? undefined : onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            data-lenis-prevent
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]',
              'bg-[linear-gradient(135deg,rgba(52,52,52,0.92),rgba(22,22,22,0.96)_45%,rgba(30,30,30,0.94))] shadow-[var(--gl-edge),0_40px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl',
              size === 'md' && 'sm:max-w-[560px]',
              size === 'lg' && 'sm:max-w-[640px]',
              size === 'xl' && 'sm:max-w-[920px]',
            )}
          >
            <div className="flex items-start justify-between gap-4 px-5 pt-6 pb-4 sm:px-7 sm:pt-7">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-[22px] leading-tight font-bold sm:text-[26px]">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="glass-soft inline-flex size-10 flex-none items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
              >
                <X className="size-[18px]" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-7">{children}</div>
            {footer && <div className="border-t border-white/[0.06] px-5 py-4 sm:px-7">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
