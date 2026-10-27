# ZoyCoders API

Backend for the ZoyCoders website, admin panel and mobile app.

**Stack:** NestJS 11 · PostgreSQL · Prisma 6 · Swagger (OpenAPI 3) · JWT auth · Cloudinary (optional) · Nodemailer

Interactive API docs: **http://localhost:4000/api/docs** (raw JSON at `/api/docs-json`, which you can import into Postman).

---

## Quick start

Prerequisites: Node.js 20+ and PostgreSQL 14+ (local install, Postgres.app, or Docker).

```bash
npm install                    # also generates the Prisma client
cp .env.example .env           # then fill in JWT_SECRET and ADMIN_PASSWORD
docker compose up -d postgres  # skip if you already run Postgres locally
npm run db:migrate:dev         # creates tables
npm run db:seed                # creates the admin + starter content (safe to re-run)
npm run start:dev              # http://localhost:4000/api
```

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run start:dev` | Dev server with hot reload |
| `npm run build` / `npm run start:prod` | Compile to `dist/` and run it |
| `npm run db:migrate:dev` | Create/apply a migration after editing `prisma/schema.prisma` and regenerate the client |
| `npm run db:migrate` | Apply committed migrations (use in production/CI) |
| `npm run db:seed` | Upsert the admin from `.env` and add starter content |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against a real Postgres database (see below) |
| `npm run lint` | ESLint + Prettier |

## Project structure

```
src/
  main.ts, app.setup.ts     bootstrap: helmet, CORS, cookies, /api prefix, static /uploads
  app.module.ts             global guards (rate limit + auth), validation pipe, error filter, response wrapper
  config/
    env.ts                  typed, validated environment variables (app fails fast if misconfigured)
    swagger.ts              OpenAPI document and UI
  generated/prisma/         Prisma Client output (git-ignored, created by `prisma generate` on install)
  common/                   decorators, DTO helpers, error filter, response interceptor, slug/html utils
  core/                     infrastructure shared by feature modules
    prisma/                 PrismaService
    storage/                image storage (Cloudinary or local disk) with content-based type checks
    mail/                   SMTP email sending
  modules/                  one folder per feature: <name>.module/controller/service.ts + dto/ + entities/
    auth/                   login/logout/me/change-password, guards/ (global JwtAuthGuard)
    uploads/                image upload endpoint
    hero/ services/ projects/ testimonials/ faqs/ pages/   CMS content (public read + admin CRUD)
    blog/                   posts, categories, tags (public read + admin CRUD + publish/unpublish)
    inquiries/              contact + project inquiry form, admin status tracking and email replies
    dashboard/ sitemap/ health/
prisma/
  schema.prisma, migrations/, seed.ts
test/                       e2e tests (supertest)
```

Each feature module has a **public controller** (`/api/<resource>`, published content only) and an
**admin controller** (`/api/admin/<resource>`, everything including drafts).

## API conventions

- **Base URL:** `/api`
- **Success:** `{ "success": true, "data": ... }`
- **Error:** `{ "success": false, "statusCode": 400, "message": "Validation failed", "errors": ["email must be an email"] }`
- **Paginated lists** (`/blogs`, `/admin/blogs`, `/admin/inquiries`): `data = { items: [...], meta: { page, limit, total, totalPages } }`, controlled by `?page=1&limit=10` (max 50).
- **Slugs** are generated from the title when not provided and must be unique (`409` on conflict).
- **Unknown fields are rejected** (`400`), so send only documented properties.

### Main endpoints

| Area | Public (website + mobile) | Admin |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/logout` | `GET /auth/me`, `PATCH /auth/password` |
| Hero | `GET /hero` | CRUD `/admin/hero` |
| Services | `GET /services`, `GET /services/:slug` | CRUD `/admin/services` |
| Portfolio | `GET /projects?featured=true`, `GET /projects/:slug` | CRUD `/admin/projects` |
| Blog | `GET /blogs?category=&tag=&search=`, `GET /blogs/:slug`, `GET /blog-categories`, `GET /blog-tags` | CRUD `/admin/blogs`, `POST /admin/blogs/:id/publish` · `/unpublish`, CRUD `/admin/blog-categories`, `/admin/blog-tags` |
| Testimonials | `GET /testimonials` | CRUD `/admin/testimonials` |
| FAQs | `GET /faqs?category=` | CRUD `/admin/faqs` |
| Legal/CMS pages | `GET /pages/:slug` (e.g. `privacy-policy`, `terms-and-conditions`) | CRUD `/admin/pages` |
| Inquiries | `POST /inquiries` (type `CONTACT` or `PROJECT`) | `GET /admin/inquiries`, `GET /admin/inquiries/:id`, `PATCH /admin/inquiries/:id/status`, `POST /admin/inquiries/:id/reply` |
| Uploads | - | `POST /admin/uploads` (multipart `file`, `folder`) |
| SEO | `GET /sitemap` (slugs for `sitemap.xml`) | - |
| Other | `GET /health` | `GET /admin/dashboard/stats` |

