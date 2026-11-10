# SPEC

Technical specification for the Alfiz Ilham portfolio and admin dashboard. This document describes what the system does and the exact rules it enforces. For how the pieces fit together, see `ARCHITECTURE.md`. For the reasons behind the product, see `PRD.md`.

## 1. Scope

One Next.js application with two surfaces:

- **Public site** at `/`, a single scrolling page.
- **Admin dashboard** at `/dashboard/*`, behind a single-user login at `/login`.

Plus two server endpoints: an MCP server at `/api/mcp` and a file server at `/api/files/*`.

## 2. Routes

| Route | Type | Access | Purpose |
| --- | --- | --- | --- |
| `/` | Page, revalidates every 60 s | Public | Portfolio page |
| `/login` | Page | Public (redirects to `/dashboard` when signed in) | Admin login |
| `/dashboard` | Page | Admin | Overview |
| `/dashboard/analytics` | Page | Admin | GA4 charts |
| `/dashboard/projects` | Page | Admin | Manage projects |
| `/dashboard/certificates` | Page | Admin | Manage certificates and categories |
| `/dashboard/testimonials` | Page | Admin | Moderate testimonials |
| `/dashboard/messages` | Page | Admin | Read and reply to contact messages |
| `/dashboard/settings` | Page | Admin | Profile, site, notifications, security, integrations (`?tab=integrations`) |
| `/api/mcp` | Route handler, `POST` only | Bearer API key | Receive testimonials |
| `/api/files/[...key]` | Route handler, `GET` | Public | Serve stored files when the bucket is not public |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Metadata routes | Public | SEO and PWA metadata |

Middleware matches `/dashboard/:path*` and `/login`. A request to `/dashboard` without a valid session redirects to `/login`. A request to `/login` with a valid session redirects to `/dashboard`.

## 3. Public site

### 3.1 Sections, in order

1. Nav (anchor links: About, Skills, Projects, Services, FAQ, Contact)
2. Hero (name, role, tagline, headline stats, CV and Resume downloads)
3. About
4. Stats (animated counters)
5. Education
6. Stack (tool logos grouped by category)
7. Projects
8. Services
9. Certificates (rendered only if at least one is Published)
10. Testimonials (rendered only if at least one is Approved)
11. FAQ (tabbed)
12. Contact
13. Footer

Static copy lives in `src/lib/content.ts`. Dynamic sections read from the database in `src/app/(site)/page.tsx`.

### 3.2 Projects section

- Shows Published projects ordered by `sortOrder`.
- Each card shows preview image, title, description, tech stack chips, Live URL and GitHub URL when present.
- When no project is Published, only the "See all on GitHub" card is shown.
- A view is counted when a project is opened, at most once per visitor per project per hour.

### 3.3 Certificates section

- Shows Published certificates, filterable by category.
- File type is `pdf` or `image`. Selecting a certificate opens a modal. PDFs render in an embedded frame, images render as an image.
- A view is counted when a certificate is opened, at most once per visitor per certificate per hour.

### 3.4 Contact form

Fields and validation (Zod, `contactSchema`):

| Field | Rule |
| --- | --- |
| `name` | Required, 2 to 80 characters |
| `email` | Required, valid email, up to 160 characters |
| `whatsapp` | Optional, matches `+?[0-9 ()-]{7,20}` |
| `service` | Required, one of the service names or `Other` |
| `customService` | Required when `service` is `Other`, up to 120 characters |
| `message` | Required, 10 to 4000 characters |
| `company` | Honeypot, must be empty |

Service options: Fullstack web apps, Mobile apps, AI integration and automation, Graphic design, Arabic calligraphy, Other.

On submit (`submitContact`):

1. Validate input. Return field errors on failure.
2. Rate limit: 4 submissions per IP per 10 minutes.
3. Insert a `Message` row.
4. If EmailJS is configured, send the auto-reply and set `autoReplySentAt`. A failure is logged and does not fail the submission.
5. If `notifications.newMessage` is on, send the optional admin notification.
6. Return `success` with a flag telling whether the auto-reply was sent.

