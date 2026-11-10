import { NextResponse } from 'next/server';
import { getObject, storageConfigured } from '@/lib/storage';

export const runtime = 'nodejs';

// Streams a stored file when the bucket is not public (S3_PUBLIC_URL empty).
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const path = key.join('/');
  if (!storageConfigured() || !/^(projects|certificates)\/[\w./-]+$/.test(path) || path.includes('..')) {
    return new NextResponse('Not found', { status: 404 });
  }
  try {
    const obj = await getObject(path);
    if (!obj.Body) return new NextResponse('Not found', { status: 404 });
    const stream = obj.Body.transformToWebStream();
    return new NextResponse(stream as ReadableStream, {
      headers: {
        'content-type': obj.ContentType ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
        'content-disposition': 'inline',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
