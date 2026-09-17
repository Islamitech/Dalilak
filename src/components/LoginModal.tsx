import { OverlayLayer } from './ui/OverlayLayer';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Representative } from '../types';
import { Logo } from './Logo';
import {
  detectReferralCodeFromEnv,
  LoginForm,
  RegisterForm,
  ImagePreviewModal,
} from './auth';
import { ShieldCheck, UserPlus, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';

export interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  representatives: Representative[];
  onAddRepresentative?: (newRep: Representative) => void;
  isInline?: boolean;
  onOpenAbout?: () => void;
  onOpenTerms?: () => void;
  initialReferralCode?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLoginSuccess,
  representatives,
  onAddRepresentative,
  isInline = false,
  onOpenAbout,
  onOpenTerms,
  initialReferralCode,
}) => {
  const detectedRef = detectReferralCodeFromEnv(initialReferralCode);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() =>
    detectedRef ? 'register' : 'login'
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (initialReferralCode && initialReferralCode.trim()) {
      setActiveTab('register');
    }
  }, [initialReferralCode]);

  const handleRegisterSuccess = () => {
    setRegSuccessNotice(true);
    setTimeout(() => {
      setActiveTab('login');
    }, 2500);
  };

  const modalBox = (
    <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3.5 text-[var(--text-primary)] relative my-auto transition-colors duration-300 modal-content max-h-[92vh] overflow-y-auto">
      {!isInline && (
        <button
          onClick={onClose}
          aria-label="إغلاق النافذة"
          className="absolute top-4 end-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer z-10 transition-colors"
        >
          <X className="w-4 h-4" />
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
        <div className="bg-amber-500/15 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 font-extrabold leading-relaxed shadow-lg animate-fade-in-up">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-sm text-amber-700 dark:text-amber-400">
              ✅ تم إرسال طلب تسجيل الحساب والمستندات بنجاح!
            </p>
            <p className="text-[11px] leading-relaxed text-[var(--text-primary)]">
              حسابك الآن <strong className="text-amber-600 dark:text-amber-300 font-black">قيد المراجعة والتدقيق الأمني</strong> من قِبل إدارة المنظومة. سيقوم مدير النظام بمراجعة بطاقة الرقم القومي ومستنداتك، ولن تتمكن من تسجيل الدخول إلا بعد الموافقة الرسمية وتفعيل الحساب من قِبل المدير.
            </p>
          </div>
        </div>
      )}

      {/* 1. LOGIN FORM */}
      {activeTab === 'login' && (
        <LoginForm
          representatives={representatives}
          onLoginSuccess={onLoginSuccess}
          onClose={onClose}
          onError={setErrorMsg}
          onClearError={() => setErrorMsg('')}
        />
      )}

      {/* 2. REGISTER NEW ACCOUNT FORM */}
      {activeTab === 'register' && (
        <RegisterForm
          representatives={representatives}
          onAddRepresentative={onAddRepresentative}
          initialReferralCode={initialReferralCode}
          onRegisterSuccess={handleRegisterSuccess}
          onError={setErrorMsg}
          onClearError={() => setErrorMsg('')}
          onPreviewImage={setPreviewImage}
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />
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
          </div>
        </div>

        {/* Decorative animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl"
            style={{ animation: 'pulse 4s ease-in-out infinite alternate' }}
          />
          <div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-2xl"
            style={{ animation: 'pulse 6s ease-in-out infinite alternate-reverse' }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
        </div>

        {/* Main Center Content */}
        <div className="relative z-10 w-full max-w-lg my-auto">{modalBox}</div>

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
          <p>
            منصة دليلك الرقمية © 2026 — المنظومة المتكاملة لرقمنة وتنمية الأعمال والأنشطة التجارية في
            مصر
          </p>
        </div>
      </div>
    );
  }

  return createPortal(
    <OverlayLayer className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {modalBox}
    </OverlayLayer>,
    document.body
  );
};
