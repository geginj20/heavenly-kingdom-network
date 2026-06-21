# Heavenly Kingdom Network / Kingdom Mission Network — Repository Audit Report

**Repository:** `geginj20/heavenly-kingdom-network` (master, HEAD at audit time: `dbccd12`)
**Stack:** React 19 + TypeScript SPA (Vite, HashRouter) · Hono backend on Cloudflare Pages Functions · Supabase (Postgres) · Drizzle ORM · Paystack/PayPal/Wise payments
**Method:** Full shallow clone and line-by-line static review of all 106 source files (89 frontend, 17 backend), CI/CD config, environment files, and dependency manifests. No live deployment, dynamic testing, or penetration testing was performed — findings are evidence-based from source, not from runtime exploitation. Severity uses an Impact × Likelihood model (Critical/High/Medium/Low), consistent with OWASP Risk Rating methodology.

---

## Executive Summary

This is a well-scaffolded solo/small-team MVP with genuinely good frontend craftsmanship (53 shadcn/ui primitives, consistent TypeScript typing, Zod validation on most write endpoints, a sensible Hono + Cloudflare Pages Functions architecture). However, it is **not production-ready in its current state**. The most serious issues are: a committed `.env` file despite `.gitignore` excluding it, a hardcoded fallback JWT secret, an unauthenticated/unverified payment webhook that allows forged donation records, an IDOR on donation history, wildcard CORS contradicting the documented "same-origin" model, a service-role Supabase key that makes the README's "Row-Level Security" claim moot, and **effectively zero automated test coverage** (2 test files, one of which is a literal `1+1=2` placeholder, against 106 implementation files). There are also no database migrations committed despite a Drizzle migration toolchain being configured, no dependency-vulnerability scanning in CI, and no production observability/error-tracking integration.

None of these are unusual for an early-stage open-source project, and several (input validation, route-level auth gating on admin/sermon/event mutations, secret-free CI deploy flow) are done correctly. But the donation/payment integrity issues and the committed-secrets pattern should be treated as launch blockers, not backlog items.

---

## 1. Core Strengths (with evidence)

### 1.1 Consistent input validation at the API boundary
Nearly every mutating route uses Zod schemas via `@hono/zod-validator` with sensible length/type bounds, e.g. `backend/src/routes/auth.ts`:
```ts
const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
});
```
This pattern is repeated in `prayers.ts`, `sermons.ts`, `events.ts`, `donations.ts`, `payments.ts`, and `bible.ts` — a real, codebase-wide discipline rather than a one-off.

### 1.2 Role-gated admin/content-mutation routes
Sermon, event, and admin-dashboard mutation endpoints are wrapped in a `requireAdmin` middleware that validates a JWT and checks `role`:
```ts
// backend/src/lib/jwt.ts
export async function requireAdmin(c: Context, next: () => Promise<void>) {
  ...
  if (payload.role !== "admin" && payload.role !== "superadmin") {
    return c.json({ error: "Forbidden" }, 403);
  }
}
```
Applied consistently: `sermonRoutes.post("/", requireAdmin, ...)`, `eventRoutes.delete("/:id", requireAdmin, ...)`, and `adminRoutes.use("*", requireAdmin)` (blanket-protects the whole admin sub-router in one line — good DRY practice).

### 1.3 Rate limiting exists and is tiered
`backend/src/lib/rateLimiter.ts` implements a sliding-window limiter with a stricter tier for auth (`MAX_STRICT = 5`/min) vs. general traffic (`MAX_REQUESTS = 20`/min), applied to `/login`, `/register`, and prayer submission. This is a real, deliberate anti-abuse control, not just a stub.

### 1.4 Secret-free CI/CD pipeline structure
`.github/workflows/ci.yml` separates `validate-frontend` (lint → test → build), `validate-backend` (`tsc --noEmit`), and a gated `deploy` job that only runs on `push` to `master` after both validation jobs succeed, using GitHub Actions `secrets.CF_API_TOKEN`/`secrets.CF_ACCOUNT_ID` rather than any token in source. The artifact-passing pattern (`dist/` built once, reused for deploy) avoids rebuilding with different toolchain state.

