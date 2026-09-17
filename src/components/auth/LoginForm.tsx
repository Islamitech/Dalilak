import React, { useState } from 'react';
import { User, Representative } from '../../types';
import { safeSetSessionItem, safeSetLocalStorageItem } from '../../utils/storage';
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      onError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف.');
      return;
    }

    if (!cleanPassword) {
      onError('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/secure?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanEmail, password: cleanPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.token || !result?.user) {
        onError(result?.error || 'تعذر تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
        return;
      }
      safeSetSessionItem('dalelak_auth_token', result.token);
      safeSetLocalStorageItem('dalelak_auth_token', result.token);
      if (onClose) onClose();
      onLoginSuccess(result.user as User);
    } catch (err) {
      console.error('Login error:', err);
      onError('حدث خطأ أثناء التحقق من الجلسة، يرجى المحاولة لاحقاً.');
    } finally {
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
