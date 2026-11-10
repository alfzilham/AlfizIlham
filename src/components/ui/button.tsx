'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'glass' | 'light' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none ' +
  'transition-[transform,box-shadow,background-color,color,filter] duration-200 ease-out-soft ' +
  'hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants: Record<Variant, string> = {
  primary: 'btn-grad text-white hover:brightness-110',
  glass: 'glass-soft text-white hover:bg-white/10',
  light: 'bg-fg text-bg hover:bg-white',
  ghost: 'text-muted hover:text-fg hover:bg-white/5',
  danger: 'glass-soft text-white hover:text-bad',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 text-[13px]',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-7 text-[15px]',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'glass', size = 'md', icon, loading, className, children, type = 'button', disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});

type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  external?: boolean;
};

export function LinkButton({ href, variant = 'glass', size = 'md', icon, external, className, children, ...rest }: LinkButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (external || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.endsWith('.pdf')) {
    return (
      <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  children,
  className,
  size = 44,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn(
        'glass-soft relative inline-flex flex-none items-center justify-center rounded-full text-muted transition-colors duration-200 hover:text-fg hover:bg-white/10 active:scale-95',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none', className)}
    />
  );
}
