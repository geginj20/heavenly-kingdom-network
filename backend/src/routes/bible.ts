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

bibleRoutes.get("/daily", async (c) => {
  const translation = (c.req.query("translation") || "kjv") as string;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const dailyVerses = [
    { book: "Psalms", chapter: 118, verse: 24 },
    { book: "Jeremiah", chapter: 29, verse: 11 },
    { book: "Philippians", chapter: 4, verse: 13 },
    { book: "Isaiah", chapter: 40, verse: 31 },
    { book: "Psalms", chapter: 23, verse: 1 },
    { book: "John", chapter: 3, verse: 16 },
    { book: "Romans", chapter: 8, verse: 28 },
    { book: "Psalms", chapter: 46, verse: 10 },
    { book: "Proverbs", chapter: 3, verse: 5 },
    { book: "Joshua", chapter: 1, verse: 9 },
    { book: "2 Corinthians", chapter: 5, verse: 17 },
    { book: "Ephesians", chapter: 2, verse: 8 },
    { book: "Psalms", chapter: 121, verse: 1 },
    { book: "Romans", chapter: 15, verse: 13 },
    { book: "Psalms", chapter: 34, verse: 8 },
    { book: "Matthew", chapter: 11, verse: 28 },
    { book: "Psalms", chapter: 20, verse: 4 },
    { book: "Isaiah", chapter: 43, verse: 2 },
    { book: "Hebrews", chapter: 11, verse: 1 },
    { book: "Psalms", chapter: 27, verse: 1 },
    { book: "1 Corinthians", chapter: 13, verse: 4 },
    { book: "John", chapter: 14, verse: 6 },
    { book: "Psalms", chapter: 37, verse: 4 },
    { book: "Romans", chapter: 12, verse: 2 },
    { book: "Micah", chapter: 6, verse: 8 },
    { book: "Galatians", chapter: 5, verse: 22 },
    { book: "Psalms", chapter: 62, verse: 8 },
    { book: "Colossians", chapter: 3, verse: 23 },
    { book: "1 Peter", chapter: 5, verse: 7 },
    { book: "Psalms", chapter: 16, verse: 8 },
    { book: "Matthew", chapter: 5, verse: 14 },
    { book: "Philippians", chapter: 3, verse: 14 },
    { book: "1 John", chapter: 4, verse: 19 },
    { book: "Psalms", chapter: 9, verse: 10 },
    { book: "Hebrews", chapter: 12, verse: 1 },
    { book: "Romans", chapter: 10, verse: 9 },
    { book: "Psalms", chapter: 19, verse: 14 },
    { book: "Isaiah", chapter: 55, verse: 6 },
    { book: "Deuteronomy", chapter: 7, verse: 9 },
    { book: "Zephaniah", chapter: 3, verse: 17 },
    { book: "1 Chronicles", chapter: 16, verse: 34 },
    { book: "Psalms", chapter: 136, verse: 1 },
    { book: "Ephesians", chapter: 1, verse: 11 },
    { book: "Romans", chapter: 5, verse: 8 },
    { book: "James", chapter: 1, verse: 17 },
    { book: "Psalms", chapter: 33, verse: 4 },
    { book: "Psalms", chapter: 85, verse: 8 },
    { book: "Psalms", chapter: 100, verse: 5 },
    { book: "Lamentations", chapter: 3, verse: 22 },
    { book: "Nahum", chapter: 1, verse: 7 },
    { book: "Psalms", chapter: 30, verse: 5 },
    { book: "Psalms", chapter: 34, verse: 4 },
    { book: "Psalms", chapter: 145, verse: 9 },
    { book: "Deuteronomy", chapter: 10, verse: 12 },
    { book: "Psalms", chapter: 86, verse: 5 },
    { book: "Psalms", chapter: 92, verse: 1 },
    { book: "Psalms", chapter: 107, verse: 1 },
    { book: "Psalms", chapter: 119, verse: 105 },
    { book: "Proverbs", chapter: 15, verse: 33 },
    { book: "Proverbs", chapter: 18, verse: 10 },
    { book: "Psalms", chapter: 66, verse: 20 },
    { book: "Psalms", chapter: 84, verse: 11 },
    { book: "Psalms", chapter: 103, verse: 1 },
    { book: "Psalms", chapter: 103, verse: 8 },
    { book: "Psalms", chapter: 111, verse: 10 },
    { book: "Psalms", chapter: 125, verse: 1 },
    { book: "Psalms", chapter: 138, verse: 8 },
  ];
  const idx = dayOfYear % dailyVerses.length;
  const ref = dailyVerses[idx];
  try {
    const res = await fetch(
      `${BIBLE_API}/${encodeURIComponent(ref.book)}+${ref.chapter}?translation=${translation}`
    );
    if (!res.ok) {
      return c.json({ text: "The Lord is my shepherd; I shall not want.", reference: "Psalms 23:1 (KJV)", translation });
    }
    const data = await res.json();
    const verse = (data.verses || []).find((v: { verse: number }) => v.verse === ref.verse);
    return c.json({
      text: verse ? verse.text : (data.verses?.[0]?.text || ""),
      reference: `${ref.book} ${ref.chapter}:${ref.verse}`,
      translation,
    });
  } catch {
    return c.json({ text: "The Lord is my shepherd; I shall not want.", reference: "Psalms 23:1 (KJV)", translation });
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
