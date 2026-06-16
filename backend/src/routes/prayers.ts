import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { prayers, prayerComments } from "../db/schema";

export const prayerRoutes = new Hono();

const createPrayerSchema = z.object({
  name: z.string().max(50).optional().default(""),
  category: z.string().min(1),
  text: z.string().min(10).max(500),
});

prayerRoutes.get("/", async (c) => {
  const db = getDb();
  const category = c.req.query("category");
  const all = await db
    .select()
    .from(prayers)
    .where(category && category !== "All Prayers" ? eq(prayers.category, category) : undefined)
    .orderBy(desc(prayers.createdAt));
  return c.json(all);
});

prayerRoutes.post("/", zValidator("json", createPrayerSchema), async (c) => {
  const db = getDb();
  const data = c.req.valid("json");
  const [prayer] = await db
    .insert(prayers)
    .values({
      name: data.name || "Anonymous",
      anonymous: !data.name,
      category: data.category,
      text: data.text,
      prayers: 0,
      comments: 0,
      status: "approved",
    })
    .returning();
  return c.json(prayer, 201);
});

prayerRoutes.post("/:id/pray", async (c) => {
  const db = getDb();
  const id = Number(c.req.param("id"));
  const [prayer] = await db
    .update(prayers)
    .set({ prayers: sql`${prayers.prayers} + 1` })
    .where(eq(prayers.id, id))
    .returning();
  return c.json(prayer);
});

prayerRoutes.get("/:id/comments", async (c) => {
  const db = getDb();
  const prayerId = Number(c.req.param("id"));
  const comments = await db
    .select()
    .from(prayerComments)
    .where(eq(prayerComments.prayerId, prayerId))
    .orderBy(desc(prayerComments.createdAt));
  return c.json(comments);
});

prayerRoutes.post("/:id/comments", async (c) => {
  const db = getDb();
  const prayerId = Number(c.req.param("id"));
  const body = await c.req.json();
  const [comment] = await db
    .insert(prayerComments)
    .values({ prayerId, name: body.name || "Anonymous", text: body.text })
    .returning();
  await db
    .update(prayers)
    .set({ comments: sql`${prayers.comments} + 1` })
    .where(eq(prayers.id, prayerId));
  return c.json(comment, 201);
});

prayerRoutes.get("/categories", async () => {
  return Response.json([
    "All Prayers", "Healing", "Family", "Ministry", "Finances", "Guidance", "Salvation", "Relationships", "Other",
  ]);
});
