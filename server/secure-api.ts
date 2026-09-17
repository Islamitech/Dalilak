import crypto from 'crypto';
import { serviceSupabaseRestFetch } from './supabase.js';

type Session = { sub: string; role: string; email?: string; exp: number };
type ApiRequest = { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; body?: any };
type ApiResponse = { status: (code: number) => ApiResponse; setHeader: (name: string, value: string) => void; json: (body: any) => void; send: (body: any) => void; end: () => void };

const TABLES = new Set(['businesses', 'representatives', 'payout_requests', 'leads', 'payment_config']);
const PRIVILEGED = new Set(['admin', 'supervisor', 'accountant']);

function secret(): string {
  const value = (process.env.SESSION_SIGNING_SECRET || '').trim();
  if (value.length < 32) throw new Error('SESSION_SIGNING_SECRET must contain at least 32 characters');
  return value;
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signSession(session: Session): string {
  const payload = encode(session);
  const signature = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSession(req: ApiRequest): Session | null {
  const rawHeader = req.headers.authorization;
  const raw = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const token = raw?.replace(/^Bearer\s+/i, '') || '';
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
  return session.exp > Date.now() && session.sub ? session : null;
}

function passwordMatches(password: string, stored: string): boolean {
  const clean = password.trim();
  const saved = stored.trim();
  if (!clean || !saved) return false;
  let candidate = clean;
  if (saved.toLowerCase().startsWith('sha256:')) candidate = `sha256:${crypto.createHash('sha256').update(clean).digest('hex')}`;
  else if (/^[a-f0-9]{64}$/i.test(saved)) candidate = crypto.createHash('sha256').update(clean).digest('hex');
  else if (saved.startsWith('scrypt:')) {
    const [, salt, hash] = saved.split(':');
    if (!salt || !hash) return false;
    candidate = crypto.scryptSync(clean, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
  }
  const a = Buffer.from(candidate.toLowerCase());
  const b = Buffer.from(saved.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sanitizeRepresentative(row: any) {
  const { password, national_id, national_id_card_photo, national_id_card_back_photo, activation_face_photo, ...safe } = row || {};
  return {
    ...safe,
    roleTitle: safe.role_title,
    targetMonth: safe.target_month,
    avatarStatus: safe.avatar_status,
    commissionRate: safe.commission_rate,
    referralCode: safe.referral_code,
    referralUnlocked: safe.referral_unlocked,
    activeSessionId: safe.active_session_id,
    lastActiveTimestamp: safe.last_active_timestamp,
  };
}

async function login(req: ApiRequest, res: ApiResponse) {
  const identifier = String(req.body?.identifier || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!identifier || !password) return res.status(400).json({ error: 'بيانات الدخول غير مكتملة.' });
  const filter = identifier.includes('@')
    ? `email=ilike.${encodeURIComponent(identifier)}`
    : `or=(phone.eq.${encodeURIComponent(identifier)},id.eq.${encodeURIComponent(identifier)})`;
  const fields = 'id,name,email,phone,password,role,role_title,governorate,target_month,avatar,avatar_status,commission_rate,status,referral_code,referral_unlocked,active_session_id,last_active_timestamp,created_at,is_deleted';
  const upstream = await serviceSupabaseRestFetch(`representatives?select=${fields}&${filter}&limit=1`);
  const rows = upstream.ok ? await upstream.json() : [];
  const rep = Array.isArray(rows) ? rows[0] : null;
  if (!rep || !passwordMatches(password, String(rep.password || ''))) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  if (rep.is_deleted || rep.status !== 'active' || rep.avatar_status === 'pending_approval' || rep.avatar_status === 'rejected') {
    return res.status(403).json({ error: 'الحساب غير نشط أو ما زال قيد المراجعة.' });
  }
  const now = Date.now();
  const sessionId = `sess_${crypto.randomUUID()}`;
  const role = String(rep.role || 'rep');
  const token = signSession({ sub: String(rep.id), role, email: rep.email, exp: now + 8 * 60 * 60 * 1000 });
  await serviceSupabaseRestFetch(`representatives?id=eq.${encodeURIComponent(rep.id)}`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ active_session_id: sessionId, last_active_timestamp: now }),
  });
  return res.status(200).json({ token, user: { id: rep.id, name: rep.name, email: rep.email, phone: rep.phone, role, repData: sanitizeRepresentative(rep), activeSessionId: sessionId, lastActiveTimestamp: now } });
}

function tableFrom(endpoint: string): string {
  return endpoint.split('?')[0].replace(/^\/+/, '');
}

export default async function secureApi(req: ApiRequest, res: ApiResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.status(204).end();
    const url = new URL(req.url || '/', 'http://local');
    if (url.searchParams.get('action') === 'login') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      return await login(req, res);
    }
    const endpoint = url.searchParams.get('endpoint') || '';
    const table = tableFrom(endpoint);
    if (!TABLES.has(table)) return res.status(400).json({ error: 'Resource not allowed' });
    const method = String(req.method || 'GET').toUpperCase();
    const session = readSession(req);
    if (!session && table === 'representatives' && method === 'POST') {
      const requested = req.body && typeof req.body === 'object' ? req.body : {};
      const registration = { ...requested, role: 'rep', status: 'suspended', avatar_status: 'pending_approval', active_session_id: null };
      const upstream = await serviceSupabaseRestFetch(endpoint, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(registration) });
      const payload = await upstream.json().catch(() => null);
      const safePayload = Array.isArray(payload) ? payload.map(sanitizeRepresentative) : payload;
      return res.status(upstream.status).json(safePayload);
    }
    if (!session) return res.status(401).json({ error: 'جلسة غير صالحة أو منتهية.' });
    const privileged = PRIVILEGED.has(session.role);
    if (!privileged && table === 'payment_config' && method !== 'GET') return res.status(403).json({ error: 'Forbidden' });
    let scopedEndpoint = endpoint;
    if (!privileged && table === 'representatives') scopedEndpoint += `${endpoint.includes('?') ? '&' : '?'}id=eq.${encodeURIComponent(session.sub)}`;
    if (!privileged && ['businesses', 'leads', 'payout_requests'].includes(table)) scopedEndpoint += `${endpoint.includes('?') ? '&' : '?'}rep_id=eq.${encodeURIComponent(session.sub)}`;
    let body = req.body;
    if (!privileged && body && ['businesses', 'leads', 'payout_requests'].includes(table)) {
      const attachOwner = (item: any) => ({ ...(item || {}), rep_id: session.sub });
      body = Array.isArray(body) ? body.map(attachOwner) : attachOwner(body);
    }
    const headers: Record<string, string> = {};
    for (const name of ['prefer', 'range', 'range-unit']) {
      const value = req.headers[name];
      if (typeof value === 'string') headers[name] = value;
    }
    const upstream = await serviceSupabaseRestFetch(scopedEndpoint, { method, headers, body: body == null ? undefined : JSON.stringify(body) });
    for (const name of ['content-range', 'range-unit', 'content-type']) {
      const value = upstream.headers.get(name); if (value) res.setHeader(name, value);
    }
    const text = await upstream.text();
    if (table === 'representatives' && text) {
      try {
        const payload = JSON.parse(text);
        const safePayload = Array.isArray(payload) ? payload.map(sanitizeRepresentative) : sanitizeRepresentative(payload);
        return res.status(upstream.status).json(safePayload);
      } catch {}
    }
    return res.status(upstream.status).send(text || undefined);
  } catch (error) {
    console.error('[secure-api]', error);
    return res.status(500).json({ error: 'تعذر تنفيذ الطلب الآمن.' });
  }
}
