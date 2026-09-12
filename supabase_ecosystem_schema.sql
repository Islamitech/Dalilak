-- =============================================================================
-- 🏛️ DALELAK HELPER APPS ECOSYSTEM DATABASE SCHEMA
-- سيرفر مخرجات التطبيقات المساعدة لمنظومة دليلك الذكية
-- Supabase Project: hzlbbzxccqfdeyumtxph
-- URL: https://hzlbbzxccqfdeyumtxph.supabase.co
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLE: marketing_activities (مخرجات المرحلة الأولى: استوديو التسويق)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.marketing_activities (
    business_id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    category TEXT DEFAULT 'عام',
    city TEXT DEFAULT 'مصر',
    phone TEXT,
    persona JSONB NOT NULL DEFAULT '{}'::jsonb,
    calendar JSONB NOT NULL DEFAULT '[]'::jsonb,
    ready_posts JSONB NOT NULL DEFAULT '[]'::jsonb,
    whatsapp_campaigns JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_promoted_to_core BOOLEAN DEFAULT false,
    promoted_at TIMESTAMPTZ,
    source TEXT DEFAULT 'gemini-ai',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for marketing activities
CREATE INDEX IF NOT EXISTS idx_marketing_updated_at ON public.marketing_activities (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_category ON public.marketing_activities (category);

-- =============================================================================
-- 2. TABLE: visual_assets (مخرجات المرحلة الثانية: ستوديو الهوية والتصاميم)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.visual_assets (
    business_id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    logo_data_url TEXT,
    logo_vector_svg TEXT,
    signboard_photo_url TEXT,
    catalog_config JSONB DEFAULT '{}'::jsonb,
    catalog_image_url TEXT,
    social_frames JSONB DEFAULT '[]'::jsonb,
    promo_offer_config JSONB DEFAULT '{}'::jsonb,
    promo_offer_image_url TEXT,
    acrylic_stand JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for visual assets
CREATE INDEX IF NOT EXISTS idx_visual_updated_at ON public.visual_assets (updated_at DESC);

-- =============================================================================
-- 3. TABLE: pitch_packages (مخرجات المرحلة الثالثة: استوديو الإغلاق المحمي والواتساب)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pitch_packages (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    client_token TEXT NOT NULL,
    theme_color TEXT DEFAULT 'amber',
    headline TEXT,
    subheadline TEXT,
    package_name TEXT,
    original_price NUMERIC DEFAULT 4800,
    discounted_price NUMERIC DEFAULT 2450,
    currency TEXT DEFAULT 'جنيه مصري',
    visual_assets JSONB DEFAULT '{}'::jsonb,
    deliverables JSONB DEFAULT '[]'::jsonb,
    watermark_settings JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'ready',
    whatsapp_dispatches JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pitch packages
CREATE INDEX IF NOT EXISTS idx_pitch_business_id ON public.pitch_packages (business_id);
CREATE INDEX IF NOT EXISTS idx_pitch_token ON public.pitch_packages (client_token);
CREATE INDEX IF NOT EXISTS idx_pitch_updated_at ON public.pitch_packages (updated_at DESC);

-- =============================================================================
-- 4. TABLE: tracking_telemetry (تتبع تفاعل العملاء وفتح المعاينات المباشرة)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tracking_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    pitch_id TEXT,
    business_id TEXT,
    event_type TEXT NOT NULL, -- 'view', 'scroll', 'asset_click', 'whatsapp_click', 'order'
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_pitch_id ON public.tracking_telemetry (pitch_id);
CREATE INDEX IF NOT EXISTS idx_tracking_business_id ON public.tracking_telemetry (business_id);
CREATE INDEX IF NOT EXISTS idx_tracking_created_at ON public.tracking_telemetry (created_at DESC);

-- =============================================================================
-- 5. TABLE: businesses (جدول الأنشطة - للمزامنة أو النسخ الاحتياطي السريع)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category TEXT DEFAULT 'عام',
    governorate TEXT DEFAULT 'القاهرة',
    city TEXT DEFAULT 'القاهرة',
    street TEXT,
    landmark TEXT,
    phone TEXT NOT NULL,
    secondary_phone TEXT,
    working_hours TEXT DEFAULT '9 ص - 10 م',
    description TEXT,
    owner_name TEXT DEFAULT 'صاحب المكان',
    owner_phone TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    verification_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eco_businesses_phone ON public.businesses (phone);
CREATE INDEX IF NOT EXISTS idx_eco_businesses_category ON public.businesses (category);

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - السماح للتطبيقات بالقراءة والكتابة
-- =============================================================================
ALTER TABLE public.marketing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drops old policies if exist
DROP POLICY IF EXISTS "Allow helper apps all access on marketing_activities" ON public.marketing_activities;
DROP POLICY IF EXISTS "Allow helper apps all access on visual_assets" ON public.visual_assets;
DROP POLICY IF EXISTS "Allow helper apps all access on pitch_packages" ON public.pitch_packages;
DROP POLICY IF EXISTS "Allow helper apps all access on tracking_telemetry" ON public.tracking_telemetry;
DROP POLICY IF EXISTS "Allow helper apps all access on businesses" ON public.businesses;

-- Create permissive policies for helper applications using publishable/anon key
CREATE POLICY "Allow helper apps all access on marketing_activities" 
    ON public.marketing_activities FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow helper apps all access on visual_assets" 
    ON public.visual_assets FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow helper apps all access on pitch_packages" 
    ON public.pitch_packages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow helper apps all access on tracking_telemetry" 
    ON public.tracking_telemetry FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow helper apps all access on businesses" 
    ON public.businesses FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 7. AUTO-UPDATE TIMESTAMP FUNCTION & TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_marketing_updated_at ON public.marketing_activities;
CREATE TRIGGER trg_marketing_updated_at
    BEFORE UPDATE ON public.marketing_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_visual_updated_at ON public.visual_assets;
CREATE TRIGGER trg_visual_updated_at
    BEFORE UPDATE ON public.visual_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pitch_updated_at ON public.pitch_packages;
CREATE TRIGGER trg_pitch_updated_at
    BEFORE UPDATE ON public.pitch_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON public.businesses;
CREATE TRIGGER trg_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
