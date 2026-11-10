'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Option = { value: string; label: string };

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  name?: string;
  error?: string;
  hint?: string;
  className?: string;
  /** Extra content under the options, for example an "add new" row. */
  footer?: (close: () => void) => React.ReactNode;
  required?: boolean;
};

/** Accessible custom dropdown (button + listbox) that follows the WAI-ARIA select-only combobox pattern. */
export function Select({ label, value, onChange, options, placeholder = 'Select', name, error, hint, className, footer, required }: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    setActive(idx);
    const t = window.setTimeout(() => listRef.current?.focus(), 10);
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const pick = (i: number) => {
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    close();
  };

  const onButtonKey = (e: React.KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(last, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        pick(active);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1) {
          const now = Date.now();
          typed.current.text = now - typed.current.at > 600 ? e.key.toLowerCase() : typed.current.text + e.key.toLowerCase();
          typed.current.at = now;
          const i = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
          if (i >= 0) setActive(i);
        }
    }
  };

  return (
    <div ref={rootRef} className={cn('relative flex min-w-0 flex-col gap-2', className)}>
      <span id={`${id}-label`} className="text-[13px] font-medium text-fg">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <button
        ref={buttonRef}
        type="button"
        id={`${id}-button`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label ${id}-button`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKey}
        className={cn('input-base flex items-center justify-between gap-3 text-left', open && 'shadow-[inset_0_0_0_1px_rgba(255,106,26,0.75)]')}
      >
        <span className={cn('truncate', !selected && 'text-[#7a7a7a]')}>{selected?.label ?? placeholder}</span>
        <ChevronDown aria-hidden="true" className={cn('size-[18px] flex-none text-accent transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {name && <input type="hidden" name={name} value={value} />}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 rounded-2xl bg-[linear-gradient(135deg,rgba(54,54,54,0.96),rgba(18,18,18,0.98))] p-1.5 shadow-[var(--gl-soft),0_24px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <ul
              ref={listRef}
              id={`${id}-list`}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={`${id}-label`}
              aria-activedescendant={`${id}-opt-${active}`}
              onKeyDown={onListKey}
              data-lenis-prevent
              className="max-h-64 overflow-y-auto outline-none"
            >
              {options.map((o, i) => {
                const isSel = o.value === value;
                return (
                  <li
                    key={o.value}
                    id={`${id}-opt-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(i)}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3.5 text-[15px] text-fg transition-colors',
                      i === active && 'bg-white/[0.08]',
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel && <Check aria-hidden="true" className="size-4 flex-none text-accent" />}
                  </li>
                );
              })}
              {options.length === 0 && <li className="px-3.5 py-3 text-sm text-muted">No options yet</li>}
            </ul>
            {footer && (
              <>
                <div className="mx-1 my-1.5 h-px bg-white/10" />
                <div className="p-1">{footer(() => close(false))}</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
