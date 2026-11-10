'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Award, ExternalLink, EyeOff, FileText, Globe, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Segmented } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Card, CardHead, Empty, PageTitle, StatusDot, Thumb } from './ui';
import { RowMenu } from './row-menu';
import { useFeedback } from './feedback';
import { uploadFile } from './upload';
import { addCategory, deleteCertificate, saveCertificate, setCertificateStatus } from '@/app/dashboard/actions';
import { cn, relativeDay } from '@/lib/utils';

export type CertificateRow = {
  id: string;
  title: string;
  issuer: string;
  categoryId: string;
  category: string;
  fileUrl: string;
  fileKey: string | null;
  fileType: 'pdf' | 'image';
  status: 'DRAFT' | 'PUBLISHED';
  views: number;
  updatedAt: string;
};
type Category = { id: string; name: string };
type Filter = 'all' | 'PUBLISHED' | 'DRAFT';

export function CertificateManager({ certificates, categories, stats }: { certificates: CertificateRow[]; categories: Category[]; stats: React.ReactNode }) {
  const { toast, confirm } = useFeedback();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<CertificateRow | 'new' | null>(null);
  const [cats, setCats] = useState(categories);
  const [, start] = useTransition();
  const rows = useMemo(() => certificates.filter((c) => filter === 'all' || c.status === filter), [certificates, filter]);

  const toggle = (c: CertificateRow) =>
    start(async () => {
      const next = c.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      const res = await setCertificateStatus(c.id, next);
      toast(res.ok ? (next === 'PUBLISHED' ? 'Certificate published' : 'Certificate moved to drafts') : res.message, res.ok ? 'ok' : 'error');
    });

  const remove = async (c: CertificateRow) => {
    if (!(await confirm({ title: `Delete ${c.title}?`, body: 'The certificate and its file are removed for good.', confirm: 'Delete certificate', danger: true }))) return;
    const res = await deleteCertificate(c.id);
    toast(res.ok ? 'Certificate deleted' : res.message, res.ok ? 'ok' : 'error');
  };

  const menu = (c: CertificateRow) => [
    { label: 'Edit', icon: <Pencil />, onSelect: () => setEditing(c) },
    c.status === 'PUBLISHED' ? { label: 'Move to drafts', icon: <EyeOff />, onSelect: () => toggle(c) } : { label: 'Publish', icon: <Globe />, onSelect: () => toggle(c) },
    { label: 'Open file', icon: <ExternalLink />, onSelect: () => window.open(c.fileUrl, '_blank', 'noopener') },
    { label: 'Delete', icon: <Trash2 />, onSelect: () => remove(c), danger: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Certificates"
        subtitle="Upload certificates and choose what appears on the site."
        actions={
          <Button variant="primary" icon={<Upload className="size-4" aria-hidden="true" />} onClick={() => setEditing('new')}>
            Upload certificate
          </Button>
        }
      />
      {stats}
      <Card>
        <CardHead
          title="All certificates"
          subtitle="Manage what is visible on the site"
          right={
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
          }
        />
        {certificates.length === 0 ? (
          <Empty
            icon={<Award />}
            title="No certificates yet"
            body="The Certificates section stays hidden on the site until you publish one."
            action={
              <Button variant="primary" onClick={() => setEditing('new')} icon={<Upload className="size-4" aria-hidden="true" />}>
                Upload your first certificate
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No certificates match this filter.</p>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    <th scope="col" className="pb-3 font-normal">Certificate</th>
                    <th scope="col" className="hidden pb-3 font-normal lg:table-cell">Category</th>
                    <th scope="col" className="pb-3 font-normal">Status</th>
                    <th scope="col" className="pb-3 font-normal">Views</th>
                    <th scope="col" className="hidden pb-3 font-normal lg:table-cell">Updated</th>
                    <th scope="col" className="pb-3 font-normal">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <motion.tr key={c.id} layout className="border-t border-white/[0.07]">
                      <td className="py-3 pr-4">
                        <button type="button" onClick={() => setEditing(c)} className="flex min-w-0 items-center gap-3.5 text-left">
                          <Thumb>{c.fileType === 'image' ? <img src={c.fileUrl} alt="" className="size-full object-cover" /> : <FileText />}</Thumb>
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:underline">{c.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted">{c.issuer}</span>
                          </span>
                        </button>
                      </td>
                      <td className="hidden py-3 pr-4 text-muted lg:table-cell">{c.category}</td>
                      <td className="py-3 pr-4">
                        <StatusDot status={c.status} />
                      </td>
                      <td className="py-3 pr-4">{c.views}</td>
                      <td className="hidden py-3 pr-4 text-muted lg:table-cell">{relativeDay(c.updatedAt)}</td>
                      <td className="py-3">
                        <div className="flex justify-end">
                          <RowMenu label={`Actions for ${c.title}`} items={menu(c)} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((c) => (
                <li key={c.id} className="rounded-2xl bg-black/25 p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
                  <div className="flex items-start gap-3">
                    <Thumb>{c.fileType === 'image' ? <img src={c.fileUrl} alt="" className="size-full object-cover" /> : <FileText />}</Thumb>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {c.issuer}, {c.category}
                      </p>
                    </div>
                    <RowMenu label={`Actions for ${c.title}`} items={menu(c)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <StatusDot status={c.status} />
                    <span>{c.views} views</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <CertificateModal
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        certificate={editing === 'new' ? null : editing}
        categories={cats}
        onCategoryAdded={(c) => setCats((list) => (list.some((x) => x.id === c.id) ? list : [...list, c].sort((a, b) => a.name.localeCompare(b.name))))}
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

function CertificateModal({
  certificate,
  categories,
  onCategoryAdded,
  open,
  onClose,
  onSaved,
}: {
  certificate: CertificateRow | null;
  categories: Category[];
  onCategoryAdded: (c: Category) => void;
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [title, setTitle] = useState(certificate?.title ?? '');
  const [issuer, setIssuer] = useState(certificate?.issuer ?? '');
  const [categoryId, setCategoryId] = useState(certificate?.categoryId ?? '');
  const [file, setFile] = useState<{ url: string; key: string | null; type: 'pdf' | 'image'; name?: string } | null>(
    certificate ? { url: certificate.fileUrl, key: certificate.fileKey, type: certificate.fileType } : null,
  );
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(certificate?.status ?? 'PUBLISHED');
  const [newCat, setNewCat] = useState('');
  const [catError, setCatError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, startSave] = useTransition();
  const [adding, startAdd] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    const ok = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type);
    if (!ok) return setMessage('Use a PDF, PNG, JPG or WEBP file.');
    setMessage('');
    try {
      setProgress(0);
      const res = await uploadFile(f, 'certificates', setProgress);
      setFile({ url: res.url, key: res.key, type: f.type === 'application/pdf' ? 'pdf' : 'image', name: f.name });
      setErrors((e) => ({ ...e, fileUrl: '' }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const createCategory = (close: () => void) =>
    startAdd(async () => {
      setCatError('');
      const res = await addCategory(newCat);
      if (!res.ok) return setCatError(res.message);
      onCategoryAdded(res.category);
      setCategoryId(res.category.id);
      setNewCat('');
      close();
    });

  const save = () =>
    startSave(async () => {
      const res = await saveCertificate({
        id: certificate?.id,
        title,
        issuer,
        categoryId,
        fileUrl: file?.url ?? '',
        fileKey: file?.key ?? null,
        fileType: file?.type ?? 'pdf',
        status,
      });
      if (res.ok) onSaved(certificate ? 'Certificate updated' : status === 'PUBLISHED' ? 'Certificate published' : 'Certificate saved as draft');
      else {
        setErrors(res.errors ?? {});
        setMessage(res.message);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      persistent
      size="lg"
      title={certificate ? 'Edit certificate' : 'Upload certificate'}
      description={certificate ? 'Update the details shown on the site' : 'Add a certificate to your portfolio'}
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
              Save certificate
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
        <Field label="Title" required data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Certificate title" error={errors.title} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Issuer" required value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="Organization name" error={errors.issuer} />
          <Select
            label="Category"
            required
            placeholder="Choose a category"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.categoryId}
            footer={(close) => (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <label htmlFor="new-cat" className="sr-only">
                    New category name
                  </label>
                  <input
                    id="new-cat"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        createCategory(close);
                      }
                    }}
                    placeholder="New category"
                    className="input-base !min-h-10 flex-1 !text-sm"
                  />
                  <Button size="sm" variant="primary" icon={<Plus className="size-4" aria-hidden="true" />} loading={adding} onClick={() => createCategory(close)} disabled={newCat.trim().length < 2}>
                    Add
                  </Button>
                </div>
                {catError && <p className="px-1 text-xs text-bad">{catError}</p>}
              </div>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span id="cert-file-label" className="text-[13px] font-medium">
            File <span className="text-accent">*</span>
          </span>
          <button
            type="button"
            aria-labelledby="cert-file-label"
            aria-describedby="cert-file-hint"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              'flex flex-col items-center gap-2.5 rounded-2xl bg-black/30 px-4 py-8 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-shadow',
              dragging && 'shadow-[inset_0_0_0_1px_rgba(255,106,26,0.8)]',
              errors.fileUrl && 'shadow-[inset_0_0_0_1px_rgba(255,90,90,0.8)]',
            )}
          >
            {file?.type === 'image' ? (
              <img src={file.url} alt="" className="max-h-40 rounded-lg object-contain" />
            ) : file ? (
              <FileText className="size-8 text-accent" aria-hidden="true" />
            ) : (
              <Upload className="size-7 text-accent" aria-hidden="true" />
            )}
            <span className="text-sm font-medium">
              {progress !== null ? `Uploading ${progress}%` : file ? file.name ?? 'File attached, click to replace' : 'Drop a PDF or image here, or click to choose'}
            </span>
            <span id="cert-file-hint" className="text-xs text-muted">
              PDF, PNG, JPG or WEBP, up to 10 MB
            </span>
          </button>
          <input ref={inputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => handleFile(e.target.files?.[0])} />
          {errors.fileUrl && <p className="text-[13px] text-bad">{errors.fileUrl}</p>}
        </div>

        {message && (
          <p role="alert" className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">
            {message}
          </p>
        )}
        <button type="submit" className="sr-only">
          Save certificate
        </button>
      </form>
    </Modal>
  );
}