## 4. Admin dashboard

### 4.1 Authentication

- Single account. Username from `ADMIN_USERNAME`. Password hash from the database (`Setting` key `adminPasswordHash`) when present, otherwise from `ADMIN_PASSWORD_HASH_B64` (base64 of a bcrypt hash).
- Login is rate limited to 6 attempts per IP per 15 minutes.
- Credential check always runs bcrypt, using a dummy hash when the real one is missing, so timing does not reveal whether the username was right. Username comparison uses a constant-time compare.
- Session is a JWT (HS256, `jose`) in the `aiz_session` cookie. Cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production, path `/`, 7 days.
- `SESSION_SECRET` must be at least 32 characters, otherwise signing throws.
- Every server action and every dashboard page calls `requireAdmin()`, in addition to the middleware.

### 4.2 Overview

Four KPI cards (Visitors, Page views, Countries from GA4, and Pending feedback), a live visitors panel (active in the last 30 minutes), and recent pending feedback. GA-backed cards show an empty or "not connected" state when analytics is not configured.

### 4.3 Analytics

- Data from the GA4 Data API through a service account.
- Ranges: Today, 7 days, 30 days, 12 months.
- Shows realtime active users, totals (users, views, average session, bounce rate, countries), a time series, weekday distribution, countries, traffic sources, devices, and top pages.
- Results are cached for 60 seconds.
- If any of `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY` is missing, the page shows a "not configured" state.

### 4.4 Projects

Fields (`projectSchema`):

| Field | Rule |
| --- | --- |
| `title` | 2 to 120 characters |
| `description` | 10 to 1200 characters |
| `techStack` | Up to 20 items, each 1 to 40 characters |
| `liveUrl`, `githubUrl` | Optional, must start with `http://` or `https://`, up to 500 characters |
| `imageUrl`, `imageKey`, `imageSource` | Preview image. Source is `og`, `screenshot`, or `upload` |
| `status` | `DRAFT` or `PUBLISHED` |

Actions: create, edit, publish or unpublish, delete. Deleting a project, or replacing its image on edit, also deletes the old stored image. New projects get the next `sortOrder` (highest plus one), and the public site lists them in that order. There is no drag-to-reorder control.

Preview resolution when a Live URL is given (`fetchProjectPreview`):

1. Validate the URL (`assertPublicUrl`). Reject non-http(s) schemes and local or private hosts: `localhost`, `*.local`, `*.internal`, `127.*`, `10.*`, `192.168.*`, `172.16-31.*`, `169.254.*`, `0.0.0.0`, `[::1]`.
2. Fetch the page (8 s timeout) and read `og:image`, then `twitter:image`.
3. If none, request a screenshot from Microlink (25 s timeout, 1440 by 900 viewport).
4. Copy the resulting image into the bucket and store its key.
5. If everything fails, the admin uploads an image manually.

### 4.5 Certificates

Fields (`certificateSchema`): `title` (2 to 160), `issuer` (2 to 120), `categoryId` (required), `fileUrl` (required), `fileType` (`pdf` or `image`), `status`.

- Categories are created inline (`addCategory`) and have a unique name. The page seeds Course, Competition, Organization, and Award on first load.
- A category that still has certificates cannot be deleted at the database level (`onDelete: Restrict`). Replacing or deleting a certificate also deletes its old stored file.

### 4.6 Testimonials

- Statuses: `PENDING`, `APPROVED`, `REJECTED`.
- New testimonials from MCP start as `PENDING`.
- Only `APPROVED` testimonials appear on the public site.
- Admin can approve, reject, set back to pending, or delete.

### 4.7 Messages

- A message has `read` state and a list of `Reply` rows.
- Admin can mark read or unread, mark all read, delete, and reply.
- Reply rules: 2 to 6000 characters. "Save draft" stores the text in `Setting` under `draft:<messageId>`. "Send" calls EmailJS with the reply template.
- Success creates a `Reply` with `sentAt`, marks the message read, and deletes the draft.
- Failure creates a `Reply` with `error` (first 300 characters) so the failed attempt stays visible. The admin sees an error message.
- If EmailJS is not configured, sending returns an error and nothing is stored.
- The reply subject is `Re: <service>` or `Re: <customService>` when the service is `Other`.

