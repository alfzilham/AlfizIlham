'use client';

import { DIST, DUR_IN, DUR_OUT, EASE, MOTION_ENABLED, VIEWPORT } from '@/lib/motion';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, ImageIcon } from 'lucide-react';
import { GithubIcon } from '@/components/brand-icons';
import { PROFILE } from '@/lib/content';
import { Modal } from '@/components/ui/modal';
import { LinkButton } from '@/components/ui/button';
import { trackView } from '@/app/(site)/actions';
import { cn } from '@/lib/utils';
import { Heading, Section } from './primitives';

export type PublicProject = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
};

type Item = { kind: 'project'; p: PublicProject; n: number } | { kind: 'cta' };

const COLUMNS = 4;
const NOTCH_BG = 'radial-gradient(circle at 0 100%, transparent 24px, #0a0a0a 24.5px)';

/** Cut-out corner that holds the round arrow button, matching the design. */
function Notch() {
  return (
    <>
      <span aria-hidden="true" className="absolute top-0 right-0 z-[4] h-[84px] w-24 rounded-bl-[24px] bg-bg" />
      <span aria-hidden="true" className="absolute top-0 right-24 z-[4] size-6" style={{ background: NOTCH_BG }} />
      <span aria-hidden="true" className="absolute top-[84px] right-0 z-[4] size-6" style={{ background: NOTCH_BG }} />
    </>
  );
}

/** Round arrow button in the notch. Links out when the project has a URL, otherwise opens the details. */
function GoButton({ p, onOpen }: { p: PublicProject; onOpen: () => void }) {
  const href = p.liveUrl ?? p.githubUrl;
  const cls = 'pj-go absolute top-5 right-[26px] z-[5] flex size-11 items-center justify-center rounded-full bg-fg text-bg';
  const label = `Open ${p.title}`;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
      <ArrowUpRight className="size-5" aria-hidden="true" />
    </a>
  ) : (
    <button type="button" onClick={onOpen} aria-label={`${label}, details`} className={cls}>
      <ArrowUpRight className="size-5" aria-hidden="true" />
    </button>
  );
}

