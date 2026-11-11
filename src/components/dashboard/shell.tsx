'use client';

import { DashboardBackdrop } from './backdrop';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  ChartColumn,
  Bell,
  Briefcase,
  ChevronDown,
  ExternalLink,
  House,
  LogOut,
  Mail,
  MessageSquareQuote,
  RotateCcw,
  Search,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { logout } from '@/app/dashboard/actions';
import { FeedbackProvider } from './feedback';
import { cn, initials } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: House },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartColumn },
  { href: '/dashboard/projects', label: 'Projects', icon: Briefcase },
  { href: '/dashboard/certificates', label: 'Certificates', icon: Award },
  { href: '/dashboard/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { href: '/dashboard/messages', label: 'Messages', icon: Mail },
];
const ALL = [...NAV, { href: '/dashboard/settings', label: 'Settings', icon: Settings }, { href: '/dashboard/settings?tab=integrations', label: 'Integrations and API keys', icon: Settings }];

type Props = {
  children: React.ReactNode;
  profile: { fullName: string; username: string; avatarUrl: string };
  counts: { pending: number; unread: number };
};

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href.split('?')[0]);
}

export function DashboardShell({ children, profile, counts }: Props) {
  const pathname = usePathname();
  const badge = (href: string) => (href.endsWith('testimonials') ? counts.pending : href.endsWith('messages') ? counts.unread : 0);

  return (
    <FeedbackProvider>
    <div className="relative min-h-dvh">
      <DashboardBackdrop />

      {/* Desktop rail */}
      <aside className="glass fixed top-5 bottom-5 left-5 z-40 hidden w-[76px] flex-col items-center rounded-[28px] py-5 lg:flex">
        <Link href="/" aria-label="View the public site" className="mb-4">
          <Image src="/brand/logo-mark.webp" alt="" width={44} height={44} className="size-11 object-contain" />
        </Link>
        <span aria-hidden="true" className="mb-4 h-px w-9 bg-white/10" />
        <nav aria-label="Dashboard" className="flex flex-1 flex-col items-center gap-3">
          {NAV.map((n) => (
            <RailLink key={n.href} {...n} active={isActive(pathname, n.href)} badge={badge(n.href)} />
          ))}
        </nav>
        <div className="flex flex-col items-center gap-3">
          <RailLink href="/dashboard/settings" label="Settings" icon={Settings} active={isActive(pathname, '/dashboard/settings')} />
          <form action={logout}>
            <button type="submit" aria-label="Log out" title="Log out" className="flex size-12 items-center justify-center rounded-2xl text-muted transition-colors hover:bg-white/5 hover:text-fg">
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-[116px]">
        <TopBar profile={profile} counts={counts} />
        <main id="main" className="mx-auto max-w-[1340px] px-4 pt-4 pb-28 sm:px-6 lg:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile and tablet bottom nav */}
      <nav aria-label="Dashboard" className="glass fixed inset-x-3 bottom-3 z-40 rounded-[24px] px-2 py-2 lg:hidden">
        <ul className="grid grid-cols-6">
          {NAV.map((n) => {
            const on = isActive(pathname, n.href);
            const b = badge(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn('relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] transition-colors', on ? 'btn-grad text-white' : 'text-muted hover:text-fg')}
                >
                  <n.icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full truncate px-0.5">{n.label}</span>
                  {b > 0 && <span className="absolute top-1.5 right-[calc(50%-18px)] size-2 rounded-full bg-accent" aria-label={`${b} new`} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
    </FeedbackProvider>
  );
}

function RailLink({ href, label, icon: Icon, active, badge = 0 }: { href: string; label: string; icon: LucideIcon; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      aria-label={badge ? `${label}, ${badge} new` : label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex size-12 items-center justify-center rounded-2xl transition-[background,color,transform] duration-200 active:scale-95',
        active ? 'btn-grad text-white' : 'text-muted hover:bg-white/5 hover:text-fg',
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      {badge > 0 && <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2 rounded-full bg-accent ring-2 ring-bg" />}
      <span className="pointer-events-none absolute left-[calc(100%+12px)] rounded-lg bg-surface px-2.5 py-1 text-xs whitespace-nowrap text-fg opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </Link>
  );
}

function TopBar({ profile, counts }: Pick<Props, 'profile' | 'counts'>) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:pt-5">
      <div className="mx-auto flex max-w-[1340px] items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden" aria-label="Dashboard home">
          <Image src="/brand/logo-mark.webp" alt="" width={36} height={36} className="size-9 object-contain" />
          <span className="hidden font-display font-bold sm:inline">Alfiz Ilham</span>
        </Link>
        <JumpSearch />
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            aria-label="Refresh data"
            title="Refresh data"
            className="glass-soft hidden size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-fg sm:flex"
          >
            <RotateCcw className={cn('size-[18px]', refreshing && 'animate-spin [animation-direction:reverse] motion-reduce:animate-none')} aria-hidden="true" />
          </button>
          <Notifications counts={counts} />
          <ProfileMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}

function JumpSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const results = ALL.filter((a) => a.label.toLowerCase().includes(q.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
    router.push(href);
  };

  return (
    <div className="relative hidden w-full max-w-[380px] md:block">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined}
        aria-label="Jump to a dashboard page"
        placeholder="Jump to"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault();
            go(results[active].href);
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        className="glass-soft h-12 w-full rounded-full pr-20 pl-11 text-[15px] text-fg placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md bg-white/[0.08] px-2 py-1 font-mono text-[11px] text-muted">Ctrl K</kbd>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            id={`${id}-list`}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] right-0 left-0 rounded-2xl bg-[linear-gradient(135deg,rgba(54,54,54,0.97),rgba(18,18,18,0.98))] p-1.5 shadow-[var(--gl-soft),0_24px_48px_rgba(0,0,0,0.55)]"
          >
            {results.map((r, i) => (
              <li
                key={r.href}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(r.href);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm', i === active && 'bg-white/[0.08]')}
              >
                <r.icon className="size-4 text-accent" aria-hidden="true" />
                {r.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Popover({ button, children, label }: { button: (p: { open: boolean; toggle: () => void; id: string }) => React.ReactNode; children: (close: () => void) => React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {button({ open, toggle: () => setOpen((o) => !o), id })}
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+10px)] right-0 z-50 w-64 rounded-2xl bg-[linear-gradient(135deg,rgba(54,54,54,0.97),rgba(18,18,18,0.98))] p-2 shadow-[var(--gl-soft),0_24px_48px_rgba(0,0,0,0.55)]"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const menuItem = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors hover:bg-white/[0.08]';

function Notifications({ counts }: { counts: Props['counts'] }) {
  const total = counts.pending + counts.unread;
  return (
    <Popover
      label="Notifications"
      button={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={total ? `Notifications, ${total} new` : 'Notifications'}
          className="glass-soft relative flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          {total > 0 && <span aria-hidden="true" className="absolute top-2.5 right-3 size-2 rounded-full bg-accent" />}
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col">
          <p className="px-3 pt-2 pb-1 text-xs text-muted">Waiting for you</p>
          <Link href="/dashboard/testimonials?status=pending" onClick={close} className={menuItem}>
            <MessageSquareQuote className="size-4 text-accent" aria-hidden="true" />
            <span className="flex-1">Pending testimonials</span>
            <span className="font-mono text-xs">{counts.pending}</span>
          </Link>
          <Link href="/dashboard/messages?filter=unread" onClick={close} className={menuItem}>
            <Mail className="size-4 text-accent" aria-hidden="true" />
            <span className="flex-1">Unread messages</span>
            <span className="font-mono text-xs">{counts.unread}</span>
          </Link>
        </div>
      )}
    </Popover>
  );
}

function ProfileMenu({ profile }: { profile: Props['profile'] }) {
  return (
    <Popover
      label="Account"
      button={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label="Account menu"
          className="glass-soft flex h-11 items-center gap-2.5 rounded-full pr-3 pl-1 sm:h-12 sm:pr-4"
        >
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="" width={80} height={80} unoptimized className="size-9 rounded-full object-cover sm:size-10" />
          ) : (
            <span aria-hidden="true" className="btn-grad flex size-9 items-center justify-center rounded-full font-display text-sm font-bold text-white sm:size-10">
              {initials(profile.fullName) || 'AI'}
            </span>
          )}
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium">{profile.fullName}</span>
            <span className="block text-xs text-muted">@{profile.username}</span>
          </span>
          <ChevronDown className={cn('size-4 text-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col">
          <a href="/" target="_blank" rel="noopener noreferrer" onClick={close} className={menuItem}>
            <ExternalLink className="size-4 text-accent" aria-hidden="true" /> View site
          </a>
          <Link href="/dashboard/settings" onClick={close} className={menuItem}>
            <Settings className="size-4 text-accent" aria-hidden="true" /> Settings
          </Link>
          <form action={logout}>
            <button type="submit" className={menuItem}>
              <LogOut className="size-4 text-accent" aria-hidden="true" /> Log out
            </button>
          </form>
        </div>
      )}
    </Popover>
  );
}
