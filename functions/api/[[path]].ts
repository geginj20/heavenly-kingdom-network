import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handle } from "hono/cloudflare-pages";
import { authRoutes } from "../../backend/src/routes/auth";
import { prayerRoutes } from "../../backend/src/routes/prayers";
import { sermonRoutes } from "../../backend/src/routes/sermons";
import { eventRoutes } from "../../backend/src/routes/events";
import { bibleRoutes } from "../../backend/src/routes/bible";
import { adminRoutes } from "../../backend/src/routes/admin";

const app = new Hono();

app.use("*", async (c, next) => {
  if (c.env?.DATABASE_URL) process.env.DATABASE_URL = c.env.DATABASE_URL;
  if (c.env?.SUPABASE_URL) process.env.SUPABASE_URL = c.env.SUPABASE_URL;
  if (c.env?.SUPABASE_SERVICE_KEY) process.env.SUPABASE_SERVICE_KEY = c.env.SUPABASE_SERVICE_KEY;
  if (c.env?.JWT_SECRET) process.env.JWT_SECRET = c.env.JWT_SECRET;
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

export const onRequest = handle(app);
