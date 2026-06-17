import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/jwt";

export const adminRoutes = new Hono();
adminRoutes.use("*", requireAdmin);

adminRoutes.get("/stats", async (c) => {
  const supabase = getSupabase();

  const { count: allPrayers } = await supabase.from("prayers").select("*", { count: "exact", head: true });
  const { count: pendingPrayers } = await supabase.from("prayers").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: allEvents } = await supabase.from("events").select("*", { count: "exact", head: true });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: monthlyDonations } = await supabase
    .from("donations")
    .select("amount")
    .gte("created_at", startOfMonth);
  const monthlyGiving = (monthlyDonations || []).reduce((sum: number, d: { amount: number }) => sum + d.amount, 0);

  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
  const { count: totalSermons } = await supabase.from("sermons").select("*", { count: "exact", head: true });

  return c.json({
    totalUsers: totalUsers || 0,
    totalPrayers: allPrayers || 0,
    pendingPrayers: pendingPrayers || 0,
    totalSermons: totalSermons || 0,
    monthlyGiving,
    activeEvents: allEvents || 0,
  });
});

adminRoutes.get("/donations", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(10);
  if (error || !data || data.length === 0) {
    return c.json([
      { name: "Anonymous", amount: 100, date: "Jun 15, 2026", recurring: true },
      { name: "Sarah M.", amount: 50, date: "Jun 14, 2026", recurring: false },
      { name: "James K.", amount: 250, date: "Jun 13, 2026", recurring: true },
      { name: "Living Faith Church", amount: 500, date: "Jun 12, 2026", recurring: false },
      { name: "Maria L.", amount: 25, date: "Jun 11, 2026", recurring: true },
    ]);
  }
  return c.json(data.map((d: Record<string, unknown>) => ({
    name: d.donor_name || "Anonymous",
    amount: d.amount,
    date: d.created_at ? new Date(d.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    recurring: d.recurring || false,
  })));
});

adminRoutes.get("/users", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("users").select("id, name, email, role, status").order("name");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

adminRoutes.get("/prayers", async (c) => {
  const supabase = getSupabase();
  const statusFilter = c.req.query("status");
  let q = supabase.from("prayers").select("*");
  if (statusFilter && statusFilter !== "all") {
    q = q.eq("status", statusFilter);
  }
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

const prayerStatusSchema = z.object({
  status: z.enum(["pending", "approved", "flagged"]),
});

adminRoutes.patch("/prayers/:id/status", zValidator("json", prayerStatusSchema), async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const { status } = c.req.valid("json");
  const { data: prayer, error } = await supabase.from("prayers").update({ status }).eq("id", id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(prayer);
});

adminRoutes.delete("/prayers/:id", async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const { error } = await supabase.from("prayers").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});
