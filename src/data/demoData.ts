export interface PrayerRequest {
  id: string;
  name: string;
  anonymous: boolean;
  category: string;
  text: string;
  prayers: number;
  timestamp: string;
  comments: number;
  isNew?: boolean;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  ministry: string;
  duration: string;
  category: string;
  thumbnail: string;
  date: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  time: string;
  timezone: string;
  location: string;
  isOnline: boolean;
  image: string;
  description: string;
}

export interface BibleBook {
  name: string;
  chapters: number;
  testament: "old" | "new";
}

export interface BibleVerse {
  verse: number;
  text: string;
}

export const prayerCategories = [
  "All Prayers",
  "Healing",
  "Family",
  "Ministry",
  "Finances",
  "Guidance",
  "Salvation",
  "Relationships",
  "Other",
];

export const demoPrayers: PrayerRequest[] = [
  {
    id: "1",
    name: "Sarah M.",
    anonymous: false,
    category: "Healing",
    text: "Please pray for my mother who is undergoing surgery next week. We trust in God's healing power and ask for peace and strength for our family during this time.",
    prayers: 24,
    timestamp: "2 hours ago",
    comments: 3,
  },
  {
    id: "2",
    name: "Pastor James",
    anonymous: false,
    category: "Ministry",
    text: "Our church is launching a new outreach program in the downtown area. Pray for open hearts and that we may reach those who need God's love most.",
    prayers: 47,
    timestamp: "4 hours ago",
    comments: 8,
  },
  {
    id: "3",
    name: "Anonymous",
    anonymous: true,
    category: "Guidance",
    text: "I need wisdom for a career decision that affects my family. Praying for clarity and that God's will be done in my life.",
    prayers: 18,
    timestamp: "6 hours ago",
    comments: 2,
  },
  {
    id: "4",
    name: "David K.",
    anonymous: false,
    category: "Family",
    text: "Praying for reconciliation with my brother. We haven't spoken in months and I miss him dearly. May God mend what is broken.",
    prayers: 31,
    timestamp: "8 hours ago",
    comments: 5,
  },
  {
    id: "5",
    name: "Maria L.",
    anonymous: false,
    category: "Finances",
    text: "Lost my job last month. Trusting God to provide for my children and our needs. Thank you for your prayers.",
    prayers: 42,
    timestamp: "12 hours ago",
    comments: 12,
  },
  {
    id: "6",
    name: "Anonymous",
    anonymous: true,
    category: "Salvation",
    text: "Please pray for my husband to come to know Jesus. He has been resistant to the Gospel for years but I believe God is working.",
    prayers: 56,
    timestamp: "1 day ago",
    comments: 9,
  },
];

export const sermonCategories = [
  "All",
  "Faith",
  "Hope",
  "Love",
  "Discipleship",
  "Leadership",
  "Worship",
  "Prophecy",
  "Healing",
  "Finance",
];

export const demoSermons: Sermon[] = [
  {
    id: "1",
    title: "Walking by Faith, Not by Sight",
    speaker: "Pastor Michael Johnson",
    ministry: "Living Faith Church",
    duration: "42 min",
    category: "Faith",
    thumbnail: "/images/sermon-thumb-1.jpg",
    date: "June 14, 2026",
  },
  {
    id: "2",
    title: "The Power of Covenant Relationships",
    speaker: "Dr. Sarah Williams",
    ministry: "Covenant Ministries",
    duration: "38 min",
    category: "Relationships",
    thumbnail: "/images/sermon-thumb-2.jpg",
    date: "June 12, 2026",
  },
  {
    id: "3",
    title: "Worship that Moves Heaven",
    speaker: "Pastor David Chen",
    ministry: "Upper Room Worship",
    duration: "55 min",
    category: "Worship",
    thumbnail: "/images/sermon-thumb-3.jpg",
    date: "June 10, 2026",
  },
  {
    id: "4",
    title: "Financial Stewardship in God's Kingdom",
    speaker: "Pastor Robert Thompson",
    ministry: "Kingdom Life Church",
    duration: "47 min",
    category: "Finance",
    thumbnail: "/images/sermon-thumb-1.jpg",
    date: "June 8, 2026",
  },
  {
    id: "5",
    title: "Leading with a Servant's Heart",
    speaker: "Bishop Amanda Foster",
    ministry: "Grace Leadership Institute",
    duration: "51 min",
    category: "Leadership",
    thumbnail: "/images/sermon-thumb-2.jpg",
    date: "June 6, 2026",
  },
  {
    id: "6",
    title: "Healing is the Children's Bread",
    speaker: "Evangelist Mark Peters",
    ministry: "Healing Rooms International",
    duration: "1 hr 5 min",
    category: "Healing",
    thumbnail: "/images/sermon-thumb-3.jpg",
    date: "June 4, 2026",
  },
];

