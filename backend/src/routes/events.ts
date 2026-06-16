import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { desc } from "drizzle-orm";
import { getDb } from "../db";
import { events, eventRsvps } from "../db/schema";
import { requireAdmin } from "../lib/jwt";

export const eventRoutes = new Hono();

eventRoutes.get("/", async (c) => {
  const db = getDb();
  const all = await db.select().from(events).orderBy(desc(events.date));
  return c.json(all);
});

const createEventSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  isOnline: z.boolean().optional().default(false),
  month: z.string().optional(),
  day: z.string().optional(),
  timezone: z.string().optional().default("EST"),
  image: z.string().optional().default("/images/event-worship-night.jpg"),
});

eventRoutes.post("/", requireAdmin, zValidator("json", createEventSchema), async (c) => {
  const db = getDb();
  const data = c.req.valid("json");
  const d = new Date(data.date);
  const [event] = await db.insert(events).values({
    ...data,
    month: data.month || d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: data.day || String(d.getDate()).padStart(2, "0"),
  }).returning();
  return c.json(event, 201);
});

eventRoutes.post("/:id/rsvp", async (c) => {
  const db = getDb();
  const eventId = Number(c.req.param("id"));
  const body = await c.req.json();
  const [rsvp] = await db.insert(eventRsvps).values({ eventId, name: body.name, email: body.email }).returning();
  return c.json(rsvp, 201);
});
