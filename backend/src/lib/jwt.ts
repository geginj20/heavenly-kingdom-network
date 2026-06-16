import jwt from "jsonwebtoken";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";

const JWT_SECRET = process.env.JWT_SECRET || "hkn-dev-secret-change-in-production";

export interface JwtPayload {
  userId: number;
  role: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function requireAdmin(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== "admin" && payload.role !== "superadmin") {
      return c.json({ error: "Forbidden" }, 403);
    }
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}
