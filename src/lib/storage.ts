import 'server-only';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

let client: S3Client | null = null;

export function storageConfigured() {
  return Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

function s3() {
  if (!storageConfigured()) throw new Error('Object storage is not configured. Set the S3_* variables.');
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || 'us-east-2',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

const bucket = () => process.env.S3_BUCKET!;

export function publicUrl(key: string) {
  const base = process.env.S3_PUBLIC_URL?.replace(/\/$/, '');
  return base ? `${base}/${key}` : `/api/files/${key}`;
}

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'application/pdf': 'pdf',
};

export const ALLOWED_TYPES = Object.keys(EXT);

export function newKey(folder: 'projects' | 'certificates' | 'avatars', contentType: string) {
  const ext = EXT[contentType] ?? 'bin';
  return `${folder}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
}

/** Signed URL the browser uses to PUT the file straight into the bucket. */
export async function presignUpload(key: string, contentType: string) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn: 600 });
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

export async function getObject(key: string) {
  return s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}

export async function deleteObject(key: string | null | undefined) {
  if (!key || !storageConfigured()) return;
  try {
    await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  } catch (err) {
    console.error('Could not delete object', key, err);
  }
}
