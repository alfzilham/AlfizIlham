# PRD

Product requirements for the Alfiz Ilham portfolio and admin dashboard.

| Field | Value |
| --- | --- |
| Product | Personal portfolio website with an admin dashboard |
| Owner | Alfiz Ilham |
| Status | v1.0, ready for first deploy |
| Live URL | https://alfizilham.vercel.app |
| Related | `SPEC.md` (exact behavior), `ARCHITECTURE.md`, `DESIGN.md`, `WORKFLOW.md` |

## 1. Summary

A fast, distinctive portfolio that presents Alfiz Ilham as a fullstack developer for AI-integrated applications, with a private dashboard that lets him keep it current without touching code: add projects and certificates, collect and approve client testimonials, read and answer inquiries, and watch traffic.

## 2. Problem

- A static CV or social profile does not show working projects, process, or personality, and it is hard to update.
- Inquiries from freelance clients arrive in scattered places (WhatsApp, email, social messages). There is no single inbox and no consistent first response.
- Client feedback lives in chat threads. It is never collected in a form that can be shown publicly.
- The owner has no clear view of who visits the site, from where, and what they open.

## 3. Goals

1. **Convert visitors into conversations.** A visitor can understand who Alfiz is and what he offers, and contact him in under a minute.
2. **Show credibility.** Real projects, certificates, and client testimonials are visible and current.
3. **Keep the owner in control.** Every dynamic part of the site is editable from the dashboard, with a draft step before anything goes public.
4. **Respond professionally by default.** Every inquiry gets an on-brand automatic reply, and the owner can answer from one inbox.
5. **Understand the audience.** Traffic and content views are visible in the dashboard.
6. **Be maintainable by one person.** Few services, clear docs, no recurring cost beyond free or low tiers.

## 4. Non-goals

- Multi-user accounts, roles, or team workflows.
- A blog, CMS, or long-form publishing system.
- Public user accounts, comments, or a public testimonial form.
- Payments, booking, or a client portal.
- Multiple languages. The product is English only in v1.

## 5. Users

| User | Description | Main need |
| --- | --- | --- |
| Prospective client | Business owner, startup founder, or agency looking for a developer, designer, or calligrapher | Quickly judge fit and quality, then contact the owner |
| Recruiter or hiring manager | Scans for skills, education, and shipped work | Find stack, projects, CV, and Resume fast |
| Collaborator or peer | Developer or student | See projects and links to GitHub |
| Owner (admin) | Alfiz Ilham | Maintain content, handle inquiries, see analytics |
| Other project (system) | Another app the owner built that collects feedback | Send a testimonial safely through a revocable key |

## 6. User stories

### Visitors

1. As a visitor, I can see who Alfiz is, his role, and a few headline numbers in the first screen.
2. As a visitor, I can jump between sections from the navigation, and the page scrolls smoothly.
3. As a recruiter, I can download the CV and the Resume.
4. As a visitor, I can browse published projects with a preview image, description, stack, live link, and GitHub link.
5. As a visitor, I can browse certificates by category and open them in place.
6. As a visitor, I can read approved testimonials from real clients.
7. As a prospective client, I can send a message that includes the service I need and optionally my WhatsApp number.
8. As a prospective client, I receive an automatic confirmation email, so I know the message arrived.
9. As a visitor using a keyboard, a screen reader, or reduced motion settings, I can use the whole site.

### Owner

10. As the owner, I can sign in securely and stay signed in for a week.
11. As the owner, I can add a project with only a Live URL and have a preview image fetched for me, with manual upload as a fallback.
12. As the owner, I can save projects and certificates as drafts and publish them when ready.
13. As the owner, I can organize certificates by category.
14. As the owner, I can read incoming messages, mark them read, save a reply draft, and send a reply by email from the dashboard.
15. As the owner, I can see when a reply failed and why, without losing what I wrote.
16. As the owner, I can create an API key per project, see when it was last used, and revoke it.
17. As the owner, I can approve or reject each testimonial before it appears publicly.
18. As the owner, I can see visitors, page views, countries, sources, devices, and top pages, and who is on the site right now.
19. As the owner, I can choose whether to be emailed about new messages and new feedback.
20. As the owner, I can change my password.

### Other projects

21. As another project, I can submit a testimonial with `submit_feedback` using my key, and I am told clearly when the input is invalid or the key is revoked.

## 7. Functional requirements

Priority: **P0** must ship in v1, **P1** should ship in v1, **P2** later.

