import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  role: text("role").default("member"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Anonymous"),
  anonymous: boolean("anonymous").default(true),
  category: text("category").notNull(),
  text: text("text").notNull(),
  prayers: integer("prayers").default(0),
  comments: integer("comments").default(0),
  status: text("status").default("approved"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prayerComments = pgTable("prayer_comments", {
  id: serial("id").primaryKey(),
  prayerId: integer("prayer_id").references(() => prayers.id).notNull(),
  userId: text("user_id").references(() => users.id),
  name: text("name").default("Anonymous"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sermons = pgTable("sermons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  speaker: text("speaker").notNull(),
  ministry: text("ministry").notNull(),
  duration: text("duration").notNull(),
  category: text("category").notNull(),
  thumbnail: text("thumbnail"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  day: text("day").notNull(),
  month: text("month").notNull(),
  time: text("time").notNull(),
  timezone: text("timezone").default("EST"),
  location: text("location").notNull(),
  isOnline: boolean("is_online").default(false),
  image: text("image"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bibleNotes = pgTable("bible_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  book: text("book").notNull(),
  verse: integer("verse"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  amount: integer("amount").notNull(),
  recurring: boolean("recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
