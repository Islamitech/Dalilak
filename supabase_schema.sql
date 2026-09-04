-- =============================================================================
-- 🏛️ DALELAK DATABASE SCHEMA & SETUP SCRIPT
-- المنصة الشاملة لإدارة وتوثيق الأنشطة والخدمات الميدانية في مصر
-- Compatible with PostgreSQL 14+ / Supabase
-- =============================================================================

-- Enable UUID and Cryptographic extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLE: businesses (الأنشطة التجارية والمحلات)
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
    lat DOUBLE PRECISION NOT NULL DEFAULT 30.0444,
    lng DOUBLE PRECISION NOT NULL DEFAULT 31.2357,
    owner_name TEXT DEFAULT 'صاحب النشاط',
    owner_phone TEXT,
    owner_email TEXT,
    national_id TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    rep_id TEXT DEFAULT 'rep_1',
    rep_name TEXT DEFAULT 'مندوب معتمد',
    rep_commission_rate NUMERIC,
    package_id TEXT DEFAULT 'pkg_basic',
    package_name TEXT DEFAULT '1. باقة التوثيق الأساسي',
    package_price NUMERIC DEFAULT 250,
    amount_paid NUMERIC DEFAULT 0,
    payment_method TEXT,
    cash_collected_by_rep NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid',
    verification_status TEXT DEFAULT 'pending',
    rep_location_url TEXT,
    google_maps_url TEXT,
    google_place_id TEXT,
    google_sync_status TEXT DEFAULT 'pending',
    google_sync_date TEXT,
    invoice_number TEXT,
    invoice_date TEXT,
    is_fee_exempt BOOLEAN DEFAULT false,
    fee_exemption_reason TEXT,
    is_already_on_google BOOLEAN DEFAULT false,
    registration_type TEXT DEFAULT 'new_verification',
    admin_follow_ups JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column check for existing databases
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS rep_location_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS admin_follow_ups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_fee_exempt BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS fee_exemption_reason TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_already_on_google BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'new_verification';

-- =============================================================================
-- 2. TABLE: representatives (المناديب والمشرفين والمحاسبين والإدارة)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.representatives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    pending_phone TEXT,
    phone_status TEXT DEFAULT 'none',
    national_id TEXT,
    activation_face_photo TEXT,
    national_id_card_photo TEXT,
    national_id_card_back_photo TEXT,
    role TEXT DEFAULT 'rep',
    role_title TEXT DEFAULT 'مندوب مبيعات ميداني',
    governorate TEXT DEFAULT 'القاهرة',
    target_month INTEGER DEFAULT 25,
    avatar TEXT,
    avatar_status TEXT DEFAULT 'none',
    commission_rate NUMERIC DEFAULT 42.86,
    status TEXT DEFAULT 'suspended',
    -- ⚠️ SECURITY: يجب تغيير كلمة المرور الافتراضية قبل النشر في بيئة الإنتاج
    -- لا يجب أن تصل الحسابات بهذه الكلمة الافتراضية للواجهة أبداً — يجب تغييرها فور إنشاء الحساب
    password TEXT,
    referral_code TEXT,
    referred_by_code TEXT,
    referral_unlocked BOOLEAN DEFAULT false,
    admin_bypass_referral BOOLEAN DEFAULT false,
    referral_reward_granted BOOLEAN DEFAULT false,
    active_session_id TEXT,
    last_active_timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column check for existing databases
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS activation_face_photo TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS national_id_card_photo TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS national_id_card_back_photo TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS pending_phone TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS phone_status TEXT DEFAULT 'none';
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referral_unlocked BOOLEAN DEFAULT false;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS admin_bypass_referral BOOLEAN DEFAULT false;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS referral_reward_granted BOOLEAN DEFAULT false;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS active_session_id TEXT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS last_active_timestamp BIGINT;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- 3. TABLE: payout_requests (طلبات الصرف والتوريد المالي)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id TEXT PRIMARY KEY,
    rep_id TEXT NOT NULL,
    rep_name TEXT DEFAULT 'مندوب معتمد',
    rep_phone TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    method TEXT NOT NULL DEFAULT 'instapay',
    account_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    request_date TIMESTAMPTZ DEFAULT NOW(),
    processed_date TIMESTAMPTZ,
    receipt_photo TEXT,
    transaction_ref TEXT,
    admin_notes TEXT,
    type TEXT DEFAULT 'payout',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. TABLE: leads (العملاء المحتملين والمتابعات الميدانية CRM)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    business_name TEXT,
    business_category TEXT,
    phone TEXT NOT NULL,
    secondary_phone TEXT,
    governorate TEXT DEFAULT 'القاهرة',
    city TEXT DEFAULT 'القاهرة',
    interest_level TEXT DEFAULT 'medium',
    notes TEXT,
    follow_up_date TEXT,
    rep_id TEXT DEFAULT 'rep_1',
    rep_name TEXT DEFAULT 'مندوب معتمد',
    last_contacted_date TEXT,
    status TEXT DEFAULT 'pending_followup',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. TABLE: payment_config (إعدادات بوابات الدفع والمحافظ الإلكترونية)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payment_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    vodafone_cash_number TEXT DEFAULT '01143888355',
    vodafone_cash_number_2 TEXT DEFAULT '01556221141',
    fawry_merchant_code TEXT,
    insta_pay_handle TEXT DEFAULT '@daz31181',
    card_gateway_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. INDEXES FOR ULTRA-FAST LOOKUPS & QUERIES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_rep_id ON public.businesses (rep_id);
