'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FoldText from './fold-text';
import GradientASCII from './gradient-ascii';
import { markSplashDone } from '@/lib/splash-state';

// Project palette, dark to bright (ramp used by the ASCII gradient).
const COLORS = ['#2a0f06', '#8f2d0a', '#ff6a1a', '#ffb347'];
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// The ASCII background plays a 2.4s intro; the splash waits for it as well as for the text.
const ASCII_INTRO_MS = 2500;
// Pause after every animation has finished, so the viewer can take it in.
const HOLD_MS = 1100;
const FADE_MS = 700;

type Phase = 'show' | 'leaving' | 'gone';

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('show');
  const textDone = useRef(false);
  const introDone = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const leave = useCallback(() => setPhase(current => (current === 'show' ? 'leaving' : current)), []);

  const settle = useCallback(() => {
    if (!textDone.current || !introDone.current) return;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(leave, HOLD_MS);
  }, [leave]);

  const onTextComplete = useCallback(() => {
    textDone.current = true;
    settle();
  }, [settle]);

  useEffect(() => {
    const intro = setTimeout(() => {
      introDone.current = true;
      settle();
    }, ASCII_INTRO_MS);
    return () => {
      clearTimeout(intro);
      clearTimeout(holdTimer.current);
    };
  }, [settle]);

  useEffect(() => {
    if (phase === 'gone') return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const done = setTimeout(() => {
      setPhase('gone');
      markSplashDone();
    }, FADE_MS + 60);
    return () => clearTimeout(done);
  }, [phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leave]);

  if (phase === 'gone') return null;

  return (
    <div
      id="splash"
      role="status"
      aria-label="Loading"
      className={`ease-out-soft fixed inset-0 z-[100] bg-bg transition-opacity ${
        phase === 'leaving' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="absolute inset-0">
        <GradientASCII
          colors={COLORS}
          shape="rise"
          cellSize={16}
          density={0.85}
          glyphOpacity={0.8}
          glow={0.25}
          softness={0.6}
          flow={0.5}
          speed={1}
          gradientOpacity={0.55}
          grain={0.06}
          scrambleRadius={0.12}
          fontFamily={MONO}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center px-6">
        <FoldText
          text="WELCOME"
          foldStyle="paper"
          splitBy="char"
          hinge="top"
          trigger="mount"
          foldAngle={92}
          duration={0.9}
          stagger={0.09}
          staggerFrom="start"
          ease="power3.out"
          perspective={700}
          creaseShading={0.55}
          fontSize="clamp(44px, 11vw, 132px)"
          fontWeight={800}
          color="#f2f2f2"
          className="font-display"
          style={{ letterSpacing: '0.04em' }}
          onComplete={onTextComplete}
        />
      </div>
      <button
        type="button"
        onClick={leave}
        className="absolute bottom-5 right-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-fg focus-visible:text-fg"
      >
        Skip
      </button>
    </div>
  );
}
