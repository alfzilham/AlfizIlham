'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { NAV } from '@/lib/content';
import { EASE } from '@/lib/motion';
import { LinkButton } from '@/components/ui/button';
import { lockScroll } from '@/components/smooth-scroll';
import { cn } from '@/lib/utils';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const delta = y - lastY;
      if (y < 80) setHidden(false);
      else if (delta > 6) setHidden(true);
      else if (delta < -6) setHidden(false);
      if (Math.abs(delta) > 6) lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const mq = window.matchMedia('(min-width: 1024px)');
    const onWide = () => mq.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onWide);
    };
  }, [open]);

  return (
    <>
    <header
      className={cn(
        'ease-out-soft fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-300 focus-within:translate-y-0 sm:px-5',
        hidden && !open ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full px-4 transition-[background,box-shadow] duration-300 sm:px-5',
          scrolled ? 'glass' : 'bg-transparent',
        )}
      >
        <a href="#top" className="flex items-center gap-2.5 rounded-full" aria-label="Alfiz Ilham, back to top">
          <Image src="/brand/logo-mark.webp" alt="" width={36} height={36} priority className="size-9 object-contain" />
          <span className="font-display text-[17px] font-bold whitespace-nowrap">Alfiz Ilham</span>
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-[15px] font-medium text-muted transition-colors hover:text-fg">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Wrapper hides it on phones; the same CTA lives inside the mobile menu. */}
          <span className="hidden sm:inline-flex">
            <LinkButton href="#contact" variant="primary" size="md">
              Let&apos;s talk <ArrowUpRight className="size-4" aria-hidden="true" />
            </LinkButton>
          </span>
          <button
            ref={toggleRef}
            type="button"
            className="glass-soft inline-flex size-11 items-center justify-center rounded-full lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

    </header>

    <Drawer open={open} onClose={close} onNavigate={() => setOpen(false)} />
    </>
  );
}

/** Slide-in sidebar for phones and tablets. Rendered outside the header so its fixed position is not trapped by the header transform. */
function Drawer({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: () => void }) {
  const panel = useRef<HTMLElement>(null);

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panel.current) return;
    const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
          />
          <motion.aside
            ref={panel}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onKeyDown={trapTab}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: EASE }}
            className="glass absolute inset-y-0 right-0 flex w-[min(86vw,360px)] flex-col rounded-l-[28px] bg-[rgb(14_14_14/0.98)] p-5 pb-[max(20px,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[17px] font-bold whitespace-nowrap">Alfiz Ilham</span>
              <button
                type="button"
                autoFocus
                onClick={onClose}
                aria-label="Close menu"
                className="glass-soft inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="mt-8 flex-1 overflow-y-auto">
              <ul className="flex flex-col">
                {NAV.map((n, i) => (
                  <motion.li
                    key={n.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.05, ease: EASE }}
                    className="border-b border-line last:border-0"
                  >
                    <a
                      href={n.href}
                      onClick={onNavigate}
                      className="flex min-h-14 items-center font-display text-2xl font-semibold transition-colors hover:text-accent focus-visible:text-accent"
                    >
                      {n.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <LinkButton href="#contact" variant="primary" size="lg" className="w-full" onClick={onNavigate}>
              Let&apos;s talk <ArrowUpRight className="size-4" aria-hidden="true" />
            </LinkButton>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
