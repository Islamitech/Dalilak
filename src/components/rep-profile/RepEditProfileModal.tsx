import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Representative, User } from '../../types';
import { verifyPassword, hashPassword } from '../../utils/crypto';
import { getRepReferralCode } from '../../utils/referral';
import { EGYPT_GOVERNORATES } from '../../data/mockData';
import {
  User as UserIcon,
  AlertCircle,
  Lock,
  KeyRound,
  CheckCircle2,
  Save,
  ShieldCheck,
  IdCard,
  MapPin,
  Phone,
  Mail,
  Users,
  Copy,
  Check,
  Percent,
  FileText,
  Sparkles,
  ExternalLink,
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
  const [editGovernorate, setEditGovernorate] = useState<string>(rep.governorate || 'الجيزة');
  const [editRoleTitle, setEditRoleTitle] = useState<string>(rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني');
  const [editNationalId, setEditNationalId] = useState<string>(rep.nationalId || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const referralCode = getRepReferralCode(rep);
  const repCode = `REP-2026-${rep.id.replace(/\D/g, '') || rep.id.slice(0, 8)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
      governorate: editGovernorate,
      roleTitle: isAdmin ? editRoleTitle.trim() : (rep.roleTitle || editRoleTitle),
      nationalId: isAdmin && editNationalId ? editNationalId.trim() : rep.nationalId,
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
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 text-xs my-auto shadow-2xl text-[var(--text-primary)] transition-colors duration-300 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-md">
              <UserIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-base text-[var(--text-primary)]">الملف التعريفي وتعديل البيانات الكاملة</h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                استعراض شامل لكافة بيانات الهوية، التكليف الميداني، الاتصال، ومنظومة العمولات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {validationError && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 p-3 rounded-xl flex items-start gap-2 text-xs font-bold shrink-0 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
          {/* SECTION 1: OFFICIAL ACCREDITATION & IDENTITY */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)]/60 pb-2">
              <span className="font-black text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <IdCard className="w-4 h-4 text-amber-500" />
                <span>بيانات الهوية الرسمية والتكليف الميداني</span>
              </span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>موثق رسمياً</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[var(--text-primary)] font-bold">
                    الاسم الكامل (ثلاثي) *
                  </label>
                  {isAdmin ? (
                    <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30">
                      صلاحية إدارة 👑
                    </span>
                  ) : (
                    <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> معتمد رسمياً
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 font-bold shadow-xs transition-colors ${
                    isAdmin
                      ? 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-amber-500'
                      : 'bg-[var(--bg-card)]/50 border-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                  }`}
                />
              </div>

              {/* National ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[var(--text-primary)] font-bold">
                    الرقم القومي (14 رقم)
                  </label>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> مطابقة الشؤون القانونية
                  </span>
                </div>
                {isAdmin ? (
                  <input
                    type="text"
                    maxLength={14}
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    placeholder="14 رقم مصري..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 dir-ltr text-right focus:border-amber-500"
                  />
                ) : (
                  <div className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 flex items-center justify-between">
                    <span dir="ltr">{rep.nationalId || 'مسجل ومؤمن لدى الإدارة'}</span>
                    <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>

              {/* Rep Badge Code */}
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-1">
                  كود بطاقة التكليف الميداني (رقم المعرف ID)
                </label>
                <div className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] text-amber-600 dark:text-amber-400 font-mono font-bold rounded-xl p-2.5 flex items-center justify-between">
                  <span>{repCode}</span>
                  <span className="text-[9px] bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">كود رسمي</span>
                </div>
              </div>

              {/* Governorate */}
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>نطاق العمل الميداني (المحافظة) *</span>
                </label>
                <select
                  value={editGovernorate}
                  onChange={(e) => setEditGovernorate(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:border-amber-500 shadow-xs cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Title */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[var(--text-primary)] font-bold">
                    المسمى الوظيفي والدرجة المعتمدة
                  </label>
                  {isAdmin && (
                    <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30">
                      صلاحية إدارة 👑
                    </span>
                  )}
                </div>
                {isAdmin ? (
                  <input
                    type="text"
                    value={editRoleTitle}
                    onChange={(e) => setEditRoleTitle(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:border-amber-500 shadow-xs"
                  />
                ) : (
                  <div className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 flex items-center justify-between">
                    <span>{rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني معتمد'}</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                      درجة أولى
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTACT INFORMATION */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 shadow-xs">
            <span className="font-black text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-[var(--border-color)]/60 pb-2">
              <Phone className="w-4 h-4 text-amber-500" />
              <span>بيانات الاتصال وحساب الدخول</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[var(--text-primary)] font-bold">
                    رقم الهاتف المعتمد (11 رقم مصري) *
                  </label>
                  {!isAdmin && (
                    <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> يتطلب اعتماد المسؤول
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-xs"
                />
                {rep.phoneStatus === 'pending_approval' && rep.pendingPhone && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                    ⏳ طلب تغيير قيد المراجعة: <span dir="ltr">{rep.pendingPhone}</span>
                  </p>
                )}
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
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: REFERRAL NETWORK & COMMISSION SYSTEM */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 shadow-xs">
            <span className="font-black text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-[var(--border-color)]/60 pb-2">
              <Percent className="w-4 h-4 text-amber-500" />
              <span>منظومة العمولات وبرنامج الإحالة المعتمد</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* My Referral Code */}
              <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-amber-500/30">
                <p className="text-[10px] text-[var(--text-muted)] font-bold mb-1">كود الإحالة الخاص بك</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-amber-500">{referralCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(referralCode)}
                    className="p-1 rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 transition-colors cursor-pointer"
                    title="نسخ كود الإحالة"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Commission Rate */}
              <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-emerald-500/30">
                <p className="text-[10px] text-[var(--text-muted)] font-bold mb-1">نسبة العمولة الرسمية</p>
                <p className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                  {rep.commissionRate || 42.86}% <span className="text-[9px] font-normal">(عمولة فورية)</span>
                </p>
              </div>

              {/* Referred By */}
              <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                <p className="text-[10px] text-[var(--text-muted)] font-bold mb-1">كود المندوب الداعي</p>
                <p className="font-mono font-bold text-xs text-[var(--text-primary)]">
                  {rep.referredByCode ? rep.referredByCode : 'تسجيل مباشر (المنظومة)'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: PASSWORD & SECURITY */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)]/60 pb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs text-[var(--text-primary)]">
                  أمان الحساب وكلمة المرور
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
              <div className="space-y-2 pt-1">
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
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
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
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                كلمة المرور محمية ومشفرة وفق أعلى معايير الأمان. لتغييرها اضغط على زر "تغيير كلمة المرور".
              </p>
            )}

            {passwordNotice && (
              <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> تم تحديث كلمة المرور بنجاح!
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-xs"
          >
            إغلاق
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>حفظ البيانات والتعديلات</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