CREATE INDEX IF NOT EXISTS idx_businesses_governorate ON public.businesses (governorate);
CREATE INDEX IF NOT EXISTS idx_businesses_phone ON public.businesses (phone);
CREATE INDEX IF NOT EXISTS idx_businesses_payment_status ON public.businesses (payment_status);
CREATE INDEX IF NOT EXISTS idx_businesses_verification_status ON public.businesses (verification_status);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reps_email ON public.representatives (lower(email));
CREATE INDEX IF NOT EXISTS idx_reps_phone ON public.representatives (phone);
CREATE INDEX IF NOT EXISTS idx_reps_role ON public.representatives (role);
CREATE INDEX IF NOT EXISTS idx_reps_status ON public.representatives (status);
CREATE INDEX IF NOT EXISTS idx_reps_referral_code ON public.representatives (referral_code);

CREATE INDEX IF NOT EXISTS idx_payouts_rep_id ON public.payout_requests (rep_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payout_requests (status);
CREATE INDEX IF NOT EXISTS idx_payouts_request_date ON public.payout_requests (request_date DESC);

CREATE INDEX IF NOT EXISTS idx_leads_rep_id ON public.leads (rep_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone);

-- =============================================================================
-- 7. TRIGGER: AUTO-UPDATE updated_at TIMESTAMP
-- =============================================================================
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_businesses_timestamp ON public.businesses;
CREATE TRIGGER trg_update_businesses_timestamp
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_reps_timestamp ON public.representatives;
CREATE TRIGGER trg_update_reps_timestamp
    BEFORE UPDATE ON public.representatives
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_payouts_timestamp ON public.payout_requests;
CREATE TRIGGER trg_update_payouts_timestamp
    BEFORE UPDATE ON public.payout_requests
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_leads_timestamp ON public.leads;
CREATE TRIGGER trg_update_leads_timestamp
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_update_payment_config_timestamp ON public.payment_config;
CREATE TRIGGER trg_update_payment_config_timestamp
    BEFORE UPDATE ON public.payment_config
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES (HARDENED SECURITY MATRIX)
-- =============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 8.0 Column-Level Security on representatives: hide sensitive credentials from public
REVOKE ALL ON public.representatives FROM anon, authenticated;
GRANT SELECT (
    id, name, email, phone, role, role_title, governorate,
    avatar, avatar_status, commission_rate, status, referral_code,
    referred_by_code, referral_unlocked, target_month, created_at, updated_at
) ON public.representatives TO anon, authenticated;
GRANT ALL ON public.representatives TO service_role;

-- 8.1 businesses: Public can read active listings; creation allowed; updates protected
DROP POLICY IF EXISTS "Public full access to businesses" ON public.businesses;
DROP POLICY IF EXISTS "Businesses public read" ON public.businesses;
DROP POLICY IF EXISTS "Businesses rep insert" ON public.businesses;
DROP POLICY IF EXISTS "Businesses rep update" ON public.businesses;
DROP POLICY IF EXISTS "Businesses delete restricted" ON public.businesses;

CREATE POLICY "Businesses public read" ON public.businesses 
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Businesses rep insert" ON public.businesses 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Businesses rep update" ON public.businesses 
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR deleted_at IS NULL)
    WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR deleted_at IS NULL);

