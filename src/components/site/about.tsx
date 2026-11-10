import { Download, Heart, Languages, Laptop, MapPin, Tent, Users } from 'lucide-react';
import { ACTIVITIES, PROFILE } from '@/lib/content';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal';
import { Section } from './primitives';

const ICONS = { users: Users, tent: Tent, heart: Heart };

function DownloadButton({ href, label, hint, primary }: { href: string; label: string; hint: string; primary?: boolean }) {
  return (
    <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2">
      <a
        href={href}
        download
        aria-label={`${label}, ${hint}`}
        className={
          'inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 ' +
          (primary ? 'btn-grad text-white' : 'glass text-fg')
        }
      >
        <Download className={primary ? 'size-[18px]' : 'size-[18px] text-accent'} aria-hidden="true" />
        {label}
      </a>
      <span className="text-center text-[13px] text-muted">{hint}</span>
    </div>
  );
}

export function About() {
  return (
    <Section id="about" label="About">
      <div className="flex flex-col gap-12">
        <Reveal>
          <h2 className="max-w-[18ch] font-display text-[clamp(36px,5vw,56px)] leading-[1.05] font-bold tracking-[-0.02em]">
            Code first, with a designer&apos;s eye
          </h2>
        </Reveal>
        <div className="flex flex-wrap gap-x-16 gap-y-10">
          <Reveal className="flex min-w-0 flex-[1.1_1_360px] flex-col gap-5">
            <p className="text-lg leading-relaxed text-fg">
              I&apos;m a Computer Engineering student at Universitas Syiah Kuala and a fullstack developer who builds AI directly into products.
              I&apos;ve shipped 10+ live web and mobile apps with React, Next.js, Flutter, Node.js, Python and PostgreSQL, including AI automation
              with n8n and the OpenRouter API.
            </p>
            <p className="text-base leading-relaxed text-muted">
              Alongside code, I bring 4 years of freelance design and calligraphy work, over 500 commissions, with strong deadline discipline and
              clear client communication.
            </p>
            <div className="flex max-w-[520px] flex-wrap gap-4 pt-2">
              <DownloadButton href={PROFILE.cv} label="Download CV" hint="PDF, 2 pages, full details" primary />
              <DownloadButton href={PROFILE.resume} label="Download Resume" hint="PDF, 1 page, summary" />
            </div>
            <ul className="flex flex-col gap-3.5 pt-3 text-[15px]">
              <li className="flex items-center gap-3">
                <MapPin className="size-5 text-accent" aria-hidden="true" /> {PROFILE.location}
              </li>
              <li className="flex items-center gap-3">
                <Laptop className="size-5 text-accent" aria-hidden="true" /> Working remotely
              </li>
              <li className="flex items-center gap-3">
                <Languages className="size-5 text-accent" aria-hidden="true" /> Indonesian (native), English and Arabic (intermediate)
              </li>
            </ul>
          </Reveal>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <Reveal>
              <h3 className="font-display text-xl font-bold">Beyond code</h3>
            </Reveal>
            <RevealGroup className="flex flex-col">
              {ACTIVITIES.map((a) => {
                const Icon = ICONS[a.icon];
                return (
                  <RevealItem key={a.title} className="flex gap-4 border-b border-line py-5 first:pt-0 last:border-0">
                    <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-accent/12 text-accent">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <h4 className="font-display text-lg font-bold">{a.title}</h4>
                      <p className="text-sm leading-relaxed text-muted">{a.body}</p>
                    </div>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>
        </div>
      </div>
    </Section>
  );
}