### 1.5 Clean component architecture and design-system reuse
`src/components/ui/` contains 53 shadcn/ui primitives reused consistently across all six page modules (`PrayerWall.tsx`, `Sermons.tsx`, `Events.tsx`, `BibleReader.tsx`, `AdminDashboard.tsx`, `DonationHistory.tsx`), with shared cross-cutting components (`ErrorBoundary.tsx`, `LoadingSkeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`) factored out once and reused — solid DRY adherence at the UI layer.

### 1.6 Graceful third-party API degradation
`backend/src/routes/streams.ts` falls back to a hardcoded `fallbackStreams` array if Supabase returns no rows or errors; `bible.ts`'s `/daily` endpoint falls back to a hardcoded verse if all three Bible API providers fail. This defensive pattern prevents a single external dependency outage from breaking the page (see weakness 2.9 for the flip side of this).

### 1.7 Genuinely ambitious feature surface, well-documented
The README is accurate and specific (not aspirational marketing copy) — it correctly enumerates 22 Bible translations across 3 named API sources, lists real script commands, and gives an honest architecture summary. `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md` all exist with real (if thin) content, which is better documentation hygiene than most repos of this size.

---

## 2. Critical Weaknesses (quantified, with code)

Severity key: 🔴 Critical 🟠 High 🟡 Medium 🟢 Low

### 2.1 🔴 Committed `.env` file despite `.gitignore` exclusion
`.gitignore` explicitly lists `.env`, yet a tracked `.env` file exists at repo root containing a hardcoded default admin credential pair:
```
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=admin123
```
No live API keys were found in this particular file, but the pattern (a tracked file the `.gitignore` is supposed to exclude) means it was force-added at some point, and it directly contradicts the project's own `SECURITY.md`: *"Never commit secrets, tokens, or credentials to the repository."* This is a process failure that would leak real secrets the moment someone reuses this `.env` for a real deployment without renaming it.

### 2.2 🔴 Unauthenticated, unverified payment webhook → forgeable donation records
`backend/src/routes/payments.ts`:
```ts
paymentRoutes.post("/webhook", async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Not configured" }, 503);
  const body: Record<string, unknown> = await c.req.json();
  const event = body.event as string;
  ...
  if (event === "charge.success" && (data.status as string) === "success") {
    await supabase.from("donations").insert({ ...status: "completed" });
  }
  return c.json({ received: true });
});
```
There is no verification of Paystack's `x-paystack-signature` HMAC header. Anyone who knows (or guesses) this endpoint URL can POST an arbitrary `charge.success` payload and have it recorded as a completed donation, polluting the donor ledger and the admin analytics dashboard (`adminRoutes.get("/stats")` sums exactly this table). This is OWASP API4:2023 (Unrestricted Resource Consumption) / CWE-345 (Insufficient Verification of Data Authenticity) territory.

### 2.3 🟠 IDOR on donation history endpoint
```ts
donationRoutes.get("/history", async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json([]);
  const { data } = await supabase.from("donations").select("*").eq("donor_email", email)...
});
```
No authentication or ownership check — anyone who knows or guesses a donor's email can retrieve their full donation history (amounts, dates, recurrence) by querying `GET /api/donations/history?email=<target>`. This is a direct violation of OWASP API1:2023 (Broken Object Level Authorization).

### 2.4 🟠 Hardcoded fallback JWT secret shipped in source
`backend/src/lib/jwt.ts`:
```ts
function getJwtSecret(): string {
  return getEnv("JWT_SECRET") || process.env.JWT_SECRET || "hkn-dev-secret-change-in-production";
}
```
and `backend/wrangler.toml`:
```
[vars]
JWT_SECRET = "dev-secret-change-in-production"
```
If `JWT_SECRET` is ever unset or misnamed in the Cloudflare Pages environment (a one-checkbox mistake), the application silently signs and verifies production tokens with a publicly known string, allowing anyone to forge an `admin`/`superadmin` JWT and access every admin endpoint. A fallback secret should not exist at all — the app should fail closed (throw on boot) if the secret is missing.