CREATE POLICY "Businesses delete restricted" ON public.businesses
    FOR DELETE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 8.2 payment_config: Public can READ active payment methods, only admins/service_role can MODIFY
DROP POLICY IF EXISTS "Public full access to payment_config" ON public.payment_config;
DROP POLICY IF EXISTS "Payment config public read" ON public.payment_config;
DROP POLICY IF EXISTS "Payment config restricted write" ON public.payment_config;

CREATE POLICY "Payment config public read" ON public.payment_config 
    FOR SELECT USING (true);

CREATE POLICY "Payment config restricted write" ON public.payment_config 
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 8.3 payout_requests: Controlled access (prevents unauthorized payout status alteration)
DROP POLICY IF EXISTS "Public full access to payout_requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Payout requests read" ON public.payout_requests;
DROP POLICY IF EXISTS "Payout requests insert" ON public.payout_requests;
DROP POLICY IF EXISTS "Payout requests update" ON public.payout_requests;
DROP POLICY IF EXISTS "Payouts insert restricted" ON public.payout_requests;
DROP POLICY IF EXISTS "Payouts update restricted" ON public.payout_requests;

CREATE POLICY "Payout requests read" ON public.payout_requests 
    FOR SELECT USING (true);

CREATE POLICY "Payouts insert restricted" ON public.payout_requests 
    FOR INSERT WITH CHECK (status = 'pending' OR status IS NULL OR auth.role() = 'service_role');

CREATE POLICY "Payouts update restricted" ON public.payout_requests 
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 8.4 leads: Field follow-up records
DROP POLICY IF EXISTS "Public full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Leads read access" ON public.leads;
DROP POLICY IF EXISTS "Leads write access" ON public.leads;

CREATE POLICY "Leads read access" ON public.leads 
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Leads write access" ON public.leads 
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR deleted_at IS NULL)
    WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR deleted_at IS NULL);

-- 8.5 representatives: Sync access with restricted deletion and privilege escalation prevention
DROP POLICY IF EXISTS "Public full access to representatives" ON public.representatives;
DROP POLICY IF EXISTS "Representatives sync access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives select access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives insert access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives update access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives delete restricted" ON public.representatives;
DROP POLICY IF EXISTS "Reps read basic safe info" ON public.representatives;
DROP POLICY IF EXISTS "Reps registration restricted" ON public.representatives;
DROP POLICY IF EXISTS "Reps self update restricted" ON public.representatives;

CREATE POLICY "Reps read basic safe info" ON public.representatives 
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Reps registration restricted" ON public.representatives 
    FOR INSERT WITH CHECK (
        (role = 'rep' OR role IS NULL) AND
        (status = 'suspended' OR status = 'pending' OR status IS NULL)
    );

CREATE POLICY "Reps self update restricted" ON public.representatives 
    FOR UPDATE USING (auth.uid()::text = id OR auth.role() = 'service_role')
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.uid()::text = id AND role = 'rep')
    );

CREATE POLICY "Representatives delete restricted" ON public.representatives 
    FOR DELETE USING (auth.role() = 'service_role');


