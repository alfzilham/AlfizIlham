'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, CircleCheck, Copy, Mail, MapPin, Phone, Send } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/brand-icons';
import { PROFILE, SERVICE_OPTIONS } from '@/lib/content';
import { Field, TextArea } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { submitContact, type ContactState } from '@/app/(site)/actions';
import { Glow } from './primitives';

const EMPTY = { name: '', email: '', whatsapp: '', service: '', customService: '', message: '', company: '' };

export function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState<ContactState>({ status: 'idle' });
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const errors = state.status === 'error' ? state.errors ?? {} : {};

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await submitContact(form);
      setState(res);
      if (res.status === 'success') setForm(EMPTY);
    });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

  return (
    <>
      <section id="contact" aria-label="Contact" className="relative isolate scroll-mt-24 overflow-hidden px-5 py-20 sm:px-8 md:py-28">
        <Glow spots={[['25%', '60%', 520], ['80%', '30%', 480]]} />
        <span aria-hidden="true" className="pointer-events-none absolute top-[-0.06em] left-1/2 -z-10 -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,106,26,0.3)_0%,rgba(179,58,0,0.1)_55%,rgba(179,58,0,0)_100%)] bg-clip-text font-sans text-[clamp(96px,24vw,340px)] leading-none font-light whitespace-nowrap text-transparent uppercase select-none">
          CONTACT
        </span>

        <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-x-[clamp(32px,5vw,64px)] gap-y-10 pt-[clamp(24px,6vw,72px)]">
          <Reveal className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-[clamp(36px,4.5vw,52px)] leading-[1.05] font-bold">Get in touch</h2>
              <p className="max-w-[40ch] text-muted">Have a project or an idea? Send a message, or reach me directly.</p>
            </div>
            <ul className="flex flex-col gap-3">
              <InfoCard
                icon={<Mail className="size-5" />}
                label="Email"
                value={copied ? 'Copied to clipboard' : PROFILE.email}
                onClick={copyEmail}
                ariaLabel={copied ? 'Email address copied' : 'Copy email address'}
                action={copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              />
              <InfoCard
                icon={<Phone className="size-5" />}
                label="Phone"
                value={PROFILE.phone}
                href={`tel:${PROFILE.phone.replace(/[^+\d]/g, '')}`}
                ariaLabel={`Call ${PROFILE.phone}`}
                action={<ArrowUpRight className="size-4" aria-hidden="true" />}
              />
              <InfoCard
                icon={<MapPin className="size-5" />}
                label="Location"
                value={PROFILE.location}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PROFILE.location)}`}
                external
                ariaLabel={`Open ${PROFILE.location} in maps`}
                action={<ArrowUpRight className="size-4" aria-hidden="true" />}
              />
              <li className="sr-only" aria-live="polite">
                {copied ? 'Copied' : ''}
              </li>
            </ul>
            <div className="grid grid-cols-2 gap-3">
              <SocialLink href={PROFILE.linkedin} icon={<LinkedinIcon className="size-[18px] text-accent" />} label="LinkedIn" />
              <SocialLink href={PROFILE.github} icon={<GithubIcon className="size-[18px] text-accent" />} label="GitHub" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="acc-surface rounded-[28px] p-[clamp(24px,3vw,36px)] [&_.input-base]:bg-bg">
              <AnimatePresence mode="wait">
                {state.status === 'success' ? (
                  <motion.div key="ok" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                    <CircleCheck className="size-12 text-white" aria-hidden="true" />
                    <h3 className="font-display text-2xl font-bold text-white">Message sent</h3>
                    <p className="max-w-[34ch] text-white/85">
                      Thank you. I usually reply within a day.
                      {state.autoReply ? ' A confirmation is on its way to your inbox.' : ''}
                    </p>
                    <Button variant="light" onClick={() => setState({ status: 'idle' })}>
                      Send another message
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                    <Field label="Name" required autoComplete="name" placeholder="Your name" value={form.name} onChange={set('name')} error={errors.name} />
                    <Field label="Email" required type="email" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={set('email')} error={errors.email} />
                    <Field
                      label="WhatsApp number"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+62 812-3456-7890"
                      value={form.whatsapp}
                      onChange={set('whatsapp')}
                      error={errors.whatsapp}
                      hint="Optional, for a faster reply"
                    />
                    <Select
                      label="Service"
                      required
                      placeholder="Select a service"
                      value={form.service}
                      onChange={(v) => setForm((f) => ({ ...f, service: v }))}
                      options={SERVICE_OPTIONS.map((s) => ({ value: s, label: s }))}
                      error={errors.service}
                    />
                    <AnimatePresence initial={false}>
                      {form.service === 'Other' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <Field label="Custom service" required placeholder="Describe the service you need" value={form.customService} onChange={set('customService')} error={errors.customService} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <TextArea label="Message" required rows={5} placeholder="Tell me about your project" value={form.message} onChange={set('message')} error={errors.message} />
                    {/* Honeypot: hidden from people and assistive tech */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <label>
                        Company
                        <input tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} />
                      </label>
                    </div>
                    {state.status === 'error' && (
                      <p role="alert" className="rounded-xl bg-black/40 px-4 py-3 text-sm text-white">
                        {state.message}
                      </p>
                    )}
                    <Button type="submit" variant="light" size="lg" loading={pending} icon={!pending ? <Send className="size-4" aria-hidden="true" /> : undefined} className="mt-1 w-full">
                      {pending ? 'Sending' : 'Send message'}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="cta" aria-label="Call to action" className="relative isolate overflow-hidden bg-[radial-gradient(70%_55%_at_50%_100%,rgba(255,106,26,0.14),rgba(255,106,26,0)_70%),#060606]">
        <svg aria-hidden="true" viewBox="0 0 1600 760" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 -z-10 size-full">
          <defs>
            <linearGradient id="ctaGL" x1="0" y1="1" x2="0.6" y2="0">
              <stop offset="0" stopColor="#ffd9a8" />
              <stop offset="0.28" stopColor="#ff8a2a" />
              <stop offset="0.7" stopColor="#b33a00" stopOpacity="0.55" />
              <stop offset="1" stopColor="#b33a00" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ctaGR" x1="1" y1="1" x2="0.4" y2="0">
              <stop offset="0" stopColor="#ffd9a8" />
              <stop offset="0.28" stopColor="#ff8a2a" />
              <stop offset="0.7" stopColor="#b33a00" stopOpacity="0.55" />
              <stop offset="1" stopColor="#b33a00" stopOpacity="0" />
            </linearGradient>
            <filter id="ctaBlurL" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="26" />
            </filter>
            <filter id="ctaBlurS" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          {[
            { d: 'M 10 790 C 130 570 250 450 430 385', g: 'ctaGL' },
            { d: 'M 1590 790 C 1470 570 1350 450 1170 385', g: 'ctaGR' },
          ].map(({ d, g }) => (
            <g key={g}>
              <path d={d} fill="none" stroke={`url(#${g})`} strokeWidth="110" strokeLinecap="round" opacity="0.55" filter="url(#ctaBlurL)" />
              <path d={d} fill="none" stroke={`url(#${g})`} strokeWidth="26" strokeLinecap="round" opacity="0.9" filter="url(#ctaBlurS)" />
              <path d={d} fill="none" stroke={`url(#${g})`} strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
        </svg>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,#0a0a0a,rgba(10,10,10,0))]" />
        <Reveal className="mx-auto flex flex-col items-center gap-7 px-6 py-[clamp(96px,14vw,184px)] text-center">
          <h2 className="max-w-[14ch] bg-[linear-gradient(180deg,#ffb347_0%,#ff7a1f_42%,#e2531a_100%)] bg-clip-text pb-[0.08em] font-sans text-[clamp(40px,6.4vw,80px)] leading-[1.08] font-medium tracking-[-0.035em] text-balance text-transparent">
            Have a project in mind?
          </h2>
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-pretty text-fg/70">Open for freelance software, design and calligraphy work.</p>
          <a
            href={`mailto:${PROFILE.email}`}
            className="btn-grad inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-7 text-[15px] font-semibold whitespace-nowrap text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Let&apos;s talk <ArrowUpRight className="size-[18px]" aria-hidden="true" />
          </a>
        </Reveal>
      </section>
    </>
  );
}

