import { Hono } from "hono";
import { getDb } from "../db";
import { bibleNotes } from "../db/schema";
import { eq } from "drizzle-orm";

export const bibleRoutes = new Hono();

bibleRoutes.get("/books", async (c) => {
  const books = [
    { name: "Genesis", chapters: 50, testament: "old" },
    { name: "Exodus", chapters: 40, testament: "old" },
    { name: "Psalms", chapters: 150, testament: "old" },
    { name: "Proverbs", chapters: 31, testament: "old" },
    { name: "Isaiah", chapters: 66, testament: "old" },
    { name: "Matthew", chapters: 28, testament: "new" },
    { name: "Mark", chapters: 16, testament: "new" },
    { name: "Luke", chapters: 24, testament: "new" },
    { name: "John", chapters: 21, testament: "new" },
    { name: "Acts", chapters: 28, testament: "new" },
    { name: "Romans", chapters: 16, testament: "new" },
    { name: "1 Corinthians", chapters: 16, testament: "new" },
    { name: "Ephesians", chapters: 6, testament: "new" },
    { name: "Philippians", chapters: 4, testament: "new" },
    { name: "Revelation", chapters: 22, testament: "new" },
  ];
  return c.json(books);
});

bibleRoutes.get("/verses/:book/:chapter", async (c) => {
  const { book, chapter } = c.req.param();
  try {
    const res = await fetch(`https://bible-api.com/${book}+${chapter}?translation=kjv`);
    if (!res.ok) return c.json({ verses: [] });
    const data = await res.json();
    return c.json(data.verses || []);
  } catch {
    return c.json({ verses: [] });
  }
});

bibleRoutes.post("/notes", async (c) => {
  const db = getDb();
  const body = await c.req.json();
  const [note] = await db.insert(bibleNotes).values({
    userId: body.userId,
    book: body.book,
    verse: body.verse,
    text: body.text,
  }).returning();
  return c.json(note, 201);
});

bibleRoutes.get("/notes", async (c) => {
  const db = getDb();
  const userId = c.req.query("userId");
  if (!userId) return c.json([]);
  const notes = await db.select().from(bibleNotes).where(eq(bibleNotes.userId, userId));
  return c.json(notes);
});
