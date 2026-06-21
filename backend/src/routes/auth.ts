import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { signToken, verifyToken } from "../lib/jwt";
import { rateLimit, strictRateLimit } from "../lib/rateLimiter";
import { setCookie, getCookie } from "hono/cookie";

export const authRoutes = new Hono();

const loginSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(1).max(100),
});

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
});

const googleSchema = z.object({
  token: z.string().min(1).max(5000),
});

authRoutes.post("/login", rateLimit, zValidator("json", loginSchema), async (c) => {
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
  setCookie(c, "token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.post("/register", strictRateLimit, zValidator("json", registerSchema), async (c) => {
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
  setCookie(c, "token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
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
  setCookie(c, "token", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return c.json({
    token: jwt,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.post("/forgot-password", zValidator("json", z.object({ email: z.string().email() })), async (c) => {
  const { email } = c.req.valid("json");
  const supabase = getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${c.req.header("origin") || "http://localhost:5173"}/reset-password`,
  });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true, message: "If that email is registered, a reset link has been sent." });
});

authRoutes.post("/reset-password", zValidator("json", z.object({
  password: z.string().min(6),
  token: z.string().min(1),
})), async (c) => {
  const { password, token } = c.req.valid("json");
  const supabase = getSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return c.json({ error: "Invalid or expired token" }, 400);

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true, message: "Password updated successfully." });
});

authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");

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
