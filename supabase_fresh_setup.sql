-- =============================================================================
-- Kingdom Mission Network (kingdommissionnetwork.org)
-- Complete Supabase Schema & Database Setup Script
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'member',
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. PRAYERS TABLE
CREATE TABLE IF NOT EXISTS public.prayers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Anonymous',
    anonymous BOOLEAN DEFAULT true,
    category TEXT NOT NULL,
    text TEXT NOT NULL,
    prayers INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. PRAYER COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.prayer_comments (
    id BIGSERIAL PRIMARY KEY,
    prayer_id BIGINT NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT DEFAULT 'Anonymous',
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. SERMONS TABLE
CREATE TABLE IF NOT EXISTS public.sermons (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    speaker TEXT NOT NULL,
    ministry TEXT NOT NULL,
    duration TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail TEXT,
    audio_url TEXT,
    video_url TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    day TEXT NOT NULL,
    month TEXT NOT NULL,
    time TEXT NOT NULL,
    timezone TEXT DEFAULT 'EST',
    location TEXT NOT NULL,
    is_online BOOLEAN DEFAULT false,
    image TEXT DEFAULT '/images/event-worship-night.jpg',
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. EVENT RSVPS TABLE
CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. BIBLE NOTES TABLE
CREATE TABLE IF NOT EXISTS public.bible_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    verse INTEGER,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. DONATIONS TABLE
CREATE TABLE IF NOT EXISTS public.donations (
    id BIGSERIAL PRIMARY KEY,
    donor_name TEXT NOT NULL DEFAULT 'Anonymous',
    donor_email TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'KES',
    recurring BOOLEAN DEFAULT false,
    payment_provider TEXT,
    payment_reference TEXT UNIQUE,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. SUBSCRIPTIONS TABLE (Kingdom Partner Tier)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id BIGSERIAL PRIMARY KEY,
    subscriber_name TEXT NOT NULL DEFAULT 'Kingdom Partner',
    subscriber_email TEXT NOT NULL,
    plan_name TEXT NOT NULL DEFAULT 'Kingdom Partner',
    amount NUMERIC NOT NULL DEFAULT 1000,
    currency TEXT NOT NULL DEFAULT 'KES',
    usd_amount NUMERIC,
    exchange_rate NUMERIC,
    interval TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active',
    payment_provider TEXT NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    subscription_code TEXT,
    customer_code TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_prayers_status ON public.prayers(status);
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON public.prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer_id ON public.prayer_comments(prayer_id);
CREATE INDEX IF NOT EXISTS idx_sermons_category ON public.sermons(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_donations_ref ON public.donations(payment_reference);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(subscriber_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ref ON public.subscriptions(payment_reference);

-- =============================================================================
-- STORED RPC FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_prayer_count(p_id bigint)
RETURNS SETOF prayers AS $$
BEGIN
  RETURN QUERY UPDATE prayers SET prayers = prayers + 1 WHERE id = p_id RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_prayer_comment_count(p_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE prayers SET comments = comments + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read approved prayers" ON public.prayers FOR SELECT USING (status = 'approved');
CREATE POLICY "Public read comments" ON public.prayer_comments FOR SELECT USING (true);
CREATE POLICY "Public read sermons" ON public.sermons FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public insert prayers" ON public.prayers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert comments" ON public.prayer_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert RSVPs" ON public.event_rsvps FOR INSERT WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access prayers" ON public.prayers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access prayer_comments" ON public.prayer_comments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access sermons" ON public.sermons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access events" ON public.events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access event_rsvps" ON public.event_rsvps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access bible_notes" ON public.bible_notes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access donations" ON public.donations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access subscriptions" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SEED INITIAL CONTENT
-- =============================================================================
INSERT INTO public.sermons (title, speaker, ministry, duration, category, thumbnail, date) VALUES
('Walking by Faith, Not by Sight', 'Pastor Michael Johnson', 'Living Faith Church', '42 min', 'Faith', '/images/sermon-thumb-1.jpg', 'June 14, 2026'),
('The Power of Covenant Relationships', 'Dr. Sarah Williams', 'Covenant Ministries', '38 min', 'Relationships', '/images/sermon-thumb-2.jpg', 'June 12, 2026'),
('Worship that Moves Heaven', 'Pastor David Chen', 'Upper Room Worship', '55 min', 'Worship', '/images/sermon-thumb-3.jpg', 'June 10, 2026'),
('Financial Stewardship in God''s Kingdom', 'Pastor Robert Thompson', 'Kingdom Life Church', '47 min', 'Finance', '/images/sermon-thumb-1.jpg', 'June 8, 2026'),
('Leading with a Servant''s Heart', 'Bishop Amanda Foster', 'Grace Leadership Institute', '51 min', 'Leadership', '/images/sermon-thumb-2.jpg', 'June 6, 2026'),
('Healing is the Children''s Bread', 'Evangelist Mark Peters', 'Healing Rooms International', '1 hr 5 min', 'Healing', '/images/sermon-thumb-3.jpg', 'June 4, 2026')
ON CONFLICT DO NOTHING;

INSERT INTO public.events (title, date, day, month, time, timezone, location, is_online, image, description) VALUES
('Global Worship Night', '2026-09-20', '20', 'SEP', '7:00 PM', 'EST', 'Online', true, '/images/event-worship-night.jpg', 'Join believers worldwide for an evening of powerful worship, testimony, and intercession.'),
('Kingdom Leadership Conference', '2026-09-25', '25', 'SEP', '9:00 AM', 'PST', 'Nairobi & Global Stream', true, '/images/event-conference.jpg', 'Equipping pastors, ministry workers, and kingdom professionals for greater global impact.'),
('Youth Revival Night', '2026-09-28', '28', 'SEP', '6:00 PM', 'EAT', 'Online Stream', true, '/images/event-worship-night.jpg', 'Igniting the fire of the Holy Spirit in the next generation across Africa and the nations.'),
('Global Prayer & Fasting Summit', '2026-10-05', '05', 'OCT', '8:00 AM', 'EST', 'Online', true, '/images/event-conference.jpg', 'A 3-day virtual summit dedicated to prayer, fasting, and spiritual awakening.')
ON CONFLICT DO NOTHING;

INSERT INTO public.prayers (name, anonymous, category, text, prayers, comments, status) VALUES
('Sarah M.', false, 'Healing', 'Please pray for my mother who is undergoing medical treatment next week. Trusting God for full healing.', 38, 4, 'approved'),
('Pastor James', false, 'Ministry', 'Our ministry team is launching a new outreach initiative in rural communities. Pray for open doors.', 52, 9, 'approved'),
('Anonymous', true, 'Guidance', 'Seeking the Lord''s direction for career and family transition this season.', 24, 3, 'approved'),
('David K.', false, 'Family', 'Praying for healing and reconciliation within our extended family.', 41, 6, 'approved'),
('Maria L.', false, 'Finances', 'Believing God for financial breakthrough and provision for our community children''s home.', 63, 11, 'approved')
ON CONFLICT DO NOTHING;
