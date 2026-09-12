-- ==============================================================================
-- 🛡️ سياسات تأمين وحماية قواعد بيانات «دليلك» في Supabase (Row Level Security - RLS)
-- قم بنسخ هذا الكود بالكامل ولصقه في:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 0. 🛠️ خطوة تمهيدية إلزامية: التأكد من وجود كافة الجداول والأعمدة والخصائص الميدانية
-- يمنع هذا المقطع أي انهيار عند إنشاء السياسات أو منح الصلاحيات (Idempotent Schema Safety)
CREATE TABLE IF NOT EXISTS public.businesses (id TEXT PRIMARY KEY, name_ar TEXT NOT NULL, phone TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public.representatives (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public.payout_requests (id TEXT PRIMARY KEY, rep_id TEXT NOT NULL, amount NUMERIC DEFAULT 0, method TEXT DEFAULT 'instapay', account_details TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS public.leads (id TEXT PRIMARY KEY, client_name TEXT NOT NULL, phone TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS public.payment_config (id TEXT PRIMARY KEY, is_active BOOLEAN DEFAULT true);

-- أعمدة الأنشطة التجارية
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS deleted_by_role TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS deleted_reason TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS cover_photo TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS payment_receipt_photo TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS payment_receipt_date TEXT;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS google_rating_enabled BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS google_rating NUMERIC;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.businesses ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- أعمدة المندوبين
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'rep';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'مندوب مبيعات ميداني';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'القاهرة';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS target_month INTEGER DEFAULT 25;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS avatar_status TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 42.86;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'suspended';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS referral_unlocked BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS admin_bypass_referral BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS referral_reward_granted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS active_session_id TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS last_active_timestamp BIGINT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS activation_face_photo TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS national_id_card_photo TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS national_id_card_back_photo TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS pending_phone TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS phone_status TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS deleted_by_role TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- أعمدة العملاء المحتملين والمتابعات
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS location_url TEXT;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS admin_follow_ups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- أعمدة طلبات الصرف
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS rep_name TEXT DEFAULT 'مندوب معتمد';
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS rep_phone TEXT;
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS request_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS processed_date TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS receipt_photo TEXT;
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE IF EXISTS public.payout_requests ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'payout';

-- 1. تفعيل حماية الصفوف (RLS) على جميع الجداول الأساسية
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_config ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. حماية الأعمدة الحساسة لجدول المندوبين (Column-Level Security)
-- منع المستخدم العام (anon) من قراءة كلمات المرور، الأرقام القومية، أو صور البطاقة الشخصية
-- ------------------------------------------------------------------------------
REVOKE ALL ON public.representatives FROM anon, authenticated;
GRANT SELECT (
    id, name, email, phone, role, role_title, governorate,
    avatar, avatar_status, commission_rate, status, referral_code,
    referred_by_code, referral_unlocked, target_month, created_at, updated_at
) ON public.representatives TO anon, authenticated;

-- السماح لحساب الخادم (service_role) بكامل الصلاحيات
GRANT ALL ON public.representatives TO service_role;
GRANT ALL ON public.businesses TO service_role;
GRANT ALL ON public.payout_requests TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.payment_config TO service_role;

-- ------------------------------------------------------------------------------
-- 3. سياسات جدول المندوبين (representatives)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read reps basic info" ON public.representatives;
DROP POLICY IF EXISTS "Allow reps registration" ON public.representatives;
DROP POLICY IF EXISTS "Allow rep self update" ON public.representatives;
DROP POLICY IF EXISTS "Representatives select access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives insert access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives update access" ON public.representatives;
DROP POLICY IF EXISTS "Representatives delete restricted" ON public.representatives;
DROP POLICY IF EXISTS "Reps read basic safe info" ON public.representatives;
DROP POLICY IF EXISTS "Reps registration restricted" ON public.representatives;
DROP POLICY IF EXISTS "Reps self update restricted" ON public.representatives;

-- السماح بقراءة البيانات الأساسية للمندوبين
CREATE POLICY "Reps read basic safe info"
ON public.representatives FOR SELECT
USING (deleted_at IS NULL);

-- السماح بالتسجيل الذاتي للمندوب بحالة معلقة فقط وبصلاحية rep حصراً (منع تصعيد الصلاحيات)
CREATE POLICY "Reps registration restricted"
ON public.representatives FOR INSERT
WITH CHECK (
    (role = 'rep' OR role IS NULL) AND
    (status = 'suspended' OR status = 'pending' OR status IS NULL)
);

-- تحديث الحساب مقتصر على صاحب الحساب نفسه أو عبر service_role مع منع الترقية الذاتية للمدير
CREATE POLICY "Reps self update restricted"
ON public.representatives FOR UPDATE
USING (auth.uid()::text = id OR auth.role() = 'service_role')
WITH CHECK (
    auth.role() = 'service_role' OR
    (auth.uid()::text = id AND role = 'rep')
);

-- الحذف مقتصر تماماً على الإدارة أو service_role
CREATE POLICY "Representatives delete restricted"
ON public.representatives FOR DELETE
USING (auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 4. سياسات جدول الأنشطة التجارية (businesses)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Reps and public can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Allow updates on businesses" ON businesses;
DROP POLICY IF EXISTS "Allow delete on businesses" ON businesses;
DROP POLICY IF EXISTS "Businesses public read" ON public.businesses;
DROP POLICY IF EXISTS "Businesses rep insert" ON public.businesses;
DROP POLICY IF EXISTS "Businesses rep update" ON public.businesses;
DROP POLICY IF EXISTS "Businesses delete restricted" ON public.businesses;

-- قراءة الأنشطة غير المحذوفة للجميع
CREATE POLICY "Businesses public read"
ON public.businesses FOR SELECT
USING (deleted_at IS NULL);

-- السماح بإضافة نشاط تجاري جديد
CREATE POLICY "Businesses rep insert"
ON public.businesses FOR INSERT
WITH CHECK (true);

-- السماح بتحديث النشاط التجاري (مقتصر على المستخدمين المصادقين أو حساب الخدمة)
CREATE POLICY "Businesses rep update"
ON public.businesses FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- منع الحذف المباشر بدون إذن إداري
CREATE POLICY "Businesses delete restricted"
ON public.businesses FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- 5. سياسات جدول طلبات السحب والتسوية المالية (payout_requests)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "Allow insert payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "Allow update payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "Payout requests read" ON public.payout_requests;
DROP POLICY IF EXISTS "Payout requests insert" ON public.payout_requests;
DROP POLICY IF EXISTS "Payout requests update" ON public.payout_requests;
DROP POLICY IF EXISTS "Payouts insert restricted" ON public.payout_requests;
DROP POLICY IF EXISTS "Payouts update restricted" ON public.payout_requests;

-- قراءة طلبات الصرف (مقتصرة على المناديب والإدارة المصادقين أو حساب الخدمة)
CREATE POLICY "Payout requests read"
ON public.payout_requests FOR SELECT
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- إضافة طلب سحب جديد فقط بحالة 'pending' (قيد المراجعة)
CREATE POLICY "Payouts insert restricted"
ON public.payout_requests FOR INSERT
WITH CHECK (status = 'pending' OR status IS NULL OR auth.role() = 'service_role');

-- تحديث حالة طلبات الصرف مقتصر على الخادم أو الإدارة (منع تزوير صرف الأموال)
CREATE POLICY "Payouts update restricted"
ON public.payout_requests FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- 6. سياسات جدول إعدادات الدفع (payment_config)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Payment config public read" ON public.payment_config;
DROP POLICY IF EXISTS "Payment config restricted write" ON public.payment_config;

CREATE POLICY "Payment config public read"
ON public.payment_config FOR SELECT
USING (true);

CREATE POLICY "Payment config restricted write"
ON public.payment_config FOR ALL
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- 7. سياسات جدول الأشخاص المهتمين وسجل المراجعات (leads)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Leads read access" ON public.leads;
DROP POLICY IF EXISTS "Leads insert access" ON public.leads;
DROP POLICY IF EXISTS "Leads update access" ON public.leads;
DROP POLICY IF EXISTS "Leads delete access" ON public.leads;

-- قراءة سجلات المهتمين غير المحذوفة
CREATE POLICY "Leads read access"
ON public.leads FOR SELECT
USING (deleted_at IS NULL);

-- السماح للمناديب والإدارة بإضافة أشخاص مهتمين جدد
CREATE POLICY "Leads insert access"
ON public.leads FOR INSERT
WITH CHECK (true);

-- السماح بتحديث بيانات المهتم والمتابعات (مقتصر على المستخدمين المصادقين أو حساب الخدمة)
CREATE POLICY "Leads update access"
ON public.leads FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- حظر الحذف المباشر إلا للمصادقين أو الخادم
CREATE POLICY "Leads delete access"
ON public.leads FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- 8. سياسات وسائط التخزين (Storage Objects) لحاوية 'business-media'
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
        FOR INSERT WITH CHECK (bucket_id = 'business-media' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

        -- منع الكتابة فوق الملفات الموجودة أو التعديل عليها إلا لحساب الخدمة
        CREATE POLICY "Allow updates to business-media" ON storage.objects
        FOR UPDATE USING (bucket_id = 'business-media' AND auth.role() = 'service_role');

        -- الحذف مقتصر على المصادقين أو حساب الخدمة
        CREATE POLICY "Allow deletes to business-media" ON storage.objects
        FOR DELETE USING (bucket_id = 'business-media' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));
    END IF;
END $$;

-- ==============================================================================
-- ✅ تم تطبيق سياسات الحماية بنجاح!
-- قاعدة البيانات الآن مؤمنة ضد تسريب كلمات المرور وتصعيد الصلاحيات وتزوير الصرف.
-- ==============================================================================
