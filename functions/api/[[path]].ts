import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handle } from "hono/cloudflare-pages";
import { setEnv } from "../../backend/src/lib/env";
import { authRoutes } from "../../backend/src/routes/auth";
import { prayerRoutes } from "../../backend/src/routes/prayers";
import { sermonRoutes } from "../../backend/src/routes/sermons";
import { eventRoutes } from "../../backend/src/routes/events";
import { bibleRoutes } from "../../backend/src/routes/bible";
import { adminRoutes } from "../../backend/src/routes/admin";
import { streamRoutes } from "../../backend/src/routes/streams";
import { donationRoutes } from "../../backend/src/routes/donations";
import { paymentRoutes } from "../../backend/src/routes/payments";

const app = new Hono<{ Bindings: Record<string, string> }>();

app.use("*", async (c, next) => {
  setEnv(c.env as Record<string, string>);
  await next();
});

app.use("*", cors({
  origin: (origin) => {
    const allowed = [
      "https://hkn-website.pages.dev",
      "https://heavenlykingdomnetwork.org",
      "https://www.heavenlykingdomnetwork.org",
    ];
    if (!origin || origin.startsWith("http://localhost:")) return origin || "";
    return allowed.includes(origin) ? origin : "";
  },
  credentials: true,
}));

app.use("*", logger());

app.onError((err, c) => {
  console.error("[Worker Error]", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/api/auth", authRoutes);
app.route("/api/prayers", prayerRoutes);
app.route("/api/sermons", sermonRoutes);
app.route("/api/events", eventRoutes);
app.route("/api/bible", bibleRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/streams", streamRoutes);
app.route("/api/donations", donationRoutes);
app.route("/api/payments", paymentRoutes);

export const onRequest = Sentry.withSentry(
  (env: Record<string, string>) => ({
    dsn: env.SENTRY_DSN || "",
    tracesSampleRate: 0.1,
    release: env.CF_PAGES_COMMIT_SHA || "unknown",
  }),
  handle(app)
);
