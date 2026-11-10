'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentPasswordHash, endSession, requireAdmin, setPassword } from '@/lib/auth';
import { certificateSchema, fieldErrors, projectSchema, type CertificateInput, type ProjectInput } from '@/lib/validation';
import { ALLOWED_TYPES, deleteObject, newKey, presignUpload, publicUrl, storageConfigured } from '@/lib/storage';
import { fetchPreview } from '@/lib/preview';
import { generateKey } from '@/lib/api-keys';
import { emailConfigured, sendReply } from '@/lib/email';
import { saveSettings, type SiteSettings } from '@/lib/settings';

export type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string; errors?: Record<string, string> };

function refresh(publicSite = true) {
  if (publicSite) revalidatePath('/');
  revalidatePath('/dashboard', 'layout');
}

function failure(err: unknown, fallback: string): { ok: false; message: string } {
  console.error(fallback, err);
  return { ok: false, message: err instanceof Error && err.message ? err.message : fallback };
}

// ---------- Session ----------

export async function logout() {
  await endSession();
  redirect('/login');
}

// ---------- Uploads ----------

const uploadSchema = z.object({
  kind: z.enum(['projects', 'certificates']),
  contentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), 'Use a PNG, JPG, WEBP or PDF file'),
  size: z.number().int().positive(),
});

export async function createUploadUrl(input: z.input<typeof uploadSchema>): Promise<Result<{ uploadUrl: string; key: string; url: string }>> {
  await requireAdmin();
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid file' };
  const { kind, contentType, size } = parsed.data;
  const limit = kind === 'projects' ? 5 : 10;
  if (size > limit * 1024 * 1024) return { ok: false, message: `The file is larger than ${limit} MB.` };
  if (kind === 'projects' && contentType === 'application/pdf') return { ok: false, message: 'Use an image for the project preview.' };
  if (!storageConfigured()) return { ok: false, message: 'File storage is not configured yet. Add the S3 settings to the environment.' };
  try {
    const key = newKey(kind, contentType);
    const uploadUrl = await presignUpload(key, contentType);
    return { ok: true, uploadUrl, key, url: publicUrl(key) };
  } catch (err) {
    return failure(err, 'Could not prepare the upload.');
  }
}

// ---------- Projects ----------

export async function fetchProjectPreview(liveUrl: string): Promise<Result<{ url: string; key: string | null; source: 'og' | 'screenshot' }>> {
  await requireAdmin();
  try {
    const res = await fetchPreview(liveUrl);
    return { ok: true, ...res };
  } catch (err) {
    return failure(err, 'Could not fetch a preview for this link.');
  }
}

export async function saveProject(input: ProjectInput): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  const row = {
    title: data.title,
    description: data.description,
    techStack: Array.from(new Set(data.techStack)),
    liveUrl: data.liveUrl ?? null,
    githubUrl: data.githubUrl ?? null,
    imageUrl: data.imageUrl ?? null,
    imageKey: data.imageKey ?? null,
    imageSource: data.imageSource ?? null,
    status: data.status,
  };
  try {
    if (id) {
      const before = await db.project.findUnique({ where: { id }, select: { imageKey: true } });
      if (!before) return { ok: false, message: 'This project no longer exists.' };
      await db.project.update({ where: { id }, data: row });
      if (before.imageKey && before.imageKey !== row.imageKey) await deleteObject(before.imageKey);
      refresh();
      return { ok: true, id };
    }
    const last = await db.project.aggregate({ _max: { sortOrder: true } });
    const created = await db.project.create({ data: { ...row, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    refresh();
    return { ok: true, id: created.id };
  } catch (err) {
    return failure(err, 'Could not save the project.');
  }
}

export async function setProjectStatus(id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<Result> {
  await requireAdmin();
  try {
    await db.project.update({ where: { id }, data: { status } });
    refresh();
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not update the project.');
  }
}

export async function deleteProject(id: string): Promise<Result> {
  await requireAdmin();
  try {
    const p = await db.project.delete({ where: { id } });
    await deleteObject(p.imageKey);
    refresh();
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not delete the project.');
  }
}

// ---------- Certificates ----------

export async function addCategory(name: string): Promise<Result<{ category: { id: string; name: string } }>> {
  await requireAdmin();
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 40) return { ok: false, message: 'Use 2 to 40 characters.' };
  try {
    const existing = await db.category.findFirst({ where: { name: { equals: clean, mode: 'insensitive' } } });
    const category = existing ?? (await db.category.create({ data: { name: clean } }));
    revalidatePath('/dashboard/certificates');
    return { ok: true, category: { id: category.id, name: category.name } };
  } catch (err) {
    return failure(err, 'Could not add the category.');
  }
}

export async function saveCertificate(input: CertificateInput): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const parsed = certificateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  const row = { ...data, fileKey: data.fileKey ?? null };
  try {
    if (id) {
      const before = await db.certificate.findUnique({ where: { id }, select: { fileKey: true } });
      if (!before) return { ok: false, message: 'This certificate no longer exists.' };
      await db.certificate.update({ where: { id }, data: row });
      if (before.fileKey && before.fileKey !== row.fileKey) await deleteObject(before.fileKey);
      refresh();
      return { ok: true, id };
    }
    const created = await db.certificate.create({ data: row });
    refresh();
    return { ok: true, id: created.id };
  } catch (err) {
    return failure(err, 'Could not save the certificate.');
  }
}

export async function setCertificateStatus(id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<Result> {
  await requireAdmin();
  try {
    await db.certificate.update({ where: { id }, data: { status } });
    refresh();
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not update the certificate.');
  }
}

export async function deleteCertificate(id: string): Promise<Result> {
  await requireAdmin();
  try {
    const c = await db.certificate.delete({ where: { id } });
    await deleteObject(c.fileKey);
    refresh();
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not delete the certificate.');
  }
}

// ---------- Testimonials ----------

export async function setTestimonialStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING'): Promise<Result> {
  await requireAdmin();
  try {
    await db.testimonial.update({ where: { id }, data: { status } });
    refresh();
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not update the testimonial.');
  }
}

export async function deleteTestimonial(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.testimonial.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not delete the testimonial.');
  }
}

