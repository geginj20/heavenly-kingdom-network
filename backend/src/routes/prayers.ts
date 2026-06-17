import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";

export const prayerRoutes = new Hono();

const createPrayerSchema = z.object({
  name: z.string().max(50).optional().default(""),
  category: z.string().min(1),
  text: z.string().min(10).max(500),
});

prayerRoutes.get("/", async (c) => {
  const supabase = getSupabase();
  const category = c.req.query("category");
  let q = supabase.from("prayers").select("*");
  if (category && category !== "All Prayers") {
    q = q.eq("category", category);
  }
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

prayerRoutes.post("/", zValidator("json", createPrayerSchema), async (c) => {
  const supabase = getSupabase();
  const data = c.req.valid("json");
  const { data: prayer, error } = await supabase.from("prayers").insert({
    name: data.name || "Anonymous",
    anonymous: !data.name,
    category: data.category,
    text: data.text,
    prayers: 0,
    comments: 0,
    status: "approved",
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(prayer, 201);
});

prayerRoutes.post("/:id/pray", async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const { data: current } = await supabase.from("prayers").select("prayers").eq("id", id).single();
  const count = (current?.prayers || 0) + 1;
  const { data: prayer, error } = await supabase.from("prayers").update({ prayers: count }).eq("id", id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(prayer);
});

prayerRoutes.get("/:id/comments", async (c) => {
  const supabase = getSupabase();
  const prayerId = Number(c.req.param("id"));
  const { data, error } = await supabase
    .from("prayer_comments")
    .select("*")
    .eq("prayer_id", prayerId)
    .order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

prayerRoutes.post("/:id/comments", async (c) => {
  const supabase = getSupabase();
  const prayerId = Number(c.req.param("id"));
  const body = await c.req.json();
  const { data: comment, error } = await supabase.from("prayer_comments").insert({
    prayer_id: prayerId,
    name: body.name || "Anonymous",
    text: body.text,
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);

  const { data: current } = await supabase.from("prayers").select("comments").eq("id", prayerId).single();
  const count = (current?.comments || 0) + 1;
  await supabase.from("prayers").update({ comments: count }).eq("id", prayerId);

  return c.json(comment, 201);
});

prayerRoutes.get("/categories", async () => {
  return Response.json([
    "All Prayers", "Healing", "Family", "Ministry", "Finances", "Guidance", "Salvation", "Relationships", "Other",
  ]);
});
