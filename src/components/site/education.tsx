import { GraduationCap, MapPin, School } from 'lucide-react';
import { EDUCATION } from '@/lib/content';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import { Glow, Heading, Section } from './primitives';

type Edu = (typeof EDUCATION)[number];

/** Horizontal centre of each card, as a share of the diagram width (matches the SVG dot positions). */
const LEFT = [11.964, 38.036, 61.964, 88.036];
/** Dots on the curve, in SVG units (viewBox 1120 x 560). Odd cards sit above the line, even cards below. */
const DOTS: [number, number][] = [
  [134, 340],
  [426, 250],
  [694, 340],
  [986, 250],
];
const CURVE = 'M 24 340 H 134 C 280 340 280 250 426 250 C 560 250 560 340 694 340 C 840 340 840 250 986 250';

function Card({ e, compact }: { e: Edu; compact?: boolean }) {
  const current = 'current' in e && e.current;
  const Icon = current ? GraduationCap : School;
  return (
    <div className={cn('relative', compact ? 'w-full' : 'w-[270px]')}>
      <span
        aria-hidden="true"
        className={cn('outline-text pointer-events-none absolute right-3.5 z-0 font-condensed leading-none select-none', compact ? 'top-[-36px] text-[80px]' : 'top-[-50px] text-[104px]')}
      >
        {e.n}
      </span>
      <article className={cn('relative z-10 flex flex-col gap-2.5 rounded-2xl p-[18px]', current ? 'glass-tint' : 'glass')}>
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex size-9 flex-none items-center justify-center rounded-xl border border-accent/35 bg-accent/12 text-accent">
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
          <span className={cn('font-mono text-xs', current ? 'text-accent' : 'text-muted')}>{e.year}</span>
        </div>
        <h3 className="font-display text-lg leading-tight font-bold">{e.title}</h3>
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <MapPin className="size-3.5 flex-none" aria-hidden="true" />
          {e.place}
        </p>
        <p className="text-sm leading-normal text-muted">{e.desc}</p>
      </article>
    </div>
  );
}

export function Education() {
  return (
    <Section id="education" label="Education" className="overflow-hidden">
      <Glow spots={[['18%', '74%', 460], ['60%', '40%', 420], ['90%', '80%', 460]]} />
      <span aria-hidden="true" className="outline-text pointer-events-none absolute top-6 right-0 font-condensed text-[clamp(88px,14vw,200px)] leading-none select-none">
        EDU
      </span>
      <Heading title="Education" lead="From boarding school in Aceh to a Computer Engineering degree." />

      <Reveal className="mt-10">
        {/* Wide: wavy timeline with cards alternating above and below */}
        <div className="relative hidden pt-6 min-[1200px]:block">
          <svg viewBox="0 0 1120 560" width="100%" aria-hidden="true" className="block overflow-visible">
            <defs>
              <linearGradient id="eduLine" x1="0" y1="0" x2="1120" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#b33a00" stopOpacity="0.45" />
                <stop offset="1" stopColor="#ff6a1a" />
              </linearGradient>
              <filter id="eduBlur" x="-10%" y="-40%" width="120%" height="180%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>
            <path d={CURVE} fill="none" stroke="url(#eduLine)" strokeWidth="12" opacity="0.35" filter="url(#eduBlur)" />
            <path d={CURVE} fill="none" stroke="url(#eduLine)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 986 250 H 1100" fill="none" stroke="#ff6a1a" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 10" opacity="0.8" />
            {DOTS.map(([x, y], i) => {
              const last = i === DOTS.length - 1;
              const above = i % 2 === 0;
              return (
                <g key={i}>
                  <line x1={x} y1={above ? 318 : 272} x2={x} y2={above ? 215 : 330} stroke="rgba(242,242,242,0.25)" strokeWidth="1" strokeDasharray="3 5" />
                  {last && <circle cx={x} cy={y} r="26" fill="rgba(255,106,26,0.25)" />}
                  <circle cx={x} cy={y} r="13" fill="#0a0a0a" stroke={last ? '#ff6a1a' : '#b33a00'} strokeWidth="2.5" />
                  <circle cx={x} cy={y} r="5" fill={last ? '#ff6a1a' : '#b33a00'} />
                </g>
              );
            })}
          </svg>
          {EDUCATION.map((e, i) => (
            <div
              key={e.n}
              className="absolute"
              style={{ left: `calc(${LEFT[i]}% - 135px)`, ...(i % 2 === 0 ? { bottom: '61.61%' } : { top: 'calc(24px + 58.93%)' }) }}
            >
              <Card e={e} />
            </div>
          ))}
        </div>

        {/* Compact: vertical timeline */}
        <div className="relative flex flex-col gap-9 pt-5 pl-[52px] min-[1200px]:hidden">
          <span aria-hidden="true" className="absolute top-9 bottom-5 left-[15px] w-0.5 rounded-sm bg-[linear-gradient(to_bottom,rgba(179,58,0,0.5),#ff6a1a)]" />
          {EDUCATION.map((e, i) => {
            const last = i === EDUCATION.length - 1;
            return (
              <div key={e.n} className="relative">
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-[22px] -left-[47px] z-10 flex size-6 items-center justify-center rounded-full border-2 bg-bg',
                    last ? 'border-accent shadow-[0_0_0_6px_rgba(255,106,26,0.25)]' : 'border-[#b33a00]',
                  )}
                >
                  <span className={cn('size-2 rounded-full', last ? 'bg-accent' : 'bg-[#b33a00]')} />
                </span>
                <Card e={e} compact />
              </div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}
