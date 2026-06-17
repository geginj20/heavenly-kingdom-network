import { Hono } from "hono";
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

  return c.json({
    totalUsers: 1247,
    totalPrayers: allPrayers || 0,
    pendingPrayers: pendingPrayers || 0,
    totalSermons: 156,
    monthlyGiving,
    activeEvents: allEvents || 0,
  });
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

adminRoutes.patch("/prayers/:id/status", async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json();
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
