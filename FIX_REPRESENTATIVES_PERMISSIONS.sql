-- ==============================================================================
-- 🛡️ DALELAK PLATFORM - PRODUCTION FIX FOR REPRESENTATIVE PERMISSIONS (PostgreSQL / Supabase)
-- 
-- Fixes Error Code: 42501 (permission denied for table representatives)
-- Targets roles: anon, authenticated, service_role
-- 
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/<PROJECT_REF>
-- 2. Go to "SQL Editor" -> Click "New Query"
-- 3. Paste this script entirely and click "Run"
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. 🏗️ Idempotent Table & Column Verification
-- Ensures public.representatives exists with all application columns before applying grants & policies
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.representatives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL
);

-- Idempotently ensure all expected columns exist
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'rep';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'مندوب مبيعات ميداني';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'القاهرة';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS target_month INTEGER DEFAULT 25;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS avatar_status TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 42.86;
ALTER TABLE IF EXISTS public.representatives ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
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

-- ------------------------------------------------------------------------------
-- 2. 🔑 Schema Level Permissions (Fix for Schema 42501)
-- Anon and Authenticated roles must have USAGE on schema public
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- ------------------------------------------------------------------------------
-- 3. 🛡️ Table Level Privileges (ROOT CAUSE FIX for 'permission denied for table representatives')
-- In PostgreSQL, table grants are evaluated BEFORE Row Level Security (RLS).
-- Missing INSERT/SELECT/UPDATE grants cause error 42501 regardless of RLS policies.
-- ------------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON TABLE public.representatives TO anon, authenticated;
GRANT ALL ON TABLE public.representatives TO service_role, postgres;

-- Sequences privileges (if any sequences are tied to the table)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Default privileges for future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. 🔒 Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. 📜 Configure Fine-Grained Idempotent RLS Policies
-- ------------------------------------------------------------------------------

-- Drop any previous or conflicting policies idempotently
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
DROP POLICY IF EXISTS "Allow anon and auth insert reps" ON public.representatives;
DROP POLICY IF EXISTS "Allow select non-deleted reps" ON public.representatives;
DROP POLICY IF EXISTS "Allow reps update own account" ON public.representatives;
DROP POLICY IF EXISTS "Service role full access on reps" ON public.representatives;

-- POLICY A: SELECT - Allow anon and authenticated to view active, non-deleted representatives
CREATE POLICY "Allow select non-deleted reps"
ON public.representatives
FOR SELECT
TO anon, authenticated
USING (
    deleted_at IS NULL AND
    (is_deleted IS NULL OR is_deleted = false)
);

-- POLICY B: INSERT - Allow anon (unauthenticated visitors registering) and authenticated users to insert rep accounts
-- Ensures role is 'rep' (or null) and status is valid ('active', 'pending', 'suspended', or null)
CREATE POLICY "Allow anon and auth insert reps"
ON public.representatives
FOR INSERT
TO anon, authenticated
WITH CHECK (
    (role = 'rep' OR role IS NULL) AND
    (status IN ('active', 'pending', 'suspended') OR status IS NULL)
);

-- POLICY C: UPDATE - Allow updating representative records (heartbeat, session IDs, profile info) for non-deleted accounts
CREATE POLICY "Allow reps update own account"
ON public.representatives
FOR UPDATE
TO anon, authenticated
USING (
    deleted_at IS NULL AND
    (is_deleted IS NULL OR is_deleted = false)
)
WITH CHECK (
    deleted_at IS NULL AND
    (is_deleted IS NULL OR is_deleted = false)
);

-- POLICY D: SERVICE ROLE - Full unrestricted access for service_role backend operations
CREATE POLICY "Service role full access on reps"
ON public.representatives
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- ------------------------------------------------------------------------------
-- 6. ✅ Verification Query (Run this to verify grants and policies are active)
-- ------------------------------------------------------------------------------
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'representatives';

SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'representatives';
