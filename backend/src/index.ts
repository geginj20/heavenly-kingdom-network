import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { prayerRoutes } from "./routes/prayers";
import { sermonRoutes } from "./routes/sermons";
import { eventRoutes } from "./routes/events";
import { bibleRoutes } from "./routes/bible";
import { adminRoutes } from "./routes/admin";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/api/auth", authRoutes);
app.route("/api/prayers", prayerRoutes);
app.route("/api/sermons", sermonRoutes);
app.route("/api/events", eventRoutes);
app.route("/api/bible", bibleRoutes);
app.route("/api/admin", adminRoutes);

export default app;
