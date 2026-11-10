'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Bell, Check, Copy, Database, Globe, Key, KeyRound, Link2, Lock, Mail, MapPin, Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Card, CardHead, Empty, Thumb } from './ui';
import { useFeedback } from './feedback';
import { changePassword, createApiKey, revokeApiKey, saveSettingsSection } from '@/app/dashboard/actions';
import { cn, initials, relativeDay } from '@/lib/utils';
import type { SiteSettings } from '@/lib/settings';

export const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'site', label: 'Site', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
] as const;
export type Tab = (typeof TABS)[number]['id'];

type Integrations = {
  endpoint: string;
  keys: { id: string; project: string; prefix: string; createdAt: string; lastUsedAt: string | null; revoked: boolean }[];
  ga: { connected: boolean; propertyId: string; measurementId: string };
  email: { connected: boolean; serviceId: string; autoReply: string; reply: string };
  storage: { connected: boolean; bucket: string };
};

export function SettingsView({ tab, settings, integrations }: { tab: Tab; settings: SiteSettings; integrations: Integrations }) {
  return (
    <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="!p-2 sm:!p-3">
        <nav aria-label="Settings sections">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => {
              const on = t.id === tab;
              return (
                <li key={t.id} className="flex-none">
                  <Link
                    href={`/dashboard/settings?tab=${t.id}`}
                    scroll={false}
                    aria-current={on ? 'page' : undefined}
                    className={cn('flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 text-sm font-medium whitespace-nowrap transition-colors', on ? 'btn-grad text-white' : 'text-muted hover:bg-white/5 hover:text-fg')}
                  >
                    <t.icon className="size-[18px]" aria-hidden="true" />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Card>
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
        {tab === 'profile' && <ProfileForm initial={settings.profile} />}
        {tab === 'site' && <SiteForm initial={settings.site} />}
        {tab === 'integrations' && <IntegrationsPanel data={integrations} />}
        {tab === 'notifications' && <NotificationsForm initial={settings.notifications} emailReady={integrations.email.connected} />}
        {tab === 'security' && <SecurityForm />}
      </div>
    </div>
  );
}

function useSave<K extends keyof SiteSettings>(key: K) {
  const { toast } = useFeedback();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = (value: SiteSettings[K]) =>
    start(async () => {
      const res = await saveSettingsSection(key, value);
      setErrors(res.ok ? {} : res.errors ?? {});
      toast(res.ok ? 'Changes saved' : res.message, res.ok ? 'ok' : 'error');
    });
  return { pending, errors, save };
}

function ProfileForm({ initial }: { initial: SiteSettings['profile'] }) {
  const [v, setV] = useState(initial);
  const { pending, errors, save } = useSave('profile');
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Card>
      <CardHead title="Profile" subtitle="Shown on the dashboard and in notifications" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(v);
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="btn-grad flex size-16 items-center justify-center rounded-full font-display text-xl font-bold text-white">
            {initials(v.fullName)}
          </span>
          <p className="text-sm text-muted">Your initials are used as the avatar.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" value={v.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="name" />
          <Field label="Username" value={v.username} onChange={set('username')} error={errors.username} hint="Display only. Sign in uses ADMIN_USERNAME." />
          <Field label="Email" type="email" icon={<Mail />} value={v.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <Field label="Location" icon={<MapPin />} value={v.location} onChange={set('location')} error={errors.location} />
        </div>
        <SaveRow pending={pending} onReset={() => setV(initial)} />
      </form>
    </Card>
  );
}

function SiteForm({ initial }: { initial: SiteSettings['site'] }) {
  const [v, setV] = useState(initial);
  const { pending, errors, save } = useSave('site');
  return (
    <Card>
      <CardHead title="Site" subtitle="Public details used across the portfolio" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(v);
        }}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Site title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} error={errors.title} />
          <Field label="Domain" icon={<Globe />} value={v.domain} onChange={(e) => setV({ ...v, domain: e.target.value })} error={errors.domain} hint="Used for the MCP endpoint when NEXT_PUBLIC_SITE_URL is empty." />
        </div>
        <SaveRow pending={pending} onReset={() => setV(initial)} />
      </form>
    </Card>
  );
}

