'use client';

import { createUploadUrl } from '@/app/dashboard/actions';

/** Uploads a file straight to the bucket with a presigned URL. Returns the stored key and URL. */
export async function uploadFile(file: File, kind: 'projects' | 'certificates' | 'avatars', onProgress?: (pct: number) => void) {
  const contentType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  const res = await createUploadUrl({ kind, contentType, size: file.size });
  if (!res.ok) throw new Error(res.message);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', res.uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}). Check the bucket CORS settings.`)));
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and the bucket CORS settings.'));
    xhr.send(file);
  });

  return { key: res.key, url: res.url };
}
