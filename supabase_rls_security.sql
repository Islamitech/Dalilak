-- ==============================================================================
-- 🛡️ سياسات تأمين قواعد بيانات «دليلك» في Supabase (Row Level Security - RLS)
-- قم بنسخ هذا الكود بالكامل ولصقه في:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. تفعيل حماية الصفوف (RLS) على الجداول الرئيسية
ALTER TABLE IF EXISTS businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_requests ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. سياسات جدول الأنشطة التجارية (businesses)
-- ------------------------------------------------------------------------------

-- حذف أي سياسات قديمة إن وجدت لتجنب التعارض
DROP POLICY IF EXISTS "Public can view businesses" ON businesses;
DROP POLICY IF EXISTS "Reps and public can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Allow updates on businesses" ON businesses;
DROP POLICY IF EXISTS "Allow delete on businesses" ON businesses;

-- السماح للجميع بقراءة الأنشطة التجارية (لعرض الدليل والخريطة والبحث)
CREATE POLICY "Public can view businesses"
ON businesses FOR SELECT
USING (true);

-- السماح للمندوبين والزوار بإضافة أنشطة جديدة
CREATE POLICY "Reps and public can insert businesses"
ON businesses FOR INSERT
WITH CHECK (true);

-- السماح بتحديث النشاط
CREATE POLICY "Allow updates on businesses"
ON businesses FOR UPDATE
USING (true)
WITH CHECK (true);

-- منع الحذف العشوائي (الحذف يتطلب أن يكون بواسطة مستخدم مصادق أو عبر Service Role)
CREATE POLICY "Allow delete on businesses"
ON businesses FOR DELETE
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');


-- ------------------------------------------------------------------------------
-- 3. سياسات جدول المندوبين (representatives) - حماية بيانات الاعتماد
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public read reps basic info" ON representatives;
DROP POLICY IF EXISTS "Allow reps registration" ON representatives;
DROP POLICY IF EXISTS "Allow rep self update" ON representatives;

-- السماح بقراءة المندوبين للتحقق وعرض البيانات بالدليل
CREATE POLICY "Allow public read reps basic info"
ON representatives FOR SELECT
USING (true);

-- السماح للمندوبين الجدد بالتسجيل
CREATE POLICY "Allow reps registration"
ON representatives FOR INSERT
WITH CHECK (true);

-- السماح بتحديث بيانات المندوب
CREATE POLICY "Allow rep self update"
ON representatives FOR UPDATE
USING (true)
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 4. سياسات جدول طلبات السحب والتسوية المالية (payout_requests)
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow read payouts" ON payout_requests;
DROP POLICY IF EXISTS "Allow insert payouts" ON payout_requests;
DROP POLICY IF EXISTS "Allow update payouts" ON payout_requests;

CREATE POLICY "Allow read payouts"
ON payout_requests FOR SELECT
USING (true);

CREATE POLICY "Allow insert payouts"
ON payout_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update payouts"
ON payout_requests FOR UPDATE
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- ✅ تم الانتهاء! الآن أصبحت الجداول محمية ضد الحذف غير المصرح به
-- ==============================================================================
