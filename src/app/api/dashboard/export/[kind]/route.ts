import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { toCsv } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const day = () => new Date().toISOString().slice(0, 10);

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await getSession())) return new NextResponse('Unauthorized', { status: 401 });
  const { kind } = await params;
  const format = new URL(req.url).searchParams.get('format') === 'json' ? 'json' : 'csv';

  let name: string;
  let columns: string[];
  let rows: unknown[][];
  let json: unknown;

  if (kind === 'messages') {
    const list = await db.message.findMany({ orderBy: { createdAt: 'desc' }, include: { replies: { orderBy: { createdAt: 'asc' } } } });
    name = 'messages';
    columns = ['id', 'name', 'email', 'whatsapp', 'service', 'custom_service', 'message', 'read', 'replies_sent', 'received_at'];
    rows = list.map((m) => [m.id, m.name, m.email, m.whatsapp, m.service, m.customService, m.body, m.read, m.replies.filter((r) => r.sentAt).length, m.createdAt]);
    json = list.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      whatsapp: m.whatsapp,
      service: m.service,
      customService: m.customService,
      message: m.body,
      read: m.read,
      receivedAt: m.createdAt,
      replies: m.replies.map((r) => ({ body: r.body, sentAt: r.sentAt, error: r.error, createdAt: r.createdAt })),
    }));
  } else if (kind === 'testimonials') {
    const list = await db.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
    name = 'testimonials';
    columns = ['id', 'name', 'role', 'company', 'message', 'rating', 'project', 'source', 'status', 'received_at'];
    rows = list.map((t) => [t.id, t.name, t.role, t.company, t.message, t.rating, t.project, t.source, t.status, t.createdAt]);
    json = list.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      company: t.company,
      message: t.message,
      rating: t.rating,
      project: t.project,
      source: t.source,
      status: t.status,
      receivedAt: t.createdAt,
    }));
  } else {
    return new NextResponse('Not found', { status: 404 });
  }

  const headers = { 'cache-control': 'no-store', 'content-disposition': `attachment; filename="${name}-${day()}.${format}"` };
  if (format === 'json') {
    return new NextResponse(JSON.stringify(json, null, 2), { headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } });
  }
  return new NextResponse(toCsv(columns, rows), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8' } });
}
