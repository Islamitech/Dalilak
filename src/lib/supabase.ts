import { createClient } from '@supabase/supabase-js';

// 🛡️ Authoritative Supabase Cloud Configuration for production & Vercel deployments
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : (typeof process !== 'undefined' && process.env ? process.env : {});
const SUPABASE_URL = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://xdqpbajymacpdccorjcj.supabase.co').trim();
const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x').trim();
const SUPABASE_REST_URL = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/`;

export const isSupabaseConfigured = (): boolean => {
  const url = SUPABASE_URL || '';
  const key = SUPABASE_ANON_KEY || '';
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('placeholder') &&
    !url.includes('your-project')
  );
};

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_REST_URL };

const SENSITIVE_TABLES = ['representatives', 'payout_requests', 'leads', 'payment_config'];

function authToken(): string {
  try { return sessionStorage.getItem('dalelak_auth_token') || localStorage.getItem('dalelak_auth_token') || ''; } catch { return ''; }
}

async function guardedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const sourceRequest = input instanceof Request ? input : null;
  const method = String(init.method || sourceRequest?.method || 'GET').toUpperCase();
  const match = url.match(/\/rest\/v1\/(.*)$/);
  const endpoint = match?.[1] || '';
  const table = endpoint.split('?')[0];
  if (match && (method !== 'GET' || SENSITIVE_TABLES.includes(table))) {
    const token = authToken();
    const headers = new Headers(init.headers || sourceRequest?.headers);
    headers.delete('apikey');
    headers.set('Authorization', `Bearer ${token}`);
    const body = init.body ?? (sourceRequest && method !== 'GET' && method !== 'HEAD' ? await sourceRequest.clone().arrayBuffer() : undefined);
    return fetch(`/api/secure?endpoint=${encodeURIComponent(endpoint)}`, { ...init, method, headers, body });
  }
  return fetch(input, init);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: guardedFetch,
    headers: {
      apikey: SUPABASE_ANON_KEY,
    },
  },
});

/**
 * Direct REST API client for Supabase PostgREST
 */
export async function supabaseRestFetch(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const method = String(options.method || 'GET').toUpperCase();
  const table = cleanEndpoint.split('?')[0];
  const guarded = method !== 'GET' || SENSITIVE_TABLES.includes(table);
  const url = guarded ? `/api/secure?endpoint=${encodeURIComponent(cleanEndpoint)}` : `${SUPABASE_REST_URL}${cleanEndpoint}`;
  
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${guarded ? authToken() : SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers as Record<string, string> || {}),
  };

  if (guarded) delete headers.apikey;
  const response = await fetch(url, { ...options, method, headers });
  return response;
}