export const demoEvents: Event[] = [
  {
    id: "1",
    title: "Global Worship Night",
    date: "2026-06-20",
    day: "20",
    month: "JUN",
    time: "7:00 PM",
    timezone: "EST",
    location: "Online",
    isOnline: true,
    image: "/images/event-worship-night.jpg",
    description: "Join believers from around the world for an evening of powerful worship and prayer.",
  },
  {
    id: "2",
    title: "Kingdom Leadership Conference",
    date: "2026-06-25",
    day: "25",
    month: "JUN",
    time: "9:00 AM",
    timezone: "PST",
    location: "Los Angeles, CA",
    isOnline: false,
    image: "/images/event-conference.jpg",
    description: "A three-day conference for pastors and ministry leaders focused on Kingdom principles.",
  },
  {
    id: "3",
    title: "Youth Revival Night",
    date: "2026-06-28",
    day: "28",
    month: "JUN",
    time: "6:00 PM",
    timezone: "CST",
    location: "Dallas, TX",
    isOnline: true,
    image: "/images/event-worship-night.jpg",
    description: "An evening dedicated to igniting the fire of the Holy Spirit in the next generation.",
  },
  {
    id: "4",
    title: "Prayer & Fasting Summit",
    date: "2026-07-05",
    day: "05",
    month: "JUL",
    time: "8:00 AM",
    timezone: "EST",
    location: "Online",
    isOnline: true,
    image: "/images/event-conference.jpg",
    description: "A 3-day virtual summit on the power of prayer and fasting in spiritual breakthrough.",
  },
];

export const bibleBooks: BibleBook[] = [
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

export const sampleVerses: Record<string, BibleVerse[]> = {
  "Psalm 23": [
    { verse: 1, text: "The LORD is my shepherd, I lack nothing." },
    { verse: 2, text: "He makes me lie down in green pastures, he leads me beside quiet waters," },
    { verse: 3, text: "he refreshes my soul. He guides me along the right paths for his name's sake." },
    { verse: 4, text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
    { verse: 5, text: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows." },
    { verse: 6, text: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever." },
  ],
  "John 3": [
    { verse: 16, text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
    { verse: 17, text: "For God did not send his Son into the world to condemn the world, but to save the world through him." },
  ],
  "Philippians 4": [
    { verse: 6, text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." },
    { verse: 7, text: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." },
    { verse: 8, text: "Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things." },
  ],
  "Romans 8": [
    { verse: 28, text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
    { verse: 38, text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers," },
    { verse: 39, text: "neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord." },
  ],
  "Genesis 1": [
    { verse: 1, text: "In the beginning God created the heavens and the earth." },
    { verse: 2, text: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters." },
    { verse: 3, text: "And God said, 'Let there be light,' and there was light." },
    { verse: 4, text: "God saw that the light was good, and he separated the light from the darkness." },
  ],
  "Matthew 5": [
    { verse: 14, text: "You are the light of the world. A town built on a hill cannot be hidden." },
    { verse: 16, text: "In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven." },
  ],
};

export const translations = ["NIV", "ESV", "KJV"];

export const dailyScriptures = [
  {
    reference: "Psalm 23:1-2",
    book: "Psalm 23",
    niv: "The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters...",
    esv: "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters...",
    kjv: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
  },
  {
    reference: "Philippians 4:6-7",
    book: "Philippians 4",
    niv: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    esv: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
    kjv: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
  },
  {
    reference: "Romans 8:28",
    book: "Romans 8",
    niv: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    esv: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
    kjv: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
  },
];

export const adminStats = {
  totalUsers: 1247,
  totalPrayers: 3892,
  pendingPrayers: 24,
  totalSermons: 156,
  monthlyGiving: 28450,
  activeEvents: 8,
};

export const adminPrayers = [
  { id: "1", text: "Pray for my mother's surgery next week", category: "Healing", author: "Sarah M.", date: "2026-06-15", status: "pending" },
  { id: "2", text: "Our church outreach program needs prayer", category: "Ministry", author: "Pastor James", date: "2026-06-15", status: "approved" },
  { id: "3", text: "Need wisdom for a career decision", category: "Guidance", author: "Anonymous", date: "2026-06-14", status: "pending" },
  { id: "4", text: "Reconciliation with my brother", category: "Family", author: "David K.", date: "2026-06-14", status: "approved" },
  { id: "5", text: "Lost my job, trusting God to provide", category: "Finances", author: "Maria L.", date: "2026-06-13", status: "flagged" },
  { id: "6", text: "Pray for my husband to know Jesus", category: "Salvation", author: "Anonymous", date: "2026-06-12", status: "approved" },
];
