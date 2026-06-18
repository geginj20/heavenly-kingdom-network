import type {
  PrayerRequest,
  Sermon,
  Event,
  BibleBook,
  BibleVerse,
} from "../data/demoData";
import {
  demoPrayers,
  demoSermons,
  demoEvents,
  sampleVerses,
  dailyScriptures,
  adminStats,
  adminPrayers,
  prayerCategories,
  sermonCategories,
  translations,
} from "../data/demoData";

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
      try {
        const params = category && category !== "All Prayers" ? `?category=${encodeURIComponent(category)}` : "";
        const data = await request<(PrayerRequest & { created_at?: string })[]>(`/prayers${params}`);
        return data.map((p) => ({ ...p, timestamp: p.created_at || "recent" }));
      } catch {
        if (!category || category === "All Prayers") return demoPrayers;
        return demoPrayers.filter((p) => p.category === category);
      }
    },
    submit: async (prayer: { name?: string; category: string; text: string }): Promise<PrayerRequest> => {
      try {
        const data = await request<PrayerRequest & { created_at?: string }>("/prayers", {
          method: "POST",
          body: JSON.stringify(prayer),
        });
        return { ...data, timestamp: data.created_at || "Just now" };
      } catch {
        return {
          id: `new-${Date.now()}`,
          name: prayer.name || "Anonymous",
          anonymous: !prayer.name,
          category: prayer.category,
          text: prayer.text,
          prayers: 0,
          timestamp: "Just now",
          comments: 0,
          isNew: true,
        };
      }
    },
    pray: async (id: string): Promise<void> => {
      try {
        await request(`/prayers/${id}/pray`, { method: "POST" });
      } catch { /* local fallback */ }
    },
    getCategories: async (): Promise<string[]> => {
      try {
        return await request<string[]>("/prayers/categories");
      } catch {
        return prayerCategories;
      }
    },
  },

  sermons: {
    list: async (category?: string, query?: string): Promise<Sermon[]> => {
      try {
        const params = new URLSearchParams();
        if (category && category !== "All") params.set("category", category);
        if (query) params.set("q", query);
        const qs = params.toString();
        return await request<Sermon[]>(`/sermons${qs ? `?${qs}` : ""}`);
      } catch {
        let results = demoSermons;
        if (category && category !== "All") results = results.filter((s) => s.category === category);
        if (query) {
          const q = query.toLowerCase();
          results = results.filter((s) =>
            s.title.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q) || s.ministry.toLowerCase().includes(q)
          );
        }
        return results;
      }
    },
    getCategories: async (): Promise<string[]> => {
      try {
        return await request<string[]>("/sermons/categories");
      } catch {
        return sermonCategories;
      }
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
      try {
        return await request<Event[]>("/events");
      } catch {
        return demoEvents;
      }
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
      try {
        return await request(`/bible/daily?translation=${translation}`);
      } catch {
        return { text: "The Lord is my shepherd; I shall not want.", reference: "Psalms 23:1 (KJV)", translation };
      }
    },
    books: async () => {
      try {
        const data = await request<{ books: BibleBook[]; translations: string[]; translationNames: Record<string, string> }>("/bible/books");
        return data;
      } catch {
        return { books: [], translations: ["kjv"], translationNames: { kjv: "King James Version" } };
      }
    },
    verses: async (book: string, chapter: number, translation = "kjv") => {
      try {
        return await request<{ verses: BibleVerse[]; book: string; chapter: number; translation: string; translationName: string }>(
          `/bible/verses/${encodeURIComponent(book)}/${chapter}?translation=${translation}`
        );
      } catch {
        return { verses: sampleVerses[book] || [], book, chapter, translation, translationName: translation.toUpperCase() };
      }
    },
    search: async (query: string, translation = "kjv") => {
      if (!API_BASE) {
        const q = query.toLowerCase();
        const results = Object.entries(sampleVerses).flatMap(([book, verses]) =>
          verses.filter((v) => v.text.toLowerCase().includes(q)).map((v) => ({ book, chapter: 1, verse: v.verse, text: v.text }))
        );
        return { results, query, translation };
      }
      try {
        return await request<{ results: { book: string; chapter: number; verse: number; text: string }[]; query: string; translation: string }>(
          `/bible/search?q=${encodeURIComponent(query)}&translation=${translation}`
        );
      } catch {
        return { results: [], query, translation };
      }
    },
  },

  streams: {
    upcoming: async (): Promise<{ id: string; title: string; host: string; time: string }[]> => {
      try {
        return await request("/streams/upcoming");
      } catch {
        return [
          { id: "1", title: "Morning Devotional", host: "Pastor Sarah Williams", time: "Tomorrow, 7:00 AM EST" },
          { id: "2", title: "Bible Study: Book of Romans", host: "Dr. Michael Johnson", time: "Wed, 6:30 PM EST" },
          { id: "3", title: "Youth Night Live", host: "Youth Ministry Team", time: "Fri, 7:00 PM PST" },
        ];
      }
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
      try {
        return await request(`/donations/history?email=${encodeURIComponent(email)}`);
      } catch {
        return [];
      }
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
    stats: async (): Promise<{ totalUsers: number; totalPrayers: number; pendingPrayers: number; totalSermons: number; monthlyGiving: number; activeEvents: number }> => {
      try {
        return await request("/admin/stats", { headers: authHeaders() });
      } catch {
        return adminStats;
      }
    },
    users: async (): Promise<{ id: number; name: string; email: string; role: string; status: string }[]> => {
      try {
        return await request("/admin/users", { headers: authHeaders() });
      } catch {
        return [
          { id: 1, name: "Sarah Mitchell", email: "sarah@email.com", role: "Pastor", status: "active" },
          { id: 2, name: "James Cooper", email: "james@email.com", role: "Ministry Leader", status: "active" },
          { id: 3, name: "David Kim", email: "david@email.com", role: "Member", status: "active" },
          { id: 4, name: "Maria Lopez", email: "maria@email.com", role: "Member", status: "inactive" },
          { id: 5, name: "Pastor Robert", email: "robert@church.org", role: "Admin", status: "active" },
          { id: 6, name: "Amanda Foster", email: "amanda@email.com", role: "Ministry Leader", status: "active" },
        ];
      }
    },
    donations: async (): Promise<{ name: string; amount: number; date: string; recurring: boolean }[]> => {
      try {
        return await request("/admin/donations", { headers: authHeaders() });
      } catch {
        return [
          { name: "Anonymous", amount: 100, date: "Jun 15, 2026", recurring: true },
          { name: "Sarah M.", amount: 50, date: "Jun 14, 2026", recurring: false },
          { name: "James K.", amount: 250, date: "Jun 13, 2026", recurring: true },
          { name: "Living Faith Church", amount: 500, date: "Jun 12, 2026", recurring: false },
          { name: "Maria L.", amount: 25, date: "Jun 11, 2026", recurring: true },
        ];
      }
    },
    prayers: async (status?: string): Promise<Record<string, unknown>[]> => {
      try {
        const params = status && status !== "all" ? `?status=${status}` : "";
        return await request(`/admin/prayers${params}`, { headers: authHeaders() });
      } catch {
        return adminPrayers as unknown as Record<string, unknown>[];
      }
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

  // Constants (local)
  prayerCategories,
  sermonCategories,
  translations,
  dailyScriptures,
};
