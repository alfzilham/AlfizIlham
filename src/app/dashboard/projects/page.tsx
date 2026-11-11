import { Briefcase, Check, Eye, FileText } from 'lucide-react';
import { db } from '@/lib/db';
import { compact } from '@/lib/utils';
import { BarChart, Donut } from '@/components/dashboard/charts';
import { Card, CardHead, Kpi } from '@/components/dashboard/ui';
import { ProjectManager } from '@/components/dashboard/project-manager';

export const metadata = { title: 'Projects' };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: openNew } = await searchParams;
  const projects = await db.project.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
  const published = projects.filter((p) => p.status === 'PUBLISHED');
  const totalViews = projects.reduce((s, p) => s + p.views, 0);
  const top = [...published].sort((a, b) => b.views - a.views).slice(0, 7);
  const share = top.slice(0, 4).map((p) => ({ name: p.title, value: p.views }));
  const rest = totalViews - share.reduce((s, x) => s + x.value, 0);
  if (rest > 0) share.push({ name: 'Others', value: rest });

  return (
    <ProjectManager
      initialOpen={openNew === '1'}
      projects={projects.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }))}
      stats={
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            <Kpi label="Total projects" value={String(projects.length)} icon={<Briefcase />} />
            <Kpi label="Published" value={String(published.length)} icon={<Check />} />
            <Kpi label="Drafts" value={String(projects.length - published.length)} icon={<FileText />} />
            <Kpi label="Total views" value={compact(totalViews)} icon={<Eye />} />
          </div>
          {published.length > 0 && (
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card>
                <CardHead title="Views per project" subtitle="Opens of each project on the site" />
                <BarChart
                  labels={top.map((p) => (p.title.length > 10 ? `${p.title.slice(0, 9)}.` : p.title))}
                  values={top.map((p) => p.views)}
                  summary={top.map((p) => `${p.title} ${p.views} views`).join(', ')}
                />
              </Card>
              <Card>
                <CardHead title="Views by project" subtitle="Share of total views" />
                {totalViews > 0 ? <Donut parts={share} center={compact(totalViews)} sub="views" size={150} /> : <p className="text-sm text-muted">No views yet.</p>}
              </Card>
            </div>
          )}
        </>
      }
    />
  );
}
