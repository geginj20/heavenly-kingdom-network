import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/jwt";

export const sermonRoutes = new Hono();

sermonRoutes.get("/", async (c) => {
  const supabase = getSupabase();
  const category = c.req.query("category");
  const query = c.req.query("q");

  let q = supabase.from("sermons").select("*");
  if (category && category !== "All") {
    q = q.eq("category", category);
  }
  if (query) {
    const p = `%${query}%`;
    q = q.or(`title.ilike.${p},speaker.ilike.${p},ministry.ilike.${p}`);
  }

  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

sermonRoutes.get("/categories", async () => {
  return Response.json([
    "All", "Faith", "Hope", "Love", "Discipleship", "Leadership", "Worship", "Prophecy", "Healing", "Finance", "Relationships",
  ]);
});

const createSermonSchema = z.object({
  title: z.string().min(1).max(200),
  speaker: z.string().min(1).max(100),
  ministry: z.string().max(100).optional().default(""),
  duration: z.string().min(1).max(20),
  category: z.string().min(1).max(50),
  thumbnail: z.string().max(500).optional().default("/images/sermon-default.jpg"),
  date: z.string().max(50).optional().default(() => new Date().toISOString()),
});

const updateSermonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  speaker: z.string().min(1).max(100).optional(),
  ministry: z.string().max(100).optional(),
  duration: z.string().min(1).max(20).optional(),
  category: z.string().min(1).max(50).optional(),
  thumbnail: z.string().max(500).optional(),
  date: z.string().max(50).optional(),
});

sermonRoutes.post("/", requireAdmin, zValidator("json", createSermonSchema), async (c) => {
  const supabase = getSupabase();
  const data = c.req.valid("json");
  const { data: sermon, error } = await supabase.from("sermons").insert(data).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(sermon, 201);
});

sermonRoutes.patch("/:id", requireAdmin, zValidator("json", updateSermonSchema), async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const body = c.req.valid("json");
  const { data: sermon, error } = await supabase.from("sermons").update(body).eq("id", id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(sermon);
});

sermonRoutes.delete("/:id", requireAdmin, async (c) => {
  const supabase = getSupabase();
  const id = Number(c.req.param("id"));
  const { error } = await supabase.from("sermons").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});
