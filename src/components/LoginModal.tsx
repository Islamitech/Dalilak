import React, { useState } from 'react';
import { User, Representative } from '../types';
import { MOCK_REPRESENTATIVES } from '../data/mockData';
import { Logo } from './Logo';
import { ShieldCheck, UserPlus, Mail, KeyRound, CheckCircle2, AlertCircle, Phone, CreditCard, Lock } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  representatives: Representative[];
  onAddRepresentative?: (newRep: Representative) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLoginSuccess,
  representatives,
  onAddRepresentative,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state (Empty by default)
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Register form state (Full account details)
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regNationalId, setRegNationalId] = useState<string>('');
  const [regGovernorate, setRegGovernorate] = useState<string>('القاهرة');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regAvatar, setRegAvatar] = useState<string>('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<boolean>(false);

  // Common notice / error state
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. HANDLE LOGIN SUBMISSION (Email + Password ONLY)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Direct Master Admin Login Check
      if (email.trim().toLowerCase() === 'admin@gmail.com' && password === 'admin123') {
        onLoginSuccess({
          id: 'admin_master',
          name: 'مدير النظام دليلك',
          email: 'admin@gmail.com',
          role: 'admin',
        });
        onClose();
        setIsLoading(false);
        return;
      }

      const cleanEmail = email.trim().toLowerCase();

      // Combine all rep account sources to guarantee recognition of all users
      const allRepsMap = new Map<string, Representative>();
      MOCK_REPRESENTATIVES.forEach((r) => allRepsMap.set(r.email.trim().toLowerCase(), r));
      representatives.forEach((r) => allRepsMap.set(r.email.trim().toLowerCase(), r));

      const localStr = localStorage.getItem('dalelak_representatives');
      if (localStr) {
        try {
          const parsed = JSON.parse(localStr);
          if (Array.isArray(parsed)) {
            parsed.forEach((pr: Representative) => {
              if (pr.email) allRepsMap.set(pr.email.trim().toLowerCase(), pr);
            });
          }
        } catch (e) {}
      }

      // Check against registered Representatives list
      const foundRep = allRepsMap.get(cleanEmail);

      if (!foundRep) {
        setErrorMsg('البريد الإلكتروني غير مسجل بالمنظومة.');
        setIsLoading(false);
        return;
      }

      // Check Password Match (skip match check if dummy masked password or matches)
      if (foundRep.password && foundRep.password !== '••••••••' && foundRep.password !== password) {
        setErrorMsg('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.');
        setIsLoading(false);
        return;
      }

      // Check Account Status (Active vs Suspended)
      if (foundRep.status === 'suspended') {
        setErrorMsg('⚠️ حسابك قيد المراجعة وبانتظار تفعيل مدير النظام المسؤول.');
        setIsLoading(false);
        return;
      }

      // Successful Auth Login!
      onLoginSuccess({
        id: foundRep.id,
        name: foundRep.name,
        email: foundRep.email,
        role: 'rep',
        repData: foundRep,
      });
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. HANDLE REGISTER SUBMISSION (New Account Creation with Validation)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation 1: Name length
    if (!regName || regName.trim().length < 6) {
      setErrorMsg('برجاء إدخال الاسم ثلاثي على الأقل.');
      return;
    }

    // Validation 2: Egyptian Phone Number (11 digits starting with 01)
    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phoneRegex.test(regPhone)) {
      setErrorMsg('رقم المحمول غير صحيح! يجب أن يتكون من 11 رقم مصري يبدأ بـ 01 (مثال: 01012345678).');
      return;
    }

    // Validation 3: National ID (14 digits)
    const nationalIdRegex = /^\d{14}$/;
    if (!nationalIdRegex.test(regNationalId)) {
      setErrorMsg('الرقم القومي غير صحيح! يجب أن يتكون من 14 رقم قومي مصري بالضبط.');
      return;
    }

    // Validation 4: Password Match & Length
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('كلمات المرور غير متطابقة، يرجى التأكد وإعادة المحاولة.');
      return;
    }

    // Check duplicate email
    const duplicateEmail = representatives.some(
      (r) => r.email.trim().toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (duplicateEmail) {
      setErrorMsg('البريد الإلكتروني مستخدم بالفعل بحساب آخر.');
      return;
    }

    // Create New Representative Record
    const timestamp = Date.now();
    const newRepData: Representative = {
      id: `rep_${timestamp}`,
      name: regName,
      email: regEmail,
      phone: regPhone,
      nationalId: regNationalId,
      role: 'rep',
      roleTitle: 'مندوب مبيعات ميداني',
      governorate: regGovernorate,
      targetMonth: 25,
      avatar: regAvatar || '',
      avatarStatus: regAvatar ? 'pending_approval' : 'none',
      commissionRate: 42.86,
      status: 'suspended', // Account requires Admin Activation!
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative my-auto transition-colors duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
        >
          ✕
        </button>

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
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-300 p-3 rounded-xl text-xs flex items-start gap-2 font-bold leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {regSuccessNotice && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl text-xs flex items-start gap-2 font-bold leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>تم تقديم طلب إنشاء الحساب بنجاح! الحساب قيد المراجعة وسيقوم مدير النظام المعتمد بتفعيله فوراً.</span>
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
    </div>
  );
};
