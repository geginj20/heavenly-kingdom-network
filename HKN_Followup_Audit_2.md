# Heavenly Kingdom Network — Follow-Up Audit (Re-Audit #2)

**Repo:** `geginj20/heavenly-kingdom-network` · **HEAD at this audit:** `bd53ec1` ("fix e2e tests: Bible search toggle, Give section heading, Chapter selector")
**Compared against:** the prior audit's findings, by re-cloning fresh and re-reading every relevant file — not by trusting commit messages or file presence alone.

**Bottom line, no hedging:** real, substantive security work happened here — this is not a cosmetic pass. About two-thirds of the Tier 0/1 items are genuinely fixed at the code level. But there is **one significant production-impacting bug introduced by the fix itself** (admins get logged out on every refresh), and **one important security fix that was applied to a file that Cloudflare never actually runs**, meaning it does nothing in production despite looking complete in the source tree. I'm flagging both clearly below because a "looks fixed in grep" audit would have missed them, and that's exactly the kind of false confidence a genuine audit needs to catch.

---

## 1. Verified as genuinely fixed

| # | Issue (prior audit) | Verdict | Evidence |
|---|---|---|---|
| 1 | Committed `.env` with default creds | ✅ **Fixed properly** | `.env` is gone from the working tree *and* unrecoverable from full git history (verified with `git rev-list --all \| git ls-tree`, zero hits) — this was a real history scrub, not just a new commit deleting the file. A `.githooks/pre-commit` hook now blocks staging `.env`, and CI (`ci.yml`) has a redundant `git ls-files --error-unmatch .env` check as a second line of defense. Good defense-in-depth. |
| 2 | Unauthenticated/unverified Paystack webhook | ✅ **Fixed correctly** | `payments.ts` now computes HMAC-SHA512 over the raw body via Web Crypto and rejects on mismatch (`backend/src/routes/payments.ts`, `generateHmacSha512Hex` + signature check before any DB write). Real cryptographic verification, not a cosmetic header check. |
| 3 | IDOR on `GET /api/donations/history` | ✅ **Fixed correctly** | Now requires a valid JWT (header or cookie) and checks `payload.role === admin/superadmin \|\| payload.email === email` before returning data — proper object-level authorization. |
| 4 | Hardcoded JWT fallback secret | ✅ **Fixed correctly** | `getJwtSecret()` now `throw`s if `JWT_SECRET` is unset, in both `getEnv()` and `process.env` paths. Fails closed, no fallback string anywhere in `jwt.ts` or `backend/wrangler.toml` (the `[vars]` block no longer ships a default secret). |
| 5 | Race condition on prayer/comment counters | ✅ **Fixed correctly** | Replaced read-then-write with atomic Postgres functions `increment_prayer_count` / `increment_prayer_comment_count` (`backend/drizzle/0000_rpc_functions.sql`), called via `supabase.rpc(...)`. This is the textbook-correct fix. |
| 6 | Unbounded `/api/bible/search` fan-out | ✅ **Fixed correctly** | Added a 1-hour in-memory result cache (`searchCache`) and `rateLimit` middleware on the route; throttle delay reduced from 300ms→200ms. (Caveat on the cache's effectiveness under §3 below — but the fix is real, not a no-op.) |
| 7 | Reset-password ignored the recovery token | ✅ **Fixed correctly** | Now calls `supabase.auth.getUser(token)` to resolve the actual user from the recovery token, then `supabase.auth.admin.updateUserById(user.id, {password})`. This is sound and fixes a real logic bug, not just a lint complaint. |
| 8 | Hardcoded weak seed passwords (`admin123` etc.) | ✅ **Fixed correctly** | `seed.ts` now generates `randomUUID()` per account and prints them once to console (`console.log('admin@hkn.com: ' + adminPassword)`) — never committed, never reused. |
| 9 | No dependency-vulnerability scanning | ✅ **Fixed** | `.github/dependabot.yml` added for both root and `backend/`; CI now runs `npm audit --audit-level=high` in both `validate-frontend` and `validate-backend` jobs, gating the pipeline. |
| 10 | No database migrations committed | ✅ **Fixed** | `backend/drizzle/0000_swift_spencer_smythe.sql` + `0000_rpc_functions.sql` + `meta/_journal.json`/`meta/0000_snapshot.json` are committed and match `schema.ts`'s 8 tables. Schema is now reproducible from source. |
| 11 | Zero backend test coverage | ✅ **Fixed, substantially** | 15 backend test files, ~93 `test()` cases (`auth`, `prayers`, `payments`, `bible`, `donations`, `events`, `sermons`, `admin`, `streams`, `jwt`, `env`, `rateLimiter`, `supabase`, `index`), using proper Supabase mocking. CI's `validate-backend` job now runs `npm run test`, where previously it only ran `tsc --noEmit`. This is a real, large jump from 0% to meaningful backend coverage. |
| 12 | Zod/Hono version split between root and `backend/` | ✅ **Fixed** | Both now pin `zod ^4.4.3` and `hono ^4.12.x`; root `package.json` gained a `"workspaces": ["backend"]` field, unifying the monorepo under one tool. |
| 13 | README overclaimed "Live Streaming" playback | ✅ **Fixed honestly** | Feature bullet rewritten to "Upcoming Streams — Schedule of upcoming live worship services... with time, title, and host information," which now accurately describes what `streams.ts` actually returns (metadata only, no player). This is the kind of documentation honesty I specifically asked for, and they did it. |
| 14 | No E2E / cross-browser testing | ✅ **Added** | Playwright installed and configured (`playwright.config.ts`), 10 e2e tests across `tests/e2e/core.spec.ts` and `interactions.spec.ts`, run in CI before build. Real coverage of core user journeys, not a stub. |

---

## 2. New problem introduced by the fix itself — needs immediate attention

### 🔴 Persistent login is now broken for every user
This is the most important finding in this re-audit, and it would not show up in a superficial review.

The fix migrated auth tokens from `localStorage` to an httpOnly cookie — a good security improvement on its own. `backend/src/routes/auth.ts` now does:
```ts
setCookie(c, "token", token, { httpOnly: true, secure: true, sameSite: "Lax", maxAge: 604800, path: "/" });
```
and `src/lib/api.ts`'s `setToken()` was correctly turned into a no-op (since the cookie is now set by the server, not the client). **But** `src/lib/auth.tsx`'s session-restore logic on app mount was never updated to match:
```ts
useEffect(() => {
  const token = api.getToken();        // reads localStorage — always null now
  if (!token) {
    setLoading(false);                 // never calls /api/auth/me
    return;
  }
  api.auth.me()...
}, []);
```
Since `getToken()` still reads the now-permanently-empty `localStorage` key, this branch is taken on every single page load, and `GET /api/auth/me` is never even attempted. The user is logged in correctly for the remainder of the session they logged in on, but **refreshing the page, closing and reopening the tab, or following a link logs them out** — despite a valid 7-day httpOnly session cookie sitting in the browser the whole time.

There's a second, compounding bug here: even if `auth.tsx` were fixed to always attempt `/me` on mount, `GET /api/auth/me` itself only reads the `Authorization` header and has no cookie fallback (`authRoutes.get("/me", ...)` in `auth.ts` — contrast with `requireAdmin` in `jwt.ts`, which correctly checks both header and cookie). So restoring a session from the cookie would still 401 until `/me` is updated too.

**Net effect:** the admin dashboard and any "logged in" UI state is now unusable across page refreshes. This needs both fixes — update the mount-time check in `auth.tsx` to call `/me` unconditionally (or have the backend expose a lightweight "am I logged in" check that doesn't depend on a client-held token at all), and add the cookie fallback to `/me`.

---

## 3. A fix that was applied to the wrong file — does nothing in production

### 🟠 The CORS scoping and Sentry error-tracking fixes never reach the deployed app
This is the second important finding, and it's a structural one: this repo has **two** Hono entrypoints, and the security work landed in the one that isn't deployed.

- `backend/wrangler.toml` says, in its own comment: *"This wrangler.toml is for local dev only. Production API runs as Cloudflare Pages Functions via `functions/api/[[path]].ts`."*
- The CI deploy step confirms this: `npx wrangler pages deploy dist --project-name=hkn-website --branch production` — Cloudflare Pages auto-discovers `functions/api/[[path]].ts` as its Functions handler; `backend/src/index.ts` is never invoked by this deploy command.

The actual fixes were made in `backend/src/index.ts`:
```ts
app.use("*", cors({ origin: (origin) => { ... }, credentials: true }));
...
export default Sentry.withSentry((env) => ({ dsn: env.SENTRY_DSN || "", ... }), app);
```
This is good, correct code — scoped CORS instead of wildcard, and real Sentry error capture on `app.onError`.

But `functions/api/[[path]].ts` — the file Cloudflare actually runs — is **untouched**:
```ts
app.use("*", cors());   // still wildcard, still default Access-Control-Allow-Origin: *
app.use("*", logger());
// no Sentry import, no app.onError, no error tracking at all
export const onRequest = handle(app);
```
And the new backend test suite reinforces the false confidence here: `backend/src/index.test.ts` tests `backend/src/index.ts` — the file that isn't deployed — so a fully green CI pipeline gives no signal about the CORS or error-tracking behavior of the real production API.

**This means, as of this audit:** production still serves wildcard CORS, and there is still no error tracking/observability wired into the live API. Both of last audit's fixes need to be ported into `functions/api/[[path]].ts` (or, better, the two entrypoints should be unified — have `functions/api/[[path]].ts` import and re-export the configured app from `backend/src/index.ts` instead of redeclaring the routing/middleware a second time, so this class of "fixed in the wrong copy" bug becomes structurally impossible).

---

## 4. Previously flagged issues that remain unaddressed

These weren't claimed as fixed and I'm not implying otherwise — listing them here so this audit is a complete current-state picture, not just a diff of what changed.

| Issue | Current state |
|---|---|
| README still says *"same origin, no CORS needed"* | Still present in the Architecture section, and now actively contradicted by both Hono entrypoints, which both enable CORS explicitly (one scoped, one wildcard). Needs a rewrite regardless of which entrypoint gets fixed next. |
| README still says *"Supabase PostgreSQL with Row-Level Security"* | `backend/src/lib/supabase.ts` is unchanged — still connects exclusively with `SUPABASE_SERVICE_KEY` (service role), which bypasses RLS entirely. This claim remains misleading; either implement and rely on RLS for some access paths, or stop claiming it. |
| No upper bound on donation/payment amounts | `z.number().positive()` only, in both `donations.ts` and `payments.ts` (`/initialize`, `/paypal/create`) — unchanged. No max-amount sanity check anywhere. |
| PayPal flow has no Authorization header on either request | `paypal/create` and `paypal/capture` POST to `api-m.paypal.com` with only `Content-Type: application/json` — no OAuth bearer token, no client ID/secret anywhere in the codebase. This was broken before and is still broken: as written, these endpoints cannot work against the real PayPal API and would fail with a 401 from PayPal on first real use. This isn't a security gap so much as a **non-functional feature** masquerading as implemented — worth flagging because the README still lists "PayPal" as a supported gateway. |
| No idempotency/uniqueness constraint on `payment_reference` | The new migration creates `donations.payment_reference` as a plain `text` column with no `UNIQUE` constraint. Paystack (and most webhook providers) can and do redeliver the same event; as written, a retried webhook will insert a **second** completed-donation row for the same payment, double-counting it in the admin dashboard. |
| `/api/prayers/:id/pray` and `/:id/comments` still unrated-limited | The atomic-counter fix (§1.5) correctly solved the race condition, but neither endpoint has `rateLimit` applied (unlike prayer creation), so vote/comment-spam is still possible without throttling. |
| `src/test/placeholder.test.tsx` still exists, still `expect(1+1).toBe(2)` | Should have been deleted once real backend/e2e tests landed — it adds nothing and signals the frontend unit-test gap wasn't actually addressed (only `App.test.tsx`'s original 2 smoke tests exist on the frontend side; the ~93 new tests are 100% backend, and the 10 new Playwright tests are e2e, not unit). Frontend component/hook logic — `src/lib/api.ts`, `src/lib/auth.tsx`, the 6 page components, `use-async.ts` — has zero unit tests. |
| Admin routes (`/api/admin/*`) have no rate limiting | `adminRoutes.use("*", requireAdmin)` only — no throttle on `/stats`, `/donations`, `/users`, `/prayers`. Lower severity since they're auth-gated, but a compromised/leaked admin token has no secondary throttle protecting against bulk scraping. |

---

## 5. Honest scorecard

| Area | Before | Now | Verdict |
|---|---|---|---|
| Secrets hygiene | 🔴 Committed `.env`, hardcoded JWT fallback, weak seed passwords | 🟢 All three fixed properly, with process guardrails (hook + CI check) added | **Resolved** |
| Payment/webhook integrity | 🔴 Forgeable webhook, IDOR on donation history | 🟢 Signature verified, IDOR closed | 🟡 **Mostly resolved** — still missing amount caps and webhook idempotency |
| Authentication architecture | 🟡 localStorage JWT, broken reset-password | 🟡 Cookie-based auth implemented, reset-password fixed... | 🔴 **Net new regression** — session restore is broken; needs a follow-up fix before this can be called done |
| Production network/observability posture | 🔴 Wildcard CORS, no error tracking | 🟢 Looks fixed in source... | 🔴 **Not actually fixed** — applied to the non-deployed entrypoint |
| Test coverage | 🔴 2 files, ~2 real tests | 🟢 ~93 backend tests + 10 e2e tests | 🟡 **Backend resolved, frontend unit-level still ~0%** |
| Dependency/schema reproducibility | 🔴 No scanning, no migrations, version split | 🟢 Dependabot + audit gate, committed migrations, unified versions/workspaces | **Resolved** |
| Documentation honesty | 🟡 Overclaimed live streaming and RLS | 🟢 Live streaming claim corrected... 🔴 RLS/CORS claims still wrong | 🟡 **Partially resolved** |

**Overall:** this is a genuinely good second pass — most of it is real, careful, correctly-reasoned engineering, not box-checking. The two issues in §2 and §3 are the ones I'd insist on fixing before calling this production-ready, specifically *because* they're the kind that pass a quick look and only surface under actual use (refreshing the page) or actual deployment tracing (checking which file Cloudflare runs). Everything in §4 is smaller and can be sequenced normally.

---

## 6. What I'd do next, in order

1. Fix session restoration: make `auth.tsx`'s mount effect call `/api/auth/me` unconditionally (relying on the cookie, not `localStorage`), and add cookie fallback to the `/me` route handler.
2. Port the scoped-CORS and Sentry config from `backend/src/index.ts` into `functions/api/[[path]].ts`, or better, refactor so there's only one app-assembly function imported by both entrypoints, eliminating the duplicate-maintenance risk structurally.
3. Add a `UNIQUE` constraint (or an upsert-on-conflict) on `donations.payment_reference` to make webhook retries idempotent.
4. Add a sane upper bound (e.g. `z.number().positive().max(1_000_000)`) to donation/payment amount schemas.
5. Either implement real PayPal OAuth (client credentials grant before create/capture) or remove PayPal from the README until it is real.
6. Delete `src/test/placeholder.test.tsx`; add a handful of frontend unit tests for `src/lib/api.ts` and `src/lib/auth.tsx` specifically, since those are exactly where the regression in §2 lives — a test asserting "after login + simulated reload, isAuthenticated is still true" would have caught this before merge.
7. Correct the two remaining README architecture claims (CORS, RLS) to match reality.
