# DESIGN

Visual and interaction design for the Alfiz Ilham portfolio and dashboard. Source of truth for tokens is `src/app/globals.css`. If this file and the CSS disagree, the CSS wins and this file should be fixed.

## 1. Direction

Dark, quiet, and warm. A near-black canvas, one orange accent, and translucent "liquid glass" surfaces that catch a little light. The orange comes from the owner's portrait photography and the logo mark, so the palette is tied to the person, not picked from a trend.

Principles:

1. **One accent.** Orange carries emphasis (primary actions, active states, the logo). Everything else is neutral.
2. **Glass is for surfaces that float.** Cards, nav, and modals use glass. Page backgrounds and text stay flat.
3. **Content first.** Motion and effects support reading. They never block it, and they switch off for people who ask for reduced motion.
4. **Same system in both surfaces.** The public site and the dashboard share tokens, components, and rules.
5. **No emoji and no em dashes** in UI copy, docs, or email templates. Use plain punctuation.

## 2. Brand

- **Logo mark:** orange gradient "Ai" monogram with a glossy highlight. Files in `public/brand/` (`logo-mark.webp`, `logo-mark-white.webp`, `icon-192.png`, `icon-512.png`; `logo-mark.png` is kept for email templates) and `logo-lockup.webp` for the mark with the wordmark.
- **Lockup:** mark on the left, "Alfiz Ilham" wordmark on the right in Bricolage Grotesque Bold, off-white `#F2F2F2`.
- **Clear space:** at least the height of the letter "A" around the lockup.
- **Favicon and app icons:** `src/app/favicon.ico`, `icon.png`, `apple-icon.png`.

## 3. Color

### Core tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0a0a0a` | Page background |
| `--color-surface` | `#161616` | Solid cards and email cards |
| `--color-line` | `#262626` | Dividers and hairlines |
| `--color-line-strong` | `rgba(242,242,242,0.35)` | Emphasized borders |
| `--color-fg` | `#f2f2f2` | Primary text |
| `--color-muted` | `#9a9a9a` | Secondary text |
| `--color-accent` | `#ff6a1a` | Accent, links, focus ring |
| `--color-accent-soft` | `#ffa24a` | Accent on dark text, small labels |

### Status tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-ok` | `#3ddc84` | Success, published, approved |
| `--color-warn` | `#ffb347` | Pending, caution |
| `--color-bad` | `#ff5a5a` | Error, destructive, rejected |

Status is never shown by color alone. Pair it with a label or icon.

### Gradients

| Token | Use |
| --- | --- |
| `--btn-grad` | Primary buttons. Radial, bright amber in the bottom right fading to deep brown |
| `--acc-grad` | Large accent surfaces such as the hero card and the email hero |
| `--gl-bg`, `--gl-bg-tint` | Glass fill, neutral and orange-tinted |

Use gradients only for the primary action and one hero-level surface per view. Do not stack them.

### Contrast

Text on `#0a0a0a` and `#161616`: `#f2f2f2` passes AA at all sizes. `#9a9a9a` passes AA for body text on `#0a0a0a`. Do not put `muted` text on glass over the orange gradient without checking the ratio.

## 4. Typography

| Role | Font | Variable | Use |
| --- | --- | --- | --- |
| Display | Bricolage Grotesque | `--font-display` | Headings, brand, big numbers |
| Body | Geist | `--font-sans` | Paragraphs, UI text, inputs |
| Mono | Geist Mono | `--font-mono` | Labels, tags, code, tool names |
| Condensed | Anton | `--font-condensed` | Large condensed accents in the hero |
| Script | Great Vibes | `--font-script` | Occasional signature-style accent |

Rules:

- Fonts load through `next/font` and are self-hosted. Do not link Google Fonts in production pages.
- Body text is at least 16 px. Inputs are 16 px to prevent mobile zoom.
- Small mono labels (11 to 12 px) are uppercase or tracked only for short tags, never paragraphs.
- Line length for paragraphs stays near 65 characters.
- Email templates use the same families with `Segoe UI` and Arial fallbacks, because many mail clients ignore web fonts.

## 5. Surfaces

### Glass

Defined as classes in `globals.css`:

| Class | Look | Use |
| --- | --- | --- |
| `.glass` | Neutral fill, top highlight edge, 18 px blur with saturation | Cards, nav, popovers |
| `.glass-soft` | Same fill, softer edge | Nested elements inside a glass card |
| `.glass-tint` | Orange-tinted fill and edge | One emphasized card per section |
| `.acc-surface` | Full accent gradient | Hero card, key callouts |
| `.btn-grad` | Button gradient | Primary buttons |
| `.input-base` | Dark inset field, 48 px high, 12 px radius | Text inputs |

Guidelines:

- Every glass surface has a visible 1 px edge, so it stays legible if blur is unsupported or reduced.
- Do not nest more than two glass layers.
- Blur is for a few floating surfaces, not the whole page.

