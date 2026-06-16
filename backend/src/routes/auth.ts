import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { signToken } from "../lib/jwt";
import bcrypt from "bcryptjs";

export const authRoutes = new Hono();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
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
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
