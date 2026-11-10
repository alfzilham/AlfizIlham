# CONTEXT

Read this first if you are a new contributor or an AI coding agent working on this repository. It gives the project in one page, the rules to follow, and the traps to avoid. Details live in the other documents:

| Document | Read it for |
| --- | --- |
| `PRD.md` | Why the product exists, who it is for, what it must do |
| `SPEC.md` | Exact routes, rules, limits, data model, environment |
| `ARCHITECTURE.md` | How the system is built and why |
| `DESIGN.md` | Tokens, components, motion, accessibility |
| `WORKFLOW.md` | End-to-end flows as Mermaid diagrams |
| `README.md` | Setup and deploy |

## 1. What this is

The personal portfolio of Alfiz Ilham, a Computer Engineering student and freelance fullstack developer based in Aceh Besar, Aceh, Indonesia, plus a private admin dashboard to manage it. It is one Next.js application.

- **Public site:** a single scrolling page. About, skills, projects, services, certificates, testimonials, FAQ, and a contact form.
- **Dashboard:** manage projects, certificates, testimonials, and messages. View analytics. Reply to people by email. Issue API keys so other projects can send testimonials through an MCP endpoint.

Public profile links used in the site: GitHub `alfzilham`, LinkedIn `alfiz-ilham093a2`, contact email `alfizilham@gmail.com`. The live site is `https://alfizilham.vercel.app`.

## 2. Stack at a glance

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 6 with Neon Postgres, S3-compatible storage (Neon Object Storage), Framer Motion, Lenis, Zod, bcryptjs, `jose`, EmailJS (REST), Google Analytics 4 (tag and Data API), deployed on Vercel. Node 20.9 or newer.

## 3. Commands

```
npm install                       install and run prisma generate
npm run dev                       start on http://localhost:3000
npm run typecheck                 tsc --noEmit
npm run build                     prisma generate and next build
npm run db:push                   sync schema to the database
npm run db:studio                 open Prisma Studio
npm run hash-password -- 'pw'     print ADMIN_PASSWORD_HASH_B64
```

On Windows PowerShell, wrap the password in single quotes so `$` is not expanded.

## 4. Where things live

```
src/app/(site)           public page and its actions (contact form, view counter)
src/app/login            login
src/app/dashboard        dashboard pages, and actions.ts for every admin mutation
src/app/api/mcp          MCP server
src/app/api/files        file proxy for private buckets
src/components/site      public sections
src/components/dashboard dashboard UI
src/components/ui        shared primitives
src/lib                  server logic (db, auth, storage, email, ga, preview, validation)
src/lib/content.ts       static portfolio copy (profile, stats, education, stack, services, FAQ)
prisma/schema.prisma     database schema
public/brand             logo mark, lockup, icons
public/files             CV and Resume PDFs
```

## 5. Rules for changes

Follow these unless the owner says otherwise.

**Security**

1. Call `requireAdmin()` at the top of every dashboard page and every server action that changes data. Middleware is a second layer, not a replacement.
2. Keep secrets in `lib/` modules that start with `import 'server-only'`. Only `NEXT_PUBLIC_*` variables may reach the browser.
3. Validate all input with a Zod schema from `lib/validation.ts`. Return `Result` objects with field errors rather than throwing from server actions.
4. Never store MCP keys in plain text. Store the SHA-256 hash only.
5. Any server-side fetch of a user-supplied URL must go through `assertPublicUrl`.

**Content and copy**

6. All UI text, email text, and docs are in English.
7. No emoji and no em dashes anywhere. Use plain hyphens, commas, and periods.
8. Static portfolio copy belongs in `src/lib/content.ts`, not inside components.
9. Sections that depend on data hide themselves when there is nothing to show: Certificates (no Published items), Testimonials (no Approved items). Projects always shows the "See all on GitHub" card.

**Design**

10. Use the tokens and classes in `src/app/globals.css`. Do not add raw hex colors in components when a token exists.
11. One accent color. Do not add new accent hues.
12. Keep the Modal, Select, Field, and RowMenu behavior accessible: focus trap, Escape, arrow keys, visible focus, labels. Do not replace them with unstyled native or ad hoc versions.
13. Respect `prefers-reduced-motion`. New animations must be skipped under it.
14. Do not hand-roll or swap in a second icon family. Icons come from `lucide-react` and the local `brand-icons.tsx`.

**Code style**

15. TypeScript strict. No `any` without a comment explaining why.
16. Interactive components are client components kept as small leaves. Pages and layouts stay Server Components.
17. Do not use `useState` for continuous values such as pointer position or scroll progress. Use Framer Motion values.
18. After a mutation that affects the public page, revalidate through the existing `refresh()` helper in `dashboard/actions.ts`.

## 6. Gotchas

- **Two database URLs.** `DATABASE_URL` is the pooled URL (host contains `-pooler`) used at runtime. `DIRECT_URL` is the direct URL used by `prisma db push`. Swapping them causes migration failures or connection exhaustion.
- **Schema ships with the build.** `vercel-build` runs `prisma db push`. A destructive schema change fails the build on purpose.
- **`SESSION_SECRET` must be 32 or more characters.** Shorter values make signing throw, which looks like a login failure.
- **Password precedence.** A password changed in Settings is stored in the database and overrides `ADMIN_PASSWORD_HASH_B64`. Changing the environment variable later will not change the login until the database override is removed.
- **`ADMIN_PASSWORD_HASH_B64` is base64 of the bcrypt hash**, not the hash itself. Use `npm run hash-password`.
- **`GA_PRIVATE_KEY` newlines.** In `.env`, keep it on one line with `\n` escapes inside double quotes. In the Vercel UI, paste the key as it is.
- **Storage CORS.** Browser uploads fail with a network error unless the bucket allows `PUT` and `GET` with the `Content-Type` header from the site origin and `http://localhost:3000`.
- **Storage region.** Use the region the storage provider returns. Do not copy `us-east-2` from `.env.example` if the project is in another region.
- **EmailJS non-browser setting.** Server-side sends return an error until "Allow EmailJS API for non-browser applications" is turned on in the EmailJS account.
- **Rate limiter is in memory.** It resets on cold starts and is per instance. Do not rely on it as a hard limit.
- **Public page cache.** The page revalidates every 60 seconds and on dashboard mutations. If a change does not appear, check that the action called `refresh()`.
- **Email logo URL.** Email templates load the logo from a public URL, so the logo only appears once the file is reachable there.
- **Preview fetch.** Some sites block bots or have no `og:image`. The fallback chain is og:image, Microlink screenshot, then manual upload.

## 7. Definition of done for a change

1. `npm run typecheck` passes and `npm run build` succeeds.
2. New inputs have Zod validation and visible error states.
3. New admin mutations call `requireAdmin()` and revalidate the right paths.
4. New UI works with keyboard only, has visible focus, and respects reduced motion.
5. Copy follows the rules above (English, no emoji, no em dashes).
6. Docs are updated if routes, environment variables, the schema, or flows changed. At minimum `SPEC.md` and, when flows change, `WORKFLOW.md`.

## 8. Glossary

| Term | Meaning |
| --- | --- |
| Lockup | The logo mark combined with the "Alfiz Ilham" wordmark |
| MCP | Model Context Protocol. Here, a small server that lets other projects submit testimonials with `submit_feedback` |
| Published, Draft | Visibility state of projects and certificates |
| Pending, Approved, Rejected | Moderation state of testimonials |
| Auto-reply | Email sent to a visitor right after they submit the contact form |
| Reply | Email the owner sends from the dashboard to answer a message |
| Presigned upload | A time-limited URL that lets the browser upload straight to the bucket |
