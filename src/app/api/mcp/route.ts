// Remote MCP server (Streamable HTTP transport, JSON responses only).
// Connected projects call the tool `submit_feedback` with a per-project API key:
//   Authorization: Bearer mcp_live_...
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { findActiveKey } from '@/lib/api-keys';
import { feedbackSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/email';
import { getSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPPORTED = ['2025-06-18', '2025-03-26', '2024-11-05'];

const TOOL = {
  name: 'submit_feedback',
  title: 'Submit client feedback',
  description:
    'Send a testimonial from a client of the connected project to Alfiz Ilham. It is stored as pending and appears on the portfolio only after approval.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Client name', maxLength: 80 },
      role: { type: 'string', description: 'Client role or job title', maxLength: 80 },
      company: { type: 'string', description: 'Client company', maxLength: 80 },
      message: { type: 'string', description: 'The feedback in the client words', minLength: 5, maxLength: 1500 },
      rating: { type: 'integer', minimum: 1, maximum: 5, description: 'Rating from 1 to 5' },
      project: { type: 'string', description: 'Name of the project the feedback is about', maxLength: 120 },
    },
    required: ['name', 'message', 'rating'],
    additionalProperties: false,
  },
};

type RpcRequest = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> };

const ok = (id: RpcRequest['id'], result: unknown) => NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
const fail = (id: RpcRequest['id'], code: number, message: string, status = 200) =>
  NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, { status });

function bearer(req: Request) {
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

export async function POST(req: Request) {
  const key = await findActiveKey(bearer(req));
  if (!key) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Missing or revoked API key.' } },
      { status: 401, headers: { 'www-authenticate': 'Bearer' } },
    );
  }
  if (!rateLimit(`mcp:${key.id}`, 60, 60_000)) return fail(null, -32002, 'Too many requests, slow down.', 429);

  let body: RpcRequest;
  try {
    body = (await req.json()) as RpcRequest;
  } catch {
    return fail(null, -32700, 'Parse error', 400);
  }
  if (Array.isArray(body)) return fail(null, -32600, 'Batch requests are not supported.', 400);
  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') return fail(null, -32600, 'Invalid request', 400);

  // Notifications (no id) get 202 with no body.
  if (body.id === undefined) {
    return new NextResponse(null, { status: 202 });
  }

  await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });

  switch (body.method) {
    case 'initialize': {
      const asked = String(body.params?.protocolVersion ?? '');
      return ok(body.id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'alfiz-portfolio-feedback', title: 'Alfiz Ilham portfolio feedback', version: '1.0.0' },
        instructions: 'Use submit_feedback to send a client testimonial. Each submission waits for approval in the dashboard.',
      });
    }
    case 'ping':
      return ok(body.id, {});
    case 'tools/list':
      return ok(body.id, { tools: [TOOL] });
    case 'tools/call': {
      const name = body.params?.name;
      if (name !== TOOL.name) return fail(body.id, -32602, `Unknown tool: ${String(name)}`);
      const parsed = feedbackSchema.safeParse(body.params?.arguments ?? {});
      if (!parsed.success) {
        return ok(body.id, {
          isError: true,
          content: [{ type: 'text', text: `Invalid feedback: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` }],
        });
      }
      const t = await db.testimonial.create({
        data: { ...parsed.data, source: key.project, apiKeyId: key.id, status: 'PENDING' },
      });
      revalidatePath('/dashboard', 'layout');
      const settings = await getSettings().catch(() => null);
      if (settings?.notifications.newFeedback) {
        await notifyAdmin(`New feedback from ${t.name} via ${key.project}`, `${t.rating}/5\n\n${t.message}\n\nApprove it in the dashboard.`);
      }
      return ok(body.id, {
        content: [{ type: 'text', text: `Thank you. Feedback ${t.id} was received and is waiting for approval.` }],
        structuredContent: { id: t.id, status: 'pending' },
      });
    }
    default:
      return fail(body.id, -32601, `Method not found: ${body.method}`);
  }
}

export async function GET() {
  return new NextResponse('This MCP server uses POST only.', { status: 405, headers: { allow: 'POST' } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { allow: 'POST' } });
}
