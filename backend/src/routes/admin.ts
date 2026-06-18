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

  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const { data: ytdDonations } = await supabase
    .from("donations")
    .select("amount, donor_name")
    .gte("created_at", startOfYear);
  const totalYtd = (ytdDonations || []).reduce((sum: number, d: { amount: number }) => sum + d.amount, 0);
  const donorNames = new Set((ytdDonations || []).map((d: { donor_name?: string }) => d.donor_name || "Anonymous"));
  const donorCount = donorNames.size;

  return c.json({
    totalUsers: totalUsers || 0,
    totalPrayers: allPrayers || 0,
    pendingPrayers: pendingPrayers || 0,
    totalSermons: totalSermons || 0,
    monthlyGiving,
    activeEvents: allEvents || 0,
    totalYtd,
    donorCount,
  });
});

adminRoutes.get("/donations", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(10);
  if (error || !data) {
    return c.json([]);
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