### Radius, spacing, elevation

- Radius: inputs 12 px, cards 20 to 24 px, buttons and chips fully rounded. Keep this scale. Do not mix in other radii without reason.
- Spacing follows a 4 px base. Sections on the public site use generous vertical rhythm and vary it between sections so the page does not read as one repeated block.
- Elevation comes from the edge highlight and a soft dark shadow (`0 10px 28px rgba(0,0,0,0.35)`), not from heavy glows.

## 6. Layout

- **Public site:** single column of sections inside a centered container, with asymmetric compositions in Hero, About, Stack, and Services. Section order follows the story of the owner, not a template.
- **Dashboard:** on large screens (`lg` and up) a floating glass rail (76 px) on the left holds the navigation and a logout button. A sticky top bar holds a "jump to a dashboard page" search, a refresh button, notifications, and the account menu. Below `lg` the rail is replaced by a floating glass bottom navigation bar, with a dot badge for unread items.
- **Breakpoints:** Tailwind defaults (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`).
- Full-height hero uses `min-h-[100dvh]`, not `100vh`, to avoid mobile browser bar jumps.

## 7. Components

| Component | Notes |
| --- | --- |
| `Button` | Variants: primary (gradient), secondary (glass), ghost, destructive. Minimum 44 px touch height. Pressed state moves 1 px or scales to 0.98 |
| `Field` | Label above, helper text below, error text linked with `aria-describedby`, red border plus icon plus message on error |
| `Select` | Custom listbox following the WAI-ARIA pattern: arrow keys, type-ahead, Escape, Home and End |
| `Modal` | Focus trap, Escape to close, scroll lock through Lenis, labelled by title, restores focus on close |
| `RowMenu` | Menu button pattern for row actions in tables |
| `Reveal` | Fade and rise on scroll into view, skipped under reduced motion |
| `Segmented` | Segmented switcher exported from `ui/field.tsx`, used for choices such as certificate file type |
| Charts | Inline SVG. Line and bar series use the accent and a soft accent. Labels and values are readable without color |
| Toasts | Short, plain messages. Success and error each carry an icon and text |

Empty states say what is missing and what to do next, with one action. No cartoon illustrations.

Tables and lists keep their frame, row dividers, and search. An empty list shows the empty state inside the same frame.

## 8. Motion

- Library: Framer Motion for component animation, Lenis for smooth scroll.
- `MotionConfig reducedMotion="user"` is set at the root. With `prefers-reduced-motion: reduce`, Lenis is off and Framer animations, the marquee, and counters are disabled.
- Durations: micro interactions 150 to 250 ms, reveals 400 to 700 ms. Easing `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out-soft`).
- Animate transform and opacity only. Avoid animating layout properties on scroll.
- The only looping animation is the testimonials marquee, which pauses on hover and keyboard focus and is off under reduced motion. No pulsing decoration.
- When a modal opens, Lenis scroll is locked so the page behind does not move.

## 9. Accessibility

Target: WCAG 2.2 AA.

- Always-visible focus ring: 2 px accent outline with 2 px offset on `:focus-visible`.
- Skip link to main content on the public site.
- Every input has a visible label. Errors are announced and tied to their field.
- Color is never the only signal. Status uses text or icons too.
- Touch targets are at least 44 by 44 px.
- Dropdowns, modals, tabs, accordions, and row menus follow WAI-ARIA authoring patterns and work with a keyboard alone.
- Images have alt text. Decorative images use empty alt.
- Scrollbar is custom (orange thumb) with a standard `scrollbar-color` fallback for browsers without `::-webkit-scrollbar`.

## 10. Email design

Two transactional templates share the site look: a dark page, a glass-like card on `#161616` with a `#2a2a2a` border, an orange hero card, an orange pill button, and a footer with links.

| Template | Subject | Content |
| --- | --- | --- |
| Auto-reply | `Thanks for reaching out, {{to_name}}` | Orange hero, "What happens next" steps, portfolio button |
| Reply | `{{subject}}` | Reply card, tinted original-message card, email and WhatsApp buttons |

Constraints: tables for layout, inline styles, `bgcolor` fallbacks beside gradients, logo loaded from a public URL, 600 px maximum width. Gmail and Outlook show the gradient as flat orange. Apple Mail shows the full design.

## 11. Do and do not

| Do | Do not |
| --- | --- |
| Use the accent for one primary action per view | Put the accent on every icon, badge, and border |
| Use glass on a few floating surfaces | Blur the navbar, cards, modal, and sidebar all at once |
| Vary section composition | Repeat one centered title plus card grid |
| Use real content and real states | Add decorative status dots, "AI powered" badges, or fake terminals |
| Keep radius and spacing on the scale | Invent new radii per component |
| Test with keyboard and reduced motion | Rely on hover for anything essential |
