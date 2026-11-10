// Small SVG charts. Each one carries a text summary for screen readers.
import { cn, compact } from '@/lib/utils';

const ORANGE = '#ff7a1f';

function path(points: [number, number][]) {
  if (!points.length) return '';
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * 100, 28 - ((v - min) / (max - min || 1)) * 24 - 2] as [number, number]);
  const line = path(pts);
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ORANGE} stopOpacity="0.45" />
          <stop offset="1" stopColor={ORANGE} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L100,28 L0,28 Z`} fill="url(#spk)" />
      <path d={line} fill="none" stroke={ORANGE} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AreaChart({
  labels,
  series,
  second,
  height = 240,
  summary,
}: {
  labels: string[];
  series: number[];
  second?: number[];
  height?: number;
  summary: string;
}) {
  const W = 800;
  const H = height;
  const max = Math.max(...series, ...(second ?? []), 1);
  const nice = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / nice) * nice;
  const x = (i: number) => (series.length < 2 ? W / 2 : (i / (series.length - 1)) * W);
  const y = (v: number) => H - 24 - (v / top) * (H - 40);
  const pts = series.map((v, i) => [x(i), y(v)] as [number, number]);
  const pts2 = second?.map((v, i) => [x(i), y(v)] as [number, number]);
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const step = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <figure className="w-full">
      <div className="flex gap-3">
        <div aria-hidden="true" className="flex flex-col justify-between pb-6 text-right text-[11px] text-muted" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t}>{compact(top * t)}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={summary} className="block w-full" style={{ height: H }}>
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={ORANGE} stopOpacity="0.5" />
                <stop offset="1" stopColor={ORANGE} stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <line key={t} x1="0" x2={W} y1={y(top * t)} y2={y(top * t)} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 6" />
            ))}
            {pts.length > 1 && <path d={`${path(pts)} L${W},${H - 24} L0,${H - 24} Z`} fill="url(#area)" />}
            {pts2 && pts2.length > 1 && <path d={path(pts2)} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />}
            {pts.length > 1 && <path d={path(pts)} fill="none" stroke="#ffa24a" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />}
          </svg>
          <div aria-hidden="true" className="mt-2 flex justify-between text-[11px] text-muted">
            {labels.map((l, i) => (
              <span key={i} className={i % step === 0 ? '' : 'invisible'}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

export function BarChart({ labels, values, height = 170, highlight, summary }: { labels: string[]; values: number[]; height?: number; highlight?: number; summary: string }) {
  const max = Math.max(...values, 1);
  const hi = highlight ?? values.indexOf(Math.max(...values));
  return (
    <figure role="img" aria-label={summary} className="flex items-end gap-2 sm:gap-3" style={{ height: height + 52 }}>
      {values.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          {i === hi && v > 0 && <span className="btn-grad rounded-md px-2 py-0.5 text-xs font-semibold text-white">{compact(v)}</span>}
          <div
            className={cn('w-full max-w-[52px] rounded-t-xl', i === hi ? 'bg-[linear-gradient(180deg,#ffa24a,#e2531a_60%,#8f2d0a)]' : 'bg-[linear-gradient(180deg,rgba(255,122,31,0.45),rgba(255,122,31,0.08))]')}
            style={{ height: `${Math.max(4, (v / max) * height)}px` }}
          />
          <span className="text-xs text-muted">{labels[i]}</span>
        </div>
      ))}
    </figure>
  );
}

const DONUT = ['#ff6a1a', '#ffa24a', '#d4491a', '#8f2d0a', '#5a5a5a', '#3a3a3a'];

export function Donut({ parts, center, sub, size = 160 }: { parts: { name: string; value: number }[]; center: string; sub: string; size?: number }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const r = 15.9155;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative flex-none" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" role="img" aria-label={parts.map((p) => `${p.name} ${Math.round((p.value / total) * 100)}%`).join(', ')} className="size-full -rotate-90">
          <circle cx="21" cy="21" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          {parts.map((p, i) => {
            const pct = (p.value / total) * 100;
            const el = <circle key={p.name} cx="21" cy="21" r={r} fill="none" stroke={DONUT[i % DONUT.length]} strokeWidth="5" strokeDasharray={`${Math.max(0, pct - 0.6)} ${100 - pct + 0.6}`} strokeDashoffset={-acc} />;
            acc += pct;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold">{center}</span>
          <span className="text-xs text-muted">{sub}</span>
        </div>
      </div>
      <ul className="flex min-w-[140px] flex-1 flex-col gap-2.5 text-[13px]">
        {parts.map((p, i) => (
          <li key={p.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="size-2.5 flex-none rounded-full" style={{ background: DONUT[i % DONUT.length] }} />
              <span className="truncate">{p.name}</span>
            </span>
            <span className="text-muted">{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBars({ rows, format = (n: number) => compact(n) }: { rows: { name: string; code?: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <li key={r.name} className="grid grid-cols-[minmax(0,110px)_1fr_auto] items-center gap-3 text-[13px] sm:grid-cols-[minmax(0,140px)_1fr_auto]">
          <span className="flex min-w-0 items-center gap-2">
            {r.code && <span className="flex-none rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">{r.code}</span>}
            <span className="truncate">{r.name}</span>
          </span>
          <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <span className="block h-full rounded-full bg-[linear-gradient(90deg,#d4491a,#ffa24a)]" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </span>
          <span className="text-muted">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
