'use client';

import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { FAQ_TABS, FAQS } from '@/lib/content';
import { cn } from '@/lib/utils';
import AnimatedList from '@/components/ui/animated-list';
import { Reveal } from '@/components/ui/reveal';
import { Section } from './primitives';

const pad = (n: number) => String(n + 1).padStart(2, '0');

type FaqItem = (typeof FAQS)[number] & { i: number };

/** The "All questions" tab shows this many accordions, the rest scroll. */
const VISIBLE = 7;
const ROW_MIN = 64;
const ROW_GAP = 12;
const VIEWPORT_PAD = 12;
const LIST_HEIGHT = VISIBLE * ROW_MIN + (VISIBLE - 1) * ROW_GAP + VIEWPORT_PAD;

function Row({ f, base, isOpen, onToggle }: { f: FaqItem; base: string; isOpen: boolean; onToggle: () => void }) {
  const qid = `${base}-q-${f.i}`;
  const aid = `${base}-a-${f.i}`;
  return (
    <div className={cn('overflow-hidden rounded-[20px] transition-colors', isOpen ? 'acc-surface' : 'glass')}>
      <h3>
        <button
          type="button"
          id={qid}
          aria-expanded={isOpen}
          aria-controls={aid}
          onClick={onToggle}
          className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="font-display text-[15px] font-semibold uppercase sm:text-base">{f.q}</span>
          <Plus aria-hidden="true" className={cn('size-5 flex-none text-accent transition-transform duration-300', isOpen && 'rotate-45 text-white')} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={aid}
            role="region"
            aria-labelledby={qid}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-5 pb-5 text-[15px] leading-relaxed text-white/85">{f.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();
  const items: FaqItem[] = FAQS.map((f, i) => ({ ...f, i })).filter((f) => tab === 0 || f.tab === tab);

  const selectTab = (i: number) => {
    setTab(i);
    setOpen(null);
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = FAQ_TABS.length;
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % n;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    if (next < 0) return;
    e.preventDefault();
    selectTab(next);
    tabs.current[next]?.focus();
  };

  return (
    <Section id="faq" label="Frequently asked questions">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <Reveal className="flex flex-col gap-4">
            <h2 className="font-display text-[clamp(64px,9vw,112px)] leading-[0.9] font-medium tracking-[-0.03em]">FAQ</h2>
            <p className="text-muted">Quick answers about how I work.</p>
          </Reveal>
          <div role="tablist" aria-label="Question topics" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {FAQ_TABS.map((t, i) => {
              const on = i === tab;
              return (
                <button
                  key={t}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${base}-tab-${i}`}
                  aria-selected={on}
                  aria-controls={`${base}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => selectTab(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={cn(
                    'flex min-h-12 flex-none items-center gap-4 rounded-full px-4 text-left transition-colors lg:min-h-[60px] lg:rounded-[20px] lg:px-5',
                    on ? 'bg-fg text-bg' : 'text-muted hover:bg-white/5 hover:text-fg',
                  )}
                >
                  <span className={cn('font-mono text-xs', on && 'text-bg/70')}>{pad(i)}</span>
                  <span className="font-display text-[15px] font-bold whitespace-nowrap lg:text-[18px]">{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${tab}`} className="min-w-0">
          {tab === 0 ? (
            <AnimatedList
              key="all"
              plain
              label="All questions"
              items={items.map((f) => ({ id: f.i, title: f.q }))}
              renderItem={(_, index) => {
                const f = items[index];
                return <Row f={f} base={base} isOpen={open === f.i} onToggle={() => setOpen(open === f.i ? null : f.i)} />;
              }}
              animation="pop"
              width="100%"
              maxHeight={LIST_HEIGHT}
              gap={ROW_GAP}
              stagger={0.05}
              fadeSize={40}
              frame={false}
              showGradients
              displayScrollbar
              selectOnHover={false}
              enableArrowNavigation={false}
              animateOnce
            />
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((f) => (
                <Row key={f.i} f={f} base={base} isOpen={open === f.i} onToggle={() => setOpen(open === f.i ? null : f.i)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
