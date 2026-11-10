import type { MetadataRoute } from 'next';

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alfizilham.my.id').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/login', '/api/'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
