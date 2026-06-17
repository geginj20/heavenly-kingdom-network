import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { signToken, verifyToken } from "../lib/jwt";

export const authRoutes = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const googleSchema = z.object({
  token: z.string().min(1),
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const supabase = getSupabase();
  const { data: authUser, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !authUser.user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.user.id).single();
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const token = await signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { name, email, password } = c.req.valid("json");

  const supabase = getSupabase();
  const { data: authUser, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message.includes("already")) {
      return c.json({ error: "Email already registered" }, 409);
    }
    return c.json({ error: error.message }, 400);
  }
  if (!authUser.user) {
    return c.json({ error: "Registration failed" }, 500);
  }

  await supabase.from("users").insert({ id: authUser.user.id, name, email, role: "member" });
  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.user.id).single();

  if (!user) return c.json({ error: "Failed to create profile" }, 500);

  const token = await signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRoutes.post("/google", zValidator("json", googleSchema), async (c) => {
  const supabase = getSupabase();
  const { token: idToken } = c.req.valid("json");

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error || !data.user) {
    return c.json({ error: "Google authentication failed" }, 401);
  }

  const authUser = data.user;
  let { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single();
  if (!user) {
    const { data: created } = await supabase.from("users").insert({
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      email: authUser.email!,
      role: "member",
      avatar: authUser.user_metadata?.avatar_url || null,
    }).select().single();
    user = created;
  }
  if (!user) return c.json({ error: "Failed to create profile" }, 500);

  const jwt = await signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined });
  return c.json({
    token: jwt,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ error: "No token provided" }, 401);
  }

  try {
    const payload = await verifyToken(token);
    const supabase = getSupabase();
    const { data: user } = await supabase.from("users").select("*").eq("id", payload.userId).single();
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});
