'use client';

import { motion, type Variants } from 'framer-motion';
import { DIST, DUR_IN, DUR_OUT, EASE, MOTION_ENABLED, STAGGER, VIEWPORT } from '@/lib/motion';

const item: Variants = {
  hidden: { opacity: 0, y: DIST, transition: { duration: DUR_OUT, ease: EASE } },
  show: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: DUR_IN, delay, ease: EASE } }),
};

/** Fades and lifts its children in when they scroll into view, and eases them out when they leave. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  if (!MOTION_ENABLED) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={VIEWPORT} variants={item} custom={delay}>
      {children}
    </motion.div>
  );
}

/** Staggers direct RevealItem children. */
export function RevealGroup({ children, className, stagger = STAGGER }: { children: React.ReactNode; className?: string; stagger?: number }) {
  if (!MOTION_ENABLED) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{
        hidden: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!MOTION_ENABLED) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
