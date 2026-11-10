'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SERVICES } from '@/lib/content';
import { cn } from '@/lib/utils';
import { Heading, Section, ToolTile } from './primitives';

const pad = (n: number) => String(n + 1).padStart(2, '0');

export function Services() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = SERVICES[active];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = SERVICES.length;
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % n;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <Section id="services" label="Services">
      <Heading title="What I can build for you" lead="Pick a service to see what it covers and what I have shipped with it." />

      <div className="mt-12 grid gap-8 lg:grid-cols-[340px_1fr]">
        <div role="tablist" aria-label="Services" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {SERVICES.map((svc, i) => {
            const on = i === active;
            return (
              <button
                key={svc.name}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`svc-tab-${i}`}
                aria-selected={on}
                aria-controls="svc-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  'group relative flex min-h-12 flex-none items-center gap-4 rounded-full px-4 text-left transition-colors duration-200 lg:min-h-[64px] lg:rounded-[20px] lg:px-5',
                  on ? 'bg-fg text-bg' : 'text-muted hover:bg-white/5 hover:text-fg',
                )}
              >
                <span className={cn('font-mono text-xs', on ? 'text-bg/70' : '')}>{pad(i)}</span>
                <span className="flex-1 font-display text-[15px] font-bold whitespace-nowrap lg:text-[19px]">{svc.name}</span>
                {on && (
                  <span aria-hidden="true" className="hidden size-8 items-center justify-center rounded-full bg-bg text-fg lg:flex">
                    <ArrowUpRight className="size-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div id="svc-panel" role="tabpanel" aria-labelledby={`svc-tab-${active}`} className="acc-surface relative min-h-[460px] overflow-hidden rounded-[28px] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }} className="flex flex-col gap-6">
              <span className="font-mono text-xs text-white/70">
                {pad(active)} / {pad(SERVICES.length - 1)}
              </span>
              <h3 className="font-display text-[clamp(30px,4vw,44px)] leading-none font-extrabold text-white uppercase">{s.name}</h3>
              <p className="max-w-[56ch] text-[15px] leading-relaxed text-white/85">{s.body}</p>
              <div className="h-px bg-white/20" />
              <div className="flex flex-col gap-3">
                <span className="text-[13px] text-white/75">Stack</span>
                <ul className="flex flex-wrap gap-2.5">
                  {s.tools.map((t) => (
                    <li key={t.key}>
                      <ToolTile icon={t.key} label={t.label} size={44} showLabel={false} />
                    </li>
                  ))}
                </ul>
              </div>
              <p className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
                <span className="text-white/75">{s.shippedLabel}</span>
                <span className="font-semibold text-white">{s.shipped}</span>
              </p>
              <a
                href="#contact"
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-fg px-5 text-sm font-semibold text-bg transition-transform duration-200 hover:-translate-y-0.5"
              >
                Discuss this service <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
