import { Hono } from "hono";
import { getSupabase } from "../lib/supabase";

const fallbackStreams = [
  { id: "1", title: "Morning Devotional", host: "Pastor Sarah Williams", time: "Tomorrow, 7:00 AM EST" },
  { id: "2", title: "Bible Study: Book of Romans", host: "Dr. Michael Johnson", time: "Wed, 6:30 PM EST" },
  { id: "3", title: "Youth Night Live", host: "Youth Ministry Team", time: "Fri, 7:00 PM PST" },
];

export const streamRoutes = new Hono();

streamRoutes.get("/upcoming", async (c) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("live_streams").select("*").order("created_at", { ascending: false }).limit(5);
  if (error || !data || data.length === 0) {
    return c.json(fallbackStreams);
  }
  return c.json(data);
});
