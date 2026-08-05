'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, User, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Default Super Admin fallback
    if (cleanEmail === 'admin@daleelak.com' && cleanPassword === 'admin123') {
      const adminProfile = {
        id: 'admin-root-001',
        full_name: 'مدير المنظومة الرئيسي',
        email: 'admin@daleelak.com',
        phone: '01000000000',
        role: 'admin',
      };
      localStorage.setItem('daleelak_current_user', JSON.stringify(adminProfile));
      router.push('/admin');
      return;
    }

    try {
      // Check in Supabase profiles table
      const { data, error: sbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (sbError || !data) {
        // Local storage fallback for documenters created offline
        const localUsers = JSON.parse(localStorage.getItem('daleelak_users') || '[]');
        const found = localUsers.find((u: { email: string }) => u.email.toLowerCase() === cleanEmail);

        if (found && found.password === cleanPassword) {
          localStorage.setItem('daleelak_current_user', JSON.stringify(found));
          if (found.role === 'admin') router.push('/admin');
          else router.push('/');
          return;
        }

        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        setLoading(false);
        return;
      }

      // Check password match
      if (data.password_hash && data.password_hash !== cleanPassword) {
        setError('كلمة المرور غير صحيحة.');
        setLoading(false);
        return;
      }

      // Save session
      localStorage.setItem('daleelak_current_user', JSON.stringify(data));

      if (data.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالنظام، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden dir-rtl">
      {/* Glow Accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl space-y-6 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto shadow-xl shadow-emerald-500/20 border border-slate-700 bg-slate-950 flex items-center justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="دليلك" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black text-white">دليلك للخدمات الرقمية</h1>
          <p className="text-xs text-slate-400">بوابة تسجيل الدخول للمسؤولين والموثقين الميدانيين</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-950/80 border border-red-800 text-red-300 p-3.5 rounded-2xl text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">البريد الإلكتروني</label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@daleelak.com"
                className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all dir-ltr text-right"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all dir-ltr text-right"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول للنظام'}
          </button>
        </form>



        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> العودة للواجهة الرئيسية للميدان
          </button>
        </div>
      </motion.div>
    </div>
  );
}
