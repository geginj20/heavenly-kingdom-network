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

const app = new Hono();

app.use("*", async (c, next) => {
  setEnv(c.env as Record<string, string>);
  await next();
});

app.use("*", cors());
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

export const onRequest = handle(app);
