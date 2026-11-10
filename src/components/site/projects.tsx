'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, ImageIcon } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/brand-icons';
import { PROFILE } from '@/lib/content';
import { Modal } from '@/components/ui/modal';
import { LinkButton } from '@/components/ui/button';
import { trackView } from '@/app/(site)/actions';
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

const cardMotion = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px -10% 0px' },
};

/** Card with a cut-out corner that holds the arrow, matching the design. */
function Notch({ dark }: { dark?: boolean }) {
  return (
    <span aria-hidden="true" className="absolute top-0 right-0 flex h-14 w-16 items-start justify-end rounded-bl-[18px] bg-bg pt-0 pr-0">
      <span className={`m-2 flex size-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45 ${dark ? 'bg-fg text-bg' : 'bg-fg text-bg'}`}>
        <ArrowUpRight className="size-[18px]" />
      </span>
    </span>
  );
}

export function Projects({ projects }: { projects: PublicProject[] }) {
  const [open, setOpen] = useState<PublicProject | null>(null);

  const show = (p: PublicProject) => {
    setOpen(p);
    void trackView('project', p.id);
  };

  return (
    <Section id="projects" label="Projects">
      <Heading title="Selected projects" lead={projects.length ? 'Live apps, tools and automations I have shipped.' : 'New work is on its way. Meanwhile, everything I build is on GitHub.'} />

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {projects.map((p, i) => (
          <motion.li key={p.id} {...cardMotion} transition={{ duration: 0.6, delay: (i % 4) * 0.06 }}>
            <button
              type="button"
              onClick={() => show(p)}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-[22px] bg-fg p-4 pt-16 text-left text-bg transition-transform duration-300 hover:-translate-y-1"
              aria-label={`${p.title}, open details`}
            >
              <Notch />
              <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#d9d6d0]">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                ) : (
                  <span className="flex size-full items-center justify-center text-[#8a857c]">
                    <ImageIcon className="size-6" aria-hidden="true" />
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-display text-xl leading-tight font-extrabold uppercase">{p.title}</h3>
              <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-[#4a4a4a]">{p.description}</p>
            </button>
          </motion.li>
        ))}

        <motion.li {...cardMotion} transition={{ duration: 0.6, delay: (projects.length % 4) * 0.06 }}>
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="group acc-surface relative flex h-full min-h-[220px] flex-col justify-end overflow-hidden rounded-[22px] p-5 pt-16 text-white transition-transform duration-300 hover:-translate-y-1"
          >
            <Notch dark />
            <GithubIcon className="absolute top-5 left-5 size-8" aria-hidden="true" />
            <span className="font-display text-2xl leading-tight font-extrabold uppercase">See all on GitHub</span>
            <span className="mt-2 font-mono text-xs text-white/80">{PROFILE.githubLabel}</span>
          </a>
        </motion.li>
      </ul>

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
