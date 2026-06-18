import { createMiddleware } from "hono/factory";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_STRICT = 5;

function cleanup() {
  const now = Date.now();
  for (const [key, val] of requestCounts) {
    if (val.resetAt < now) requestCounts.delete(key);
  }
}

export const rateLimit = createMiddleware(async (c, next) => {
  cleanup();
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  const key = `${ip}:${c.req.path}`;
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    c.res.headers.set("X-RateLimit-Remaining", String(MAX_REQUESTS - 1));
    return next();
  }

  entry.count++;
  c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, MAX_REQUESTS - entry.count)));

  if (entry.count > MAX_REQUESTS) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  return next();
});

export const strictRateLimit = createMiddleware(async (c, next) => {
  cleanup();
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  const key = `strict:${ip}`;
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_STRICT) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  return next();
});
