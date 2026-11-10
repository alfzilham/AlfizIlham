'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FileText, Search } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { LinkButton } from '@/components/ui/button';
import { trackView } from '@/app/(site)/actions';
import { Heading, Section } from './primitives';

export type PublicCertificate = { id: string; title: string; issuer: string; fileUrl: string; fileType: string; category: string };

const PAGE = 8;

export function Certificates({ certificates }: { certificates: PublicCertificate[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<PublicCertificate | null>(null);

  const categories = useMemo(() => Array.from(new Set(certificates.map((c) => c.category))).sort(), [certificates]);
  const filtered = certificates.filter(
    (c) =>
      (category === 'all' || c.category === category) &&
      (!query || `${c.title} ${c.issuer}`.toLowerCase().includes(query.trim().toLowerCase())),
  );
  const visible = expanded ? filtered : filtered.slice(0, PAGE);

  const show = (c: PublicCertificate) => {
    setOpen(c);
    void trackView('certificate', c.id);
  };

  return (
    <Section id="certificates" label="Certificates">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Heading title="Certificates and recognition" lead="Selected certificates and honours." />
        <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
            <label htmlFor="cert-search" className="sr-only">
              Search certificates
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="cert-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search certificates"
              className="input-base pl-10"
            />
          </div>
          <Select
            label="Category"
            className="w-full sm:w-52 [&>span:first-child]:sr-only"
            value={category}
            onChange={setCategory}
            options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {visible.map((c) => (
            <motion.li key={c.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
              <button
                type="button"
                onClick={() => show(c)}
                className="group glass flex h-full w-full flex-col overflow-hidden rounded-[20px] text-left transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#d9d6d0]">
                  {c.fileType === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.fileUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <span className="flex size-full flex-col items-center justify-center gap-2 text-[#6b665e]">
                      <FileText className="size-8" aria-hidden="true" />
                      <span className="font-mono text-[11px]">PDF</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <span className="font-mono text-[11px] text-accent">{c.category}</span>
                  <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">{c.title}</h3>
                  <p className="text-[13px] text-muted">{c.issuer}</p>
                </div>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {filtered.length === 0 && <p className="mt-8 text-center text-muted">No certificates match that search.</p>}

      {filtered.length > PAGE && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-mono text-xs text-muted transition-colors hover:text-fg"
          >
            {expanded ? 'Show fewer' : `Expand to view ${filtered.length - PAGE} more`}
            <ChevronDown className={`size-4 text-accent transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
      )}

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ''} description={open ? `${open.issuer}, ${open.category}` : undefined} size="xl">
        {open &&
          (open.fileType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={open.fileUrl} alt={`Certificate: ${open.title}`} className="w-full rounded-2xl" />
          ) : (
            <div className="flex flex-col gap-4">
              <iframe src={open.fileUrl} title={`Certificate: ${open.title}`} className="h-[65dvh] w-full rounded-2xl bg-white" />
              <LinkButton href={open.fileUrl} external variant="glass" className="w-fit">
                Open the PDF in a new tab
              </LinkButton>
            </div>
          ))}
      </Modal>
    </Section>
  );
}
