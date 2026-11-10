'use server';

import { db } from '@/lib/db';
import { contactSchema, fieldErrors } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { emailConfigured, notifyAdmin, sendAutoReply } from '@/lib/email';
import { getSettings } from '@/lib/settings';

export type ContactState =
  | { status: 'idle' }
  | { status: 'error'; message: string; errors?: Record<string, string> }
  | { status: 'success'; autoReply: boolean };

export async function submitContact(input: unknown): Promise<ContactState> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;
  if (data.service === 'Other' && !data.customService) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors: { customService: 'Describe the service you need' } };
  }

  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, 4, 10 * 60 * 1000)) {
    return { status: 'error', message: 'Too many messages in a short time. Please try again in a few minutes, or email me directly.' };
  }

  const serviceLabel = data.service === 'Other' ? `Other: ${data.customService}` : data.service;

  const message = await db.message.create({
    data: {
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      service: data.service,
      customService: data.service === 'Other' ? data.customService : null,
      body: data.message,
    },
  });

  let autoReply = false;
  if (emailConfigured()) {
    try {
      await sendAutoReply({ name: data.name, email: data.email, service: serviceLabel });
      await db.message.update({ where: { id: message.id }, data: { autoReplySentAt: new Date() } });
      autoReply = true;
    } catch (err) {
      console.error('Auto-reply failed', err);
    }
  }

  const settings = await getSettings().catch(() => null);
  if (settings?.notifications.newMessage) {
    await notifyAdmin(`New message from ${data.name}`, `${serviceLabel}\n\n${data.message}\n\nReply from the dashboard.`);
  }

  return { status: 'success', autoReply };
}

/** Counts a project or certificate view. One count per visitor per item per hour. */
export async function trackView(kind: 'project' | 'certificate', id: string) {
  if (typeof id !== 'string' || id.length > 40) return;
  const ip = await clientIp();
  if (!rateLimit(`view:${kind}:${id}:${ip}`, 1, 60 * 60 * 1000)) return;
  try {
    if (kind === 'project') await db.project.update({ where: { id, status: 'PUBLISHED' }, data: { views: { increment: 1 } } });
    else await db.certificate.update({ where: { id, status: 'PUBLISHED' }, data: { views: { increment: 1 } } });
  } catch {
    /* unknown id */
  }
}
