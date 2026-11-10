'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowLeft, Check, CheckCheck, Download, Inbox, Mail, MailX, Send, Trash2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/field';
import { Card, CardHead, Empty, PageTitle, TabLinks } from './ui';
import { RowMenu } from './row-menu';
import { useFeedback } from './feedback';
import { deleteMessage, markAllRead, markMessageRead, replyToMessage } from '@/app/dashboard/actions';
import { cn, formatTime, relativeDay } from '@/lib/utils';

type Item = { id: string; name: string; service: string; preview: string; read: boolean; createdAt: string };
type Selected = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  service: string;
  body: string;
  createdAt: string;
  autoReplySentAt: string | null;
  replies: { id: string; body: string; sentAt: string | null; error: string | null; createdAt: string }[];
  draft: string;
};

function when(d: string) {
  const day = relativeDay(d);
  return day === 'Today' ? formatTime(d) : day;
}

export function MessagesView({
  list,
  selected,
  kpis,
  unreadOnly,
  emailReady,
  explicit,
}: {
  list: Item[];
  selected: Selected | null;
  kpis: React.ReactNode;
  unreadOnly: boolean;
  emailReady: boolean;
  explicit: boolean;
}) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [pending, start] = useTransition();
  const base = unreadOnly ? '/dashboard/messages?filter=unread&' : '/dashboard/messages?';

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['name,service,preview,received', ...list.map((m) => [m.name, m.service, m.preview, m.createdAt].map(esc).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Messages"
        subtitle="Inquiries sent through the contact form."
        actions={
          <>
            <Button
              icon={<CheckCheck className="size-4" aria-hidden="true" />}
              loading={pending}
              onClick={() =>
                start(async () => {
                  await markAllRead();
                  toast('All messages marked as read');
                })
              }
            >
              Mark all read
            </Button>
            <Button icon={<Download className="size-4" aria-hidden="true" />} onClick={exportCsv} disabled={!list.length}>
              Export
            </Button>
          </>
        }
      />
      {kpis}

      {!emailReady && (
        <p role="note" className="flex items-start gap-3 rounded-2xl bg-warn/10 px-4 py-3 text-sm text-warn">
          <TriangleAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
          EmailJS is not configured, so auto-replies and replies from here are not sent. Messages are still saved.
        </p>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className={cn('!p-4 sm:!p-5', explicit && 'hidden lg:block')}>
          <CardHead
            title="Inbox"
            subtitle={`${list.filter((m) => !m.read).length} unread`}
            right={
              <TabLinks
                label="Inbox filter"
                active={unreadOnly ? 'unread' : 'all'}
                items={[
                  { key: 'all', label: 'All', href: '/dashboard/messages' },
                  { key: 'unread', label: 'Unread', href: '/dashboard/messages?filter=unread' },
                ]}
              />
            }
          />
          {list.length === 0 ? (
            <Empty icon={<Inbox />} title={unreadOnly ? 'No unread messages' : 'No messages yet'} body="Messages sent through the contact form show up here." />
          ) : (
            <ul className="-mx-2 flex max-h-[640px] flex-col overflow-y-auto" data-lenis-prevent>
              {list.map((m) => {
                const on = m.id === selected?.id;
                return (
                  <li key={m.id}>
                    <Link
                      href={`${base}id=${m.id}`}
                      scroll={false}
                      aria-current={on ? 'true' : undefined}
                      className={cn('flex gap-3 rounded-2xl px-3 py-3.5 transition-colors', on ? 'bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]' : 'hover:bg-white/[0.04]')}
                    >
                      <span aria-hidden="true" className={cn('mt-1.5 size-2 flex-none rounded-full', m.read ? 'bg-transparent' : 'bg-accent')} />
                      <span className="min-w-0 flex-1">
                        <span className="flex justify-between gap-2">
                          <span className={cn('truncate text-sm', m.read ? 'font-medium' : 'font-semibold')}>
                            {!m.read && <span className="sr-only">Unread: </span>}
                            {m.service}
                          </span>
                          <span className="flex-none text-xs text-muted">{when(m.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 block text-[13px] text-muted">{m.name}</span>
                        <span className="mt-1 block truncate text-[13px] text-muted">{m.preview}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {selected ? (
          <div className={cn(!explicit && 'hidden lg:block')}>
          <Detail key={selected.id} m={selected} emailReady={emailReady} backHref={unreadOnly ? '/dashboard/messages?filter=unread' : '/dashboard/messages'} onDeleted={() => router.push('/dashboard/messages')} confirm={confirm} toast={toast} />
          </div>
        ) : (
          <Card className="hidden lg:block">
            <Empty icon={<Mail />} title="Select a message" body="Pick a message from the inbox to read and reply." />
          </Card>
        )}
      </div>
    </div>
  );
}

function Detail({
  m,
  emailReady,
  backHref,
  onDeleted,
  confirm,
  toast,
}: {
  m: Selected;
  emailReady: boolean;
  backHref: string;
  onDeleted: () => void;
  confirm: ReturnType<typeof useFeedback>['confirm'];
  toast: ReturnType<typeof useFeedback>['toast'];
}) {
  const [reply, setReply] = useState(m.draft);
  const [error, setError] = useState('');
  const [sending, startSend] = useTransition();
  const [saving, startSave] = useTransition();

  const send = (draft: boolean) =>
    (draft ? startSave : startSend)(async () => {
      setError('');
      const res = await replyToMessage(m.id, reply, draft);
      if (!res.ok) {
        setError(res.errors?.reply ?? res.message);
        if (!draft) toast(res.message, 'error');
        return;
      }
      if (res.sent) {
        setReply('');
        toast(`Reply sent to ${m.email}`);
      } else toast('Draft saved');
    });

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={backHref} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg lg:hidden">
            <ArrowLeft className="size-4" aria-hidden="true" /> Inbox
          </Link>
          <h2 className="font-display text-[22px] leading-tight font-bold">{m.service}</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            {m.name}, {when(m.createdAt)}
          </p>
        </div>
        <RowMenu
          label="Message actions"
          items={[
            {
              label: 'Mark as unread',
              icon: <MailX />,
              onSelect: async () => {
                await markMessageRead(m.id, false);
                toast('Marked as unread');
              },
            },
            {
              label: 'Delete',
              icon: <Trash2 />,
              danger: true,
              onSelect: async () => {
                if (!(await confirm({ title: 'Delete this message?', body: `The message from ${m.name} and its replies are removed for good.`, confirm: 'Delete', danger: true }))) return;
                const res = await deleteMessage(m.id);
                if (res.ok) {
                  toast('Message deleted');
                  onDeleted();
                } else toast(res.message, 'error');
              },
            },
          ]}
        />
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3.5 rounded-2xl bg-black/30 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:grid-cols-2">
        {[
          ['Email', <a key="e" href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>],
          ['WhatsApp', m.whatsapp ? <a key="w" href={`https://wa.me/${m.whatsapp.replace(/[^\d]/g, '').replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{m.whatsapp}</a> : 'Not given'],
          ['Service', m.service],
          ['Received', `${relativeDay(m.createdAt)}, ${formatTime(m.createdAt)}`],
        ].map(([k, v]) => (
          <div key={String(k)} className="min-w-0">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-0.5 text-sm break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {m.autoReplySentAt && (
        <p className="mt-3.5 flex items-center gap-2 text-[13px] text-muted">
          <Check className="size-3.5 text-ok" aria-hidden="true" />
          Auto-reply sent to the client at {formatTime(m.autoReplySentAt)}
        </p>
      )}

      <div className="mt-5 border-t border-white/[0.08] pt-5 text-[15px] leading-relaxed whitespace-pre-line text-fg/90">{m.body}</div>

      {m.replies.length > 0 && (
        <ol className="mt-6 flex flex-col gap-3" aria-label="Your replies">
          {m.replies.map((r) => (
            <li key={r.id} className={cn('rounded-2xl p-4 text-sm', r.sentAt ? 'glass-tint' : 'bg-bad/10')}>
              <p className="mb-1.5 text-xs text-muted">{r.sentAt ? `You replied, ${relativeDay(r.sentAt).toLowerCase()} at ${formatTime(r.sentAt)}` : `Not sent: ${r.error ?? 'unknown error'}`}</p>
              <p className="whitespace-pre-line">{r.body}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-7">
        <TextArea label="Reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" error={error} hint={`Your reply is sent to ${m.email} by email.`} />
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button onClick={() => send(true)} loading={saving} disabled={!reply.trim()}>
          Save draft
        </Button>
        <Button variant="primary" onClick={() => send(false)} loading={sending} disabled={!reply.trim() || !emailReady} icon={<Send className="size-4" aria-hidden="true" />}>
          Send reply
        </Button>
      </div>
    </Card>
  );
}
