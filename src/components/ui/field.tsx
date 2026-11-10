'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

type Common = { label: string; error?: string; hint?: string; icon?: React.ReactNode; end?: React.ReactNode; required?: boolean };

export const Field = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & Common>(function Field(
  { label, error, hint, icon, end, className, id, required, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = error ? `${fid}-error` : hint ? `${fid}-hint` : undefined;
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={fid} className="text-[13px] font-medium text-fg">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted [&>svg]:size-[18px]">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn('input-base', icon && 'pl-11', end && 'pr-14')}
          {...rest}
        />
        {end && <span className="absolute top-1/2 right-2 -translate-y-1/2">{end}</span>}
      </div>
      <Message id={fid} error={error} hint={hint} />
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & Common>(function TextArea(
  { label, error, hint, className, id, required, rows = 4, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={fid} className="text-[13px] font-medium text-fg">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <textarea
        ref={ref}
        id={fid}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className="input-base min-h-24 resize-y py-3 leading-relaxed"
        {...rest}
      />
      <Message id={fid} error={error} hint={hint} />
    </div>
  );
});

function Message({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`${id}-error`} className="text-[13px] text-bad">
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-hint`} className="text-xs text-muted">
        {hint}
      </p>
    );
  return null;
}

/** Two-option segmented switch, rendered as a radio group. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
  hideLabel,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  hideLabel?: boolean;
}) {
  const name = useId();
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span id={`${name}-l`} className={cn('text-[13px] text-muted', hideLabel && 'sr-only')}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={`${name}-l`} className="flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-black/35 p-1 shadow-[inset_0_0_0_1px_#262626]">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                e.preventDefault();
                const i = options.findIndex((x) => x.value === value);
                const next = options[(i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length];
                onChange(next.value);
              }}
              tabIndex={on ? 0 : -1}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors',
                on ? 'bg-white/[0.12] text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-muted hover:text-fg',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
