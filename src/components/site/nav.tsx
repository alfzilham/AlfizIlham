'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { NAV } from '@/lib/content';
import { LinkButton } from '@/components/ui/button';
import { lockScroll } from '@/components/smooth-scroll';
import { cn } from '@/lib/utils';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={cn(
        'ease-out-soft fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-300 focus-within:translate-y-0 sm:px-5',
        hidden && !open ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 rounded-full px-4 transition-[background,box-shadow] duration-300 sm:px-5',
          scrolled || open ? 'glass' : 'bg-transparent',
        )}
      >
        <a href="#top" className="flex items-center gap-2.5 rounded-full" aria-label="Alfiz Ilham, back to top">
          <Image src="/brand/logo-mark.webp" alt="" width={36} height={36} priority className="size-9 object-contain" />
          <span className="font-display text-[17px] font-bold">Alfiz Ilham</span>
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
          <LinkButton href="#contact" variant="primary" size="md" className="hidden sm:inline-flex">
            Let&apos;s talk <ArrowUpRight className="size-4" aria-hidden="true" />
          </LinkButton>
          <button
            type="button"
            className="glass-soft inline-flex size-11 items-center justify-center rounded-full lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="glass mx-auto mt-2 max-w-[1200px] rounded-[28px] p-3 lg:hidden"
          >
            <ul className="flex flex-col">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-2xl px-4 font-display text-xl font-semibold transition-colors hover:bg-white/5"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <LinkButton href="#contact" variant="primary" size="lg" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Let&apos;s talk <ArrowUpRight className="size-4" aria-hidden="true" />
            </LinkButton>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
