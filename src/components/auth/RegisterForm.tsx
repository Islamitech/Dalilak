import React, { useState, useEffect } from 'react';
import { Representative } from '../../types';
import { EGYPT_GOVERNORATES } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import { fetchRepsFromDb, saveRepToDb } from '../../services/db';
import { compressImageFile } from '../../utils/imageCompressor';
import { getRepReferralCode } from '../../utils/referral';
import { hashPassword } from '../../utils/crypto';
import { detectReferralCodeFromEnv, useMatchedInviter } from './hooks/useReferralDetection';
import { IdentityUploadRow } from './IdentityUploadRow';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  User as UserIcon,
  FileCheck,
} from 'lucide-react';

export interface RegisterFormProps {
  representatives: Representative[];
  onAddRepresentative?: (newRep: Representative) => void;
  initialReferralCode?: string;
  onRegisterSuccess: () => void;
  onError: (msg: string) => void;
  onClearError: () => void;
  onPreviewImage: (image: { url: string; title: string }) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  representatives,
  onAddRepresentative,
  initialReferralCode,
  onRegisterSuccess,
  onError,
  onClearError,
  onPreviewImage,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regNationalId, setRegNationalId] = useState<string>('');
  const [regGovernorate, setRegGovernorate] = useState<string>('القاهرة');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regReferralCode, setRegReferralCode] = useState<string>(() =>
    detectReferralCodeFromEnv(initialReferralCode)
  );

  useEffect(() => {
    if (initialReferralCode && initialReferralCode.trim()) {
      setRegReferralCode(initialReferralCode.trim().toUpperCase());
    }
  }, [initialReferralCode]);

  const matchedInviter = useMatchedInviter(regReferralCode, representatives);

  const [regAvatar, setRegAvatar] = useState<string>('');
  const [regNationalIdCardPhoto, setRegNationalIdCardPhoto] = useState<string>('');
  const [regNationalIdCardBackPhoto, setRegNationalIdCardBackPhoto] = useState<string>('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.7, { applyWatermark: false });
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
        const compressed = await compressImageFile(file, 800, 600, 0.7, { applyWatermark: false });
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
        const compressed = await compressImageFile(file, 800, 600, 0.7, { applyWatermark: false });
        setRegNationalIdCardBackPhoto(compressed);
      } catch (err) {
        console.warn('National ID Back compression error:', err);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();

    if (!regName || regName.trim().length < 5) {
      onError('برجاء إدخال الاسم كاملاً (ثلاثي على الأقل).');
      return;
    }

    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phoneRegex.test(regPhone)) {
      onError('رقم المحمول غير صحيح! يجب أن يتكون من 11 رقم مصري يبدأ بـ 01.');
      return;
    }

    const nationalIdRegex = /^\d{14}$/;
    if (!nationalIdRegex.test(regNationalId)) {
      onError('الرقم القومي غير صحيح! يجب أن يتكون من 14 رقم قومي مصري.');
      return;
    }

    // MANDATORY IDENTITY CHECKS: Face photo without filters + National ID card Front & Back
    if (!regAvatar || regAvatar.trim().length === 0) {
      onError('⚠️ يرجى إدراج صورة شخصية واضحة للوجه بدون فلاتر لإتمام التسجيل.');
      return;
    }

    if (!regNationalIdCardPhoto || regNationalIdCardPhoto.trim().length === 0) {
      onError('⚠️ يرجى إدراج صورة الوجه الأمامي لبطاقة الرقم القومي.');
      return;
    }

    if (!regNationalIdCardBackPhoto || regNationalIdCardBackPhoto.trim().length === 0) {
      onError('⚠️ يرجى إدراج صورة الظهر الخلفي لبطاقة الرقم القومي.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      onError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      onError('كلمات المرور غير متطابقة، يرجى التأكد وإعادة المحاولة.');
      return;
    }

    const cleanRegEmail = regEmail.trim().toLowerCase();

    // 1. Local duplicate check (Email, Phone, National ID)
    const duplicateEmail = representatives.some(
      (r) => r.email.trim().toLowerCase() === cleanRegEmail
    );
    if (duplicateEmail) {
      onError(
        `⚠️ البريد الإلكتروني (${cleanRegEmail}) مسجل مسبقاً في المنظومة. يمكنك التوجه لتبويب "تسجيل الدخول" أو استخدام بريد إلكتروني آخر.`
      );
      return;
    }

    const cleanPhoneDigits = regPhone.replace(/\D/g, '');
    const duplicatePhone = representatives.some(
      (r) => (r.phone || '').replace(/\D/g, '') === cleanPhoneDigits
    );
    if (duplicatePhone) {
      onError(`⚠️ رقم الهاتف (${regPhone}) مسجل مسبقاً لحساب آخر في المنظومة.`);
      return;
    }

    const duplicateNationalId = representatives.some(
      (r) => (r.nationalId || '').trim() === regNationalId.trim()
    );
    if (duplicateNationalId) {
      onError(`⚠️ الرقم القومي (${regNationalId}) مسجل مسبقاً لحساب آخر في المنظومة.`);
      return;
    }

    setIsLoading(true);

    // 2. Supabase DB Async Query check (Duplicate email or phone)
    try {
      const { data: dbCheck } = await supabase
        .from('representatives')
        .select('id, email, phone')
        .or(`email.ilike.${cleanRegEmail},phone.eq.${regPhone}`)
        .limit(1);

      if (dbCheck && dbCheck.length > 0) {
        const found = dbCheck[0];
        if (found.email && found.email.toLowerCase() === cleanRegEmail) {
          onError(
            `⚠️ البريد الإلكتروني (${cleanRegEmail}) مسجل مسبقاً في قاعدة البيانات. يمكنك التوجه لتبويب "تسجيل الدخول" أو استخدام بريد إلكتروني آخر.`
          );
        } else {
          onError(`⚠️ رقم الهاتف (${regPhone}) مسجل مسبقاً في قاعدة البيانات لحساب آخر.`);
        }
        setIsLoading(false);
        return;
      }
    } catch (dbErr) {
      console.log('Supabase duplicate check notice:', dbErr);
    }

    const timestamp = Date.now();
    const cleanReferral = regReferralCode.trim().toUpperCase();
    const ownCode = `DALIL-${timestamp.toString().slice(-4)}`;

    // Smart referral resolver: supports DALIL-XXXX codes, 4-digit codes, emails, and phone numbers
    let resolvedReferredByCode: string | undefined = undefined;
    if (cleanReferral) {
      if (
        cleanReferral === ownCode ||
        cleanReferral === regPhone ||
        (cleanRegEmail && cleanReferral === cleanRegEmail.toUpperCase())
      ) {
        onError('⚠️ لا يمكن استخدام كود الإحالة أو رقم الهاتف الخاص بك ككود دعوة لنفسك.');
        setIsLoading(false);
        return;
      }

      const cleanRefNorm = cleanReferral.replace(/[^A-Z0-9]/g, '');
      const refDigits = cleanReferral.replace(/\D/g, '').slice(-4);

      // 1. Exact match on official code, custom code, phone, email, or id
      let matchRep = representatives.find((r) => {
        const rCode = getRepReferralCode(r).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rCustom = (r.referralCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rPhone = (r.phone || '').replace(/\D/g, '');
        const rEmail = (r.email || '').trim().toLowerCase();

        return (
          rCode === cleanRefNorm ||
          (rCustom && rCustom === cleanRefNorm) ||
          (cleanReferral.length >= 10 && rPhone && rPhone === cleanReferral.replace(/\D/g, '')) ||
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
            const rPhone = (r.phone || '').replace(/\D/g, '');
            const rEmail = (r.email || '').trim().toLowerCase();

            return (
              rCode === cleanRefNorm ||
              (rCustom && rCustom === cleanRefNorm) ||
              (cleanReferral.length >= 10 && rPhone && rPhone === cleanReferral.replace(/\D/g, '')) ||
              rEmail === cleanReferral.toLowerCase() ||
              r.id.toLowerCase() === cleanReferral.toLowerCase()
            );
          });
        } catch {}
      }

      // 2. Suffix match only if exact was not found
      if (!matchRep && refDigits && refDigits.length === 4) {
        matchRep = representatives.find((r) => {
          const rDigits =
            (r.referralCode || '').replace(/\D/g, '').slice(-4) ||
            (r.phone || '').replace(/\D/g, '').slice(-4);
          return rDigits === refDigits;
        });
      }

      if (matchRep) {
        resolvedReferredByCode = getRepReferralCode(matchRep);
      } else {
        resolvedReferredByCode = cleanReferral.startsWith('DALIL-')
          ? cleanReferral
          : refDigits
          ? `DALIL-${refDigits}`
          : cleanReferral;
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
      adminBypassReferral: false,
    };

    // Save directly to Supabase Database immediately so Admin sees it across all sessions
    const saveResult = await saveRepToDb(newRepData);

    if (!saveResult.success) {
      setIsLoading(false);
      onError(
        saveResult.error ||
          '⚠️ حدث خطأ أثناء حفظ طلب التسجيل في السيرفر السحابي. يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى.'
      );
      return;
    }

    const finalRep = saveResult.rep || newRepData;

    if (onAddRepresentative) {
      onAddRepresentative(finalRep);
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('dalelak_app_channel');
        channel.postMessage({
          type: 'NEW_REP_REGISTERED',
          name: finalRep.name,
          id: finalRep.id,
          governorate: finalRep.governorate,
          referredByCode: finalRep.referredByCode,
        });
        channel.close();
      }
    } catch {}

    try {
      localStorage.removeItem('dalelak_pending_referral');
    } catch {}

    setIsLoading(false);
    onRegisterSuccess();
  };

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
      <div>
        <label className="block text-[var(--text-primary)] font-extrabold mb-1">
          الاسم بالكامل *
        </label>
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
          <label className="block text-[var(--text-primary)] font-extrabold mb-1">
            البريد الإلكتروني *
          </label>
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
          <label className="block text-[var(--text-primary)] font-extrabold mb-1">
            رقم المحمول (11 رقم) *
          </label>
          <input
            type="tel"
            required
            placeholder="01012345678"
            value={regPhone}
            onChange={(e) => setRegPhone(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[var(--text-primary)] font-extrabold mb-1">
            الرقم القومي (14 رقم) *
          </label>
          <input
            type="text"
            required
            maxLength={14}
            placeholder="29805120104892"
            value={regNationalId}
            onChange={(e) => setRegNationalId(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm placeholder:text-slate-400"
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
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Referral / Invitation Code */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[var(--text-primary)] font-extrabold">
            كود الدعوة / الإحالة (اختياري)
          </label>
          <span className="text-[10px] text-amber-600 font-bold">
            إذا تمت دعوتك من مندوب معتمد
          </span>
        </div>
        <input
          type="text"
          placeholder="مثال: DALIL-7711"
          value={regReferralCode}
          onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 uppercase shadow-sm placeholder:text-slate-400"
        />
        {matchedInviter && (
          <div className="mt-1.5 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              تم التعرف على الداعي: <strong>{matchedInviter.name}</strong> (
              {getRepReferralCode(matchedInviter)}) - سيتم ربطك بفريقه تلقائياً.
            </span>
          </div>
        )}
      </div>

      {/* COMPACT & STREAMLINED IDENTITY ATTACHMENTS (3 Uploads) */}
      <div className="bg-[var(--bg-surface)]/70 border border-[var(--border-color)] rounded-2xl p-3 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
          <span className="font-black text-xs text-amber-600 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4" />
            <span>مستندات التحقق والتفعيل (لسجلات مدير المنظومة فقط) *</span>
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-bold">
            {[regAvatar, regNationalIdCardPhoto, regNationalIdCardBackPhoto].filter(Boolean).length}
            /3 مكتمل
          </span>
        </div>

        {/* Upload Row 1: Face Verification Photo */}
        <IdentityUploadRow
          label="صورة الوجه للتفعيل"
          badgeText="سجلات الإدارة فقط"
          photoData={regAvatar}
          onChangeHandler={handleAvatarUpload}
          onRemoveHandler={() => setRegAvatar('')}
          onPreviewHandler={() =>
            onPreviewImage({ url: regAvatar, title: 'صورة الوجه للتفعيل' })
          }
          icon={<UserIcon className="w-5 h-5" />}
          helpText="صورة واضحة للوجه بدون فلاتر لتدقيق وتفعيل الحساب بواسطة الإدارة"
        />

        {/* Upload Row 2: National ID Front */}
        <IdentityUploadRow
          label="بطاقة الرقم القومي"
          badgeText="الوجه الأمامي"
          photoData={regNationalIdCardPhoto}
          onChangeHandler={handleIdFrontUpload}
          onRemoveHandler={() => setRegNationalIdCardPhoto('')}
          onPreviewHandler={() =>
            onPreviewImage({ url: regNationalIdCardPhoto, title: 'بطاقة الرقم القومي (الوجه الأمامي)' })
          }
          icon={<CreditCard className="w-5 h-5" />}
          helpText="صورة واضحة للوجه الأمامي للبطاقة"
        />

        {/* Upload Row 3: National ID Back */}
        <IdentityUploadRow
          label="بطاقة الرقم القومي"
          badgeText="الظهر الخلفي"
          photoData={regNationalIdCardBackPhoto}
          onChangeHandler={handleIdBackUpload}
          onRemoveHandler={() => setRegNationalIdCardBackPhoto('')}
          onPreviewHandler={() =>
            onPreviewImage({
              url: regNationalIdCardBackPhoto,
              title: 'بطاقة الرقم القومي (الظهر الخلفي)',
            })
          }
          icon={<ShieldCheck className="w-5 h-5" />}
          helpText="صورة واضحة للظهر الخلفي للبطاقة"
        />

        {/* Security & Privacy Reassurance Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-[10px] sm:text-[11px] text-blue-900 font-bold flex items-start gap-2 leading-relaxed">
          <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            <strong>خصوصيتك وأمان بياناتك أولويتنا:</strong> كافة المستندات الشخصية مشفرة ومحفوظة
            بسرية تامة، ولن تظهر أو تُنشر في أي مكان عام؛ استخدامها مقتصر حصراً على التحقق الإداري
            والاعتماد الرسمي للمندوب.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[var(--text-primary)] font-extrabold mb-1">
            كلمة المرور *
          </label>
          <div className="relative">
            <input
              type={showRegPassword ? 'text' : 'password'}
              required
              placeholder="أدخل كلمة المرور..."
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 pl-9 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowRegPassword(!showRegPassword)}
              className="absolute left-2.5 top-2.5 text-[var(--text-muted)] hover:text-amber-500 transition-colors cursor-pointer p-0.5"
              title={showRegPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-primary)] font-extrabold mb-1">
            تأكيد كلمة المرور *
          </label>
          <div className="relative">
            <input
              type={showRegConfirmPassword ? 'text' : 'password'}
              required
              placeholder="أعد إدخال كلمة المرور..."
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 pl-9 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
              className="absolute left-2.5 top-2.5 text-[var(--text-muted)] hover:text-amber-500 transition-colors cursor-pointer p-0.5"
              title={showRegConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
  );
};