### 2.5 🟠 Wildcard CORS contradicts the documented security model
`backend/src/index.ts` and the production entrypoint `functions/api/[[path]].ts` both call:
```ts
app.use("*", cors());
```
With no options, Hono's `cors()` defaults to `Access-Control-Allow-Origin: *`. The README states *"Backend: Hono REST API running on Cloudflare Pages Functions (same origin, no CORS needed)"* — yet CORS is enabled anyway, and enabled permissively. Combined with `localStorage`-stored JWTs (2.7) this widens the blast radius of any XSS: a malicious origin can read API responses cross-site if it obtains a token, and the wildcard contradicts least-privilege principles regardless of token storage.

### 2.6 🟠 Service-role Supabase key bypasses Row-Level Security everywhere
`backend/src/lib/supabase.ts` always authenticates with `SUPABASE_SERVICE_KEY`:
```ts
const key = getEnv("SUPABASE_SERVICE_KEY") || process.env.SUPABASE_SERVICE_KEY;
_supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
```
The README's architecture line — *"Database: Supabase PostgreSQL with Row-Level Security"* — is misleading: RLS policies are irrelevant when every query runs as the service role, which bypasses RLS by design. The **entire** authorization model lives in the `requireAdmin` Hono middleware, not the database. Any route handler that forgets to call `requireAdmin` (as several intentionally do for public reads) has unrestricted read/write access to the full table. This isn't necessarily wrong as an architecture (service-role-only backends are common), but the documentation overstates the defense-in-depth that actually exists, and one missed middleware call away from a serious breach is a fragile model with no second layer.

