import { Award, Check, Eye, FileText } from 'lucide-react';
import { db } from '@/lib/db';
import { compact } from '@/lib/utils';
import { BarChart, Donut } from '@/components/dashboard/charts';
import { Card, CardHead, Kpi } from '@/components/dashboard/ui';
import { CertificateManager } from '@/components/dashboard/certificate-manager';

export const metadata = { title: 'Certificates' };

const DEFAULT_CATEGORIES = ['Course', 'Competition', 'Organization', 'Award'];

export default async function CertificatesPage() {
  // First visit: create the starter categories once.
  if ((await db.category.count()) === 0) {
    await db.category.createMany({ data: DEFAULT_CATEGORIES.map((name) => ({ name })), skipDuplicates: true });
  }
  const [certificates, categories] = await Promise.all([
    db.certificate.findMany({ orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }], include: { category: true } }),
    db.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { certificates: true } } } }),
  ]);
  const published = certificates.filter((c) => c.status === 'PUBLISHED').length;
  const views = certificates.reduce((s, c) => s + c.views, 0);
  const top = [...certificates].filter((c) => c.status === 'PUBLISHED').sort((a, b) => b.views - a.views).slice(0, 7);
  const byCategory = categories.filter((c) => c._count.certificates > 0).map((c) => ({ name: c.name, value: c._count.certificates }));

  return (
    <CertificateManager
      certificates={certificates.map((c) => ({
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        categoryId: c.categoryId,
        category: c.category.name,
        fileUrl: c.fileUrl,
        fileKey: c.fileKey,
        fileType: c.fileType as 'pdf' | 'image',
        credentialId: c.credentialId,
        pinned: c.pinnedAt !== null,
        status: c.status,
        views: c.views,
        updatedAt: c.updatedAt.toISOString(),
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      stats={
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            <Kpi label="Total certificates" value={String(certificates.length)} icon={<Award />} />
            <Kpi label="Published" value={String(published)} icon={<Check />} />
            <Kpi label="Drafts" value={String(certificates.length - published)} icon={<FileText />} />
            <Kpi label="Total views" value={compact(views)} icon={<Eye />} />
          </div>
          {certificates.length > 0 && (
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card>
                <CardHead title="Views per certificate" subtitle="Top 7 published" />
                {top.length ? (
                  <BarChart
                    labels={top.map((c) => (c.title.length > 10 ? `${c.title.slice(0, 9)}.` : c.title))}
                    values={top.map((c) => c.views)}
                    summary={top.map((c) => `${c.title} ${c.views} views`).join(', ')}
                  />
                ) : (
                  <p className="text-sm text-muted">Publish a certificate to start counting views.</p>
                )}
              </Card>
              <Card>
                <CardHead title="By category" subtitle="Certificates and awards" />
                <Donut parts={byCategory} center={String(certificates.length)} sub="total" size={150} />
              </Card>
            </div>
          )}
        </>
      }
    />
  );
}
