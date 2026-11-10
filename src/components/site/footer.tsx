import Image from 'next/image';
import { Globe, Mail } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/brand-icons';
import { NAV, PROFILE } from '@/lib/content';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line px-5 pt-14 pb-8 sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="font-display text-2xl font-medium transition-colors hover:text-accent">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ul className="flex items-center gap-2">
              {[
                { href: PROFILE.github, label: 'GitHub', icon: GithubIcon },
                { href: PROFILE.linkedin, label: 'LinkedIn', icon: LinkedinIcon },
                { href: `mailto:${PROFILE.email}`, label: 'Email', icon: Mail },
                { href: PROFILE.site, label: 'Website', icon: Globe },
              ].map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-fg"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <a href={`mailto:${PROFILE.email}`} className="text-sm text-muted transition-colors hover:text-fg">
              {PROFILE.email}
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[13px] text-muted">
          <span className="flex items-center gap-2.5">
            <Image src="/brand/logo-mark.webp" alt="" width={24} height={24} className="size-6 object-contain" />
            {year} Alfiz Ilham. Built with Next.js.
          </span>
          <span>{PROFILE.location}</span>
        </div>
      </div>
    </footer>
  );
}