### 2.7 🟡 JWT stored in `localStorage`
`src/lib/api.ts`:
```ts
function getToken(): string | null {
  try { return localStorage.getItem("hkn-token"); } catch { return null; }
}
...
setToken(token: string) { localStorage.setItem("hkn-token", token); }
```
A 7-day-lived admin/member JWT (`60 * 60 * 24 * 7` in `jwt.ts`) sitting in `localStorage` is readable by any script that executes in-page, including third-party scripts already loaded by the app (Google's GSI script, the Bible CDN fetches). An httpOnly cookie pattern (already partially supported — `getCookie(c, "token")` exists in `requireAdmin`) would be materially safer and is half-implemented already.

### 2.8 🟡 Non-atomic counters → race conditions on concurrent writes
`backend/src/routes/prayers.ts`:
```ts
prayerRoutes.post("/:id/pray", async (c) => {
  const { data: current } = await supabase.from("prayers").select("prayers").eq("id", id).single();
  const count = (current?.prayers || 0) + 1;
  await supabase.from("prayers").update({ prayers: count }).eq("id", id).select().single();
});
```
This read-then-write pattern is repeated for both the prayer-count increment and the comment-count increment. Under concurrent requests (entirely plausible for a public "pray for this" button on a popular post) this is a classic TOCTOU race — concurrent increments will be lost. Should be a single atomic SQL `UPDATE prayers SET prayers = prayers + 1`.

### 2.9 🟡 Reset-password flow likely non-functional as written
```ts
authRoutes.post("/reset-password", zValidator("json", z.object({
  password: z.string().min(6),
  token: z.string().min(1),
})), async (c) => {
  const { password } = c.req.valid("json");
  const { error } = await supabase.auth.updateUser({ password });
  ...
});
```
The schema requires and validates a `token` field, but the handler never reads or applies it. `supabase.auth.updateUser()` operates on the *current session* of the Supabase client instance — and the backend's Supabase client is created with `persistSession: false` and is shared/module-level (`backend/src/lib/supabase.ts`), so there is no per-request session to update. As written, this endpoint cannot correctly identify *which* user's password to change, and is at real risk of either failing silently or updating the wrong account under load (since `_supabase` is a singleton, not request-scoped).

### 2.10 🟡 Unbounded, sequential third-party fan-out on `/api/bible/search`
`backend/src/routes/bible.ts`:
```ts
for (const book of BOOKS.slice(0, 10)) {
  for (let ch = 1; ch <= Math.min(book.chapters, 5); ch++) {
    const result = await fetchChapter(book.name, ch, translation);
    ...
    if (matches.length > 0) await new Promise((r) => setTimeout(r, 300));
  }
}
```
A single search request can issue up to 50 sequential outbound HTTP calls to one of three external Bible API providers, with manual 300ms throttling baked in — meaning a single request can take 15+ seconds and ties up a Worker invocation the whole time. This endpoint has **no rate limiting at all** (unlike `/login`, `/register`, and prayer POSTs), no caching layer, and no result memoization, so it is both a poor user experience (slow) and a cheap DoS/cost-amplification vector against the three free third-party APIs the whole project depends on.

### 2.11 🟡 No payment-amount or currency server-side business rules
`donations.ts` and `payments.ts` accept any `z.number().positive()` amount with no upper bound, no currency allow-list validation beyond a default string, and the direct `POST /api/donations` endpoint (separate from the Paystack/PayPal flows) requires no authentication and writes directly to the `donations` table that feeds the admin dashboard — meaning the "amount given" stats an admin sees can be inflated by anyone scripting `POST /api/donations {"amount": 999999}` with no payment ever occurring.

### 2.12 🔴 Test coverage is effectively zero
```
src/test/App.test.tsx        — renders <App/>, checks 2 text strings exist
src/test/placeholder.test.tsx — describe("placeholder") { expect(1+1).toBe(2) }
```
That is the **entire** test suite: 2 files against 89 frontend + 17 backend source files (106 total). There are zero tests for: authentication, JWT signing/verification, the rate limiter, any Zod schema, any of the 9 backend route modules, payment webhook handling, donation IDOR-adjacent logic, or any business logic in the 6 page components. `vitest.config.ts` and `package.json` (`"test": "vitest run"`) are correctly wired, but the CI `validate-backend` job (`backend/`) runs only `npx tsc --noEmit` — **no backend tests are run in CI at all**, partly because none exist to run. This is a coverage gap of effectively 100% on backend logic and >95% on frontend logic, against any reasonable testing-maturity model (e.g., TMMi level 1 is barely met).

### 2.13 🟡 Dependency/toolchain version split between frontend and backend
Root `package.json`: `"zod": "^4.4.3"`, `"@hono/zod-validator": "^0.8.0"`, `"hono": "^4.12.25"`.
`backend/package.json`: `"zod": "^3.24.0"`, `"@hono/zod-validator": "^0.4.0"`, `"hono": "^4.7.0"`.
The actual production API code in `backend/src/routes/*.ts` is imported directly by `functions/api/[[path]].ts` (the real deployed entrypoint) and built/typechecked against `backend/`'s zod v3 toolchain, while the frontend ships zod v4. These are two different major versions of the same validation library living in one monorepo with no workspace tooling (no npm/pnpm workspaces, two separate `package-lock.json` files) — a latent source of "works on my machine" bugs and double the dependency-update burden.

### 2.14 🟡 No committed database migrations despite a configured migration toolchain
`backend/drizzle.config.ts` defines `out: "./drizzle"` and `backend/package.json` defines `"migrate": "drizzle-kit push"` / `"migrate:generate": "drizzle-kit generate"`, but no `drizzle/` directory or any `.sql` migration file exists anywhere in the repository. `backend/src/db/schema.ts` describes 8 tables (`users`, `prayers`, `prayer_comments`, `sermons`, `events`, `event_rsvps`, `bible_notes`, `donations`) with no corresponding migration history — meaning the live Supabase schema was created out-of-band (manually, or via `drizzle-kit push` run once locally and never recorded), and there is no reproducible, version-controlled way to stand up a fresh environment's database from source. This is a real deployment-reproducibility gap, not just a hygiene nit.

### 2.15 🟢 Weak/default seed credentials hardcoded in source
`backend/src/lib/seed.ts`:
```ts
const { data: adminAuth } = await supabase.auth.admin.createUser({
  email: "admin@hkn.com", password: "admin123", email_confirm: true,
});
```
(repeated for `sarah@email.com` / `pastor123` and `david@email.com` / `member123`). If `npm run seed` is ever run against a production Supabase project — which is exactly what `backend/.env.example`'s `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` fields imply is the intended workflow — a real `superadmin` account with a trivially guessable password is created.

---

## 3. Functional & Non-Functional Gaps

| Gap | Evidence it was intended | Status |
|---|---|---|
| Live streaming playback | README lists "Live Streaming — Upcoming live worship services and events" as a feature; `streams.ts` only returns metadata (title/host/time), no embed/player URL field in `live_streams` schema or route | Metadata-only; no actual stream embedding/playback implemented |
| Donation receipts / tax documentation | Standard expectation for a "Donations & Giving" feature with named payment gateways; no email/receipt-generation code anywhere in `payments.ts`/`donations.ts` | Not implemented |
| WCAG 2.1 accessibility audit | No `aria-*` attribute usage pattern audit, no `eslint-plugin-jsx-a11y` in `eslint.config.js` devDependencies, no accessibility statement in README/docs | No accessibility tooling or stated compliance target present |
| Cross-browser/device test matrix | `vitest.config.ts` uses `jsdom` only; no Playwright/Cypress/BrowserStack config found anywhere in repo | No E2E or cross-browser testing exists |
| Production error tracking (Sentry/etc.) | None of `package.json`'s dependencies include `@sentry/*` or any APM/error-tracking SDK; `ErrorBoundary.tsx` only `console.error`s | Errors are caught client-side but never reported anywhere observable in production |
| Dependency/CVE scanning | No `dependabot.yml`, no GitHub Advanced Security/CodeQL workflow, no `npm audit` step in `.github/workflows/ci.yml` | Absent — vulnerable transitive dependencies would go undetected indefinitely |
| Structured/queryable logging | `backend/src/index.ts` uses Hono's built-in `logger()` middleware only (console-based request logging), no log aggregation, no correlation IDs | Logs exist only as Cloudflare Worker console output, not queryable or alertable |
| Email delivery confirmation (password reset, RSVP confirmations) | `forgot-password` route relies entirely on Supabase Auth's built-in email; no fallback/transactional email provider (e.g. Resend, Postmark) is wired for RSVP or donation confirmations despite an `event_rsvps` table collecting emails | No app-level email sending exists outside Supabase Auth's own flows |

---

## 4. Production Deployment Readiness

| Area | Assessment | Evidence |
|---|---|---|
| Environment config completeness | Partial | `.env.example` and `backend/.env.example` exist and are reasonably documented, but the root `.env` is committed live (§2.1), and there are **two separate, non-synchronized** env surfaces (Vite `VITE_*` vars vs. backend `process.env`/Cloudflare `c.env` vars) with no single source of truth or schema validation (no `zod`-validated env loader on the backend beyond the ad-hoc `getEnv`/`process.env` fallback chain in `jwt.ts`/`supabase.ts`/`payments.ts`) |
| Secrets management | 🔴 Not production-safe | Hardcoded JWT fallback secret (§2.4) shipped in both source and `wrangler.toml`; committed `.env` (§2.1); no secrets manager (Cloudflare Secrets, Vault, etc.) referenced anywhere — secrets appear to be intended to live as plain Cloudflare Pages env vars, which is workable but undocumented |
| Containerization | Not applicable / not present | No `Dockerfile`, `docker-compose.yml`, or Kubernetes manifests exist — deployment target is exclusively Cloudflare Pages/Workers, which is a valid serverless choice but means there is **no portable/self-hostable deployment path** if Cloudflare is ever unavailable or the project needs to move off it |
| CI/CD pipeline | Functional but shallow | `.github/workflows/ci.yml` correctly gates deploy behind lint/test/build, but: backend has no test step (none exist to run), no `npm audit`/CodeQL/security gate, and the frontend `npm run test` step exercises essentially no real logic (§2.12) — so a "green CI" badge here provides very little actual confidence |
| Database migrations | 🔴 Not reproducible | No migration files committed (§2.14); schema exists only as a Drizzle TypeScript definition with no migration history, making fresh-environment provisioning and schema-drift detection impossible from source alone |
| Error tracking / observability | 🔴 Absent | No APM, no error-tracking SDK, console-only logging (§3 table) — a production incident would be invisible until a user reports it |
| TLS / transport security | OK by default | Cloudflare Pages terminates TLS automatically for both the static site and the Pages Functions API; no custom TLS misconfiguration risk was found in repo config (this is inherited from the platform, not from application code) |
| Least-privilege access | 🟠 Weak | Backend uses the Supabase **service role** key universally (§2.6) rather than scoped roles per route; there is no separation between "read public content" and "write/admin" database credentials at the infrastructure level — authorization is 100% application-layer |
| Rate limiting at the edge / DoS resilience | 🟡 Partial, fragile | The in-memory `Map`-based rate limiter (`rateLimiter.ts`) only works within a single warm Cloudflare Worker isolate. Cloudflare can and does spin up many isolates across edge locations for the same Pages Functions deployment, each with its own independent `requestCounts` Map — so the *effective* global rate limit is `MAX_REQUESTS × (number of concurrently warm isolates)`, not the documented "20 req/min." This is a real architectural limitation for a serverless/edge deployment target, not a bug in the limiter's logic itself. |
| **Critical blockers before stable production deployment** | — | (1) Unsigned payment webhook (§2.2), (2) hardcoded JWT fallback secret (§2.4), (3) committed `.env`/seed credentials (§2.1, §2.15), (4) zero backend test coverage on auth/payments code paths (§2.12), (5) no migration history for the live schema (§2.14) |

---

## 5. Risk-Prioritized Remediation Roadmap

**Tier 0 — Block launch / fix before any real money or PII flows through this (days, not weeks)**
1. Add Paystack webhook signature verification (`x-paystack-signature` HMAC-SHA512 check) before trusting any webhook payload — §2.2.
2. Remove the hardcoded JWT fallback secret; make the app fail to boot if `JWT_SECRET` is unset — §2.4.
3. Require auth (and ownership check against the JWT's `userId`/`email`) on `GET /api/donations/history` — §2.3.
4. Purge the committed `.env` from git history (not just delete the file — rotate any value ever present in it and scrub history with `git filter-repo` or BFG), and add a pre-commit hook or CI check that fails if `.env` is ever staged again — §2.1.
5. Restrict the unauthenticated `POST /api/donations` endpoint so it cannot be used to write arbitrary "completed" donation records that feed admin analytics — §2.11.

**Tier 1 — Fix before scaling traffic or onboarding real users (1–2 weeks)**
6. Replace `localStorage` token storage with httpOnly cookies (the cookie-read path already exists in `requireAdmin` — extend it to cookie-write on login/register) — §2.7.
7. Scope CORS to the actual deployed origin(s) instead of the wildcard default — §2.5.
8. Convert the prayer/comment counters to atomic SQL increments — §2.8.
9. Fix or remove the unused `token` parameter in `reset-password`; verify the actual Supabase recovery flow end-to-end — §2.9.
10. Add caching (even a simple in-memory TTL cache) and rate limiting to `/api/bible/search` — §2.10.
11. Change seed-script passwords to be randomly generated and printed once, never literal strings in source — §2.15.

**Tier 2 — Test, observe, and harden (2–4 weeks)**
12. Write unit tests for `jwt.ts`, `rateLimiter.ts`, and every Zod schema's edge cases; integration tests for at least the auth and payment route modules. Add a backend test step to CI.
13. Generate and commit Drizzle migrations (`drizzle-kit generate`) so schema is reproducible from source; check the result into `backend/drizzle/`.
14. Add Dependabot (or Renovate) + a `npm audit --audit-level=high` CI gate for both `package.json` files.
15. Add an error-tracking SDK (Sentry's Cloudflare Workers SDK is a natural fit) and wire `ErrorBoundary.componentDidCatch` to report, not just `console.error`.
16. Unify the zod/hono version split between root and `backend/`, ideally by adopting npm workspaces to manage both as one project with one lockfile.

**Tier 3 — Polish and completeness (ongoing)**
17. Add `eslint-plugin-jsx-a11y` and do a WCAG 2.1 AA pass on forms, modals, and the admin dashboard.
18. Add Playwright (or Cypress) for at least the core user journeys (submit prayer, browse Bible, RSVP to event) to close the cross-browser gap.
19. Implement transactional email (RSVP confirmations, donation receipts) rather than relying solely on Supabase Auth's built-in emails.
20. Document the live-streaming feature's actual scope (metadata directory vs. embedded player) so the README claim matches the implementation, or build the embed.

---

*This report reflects the state of the `master` branch at the time of cloning. No destructive testing, credential use, or live requests against third-party payment providers were performed during this audit.*
