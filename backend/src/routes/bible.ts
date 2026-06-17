import { Hono } from "hono";
import { getSupabase } from "../lib/supabase";

export const bibleRoutes = new Hono();

const BIBLE_API = "https://bible-api.com";

const BOOKS = [
  { name: "Genesis", chapters: 50, testament: "old" },
  { name: "Exodus", chapters: 40, testament: "old" },
  { name: "Leviticus", chapters: 27, testament: "old" },
  { name: "Numbers", chapters: 36, testament: "old" },
  { name: "Deuteronomy", chapters: 34, testament: "old" },
  { name: "Joshua", chapters: 24, testament: "old" },
  { name: "Judges", chapters: 21, testament: "old" },
  { name: "Ruth", chapters: 4, testament: "old" },
  { name: "1 Samuel", chapters: 31, testament: "old" },
  { name: "2 Samuel", chapters: 24, testament: "old" },
  { name: "1 Kings", chapters: 22, testament: "old" },
  { name: "2 Kings", chapters: 25, testament: "old" },
  { name: "1 Chronicles", chapters: 29, testament: "old" },
  { name: "2 Chronicles", chapters: 36, testament: "old" },
  { name: "Ezra", chapters: 10, testament: "old" },
  { name: "Nehemiah", chapters: 13, testament: "old" },
  { name: "Esther", chapters: 10, testament: "old" },
  { name: "Job", chapters: 42, testament: "old" },
  { name: "Psalms", chapters: 150, testament: "old" },
  { name: "Proverbs", chapters: 31, testament: "old" },
  { name: "Ecclesiastes", chapters: 12, testament: "old" },
  { name: "Song of Solomon", chapters: 8, testament: "old" },
  { name: "Isaiah", chapters: 66, testament: "old" },
  { name: "Jeremiah", chapters: 52, testament: "old" },
  { name: "Lamentations", chapters: 5, testament: "old" },
  { name: "Ezekiel", chapters: 48, testament: "old" },
  { name: "Daniel", chapters: 12, testament: "old" },
  { name: "Hosea", chapters: 14, testament: "old" },
  { name: "Joel", chapters: 3, testament: "old" },
  { name: "Amos", chapters: 9, testament: "old" },
  { name: "Obadiah", chapters: 1, testament: "old" },
  { name: "Jonah", chapters: 4, testament: "old" },
  { name: "Micah", chapters: 7, testament: "old" },
  { name: "Nahum", chapters: 3, testament: "old" },
  { name: "Habakkuk", chapters: 3, testament: "old" },
  { name: "Zephaniah", chapters: 3, testament: "old" },
  { name: "Haggai", chapters: 2, testament: "old" },
  { name: "Zechariah", chapters: 14, testament: "old" },
  { name: "Malachi", chapters: 4, testament: "old" },
  { name: "Matthew", chapters: 28, testament: "new" },
  { name: "Mark", chapters: 16, testament: "new" },
  { name: "Luke", chapters: 24, testament: "new" },
  { name: "John", chapters: 21, testament: "new" },
  { name: "Acts", chapters: 28, testament: "new" },
  { name: "Romans", chapters: 16, testament: "new" },
  { name: "1 Corinthians", chapters: 16, testament: "new" },
  { name: "2 Corinthians", chapters: 13, testament: "new" },
  { name: "Galatians", chapters: 6, testament: "new" },
  { name: "Ephesians", chapters: 6, testament: "new" },
  { name: "Philippians", chapters: 4, testament: "new" },
  { name: "Colossians", chapters: 4, testament: "new" },
  { name: "1 Thessalonians", chapters: 5, testament: "new" },
  { name: "2 Thessalonians", chapters: 3, testament: "new" },
  { name: "1 Timothy", chapters: 6, testament: "new" },
  { name: "2 Timothy", chapters: 4, testament: "new" },
  { name: "Titus", chapters: 3, testament: "new" },
  { name: "Philemon", chapters: 1, testament: "new" },
  { name: "Hebrews", chapters: 13, testament: "new" },
  { name: "James", chapters: 5, testament: "new" },
  { name: "1 Peter", chapters: 5, testament: "new" },
  { name: "2 Peter", chapters: 3, testament: "new" },
  { name: "1 John", chapters: 5, testament: "new" },
  { name: "2 John", chapters: 1, testament: "new" },
  { name: "3 John", chapters: 1, testament: "new" },
  { name: "Jude", chapters: 1, testament: "new" },
  { name: "Revelation", chapters: 22, testament: "new" },
];

const TRANSLATIONS = ["kjv", "web", "asv"] as const;
const TRANSLATION_NAMES: Record<string, string> = {
  kjv: "King James Version",
  web: "World English Bible",
  asv: "American Standard Version",
};

bibleRoutes.get("/books", (c) => c.json({ books: BOOKS, translations: TRANSLATIONS, translationNames: TRANSLATION_NAMES }));

bibleRoutes.get("/verses/:book/:chapter", async (c) => {
  const book = c.req.param("book");
  const chapter = Number(c.req.param("chapter"));
  const translation = c.req.query("translation") || "kjv";
  const bookParam = encodeURIComponent(book);

  try {
    const res = await fetch(`${BIBLE_API}/${bookParam}+${chapter}?translation=${translation}`);
    if (!res.ok) {
      return c.json({ verses: [], error: `bible-api.com returned ${res.status}` });
    }
    const data = await res.json();
    return c.json({
      verses: data.verses || [],
      book: data.reference || book,
      chapter,
      translation,
      translationName: TRANSLATION_NAMES[translation] || translation.toUpperCase(),
    });
  } catch {
    return c.json({ verses: [], error: "Failed to fetch verses" });
  }
});

bibleRoutes.get("/search", async (c) => {
  const query = c.req.query("q");
  const translation = (c.req.query("translation") || "kjv") as string;

  if (!query || query.length < 3) {
    return c.json({ results: [], error: "Query must be at least 3 characters" });
  }

  const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];

  for (const book of BOOKS.slice(0, 10)) {
    if (results.length >= 50) break;
    for (let ch = 1; ch <= Math.min(book.chapters, 5); ch++) {
      if (results.length >= 50) break;
      try {
        const res = await fetch(`${BIBLE_API}/${encodeURIComponent(book.name)}+${ch}?translation=${translation}`);
        if (!res.ok) continue;
        const data = await res.json();
        const matches = (data.verses || []).filter(
          (v: { verse: number; text: string }) => v.text.toLowerCase().includes(query.toLowerCase())
        );
        for (const m of matches) {
          results.push({ book: book.name, chapter: ch, verse: m.verse, text: m.text.slice(0, 150) });
        }
        if (matches.length > 0) {
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch {
        continue;
      }
    }
  }

  return c.json({ results, query, translation });
});

bibleRoutes.post("/notes", async (c) => {
  const supabase = getSupabase();
  const body = await c.req.json();
  const { data: note, error } = await supabase.from("bible_notes").insert({
    user_id: body.userId,
    book: body.book,
    verse: body.verse,
    text: body.text,
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(note, 201);
});

bibleRoutes.get("/notes", async (c) => {
  const supabase = getSupabase();
  const userId = c.req.query("userId");
  if (!userId) return c.json([]);
  const { data, error } = await supabase.from("bible_notes").select("*").eq("user_id", userId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
