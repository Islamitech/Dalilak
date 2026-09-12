import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const isSupabaseServiceConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project')
);

export const serviceSupabase = isSupabaseServiceConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const SUPABASE_REST_URL = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/`;

/**
 * Low-level REST helper for Supabase using the service_role key.
 * Bypasses RLS, so it must only be called from authenticated server endpoints.
 */
export async function serviceSupabaseRestFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!isSupabaseServiceConfigured) {
    return new Response('Supabase service role not configured', { status: 503 });
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${SUPABASE_REST_URL}${cleanEndpoint}`;
  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  return fetch(url, { ...options, headers });
}