| ID | Requirement | Priority |
| --- | --- | --- |
| F1 | Single-page public site with the sections listed in `SPEC.md` | P0 |
| F2 | Contact form with validation, honeypot, rate limit, and storage of every message | P0 |
| F3 | Automatic reply email after a contact submission, without blocking the submission if email fails | P0 |
| F4 | Single-admin login with secure session, and route protection for the dashboard | P0 |
| F5 | Project management: create, edit, draft or publish, delete, with image preview | P0 |
| F6 | Certificate management with categories and PDF or image files | P0 |
| F7 | Message inbox with read state, drafts, and email replies, with failures recorded | P0 |
| F8 | Testimonial moderation with Pending, Approved, and Rejected states | P0 |
| F9 | MCP endpoint with per-project API keys for receiving testimonials | P1 |
| F10 | Analytics page backed by GA4 | P1 |
| F11 | Automatic project preview from og:image, then screenshot, then manual upload | P1 |
| F12 | Owner notifications by email for new messages and new feedback, toggled in Settings | P1 |
| F13 | Password change from Settings | P1 |
| F14 | View counts for projects and certificates | P2 |
| F15 | Sections that depend on data hide when empty (Certificates, Testimonials) | P0 |

## 8. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | Public page served from cache with revalidation every 60 seconds. Files uploaded directly to storage. Target good Core Web Vitals on mobile |
| Security | bcrypt password hashing, HttpOnly signed session, middleware plus per-action authorization, input validation, SSRF guard, hashed API keys, rate limits |
| Privacy | Store only what the contact form collects. No third-party trackers other than GA4. Secrets never sent to the browser |
| Accessibility | WCAG 2.2 AA, full keyboard use, visible focus, reduced motion support |
| Reliability | Optional integrations (email, storage, analytics) fail visibly and never break other features |
| Maintainability | One repository, typed code, documented environment, schema deployed with the build |
| Cost | Run on free or low tiers of Vercel, Neon, EmailJS, and Google Analytics |
| Responsiveness | Works from small phones to wide desktops, with a dedicated dashboard layout for tablet and mobile |

## 9. Success criteria

These are qualitative for v1. The owner can set numeric targets after a month of analytics data.

1. A visitor can reach the contact form and send a message on a phone without help.
2. Every contact submission is stored, and the sender receives the automatic reply when email is configured.
3. The owner can publish a new project from the dashboard in under two minutes, without a code change or a deploy.
4. A testimonial sent through MCP appears as Pending in the dashboard and stays hidden until approved.
5. The dashboard analytics show data within a day of the first real visits.
6. No integration outage (email, storage, analytics) prevents the public site from loading.
7. The site passes keyboard-only use and an automated accessibility check with no critical issues.

## 10. Dependencies and assumptions

| Item | Assumption |
| --- | --- |
| Vercel | Hosts the app and runs the build, including the schema push |
| Neon | Provides Postgres and Object Storage |
| EmailJS | Free plan has a monthly quota. Server-side API access is enabled |
| Google Analytics 4 | Property and web stream exist. A service account has Viewer access |
| Microlink | Free screenshot tier is enough for occasional use |
| Owner content | CV, Resume, certificates, and project details are supplied by the owner |
| Domain | Starts on the Vercel domain. A custom domain can be added later by changing `NEXT_PUBLIC_SITE_URL` and the storage CORS origins |

## 11. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| EmailJS quota or outage | Auto-replies and replies fail | Messages are stored first. Failed replies keep their text and error. The owner can contact the person directly |
| Spam through the contact form | Noise in the inbox | Validation, honeypot, rate limit. Add a captcha if spam appears |
| Leaked admin credentials | Unauthorized changes | Strong password, bcrypt, login rate limit, password change in Settings, session expiry |
| Leaked MCP key | Fake testimonials | Entries need approval. Keys are per project and revocable |
| Preview fetch blocked or wrong | Missing or odd project images | Fallbacks and manual upload |
| Free-tier limits (database, storage, email) | Features degrade | Visible not-configured and error states. Move storage provider without code changes |
| In-memory rate limiter resets | Weaker abuse protection | Acceptable for a personal site. Move to a shared store if abuse appears |
| Single maintainer | Knowledge loss | These documents and a short README |

## 12. Release plan

1. **v1.0:** everything marked P0 and P1 above, deployed on the Vercel domain.
2. **After launch:** connect the first real projects to the MCP endpoint, collect the first testimonials, review analytics after two to four weeks.
3. **Later (P2 and ideas, not committed):** custom domain, reorder controls for projects, testimonial request flow from the dashboard, captcha on the contact form, shared rate limiter, light theme if there is demand.

## 13. Open questions

1. Will a custom domain be added, and when? It affects `NEXT_PUBLIC_SITE_URL`, storage CORS, email template links, and the sitemap.
2. Should testimonials be allowed to show a project link or logo?
3. Is a captcha needed once real traffic arrives, or are the current measures enough?