Content is visible publicly only when `isPublished: true` (blog posts: `status: PUBLISHED`).

## Authentication

There is a single global guard, so **every route requires an admin session unless it is marked `@Public()`**.

- **Admin panel (browser):** `POST /api/auth/login` sets an httpOnly `token` cookie. Call the API with
  `credentials: 'include'`. Cookie-authenticated writes are only accepted from origins listed in
  `CORS_ORIGINS` (CSRF protection).
- **Mobile app / Postman / Swagger:** use `data.token` from the login response as
  `Authorization: Bearer <token>`. In Swagger, click **Authorize** and paste the token into `bearer`.
- Passwords are hashed with bcrypt (12 rounds). Deactivated admins (`isActive = false`) are rejected immediately.
- Login is limited to 10 attempts per 15 minutes per IP.

## Image uploads

1. `POST /api/admin/uploads` with `multipart/form-data` (`file`, optional `folder`: `hero | services | projects | blog | testimonials | general`).
2. Save the returned `url` and `publicId` on the record (`imageUrl` + `imagePublicId`, `coverImageUrl` + `coverImagePublicId`, `avatarUrl` + `avatarPublicId`).
3. When a record's image is replaced or the record is deleted, the old file is removed automatically.

Only JPEG, PNG, WebP and GIF are accepted. The type is checked from the file's bytes, not its name, and SVG is
refused because it can contain scripts. Max size is `UPLOAD_MAX_SIZE_MB` (default 5 MB).
With Cloudinary credentials set, files go to Cloudinary; otherwise they are written to `UPLOAD_DIR` and
served from `/uploads/...` (fine for development, not for production).

## Contact inquiries and email replies

- `POST /api/inquiries` is public and limited to 5 submissions per 10 minutes per IP.
- Status flow: `NEW` → `IN_PROGRESS` → `REPLIED`.
- `POST /api/admin/inquiries/:id/reply` emails the visitor (quoting their message) and **always records the attempt**:
  - sent: `201`, reply `emailStatus: "SENT"`, and the inquiry becomes `REPLIED`
  - failed: `502` with a clear message; the reply is stored with `emailStatus: "FAILED"` and the SMTP error, visible in `GET /admin/inquiries/:id`
- Set `SMTP_*` to enable email. For local testing, [Mailtrap](https://mailtrap.io) or [Ethereal](https://ethereal.email) SMTP credentials work well.
- Optional: `INQUIRY_NOTIFY_EMAIL` receives a notification for every new inquiry.

## Environment variables

See [`.env.example`](.env.example) for the full annotated list. The app validates them at startup and exits
with a clear message if something required is missing (e.g. `JWT_SECRET` shorter than 32 characters).

## Testing

```bash
npm test             # unit tests
npm run test:e2e     # end-to-end tests
```

The e2e tests run against `postgresql://postgres:postgres@localhost:5432/zoycoders_test` (override with
`TEST_DATABASE_URL`). Create that database once (`createdb zoycoders_test`). The tests apply migrations and
**empty all tables** before each suite, and refuse to run against a database whose name doesn't end in `_test`.
Email sending is mocked; uploads go to a temp directory.

Covered: login, cookie and bearer auth, CSRF origin check, protected routes, validation errors, malformed JSON,
the blog draft → publish → unpublish flow, unique slugs, published-only public content, uploads (real image,
fake image, wrong type, oversized, path traversal, old-file cleanup), inquiry replies (sent and failed), the dashboard
counts, and rate limits on login and the inquiry form.

## Production checklist

- `NODE_ENV=production`, a strong unique `JWT_SECRET`, and `npm run db:migrate` on every deploy.
- Serve over **HTTPS**. If the admin panel is on a different domain than the API, set `COOKIE_SAMESITE=none`
  (cookies then require HTTPS) and list the panel's origin in `CORS_ORIGINS`.
- Behind a proxy/load balancer, set `TRUST_PROXY=1` so rate limits use the real client IP.
- Configure Cloudinary (local disk uploads don't survive redeploys) and SMTP.
- Swagger is **off by default in production**; set `SWAGGER_ENABLED=true` only if you want it public.
- Blog and page `content` is stored as written (Markdown/HTML). **Sanitize it in the frontend** before rendering it as HTML.
- Run `npm audit --omit=dev`. Known: an advisory in `deepmerge-ts`, used only by the Prisma CLI's config loader
  (a build tool, not loaded by the running server); it is fixed by Prisma 7, which needs a separate migration.

## Relation to the Calcutta Sweets backend

This API follows the same conventions as the existing Express backend (`{ success, data }` envelope,
httpOnly `token` cookie plus Bearer fallback, bcrypt, Prisma/Postgres, `imageUrl` + `publicId` pairs with
automatic cleanup, rate-limited login, env-seeded admin). It also adds the Nest equivalents of what that
codebase did by hand: DTO validation with class-validator (instead of Zod) so Swagger documents every request
automatically, auth that is on by default, a central error filter, content-checked uploads, and e2e tests.
