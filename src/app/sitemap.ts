import type { MetadataRoute } from 'next';

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alfizilham.my.id').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
