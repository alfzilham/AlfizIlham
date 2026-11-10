import { cn } from '@/lib/utils';
import { Reveal } from '@/components/ui/reveal';

export function Section({ id, children, className, label }: { id: string; children: React.ReactNode; className?: string; label?: string }) {
  return (
    <section id={id} aria-label={label} className={cn('relative isolate scroll-mt-24 px-5 py-20 sm:px-8 md:py-28', className)}>
      <div className="mx-auto w-full max-w-[1120px]">{children}</div>
    </section>
  );
}

export function Heading({ title, lead, className, align = 'left' }: { title: string; lead?: string; className?: string; align?: 'left' | 'center' }) {
  return (
    <Reveal className={cn('flex flex-col gap-4', align === 'center' && 'items-center text-center', className)}>
      <h2 className="font-display text-[clamp(36px,5vw,56px)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">{title}</h2>
      {lead && <p className="max-w-[60ch] text-base text-muted md:text-[17px]">{lead}</p>}
    </Reveal>
  );
}

/** Soft orange light behind a section. Purely decorative. */
export function Glow({ spots, className }: { spots: [string, string, number][]; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      {spots.map(([left, top, size], i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,0.32),rgba(255,106,26,0)_70%)] blur-2xl"
          style={{ left, top, width: size, height: size * 0.75, transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </div>
  );
}

/** Tool logo on a light plate, so dark logos stay readable on the dark page. */
export function ToolTile({ icon, label, size = 48, showLabel = true }: { icon: string; label: string; size?: number; showLabel?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div
        title={label}
        className="flex items-center justify-center rounded-xl bg-fg transition-transform duration-200 hover:-translate-y-0.5"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/icons/${icon}.svg`} alt={showLabel ? '' : label} width={size * 0.58} height={size * 0.58} loading="lazy" className="object-contain" />
      </div>
      {showLabel && <span className="text-center text-xs leading-tight text-fg">{label}</span>}
    </div>
  );
}
