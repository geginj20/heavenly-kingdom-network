import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { prayers, events, donations } from "../db/schema";
import { requireAdmin } from "../lib/jwt";

export const adminRoutes = new Hono();
adminRoutes.use("*", requireAdmin);

adminRoutes.get("/stats", async (c) => {
  const db = getDb();
  const allPrayers = await db.select().from(prayers);
  const pendingPrayers = allPrayers.filter((p) => p.status === "pending").length;
  const allEvents = await db.select().from(events);
  const allDonations = await db.select().from(donations);
  const monthlyGiving = allDonations
    .filter((d) => {
      const dDate = new Date(d.createdAt || Date.now());
      const now = new Date();
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + d.amount, 0);

  return c.json({
    totalUsers: 1247,
    totalPrayers: allPrayers.length,
    pendingPrayers,
    totalSermons: 156,
    monthlyGiving,
    activeEvents: allEvents.length,
  });
});

adminRoutes.get("/prayers", async (c) => {
  const db = getDb();
  const statusFilter = c.req.query("status");
  const all = await db
    .select()
    .from(prayers)
    .where(statusFilter && statusFilter !== "all" ? eq(prayers.status, statusFilter) : undefined)
    .orderBy(desc(prayers.createdAt));
  return c.json(all);
});

adminRoutes.patch("/prayers/:id/status", async (c) => {
  const db = getDb();
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json();
  const [prayer] = await db.update(prayers).set({ status }).where(eq(prayers.id, id)).returning();
  return c.json(prayer);
});

adminRoutes.delete("/prayers/:id", async (c) => {
  const db = getDb();
  const id = Number(c.req.param("id"));
  await db.delete(prayers).where(eq(prayers.id, id));
  return c.json({ success: true });
});