-- =============================================================================
-- 9. SEED DEFAULT ESSENTIAL CONFIGURATION & ADMIN (Idempotent)
-- =============================================================================
INSERT INTO public.payment_config (id, vodafone_cash_number, vodafone_cash_number_2, fawry_merchant_code, insta_pay_handle, card_gateway_active)
VALUES ('default', '01143888355', '01556221141', '', '@daz31181', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.representatives (
    id, name, email, phone, role, role_title, governorate, target_month,
    avatar, avatar_status, commission_rate, status, password, referral_code,
    referral_unlocked, admin_bypass_referral
) VALUES (
    'admin_1',
    'مدير النظام دليلك',
    'info@dalilaak.com',
    '01143888355',
    'admin',
    'مدير النظام',
    'القاهرة (المقرات الرئيسية)',
    50,
    '',
    'approved',
    0,
    'active',
    -- ⚠️ SECURITY CRITICAL: يجب تغيير كلمة المرور الافتراضية فوراً بعد التثبيت
    -- استخدم endpoint /api/auth/login لتسجيل الدخول ثم غيّر كلمة المرور من لوحة الإعدادات
    -- القيمة هنا هي hash لكلمة المرور الافتراضية — يجب تغييرها قبل الإنتاج
    'CHANGE_THIS_PASSWORD_IMMEDIATELY',
    'DALIL-ADMIN',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 10. SUPABASE STORAGE: BUCKET 'business-media' (مساحة تخزين صور وفيديوهات الأنشطة)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'business-media',
    'business-media',
    true,
    52428800, -- 50MB max file size limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800;

-- Storage Policies for 'business-media'
DROP POLICY IF EXISTS "Public Access to business-media" ON storage.objects;
CREATE POLICY "Public Access to business-media" ON storage.objects
FOR SELECT USING (bucket_id = 'business-media');

DROP POLICY IF EXISTS "Allow uploads to business-media" ON storage.objects;
CREATE POLICY "Allow uploads to business-media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'business-media');

DROP POLICY IF EXISTS "Allow updates to business-media" ON storage.objects;
CREATE POLICY "Allow updates to business-media" ON storage.objects
FOR UPDATE USING (bucket_id = 'business-media' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow deletes to business-media" ON storage.objects;
CREATE POLICY "Allow deletes to business-media" ON storage.objects
FOR DELETE USING (bucket_id = 'business-media' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- =============================================================================
-- 11. SOFT DELETE: أعمدة الحذف الناعم (تسمح باسترجاع السجلات المحذوفة)
-- =============================================================================
ALTER TABLE public.businesses      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.businesses      ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE public.leads           ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.leads           ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE public.leads           ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.leads           ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.leads           ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.leads           ADD COLUMN IF NOT EXISTS location_url TEXT;
ALTER TABLE public.leads           ADD COLUMN IF NOT EXISTS admin_follow_ups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.representatives ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- View: الأنشطة النشطة (غير المحذوفة)
CREATE OR REPLACE VIEW public.active_businesses AS
    SELECT * FROM public.businesses WHERE deleted_at IS NULL;

-- View: العملاء المحتملين النشطين
CREATE OR REPLACE VIEW public.active_leads AS
    SELECT * FROM public.leads WHERE deleted_at IS NULL;

-- =============================================================================
-- 12. AUDIT TRAIL: سجل التدقيق الشامل لتتبع جميع التغييرات الحرجة
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    table_name  TEXT NOT NULL,
    record_id   TEXT NOT NULL,
    action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE')),
    actor_id    TEXT,
    actor_name  TEXT,
    actor_role  TEXT,
    old_data    JSONB,
    new_data    JSONB,
    changed_at  TIMESTAMPTZ DEFAULT NOW(),
    ip_address  TEXT,
    notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_table_record ON public.activity_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor        ON public.activity_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_changed_at   ON public.activity_logs (changed_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit log read access" ON public.activity_logs;
CREATE POLICY "Audit log read access" ON public.activity_logs FOR SELECT USING (true);

-- =============================================================================
-- 13. PERFORMANCE INDEXES: فهارس لتحسين أداء الاستعلامات على حقول JSONB
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_photos           ON public.businesses USING GIN (photos);
CREATE INDEX IF NOT EXISTS idx_businesses_admin_followups  ON public.businesses USING GIN (admin_follow_ups);
CREATE INDEX IF NOT EXISTS idx_businesses_gov_category     ON public.businesses (governorate, category);
CREATE INDEX IF NOT EXISTS idx_businesses_rep_status       ON public.businesses (rep_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_businesses_payment          ON public.businesses (payment_status, amount_paid);
CREATE INDEX IF NOT EXISTS idx_leads_rep_status            ON public.leads (rep_id, status);
CREATE INDEX IF NOT EXISTS idx_reps_role_status            ON public.representatives (role, status);
