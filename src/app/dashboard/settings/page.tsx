import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { gaConfigured } from '@/lib/ga';
import { emailConfigured } from '@/lib/email';
import { storageConfigured } from '@/lib/storage';
import { PageTitle } from '@/components/dashboard/ui';
import { SettingsView, type Tab } from '@/components/dashboard/settings-view';

const TAB_IDS: Tab[] = ['profile', 'site', 'integrations', 'notifications', 'security'];

export const metadata = { title: 'Settings' };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: t } = await searchParams;
  const tab: Tab = TAB_IDS.includes(t as Tab) ? (t as Tab) : 'profile';
  const [settings, keys] = await Promise.all([
    getSettings(),
    tab === 'integrations' ? db.apiKey.findMany({ orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
  ]);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `https://${settings.site.domain}`).replace(/\/$/, '');

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Settings" subtitle="Manage your profile, site details, integrations and security." />
      <SettingsView
        tab={tab}
        settings={settings}
        integrations={{
          endpoint: `${siteUrl}/api/mcp`,
          keys: keys.map((k) => ({
            id: k.id,
            project: k.project,
            prefix: k.prefix,
            createdAt: k.createdAt.toISOString(),
            lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
            revoked: Boolean(k.revokedAt),
          })),
          ga: { connected: gaConfigured(), propertyId: process.env.GA_PROPERTY_ID ?? '', measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '' },
          email: {
            connected: emailConfigured(),
            serviceId: process.env.EMAILJS_SERVICE_ID ?? '',
            autoReply: process.env.EMAILJS_AUTOREPLY_TEMPLATE_ID ?? '',
            reply: process.env.EMAILJS_REPLY_TEMPLATE_ID ?? '',
          },
          storage: { connected: storageConfigured(), bucket: process.env.S3_BUCKET ?? '' },
        }}
      />
    </div>
  );
}
