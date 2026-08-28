import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Representative } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import {
  User as UserIcon,
  Camera,
  Upload,
  Save,
  X,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface AdminProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateProfile: (updatedData: Partial<Representative> & { name?: string; email?: string; avatar?: string }) => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  user,
  onClose,
  onUpdateProfile,
}) => {
  const rep = user.repData;

  const [name, setName] = useState<string>(user.name || rep?.name || 'Ahmed Ezalden');
  const [phone, setPhone] = useState<string>(rep?.phone || '01143888355');
  const [email, setEmail] = useState<string>(
    user.email === 'dalilaakeg@gmail.com' ? 'daz31181@gmail.com' : user.email || rep?.email || 'daz31181@gmail.com'
  );
  const [avatar, setAvatar] = useState<string>(user.avatar || rep?.avatar || '');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImageFile(file, 400, 400, 0.85, { applyWatermark: false });
      setAvatar(compressedBase64);
    } catch (err) {
      console.error('Error compressing avatar image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: avatar,
      avatarStatus: 'approved',
    });

    setSuccessMsg('✅ تم حفظ بيانات وتحديث صورة البروفايل بنجاح!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[var(--text-primary)]">
                الملف الشخصي وصورة البروفايل
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                رتبة الحساب: <span className="text-amber-500 font-extrabold">{user.role === 'admin' ? 'مدير النظام' : 'عضو معتمد'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Preview Box */}
          <div className="flex flex-col items-center justify-center gap-2.5 py-2">
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-amber-500 shadow-xl bg-[var(--input-bg)] flex items-center justify-center text-slate-950 font-black text-3xl">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black">
                    <span>{name ? name.trim().charAt(0) : 'م'}</span>
                  </div>
                )}
              </div>

              {/* Upload trigger overlay */}
              <label className="absolute -bottom-2 -right-2 bg-amber-500 hover:bg-amber-600 text-slate-950 p-2.5 rounded-2xl shadow-lg border-2 border-[var(--bg-card)] cursor-pointer transition-transform active:scale-90 flex items-center justify-center">
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>

              {/* Remove Avatar Button if present */}
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  title="حذف الصورة والعودة للحرف الافتراضي"
                  className="absolute -top-2 -left-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-lg border-2 border-[var(--bg-card)] cursor-pointer transition-transform active:scale-90 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-center space-y-1">
              <label className="text-xs text-amber-600 dark:text-amber-400 font-black cursor-pointer hover:underline inline-flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <Upload className="w-3.5 h-3.5" />
                <span>{isCompressing ? 'جاري معالجة الصورة...' : 'رفع أو تغيير صورة البروفايل'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                تظهر صورتك واضحة في الشريط العلوي وقائمة الحسابات
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold mb-1 text-[var(--text-primary)]">الاسم الشخصي *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="مثال: Ahmed Ezalden"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم الهاتف / واتساب</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                <input
                  type="tel"
                  placeholder="01143888355"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-[var(--text-primary)]">البريد الإلكتروني (الحساب الرسمي) *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="daz31181@gmail.com"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>رتبة الحساب: <strong>مدير النظام</strong> - صلاحيات كاملة لإدارة المنظومة.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ التعديلات والصورة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold py-3 px-4 rounded-xl border border-[var(--border-color)] cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
