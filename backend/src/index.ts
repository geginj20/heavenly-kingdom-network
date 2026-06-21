import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { prayerRoutes } from "./routes/prayers";
import { sermonRoutes } from "./routes/sermons";
import { eventRoutes } from "./routes/events";
import { bibleRoutes } from "./routes/bible";
import { adminRoutes } from "./routes/admin";
import { streamRoutes } from "./routes/streams";
import { donationRoutes } from "./routes/donations";
import { paymentRoutes } from "./routes/payments";
import * as Sentry from "@sentry/cloudflare";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    if (!origin || origin.startsWith("http://localhost:") || origin === frontendUrl) {
      return origin || frontendUrl;
    }
    return frontendUrl;
  },
  credentials: true,
}));
app.use("*", logger());

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

app.onError((err, c) => {
  Sentry.captureException(err, {
    extra: { url: c.req.url, method: c.req.method },
  });
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default Sentry.withSentry((env: Record<string, string>) => ({
  dsn: env.SENTRY_DSN || "",
  tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(env.SENTRY_TRACES_SAMPLE_RATE) : 0.1,
  environment: env.SENTRY_ENVIRONMENT || env.CF_PAGES_BRANCH || "development",
  release: env.SENTRY_RELEASE || undefined,
}), app);
