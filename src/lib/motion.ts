/** Shared motion tokens. Tune the whole site's tempo here. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Entrance and exit timing (seconds). Exit is shorter so leaving never feels heavy. */
export const DUR_IN = 1.1;
export const DUR_OUT = 0.55;

/** Vertical travel (px) for rise and fall. */
export const DIST = 40;

/** Delay between siblings in a group (seconds). */
export const STAGGER = 0.13;

/**
 * Viewport window for scroll reveals. The negative margins shrink the observed area so content
 * starts its entrance after it is clearly on screen and starts its exit while it is still visible.
 */
export const VIEWPORT = { once: false, amount: 'some', margin: '-12% 0px -12% 0px' } as const;
