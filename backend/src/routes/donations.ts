import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin, verifyToken } from "../lib/jwt";
import { getCookie } from "hono/cookie";
import { sendDonationEmail } from "../lib/email";

export const donationRoutes = new Hono();

const createDonationSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  recurring: z.boolean().optional().default(false),
  donor_name: z.string().optional().default("Anonymous"),
  donor_email: z.string().email().optional().default(""),
});

donationRoutes.post("/", requireAdmin, zValidator("json", createDonationSchema), async (c) => {
  const supabase = getSupabase();
  const data = c.req.valid("json");
  const { data: donation, error } = await supabase.from("donations").insert({
    amount: data.amount,
    recurring: data.recurring,
    donor_name: data.donor_name,
    donor_email: data.donor_email,
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);

  await sendDonationEmail(c, data.donor_email, data.donor_name, data.amount, "KES");

  return c.json(donation, 201);
});

donationRoutes.get("/history", async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json([]);

  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const payload = await verifyToken(token).catch(() => null);
  if (!payload) return c.json({ error: "Invalid token" }, 401);

  if (payload.role !== "admin" && payload.role !== "superadmin" && payload.email !== email) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.from("donations").select("*").eq("donor_email", email).order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
