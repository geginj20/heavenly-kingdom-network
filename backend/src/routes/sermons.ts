import { Hono } from "hono";
import { getSupabase } from "../lib/supabase";

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
