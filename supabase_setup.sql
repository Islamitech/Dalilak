-- 1. إنشاء جدول الحسابات والموثقين (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'documenter', -- 'admin' أو 'documenter'
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء جدول المنشآت والأماكن الموثقة (places)
CREATE TABLE IF NOT EXISTS public.places (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  name_en TEXT,
  status TEXT DEFAULT 'مفتوح (شغال)',
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  custom_category TEXT,
  latitude TEXT NOT NULL,
  longitude TEXT NOT NULL,
  dms TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  street TEXT NOT NULL,
  landmark TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  google_email TEXT NOT NULL,
  work_from TEXT NOT NULL,
  work_to TEXT NOT NULL,
  holidays TEXT[] DEFAULT '{}',
  facade_image TEXT,
  internal_image TEXT,
  documenter_id TEXT,
  documenter_name TEXT NOT NULL,
  notes TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  total_amount NUMERIC DEFAULT 300,
  paid_amount NUMERIC DEFAULT 300,
  remaining_amount NUMERIC DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'مدفوعة بالكامل',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. تفعيل الأذونات والقراءة/الكتابة العامة بدون قيود للتبسيط
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.places DISABLE ROW LEVEL SECURITY;

-- 4. إدراج حساب المسؤول الرئيسي تلقائياً
INSERT INTO public.profiles (id, full_name, email, phone, role, password_hash)
VALUES ('admin-root-001', 'مدير النظام الرئيسي', 'admin@daleelak.com', '01000000000', 'admin', 'admin123')
ON CONFLICT (id) DO NOTHING;