function Preview({ p, onOpen, className }: { p: PublicProject; onOpen: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View details of ${p.title}`}
      className={cn('relative flex cursor-zoom-in items-center justify-center overflow-hidden border-[1.5px] border-bg/20 bg-[#d6d3ce]', className)}
    >
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl} alt="" loading="lazy" className="absolute inset-0 size-full max-w-none object-cover object-top" />
      ) : (
        <span className="flex flex-col items-center gap-2 text-bg/70">
          <ImageIcon className="size-6" aria-hidden="true" />
          <span className="text-xs">No preview image</span>
        </span>
      )}
    </button>
  );
}

function ProjectCard({ p, n, compact, onOpen }: { p: PublicProject; n: number; compact?: boolean; onOpen: () => void }) {
  const num = String(n).padStart(2, '0');
  const body = (
    <>
      <h3
        className={cn(
          'font-display leading-[1.04] font-bold tracking-[-0.03em] text-balance text-bg uppercase [overflow-wrap:anywhere]',
          compact ? 'text-[clamp(22px,6vw,28px)]' : 'text-[clamp(18px,1.8vw,24px)]',
        )}
      >
        {p.title}
      </h3>
      <p className="line-clamp-4 text-sm leading-normal text-pretty text-bg/70">{p.description}</p>
    </>
  );

  if (compact) {
    return (
      <article className="relative mb-4 flex break-inside-avoid flex-col gap-4 overflow-hidden rounded-[28px] bg-fg p-6 text-bg">
        <Notch />
        <GoButton p={p} onOpen={onOpen} />
        <div aria-hidden="true" className="relative z-[2] flex h-14 items-center font-display text-[40px] leading-none font-bold tracking-[-0.03em]">
          {num}
        </div>
        <Preview p={p} onOpen={onOpen} className="mt-1 aspect-[16/10] w-full rounded-2xl" />
        <div className="flex flex-col gap-3">{body}</div>
      </article>
    );
  }

  return (
    <div className="pj-cell relative flow-root">
      <article className="pj relative flex flex-col overflow-hidden rounded-[28px] bg-fg px-6 pt-6 text-bg">
        <Notch />
        <GoButton p={p} onOpen={onOpen} />
        <div aria-hidden="true" className="relative z-[2] flex h-14 items-center font-display text-[40px] leading-none font-bold tracking-[-0.03em]">
          {num}
        </div>
        <div className="pj-zone relative z-[1] mt-3">
          <Preview p={p} onOpen={onOpen} className="pj-img absolute inset-x-0 bottom-0 h-full rounded-t-2xl border-b-0" />
        </div>
        <div className="relative z-[3] -mx-6 flex flex-col gap-3 bg-fg px-6 pt-5 pb-6">{body}</div>
      </article>
    </div>
  );
}

function CtaCard({ compact }: { compact?: boolean }) {
  const card = (
    <a
      href={PROFILE.github}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('pj-cta acc-surface relative flex min-h-[220px] flex-col justify-between gap-6 overflow-hidden rounded-[28px] p-6 text-white', compact && 'mb-4 break-inside-avoid')}
    >
      <Notch />
      <span aria-hidden="true" className="absolute top-5 right-[26px] z-[5] flex size-11 items-center justify-center rounded-full bg-fg text-bg">
        <span className="pj-cta-ic flex">
          <ArrowUpRight className="size-5" />
        </span>
      </span>
      <GithubIcon className="relative z-[2] size-10" aria-hidden="true" />
      <span className="relative z-[2] flex flex-col gap-2">
        <span className="font-display text-[clamp(22px,2vw,26px)] leading-[1.1] font-bold tracking-[-0.03em] uppercase">See all on GitHub</span>
        <span className="text-[13px] text-white/80">{PROFILE.githubLabel}</span>
      </span>
    </a>
  );
  return compact ? card : <div className="relative">{card}</div>;
}

export function Projects({ projects }: { projects: PublicProject[] }) {
  const [open, setOpen] = useState<PublicProject | null>(null);

  const show = (p: PublicProject) => {
    setOpen(p);
    void trackView('project', p.id);
  };

  const items: Item[] = [...projects.map((p, i) => ({ kind: 'project' as const, p, n: i + 1 })), { kind: 'cta' }];
  const columns: Item[][] = Array.from({ length: COLUMNS }, () => []);
  items.forEach((it, i) => columns[i % COLUMNS].push(it));

  const render = (it: Item, compact?: boolean) =>
    it.kind === 'cta' ? <CtaCard key="cta" compact={compact} /> : <ProjectCard key={it.p.id} p={it.p} n={it.n} compact={compact} onOpen={() => show(it.p)} />;

  return (
    <Section id="projects" label="Projects">
      <Heading title="Selected projects" lead={projects.length ? 'Live apps, tools and automations I have shipped.' : 'New work is on its way. Meanwhile, everything I build is on GitHub.'} />

      <motion.div
        {...(MOTION_ENABLED
          ? {
              initial: 'hidden',
              whileInView: 'show',
              viewport: VIEWPORT,
              variants: {
                hidden: { opacity: 0, y: DIST, transition: { duration: DUR_OUT, ease: EASE } },
                show: { opacity: 1, y: 0, transition: { duration: DUR_IN, ease: EASE } },
              },
            }
          : {})}
        className="mt-12"
      >
        {/* Wide: columns of cards that open on hover */}
        <div className="hidden items-start gap-4 min-[1100px]:flex">
          {columns.map((col, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-4">
              {col.map((it) => render(it))}
            </div>
          ))}
        </div>
        {/* Compact: flowing columns, no hover behaviour */}
        <div className="columns-[280px] gap-4 min-[1100px]:hidden">{items.map((it) => render(it, true))}</div>
      </motion.div>

      <div aria-hidden="true" className="pj-veil pointer-events-none absolute inset-0 z-10 bg-bg/55 opacity-0" />

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ''} size="xl">
        {open && (
          <div className="flex flex-col gap-5">
            {open.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.imageUrl} alt={`Preview of ${open.title}`} className="aspect-[16/9] w-full rounded-2xl object-cover shadow-[var(--gl-soft)]" />
            )}
            <p className="text-[15px] leading-relaxed text-fg/90 whitespace-pre-line">{open.description}</p>
            {open.techStack.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Tech stack">
                {open.techStack.map((t) => (
                  <li key={t} className="rounded-full bg-white/[0.08] px-3 py-1 text-[13px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                    {t}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-3">
              {open.liveUrl && (
                <LinkButton href={open.liveUrl} external variant="primary" icon={<ExternalLink className="size-4" aria-hidden="true" />}>
                  Visit live site
                </LinkButton>
              )}
              {open.githubUrl && (
                <LinkButton href={open.githubUrl} external variant="glass" icon={<GithubIcon className="size-4" aria-hidden="true" />}>
                  View code
                </LinkButton>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Section>
  );
}