// ---------- Messages ----------

export async function markMessageRead(id: string, read = true): Promise<Result> {
  await requireAdmin();
  try {
    await db.message.update({ where: { id }, data: { read } });
    refresh(false);
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not update the message.');
  }
}

export async function markAllRead(): Promise<Result> {
  await requireAdmin();
  await db.message.updateMany({ where: { read: false }, data: { read: true } });
  refresh(false);
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.message.delete({ where: { id } });
    refresh(false);
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not delete the message.');
  }
}

export async function replyToMessage(id: string, body: string, draft = false): Promise<Result<{ sent: boolean }>> {
  await requireAdmin();
  const text = body.trim();
  if (text.length < 2) return { ok: false, message: 'Write a reply first.', errors: { reply: 'Write a reply first' } };
  if (text.length > 6000) return { ok: false, message: 'The reply is too long.', errors: { reply: 'Keep it under 6000 characters' } };
  const msg = await db.message.findUnique({ where: { id } });
  if (!msg) return { ok: false, message: 'This message no longer exists.' };

  if (draft) {
    await db.setting.upsert({ where: { key: `draft:${id}` }, update: { value: text }, create: { key: `draft:${id}`, value: text } });
    return { ok: true, sent: false };
  }
  if (!emailConfigured()) return { ok: false, message: 'EmailJS is not configured, so the reply cannot be sent yet.' };

  try {
    await sendReply({
      name: msg.name,
      email: msg.email,
      subject: `Re: ${msg.service === 'Other' && msg.customService ? msg.customService : msg.service}`,
      message: text,
      original: msg.body,
    });
    await db.reply.create({ data: { messageId: id, body: text, sentAt: new Date() } });
    await db.message.update({ where: { id }, data: { read: true } });
    await db.setting.deleteMany({ where: { key: `draft:${id}` } });
    refresh(false);
    return { ok: true, sent: true };
  } catch (err) {
    await db.reply.create({ data: { messageId: id, body: text, error: err instanceof Error ? err.message.slice(0, 300) : 'Unknown error' } });
    refresh(false);
    return failure(err, 'The reply could not be sent.');
  }
}

// ---------- Integrations ----------

export async function createApiKey(project: string): Promise<Result<{ key: string }>> {
  await requireAdmin();
  const name = project.trim();
  if (name.length < 2 || name.length > 60) return { ok: false, message: 'Name the project, 2 to 60 characters.', errors: { project: 'Name the project' } };
  const { key, prefix, hash } = generateKey();
  await db.apiKey.create({ data: { project: name, prefix, hash } });
  refresh(false);
  return { ok: true, key };
}

export async function revokeApiKey(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    refresh(false);
    return { ok: true };
  } catch (err) {
    return failure(err, 'Could not revoke the key.');
  }
}

// ---------- Settings ----------

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z.string().trim().min(2).max(40),
  email: z.string().trim().email(),
  location: z.string().trim().max(120),
});
const siteSchema = z.object({ title: z.string().trim().min(2).max(120), domain: z.string().trim().max(120) });
const notifySchema = z.object({ newMessage: z.boolean(), newFeedback: z.boolean() });

export async function saveSettingsSection<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]): Promise<Result> {
  await requireAdmin();
  const schema = key === 'profile' ? profileSchema : key === 'site' ? siteSchema : notifySchema;
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error) };
  await saveSettings(key, parsed.data as SiteSettings[K]);
  refresh(false);
  return { ok: true };
}

export async function changePassword(current: string, next: string): Promise<Result> {
  await requireAdmin();
  if (next.length < 10) return { ok: false, message: 'Use at least 10 characters.', errors: { next: 'Use at least 10 characters' } };
  const hash = await currentPasswordHash();
  if (!hash || !(await bcrypt.compare(current, hash))) return { ok: false, message: 'The current password is not correct.', errors: { current: 'Not correct' } };
  await setPassword(next);
  return { ok: true };
}
