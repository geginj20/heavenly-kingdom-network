import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { signToken, verifyToken } from "../lib/jwt";
import bcrypt from "bcryptjs";

export const authRoutes = new Hono();

const loginSchema = z.object({
  username: z.string().min(1),
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
  const { username, password } = c.req.valid("json");

  const [user] = await db.select().from(users).where(eq(users.email, username));

  if (!user || !user.password) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = signToken({ userId: user.id, role: user.role || "member", name: user.name });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { name, email, password } = c.req.valid("json");

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ name, email, password: hashed, role: "member" })
    .returning();

  const token = signToken({ userId: user.id, role: user.role || "member", name: user.name });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRoutes.post("/google", zValidator("json", googleSchema), async (c) => {
  const { token: googleToken } = c.req.valid("json");

  try {
    const payload = await verifyGoogleToken(googleToken);
    if (!payload || !payload.email) {
      return c.json({ error: "Invalid Google token" }, 401);
    }

    let [user] = await db.select().from(users).where(eq(users.email, payload.email));

    if (!user) {
      const [created] = await db
        .insert(users)
        .values({
          name: payload.name || payload.email.split("@")[0],
          email: payload.email,
          role: "member",
          avatar: payload.picture || null,
        })
        .returning();
      user = created;
    }

    const jwt = signToken({ userId: user.id, role: user.role || "member", name: user.name });
    return c.json({
      token: jwt,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch {
    return c.json({ error: "Google authentication failed" }, 401);
  }
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

interface GooglePayload {
  email: string;
  name?: string;
  picture?: string;
}

async function verifyGoogleToken(idToken: string): Promise<GooglePayload> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
  );
  if (!res.ok) throw new Error("Invalid Google token");
  return res.json() as Promise<GooglePayload>;
}
