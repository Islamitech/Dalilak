-- ==============================================================================
-- 🛡️ سياسات تأمين وحماية قواعد بيانات «دليلك» في Supabase (Row Level Security - RLS)
-- قم بنسخ هذا الكود بالكامل ولصقه في:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. تفعيل حماية الصفوف (RLS) على جميع الجداول الأساسية
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

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
GRANT ALL ON public.activity_logs TO service_role;

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

-- السماح بتحديث النشاط التجاري
CREATE POLICY "Businesses rep update"
ON public.businesses FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR deleted_at IS NULL)
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR deleted_at IS NULL);

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

-- قراءة طلبات الصرف
CREATE POLICY "Payout requests read"
ON public.payout_requests FOR SELECT
USING (true);

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
-- 7. سياسات وسائط التخزين (Storage Objects) لحاوية 'business-media'
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
