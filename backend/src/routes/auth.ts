import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { supabase } from "../lib/supabase";
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

  const { data: authUser, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !authUser.user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, authUser.user.id));
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const token = signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { name, email, password } = c.req.valid("json");

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

  const [user] = await db.insert(users).values({ id: authUser.user.id, name, email, role: "member" }).returning();

  const token = signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRoutes.post("/google", zValidator("json", googleSchema), async (c) => {
  const { token: idToken } = c.req.valid("json");

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error || !data.user) {
    return c.json({ error: "Google authentication failed" }, 401);
  }

  const authUser = data.user;
  let [user] = await db.select().from(users).where(eq(users.id, authUser.id));
  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
        email: authUser.email!,
        role: "member",
        avatar: authUser.user_metadata?.avatar_url || null,
      })
      .returning();
    user = created;
  }

  const jwt = signToken({ userId: user.id, role: user.role || "member", name: user.name, email: user.email || undefined });
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
    const payload = verifyToken(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});
