'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ellipsis } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MenuItem = { label: string; icon?: React.ReactNode; onSelect: () => void; danger?: boolean };

/** Kebab menu with arrow-key navigation (WAI-ARIA menu button). */
export function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    refs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setActive(0);
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(0);
            setOpen(true);
          }
        }}
        className="glass-soft flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
      >
        <Ellipsis className="size-4" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => (a + 1) % items.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => (a - 1 + items.length) % items.length);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                close();
              } else if (e.key === 'Tab') setOpen(false);
            }}
            className="absolute top-[calc(100%+6px)] right-0 z-40 min-w-[190px] rounded-2xl bg-[linear-gradient(135deg,rgba(54,54,54,0.97),rgba(18,18,18,0.98))] p-1.5 shadow-[var(--gl-soft),0_20px_40px_rgba(0,0,0,0.55)]"
          >
            {items.map((it, i) => (
              <button
                key={it.label}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={i === active ? 0 : -1}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={cn(
                  'flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors hover:bg-white/[0.08] focus:bg-white/[0.08] focus:outline-none',
                  it.danger && 'text-bad',
                )}
              >
                <span aria-hidden="true" className="[&>svg]:size-4">
                  {it.icon}
                </span>
                {it.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
