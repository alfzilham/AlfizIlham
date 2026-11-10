import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { DashboardShell } from '@/components/dashboard/shell';

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s | Dashboard' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [settings, pending, unread] = await Promise.all([
    getSettings(),
    db.testimonial.count({ where: { status: 'PENDING' } }),
    db.message.count({ where: { read: false } }),
  ]);
  return (
    <DashboardShell profile={{ fullName: settings.profile.fullName, username: settings.profile.username }} counts={{ pending, unread }}>
      {children}
    </DashboardShell>
  );
}
