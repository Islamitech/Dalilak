import React, { useState } from 'react';
import { User, Representative } from '../../types';
import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
import { updateRepSessionInDb, saveRepToDb, updateRepInDb } from '../../services/db';
import { mapDbToRep } from '../../services/db/dbMappers';
import { hashPassword, verifyPassword, isPasswordHashed } from '../../utils/crypto';
import { safeSetLocalStorageItem, safeSetSessionItem, safeParseJson } from '../../utils/storage';
import { isRepAccountDeleted } from '../../utils/accountStatus';
import { Mail, KeyRound, Eye, EyeOff } from 'lucide-react';

export interface LoginFormProps {
  representatives: Representative[];
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  onError: (msg: string) => void;
  onClearError: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  representatives,
  onLoginSuccess,
  onClose,
  onError,
  onClearError,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Step 1: Server Authentication & Live Session Lock Verification
      let loggedInUser: User | null = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword, forceSession: true }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => ({}));
          if (res.ok && data && data.user) {
            loggedInUser = data.user;
            if (data.token) {
              safeSetLocalStorageItem('dalelak_auth_token', data.token);
              safeSetSessionItem('dalelak_auth_token', data.token);
            }
          } else if (res.status === 403) {
            onError(data.error || '⚠️ حسابك قيد المراجعة وبانتظار تفعيل مدير النظام المسؤول.');
            setIsLoading(false);
            return;
          } else if (res.status === 409) {
            onError(data.error || '⚠️ هذا الحساب مفتوح ونشط بالفعل على جهاز آخر حالياً.');
            setIsLoading(false);
            return;
          } else if (res.status === 401 && data.error && !data.error.includes('غير مسجل')) {
            onError(data.error);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        console.log('Server login unavailable, falling back to Supabase cloud...');
      }

      if (loggedInUser) {
        if (isRepAccountDeleted(loggedInUser)) {
          onError('⛔ هذا الحساب تم حذفه وإلغاء تنشيطه نهائياً من قِبل إدارة المنظومة. لا يمكن تسجيل الدخول به.');
          setIsLoading(false);
          return;
        }
        await updateRepSessionInDb(loggedInUser.id, loggedInUser.activeSessionId, loggedInUser.lastActiveTimestamp);
        onLoginSuccess(loggedInUser);
        if (onClose) onClose();
        setIsLoading(false);
        return;
      }

      // Step 2: Supabase Cloud Authentication (Authoritative fallback for Vercel / serverless deployments)
      let foundRep: Representative | null = null;
      const cleanPhoneDigits = cleanEmail.replace(/\D/g, '');
      const AUTH_SELECT = 'id,name,email,phone,password,role,role_title,governorate,target_month,avatar,avatar_status,commission_rate,status,referral_code,referred_by_code,referral_unlocked,active_session_id,last_active_timestamp,created_at';

      if (isSupabaseConfigured()) {
        // A. Primary direct email lookup if contains @
        if (cleanEmail.includes('@')) {
          try {
            const { data, error } = await supabase
              .from('representatives')
              .select(AUTH_SELECT)
              .ilike('email', cleanEmail)
              .limit(1);

            if (!error && data && data.length > 0) {
              foundRep = mapDbToRep(data[0]);
            }
          } catch (sdkErr) {
            console.warn('Supabase direct email lookup notice:', sdkErr);
          }
        }

        // B. Phone-based direct lookup if phone digits >= 8
        if (!foundRep && cleanPhoneDigits.length >= 8) {
          try {
            const { data, error } = await supabase
              .from('representatives')
              .select(AUTH_SELECT)
              .or(`phone.eq.${cleanEmail},phone.ilike.%${cleanPhoneDigits}%,phone.eq.${cleanPhoneDigits}`)
              .limit(1);

            if (!error && data && data.length > 0) {
              foundRep = mapDbToRep(data[0]);
            }
          } catch (sdkErr) {
            console.warn('Supabase direct phone lookup notice:', sdkErr);
          }
        }

        // C. Combined lookup by email, phone, or ID
        if (!foundRep) {
          try {
            const orQuery = cleanPhoneDigits.length >= 8
              ? `email.ilike.${cleanEmail},phone.eq.${cleanEmail},phone.ilike.%${cleanPhoneDigits}%,id.eq.${cleanEmail}`
              : `email.ilike.${cleanEmail},phone.eq.${cleanEmail},id.eq.${cleanEmail}`;

            const { data, error } = await supabase
              .from('representatives')
              .select(AUTH_SELECT)
              .or(orQuery)
              .limit(1);

            if (!error && data && data.length > 0) {
              foundRep = mapDbToRep(data[0]);
            } else {
              // Fallback to select=* if column selection encounters schema mismatch
              const fallback = await supabase
                .from('representatives')
                .select('*')
                .or(orQuery)
                .limit(1);
              if (!fallback.error && fallback.data && fallback.data.length > 0) {
                foundRep = mapDbToRep(fallback.data[0]);
              }
            }
          } catch (sdkErr) {
            console.warn('Supabase SDK lookup notice:', sdkErr);
          }
        }

        // D. Direct REST API lookup fallback
        if (!foundRep) {
          try {
            const restRes = await supabaseRestFetch(
              `representatives?select=${AUTH_SELECT}&or=(email.ilike.${encodeURIComponent(cleanEmail)},phone.eq.${encodeURIComponent(cleanEmail)},id.eq.${encodeURIComponent(cleanEmail)})&limit=1`
            );
            if (restRes.ok) {
              const restData = await restRes.json().catch(() => null);
              if (Array.isArray(restData) && restData.length > 0) {
                foundRep = mapDbToRep(restData[0]);
              }
            }
          } catch (restErr) {
            console.warn('Supabase REST lookup notice:', restErr);
          }
        }
      }

      // Fallback to local representatives list & cached reps if still not found
      if (!foundRep) {
        const normClean = cleanEmail.replace(/[^a-z0-9]/g, '');
        const allLocalSources: Representative[] = [
          ...representatives,
          ...(safeParseJson<Representative[]>(localStorage.getItem('dalelak_cached_reps'), []) || []),
          ...(safeParseJson<Representative[]>(localStorage.getItem('dalelak_custom_reps'), []) || []),
        ];

        foundRep = allLocalSources.find((r) => {
          const rEmail = (r.email || '').trim().toLowerCase();
          const normR = rEmail.replace(/[^a-z0-9]/g, '');
          const rPhone = (r.phone || '').replace(/\D/g, '');
          return (
            rEmail === cleanEmail ||
            normR === normClean ||
            (cleanPhoneDigits.length >= 8 && rPhone && (rPhone === cleanPhoneDigits || rPhone.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(rPhone))) ||
            r.id.toLowerCase() === cleanEmail
          );
        }) || null;
      }

      if (!foundRep) {
        onError(`⚠️ البريد الإلكتروني أو رقم الهاتف (${cleanEmail}) غير مسجل في قاعدة البيانات.`);
        setIsLoading(false);
        return;
      }

      // Security Check: Prevent login if account was deleted or blacklisted
      if (isRepAccountDeleted(foundRep)) {
        onError('⛔ هذا الحساب تم حذفه وإلغاء تنشيطه نهائياً من قِبل إدارة المنظومة. لا يمكن تسجيل الدخول به.');
        setIsLoading(false);
        return;
      }

      // Verify Password strictly (supports both SHA-256 and legacy formats)
      let storedPassword = (foundRep.password || '').trim();

      // Failsafe 2: Check local custom and cached reps
      if (!storedPassword) {
        try {
          const localCustom = safeParseJson<Representative[]>(localStorage.getItem('dalelak_custom_reps'), []);
          const matchCustom = localCustom.find((cr) => cr.id === foundRep!.id || (cr.email && cr.email.toLowerCase() === cleanEmail));
          if (matchCustom?.password) {
            storedPassword = matchCustom.password.trim();
            foundRep.password = storedPassword;
          }
        } catch {}
      }

      let isPassValid = false;

      if (storedPassword && storedPassword !== '••••••••') {
        isPassValid = await verifyPassword(cleanPassword, storedPassword);
      }

      if (!isPassValid) {
        onError('⚠️ كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور وإعادة المحاولة.');
        setIsLoading(false);
        return;
      }

      // Check account rejection status (only block if officially rejected with reasons)
      if (foundRep.avatarStatus === 'rejected') {
        const emailNotice = foundRep.email ? ` عبر البريد الإلكتروني (${foundRep.email})` : ' عبر البريد الإلكتروني';
        onError(`❌ تم رفض طلب تسجيل هذا الحساب من قِبل إدارة المنظومة. تم إرسال أسباب الرفض${emailNotice}، يرجى مراجعتها لمعرفة الأسباب.`);
        setIsLoading(false);
        return;
      }

      // 🚀 السماح لجميع الحسابات المسجلة بالدخول المباشر: تفعيل الحساب فورياً إذا كان قيد المراجعة أو معلقاً
      if (foundRep.status !== 'active') {
        foundRep.status = 'active';
        updateRepInDb(foundRep.id, { status: 'active' }).catch(() => {});
      }

      // Auto-upgrade legacy plaintext passwords to SHA-256 upon successful login
      if (!isPasswordHashed(storedPassword)) {
        try {
          const newHashed = await hashPassword(cleanPassword);
          foundRep.password = newHashed;
          saveRepToDb({ ...foundRep, password: newHashed }).catch(() => {});
        } catch {}
      }

      const now = Date.now();
      const newSessionId = `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
      foundRep.activeSessionId = newSessionId;
      foundRep.lastActiveTimestamp = now;

      await updateRepSessionInDb(foundRep.id, newSessionId, now);

      if (onClose) onClose();

      onLoginSuccess({
        id: foundRep.id,
        name: foundRep.name,
        email: foundRep.email,
        role: foundRep.role || 'rep',
        repData: foundRep,
        activeSessionId: newSessionId,
        lastActiveTimestamp: now,
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      onError('حدث خطأ أثناء التحقق من الجلسة، يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLoginSubmit} autoComplete="on" className="space-y-3 text-xs">
      <div>
        <label htmlFor="login_email" className="block text-[var(--text-primary)] font-extrabold mb-1">
          اسم المستخدم أو البريد الإلكتروني أو الهاتف:
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
          <input
            id="login_email"
            name="email"
            type="text"
            required
            autoComplete="username"
            placeholder="@daz31181 أو البريد أو الهاتف"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 font-mono shadow-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="login_password" className="block text-[var(--text-primary)] font-extrabold mb-1">
          كلمة المرور:
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
          <input
            id="login_password"
            name="password"
            type={showLoginPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="أدخل كلمة المرور..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-10 py-2.5 focus:outline-none focus:border-amber-500 font-mono shadow-sm"
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
            className="absolute left-3 top-2.5 text-[var(--text-muted)] hover:text-amber-500 transition-colors cursor-pointer p-0.5"
            title={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2 text-xs cursor-pointer"
      >
        {isLoading ? 'جاري التحقق من الحساب...' : 'الدخول إلى المنصة'}
      </button>
    </form>
  );
};
