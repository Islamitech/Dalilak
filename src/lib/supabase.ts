import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://xdqpbajymacpdccorjcj.supabase.co').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x').trim();

// 🛡️ تحذير أمني: يجب تعريف متغيرات البيئة في ملف .env بدلاً من الاعتماد على القيم الافتراضية المضمّنة
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[Dalelak Security] ⚠️ VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY غير محدد في متغيرات البيئة (.env).\n' +
    'يتم استخدام قيم افتراضية مضمّنة — هذا غير آمن في بيئة الإنتاج!\n' +
    'يرجى إنشاء ملف .env وتعريف:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}
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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
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
  const url = `${SUPABASE_REST_URL}${cleanEndpoint}`;
  
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, { ...options, headers });
  return response;
}
