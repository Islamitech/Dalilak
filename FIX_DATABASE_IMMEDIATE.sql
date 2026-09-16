-- ==============================================================================
-- 🏛️ DALELAK PLATFORM - MASTER DATABASE MIGRATION & PERMISSIONS SCRIPT
-- SOURCE OF TRUTH: PostgreSQL / Supabase Cloud
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/xdqpbajymacpdccorjcj
-- 2. Navigate to "SQL Editor" -> Click "New Query"
-- 3. Paste this ENTIRE script and click "Run" (Green Button)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. 🏗️ Table Schema Idempotent Fixes (Adding any missing columns across all tables)
-- ------------------------------------------------------------------------------

-- 1.1 Representatives Table
CREATE TABLE IF NOT EXISTS public.representatives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL
);

ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'rep';
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'مندوب مبيعات ميداني';
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'القاهرة';
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS target_month INTEGER DEFAULT 25;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS avatar_status TEXT DEFAULT 'approved';
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 42.86;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referral_unlocked BOOLEAN DEFAULT false;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS admin_bypass_referral BOOLEAN DEFAULT false;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referral_reward_granted BOOLEAN DEFAULT false;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS active_session_id TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS last_active_timestamp BIGINT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS activation_face_photo TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS national_id_card_photo TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS national_id_card_back_photo TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS pending_phone TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS phone_status TEXT DEFAULT 'none';
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS deleted_by_role TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.2 Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    phone TEXT NOT NULL
);

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'عام';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'القاهرة';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'القاهرة';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '9 ص - 10 م';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION NOT NULL DEFAULT 30.0444;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION NOT NULL DEFAULT 31.2357;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT 'صاحب المكان';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_phone TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS rep_id TEXT DEFAULT 'rep_1';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS rep_name TEXT DEFAULT 'مندوب معتمد';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS rep_commission_rate NUMERIC;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS package_id TEXT DEFAULT 'pkg_basic';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS package_name TEXT DEFAULT '1. باقة التوثيق الأساسي';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS package_price NUMERIC DEFAULT 250;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cash_collected_by_rep NUMERIC DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS rep_location_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_sync_status TEXT DEFAULT 'pending';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_sync_date TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS invoice_date TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_fee_exempt BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS fee_exemption_reason TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_already_on_google BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'new_verification';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS admin_follow_ups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS additional_invoices JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cover_photo TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS payment_receipt_photo TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS payment_receipt_date TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_rating_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_rating NUMERIC;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deleted_by_role TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deleted_reason TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.3 Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS business_category TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'القاهرة';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'القاهرة';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS location_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS interest_level TEXT DEFAULT 'medium';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS admin_follow_ups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS follow_up_date TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rep_id TEXT DEFAULT 'rep_1';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rep_name TEXT DEFAULT 'مندوب معتمد';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contacted_date TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_followup';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.4 Payout Requests Table
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id TEXT PRIMARY KEY,
    rep_id TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    method TEXT NOT NULL DEFAULT 'instapay',
    account_details TEXT NOT NULL
);

ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS rep_name TEXT DEFAULT 'مندوب معتمد';
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS rep_phone TEXT;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS request_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS processed_date TIMESTAMPTZ;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS receipt_photo TEXT;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'payout';
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.5 Payment Config Table
CREATE TABLE IF NOT EXISTS public.payment_config (
    id TEXT PRIMARY KEY DEFAULT 'default'
);

ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS vodafone_cash_number TEXT DEFAULT '01143888355';
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS vodafone_cash_number_2 TEXT DEFAULT '01556221141';
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS fawry_merchant_code TEXT;
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS insta_pay_handle TEXT DEFAULT '@daz31181';
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS card_gateway_active BOOLEAN DEFAULT true;
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Insert default row in payment_config if not exists
INSERT INTO public.payment_config (id, vodafone_cash_number, vodafone_cash_number_2, insta_pay_handle, card_gateway_active)
VALUES ('default', '01143888355', '01556221141', '@daz31181', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. 🔑 Schema Level & Table Level Privileges (Fix for Error 42501)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- Grant permissions to anon and authenticated across all operational tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.representatives TO anon, authenticated;
GRANT ALL ON TABLE public.representatives TO service_role, postgres;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.businesses TO anon, authenticated;
GRANT ALL ON TABLE public.businesses TO service_role, postgres;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads TO anon, authenticated;
GRANT ALL ON TABLE public.leads TO service_role, postgres;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payout_requests TO anon, authenticated;
GRANT ALL ON TABLE public.payout_requests TO service_role, postgres;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_config TO anon, authenticated;
GRANT ALL ON TABLE public.payment_config TO service_role, postgres;

-- Sequences & Default Privileges
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. 🔒 Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- 3.1 Clean existing conflicting policies
DROP POLICY IF EXISTS "Allow select non-deleted reps" ON public.representatives;
DROP POLICY IF EXISTS "Allow anon and auth insert reps" ON public.representatives;
DROP POLICY IF EXISTS "Allow reps update own account" ON public.representatives;
DROP POLICY IF EXISTS "Service role full access on reps" ON public.representatives;
DROP POLICY IF EXISTS "Reps read basic safe info" ON public.representatives;
DROP POLICY IF EXISTS "Reps registration restricted" ON public.representatives;
DROP POLICY IF EXISTS "Reps self update restricted" ON public.representatives;
DROP POLICY IF EXISTS "Representatives delete restricted" ON public.representatives;
DROP POLICY IF EXISTS "Representatives select access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives insert access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives update access" ON public.representatives;
DROP POLICY IF EXISTS "dalelak_reps_select" ON public.representatives;
DROP POLICY IF EXISTS "dalelak_reps_insert" ON public.representatives;
DROP POLICY IF EXISTS "dalelak_reps_update" ON public.representatives;
DROP POLICY IF EXISTS "dalelak_reps_all" ON public.representatives;

-- 3.2 Representatives Policies
CREATE POLICY "dalelak_reps_select"
ON public.representatives FOR SELECT
TO anon, authenticated
USING (
    deleted_at IS NULL AND
    (is_deleted IS NULL OR is_deleted = false)
);

CREATE POLICY "dalelak_reps_insert"
ON public.representatives FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "dalelak_reps_update"
ON public.representatives FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "dalelak_reps_delete"
ON public.representatives FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "dalelak_reps_all"
ON public.representatives FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3.3 Businesses Policies
DROP POLICY IF EXISTS "Businesses public read" ON public.businesses;
DROP POLICY IF EXISTS "Businesses rep insert" ON public.businesses;
DROP POLICY IF EXISTS "Businesses rep update" ON public.businesses;
DROP POLICY IF EXISTS "Businesses delete restricted" ON public.businesses;
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Reps and public can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow updates on businesses" ON businesses;
DROP POLICY IF EXISTS "Allow delete on businesses" ON businesses;
DROP POLICY IF EXISTS "dalelak_biz_select" ON public.businesses;
DROP POLICY IF EXISTS "dalelak_biz_insert" ON public.businesses;
DROP POLICY IF EXISTS "dalelak_biz_update" ON public.businesses;
DROP POLICY IF EXISTS "dalelak_biz_delete" ON public.businesses;
DROP POLICY IF EXISTS "dalelak_biz_all" ON public.businesses;

CREATE POLICY "dalelak_biz_select"
ON public.businesses FOR SELECT
TO anon, authenticated
USING (deleted_at IS NULL AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "dalelak_biz_insert"
ON public.businesses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "dalelak_biz_update"
ON public.businesses FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "dalelak_biz_delete"
ON public.businesses FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "dalelak_biz_all"
ON public.businesses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3.4 Leads Policies
DROP POLICY IF EXISTS "Leads public read" ON public.leads;
DROP POLICY IF EXISTS "Leads rep insert" ON public.leads;
DROP POLICY IF EXISTS "Leads rep update" ON public.leads;
DROP POLICY IF EXISTS "dalelak_leads_select" ON public.leads;
DROP POLICY IF EXISTS "dalelak_leads_insert" ON public.leads;
DROP POLICY IF EXISTS "dalelak_leads_update" ON public.leads;
DROP POLICY IF EXISTS "dalelak_leads_all" ON public.leads;

CREATE POLICY "dalelak_leads_select"
ON public.leads FOR SELECT
TO anon, authenticated
USING (deleted_at IS NULL AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "dalelak_leads_insert"
ON public.leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "dalelak_leads_update"
ON public.leads FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "dalelak_leads_delete"
ON public.leads FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "dalelak_leads_all"
ON public.leads FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3.5 Payout Requests Policies
DROP POLICY IF EXISTS "Payouts read" ON public.payout_requests;
DROP POLICY IF EXISTS "Payouts insert" ON public.payout_requests;
DROP POLICY IF EXISTS "Payouts update" ON public.payout_requests;
DROP POLICY IF EXISTS "dalelak_payouts_select" ON public.payout_requests;
DROP POLICY IF EXISTS "dalelak_payouts_insert" ON public.payout_requests;
DROP POLICY IF EXISTS "dalelak_payouts_update" ON public.payout_requests;
DROP POLICY IF EXISTS "dalelak_payouts_delete" ON public.payout_requests;
DROP POLICY IF EXISTS "dalelak_payouts_all" ON public.payout_requests;

CREATE POLICY "dalelak_payouts_select"
ON public.payout_requests FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "dalelak_payouts_insert"
ON public.payout_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "dalelak_payouts_update"
ON public.payout_requests FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "dalelak_payouts_delete"
ON public.payout_requests FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "dalelak_payouts_all"
ON public.payout_requests FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3.6 Payment Config Policies
DROP POLICY IF EXISTS "Payment config read" ON public.payment_config;
DROP POLICY IF EXISTS "Payment config update" ON public.payment_config;
DROP POLICY IF EXISTS "dalelak_config_select" ON public.payment_config;
DROP POLICY IF EXISTS "dalelak_config_update" ON public.payment_config;
DROP POLICY IF EXISTS "dalelak_config_all" ON public.payment_config;

CREATE POLICY "dalelak_config_select"
ON public.payment_config FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "dalelak_config_update"
ON public.payment_config FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "dalelak_config_all"
ON public.payment_config FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. 🖼️ Storage Objects Policies (Bucket: business-media)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DROP POLICY IF EXISTS "Public Access to business-media" ON storage.objects;
        DROP POLICY IF EXISTS "Allow uploads to business-media" ON storage.objects;
        DROP POLICY IF EXISTS "Allow updates to business-media" ON storage.objects;
        DROP POLICY IF EXISTS "Allow deletes to business-media" ON storage.objects;

        CREATE POLICY "Public Access to business-media" ON storage.objects
        FOR SELECT USING (bucket_id = 'business-media');

        CREATE POLICY "Allow uploads to business-media" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'business-media');

        CREATE POLICY "Allow updates to business-media" ON storage.objects
        FOR UPDATE USING (bucket_id = 'business-media');

        CREATE POLICY "Allow deletes to business-media" ON storage.objects
        FOR DELETE USING (bucket_id = 'business-media');
    END IF;
END $$;

COMMIT;

-- ------------------------------------------------------------------------------
-- ✅ Verification Query: Confirms all grants are active
-- ------------------------------------------------------------------------------
SELECT grantee, privilege_type, table_name 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, privilege_type;
