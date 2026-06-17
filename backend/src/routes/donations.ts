import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";

export const donationRoutes = new Hono();

const createDonationSchema = z.object({
  amount: z.number().positive(),
  recurring: z.boolean().optional().default(false),
  donor_name: z.string().optional().default("Anonymous"),
  donor_email: z.string().email().optional().default(""),
});

donationRoutes.post("/", zValidator("json", createDonationSchema), async (c) => {
  const supabase = getSupabase();
  const data = c.req.valid("json");
  const { data: donation, error } = await supabase.from("donations").insert({
    amount: data.amount,
    recurring: data.recurring,
    donor_name: data.donor_name,
    donor_email: data.donor_email,
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(donation, 201);
});

donationRoutes.get("/history", async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json([]);
  const supabase = getSupabase();
  const { data, error } = await supabase.from("donations").select("*").eq("donor_email", email).order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
