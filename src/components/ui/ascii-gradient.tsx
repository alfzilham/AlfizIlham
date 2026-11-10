'use client';

import { useEffect, useRef } from 'react';

const RAMP = ' .:-=+*#%@';
const CELL_W = 9;
const CELL_H = 16;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Orange ramp: deep ember -> brand orange -> pale highlight. */
function colour(i: number) {
  if (i < 0.55) {
    const t = i / 0.55;
    return [mix(110, 255, t), mix(34, 106, t), mix(8, 26, t)];
  }
  const t = (i - 0.55) / 0.45;
  return [255, mix(106, 196, t), mix(26, 150, t)];
}

/**
 * Animated gradient drawn with ASCII characters on a canvas.
 * Decorative only: hidden from assistive tech, one static frame when the visitor prefers reduced motion,
 * and the loop stops while the tab is hidden.
 */
export function AsciiGradient({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL_H - 3}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx.textBaseline = 'top';
    };

    const draw = (time: number) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const u = x / cols;
          const v = y / rows;
          const wave =
            Math.sin(x * 0.07 + t * 0.55) +
            Math.sin(y * 0.1 - t * 0.45) +
            Math.sin((x + y) * 0.05 + t * 0.35) +
            Math.sin(Math.hypot(x - cols * 0.7, y - rows * 0.75) * 0.09 - t * 0.7);
          const base = (wave + 4) / 8;
          // Glow gathers toward the lower right, like the reference visual.
          const glow = Math.max(0, 1 - Math.hypot(u - 0.82, v - 0.86) * 1.35);
          const i = Math.min(1, base * 0.45 + glow * 0.75 - 0.08);
          if (i < 0.07) continue;
          const [r, g, b] = colour(i);
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${(0.18 + i * 0.82).toFixed(2)})`;
          ctx.fillText(RAMP[Math.min(RAMP.length - 1, Math.floor(i * RAMP.length))], x * CELL_W, y * CELL_H);
        }
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 50) return; // about 20 fps keeps it cheap
      last = now;
      draw(now);
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    observer.observe(canvas);
    draw(1200);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };
    if (!reduced) raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
