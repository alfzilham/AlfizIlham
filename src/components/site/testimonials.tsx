'use client';

import { useState } from 'react';
import { MOTION_ENABLED } from '@/lib/motion';
import { Quote, Star } from 'lucide-react';
import { initials } from '@/lib/utils';
import { Heading, Glow } from './primitives';

export type PublicTestimonial = { id: string; name: string; role: string | null; company: string | null; message: string; rating: number; avatarUrl: string | null };

function Avatar({ name, url }: { name: string; url: string | null }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="size-10 flex-none rounded-full object-cover" />
    );
  }
  return (
    <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-full bg-fg font-display text-sm font-bold text-bg">
      {initials(name)}
    </span>
  );
}

function Card({ t }: { t: PublicTestimonial }) {
  const who = [t.role, t.company].filter(Boolean).join(', ');
  return (
    <figure className="glass flex w-[300px] flex-none flex-col justify-between gap-6 rounded-[20px] p-5 sm:w-[340px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Quote className="size-5 text-accent" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 font-mono text-[13px]" aria-label={`Rated ${t.rating} out of 5`}>
            <Star className="size-3.5 text-accent" aria-hidden="true" />
            {t.rating}/5
          </span>
        </div>
        <blockquote className="text-[15px] leading-relaxed text-fg/90">{t.message}</blockquote>
      </div>
      <figcaption className="flex items-center gap-3">
        <Avatar name={t.name} url={t.avatarUrl} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{t.name}</span>
          {who && <span className="block truncate font-mono text-[11px] text-muted">{who}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

/** Two rows that drift in opposite directions. Pauses on hover and focus; static when motion is reduced. */
function Row({ items, reverse }: { items: PublicTestimonial[]; reverse?: boolean }) {
  const loop = items.length >= 3;
  const list = loop ? [...items, ...items] : items;
  return (
    <div className="group overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden motion-safe:overflow-hidden" data-lenis-prevent-wheel>
      <ul
        className={
          'flex w-max gap-5 px-5 ' +
          (loop && MOTION_ENABLED ? 'motion-safe:animate-[marquee_60s_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] ' : '') +
          (reverse ? '[animation-direction:reverse]' : '')
        }
      >
        {list.map((t, i) => (
          <li key={`${t.id}-${i}`} aria-hidden={i >= items.length || undefined}>
            <Card t={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const half = Math.ceil(testimonials.length / 2);
  const rowA = testimonials.length > 4 ? testimonials.slice(0, half) : testimonials;
  const rowB = testimonials.length > 4 ? testimonials.slice(half) : [];
  return (
    <section id="testimonials" aria-label="Testimonials" className="relative isolate scroll-mt-24 overflow-hidden py-20 md:py-28">
      <Glow spots={[['20%', '70%', 520], ['75%', '40%', 480]]} />
      <div className="px-5 sm:px-8">
        <Heading title="What clients say" lead="Words from people I have worked with." align="center" />
      </div>
      <div className="mt-12 flex flex-col gap-5">
        <Row items={rowA} />
        {rowB.length > 0 && <Row items={rowB} reverse />}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}
