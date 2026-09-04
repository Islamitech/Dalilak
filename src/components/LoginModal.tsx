import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Representative } from '../types';
import { EGYPT_GOVERNORATES } from '../data/mockData';
import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../lib/supabase';
import { updateRepSessionInDb, fetchRepsFromDb, saveRepToDb } from '../services/db';
import { mapDbToRep } from '../services/db/dbMappers';
import { compressImageFile } from '../utils/imageCompressor';
import { getRepReferralCode } from '../utils/referral';
import { hashPassword, verifyPassword, isPasswordHashed } from '../utils/crypto';
import { safeSetLocalStorageItem, safeSetSessionItem } from '../utils/storage';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Lock, 
  UploadCloud, 
  Trash2, 
  Eye, 
  User as UserIcon,
  FileCheck
} from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  representatives: Representative[];
  onAddRepresentative?: (newRep: Representative) => void;
  isInline?: boolean;
  onOpenAbout?: () => void;
  onOpenTerms?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLoginSuccess,
  representatives,
  onAddRepresentative,
  isInline = false,
  onOpenAbout,
  onOpenTerms,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<boolean>(false);

  // Login form state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regNationalId, setRegNationalId] = useState<string>('');
  const [regGovernorate, setRegGovernorate] = useState<string>('القاهرة');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regReferralCode, setRegReferralCode] = useState<string>('');
  
  // Mandatory identity uploads:
  // 1. Clear face photo without filters
  // 2. National ID Card Front
  // 3. National ID Card Back
  const [regAvatar, setRegAvatar] = useState<string>('');
  const [regNationalIdCardPhoto, setRegNationalIdCardPhoto] = useState<string>('');
  const [regNationalIdCardBackPhoto, setRegNationalIdCardBackPhoto] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Image Upload Handlers with lightweight high-res compression
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.8, { applyWatermark: false });
        setRegAvatar(compressed);
      } catch (err) {
        console.warn('Face photo compression error:', err);
      }
    }
  };

  const handleIdFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1200, 1200, 0.85, { applyWatermark: false });
        setRegNationalIdCardPhoto(compressed);
      } catch (err) {
        console.warn('National ID Front compression error:', err);
      }
    }
  };

  const handleIdBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1200, 1200, 0.85, { applyWatermark: false });
        setRegNationalIdCardBackPhoto(compressed);
      } catch (err) {
        console.warn('National ID Back compression error:', err);
      }
    }
  };

  // 1. HANDLE LOGIN SUBMISSION WITH STRICT SINGLE-SESSION PROTECTION
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
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
            setErrorMsg(data.error || '⚠️ حسابك قيد المراجعة وبانتظار تفعيل مدير النظام المسؤول.');
            setIsLoading(false);
            return;
          } else if (res.status === 409) {
            setErrorMsg(data.error || '⚠️ هذا الحساب مفتوح ونشط بالفعل على جهاز آخر حالياً.');
            setIsLoading(false);
            return;
          } else if (res.status === 401 && data.error && !data.error.includes('غير مسجل')) {
            setErrorMsg(data.error);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        console.log('Server login unavailable, falling back to Supabase cloud...');
      }

      if (loggedInUser) {
        await updateRepSessionInDb(loggedInUser.id, loggedInUser.activeSessionId, loggedInUser.lastActiveTimestamp);
        onLoginSuccess(loggedInUser);
        if (onClose) onClose();
        setIsLoading(false);
        return;
      }

      // Step 2: Supabase Cloud Authentication (Authoritative fallback for Vercel / serverless deployments)
      let foundRep: Representative | null = null;
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('representatives')
            .select('*')
            .or(`email.ilike.${cleanEmail},phone.eq.${cleanEmail},id.eq.${cleanEmail}`)
            .limit(1);

          if (!error && data && data.length > 0) {
            foundRep = mapDbToRep(data[0]);
          }
        } catch (sdkErr) {
          console.warn('Supabase SDK lookup failed:', sdkErr);
        }

        if (!foundRep) {
          try {
            const restRes = await supabaseRestFetch(
              `representatives?select=*&or=(email.ilike.${encodeURIComponent(cleanEmail)},phone.eq.${encodeURIComponent(cleanEmail)},id.eq.${encodeURIComponent(cleanEmail)})&limit=1`
            );
            if (restRes.ok) {
              const restData = await restRes.json();
              if (Array.isArray(restData) && restData.length > 0) {
                foundRep = mapDbToRep(restData[0]);
              }
            }
          } catch (restErr) {
            console.warn('Supabase REST lookup failed:', restErr);
          }
        }
      }

      // Fallback to local representatives list if still not found
      if (!foundRep) {
        const cleanPhone = cleanEmail.replace(/\D/g, '');
        const normClean = cleanEmail.replace(/[^a-z0-9]/g, '');
        foundRep = representatives.find((r) => {
          const rEmail = (r.email || '').trim().toLowerCase();
          const normR = rEmail.replace(/[^a-z0-9]/g, '');
          const rPhone = (r.phone || '').replace(/\D/g, '');
          return (
            rEmail === cleanEmail ||
            normR === normClean ||
            (cleanPhone.length >= 8 && rPhone && (rPhone === cleanPhone || rPhone.endsWith(cleanPhone) || cleanPhone.endsWith(rPhone))) ||
            r.id.toLowerCase() === cleanEmail
          );
        }) || null;
      }

      if (!foundRep) {
        setErrorMsg(`⚠️ البريد الإلكتروني أو رقم الهاتف (${cleanEmail}) غير مسجل في قاعدة البيانات.`);
        setIsLoading(false);
        return;
      }

      // Verify Password strictly (supports both SHA-256 and legacy formats)
      const storedPassword = (foundRep.password || '').trim();
      let isPassValid = false;

      if (storedPassword && storedPassword !== '••••••••') {
        isPassValid = await verifyPassword(cleanPassword, storedPassword);
      }

      if (!isPassValid) {
        setErrorMsg('⚠️ كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور وإعادة المحاولة.');
        setIsLoading(false);
        return;
      }

      // Check account review / suspension status
      if (foundRep.status !== 'active') {
        if (foundRep.avatarStatus === 'rejected') {
          const emailNotice = foundRep.email ? ` عبر البريد الإلكتروني (${foundRep.email})` : ' عبر البريد الإلكتروني';
          setErrorMsg(`❌ تم رفض طلب تسجيل هذا الحساب من قِبل إدارة المنظومة. تم إرسال أسباب الرفض${emailNotice}، يرجى مراجعتها لمعرفة الأسباب.`);
        } else {
          setErrorMsg(`⏳ حسابك (${foundRep.name}) مسجل بنجاح وهو حالياً "قيد مراجعة وتدقيق المستندات" من قبل الإدارة. يرجى الانتظار حتى يقوم مدير المنظومة باعتماد وتفعيل الحساب.`);
        }
        setIsLoading(false);
        return;
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
      return;
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('حدث خطأ أثناء التحقق من الجلسة، يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  // 2. HANDLE REGISTER SUBMISSION
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName || regName.trim().length < 5) {
      setErrorMsg('برجاء إدخال الاسم كاملاً (ثلاثي على الأقل).');
      return;
    }

    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phoneRegex.test(regPhone)) {
      setErrorMsg('رقم المحمول غير صحيح! يجب أن يتكون من 11 رقم مصري يبدأ بـ 01.');
      return;
    }

    const nationalIdRegex = /^\d{14}$/;
    if (!nationalIdRegex.test(regNationalId)) {
      setErrorMsg('الرقم القومي غير صحيح! يجب أن يتكون من 14 رقم قومي مصري.');
      return;
    }

    // MANDATORY IDENTITY CHECKS: Face photo without filters + National ID card Front & Back
    if (!regAvatar || regAvatar.trim().length === 0) {
      setErrorMsg('⚠️ يرجى إدراج صورة شخصية واضحة للوجه بدون فلاتر لإتمام التسجيل.');
      return;
    }

    if (!regNationalIdCardPhoto || regNationalIdCardPhoto.trim().length === 0) {
      setErrorMsg('⚠️ يرجى إدراج صورة الوجه الأمامي لبطاقة الرقم القومي.');
      return;
    }

    if (!regNationalIdCardBackPhoto || regNationalIdCardBackPhoto.trim().length === 0) {
      setErrorMsg('⚠️ يرجى إدراج صورة الظهر الخلفي لبطاقة الرقم القومي.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('كلمات المرور غير متطابقة، يرجى التأكد وإعادة المحاولة.');
      return;
    }

    const cleanRegEmail = regEmail.trim().toLowerCase();

    // 1. Local duplicate check (Email, Phone, National ID)
    const duplicateEmail = representatives.some(
      (r) => r.email.trim().toLowerCase() === cleanRegEmail
    );
    if (duplicateEmail) {
      setErrorMsg(`⚠️ البريد الإلكتروني (${cleanRegEmail}) مسجل مسبقاً في المنظومة. يمكنك التوجه لتبويب "تسجيل الدخول" أو استخدام بريد إلكتروني آخر.`);
      return;
    }

    const cleanPhoneDigits = regPhone.replace(/\D/g, '');
    const duplicatePhone = representatives.some(
      (r) => (r.phone || '').replace(/\D/g, '') === cleanPhoneDigits
    );
    if (duplicatePhone) {
      setErrorMsg(`⚠️ رقم الهاتف (${regPhone}) مسجل مسبقاً لحساب آخر في المنظومة.`);
      return;
    }

    const duplicateNationalId = representatives.some(
      (r) => (r.nationalId || '').trim() === regNationalId.trim()
    );
    if (duplicateNationalId) {
      setErrorMsg(`⚠️ الرقم القومي (${regNationalId}) مسجل مسبقاً لحساب آخر في المنظومة.`);
      return;
    }

    setIsLoading(true);

    // 2. Supabase DB Async Query check
    try {
      const { data: dbCheck } = await supabase
        .from('representatives')
        .select('email')
        .eq('email', cleanRegEmail);

      if (dbCheck && dbCheck.length > 0) {
        setErrorMsg(`⚠️ البريد الإلكتروني (${cleanRegEmail}) مسجل مسبقاً في قاعدة البيانات. يمكنك التوجه لتبويب "تسجيل الدخول" أو استخدام بريد إلكتروني آخر.`);
        setIsLoading(false);
        return;
      }
    } catch (dbErr) {
      console.log('Supabase duplicate check notice:', dbErr);
    }

    const timestamp = Date.now();
    const cleanReferral = regReferralCode.trim().toUpperCase();
    const ownCode = `DALIL-${timestamp.toString().slice(-4)}`;

    // Smart referral resolver: supports DALIL-XXXX codes, 4-digit codes (8355), emails, and phone numbers
    let resolvedReferredByCode: string | undefined = undefined;
    if (cleanReferral) {
      const cleanRefNorm = cleanReferral.replace(/[^A-Z0-9]/g, '');
      const refDigits = cleanReferral.replace(/\D/g, '').slice(-4);

      let matchRep = representatives.find((r) => {
        const rCode = getRepReferralCode(r).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rCustom = (r.referralCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rDigits = (r.referralCode || '').replace(/\D/g, '').slice(-4) || (r.phone || '').replace(/\D/g, '').slice(-4);
        const rPhone = (r.phone || '').replace(/\D/g, '');
        const rEmail = (r.email || '').trim().toLowerCase();

        return (
          rCode === cleanRefNorm ||
          (rCustom && rCustom === cleanRefNorm) ||
          (rDigits && refDigits && rDigits === refDigits) ||
          (rPhone && (rPhone === cleanReferral.replace(/\D/g, '') || rPhone.endsWith(cleanReferral.replace(/\D/g, '')))) ||
          rEmail === cleanReferral.toLowerCase() ||
          r.id.toLowerCase() === cleanReferral.toLowerCase()
        );
      });

      if (!matchRep) {
        try {
          const freshReps = await fetchRepsFromDb();
          matchRep = freshReps.find((r) => {
            const rCode = getRepReferralCode(r).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const rCustom = (r.referralCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const rDigits = (r.referralCode || '').replace(/\D/g, '').slice(-4) || (r.phone || '').replace(/\D/g, '').slice(-4);
            const rPhone = (r.phone || '').replace(/\D/g, '');
            const rEmail = (r.email || '').trim().toLowerCase();

            return (
              rCode === cleanRefNorm ||
              (rCustom && rCustom === cleanRefNorm) ||
              (rDigits && refDigits && rDigits === refDigits) ||
              (rPhone && (rPhone === cleanReferral.replace(/\D/g, '') || rPhone.endsWith(cleanReferral.replace(/\D/g, '')))) ||
              rEmail === cleanReferral.toLowerCase() ||
              r.id.toLowerCase() === cleanReferral.toLowerCase()
            );
          });
        } catch {}
      }

      if (matchRep) {
        resolvedReferredByCode = getRepReferralCode(matchRep);
      } else {
        resolvedReferredByCode = cleanReferral.startsWith('DALIL-')
          ? cleanReferral
          : (refDigits ? `DALIL-${refDigits}` : cleanReferral);
      }
    }

    const newRepData: Representative = {
      id: `rep_${timestamp}`,
      name: regName.trim(),
      email: cleanRegEmail,
      phone: regPhone,
      nationalId: regNationalId,
      activationFacePhoto: regAvatar, // محفوظة في سجلات مدير التطبيق فقط للتحقق والتفعيل
      nationalIdCardPhoto: regNationalIdCardPhoto, // محفوظة في سجلات مدير التطبيق فقط
      nationalIdCardBackPhoto: regNationalIdCardBackPhoto, // محفوظة في سجلات مدير التطبيق فقط
      role: 'rep',
      roleTitle: 'مندوب مبيعات ميداني',
      governorate: regGovernorate,
      targetMonth: 25,
      avatar: '', // صورة التسجيل لا توضع كصورة للملف الشخصي
      avatarStatus: 'none',
      commissionRate: 42.86,
      status: 'suspended', // New accounts are suspended until admin activates
      password: await hashPassword(regPassword),
      referralCode: ownCode,
      referredByCode: resolvedReferredByCode,
      referralUnlocked: false,
    };

    // Save directly to Supabase Database immediately so Admin sees it across all sessions
    await saveRepToDb(newRepData);

    if (onAddRepresentative) {
      onAddRepresentative(newRepData);
    }

    setIsLoading(false);
    setRegSuccessNotice(true);
    setTimeout(() => {
      setRegSuccessNotice(false);
      setActiveTab('login');
    }, 5000);
  };

  // Helper render function for compact, streamlined upload items
  const renderCompactUploadRow = (
    label: string,
    badgeText: string,
    photoData: string,
    onChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemoveHandler: () => void,
    icon: React.ReactNode,
    helpText: string
  ) => {
    return (
      <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/40 transition-all flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {photoData ? (
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-500/80 shadow-xs shrink-0 group">
              <img src={photoData} alt={label} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPreviewImage({ url: photoData, title: label })}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                title="معاينة"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs text-[var(--text-primary)] truncate">{label}</span>
              <span className="text-[9px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-md">
                {badgeText}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{helpText}</p>
          </div>
        </div>

        {photoData ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewImage({ url: photoData, title: label })}
              className="p-1.5 rounded-lg bg-[var(--input-bg)] text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 cursor-pointer transition-colors"
              title="معاينة"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemoveHandler}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 cursor-pointer transition-colors"
              title="حذف وتغيير"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[11px] py-1.5 px-3 rounded-xl cursor-pointer shadow-xs flex items-center gap-1 transition-transform active:scale-95 shrink-0">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>إدراج</span>
            <input type="file" accept="image/*" onChange={onChangeHandler} className="hidden" />
          </label>
        )}
      </div>
    );
  };

  const modalBox = (
    <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3.5 text-[var(--text-primary)] relative my-auto transition-colors duration-300 modal-content max-h-[92vh] overflow-y-auto">
      {!isInline && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer z-10"
        >
          ✕
        </button>
      )}

      {/* Logo Branding Header */}
      <div className="text-center space-y-1 pt-0.5">
        <Logo size="md" showSubtitle={false} className="justify-center" />
      </div>

      {/* Tab Switcher: Login vs Register */}
      <div className="grid grid-cols-2 gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] text-xs font-bold shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setErrorMsg('');
          }}
          className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'login'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow font-black'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>تسجيل الدخول</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setErrorMsg('');
          }}
          className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'register'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow font-black'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>إنشاء حساب جديد</span>
        </button>
      </div>

      {/* Notification Messages */}
      {errorMsg && (
        <div className="bg-[var(--alert-error-bg)] border-2 border-[var(--alert-error-border)] text-[var(--alert-error-text)] p-3 rounded-xl text-xs flex items-start gap-2.5 font-extrabold leading-relaxed shadow-lg animate-fade-in-up">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {regSuccessNotice && (
        <div className="bg-[var(--alert-success-bg)] border-2 border-[var(--alert-success-border)] text-[var(--alert-success-text)] p-3 rounded-xl text-xs flex items-start gap-2.5 font-extrabold leading-relaxed shadow-lg animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>✅ تم تقديم طلب تسجيل الحساب وإرفاق المستندات بنجاح! حسابك قيد مراجعة وتدقيق الإدارة، وسيتم تفعيله بعد التحقق من وثائق الهوية الرسمية.</span>
        </div>
      )}

      {/* 1. LOGIN FORM */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit} autoComplete="on" className="space-y-3 text-xs">
          <div>
            <label htmlFor="login_email" className="block text-[var(--text-primary)] font-extrabold mb-1">اسم المستخدم أو البريد الإلكتروني أو الهاتف:</label>
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
            <label htmlFor="login_password" className="block text-[var(--text-primary)] font-extrabold mb-1">كلمة المرور:</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              <input
                id="login_password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 font-mono shadow-sm"
              />
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
      )}

      {/* 2. REGISTER NEW ACCOUNT FORM */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[var(--text-primary)] font-extrabold mb-1">الاسم بالكامل *</label>
            <input
              type="text"
              required
              placeholder="أدخل اسمك ثلاثي على الأقل..."
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                placeholder="user@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">رقم المحمول (11 رقم) *</label>
              <input
                type="tel"
                required
                placeholder="01012345678"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">الرقم القومي (14 رقم) *</label>
              <input
                type="text"
                required
                maxLength={14}
                placeholder="29805120104892"
                value={regNationalId}
                onChange={(e) => setRegNationalId(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">المحافظة *</label>
              <select
                value={regGovernorate}
                onChange={(e) => setRegGovernorate(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Referral / Invitation Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[var(--text-primary)] font-extrabold">كود الدعوة / الإحالة (اختياري)</label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">إذا تمت دعوتك من مندوب معتمد</span>
            </div>
            <input
              type="text"
              placeholder="مثال: DALIL-7711"
              value={regReferralCode}
              onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 uppercase shadow-sm placeholder:text-slate-400"
            />
          </div>

          {/* ========================================================
              COMPACT & STREAMLINED IDENTITY ATTACHMENTS (3 Uploads)
              ======================================================== */}
          <div className="bg-[var(--bg-surface)]/70 border border-[var(--border-color)] rounded-2xl p-3 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
              <span className="font-black text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                <span>مستندات التحقق والتفعيل (لسجلات مدير المنظومة فقط) *</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold">
                {[regAvatar, regNationalIdCardPhoto, regNationalIdCardBackPhoto].filter(Boolean).length}/3 مكتمل
              </span>
            </div>

            {/* Upload Row 1: Face Verification Photo (For Admin Records Only) */}
            {renderCompactUploadRow(
              'صورة الوجه للتفعيل',
              'سجلات الإدارة فقط',
              regAvatar,
              handleAvatarUpload,
              () => setRegAvatar(''),
              <UserIcon className="w-5 h-5" />,
              'صورة واضحة للوجه بدون فلاتر لتدقيق وتفعيل الحساب بواسطة الإدارة'
            )}

            {/* Upload Row 2: National ID Front */}
            {renderCompactUploadRow(
              'بطاقة الرقم القومي',
              'الوجه الأمامي',
              regNationalIdCardPhoto,
              handleIdFrontUpload,
              () => setRegNationalIdCardPhoto(''),
              <CreditCard className="w-5 h-5" />,
              'صورة واضحة للوجه الأمامي للبطاقة'
            )}

            {/* Upload Row 3: National ID Back */}
            {renderCompactUploadRow(
              'بطاقة الرقم القومي',
              'الظهر الخلفي',
              regNationalIdCardBackPhoto,
              handleIdBackUpload,
              () => setRegNationalIdCardBackPhoto(''),
              <ShieldCheck className="w-5 h-5" />,
              'صورة واضحة للظهر الخلفي للبطاقة'
            )}

            {/* Security & Privacy Reassurance Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-[10px] sm:text-[11px] text-blue-900 dark:text-blue-300 font-bold flex items-start gap-2 leading-relaxed">
              <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>خصوصيتك وأمان بياناتك أولويتنا:</strong> كافة المستندات الشخصية مشفرة ومحفوظة بسرية تامة، ولن تظهر أو تُنشر في أي مكان عام؛ استخدامها مقتصر حصراً على التحقق الإداري والاعتماد الرسمي للمندوب.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">كلمة المرور *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">تأكيد كلمة المرور *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 text-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري التحقق وإنشاء الحساب...' : 'إرسال طلب إنشاء الحساب والوثائق'}
          </button>
        </form>
      )}


      {/* Image Preview Modal */}
      {previewImage &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative max-w-xl w-full text-center space-y-2">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 left-0 bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black cursor-pointer"
              >
                ✕
              </button>
              <h4 className="text-white font-black text-sm">{previewImage.title}</h4>
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl border-2 border-amber-500 shadow-2xl mx-auto"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );

  if (isInline) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] p-3 sm:p-4 transition-colors duration-300 relative overflow-hidden">
        {/* Floating Top Controls Bar (Theme Toggle & Platform Badge) */}
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2 pb-3 z-20">
          <div className="flex items-center gap-2">
            <Logo size="sm" showSubtitle={false} />
          </div>

          <div className="flex items-center gap-2">
            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-amber-500 bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                من نحن
              </button>
            )}

            {onOpenTerms && (
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-amber-500 bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                شروط الاستخدام
              </button>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* Decorative animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite alternate' }} />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-2xl" style={{ animation: 'pulse 6s ease-in-out infinite alternate-reverse' }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
        </div>

        {/* Main Center Content */}
        <div className="relative z-10 w-full max-w-lg my-auto">
          {modalBox}
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-3 text-center text-xs text-[var(--text-muted)] font-bold space-y-1">
          <div className="flex items-center justify-center gap-3">
            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="hover:text-amber-500 transition-colors cursor-pointer underline"
              >
                من نحن
              </button>
            )}
            <span>•</span>
            {onOpenTerms && (
              <button
                type="button"
                onClick={onOpenTerms}
                className="hover:text-amber-500 transition-colors cursor-pointer underline"
              >
                شروط الاستخدام
              </button>
            )}
          </div>
          <p>منصة دليلك الرقمية © 2026 — المنظومة المتكاملة لرقمنة وتنمية الأعمال والأنشطة التجارية في مصر</p>
        </div>
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto modal-overlay">
      {modalBox}
    </div>,
    document.body
  );
};
