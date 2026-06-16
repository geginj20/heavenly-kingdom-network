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
  bibleBooks as demoBibleBooks,
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
  if (!API_BASE) {
    throw new ApiError(0, "API base URL not configured. Falling back to demo data.");
  }
  const url = `${API_BASE}/api${path}`;
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
    login: async (email: string, password: string) => {
      return request<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: email, password }),
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
  },

  events: {
    list: async (): Promise<Event[]> => {
      try {
        return await request<Event[]>("/events");
      } catch {
        return demoEvents;
      }
    },
    rsvp: async (eventId: number, name: string, email: string) => {
      return request(`/events/${eventId}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
    },
  },

  bible: {
    books: async (): Promise<BibleBook[]> => {
      try {
        return await request<BibleBook[]>("/bible/books");
      } catch {
        return demoBibleBooks;
      }
    },
    verses: async (book: string, chapter: number): Promise<BibleVerse[]> => {
      try {
        return await request<BibleVerse[]>(`/bible/verses/${encodeURIComponent(book)}/${chapter}`);
      } catch {
        return sampleVerses[book] || [];
      }
    },
    search: async (query: string): Promise<{ book: string; verse: number; text: string }[]> => {
      if (!API_BASE) {
        const q = query.toLowerCase();
        return Object.entries(sampleVerses).flatMap(([book, verses]) =>
          verses.filter((v) => v.text.toLowerCase().includes(q)).map((v) => ({ book, ...v }))
        );
      }
      try {
        return await request(`/bible/search?q=${encodeURIComponent(query)}`);
      } catch {
        return [];
      }
    },
  },

  admin: {
    stats: async () => {
      try {
        return await request("/admin/stats", { headers: authHeaders() });
      } catch {
        return adminStats;
      }
    },
    prayers: async (status?: string) => {
      try {
        const params = status && status !== "all" ? `?status=${status}` : "";
        return await request(`/admin/prayers${params}`, { headers: authHeaders() });
      } catch {
        return adminPrayers;
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
