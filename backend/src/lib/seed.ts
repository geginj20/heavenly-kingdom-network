import { getSupabase } from "./supabase";
import { randomUUID } from "crypto";

async function seed() {
  console.log("Seeding database...");

  const supabase = getSupabase();

  const adminPassword = randomUUID();
  const pastorPassword = randomUUID();
  const memberPassword = randomUUID();

  const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
    email: "admin@hkn.com",
    password: adminPassword,
    email_confirm: true,
  });
  if (adminErr) {
    console.error("Admin user creation failed:", adminErr.message);
    return;
  }
  const adminId = adminAuth.user!.id;

  const { data: sarahAuth } = await supabase.auth.admin.createUser({
    email: "sarah@email.com",
    password: pastorPassword,
    email_confirm: true,
  });
  const sarahId = sarahAuth?.user?.id;

  const { data: davidAuth } = await supabase.auth.admin.createUser({
    email: "david@email.com",
    password: memberPassword,
    email_confirm: true,
  });
  const davidId = davidAuth?.user?.id;

  if (!adminId || !sarahId || !davidId) {
    console.error("Failed to create auth users");
    return;
  }

  await supabase.from("users").insert([
    { id: adminId, name: "Admin User", email: "admin@hkn.com", role: "superadmin" },
    { id: sarahId, name: "Sarah Mitchell", email: "sarah@email.com", role: "pastor" },
    { id: davidId, name: "David Kim", email: "david@email.com", role: "member" },
  ]);
  
  console.log("Users seeded with random passwords:");
  console.log(`admin@hkn.com: ${adminPassword}`);
  console.log(`sarah@email.com: ${pastorPassword}`);
  console.log(`david@email.com: ${memberPassword}`);

  await supabase.from("prayers").insert([
    { name: "Sarah M.", anonymous: false, category: "Healing", text: "Please pray for my mother who is undergoing surgery next week.", prayers: 24, comments: 3, status: "approved", user_id: sarahId },
    { name: "Pastor James", anonymous: false, category: "Ministry", text: "Our church is launching a new outreach program in the downtown area.", prayers: 47, comments: 8, status: "approved" },
    { name: "Anonymous", anonymous: true, category: "Guidance", text: "I need wisdom for a career decision that affects my family.", prayers: 18, comments: 2, status: "pending" },
    { name: "David K.", anonymous: false, category: "Family", text: "Praying for reconciliation with my brother.", prayers: 31, comments: 5, status: "approved", user_id: davidId },
    { name: "Maria L.", anonymous: false, category: "Finances", text: "Lost my job last month. Trusting God to provide.", prayers: 42, comments: 12, status: "approved" },
    { name: "Anonymous", anonymous: true, category: "Salvation", text: "Please pray for my husband to come to know Jesus.", prayers: 56, comments: 9, status: "flagged" },
  ]);
  console.log("Prayers seeded");

  await supabase.from("sermons").insert([
    { title: "Walking by Faith, Not by Sight", speaker: "Pastor Michael Johnson", ministry: "Living Faith Church", duration: "42 min", category: "Faith", thumbnail: "/images/sermon-thumb-1.jpg", date: "June 14, 2026" },
    { title: "The Power of Covenant Relationships", speaker: "Dr. Sarah Williams", ministry: "Covenant Ministries", duration: "38 min", category: "Relationships", thumbnail: "/images/sermon-thumb-2.jpg", date: "June 12, 2026" },
    { title: "Worship that Moves Heaven", speaker: "Pastor David Chen", ministry: "Upper Room Worship", duration: "55 min", category: "Worship", thumbnail: "/images/sermon-thumb-3.jpg", date: "June 10, 2026" },
    { title: "Financial Stewardship in God's Kingdom", speaker: "Pastor Robert Thompson", ministry: "Kingdom Life Church", duration: "47 min", category: "Finance", thumbnail: "/images/sermon-thumb-1.jpg", date: "June 8, 2026" },
    { title: "Leading with a Servant's Heart", speaker: "Bishop Amanda Foster", ministry: "Grace Leadership Institute", duration: "51 min", category: "Leadership", thumbnail: "/images/sermon-thumb-2.jpg", date: "June 6, 2026" },
    { title: "Healing is the Children's Bread", speaker: "Evangelist Mark Peters", ministry: "Healing Rooms International", duration: "1 hr 5 min", category: "Healing", thumbnail: "/images/sermon-thumb-3.jpg", date: "June 4, 2026" },
  ]);
  console.log("Sermons seeded");

  await supabase.from("events").insert([
    { title: "Global Worship Night", date: "2026-06-20", day: "20", month: "JUN", time: "7:00 PM", timezone: "EST", location: "Online", isOnline: true, image: "/images/event-worship-night.jpg", description: "Join believers worldwide for an evening of powerful worship and prayer." },
    { title: "Kingdom Leadership Conference", date: "2026-06-25", day: "25", month: "JUN", time: "9:00 AM", timezone: "PST", location: "Los Angeles, CA", isOnline: false, image: "/images/event-conference.jpg", description: "A three-day conference for pastors and ministry leaders." },
    { title: "Youth Revival Night", date: "2026-06-28", day: "28", month: "JUN", time: "6:00 PM", timezone: "CST", location: "Dallas, TX", isOnline: true, image: "/images/event-worship-night.jpg", description: "Igniting the fire of the Holy Spirit in the next generation." },
    { title: "Prayer & Fasting Summit", date: "2026-07-05", day: "05", month: "JUL", time: "8:00 AM", timezone: "EST", location: "Online", isOnline: true, image: "/images/event-conference.jpg", description: "A 3-day virtual summit on prayer and fasting." },
  ]);
  console.log("Events seeded");

  await supabase.from("donations").insert([
    { name: "Anonymous", amount: 100, recurring: true },
    { name: "Sarah M.", amount: 50, recurring: false },
    { name: "James K.", amount: 250, recurring: true },
    { name: "Living Faith Church", amount: 500, recurring: false },
    { name: "Maria L.", amount: 25, recurring: true },
  ]);
  console.log("Donations seeded");

  console.log("Seed complete!");
}

seed().catch(console.error);
