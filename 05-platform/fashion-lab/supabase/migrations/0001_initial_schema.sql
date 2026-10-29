-- ==============================================================================
-- FASHION-LAB INITIAL DATABASE MIGRATION (MODULE 1)
-- ==============================================================================

-- 1. Base User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN (
                  'designer','tailor','patternmaker','stylist','model',
                  'brand','client','admin')),
  avatar_url    TEXT,
  bio           TEXT,
  website_url   TEXT,
  location      TEXT,
  country_code  CHAR(2),
  onboarding_status TEXT NOT NULL DEFAULT 'pending',
  account_status    TEXT NOT NULL DEFAULT 'active'
                    CHECK (account_status IN ('active','suspended','banned')),
  terms_accepted_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  measurement_unit    TEXT NOT NULL DEFAULT 'cm' CHECK (measurement_unit IN ('cm','in')),
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_alerts         BOOLEAN NOT NULL DEFAULT false,
  profile_visibility  TEXT NOT NULL DEFAULT 'public'
                      CHECK (profile_visibility IN ('public','private','marketplace')),
  two_factor_enabled  BOOLEAN NOT NULL DEFAULT false,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Designer Profiles Extension
CREATE TABLE IF NOT EXISTS public.designer_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name    TEXT NOT NULL,
  specialty        TEXT[] DEFAULT '{}',
  price_range_min  INTEGER,
  price_range_max  INTEGER,
  years_experience SMALLINT,
  offers_in_person BOOLEAN NOT NULL DEFAULT false,
  service_areas    TEXT[] DEFAULT '{}',
  appointment_slot_minutes INTEGER NOT NULL DEFAULT 60,
  offered_meeting_modes    TEXT[] NOT NULL DEFAULT '{}'::text[],
  rating           NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count     INTEGER NOT NULL DEFAULT 0,
  marketplace_live BOOLEAN NOT NULL DEFAULT false,
  admin_approved_at TIMESTAMPTZ,
  cover_image      TEXT,
  tagline          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Brand Profiles Extension
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_name    TEXT NOT NULL,
  logo_url      TEXT,
  description   TEXT,
  established   SMALLINT,
  website_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable Universal RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (account_status = 'active');

CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Preferences Policies
CREATE POLICY "preferences_owner_all" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Designer Profiles Policies
CREATE POLICY "designers_public_read" ON public.designer_profiles
  FOR SELECT USING (marketplace_live = true OR user_id = auth.uid());

CREATE POLICY "designers_owner_update" ON public.designer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Brand Profiles Policies
CREATE POLICY "brands_public_read" ON public.brand_profiles
  FOR SELECT USING (true);

CREATE POLICY "brands_owner_update" ON public.brand_profiles
  FOR UPDATE USING (auth.uid() = user_id);
