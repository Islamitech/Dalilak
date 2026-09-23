import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://xdqpbajymacpdccorjcj.supabase.co'
).trim();

export const SUPABASE_ANON_KEY: string = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x'
).trim();

export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project')
);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-application-name': 'dalelak-public-directory',
    },
  },
});

export const SUPABASE_BASE_URL: string = SUPABASE_URL.replace(/\/+$/, '');
export const SUPABASE_REST_BASE: string = `${SUPABASE_BASE_URL}/rest/v1`;
