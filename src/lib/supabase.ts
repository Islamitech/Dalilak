import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xdqpbajymacpdccorjcj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1/`;

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_REST_URL };

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
    },
  },
});

/**
 * Direct REST API client for Supabase
 */
export async function supabaseRestFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_REST_URL}${endpoint}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  return response;
}