const NOTCH_BG = 'radial-gradient(circle at 0 100%, transparent 16px, #0a0a0a 16.5px)';

/** Whole-card action with a cut-out corner holding a round button, matching the design. */
function InfoCard({
  icon,
  label,
  value,
  action,
  ariaLabel,
  href,
  external,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action: React.ReactNode;
  ariaLabel: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const cls =
    'glass relative flex min-h-[84px] w-full items-center gap-4 overflow-hidden rounded-[20px] py-4 pr-[68px] pl-5 text-left transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_rgba(255,106,26,0.7)] focus-visible:shadow-[inset_0_0_0_1px_rgba(255,106,26,0.7)]';
  const inner = (
    <>
      <span aria-hidden="true" className="btn-grad flex size-11 flex-none items-center justify-center rounded-xl text-white">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] text-muted">{label}</span>
        <span className="text-base font-medium [overflow-wrap:anywhere]">{value}</span>
      </span>
      <span aria-hidden="true" className="absolute top-0 right-0 h-12 w-14 rounded-bl-2xl bg-bg" />
      <span aria-hidden="true" className="absolute top-0 right-14 size-4" style={{ background: NOTCH_BG }} />
      <span aria-hidden="true" className="absolute top-12 right-0 size-4" style={{ background: NOTCH_BG }} />
      <span aria-hidden="true" className="absolute top-2 right-3 flex size-8 items-center justify-center rounded-full bg-fg text-bg">
        {action}
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a href={href} aria-label={ariaLabel} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {inner}
        </a>
      ) : (
        <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>
          {inner}
        </button>
      )}
    </li>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="glass flex min-h-16 items-center justify-between gap-3 rounded-2xl px-5 text-[15px] font-medium transition-transform hover:-translate-y-0.5">
      <span className="flex items-center gap-2.5">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <ArrowUpRight className="size-4 text-muted" aria-hidden="true" />
    </a>
  );
}
