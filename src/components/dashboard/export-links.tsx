import { Download } from 'lucide-react';

const cls =
  'glass-soft inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors hover:bg-white/10 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Plain download links (no router prefetch) for the export route. */
export function ExportLinks({ kind }: { kind: 'messages' | 'testimonials' }) {
  return (
    <div className="flex gap-2" role="group" aria-label={`Export ${kind}`}>
      <a href={`/api/dashboard/export/${kind}?format=csv`} download className={cls}>
        <Download className="size-4" aria-hidden="true" />
        CSV
      </a>
      <a href={`/api/dashboard/export/${kind}?format=json`} download className={cls}>
        <Download className="size-4" aria-hidden="true" />
        JSON
      </a>
    </div>
  );
}
