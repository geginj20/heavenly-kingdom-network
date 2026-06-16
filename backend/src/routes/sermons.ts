import { Hono } from "hono";
import { and, eq, like, or } from "drizzle-orm";
import { getDb } from "../db";
import { sermons } from "../db/schema";

export const sermonRoutes = new Hono();

sermonRoutes.get("/", async (c) => {
  const db = getDb();
  const category = c.req.query("category");
  const query = c.req.query("q");

  let conditions = undefined;
  if (category && category !== "All") {
    conditions = eq(sermons.category, category);
  }
  if (query) {
    const q = `%${query}%`;
    const search = or(like(sermons.title, q), like(sermons.speaker, q), like(sermons.ministry, q));
    conditions = conditions ? and(conditions, search) : search;
  }

  const all = await db.select().from(sermons).where(conditions);
  return c.json(all);
});

sermonRoutes.get("/categories", async () => {
  return Response.json([
    "All", "Faith", "Hope", "Love", "Discipleship", "Leadership", "Worship", "Prophecy", "Healing", "Finance", "Relationships",
  ]);
});
