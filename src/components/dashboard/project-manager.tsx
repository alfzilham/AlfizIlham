'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, Check, ExternalLink, EyeOff, Globe, ImageIcon, Link2, Pencil, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { GithubIcon } from '@/components/brand-icons';
import { Button } from '@/components/ui/button';
import { Field, Segmented, TextArea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Card, CardHead, Empty, PageTitle, StatusDot, Thumb } from './ui';
import { RowMenu } from './row-menu';
import { useFeedback } from './feedback';
import { uploadFile } from './upload';
import { deleteProject, fetchProjectPreview, saveProject, setProjectStatus } from '@/app/dashboard/actions';
import { cn, relativeDay } from '@/lib/utils';
import { STACK } from '@/lib/content';

export type ProjectRow = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  imageSource: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  views: number;
  updatedAt: string;
};

type Filter = 'all' | 'PUBLISHED' | 'DRAFT';

export function ProjectManager({ projects, stats, initialOpen }: { projects: ProjectRow[]; stats: React.ReactNode; initialOpen?: boolean }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ProjectRow | 'new' | null>(initialOpen ? 'new' : null);
  const [, start] = useTransition();

  useEffect(() => {
    if (initialOpen) router.replace('/dashboard/projects', { scroll: false });
  }, [initialOpen, router]);

  const rows = useMemo(
    () =>
      projects.filter(
        (p) => (filter === 'all' || p.status === filter) && (!query || `${p.title} ${p.techStack.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [projects, filter, query],
  );

  const toggle = (p: ProjectRow) =>
    start(async () => {
      const next = p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      const res = await setProjectStatus(p.id, next);
      toast(res.ok ? (next === 'PUBLISHED' ? `${p.title} is live on the site` : `${p.title} moved to drafts`) : res.message, res.ok ? 'ok' : 'error');
    });

  const remove = async (p: ProjectRow) => {
    const yes = await confirm({ title: `Delete ${p.title}?`, body: 'The project and its preview image are removed for good.', confirm: 'Delete project', danger: true });
    if (!yes) return;
    const res = await deleteProject(p.id);
    toast(res.ok ? 'Project deleted' : res.message, res.ok ? 'ok' : 'error');
  };

  const menu = (p: ProjectRow) => [
    { label: 'Edit', icon: <Pencil />, onSelect: () => setEditing(p) },
    p.status === 'PUBLISHED' ? { label: 'Move to drafts', icon: <EyeOff />, onSelect: () => toggle(p) } : { label: 'Publish', icon: <Globe />, onSelect: () => toggle(p) },
    ...(p.liveUrl ? [{ label: 'Open live site', icon: <ExternalLink />, onSelect: () => window.open(p.liveUrl!, '_blank', 'noopener') }] : []),
    { label: 'Delete', icon: <Trash2 />, onSelect: () => remove(p), danger: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Projects"
        subtitle="Upload new work and choose what appears on the site."
        actions={
          <Button variant="primary" icon={<Upload className="size-4" aria-hidden="true" />} onClick={() => setEditing('new')}>
            Upload project
          </Button>
        }
      />
      {stats}

      <Card>
        <CardHead
          title="All projects"
          subtitle="Manage what is visible on the site"
          right={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <label htmlFor="pj-search" className="sr-only">
                  Search projects
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input id="pj-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="input-base !min-h-10 w-44 pl-10 !text-sm" />
              </div>
              <Segmented
                label="Filter"
                hideLabel
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'DRAFT', label: 'Draft' },
                ]}
              />
            </div>
          }
        />

        {projects.length === 0 ? (
          <Empty
            icon={<Briefcase />}
            title="No projects yet"
            body="Until you publish one, the site shows only the See all on GitHub card."
            action={
              <Button variant="primary" onClick={() => setEditing('new')} icon={<Upload className="size-4" aria-hidden="true" />}>
                Upload your first project
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No projects match this filter.</p>
        ) : (
          <>
            {/* Table for tablet and desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    <th scope="col" className="pb-3 font-normal">Project</th>
                    <th scope="col" className="pb-3 font-normal">Status</th>
                    <th scope="col" className="pb-3 font-normal">Views</th>
                    <th scope="col" className="hidden pb-3 font-normal lg:table-cell">Updated</th>
                    <th scope="col" className="pb-3 font-normal">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <motion.tr key={p.id} layout className="border-t border-white/[0.07]">
                      <td className="py-3 pr-4">
                        <button type="button" onClick={() => setEditing(p)} className="flex min-w-0 items-center gap-3.5 text-left">
                          <Thumb>{p.imageUrl ? <img src={p.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon />}</Thumb>
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:underline">{p.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted">{p.techStack.join(', ') || 'No stack listed'}</span>
                          </span>
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusDot status={p.status} />
                      </td>
                      <td className="py-3 pr-4">{p.views}</td>
                      <td className="hidden py-3 pr-4 text-muted lg:table-cell">{relativeDay(p.updatedAt)}</td>
                      <td className="py-3">
                        <div className="flex justify-end">
                          <RowMenu label={`Actions for ${p.title}`} items={menu(p)} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Stacked cards for mobile */}
            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((p) => (
                <li key={p.id} className="rounded-2xl bg-black/25 p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
                  <div className="flex items-start gap-3">
                    <Thumb>{p.imageUrl ? <img src={p.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon />}</Thumb>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{p.techStack.join(', ')}</p>
                    </div>
                    <RowMenu label={`Actions for ${p.title}`} items={menu(p)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <StatusDot status={p.status} />
                    <span>
                      {p.views} views, {relativeDay(p.updatedAt).toLowerCase()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ProjectModal
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        project={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={(msg) => {
          setEditing(null);
          toast(msg);
        }}
      />
    </div>
  );
}

function ProjectModal({ project, open, onClose, onSaved }: { project: ProjectRow | null; open: boolean; onClose: () => void; onSaved: (msg: string) => void }) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [stack, setStack] = useState<string[]>(project?.techStack ?? []);
  const [liveUrl, setLiveUrl] = useState(project?.liveUrl ?? '');
  const [githubUrl, setGithubUrl] = useState(project?.githubUrl ?? '');
  const [image, setImage] = useState<{ url: string | null; key: string | null; source: string | null }>({
    url: project?.imageUrl ?? null,
    key: project?.imageKey ?? null,
    source: project?.imageSource ?? null,
  });
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(project?.status ?? 'PUBLISHED');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, startSave] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFetched = useRef(project?.liveUrl ?? '');

  const runFetch = async (url = liveUrl) => {
    if (!/^https?:\/\/\S+\.\S+/.test(url)) {
      setErrors((e) => ({ ...e, liveUrl: 'Enter a full link first, for example https://example.com' }));
      return;
    }
    setFetching(true);
    setMessage('');
    lastFetched.current = url;
    const res = await fetchProjectPreview(url);
    setFetching(false);
    if (res.ok) setImage({ url: res.url, key: res.key, source: res.source });
    else setMessage(res.message);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('Choose a PNG, JPG or WEBP image.');
    setMessage('');
    try {
      setUploading(0);
      const res = await uploadFile(file, 'projects', setUploading);
      setImage({ url: res.url, key: res.key, source: 'upload' });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = () =>
    startSave(async () => {
      const res = await saveProject({
        id: project?.id,
        title,
        description,
        techStack: stack,
        liveUrl,
        githubUrl,
        imageUrl: image.url,
        imageKey: image.key,
        imageSource: image.source as 'og' | 'screenshot' | 'upload' | null,
        status,
      });
      if (res.ok) onSaved(project ? 'Project updated' : status === 'PUBLISHED' ? 'Project published' : 'Project saved as draft');
      else {
        setErrors(res.errors ?? {});
        setMessage(res.message);
      }
    });

  const sourceLabel = image.source === 'og' ? 'Fetched from the live URL' : image.source === 'screenshot' ? 'Screenshot of the live URL' : 'Uploaded image';

  return (
    <Modal
      open={open}
      onClose={onClose}
      persistent
      size="lg"
      title={project ? 'Edit project' : 'Upload project'}
      description={project ? 'Update the details shown on the site' : 'Add a project to your portfolio'}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Visibility"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
            ]}
          />
          <div className="flex w-full gap-3 sm:w-auto">
            <Button onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="primary" onClick={save} loading={saving} className="flex-1 sm:flex-none">
              Save project
            </Button>
          </div>
        </div>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Title" required data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" error={errors.title} />
        <TextArea label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of the project" error={errors.description} />

        <TechPicker value={stack} onChange={setStack} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Live URL"
            type="url"
            inputMode="url"
            icon={<Link2 />}
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            onBlur={() => {
              if (liveUrl && liveUrl !== lastFetched.current && !image.url && /^https?:\/\/\S+\.\S+/.test(liveUrl)) void runFetch(liveUrl);
            }}
            placeholder="https://"
            hint="Optional. Any URL works."
            error={errors.liveUrl}
          />
          <Field
            label="GitHub URL"
            type="url"
            inputMode="url"
            icon={<GithubIcon />}
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/"
            hint="Optional."
            error={errors.githubUrl}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-medium">Preview image</span>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,106,26,0.25),rgba(20,20,20,0.95)_70%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] sm:aspect-[21/9]">
            {image.url ? (
              <img src={image.url} alt="Project preview" className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-center text-sm text-muted">
                <ImageIcon className="size-7" aria-hidden="true" />
                {fetching ? 'Fetching a preview from the live URL' : 'Add a live URL to fetch a preview, or upload an image'}
              </div>
            )}
            {(fetching || uploading !== null) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm" role="status">
                {fetching ? 'Fetching preview' : `Uploading ${uploading}%`}
              </div>
            )}
            {image.url && !fetching && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs">
                <span aria-hidden="true" className="size-2 rounded-full bg-ok" />
                {sourceLabel}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button size="sm" icon={<Upload className="size-4" aria-hidden="true" />} onClick={() => fileRef.current?.click()} disabled={uploading !== null}>
              {image.url ? 'Replace image' : 'Upload image'}
            </Button>
            <Button size="sm" icon={<RotateCcw className="size-4" aria-hidden="true" />} onClick={() => runFetch()} disabled={!liveUrl || fetching}>
              {image.url ? 'Fetch again' : 'Fetch preview'}
            </Button>
            {image.url && (
              <Button size="sm" variant="ghost" onClick={() => setImage({ url: null, key: null, source: null })}>
                Remove
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <p className="text-xs text-muted">If the URL has no preview or the fetch fails, upload an image manually. PNG, JPG or WEBP up to 5 MB.</p>
        </div>

        {message && (
          <p role="alert" className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">
            {message}
          </p>
        )}
        <button type="submit" className="sr-only">
          Save project
        </button>
      </form>
    </Modal>
  );
}

const MAX_TECH = 20;

/** Checkbox groups for the tech stack. Values already saved on a project but missing from the catalog stay selectable under "Other". */
function TechPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const known = new Set(STACK.flatMap((g) => g.tools.map((t) => t.label.toLowerCase())));
  const extras = value.filter((v) => !known.has(v.toLowerCase()));
  const groups = [...STACK.map((g) => ({ title: g.title, labels: g.tools.map((t) => t.label) })), ...(extras.length ? [{ title: 'Other', labels: extras }] : [])];
  const full = value.length >= MAX_TECH;

  const toggle = (label: string) =>
    onChange(value.includes(label) ? value.filter((x) => x !== label) : full ? value : [...value, label]);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 flex w-full items-baseline justify-between text-[13px] font-medium">
        <span>Tech stack</span>
        <span className="text-xs font-normal text-muted" aria-live="polite">
          {value.length} selected
        </span>
      </legend>
      <div className="input-base flex max-h-72 flex-col gap-5 overflow-y-auto !py-4" data-lenis-prevent-wheel>
        {groups.map((g) => (
          <div key={g.title} role="group" aria-label={g.title} className="flex flex-col gap-2.5">
            <p className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">{g.title}</p>
            <div className="flex flex-wrap gap-2">
              {g.labels.map((label) => {
                const on = value.includes(label);
                const locked = !on && full;
                return (
                  <label key={label} className={cn('relative inline-flex', locked ? 'cursor-not-allowed opacity-45' : 'cursor-pointer')}>
                    <input type="checkbox" checked={on} disabled={locked} onChange={() => toggle(label)} className="peer sr-only" />
                    <span
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-colors duration-200',
                        'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                        on ? 'font-medium text-white [background:var(--btn-grad)]' : 'bg-white/[0.04] text-fg/85 hover:bg-white/[0.09]',
                      )}
                    >
                      {on && <Check className="size-3.5" aria-hidden="true" />}
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">Pick up to {MAX_TECH}.{full ? ' Limit reached.' : ''}</p>
    </fieldset>
  );
}
