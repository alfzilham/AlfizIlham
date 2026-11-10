import 'server-only';

const ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

export function emailConfigured() {
  return Boolean(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY);
}

/**
 * Sends one EmailJS template from the server. Requires "Allow EmailJS API for
 * non-browser applications" in the EmailJS account security settings.
 */
export async function sendTemplate(templateId: string | undefined, params: Record<string, string>) {
  if (!emailConfigured()) throw new Error('EmailJS is not configured.');
  if (!templateId) throw new Error('EmailJS template ID is missing.');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: params,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EmailJS ${res.status}: ${text.slice(0, 200)}`);
  }
}

export async function sendAutoReply(to: { name: string; email: string; service: string }) {
  return sendTemplate(process.env.EMAILJS_AUTOREPLY_TEMPLATE_ID, {
    to_name: to.name,
    to_email: to.email,
    service: to.service,
    from_name: 'Alfiz Ilham',
    reply_to: process.env.ADMIN_NOTIFY_EMAIL ?? '',
  });
}

export async function sendReply(to: { name: string; email: string; subject: string; message: string; original: string }) {
  return sendTemplate(process.env.EMAILJS_REPLY_TEMPLATE_ID, {
    to_name: to.name,
    to_email: to.email,
    subject: to.subject,
    message: to.message,
    original_message: to.original,
    from_name: 'Alfiz Ilham',
    reply_to: process.env.ADMIN_NOTIFY_EMAIL ?? '',
  });
}

/** Optional notification to the site owner. Never throws. */
export async function notifyAdmin(subject: string, message: string) {
  const id = process.env.EMAILJS_NOTIFY_TEMPLATE_ID;
  const email = process.env.ADMIN_NOTIFY_EMAIL;
  if (!id || !email || !emailConfigured()) return;
  try {
    await sendTemplate(id, { to_email: email, to_name: 'Alfiz', subject, message });
  } catch (err) {
    console.error('Admin notification failed', err);
  }
}
