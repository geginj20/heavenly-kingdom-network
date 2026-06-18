import type { PrayerRequest, Sermon, Event, BibleBook, BibleVerse } from "../data/demoData";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = API_BASE ? `${API_BASE}/api${path}` : `/api${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
  }
  return res.json();
}

function getToken(): string | null {
  try {
    return localStorage.getItem("hkn-token");
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type AuthUser = { id: number; name: string; email: string; role: string; avatar?: string };

export const api = {
  getToken,
  setToken(token: string) {
    localStorage.setItem("hkn-token", token);
  },
  clearToken() {
    localStorage.removeItem("hkn-token");
  },

  auth: {
    forgotPassword: async (email: string) => {
      return request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
    },
    resetPassword: async (password: string, token: string) => {
      return request("/auth/reset-password", { method: "POST", body: JSON.stringify({ password, token }) });
    },
    login: async (email: string, password: string) => {
      return request<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    register: async (name: string, email: string, password: string) => {
      return request<{ token: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
    },
    google: async (token: string) => {
      return request<{ token: string; user: AuthUser }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    },
    me: async () => {
      return request<AuthUser>("/auth/me", { headers: authHeaders() });
    },
  },

  prayers: {
    list: async (category?: string): Promise<PrayerRequest[]> => {
      const params = category && category !== "All Prayers" ? `?category=${encodeURIComponent(category)}` : "";
      const data = await request<(PrayerRequest & { created_at?: string })[]>(`/prayers${params}`);
      return data.map((p) => ({ ...p, timestamp: p.created_at || "recent" }));
    },
    submit: async (prayer: { name?: string; category: string; text: string }): Promise<PrayerRequest> => {
      const data = await request<PrayerRequest & { created_at?: string }>("/prayers", {
        method: "POST",
        body: JSON.stringify(prayer),
      });
      return { ...data, timestamp: data.created_at || "Just now" };
    },
    pray: async (id: string): Promise<void> => {
      await request(`/prayers/${id}/pray`, { method: "POST" });
    },
    getCategories: async (): Promise<string[]> => {
      return await request<string[]>("/prayers/categories");
    },
  },

  sermons: {
    list: async (category?: string, query?: string): Promise<Sermon[]> => {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (query) params.set("q", query);
      const qs = params.toString();
      return await request<Sermon[]>(`/sermons${qs ? `?${qs}` : ""}`);
    },
    getCategories: async (): Promise<string[]> => {
      return await request<string[]>("/sermons/categories");
    },
    create: async (data: Partial<Sermon>): Promise<Sermon> => {
      return request<Sermon>("/sermons", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<Sermon>): Promise<Sermon> => {
      return request<Sermon>(`/sermons/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      await request(`/sermons/${id}`, { method: "DELETE", headers: authHeaders() });
    },
  },

  events: {
    list: async (): Promise<Event[]> => {
      return await request<Event[]>("/events");
    },
    create: async (eventData: {
      title: string; date: string; time: string; location: string;
      description: string; isOnline?: boolean; month?: string;
      day?: string; timezone?: string; image?: string;
    }) => {
      return request("/events", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(eventData),
      });
    },
    update: async (id: string, data: Partial<Event>): Promise<Event> => {
      return request<Event>(`/events/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request(`/events/${id}`, { method: "DELETE", headers: authHeaders() });
    },
    rsvp: async (eventId: number, name: string, email: string) => {
      return request(`/events/${eventId}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
    },
  },

  bible: {
    dailyVerse: async (translation = "kjv"): Promise<{ text: string; reference: string; translation: string }> => {
      return await request(`/bible/daily?translation=${translation}`);
    },
    books: async () => {
      const data = await request<{ books: BibleBook[]; translations: string[]; translationNames: Record<string, string> }>("/bible/books");
      return data;
    },
    verses: async (book: string, chapter: number, translation = "kjv") => {
      return await request<{ verses: BibleVerse[]; book: string; chapter: number; translation: string; translationName: string }>(
        `/bible/verses/${encodeURIComponent(book)}/${chapter}?translation=${translation}`
      );
    },
    search: async (query: string, translation = "kjv") => {
      return await request<{ results: { book: string; chapter: number; verse: number; text: string }[]; query: string; translation: string }>(
        `/bible/search?q=${encodeURIComponent(query)}&translation=${translation}`
      );
    },
  },

  streams: {
    upcoming: async (): Promise<{ id: string; title: string; host: string; time: string }[]> => {
      return await request("/streams/upcoming");
    },
  },

  donations: {
    create: async (data: { amount: number; recurring?: boolean; donor_name?: string; donor_email?: string }) => {
      return request("/donations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    history: async (email: string): Promise<{ amount: number; donor_name: string; donor_email: string; recurring: boolean; created_at: string }[]> => {
      return await request(`/donations/history?email=${encodeURIComponent(email)}`);
    },
  },

  payments: {
    initialize: async (data: { email: string; amount: number; currency?: string; metadata?: Record<string, unknown> }) => {
      return request("/payments/initialize", { method: "POST", body: JSON.stringify(data) });
    },
    verify: async (reference: string) => {
      return request(`/payments/verify/${reference}`);
    },
    paypalCreate: async (data: { amount: number; currency?: string }) => {
      return request("/payments/paypal/create", { method: "POST", body: JSON.stringify(data) });
    },
    paypalCapture: async (data: { orderId: string }) => {
      return request("/payments/paypal/capture", { method: "POST", body: JSON.stringify(data) });
    },
  },

  admin: {
    stats: async (): Promise<{ totalUsers: number; totalPrayers: number; pendingPrayers: number; totalSermons: number; monthlyGiving: number; activeEvents: number; totalYtd: number; donorCount: number }> => {
      return await request("/admin/stats", { headers: authHeaders() });
    },
    users: async (): Promise<{ id: number; name: string; email: string; role: string; status: string }[]> => {
      return await request("/admin/users", { headers: authHeaders() });
    },
    donations: async (): Promise<{ name: string; amount: number; date: string; recurring: boolean }[]> => {
      return await request("/admin/donations", { headers: authHeaders() });
    },
    prayers: async (status?: string): Promise<Record<string, unknown>[]> => {
      const params = status && status !== "all" ? `?status=${status}` : "";
      return await request(`/admin/prayers${params}`, { headers: authHeaders() });
    },
    updatePrayerStatus: async (id: number, status: string) => {
      return request(`/admin/prayers/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
    },
    deletePrayer: async (id: number) => {
      return request(`/admin/prayers/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    },
  },

};
