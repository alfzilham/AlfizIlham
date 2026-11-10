import { Activity, Mail, MailOpen, Reply } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { emailConfigured } from '@/lib/email';
import { Kpi } from '@/components/dashboard/ui';
import { MessagesView } from '@/components/dashboard/messages-view';

export const metadata = { title: 'Messages' };

function hours(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

const PAGE_SIZE = 25;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ id?: string; filter?: string; q?: string; page?: string }> }) {
  const { id, filter, q: rawQ, page: rawPage } = await searchParams;
  const unreadOnly = filter === 'unread';
  const q = (rawQ ?? '').trim().slice(0, 80);
  const where: Prisma.MessageWhereInput = {
    ...(unreadOnly ? { read: false } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
            { service: { contains: q, mode: 'insensitive' } },
            { customService: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const filtered = await db.message.count({ where });
  const pages = Math.max(1, Math.ceil(filtered / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1));
  const [list, total, unread, replied, firstReplies] = await Promise.all([
    db.message.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.message.count(),
    db.message.count({ where: { read: false } }),
    db.message.count({ where: { replies: { some: { sentAt: { not: null } } } } }),
    db.message.findMany({
      where: { replies: { some: { sentAt: { not: null } } } },
      select: { createdAt: true, replies: { where: { sentAt: { not: null } }, orderBy: { sentAt: 'asc' }, take: 1, select: { sentAt: true } } },
      take: 200,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const selectedId = id ?? list[0]?.id;
  const selected = selectedId
    ? await db.message.findUnique({ where: { id: selectedId }, include: { replies: { orderBy: { createdAt: 'asc' } } } })
    : null;
  if (selected && id && !selected.read) {
    await db.message.update({ where: { id: selected.id }, data: { read: true } });
  }
  const draft = selected ? await db.setting.findUnique({ where: { key: `draft:${selected.id}` } }) : null;

  const gaps = firstReplies.map((m) => (m.replies[0]?.sentAt?.getTime() ?? 0) - m.createdAt.getTime()).filter((g) => g > 0);
  const avg = gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 0;

  return (
    <MessagesView
      unreadOnly={unreadOnly}
      explicit={Boolean(id)}
      q={q}
      page={page}
      pages={pages}
      total={filtered}
      emailReady={emailConfigured()}
      list={list.map((m) => ({ id: m.id, name: m.name, service: m.service === 'Other' && m.customService ? m.customService : m.service, preview: m.body.slice(0, 120), read: id && m.id === selected?.id ? true : m.read, createdAt: m.createdAt.toISOString() }))}
      selected={
        selected
          ? {
              id: selected.id,
              name: selected.name,
              email: selected.email,
              whatsapp: selected.whatsapp,
              service: selected.service === 'Other' && selected.customService ? `Other: ${selected.customService}` : selected.service,
              body: selected.body,
              createdAt: selected.createdAt.toISOString(),
              autoReplySentAt: selected.autoReplySentAt?.toISOString() ?? null,
              replies: selected.replies.map((r) => ({ id: r.id, body: r.body, sentAt: r.sentAt?.toISOString() ?? null, error: r.error, createdAt: r.createdAt.toISOString() })),
              draft: typeof draft?.value === 'string' ? draft.value : '',
            }
          : null
      }
      kpis={
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          <Kpi label="Total messages" value={String(total)} icon={<Mail />} />
          <Kpi label="Unread" value={String(Math.max(0, unread - (id && selected && !selected.read ? 1 : 0)))} icon={<MailOpen />} />
          <Kpi label="Replied" value={String(replied)} icon={<Reply />} />
          <Kpi label="Avg. response" value={avg ? hours(avg) : 'None yet'} icon={<Activity />} />
        </div>
      }
    />
  );
}
