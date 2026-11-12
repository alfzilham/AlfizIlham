<p align="center">
  <img src="public/brand/logo-lockup.webp" alt="Alfiz Ilham" width="820">
</p>

<h1 align="center">Alfiz Ilham Portfolio</h1>

<p align="center">
  A public portfolio and an admin dashboard in a single Next.js project.
</p>

- Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- Prisma + Neon Postgres
- S3-compatible object storage (Neon Object Storage, Cloudflare R2, or AWS S3) with presigned uploads
- Framer Motion, Lenis smooth scroll, custom components (dropdown, modal, scrollbar)
- Google Analytics 4 (tag on the public site, Data API for the dashboard)
- EmailJS for auto-replies and replies sent from the dashboard
- MCP server at `/api/mcp` for receiving testimonials from other projects

## Structure

```
src/app/(site)        Public site (/), contact form server action
src/app/login         Admin login page
src/app/dashboard     Overview, Analytics, Projects, Certificates, Testimonials, Messages, Settings
src/app/api/mcp       MCP server (submit_feedback tool)
src/app/api/files     File server used when the bucket is not public
src/components        site/, dashboard/, ui/ (Button, Modal, Select, Field, Reveal)
src/lib               db, auth, storage, preview, ga, email, validation, content
prisma/schema.prisma  Database schema
public/files          Alfiz_Ilham_CV.pdf and Alfiz_Ilham_Resume.pdf
```

## Run locally

