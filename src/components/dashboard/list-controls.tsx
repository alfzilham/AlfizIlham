import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

/** GET search form. Hidden fields keep the other query params (filter, status). */
export function SearchBox({ action, q, keep, placeholder }: { action: string; q: string; keep?: Record<string, string>; placeholder: string }) {
  return (
    <form action={action} method="get" role="search" className="relative">
      {Object.entries(keep ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        name="q"
        defaultValue={q}
        maxLength={80}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-11 w-full rounded-full bg-black/35 pl-10 pr-4 text-sm text-fg shadow-[inset_0_0_0_1px_#262626] placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </form>
  );
}

export function Pager({ page, pages, total, hrefFor }: { page: number; pages: number; total: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  const cls = 'inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-[13px] glass-soft transition-colors hover:bg-white/10';
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-[13px] text-muted">
      <span>
        Page {page} of {pages} ({total} total)
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} scroll={false} className={cls} rel="prev">
            <ChevronLeft className="size-4" aria-hidden="true" /> Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={hrefFor(page + 1)} scroll={false} className={cls} rel="next">
            Next <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </span>
    </nav>
  );
}
