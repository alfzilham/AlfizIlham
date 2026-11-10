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
        <span aria-hidden="true" className="pointer-events-none absolute top-10 left-1/2 -z-10 -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,106,26,0.35),rgba(255,106,26,0))] bg-clip-text font-sans text-[clamp(100px,18vw,260px)] leading-none font-light whitespace-nowrap text-transparent select-none">
          CONTACT
        </span>

        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-16">
          <Reveal className="flex flex-col gap-6 lg:pt-10">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-[clamp(36px,4.5vw,52px)] leading-[1.05] font-bold">Get in touch</h2>
              <p className="max-w-[40ch] text-muted">Have a project or an idea? Send a message, or reach me directly.</p>
            </div>
            <ul className="flex flex-col gap-3">
              <InfoRow icon={<Mail className="size-5" />} label="Email" value={PROFILE.email}>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label={copied ? 'Email address copied' : 'Copy email address'}
                  className="flex size-9 items-center justify-center rounded-full bg-fg text-bg transition-transform hover:scale-105"
                >
                  {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                </button>
                <span className="sr-only" aria-live="polite">
                  {copied ? 'Copied' : ''}
                </span>
              </InfoRow>
              <InfoRow icon={<Phone className="size-5" />} label="Phone" value={PROFILE.phone}>
                <a href={PROFILE.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="flex size-9 items-center justify-center rounded-full bg-fg text-bg transition-transform hover:scale-105">
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </InfoRow>
              <InfoRow icon={<MapPin className="size-5" />} label="Location" value={PROFILE.location} />
            </ul>
            <div className="grid grid-cols-2 gap-3">
              <SocialLink href={PROFILE.linkedin} icon={<LinkedinIcon className="size-[18px] text-accent" />} label="LinkedIn" />
              <SocialLink href={PROFILE.github} icon={<GithubIcon className="size-[18px] text-accent" />} label="GitHub" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="acc-surface rounded-[28px] p-5 sm:p-7">
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

      <section aria-label="Call to action" className="relative isolate overflow-hidden px-5 py-24 text-center sm:px-8 md:py-32">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(255,106,26,0.35),transparent_70%)]" />
        <Reveal className="mx-auto flex max-w-[720px] flex-col items-center gap-6">
          <h2 className="bg-[linear-gradient(180deg,#ffb347,#ff6a1a)] bg-clip-text font-sans text-[clamp(44px,7vw,84px)] leading-[1.02] font-medium tracking-[-0.03em] text-transparent">
            Have a project
            <br />
            in mind?
          </h2>
          <p className="text-muted">Open for freelance software, design and calligraphy work.</p>
          <a href="#contact" className="btn-grad inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5">
            Let&apos;s talk <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </Reveal>
      </section>
    </>
  );
}

function InfoRow({ icon, label, value, children }: { icon: React.ReactNode; label: string; value: string; children?: React.ReactNode }) {
  return (
    <li className="glass flex items-center gap-4 rounded-2xl p-3 pr-4">
      <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-xl btn-grad text-white">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted">{label}</span>
        <span className="truncate text-[15px] font-medium">{value}</span>
      </span>
      {children}
    </li>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="glass flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4 text-sm font-medium transition-transform hover:-translate-y-0.5">
      <span className="flex items-center gap-2.5">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <ArrowUpRight className="size-4 text-muted" aria-hidden="true" />
    </a>
  );
}
