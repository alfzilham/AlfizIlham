// Remote MCP server (Streamable HTTP transport, JSON responses only).
// Connected projects call the tool `submit_feedback` with a per-project API key:
//   Authorization: Bearer mcp_live_...
// Reachability check without a key: GET /api/mcp/health
import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { findActiveKey } from '@/lib/api-keys';
import { feedbackSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/email';
import { getSettings } from '@/lib/settings';
import { SCOPE_FEEDBACK, SERVER_NAME, SERVER_VERSION, SUPPORTED_PROTOCOLS, TOOL_NAME, isRetryable, logRequest, type McpErrorCode } from '@/lib/mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOOL = {
  name: TOOL_NAME,
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
      avatar_url: {
        type: 'string',
        description: 'Optional public https URL of the client profile photo. Without it the portfolio shows the initials of the name.',
        maxLength: 500,
      },
      idempotency_key: {
        type: 'string',
        description: 'Optional unique key for this feedback (for example the feedback id in your own database). Retrying with the same key will not create a duplicate.',
        maxLength: 80,
      },
    },
    required: ['name', 'message', 'rating'],
    additionalProperties: false,
  },
};

type RpcRequest = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> };

const ok = (id: RpcRequest['id'], result: unknown) => NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
const fail = (id: RpcRequest['id'], code: number, message: string, kind: McpErrorCode, status = 200, headers?: Record<string, string>) =>
  NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message, data: { code: kind, retryable: isRetryable(kind) } } }, { status, headers });

function bearer(req: Request) {
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

async function handle(req: Request) {
  const started = Date.now();
  const key = await findActiveKey(bearer(req));
  if (!key) {
    return fail(null, -32001, 'Missing or revoked API key.', 'unauthorized', 401, { 'www-authenticate': 'Bearer' });
  }

  let method = 'unknown';
  const finish = (res: NextResponse, status: string, extra: { tool?: string; error?: string } = {}) => {
    after(() =>
      logRequest({ apiKeyId: key.id, project: key.project, method, tool: extra.tool, status, httpStatus: res.status, durationMs: Date.now() - started, error: extra.error }),
    );
    return res;
  };

  if (!(await rateLimit(`mcp:${key.id}`, 60, 60_000))) {
    return finish(fail(null, -32002, 'Too many requests, slow down.', 'rate_limited', 429, { 'retry-after': '60' }), 'rate_limited');
  }

  let body: RpcRequest;
  try {
    body = (await req.json()) as RpcRequest;
  } catch {
    return finish(fail(null, -32700, 'Parse error', 'parse_error', 400), 'parse_error');
  }
  if (Array.isArray(body)) return finish(fail(null, -32600, 'Batch requests are not supported.', 'invalid_request', 400), 'invalid_request');
  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') return finish(fail(null, -32600, 'Invalid request', 'invalid_request', 400), 'invalid_request');
  method = body.method;

  // Notifications (no id) get 202 with no body.
  if (body.id === undefined) {
    return new NextResponse(null, { status: 202 });
  }

  await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  const canSubmit = key.scopes.includes(SCOPE_FEEDBACK);

  switch (body.method) {
    case 'initialize': {
      const asked = String(body.params?.protocolVersion ?? '');
      return finish(
        ok(body.id, {
          protocolVersion: SUPPORTED_PROTOCOLS.includes(asked) ? asked : SUPPORTED_PROTOCOLS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: SERVER_NAME, title: 'Alfiz Ilham portfolio feedback', version: SERVER_VERSION },
          instructions: 'Use submit_feedback to send a client testimonial. Each submission waits for approval in the dashboard.',
        }),
        'ok',
      );
    }
    case 'ping':
      return finish(ok(body.id, {}), 'ok');
    case 'tools/list':
      return finish(ok(body.id, { tools: canSubmit ? [TOOL] : [] }), 'ok');
    case 'tools/call': {
      const name = body.params?.name;
      if (name !== TOOL.name) {
        return finish(fail(body.id, -32602, `Unknown tool: ${String(name)}`, 'invalid_params'), 'invalid_params', { error: `Unknown tool: ${String(name)}` });
      }
      if (!canSubmit) {
        return finish(fail(body.id, -32003, 'This API key is not allowed to submit feedback.', 'forbidden_scope', 403), 'forbidden_scope', { tool: TOOL.name });
      }
      const parsed = feedbackSchema.safeParse(body.params?.arguments ?? {});
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
        const text = `Invalid feedback: ${issues.map((i) => `${i.field}: ${i.message}`).join('; ')}`;
        return finish(
          ok(body.id, { isError: true, content: [{ type: 'text', text }], structuredContent: { code: 'invalid_params', retryable: false, issues } }),
          'invalid_params',
          { tool: TOOL.name, error: text },
        );
      }
      const { idempotency_key: idemKey, avatar_url: avatarUrl, ...fields } = parsed.data;
      const duplicate = (d: { id: string; status: string }) =>
        finish(
          ok(body.id, {
            content: [{ type: 'text', text: `Feedback ${d.id} was already received (duplicate ignored).` }],
            structuredContent: { id: d.id, status: d.status.toLowerCase(), duplicate: true },
          }),
          'ok',
          { tool: TOOL.name },
        );
      if (idemKey) {
        const existing = await db.testimonial.findFirst({ where: { apiKeyId: key.id, idempotencyKey: idemKey } });
        if (existing) return duplicate(existing);
      }
      let t;
      try {
        t = await db.testimonial.create({
          data: { ...fields, avatarUrl: avatarUrl ?? null, idempotencyKey: idemKey ?? null, source: key.project, apiKeyId: key.id, status: 'PENDING' },
        });
      } catch (err) {
        // Re-check in case a concurrent retry with the same key was just stored.
        const dup = idemKey ? await db.testimonial.findFirst({ where: { apiKeyId: key.id, idempotencyKey: idemKey } }) : null;
        if (!dup) throw err;
        return duplicate(dup);
      }
      revalidatePath('/dashboard', 'layout');
      const settings = await getSettings().catch(() => null);
      if (settings?.notifications.newFeedback) {
        await notifyAdmin(`New feedback from ${t.name} via ${key.project}`, `${t.rating}/5\n\n${t.message}\n\nApprove it in the dashboard.`);
      }
      return finish(
        ok(body.id, {
          content: [{ type: 'text', text: `Thank you. Feedback ${t.id} was received and is waiting for approval.` }],
          structuredContent: { id: t.id, status: 'pending' },
        }),
        'ok',
        { tool: TOOL.name },
      );
    }
    default:
      return finish(fail(body.id, -32601, `Method not found: ${body.method}`, 'method_not_found'), 'method_not_found', { error: `Method not found: ${body.method}` });
  }
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error('MCP request failed', err);
    return fail(null, -32603, 'Internal error, please retry.', 'internal', 500, { 'retry-after': '5' });
  }
}

export async function GET() {
  return new NextResponse('This MCP server uses POST only. Health check: /api/mcp/health', { status: 405, headers: { allow: 'POST' } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { allow: 'POST' } });
}