### 4.8 Settings

| Tab | Content |
| --- | --- |
| Profile | `fullName`, `username`, `email`, `location` |
| Site | `title`, `domain` |
| Notifications | `newMessage`, `newFeedback` toggles |
| Security | Change password (new password at least 10 characters, current password required) |
| Integrations | EmailJS, storage, and analytics status. MCP API keys: create per project, revoke |

Settings are stored as JSON rows in `Setting` with keys `profile`, `site`, `notifications`, merged over defaults in `src/lib/settings.ts`.

## 5. MCP server

Endpoint: `POST /api/mcp`. Transport: Streamable HTTP with JSON responses. Auth: `Authorization: Bearer mcp_live_...`.

| Method | Behavior |
| --- | --- |
| `initialize` | Returns protocol version, `tools` capability, server info, and usage instructions |
| `ping` | Returns `{}` |
| `tools/list` | Returns the single tool `submit_feedback` |
| `tools/call` | Runs `submit_feedback` |
| Notification (no `id`) | `202` with no body |

Tool `submit_feedback` arguments (`feedbackSchema`):

| Argument | Rule |
| --- | --- |
| `name` | Required, 1 to 80 |
| `message` | Required, 5 to 1500 |
| `rating` | Required, integer 1 to 5 |
| `role`, `company` | Optional, up to 80 |
| `project` | Optional, up to 120 |

Behavior and errors:

- Missing, malformed, or revoked key: `401` with code `-32001`.
- More than 60 requests per key per minute: `429` with code `-32002`.
- Invalid JSON: `400`, code `-32700`. Batch requests: `400`, code `-32600`. Unknown method: code `-32601`.
- Invalid arguments: a normal result with `isError: true` and the issue list.
- Success creates a `Testimonial` with `status: PENDING`, `source` set to the key's project name, and `apiKeyId`. The key's `lastUsedAt` is updated on every call. If `notifications.newFeedback` is on, the admin is notified.
- `GET` and `DELETE` return `405`.

API keys:

- Format `mcp_live_` plus 24 random bytes in base64url.
- Only the SHA-256 hash is stored. The full key is shown once at creation. A display prefix (first 13 and last 4 characters) is stored.
- Revoking sets `revokedAt`. Revoked keys are rejected.

## 6. File storage

- S3-compatible, `forcePathStyle` enabled, default region `us-east-2` when `S3_REGION` is empty.
- Uploads use presigned `PUT` URLs created by `createUploadUrl`. The browser uploads directly to the bucket.
- Limits: project previews 5 MB (PNG, JPG, WEBP, and similar images, never PDF), certificates 10 MB (PDF, PNG, JPG, WEBP).
- Keys are namespaced `projects/...` and `certificates/...`.
- Public URL: `S3_PUBLIC_URL/<key>` when set, otherwise `/api/files/<key>`.
- `/api/files/*` only serves keys matching `^(projects|certificates)/[\w./-]+$`, rejects `..`, and responds with a one-year immutable cache header.
- The bucket needs CORS allowing `PUT` and `GET` with the `Content-Type` header from the site origin and `http://localhost:3000`.

## 7. Email

- Sent server-side through the EmailJS REST API using the service ID, public key, and private key (`accessToken`). The account must allow non-browser API calls.
- `emailConfigured()` is true when service ID, public key, and private key are all set.

| Template | Env var | Parameters |
| --- | --- | --- |
| Auto-reply | `EMAILJS_AUTOREPLY_TEMPLATE_ID` | `to_name`, `to_email`, `service`, `from_name`, `reply_to` |
| Reply | `EMAILJS_REPLY_TEMPLATE_ID` | `to_name`, `to_email`, `subject`, `message`, `original_message`, `from_name`, `reply_to` |
| Notification (optional) | `EMAILJS_NOTIFY_TEMPLATE_ID` | `to_email`, `to_name`, `subject`, `message` |

