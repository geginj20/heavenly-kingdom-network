import {
  demoPrayers,
  demoSermons,
  demoEvents,
  bibleBooks,
  sampleVerses,
  dailyScriptures,
  adminStats,
  adminPrayers,
  prayerCategories,
  sermonCategories,
  translations,
} from "../data/demoData";
import type {
  PrayerRequest,
  Sermon,
  Event,
  BibleBook,
  BibleVerse,
} from "../data/demoData";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const api = {
  prayers: {
    list: async (category?: string): Promise<PrayerRequest[]> => {
      await delay(0);
      if (!category || category === "All Prayers") return demoPrayers;
      return demoPrayers.filter((p) => p.category === category);
    },
    submit: async (prayer: Omit<PrayerRequest, "id" | "timestamp" | "prayers" | "comments" | "isNew">): Promise<PrayerRequest> => {
      await delay(0);
      return {
        ...prayer,
        id: `new-${Date.now()}`,
        timestamp: "Just now",
        prayers: 0,
        comments: 0,
        isNew: true,
      };
    },
    pray: async (): Promise<void> => {
      await delay(0);
    },
  },

  sermons: {
    list: async (category?: string, query?: string): Promise<Sermon[]> => {
      await delay(0);
      let results = demoSermons;
      if (category && category !== "All") {
        results = results.filter((s) => s.category === category);
      }
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.speaker.toLowerCase().includes(q) ||
            s.ministry.toLowerCase().includes(q)
        );
      }
      return results;
    },
  },

  events: {
    list: async (): Promise<Event[]> => {
      await delay(0);
      return demoEvents;
    },
  },

  bible: {
    books: async (): Promise<BibleBook[]> => {
      await delay(0);
      return bibleBooks;
    },
    verses: async (book: string): Promise<BibleVerse[]> => {
      await delay(0);
      return sampleVerses[book] || [];
    },
    search: async (query: string): Promise<{ book: string; verse: number; text: string }[]> => {
      await delay(0);
      const q = query.toLowerCase();
      return Object.entries(sampleVerses).flatMap(([book, verses]) =>
        verses
          .filter((v) => v.text.toLowerCase().includes(q))
          .map((v) => ({ book, ...v }))
      );
    },
  },

  admin: {
    stats: async () => {
      await delay(0);
      return adminStats;
    },
    prayers: async () => {
      await delay(0);
      return adminPrayers;
    },
  },

  // Constants
  prayerCategories,
  sermonCategories,
  translations,
  dailyScriptures,
};
