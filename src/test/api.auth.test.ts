import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// We test the api module directly
import { api } from "../lib/api";

describe("api.getToken", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when localStorage is empty (cookie-based auth, no token in storage)", () => {
    expect(api.getToken()).toBeNull();
  });

  it("returns null even after setToken (setToken is a no-op; cookie is set by backend)", () => {
    api.setToken();
    expect(api.getToken()).toBeNull();
  });

  it("clearToken removes any legacy token from localStorage", () => {
    localStorage.setItem("hkn-token", "old-token");
    api.clearToken();
    expect(api.getToken()).toBeNull();
  });
});

describe("api.auth.me — calls /api/auth/me without Authorization header", () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it("sends credentials:include so the httpOnly cookie is forwarded", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "u1", name: "Test", email: "t@t.com", role: "admin" }),
    });

    await api.auth.me();

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.credentials).toBe("include");
  });

  it("does NOT include an Authorization header (no localStorage token to leak)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "u1", name: "Test", email: "t@t.com", role: "admin" }),
    });

    await api.auth.me();

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string> | undefined;
    expect(headers?.["Authorization"]).toBeUndefined();
  });

  it("throws when the server returns 401 (no cookie present)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: "No token provided" }),
    });

    await expect(api.auth.me()).rejects.toThrow();
  });
});