function NotificationsForm({ initial, emailReady }: { initial: SiteSettings['notifications']; emailReady: boolean }) {
  const [v, setV] = useState(initial);
  const { pending, save } = useSave('notifications');
  const rows: { k: keyof typeof v; title: string; body: string }[] = [
    { k: 'newMessage', title: 'New contact message', body: 'Email me when someone sends the contact form.' },
    { k: 'newFeedback', title: 'New feedback', body: 'Email me when a connected project submits a testimonial.' },
  ];
  return (
    <Card>
      <CardHead title="Notifications" subtitle="Emails sent to ADMIN_NOTIFY_EMAIL through EmailJS" />
      {!emailReady && <p className="mb-4 text-sm text-warn">EmailJS is not configured, so these emails are not sent yet.</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(v);
        }}
        className="flex flex-col gap-2"
      >
        {rows.map((r) => (
          <label key={r.k} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-1 py-3">
            <span>
              <span className="block text-sm font-medium">{r.title}</span>
              <span className="mt-0.5 block text-[13px] text-muted">{r.body}</span>
            </span>
            <input type="checkbox" role="switch" checked={v[r.k]} onChange={(e) => setV({ ...v, [r.k]: e.target.checked })} className="peer sr-only" />
            <span
              aria-hidden="true"
              className={cn(
                'relative h-7 w-12 flex-none rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                v[r.k] ? 'btn-grad' : 'bg-white/10',
              )}
            >
              <span className={cn('absolute top-1 size-5 rounded-full bg-white transition-[left] duration-200', v[r.k] ? 'left-6' : 'left-1')} />
            </span>
          </label>
        ))}
        <SaveRow pending={pending} onReset={() => setV(initial)} />
      </form>
    </Card>
  );
}

