# Heavenly Kingdom Network — Independent Repository Audit

**Repo:** `geginj20/heavenly-kingdom-network` · **Branch reviewed:** master @ `bd53ec1` (full clone, line-by-line read of all backend routes/libs, frontend API layer, CI config, schema, env files, and the repo's own prior audit doc for comparison) **Method:** Static review only — no live requests against Supabase/Paystack/PayPal were made. Severity = Impact × Likelihood (OWASP Risk Rating style).

**Top-line finding:** this repo already contains a prior audit (`HKN\_Repository\_Audit\_Report.md`) — and almost every Tier-0/Tier-1 item in it has since been genuinely fixed (verified against current source, not just trusted). That's a strong signal of active, competent remediation. My job below is to verify what's actually fixed, flag what's still open, and surface a few **new, real issues introduced by the remediation itself** that the old report couldn't have seen.


## 1. Core Strengths (verified)

**1.1 Payment webhook now properly signed.** `backend/src/routes/payments.ts:123-133` verifies `x-paystack-signature` via HMAC-SHA512 over the raw body using Web Crypto (`crypto.subtle`), rejecting on mismatch — closes what was previously a forgeable-donation hole.

**1.2 JWT fails closed.** `backend/src/lib/jwt.ts`:

```
`function getJwtSecret(): string \{`

`  const secret = getEnv("JWT\_SECRET") || process.env.JWT\_SECRET;`

`  if (!secret) throw new Error("JWT\_SECRET is not configured");`

`  return secret;`

`\}`
```

No hardcoded fallback remains — a missing secret now crashes the worker instead of silently signing with a public string.

**1.3 Donation IDOR closed with proper ownership check.** `backend/src/routes/donations.ts` `/history` now requires a valid token and enforces `payload.email === email` unless admin/superadmin — a textbook OWASP API1:2023 fix.

**1.4 Atomic counters.** `prayers.ts` now calls `supabase.rpc("increment\_prayer\_count", ...)` (defined in `backend/drizzle/0000\_rpc\_functions.sql`) instead of read-then-write, eliminating the prior TOCTOU race.

**1.5 Real backend test suite.** 15 backend test files now exist (`auth.test.ts` 151 lines, plus `jwt`, `rateLimiter`, `supabase`, `env`, and every route module), wired into CI (`validate-backend` job runs `npm run test`). This is a genuine jump from the prior "1+1=2 placeholder" state.

**1.6 CI hardening.** `.github/workflows/ci.yml` now runs `npm audit --audit-level=high` in both frontend and backend jobs, has an explicit step that fails the build if `.env` is git-tracked, runs Playwright E2E (`tests/e2e/core.spec.ts`, `interactions.spec.ts`), and a `.github/dependabot.yml` schedules weekly npm updates for both `/` and `/backend`.

**1.7 Reproducible schema.** `backend/drizzle/` now contains committed migration SQL (`0000\_swift\_spencer\_smythe.sql`, `0000\_rpc\_functions.sql`) — the previously undocumented schema-drift gap is closed.

**1.8 Seed credentials randomized.** `backend/src/lib/seed.ts` now generates `randomUUID()` passwords instead of literal `admin123`/`pastor123` strings.

**1.9 Consistent Zod validation and role-gating** remain solid codebase-wide (`requireAdmin` blanket-applied via `adminRoutes.use("\*", requireAdmin)`; per-route Zod schemas in every mutating handler) — same disciplined pattern noted previously, still holding.

**1.10 Accessibility tooling added.** `eslint-plugin-jsx-a11y` is now a devDependency and wired into `eslint.config.js` (not present before).


## 2. Critical Weaknesses — still open or newly introduced

### 2.1 🔴 Production CORS is still wildcard — the dev-only entrypoint was fixed, the real one wasn't

The **actual deployed API** is `functions/api/\[\[path\]\].ts` (Cloudflare Pages Functions), which still has:

```
`app.use("\*", cors());`
```

The scoped, origin-checked CORS config (`origin: (origin) =\> ...`, `credentials: true`) only exists in `backend/src/index.ts`, a **local-dev-only Wrangler entrypoint** per its own comment: `// Production API runs as Cloudflare Pages Functions via functions/api/\[\[path\]\].ts`. README still claims *"same origin, no CORS needed"* (line 105) — a claim that was already false before and remains false. **This means the fix from the prior audit was applied to the wrong file.**

### 2.2 🔴 `/auth/me` is silently broken after the cookie-auth migration

Login/register/Google now correctly set an httpOnly cookie (`backend/src/routes/auth.ts`, `setCookie(c, "token", ..., \{ httpOnly: true, secure: true \})`), and the frontend was updated to match: `src/lib/api.ts`'s `setToken()` is now a no-op (*"Token is now set via httpOnly cookie by the backend"*) and every request sends `credentials: "include"`.

But `authHeaders()` still reads `localStorage.getItem("hkn-token")` — which is now **never written**, since nothing calls `setToken()` with a real value anymore. So every frontend call that depends on `authHeaders()` (`/auth/me`, sermon/event admin mutations, `/donations/history`, all `/admin/\*` calls) sends an empty `Authorization` header and relies entirely on the cookie.

That's fine for `requireAdmin` and `/donations/history`, which check **both** header and cookie (`getCookie(c, "token")` fallback). It is **not** fine for `/auth/me`:

```
`authRoutes.get("/me", async (c) =\> \{`

`  const authHeader = c.req.header("Authorization");`

`  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;`

`  if (!token) return c.json(\{ error: "No token provided" \}, 401);`

`  ...`
```

No `getCookie` fallback here. Result: after a successful cookie-based login, calling `api.auth.me()` (used to rehydrate session/role on page load) will **always 401**, even though the user is authenticated. This is a reproducible functional regression from a half-finished auth migration, not a hypothetical — worth confirming in a browser, but the code path is unambiguous.

### 2.3 🟠 Production error tracking exists only in the code path that never runs in production

`backend/src/index.ts` imports `@sentry/cloudflare` and wraps the app in `Sentry.withSentry(...)` with `Sentry.captureException` in its error handler. But that file is the **local dev Wrangler server**, not the deployed function. `functions/api/\[\[path\]\].ts` — the file that actually runs in production — has **zero Sentry references**. `@sentry/react` and `@sentry/vite-plugin` are present on the frontend (`package.json`), so client-side error tracking may exist, but **all backend production errors are currently unobserved**, contradicting what the dependency list implies is wired up.

### 2.4 🟡 In-memory rate limiter still has the same edge-architecture flaw

`backend/src/lib/rateLimiter.ts` uses a module-level `Map`. On Cloudflare Pages Functions, each warm isolate has its own independent map, so the effective global limit is `MAX\_REQUESTS × (concurrent isolates)`, not the nominal 20/min or 5/min. Unchanged from the prior audit — still a real limitation for a serverless target, not fixed by anything reviewed.

### 2.5 🟡 Payment verify endpoint has no idempotency guard

`payments.ts` `/verify/:reference` inserts a new `donations` row on every call where `data.status === "success"`, with no `payment\_reference` uniqueness check or upsert. If a client (or a retry, or a user refreshing the callback page) calls `/verify/:reference` twice for the same transaction, two donation rows get created — inflating the admin dashboard's revenue totals (`admin.ts` `/stats` sums `donations.amount` directly). No unique constraint on `payment\_reference` was found in `schema.ts`.

### 2.6 🟡 Frontend unit-test coverage remains thin relative to backend

Backend now has 15 test files; frontend still has only `src/test/App.test.tsx` (renders `\<App/\>`, checks two strings) and the literal `placeholder.test.tsx` (`expect(1+1).toBe(2)`), against **30 page/feature components** (excluding the 53 generic shadcn primitives). The 2 Playwright E2E specs (`core.spec.ts`, `interactions.spec.ts`) partially cover user-journey gaps, but there is still no component-level unit testing for `PrayerWall`, `BibleReader`, `AdminDashboard`, `Events`, or any custom hook in `src/hooks/`.

### 2.7 🟢 Doc/code drift in env templates

`backend/.env.example` still shows `JWT\_SECRET=hkn-dev-secret-change-in-production` and `SEED\_ADMIN\_PASSWORD=admin123` as example values — harmless as a template, but inconsistent with the hardened code (2.2) and worth updating so nobody copy-pastes a "real-looking" weak secret into production.


## 3. Functional & Non-Functional Gaps

| **Gap** | **Evidence it was intended** | **Current status** |
| :-: | :-: | :-: |
| Live-stream playback | README: "Live Streaming — Upcoming live worship services and events" | `streams.ts` / `live\_streams` table still metadata-only (title/host/time); no embed/player URL field — unchanged from prior audit |
| Donation receipts | Feature implies tax/giving documentation | Partially present now — `payments.ts`/`donations.ts` call Resend (`sendDonationEmail`) on successful Paystack verify and on admin-created donations; **no receipt is sent for the unauthenticated public donation flow vs. the admin-entry flow consistently**, and no PDF/tax-deductible receipt format exists |
| WCAG 2.1 compliance | No accessibility statement in README, but tooling now added | `eslint-plugin-jsx-a11y` is configured (new since last audit) but no audit pass evidence (no a11y test run, no documented AA conformance target) |
| Cross-browser/E2E testing | — | Now exists (Playwright, Chromium only — `playwright.config.ts` defines a single `chromium` project, no Firefox/WebKit/mobile viewport) — partial gap closure |
| Production error tracking | `@sentry/cloudflare` + `@sentry/react` deps present | Wired in dev-only backend entrypoint, **absent from the real production function** (§2.3) |


## 4. Production Deployment Readiness

| **Area** | **Status** | **Evidence** |
| :-: | :-: | :-: |
| Secrets management | 🟢 Improved | No `.env` committed; CI gate blocks re-committing it; JWT fails closed |
| CORS | 🔴 Still wrong in production | §2.1 — wildcard in the deployed entrypoint |
| Observability | 🔴 Misleading | Sentry deps present but not active in the deployed function (§2.3) |
| DB migrations | 🟢 Fixed | `backend/drizzle/\*.sql` committed |
| Dependency scanning | 🟢 Fixed | `dependabot.yml` + `npm audit --audit-level=high` in CI |
| Containerization | N/A | Still no Dockerfile/k8s — fine for the chosen serverless-only target, but no portability off Cloudflare |
| Rate limiting at scale | 🟡 Unchanged limitation | §2.4 — architecturally fragile on multi-isolate edge deployments |
| Auth session flow | 🟠 Partially broken | §2.2 — `/auth/me` regression from the cookie migration |

**Updated blockers before calling this production-ready:** (1) fix CORS in `functions/api/\[\[path\]\].ts` to match the scoped logic already written for the dev server, (2) add the cookie fallback to `/auth/me` (one line, same pattern `requireAdmin` already uses), (3) move Sentry initialization into the actual deployed entrypoint, (4) add a unique constraint + upsert on `payment\_reference` to prevent duplicate donation rows.


## 5. Risk-Prioritized Remediation

**Tier 0 (hours):**

1. Replace `app.use("\*", cors())` in `functions/api/\[\[path\]\].ts` with the scoped origin-check logic from `backend/src/index.ts` — §2.1. 

2. Add `getCookie(c, "token")` fallback to `/auth/me` — §2.2. 

3. Update README's CORS claim to match reality, or actually make it true. 

**Tier 1 (days):** 4. Move `Sentry.withSentry(...)` wrapping into `functions/api/\[\[path\]\].ts` — §2.3. 5. Add a unique index on `donations.payment\_reference` and switch the verify-webhook inserts to upsert — §2.5.

**Tier 2 (1-2 weeks):** 6. Component-level unit tests for the 30 page/feature components, especially `AdminDashboard`, `PrayerWall`, `BibleReader` — §2.6. 7. Add Firefox/WebKit/mobile viewport projects to `playwright.config.ts`. 8. Run an actual `jsx-a11y` lint pass and fix violations now that the plugin is installed but apparently unenforced.

**Tier 3 (ongoing):** 9. Build or scope down the live-streaming feature claim — §3. 10. Standardize donation-receipt emailing across both the public and admin-entry donation paths. 11. Move the in-memory rate limiter to a durable store (Cloudflare KV/Durable Object) if traffic ever exceeds single-isolate volume.


**Bottom line:** this is a codebase that took a serious, evidence-driven audit and visibly acted on nearly all of it — that's rare and worth crediting. The remaining issues are smaller in number but follow a clear pattern: **fixes were applied to the dev/local code path and not consistently mirrored into the actual Cloudflare Pages Functions production entrypoint** (CORS, Sentry), plus one regression introduced by the auth-migration itself (`/auth/me`). All three are small, mechanical fixes — none require new architecture.