`reply_to` is `ADMIN_NOTIFY_EMAIL`. Notifications never throw.

## 8. Data model

| Model | Key fields | Notes |
| --- | --- | --- |
| `Project` | `title`, `description`, `techStack[]`, `liveUrl`, `githubUrl`, `imageUrl`, `imageKey`, `imageSource`, `status`, `views`, `sortOrder` | Index on `(status, sortOrder)` |
| `Category` | `name` (unique) | Has many `Certificate` |
| `Certificate` | `title`, `issuer`, `categoryId`, `fileUrl`, `fileKey`, `fileType`, `status`, `views` | Category delete is restricted |
| `ApiKey` | `project`, `prefix`, `hash` (unique), `lastUsedAt`, `revokedAt` | Has many `Testimonial` |
| `Testimonial` | `name`, `role`, `company`, `message`, `rating`, `project`, `source`, `apiKeyId`, `status` | `apiKeyId` set to null when the key is deleted |
| `Message` | `name`, `email`, `whatsapp`, `service`, `customService`, `body`, `read`, `autoReplySentAt` | Has many `Reply` |
| `Reply` | `messageId`, `body`, `sentAt`, `error` | Deleted with its message |
| `Setting` | `key` (primary), `value` (JSON) | Settings, password hash, reply drafts |

Enums: `PublishStatus` (`DRAFT`, `PUBLISHED`), `FeedbackStatus` (`PENDING`, `APPROVED`, `REJECTED`).

## 9. Caching and freshness

- The public page uses `revalidate = 60`.
- Dashboard actions revalidate affected paths, so a publish or unpublish shows on the public page immediately.
- GA data is cached for 60 seconds.

## 10. Rate limits

| Key | Limit |
| --- | --- |
| `contact:<ip>` | 4 per 10 minutes |
| `login:<ip>` | 6 per 15 minutes |
| `view:<kind>:<id>:<ip>` | 1 per hour |
| `mcp:<apiKeyId>` | 60 per minute |

The limiter is in memory, per server instance. It slows abuse but is not a hard global limit.

## 11. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL for metadata, sitemap, MCP endpoint |
| `DATABASE_URL` | Yes | Pooled Postgres connection string |
| `DIRECT_URL` | Yes | Direct connection string for `prisma db push` |
| `ADMIN_USERNAME` | Yes | Login username |
| `ADMIN_PASSWORD_HASH_B64` | Yes | Base64 of the bcrypt hash |
| `SESSION_SECRET` | Yes | 32+ characters, signs sessions |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | For uploads | Object storage |
| `S3_PUBLIC_URL` | No | Public bucket base URL |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | GA4 tag |
| `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY` | For analytics | GA4 Data API |
| `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | For email | EmailJS credentials |
| `EMAILJS_AUTOREPLY_TEMPLATE_ID`, `EMAILJS_REPLY_TEMPLATE_ID` | For email | Templates |
| `EMAILJS_NOTIFY_TEMPLATE_ID`, `ADMIN_NOTIFY_EMAIL` | No | Notification email. `ADMIN_NOTIFY_EMAIL` is also the `reply_to` address |

Every optional integration degrades to a visible "not configured" state without breaking other features.

## 12. Build and scripts

| Script | Behavior |
| --- | --- |
| `dev` | `next dev` |
| `build` | `prisma generate` then `next build` |
| `vercel-build` | `prisma generate`, `prisma db push --skip-generate`, then `next build` |
| `typecheck` | `tsc --noEmit` |
| `db:push`, `db:studio` | Prisma schema sync and Studio |
| `hash-password -- "..."` | Prints `ADMIN_PASSWORD_HASH_B64=...` |

Node 20.9 or newer is required.

## 13. Out of scope

- Multiple admin accounts or roles.
- A blog or CMS for long-form content.
- Public user accounts, comments, or a public testimonial form.
- A hard global rate limiter (Redis or similar).
- Internationalization. The site and dashboard are English only.
