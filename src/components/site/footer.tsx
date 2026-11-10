import { Globe, Mail } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/brand-icons';
import { NAV, PROFILE } from '@/lib/content';

const BG =
  'radial-gradient(95% 100% at 100% 100%, rgba(255,160,100,0.9) 0%, rgba(226,83,26,0.72) 24%, rgba(120,40,10,0.5) 50%, rgba(10,10,10,0) 78%), radial-gradient(55% 70% at 0% 100%, rgba(143,45,10,0.45), rgba(10,10,10,0) 70%), #0a0a0a';

const LINK = 'transition-colors duration-200 hover:text-[#ffb347] focus-visible:text-[#ffb347] focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white';

export function Footer() {
  const year = new Date().getFullYear();
  const tel = `tel:${PROFILE.phone.replace(/[^+\d]/g, '')}`;
  const icons = [
    { href: PROFILE.github, label: 'GitHub', icon: GithubIcon },
    { href: PROFILE.linkedin, label: 'LinkedIn', icon: LinkedinIcon },
    { href: `mailto:${PROFILE.email}`, label: 'Email', icon: Mail },
    { href: PROFILE.site, label: 'Website', icon: Globe },
  ];

  return (
    <footer>
      <div className="relative overflow-hidden px-[clamp(24px,5vw,72px)] pt-[clamp(40px,5vw,72px)]" style={{ background: BG }}>
        <div className="relative z-[2] flex flex-wrap justify-between gap-x-12 gap-y-9">
          <nav aria-label="Footer" className="flex flex-col gap-3">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`font-display text-[clamp(20px,2vw,24px)] leading-[1.2] font-medium tracking-[-0.01em] text-fg ${LINK}`}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col items-start gap-5 text-left sm:items-end sm:text-right">
            <ul className="flex gap-2">
              {icons.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex size-9 items-center justify-center text-fg transition-transform duration-[250ms] ease-out-soft hover:-translate-y-[3px] focus-visible:-translate-y-[3px] focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white"
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-1.5 text-[15px] leading-normal">
              <a href={`mailto:${PROFILE.email}`} className={`text-fg/80 ${LINK}`}>
                {PROFILE.email}
              </a>
              <a href={tel} className={`text-fg/80 ${LINK}`}>
                {PROFILE.phone}
              </a>
              <span className="text-fg/60">{PROFILE.location}</span>
              <span className="mt-3.5 text-[13px] text-fg/45">&copy; {year} Alfiz Ilham. All rights reserved.</span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="relative z-[1] mt-[clamp(48px,9vw,128px)] -mb-[0.07em] bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,205,160,0.5)_55%,rgba(255,226,196,0.85)_100%)] bg-clip-text text-center font-display text-[clamp(56px,15.6vw,230px)] leading-[0.86] font-bold tracking-[-0.045em] whitespace-nowrap text-transparent select-none"
        >
          Alfiz Ilham
        </div>
      </div>
    </footer>
  );
}
