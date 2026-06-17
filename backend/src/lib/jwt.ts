import { sign, verify } from "hono/jwt";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";

const JWT_SECRET = process.env.JWT_SECRET || "hkn-dev-secret-change-in-production";

export interface JwtPayload {
  userId: string;
  role: string;
  name: string;
  email?: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, JWT_SECRET, "HS256");
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  return verify(token, JWT_SECRET, "HS256") as unknown as Promise<JwtPayload>;
}

export async function requireAdmin(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyToken(token);
    if (payload.role !== "admin" && payload.role !== "superadmin") {
      return c.json({ error: "Forbidden" }, 403);
    }
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}
