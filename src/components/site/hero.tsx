'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Globe, Sparkles } from 'lucide-react';
import { HERO_STATS } from '@/lib/content';
import { DIST, DUR_IN, EASE } from '@/lib/motion';
import { useSplashDone } from '@/lib/splash-state';

/** Hero entrance starts only once the splash has finished and faded away. */
const START = 0.15;
const STEP = 0.14;


export function Hero() {
  const ready = useSplashDone();
  const rise = (step: number) => ({
    initial: { opacity: 0, y: DIST },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: DIST },
    transition: { duration: DUR_IN, delay: START + step * STEP, ease: EASE },
  });
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const wordX = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);

  return (
    <section id="top" ref={ref} aria-label="Introduction" className="relative isolate overflow-hidden px-5 pt-28 sm:px-8 md:pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[90%] bg-[radial-gradient(60%_50%_at_50%_30%,rgba(255,106,26,0.16),transparent_70%)]" />

      <div className="mx-auto max-w-[1200px]">
        <motion.div {...rise(0)} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line pb-4">
          <div className="font-mono text-[11px] leading-snug tracking-[0.12em] uppercase">
            <span className="block text-accent">Fullstack Developer</span>
            <span className="block text-muted">AI-Integrated Applications</span>
          </div>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
            Available for freelance <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
          </span>
        </motion.div>

        <div className="relative grid min-h-[min(78vh,760px)] grid-cols-1 items-end lg:grid-cols-[1fr_minmax(320px,440px)_1fr]">
          {/* Big outlined word behind the portrait */}
          <motion.span
            aria-hidden="true"
            style={{ x: wordX }}
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 0.9 : 0 }}
            transition={{ duration: 1.6, delay: START, ease: EASE }}
            className="pointer-events-none absolute top-[8%] left-1/2 -z-10 -translate-x-1/2 bg-[linear-gradient(180deg,#ff7a1f_0%,#d4491a_55%,rgba(107,35,11,0.15)_100%)] bg-clip-text font-condensed text-[clamp(120px,24vw,360px)] leading-none whitespace-nowrap text-transparent select-none"
          >
            PORTFOLIO
          </motion.span>

          <div className="relative z-10 flex flex-col gap-5 pt-10 pb-8 lg:pb-24">
            <motion.p {...rise(1)} className="font-script text-[42px] leading-none text-fg md:text-5xl">
              Hello, I&apos;m
            </motion.p>
            <motion.h1 {...rise(2)} className="font-display text-[clamp(64px,7.4vw,108px)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase">
              Alfiz
              <br />
              Ilham
            </motion.h1>
            <motion.p {...rise(3)} className="font-mono text-[13px] leading-snug font-semibold tracking-[0.08em] text-accent uppercase">
              Fullstack developer &amp;
              <br />
              AI integration
            </motion.p>
            <motion.p {...rise(4)} className="max-w-[34ch] text-[15px] leading-relaxed text-muted">
              I build fullstack web and mobile apps with AI built in. Computer Engineering student in Aceh, 10+ live apps shipped.
            </motion.p>
            <motion.p {...rise(5)} className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-fg uppercase">
              <Globe className="size-4 text-accent" aria-hidden="true" /> Working remotely
            </motion.p>
          </div>

          <motion.div
            style={{ y: photoY }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.5, delay: START + STEP, ease: EASE }}
            className="relative z-[5] w-[min(92vw,540px)] justify-self-center self-end"
          >
            <Image
              src="/hero.webp"
              alt="Portrait of Alfiz Ilham in a black suit with an orange rim light"
              width={1024}
              height={1096}
              priority
              sizes="(min-width: 1024px) 540px, 92vw"
              className="h-auto w-full [mask-image:linear-gradient(to_bottom,#000_72%,transparent_100%)]"
            />
          </motion.div>

          <div className="relative z-10 flex flex-col gap-6 pt-8 pb-16 lg:items-end lg:pb-24">
            <motion.div {...rise(4)} className="flex items-center gap-3.5">
              <span className="flex size-12 flex-none items-center justify-center rounded-full border border-line-strong">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <span className="max-w-[20ch] text-sm leading-snug">Building AI directly into products.</span>
            </motion.div>
            <motion.dl {...rise(5.5)} className="grid w-full grid-cols-3 gap-4 border-t border-line pt-5 lg:flex lg:w-auto lg:flex-col lg:gap-0 lg:border-0 lg:pt-0">
              {HERO_STATS.map((s) => (
                <div key={s.label} className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-4 lg:border-b lg:border-line lg:py-4 lg:last:border-0">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-[32px] leading-none font-bold text-accent lg:min-w-[110px] lg:text-[40px]">{s.value}</dd>
                  <dd aria-hidden="true" className="max-w-[14ch] font-mono text-[10px] leading-snug tracking-[0.1em] text-muted uppercase">
                    {s.label}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </div>
      </div>
    </section>
  );
}
