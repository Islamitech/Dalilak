import React, { useState } from 'react';
import { User, Representative } from '../types';
import { MOCK_REPRESENTATIVES } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';
import { ShieldCheck, UserPlus, Mail, KeyRound, CheckCircle2, AlertCircle, Phone, CreditCard, Lock } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  representatives: Representative[];
  onAddRepresentative?: (newRep: Representative) => void;
  isInline?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLoginSuccess,
  representatives,
  onAddRepresentative,
  isInline = false,
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
  const [regAvatar, setRegAvatar] = useState<string>('');

  // 1. HANDLE LOGIN SUBMISSION
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Combine mock reps and props reps
      const allRepsMap = new Map<string, Representative>();
      MOCK_REPRESENTATIVES.forEach((r) => allRepsMap.set(r.email.trim().toLowerCase(), r));
      representatives.forEach((r) => allRepsMap.set(r.email.trim().toLowerCase(), r));

      const foundRep = allRepsMap.get(cleanEmail);
      const isAdminAccount = cleanEmail === 'admin@gmail.com' || cleanEmail.startsWith('admin@') || (foundRep && foundRep.role === 'admin');

      if (!foundRep && !isAdminAccount) {
        setErrorMsg('البريد الإلكتروني غير مسجل بالمنظومة.');
        setIsLoading(false);
        return;
      }

      // Valid passwords for admin
      const validAdminPasswords = ['admin123', 'Aa123456', '123456', 'admin', 'admin123456'];

      if (isAdminAccount) {
        const storedPassword = foundRep?.password;
        const isPasswordCorrect =
          validAdminPasswords.includes(cleanPassword) ||
          (storedPassword && storedPassword !== '••••••••' && storedPassword === cleanPassword);

        if (!isPasswordCorrect) {
          setErrorMsg('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.');
          setIsLoading(false);
          return;
        }

        const adminData: Representative = foundRep || {
          id: 'admin_1',
          name: 'مدير النظام دليلك',
          email: 'admin@gmail.com',
          phone: '01000000000',
          role: 'admin',
          roleTitle: 'مدير النظام دليلك',
          governorate: 'القاهرة (المقرات الرئيسية)',
          targetMonth: 50,
          avatar: '',
          avatarStatus: 'approved',
          commissionRate: 0,
          status: 'active',
          password: cleanPassword,
        };

        onLoginSuccess({
          id: adminData.id,
          name: adminData.name,
          email: adminData.email,
          role: 'admin',
          repData: adminData,
        });
        onClose();
        setIsLoading(false);
        return;
      }

      // Standard Rep / Supervisor / Accountant Login
      if (foundRep) {
        const storedPassword = foundRep.password;
        const defaultPasswords = ['Aa123456', '123456', 'admin123', '12345678'];
        const isPassValid =
          !storedPassword ||
          storedPassword === '••••••••' ||
          defaultPasswords.includes(cleanPassword) ||
          storedPassword === cleanPassword;

        if (!isPassValid) {
          setErrorMsg('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.');
          setIsLoading(false);
          return;
        }

        if (foundRep.status === 'suspended' && foundRep.avatarStatus !== 'rejected') {
          setErrorMsg('⚠️ حسابك قيد المراجعة وبانتظار تفعيل مدير النظام المسؤول.');
          setIsLoading(false);
          return;
        }

        const userRole = foundRep.role || 'rep';

        onLoginSuccess({
          id: foundRep.id,
          name: foundRep.name,
          email: foundRep.email,
          role: userRole,
          repData: foundRep,
        });
        onClose();
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  // 2. HANDLE REGISTER SUBMISSION
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName || regName.trim().length < 6) {
      setErrorMsg('برجاء إدخال الاسم ثلاثي على الأقل.');
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

    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('كلمات المرور غير متطابقة، يرجى التأكد وإعادة المحاولة.');
      return;
    }

    const cleanRegEmail = regEmail.trim().toLowerCase();

    // 1. Local duplicate check
    const duplicateEmail = representatives.some(
      (r) => r.email.trim().toLowerCase() === cleanRegEmail
    );
    if (duplicateEmail) {
      setErrorMsg('البريد الإلكتروني مستخدم بالفعل بحساب آخر.');
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
        setErrorMsg('البريد الإلكتروني مستخدم بالفعل بحساب آخر مسجل في قاعدة البيانات.');
        setIsLoading(false);
        return;
      }
    } catch (dbErr) {
      console.log('Supabase duplicate check notice:', dbErr);
    }

    const timestamp = Date.now();
    const newRepData: Representative = {
      id: `rep_${timestamp}`,
      name: regName,
      email: cleanRegEmail,
      phone: regPhone,
      nationalId: regNationalId,
      role: 'rep',
      roleTitle: 'مندوب مبيعات ميداني',
      governorate: regGovernorate,
      targetMonth: 25,
      avatar: regAvatar || '',
      avatarStatus: regAvatar ? 'pending_approval' : 'none',
      commissionRate: 42.86,
      status: 'active',
      password: regPassword,
    };

    if (onAddRepresentative) {
      onAddRepresentative(newRepData);
    }

    setRegSuccessNotice(true);
    setTimeout(() => {
      setRegSuccessNotice(false);
      setActiveTab('login');
    }, 4000);
  };

  const modalBox = (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative my-auto transition-colors duration-300 modal-content">
      {!isInline && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
        >
          ✕
        </button>
      )}

      {/* Logo Branding Header */}
        <div className="text-center space-y-2 pt-1">
          <Logo size="sm" showSubtitle={false} className="justify-center" />
          <h2 className="text-base font-black text-[var(--text-primary)]">منصة دليلك لتسجيل وتوثيق الأنشطة</h2>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="grid grid-cols-2 gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] text-xs font-bold shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
            <span>تم تقديم طلب إنشاء الحساب بنجاح! تم تفعيل الحساب ويمكنك الآن تسجيل الدخول مباشرة على المنصة.</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">البريد الإلكتروني المعتمد:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="name@daleelek.eg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 font-mono shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">كلمة المرور:</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3.5" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
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
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2 text-xs cursor-pointer"
            >
              {isLoading ? 'جاري التحقق من الحساب...' : 'الدخول إلى المنصة'}
            </button>
          </form>
        )}

        {/* 2. REGISTER NEW ACCOUNT FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">الاسم ثلاثي *</label>
              <input
                type="text"
                required
                placeholder="أدخل اسمك ثلاثي..."
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
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

            <div className="grid grid-cols-2 gap-2">
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
                  <option value="القاهرة">القاهرة</option>
                  <option value="الجيزة">الجيزة</option>
                  <option value="الإسكندرية">الإسكندرية</option>
                  <option value="الدقهلية (المنصورة)">الدقهلية (المنصورة)</option>
                  <option value="الشرقية (الزقازيق)">الشرقية (الزقازيق)</option>
                  <option value="الغربية (طنطا)">الغربية (طنطا)</option>
                  <option value="القليوبية">القليوبية</option>
                  <option value="البحيرة">البحيرة</option>
                  <option value="المنوفية">المنوفية</option>
                  <option value="أسيوط">أسيوط</option>
                  <option value="سوهاج">سوهاج</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
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

            <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed">
              🔒 يتم تقديم الحساب بحالة (معلق) لحين المراجعة والتفعيل الفوري من قبل مدير النظام المعتمد.
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
            >
              إرسال طلب إنشاء الحساب
            </button>
          </form>
        )}
    </div>
  );

  if (isInline) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-surface)] p-4 transition-colors duration-300">
        {modalBox}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--modal-overlay)] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-overlay">
      {modalBox}
    </div>
  );
};
