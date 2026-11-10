'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/** Lenis smooth scrolling for the public site. Off when the visitor prefers reduced motion. */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    const onChange = () => {
      if (media.matches) lenis.destroy();
    };
    media.addEventListener('change', onChange);

    // Smooth in-page anchor links, with room for the fixed header.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const id = link.getAttribute('href') ?? '';
      const target = id === '#' || id === '#top' ? 0 : document.querySelector<HTMLElement>(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      history.replaceState(null, '', id);
      if (target instanceof HTMLElement) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    };
    document.addEventListener('click', onClick);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener('change', onChange);
      document.removeEventListener('click', onClick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return null;
}

/** Stops page scrolling while a modal is open, for both Lenis and native scroll. */
export function lockScroll(locked: boolean) {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (locked) {
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
  } else {
    lenis?.start();
    document.documentElement.style.overflow = '';
  }
}