1. Install Node.js 20.9 or newer.
2. Extract the zip, open the folder, and run `npm install`.
3. Copy `.env.example` to `.env`, then fill in the values (see the Environment section).
4. Create the admin password: `npm run hash-password -- "your-password"`. Copy the `ADMIN_PASSWORD_HASH_B64=...` line into `.env`.
5. Create `SESSION_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
6. Create the database tables: `npm run db:push`.
7. Run `npm run dev` and open http://localhost:3000. The dashboard is at http://localhost:3000/login.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose Add New Project and import the repository. The framework is detected automatically as Next.js.
3. Add every variable from `.env` under Settings > Environment Variables (Production and Preview).
4. Deploy. The `vercel-build` script runs `prisma generate`, `prisma db push`, then `next build`, so the database schema stays in sync on every deploy. If a schema change would delete data, the build stops with an error and nothing is deleted.
5. Set `NEXT_PUBLIC_SITE_URL=https://alfizilham.my.id`. The domain must also be added under Settings > Domains in Vercel.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for metadata, the sitemap, and the MCP endpoint |
| `DATABASE_URL` | Neon connection string with the pooler (host contains `-pooler`) |
| `DIRECT_URL` | Neon connection string without the pooler, used by `prisma db push` |
| `ADMIN_USERNAME` | Dashboard login username |
| `ADMIN_PASSWORD_HASH_B64` | Output of `npm run hash-password` |
| `SESSION_SECRET` | Random string of at least 32 characters used to sign the session cookie |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage credentials |
| `S3_PUBLIC_URL` | Optional. Public URL of the bucket. Leave empty if the bucket is private, and files are served through `/api/files` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 tag ID (G-XXXX) for the public site |
| `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY` | GA4 Data API access for the dashboard charts |
| `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | EmailJS credentials |
| `EMAILJS_AUTOREPLY_TEMPLATE_ID`, `EMAILJS_REPLY_TEMPLATE_ID` | Auto-reply template and reply template |
| `EMAILJS_NOTIFY_TEMPLATE_ID`, `ADMIN_NOTIFY_EMAIL` | Optional. Notification email sent to you |

Every integration is optional on the first run. If a value is missing, the dashboard shows a "not configured" label and the other features keep working.

## Object storage

1. Create a bucket, then create an access key with read and write permission.
2. Fill in the `S3_*` variables. The endpoint and region come from your storage provider's panel.
3. Set the bucket CORS so browsers can upload directly:

```json
[
  {
    "AllowedOrigins": ["https://alfizilham.my.id", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Note: Neon Object Storage is still in beta, so the endpoint and the way keys are created may change. The code uses the standard AWS S3 SDK with `forcePathStyle`, so Cloudflare R2 or AWS S3 can replace it without code changes.

File limits: project previews are up to 5 MB (PNG, JPG, WEBP), and certificates are up to 10 MB (PDF, PNG, JPG, WEBP).

## Automatic project previews

When a Live URL is entered, the dashboard fetches the `og:image` from that page. If there is none, it takes a screenshot through Microlink (free, with a daily limit). The image is copied into the bucket so it does not break if the source changes. If both fail, upload an image manually from the modal.

## Google Analytics 4

1. Create a GA4 property and a web data stream for your domain. Copy the Measurement ID into `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
2. In Google Cloud Console, enable the Google Analytics Data API, create a service account, then create a JSON key.
3. In GA4 Admin > Property access management, add the service account email with the Viewer role.
4. Fill in `GA_PROPERTY_ID` (the number, not G-XXXX), `GA_CLIENT_EMAIL`, and `GA_PRIVATE_KEY` from the JSON file. On Vercel, paste the private key as is. In `.env`, write it on one line with `\n` as the line separator.

Dashboard data is cached for 60 seconds to save API quota.

## EmailJS

1. In EmailJS, create an Email Service, then copy the Service ID.
2. In Account > Security, enable "Allow EmailJS API for non-browser applications". Emails are sent from the server, so the keys are never visible to visitors.
3. Copy the Public Key and Private Key from Account > API keys.
4. Create the templates below. Set the "To Email" field to `{{to_email}}`.

Auto-reply template (`EMAILJS_AUTOREPLY_TEMPLATE_ID`), variables: `to_name`, `to_email`, `service`, `from_name`, `reply_to`.

```
Subject: Thanks for reaching out, {{to_name}}
Hi {{to_name}}, thank you for your message about {{service}}. I usually reply within a day.
Alfiz Ilham
```

Reply template (`EMAILJS_REPLY_TEMPLATE_ID`), variables: `to_name`, `to_email`, `subject`, `message`, `original_message`, `from_name`, `reply_to`.

Optional notification template (`EMAILJS_NOTIFY_TEMPLATE_ID`), variables: `to_email`, `subject`, `message`.

Note: the monthly quota on the EmailJS free plan is limited. If sending fails, the message is still saved in the dashboard and the reply error appears in the message history.

## MCP server for testimonials

1. Open Dashboard > Settings > Integrations, then click Create API key for each project (for example: PusakaPosters).
2. Save the key that is shown. It appears only once, and the database stores only its hash.
3. In that project, connect the MCP server with the endpoint `https://alfizilham.my.id/api/mcp` and the header `Authorization: Bearer <key>`.
4. Call the `submit_feedback` tool with the arguments `name`, `message`, `rating` (1 to 5), and optionally `role`, `company`, `project`.
5. Testimonials arrive with the Pending status. The Testimonials section on the site appears once at least one testimonial is approved.

Example of a direct call over HTTP:

```bash
curl -X POST https://alfizilham.my.id/api/mcp \
  -H "Authorization: Bearer mcp_live_xxx" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"submit_feedback","arguments":{"name":"Client name","company":"Company","message":"Great work and fast delivery.","rating":5,"project":"PusakaPosters"}}}'
```

The server supports `initialize`, `ping`, `tools/list`, and `tools/call` over the Streamable HTTP transport with JSON responses. Revoke a key at any time from the Integrations page.

## Content behavior

- Projects: only the "See all on GitHub" card is shown until at least one project has the Published status.
- Certificates: this section is hidden until at least one certificate is Published.
- Testimonials: this section is hidden until at least one testimonial is Approved.
- Changes made in the dashboard update the public page immediately (automatic revalidation).

## Security

- Single-user login with bcrypt, a signed HttpOnly session cookie (HS256), and login attempt rate limiting.
- Middleware protects every `/dashboard` route, and each server action checks the session again.
- The contact form uses Zod validation, a honeypot, and rate limiting.
- Preview fetching rejects local and private addresses.
- The password can be changed from Settings > Security. The new password is stored as a hash in the database and replaces the password from the environment.

## Accessibility

- WCAG 2.2 AA target: color contrast, always-visible focus rings, a skip link, labels on every input, and error messages linked to their fields.
- Dropdowns, modals, tabs, accordions, and row menus follow WAI-ARIA patterns and are fully usable with a keyboard.
- `prefers-reduced-motion` turns off Lenis, Framer Motion animations, the marquee, and counters.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Sync the schema to the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run hash-password -- "..."` | Generate the admin password hash |