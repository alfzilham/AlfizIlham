import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { DashboardShell } from '@/components/dashboard/shell';

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s | Dashboard' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [settings, pending, unread] = await Promise.all([
    getSettings(),
    db.testimonial.count({ where: { status: 'PENDING' } }),
    db.message.count({ where: { read: false } }),
  ]);
  return (
    <DashboardShell session={{ expiresAt: session.exp * 1000, serverNow: Date.now() }} profile={{ fullName: settings.profile.fullName, username: settings.profile.username, avatarUrl: settings.profile.avatarUrl }} counts={{ pending, unread }}>
      {children}
    </DashboardShell>
  );
}
