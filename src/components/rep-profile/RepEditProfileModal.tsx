import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Representative, User } from '../../types';
import { verifyPassword, hashPassword } from '../../utils/crypto';
import {
  User as UserIcon,
  AlertCircle,
  Lock,
  KeyRound,
  CheckCircle2,
  Save,
} from 'lucide-react';

interface RepEditProfileModalProps {
  rep: Representative;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRep: (updatedRep: Representative) => void;
  onSuccess: () => void;
}

export const RepEditProfileModal: React.FC<RepEditProfileModalProps> = ({
  rep,
  user,
  isOpen,
  onClose,
  onUpdateRep,
  onSuccess,
}) => {
  const isAdmin = user.role === 'admin' || user.role === 'supervisor';

  const [editName, setEditName] = useState<string>(rep.name);
  const [editPhone, setEditPhone] = useState<string>(rep.phone);
  const [editEmail, setEditEmail] = useState<string>(rep.email);
  const [editAvatar, setEditAvatar] = useState<string>(rep.avatar || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Only validate name if user is admin editing it
    if (isAdmin) {
      if (!editName || editName.trim().length < 6) {
        setValidationError('يجب إدخال الاسم ثلاثي على الأقل (أكثر من 6 أحرف).');
        return;
      }
    }

    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phoneRegex.test(editPhone)) {
      setValidationError(
        'رقم الهاتف غير صحيح! يجب أن يكون رقم مصري يبدأ بـ 01 ومكون من 11 رقم بالضبط (مثال: 01012345678).'
      );
      return;
    }

    if (!editEmail || !/\S+@\S+\.\S+/.test(editEmail)) {
      setValidationError('يرجى إدخال بريد إلكتروني صالح للدخول (مثال: name@example.com).');
      return;
    }

    // Password verification logic
    let shouldUpdatePassword = false;
    let hashedNewPassword = '';
    if (showPasswordChange || currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setValidationError('لتغيير كلمة المرور، يجب إدخال كلمة المرور الحالية أولاً لتأكيد هويتك.');
        return;
      }
      if (rep.password) {
        const isCurrentValid = await verifyPassword(currentPassword, rep.password);
        if (!isCurrentValid) {
          setValidationError('كلمة المرور الحالية غير صحيحة! يرجى إدخال كلمة المرور الحالية بدقة.');
          return;
        }
      }
      if (!newPassword || newPassword.length < 6) {
        setValidationError('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setValidationError('كلمة المرور الجديدة غير متطابقة مع خانة التأكيد!');
        return;
      }
      shouldUpdatePassword = true;
      hashedNewPassword = await hashPassword(newPassword.trim());
    }

    const isNewAvatar = editAvatar !== rep.avatar && editAvatar.length > 0;
    const isNewPhone = editPhone.trim() !== rep.phone;

    let updatedPhone = rep.phone;
    let updatedPendingPhone = rep.pendingPhone;
    let updatedPhoneStatus = rep.phoneStatus || 'none';

    if (isNewPhone) {
      if (isAdmin) {
        updatedPhone = editPhone.trim();
        updatedPendingPhone = undefined;
        updatedPhoneStatus = 'approved';
      } else {
        updatedPhone = rep.phone;
        updatedPendingPhone = editPhone.trim();
        updatedPhoneStatus = 'pending_approval';
      }
    }

    onUpdateRep({
      ...rep,
      name: isAdmin ? editName.trim() : rep.name,
      phone: updatedPhone,
      pendingPhone: updatedPendingPhone,
      phoneStatus: updatedPhoneStatus,
      email: editEmail.trim(),
      avatar: editAvatar || rep.avatar,
      avatarStatus: isNewAvatar ? 'pending_approval' : rep.avatarStatus || 'none',
      ...(shouldUpdatePassword && hashedNewPassword ? { password: hashedNewPassword } : {}),
    });

    if (shouldUpdatePassword) {
      setPasswordNotice(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      setTimeout(() => setPasswordNotice(false), 3000);
    }

    onSuccess();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <form
        onSubmit={handleSaveProfileData}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs my-auto shadow-2xl text-[var(--text-primary)] transition-colors duration-300 max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">تعديل بيانات الحساب</h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                البيانات الرسمية مقفلة لحماية وتوثيق هوية المندوب
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {validationError && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 p-3 rounded-xl flex items-start gap-2 text-xs font-bold shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Editable Fields */}
          <div className="space-y-3">
            {isAdmin ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[var(--text-primary)] font-bold">
                    اسم المندوب كاملاً (ثلاثي) *
                  </label>
                  <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    صلاحية إدارة 👑
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[var(--text-primary)] font-bold">
                  رقم الهاتف المصرح (11 رقم مصري يبدأ بـ 01) *
                </label>
                {!isAdmin && (
                  <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> يتطلب موافقة المسؤول
                  </span>
                )}
              </div>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-bold mb-1">
                البريد الإلكتروني المعتمد *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
          </div>

          {/* Password Change Toggle Section */}
          <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs text-[var(--text-primary)]">
                  تغيير كلمة المرور
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                {showPasswordChange ? 'إلغاء تغيير الكلمة' : 'تغيير كلمة المرور'}
              </button>
            </div>

            {showPasswordChange ? (
              <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-1">
                    كلمة المرور الحالية *
                  </label>
                  <input
                    type="password"
                    required={showPasswordChange}
                    placeholder="أدخل كلمتك الحالية للتحقق..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-1">
                    كلمة المرور الجديدة *
                  </label>
                  <input
                    type="password"
                    required={showPasswordChange}
                    placeholder="6 أحرف أو أرقام على الأقل..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-1">
                    تأكيد كلمة المرور الجديدة *
                  </label>
                  <input
                    type="password"
                    required={showPasswordChange}
                    placeholder="أعد إدخال الكلمة الجديدة..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                كلمة المرور محمية ومشفرة. لتغييرها اضغط على زر "تغيير كلمة المرور" بالأعلى وأدخل
                الكلمة الحالية أولاً.
              </p>
            )}

            {passwordNotice && (
              <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> تم تحديث كلمة المرور بنجاح!
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ البيانات والتعديلات</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};
