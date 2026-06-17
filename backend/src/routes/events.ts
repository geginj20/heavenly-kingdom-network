import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/jwt";

export const eventRoutes = new Hono();

eventRoutes.get("/", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
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
  const supabase = getSupabase();
  const data = c.req.valid("json");
  const d = new Date(data.date);
  const { data: event, error } = await supabase.from("events").insert({
    ...data,
    month: data.month || d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: data.day || String(d.getDate()).padStart(2, "0"),
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(event, 201);
});

eventRoutes.post("/:id/rsvp", async (c) => {
  const supabase = getSupabase();
  const eventId = Number(c.req.param("id"));
  const body = await c.req.json();
  const { data: rsvp, error } = await supabase.from("event_rsvps").insert({
    event_id: eventId,
    name: body.name,
    email: body.email,
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(rsvp, 201);
});
