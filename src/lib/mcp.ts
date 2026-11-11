import 'server-only';
import { db } from './db';

export const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
export const SERVER_NAME = 'alfiz-portfolio-feedback';
export const SERVER_VERSION = '1.1.0';
export const TOOL_NAME = 'submit_feedback';
export const SCOPE_FEEDBACK = 'feedback:write';
const LOG_RETENTION_DAYS = 30;

/** Machine-readable reason sent in error.data.code, so clients can tell failures apart. */
export type McpErrorCode =
  | 'unauthorized'
  | 'forbidden_scope'
  | 'rate_limited'
  | 'parse_error'
  | 'invalid_request'
  | 'method_not_found'
  | 'invalid_params'
  | 'internal';

const RETRYABLE: Record<McpErrorCode, boolean> = {
  unauthorized: false,
  forbidden_scope: false,
  rate_limited: true,
  parse_error: false,
  invalid_request: false,
  method_not_found: false,
  invalid_params: false,
  internal: true,
};

export const isRetryable = (code: McpErrorCode) => RETRYABLE[code];

type LogEntry = {
  apiKeyId: string;
  project: string;
  method: string;
  tool?: string;
  status: string;
  httpStatus: number;
  durationMs: number;
  error?: string;
};

/** Best-effort request log. Never throws, so logging cannot break a request. */
export async function logRequest(entry: LogEntry) {
  try {
    await db.mcpLog.create({
      data: { ...entry, tool: entry.tool ?? null, error: entry.error?.slice(0, 300) ?? null },
    });
    if (Math.random() < 0.02) {
      await db.mcpLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - LOG_RETENTION_DAYS * 86_400_000) } } });
    }
  } catch (err) {
    console.error('Could not write MCP log', err);
  }
}
