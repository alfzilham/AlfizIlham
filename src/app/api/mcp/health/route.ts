// Public reachability check for connected projects. No secrets, no auth.
// A client that gets 200 here but 401 on /api/mcp knows its key is the problem, not the network.
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SERVER_NAME, SERVER_VERSION, SUPPORTED_PROTOCOLS, TOOL_NAME } from '@/lib/mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let database = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = false;
  }
  return NextResponse.json(
    {
      ok: database,
      service: SERVER_NAME,
      version: SERVER_VERSION,
      database: database ? 'up' : 'down',
      protocols: SUPPORTED_PROTOCOLS,
      tools: [TOOL_NAME],
      auth: 'Bearer',
      time: new Date().toISOString(),
    },
    { status: database ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}