function SecurityForm() {
  const { toast } = useFeedback();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardHead title="Security" subtitle="Change your password. The new password replaces the one from the environment." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (next !== confirmPw) return setErrors({ confirm: 'The passwords do not match' });
          start(async () => {
            const res = await changePassword(current, next);
            setErrors(res.ok ? {} : res.errors ?? {});
            toast(res.ok ? 'Password changed' : res.message, res.ok ? 'ok' : 'error');
            if (res.ok) {
              setCurrent('');
              setNext('');
              setConfirmPw('');
            }
          });
        }}
        className="flex flex-col gap-5"
      >
        <Field label="Current password" type="password" icon={<Lock />} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="New password" type="password" icon={<KeyRound />} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} hint="At least 10 characters." />
          <Field label="Confirm new password" type="password" icon={<KeyRound />} autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} error={errors.confirm} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={pending} disabled={!current || !next}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SaveRow({ pending, onReset }: { pending: boolean; onReset: () => void }) {
  return (
    <div className="flex justify-end gap-3 pt-1">
      <Button onClick={onReset}>Discard</Button>
      <Button type="submit" variant="primary" loading={pending} icon={<Check className="size-4" aria-hidden="true" />}>
        Save changes
      </Button>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={done ? 'Copied' : label}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="glass-soft flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
    >
      {done ? <Check className="size-4 text-ok" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
    </button>
  );
}

function Connected({ ok }: { ok: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[13px]', ok ? 'text-fg' : 'text-muted')}>
      <span aria-hidden="true" className={cn('size-2 rounded-full', ok ? 'bg-ok' : 'bg-white/25')} />
      {ok ? 'Connected' : 'Not configured'}
    </span>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-[13px] font-medium">{label}</span>
      <span className="input-base flex items-center truncate font-mono !text-sm text-muted">{value || 'Not set'}</span>
    </div>
  );
}

function IntegrationsPanel({ data }: { data: Integrations }) {
  const { toast, confirm } = useFeedback();
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const active = data.keys.filter((k) => !k.revoked);

  const create = () =>
    start(async () => {
      const res = await createApiKey(project);
      if (!res.ok) return setError(res.errors?.project ?? res.message);
      setCreated(res.key);
      setError('');
    });

  const revoke = async (k: Integrations['keys'][number]) => {
    if (!(await confirm({ title: `Revoke the key for ${k.project}?`, body: 'That project can no longer send feedback until you create a new key. Existing testimonials stay.', confirm: 'Revoke key', danger: true }))) return;
    const res = await revokeApiKey(k.id);
    toast(res.ok ? 'Key revoked' : res.message, res.ok ? 'ok' : 'error');
  };

  const closeModal = () => {
    setOpen(false);
    setProject('');
    setCreated(null);
    setError('');
  };

  const sample = `{
  "mcpServers": {
    "alfiz-feedback": {
      "type": "http",
      "url": "${data.endpoint}",
      "headers": { "Authorization": "Bearer ${created ?? 'mcp_live_your_key'}" }
    }
  }
}`;

  return (
    <>
      <Card>
        <CardHead
          title="MCP Server"
          subtitle="Let your other projects send feedback to this dashboard"
          right={
            <Button variant="primary" size="sm" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setOpen(true)}>
              Create API key
            </Button>
          }
        />
        <div className="flex flex-col gap-4">
          <Field label="Endpoint" readOnly value={data.endpoint} icon={<Link2 />} end={<CopyButton value={data.endpoint} label="Copy endpoint" />} className="font-mono" />
          <p className="text-[13px] leading-relaxed text-muted">
            Connected projects call the tool <code className="font-mono text-fg">submit_feedback</code> with name, role, company, message, rating and project, sending
            their key as <code className="font-mono text-fg">Authorization: Bearer</code>. Each submission waits for your approval.
          </p>
          {active.length === 0 && data.keys.length === 0 ? (
            <Empty icon={<Key />} title="No API keys yet" body="Create one key per project that should send feedback." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    <th scope="col" className="pb-3 font-normal">Project</th>
                    <th scope="col" className="pb-3 font-normal">API key</th>
                    <th scope="col" className="pb-3 font-normal">Created</th>
                    <th scope="col" className="pb-3 font-normal">Last used</th>
                    <th scope="col" className="pb-3 font-normal">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.keys.map((k) => (
                    <tr key={k.id} className={cn('border-t border-white/[0.07]', k.revoked && 'opacity-55')}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <Thumb size={40}>
                            <Key />
                          </Thumb>
                          <span>
                            <span className="block font-medium">{k.project}</span>
                            <span className="text-xs text-muted">{k.revoked ? 'Revoked' : 'Active'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-[13px]">{k.prefix}</td>
                      <td className="py-3 pr-4 text-muted">{relativeDay(k.createdAt)}</td>
                      <td className="py-3 pr-4 text-muted">{k.lastUsedAt ? relativeDay(k.lastUsedAt) : 'Never'}</td>
                      <td className="py-3 text-right">
                        {!k.revoked && (
                          <Button size="sm" icon={<Trash2 className="size-4" aria-hidden="true" />} onClick={() => revoke(k)} aria-label={`Revoke key for ${k.project}`}>
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHead title="Google Analytics" subtitle="Visitor data shown in Analytics" right={<Connected ok={data.ga.connected} />} />
        <div className="grid gap-5 sm:grid-cols-2">
          <ReadOnly label="GA4 property ID" value={data.ga.propertyId} />
          <ReadOnly label="Measurement ID" value={data.ga.measurementId} />
        </div>
        <p className="mt-4 text-[13px] text-muted">Set in the environment: GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY and NEXT_PUBLIC_GA_MEASUREMENT_ID.</p>
      </Card>

      <Card>
        <CardHead title="EmailJS" subtitle="Sends the auto-reply and your replies by email" right={<Connected ok={data.email.connected} />} />
        <div className="grid gap-5 sm:grid-cols-2">
          <ReadOnly label="Service ID" value={data.email.serviceId} />
          <ReadOnly label="Auto-reply template ID" value={data.email.autoReply} />
          <ReadOnly label="Reply template ID" value={data.email.reply} />
        </div>
        <p className="mt-4 text-[13px] text-muted">The public and private keys stay in the environment and are never shown here.</p>
      </Card>

      <Card>
        <CardHead title="File storage" subtitle="Project previews and certificate files" right={<Connected ok={data.storage.connected} />} />
        <div className="flex items-center gap-3 text-sm text-muted">
          <Database className="size-4 text-accent" aria-hidden="true" />
          {data.storage.bucket ? `Bucket: ${data.storage.bucket}` : 'Set the S3_* variables to enable uploads.'}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        persistent={Boolean(created)}
        title={created ? 'Copy your API key' : 'Create API key'}
        description={created ? 'This is the only time the full key is shown. Store it in the project as a secret.' : 'One key per project that sends feedback'}
        footer={
          <div className="flex justify-end gap-3">
            {created ? (
              <Button variant="primary" onClick={closeModal}>
                I saved the key
              </Button>
            ) : (
              <>
                <Button onClick={closeModal}>Cancel</Button>
                <Button variant="primary" loading={pending} onClick={create}>
                  Create key
                </Button>
              </>
            )}
          </div>
        }
      >
        {created ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-black/40 p-3 shadow-[inset_0_0_0_1px_rgba(255,106,26,0.5)]">
              <code className="min-w-0 flex-1 font-mono text-[13px] break-all">{created}</code>
              <CopyButton value={created} label="Copy API key" />
            </div>
            <p className="text-[13px] text-muted">Example client config for an MCP-capable project:</p>
            <pre className="overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-xs leading-relaxed text-fg/85">{sample}</pre>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <Field label="Project name" data-autofocus value={project} onChange={(e) => setProject(e.target.value)} placeholder="PusakaPosters" error={error} hint="Shown as the source of each testimonial." />
          </form>
        )}
      </Modal>
    </>
  );
}
