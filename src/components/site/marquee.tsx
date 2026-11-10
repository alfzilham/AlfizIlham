import { MOTION_ENABLED } from '@/lib/motion';
import CurvedLoop from '@/components/ui/curved-loop';

const GRADIENT_ID = 'marquee-gradient';

/** Decorative band of services on a curved, draggable loop. Text uses the orange accent gradient. */
export function Marquee() {
  return (
    <section id="marquee" aria-hidden="true" className="overflow-hidden py-[clamp(8px,2vw,24px)] text-accent">
      {/* Gradient lives in viewBox units (0 to 1440) so it spans the whole band */}
      <svg width="0" height="0" className="absolute" focusable="false">
        <defs>
          <linearGradient id={GRADIENT_ID} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1440" y2="0">
            <stop offset="0" stopColor="#ffb347" />
            <stop offset="0.5" stopColor="#ff6a1a" />
            <stop offset="1" stopColor="#ffb347" />
          </linearGradient>
        </defs>
      </svg>
      <CurvedLoop
        marqueeText="Fullstack ✦ Mobile ✦ AI automation ✦ Design ✦ Calligraphy ✦"
        shape="arc"
        curveAmount={220}
        speed={MOTION_ENABLED ? 1.5 : 0}
        scrollBoost={MOTION_ENABLED ? undefined : 0}
        direction="left"
        fontSize={96}
        fontWeight={700}
        letterSpacing={-1.92}
        color={`url(#${GRADIENT_ID})`}
        interactive={MOTION_ENABLED}
      />
    </section>
  );
}
