'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { BIG_STATS } from '@/lib/content';

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return <span ref={ref}>{value}</span>;
}

export function Stats() {
  return (
    <section aria-label="Numbers" className="border-y border-line px-5 py-16 sm:px-8">
      <dl className="mx-auto grid max-w-[1120px] grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        {BIG_STATS.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-3">
            <dt className="max-w-[20ch] text-sm text-muted">{s.label}</dt>
            <dd className="font-display text-[clamp(56px,7vw,88px)] leading-none font-bold tracking-[-0.03em]">
              <span className="sr-only">{s.value}+</span>
              <span aria-hidden="true">
                <Counter to={s.value} />
                <span className="text-accent">+</span>
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
