import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from './charts';

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-tight font-bold sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, tint, as: Comp = 'section' }: { children: React.ReactNode; className?: string; tint?: boolean; as?: 'section' | 'div' | 'article' }) {
  return <Comp className={cn('relative min-w-0 rounded-[20px] p-4 sm:rounded-[24px] sm:p-6', tint ? 'glass-tint' : 'glass', className)}>{children}</Comp>;
}

export function CardHead({ title, subtitle, right, id }: { title: string; subtitle?: string; right?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-medium sm:text-xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Kpi({
  label,
  value,
  delta,
  up = true,
  icon,
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
  icon: React.ReactNode;
  spark?: number[];
}) {
  return (
    <Card className="flex flex-col gap-3 !p-4 sm:!p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-fg/80">{label}</span>
        <span aria-hidden="true" className="text-accent [&>svg]:size-[18px]">
          {icon}
        </span>
      </div>
      <span className="font-display text-[30px] leading-none font-bold sm:text-[36px]">{value}</span>
      <div className="flex items-end justify-between gap-2">
        {delta ? (
          <span className={cn('inline-flex items-center gap-1 text-[13px] font-medium', up ? 'text-ok' : 'text-bad')}>
            {up ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" />}
            {delta}
          </span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && <Sparkline data={spark} className="hidden h-7 w-24 sm:block" />}
      </div>
    </Card>
  );
}

const STATUS: Record<string, { color: string; label: string }> = {
  PUBLISHED: { color: 'bg-ok', label: 'Published' },
  DRAFT: { color: 'bg-[#8a8a8a]', label: 'Draft' },
  APPROVED: { color: 'bg-ok', label: 'Approved' },
  PENDING: { color: 'bg-warn', label: 'Pending' },
  REJECTED: { color: 'bg-bad', label: 'Rejected' },
};

export function StatusDot({ status }: { status: string }) {
  const s = STATUS[status] ?? { color: 'bg-muted', label: status };
  return (
    <span className="inline-flex items-center gap-2 text-[13px]">
      <span aria-hidden="true" className={cn('size-2 rounded-full', s.color)} />
      {s.label}
    </span>
  );
}

export function Thumb({ children, size = 44 }: { children: React.ReactNode; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="glass-soft flex flex-none items-center justify-center overflow-hidden rounded-xl text-muted [&>svg]:size-[18px]"
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

export function Empty({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-accent/12 text-accent [&>svg]:size-6">
        {icon}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-[42ch] text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

export function TabLinks({ items, active, label }: { items: { href: string; label: string; key: string }[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-black/35 p-1 shadow-[inset_0_0_0_1px_#262626]">
      {items.map((it) => {
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            scroll={false}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors',
              on ? 'bg-white/[0.12] text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-muted hover:text-fg',
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function NotConfigured({ title, body }: { title: string; body: string }) {
  return (
    <div role="note" className="rounded-2xl border border-dashed border-white/15 px-5 py-4 text-sm">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted">{body}</p>
    </div>
  );
}
