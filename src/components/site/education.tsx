import { GraduationCap, MapPin, School } from 'lucide-react';
import { EDUCATION } from '@/lib/content';
import { RevealGroup, RevealItem } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import { Glow, Heading, Section } from './primitives';

export function Education() {
  return (
    <Section id="education" label="Education" className="overflow-hidden">
      <Glow spots={[['18%', '74%', 460], ['60%', '40%', 420], ['90%', '80%', 460]]} />
      <span aria-hidden="true" className="outline-text pointer-events-none absolute top-6 right-0 font-condensed text-[clamp(88px,14vw,200px)] leading-none select-none">
        EDU
      </span>
      <Heading title="Education" lead="From boarding school in Aceh to a Computer Engineering degree." />

      <RevealGroup className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div aria-hidden="true" className="absolute top-[34px] right-0 left-0 hidden h-px bg-[linear-gradient(90deg,transparent,rgba(255,106,26,0.7)_15%,rgba(255,106,26,0.7)_85%,transparent)] lg:block" />
        {EDUCATION.map((e) => {
          const Icon = e.current ? GraduationCap : School;
          return (
            <RevealItem key={e.n} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  'relative z-10 mb-6 hidden size-4 rounded-full border-2 border-accent bg-bg lg:mt-[26px] lg:block',
                  e.current && 'bg-accent shadow-[0_0_0_6px_rgba(255,106,26,0.25)]',
                )}
              />
              <article className={cn('relative flex h-full flex-col gap-3 rounded-[20px] p-5', e.current ? 'glass-tint' : 'glass')}>
                <span aria-hidden="true" className="outline-text absolute -top-7 right-4 font-condensed text-[64px] leading-none">
                  {e.n}
                </span>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className={cn('font-mono text-[11px]', e.current ? 'text-accent' : 'text-muted')}>{e.year}</span>
                </div>
                <h3 className="font-display text-lg leading-tight font-bold">{e.title}</h3>
                <p className="flex items-center gap-1.5 text-[13px] text-muted">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {e.place}
                </p>
                <p className="text-sm leading-relaxed text-muted">{e.desc}</p>
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
