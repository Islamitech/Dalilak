import React, { useState } from 'react';
import { Representative, User, UserRole } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { EGYPT_GOVERNORATES } from '../data/mockData';
import { BaseModal, Button, Badge } from './ui';
import {
  Shield,
  User as UserIcon,
  Crown,
  Lock,
  Camera,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  CreditCard,
  Hash,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  KeyRound,
  Sparkles,
  Briefcase,
  Award,
  FileCheck,
  Percent,
  TrendingUp,
  X,
} from 'lucide-react';

export interface UnifiedProfileModalProps {
  user: User;
  rep?: Representative | null;
  isOpen?: boolean;
  onClose: () => void;
  onUpdateProfile?: (updatedData: Partial<Representative> & { name?: string; email?: string; avatar?: string }) => void;
  onUpdateRep?: (updatedRep: Representative) => void;
  onSuccess?: () => void;
}

export type AdminProfileModalProps = UnifiedProfileModalProps;

export const AdminProfileModal: React.FC<UnifiedProfileModalProps> = ({
  user,
  rep: propRep,
  isOpen = true,
  onClose,
  onUpdateProfile,
  onUpdateRep,
  onSuccess,
}) => {
  const rep = propRep || user.repData;

  // Active Tab within Profile Modal: 'documents' | 'basic' | 'role' | 'security'
  const [activeTab, setActiveTab] = useState<'documents' | 'basic' | 'role' | 'security'>('documents');

  // Basic Information
  const [name, setName] = useState<string>(user.name || rep?.name || 'مدير النظام دليلك');
  const [phone, setPhone] = useState<string>(rep?.phone || '01143888355');
  const [pendingPhone, setPendingPhone] = useState<string>(rep?.pendingPhone || '');
  const [email, setEmail] = useState<string>(user.email || rep?.email || 'info@dalilaak.com');
  const [governorate, setGovernorate] = useState<string>(rep?.governorate || 'القاهرة');
  const [nationalId, setNationalId] = useState<string>(rep?.nationalId || '');

  // Role & Administrative Settings
  const [role, setRole] = useState<UserRole>(rep?.role || user.role || 'admin');
  const [roleTitle, setRoleTitle] = useState<string>(rep?.roleTitle || (user.role === 'admin' ? 'مدير النظام العام' : 'مسؤول إداري'));
  const [referralCode, setReferralCode] = useState<string>(rep?.referralCode || 'DALIL-ADMIN');
  const [targetMonth, setTargetMonth] = useState<number>(Number(rep?.targetMonth) || 50);
  const [commissionRate, setCommissionRate] = useState<number>(Number(rep?.commissionRate) || 42.86);
  const [status, setStatus] = useState<'active' | 'suspended'>(rep?.status || 'active');

  // Security & Password
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Documents & Photos
  const [avatar, setAvatar] = useState<string>(user.avatar || rep?.avatar || '');
  const [nationalIdCardPhoto, setNationalIdCardPhoto] = useState<string>(rep?.nationalIdCardPhoto || '');
  const [nationalIdCardBackPhoto, setNationalIdCardBackPhoto] = useState<string>(rep?.nationalIdCardBackPhoto || '');
  const [activationFacePhoto, setActivationFacePhoto] = useState<string>(rep?.activationFacePhoto || '');

  // Zoomed Preview Modal for Document Inspection
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressingTarget, setCompressingTarget] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isCallerAdmin = user.role === 'admin';

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'avatar' | 'idFront' | 'idBack' | 'facePhoto'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setCompressingTarget(target);
      setErrorMsg('');

      const isAvatar = target === 'avatar';
      const compressedBase64 = await compressImageFile(
        file,
        isAvatar ? 500 : 1200,
        isAvatar ? 500 : 1200,
        0.85,
        { applyWatermark: false }
      );

      if (target === 'avatar') setAvatar(compressedBase64);
      else if (target === 'idFront') setNationalIdCardPhoto(compressedBase64);
      else if (target === 'idBack') setNationalIdCardBackPhoto(compressedBase64);
      else if (target === 'facePhoto') setActivationFacePhoto(compressedBase64);
    } catch (err) {
      console.error('Error compressing image:', err);
      setErrorMsg('حدث خطأ أثناء معالجة الصورة، يرجى اختيار ملف صورة صالح.');
    } finally {
      setIsCompressing(false);
      setCompressingTarget('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const hasNewPassword = Boolean(password.trim() || confirmPassword.trim());
    if (hasNewPassword && password !== confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقين.');
      setActiveTab('security');
      return;
    }

    if (hasNewPassword && password.trim().length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      setActiveTab('security');
      return;
    }

    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrorMsg('رقم الهاتف غير صحيح! يجب أن يكون رقماً مصرياً يبدأ بـ 01 ومكون من 11 رقماً بالضبط (مثال: 01012345678).');
      setActiveTab('basic');
      return;
    }

    if (pendingPhone.trim() && !phoneRegex.test(pendingPhone.trim())) {
      setErrorMsg('رقم الهاتف الإضافي غير صحيح! يجب أن يكون رقماً مصرياً مكون من 11 رقماً.');
      setActiveTab('basic');
      return;
    }

    if (nationalId.trim() && !/^\d{14}$/.test(nationalId.trim())) {
      setErrorMsg('الرقم القومي يجب أن يتكون من 14 رقماً باللغة الإنجليزية/الأرقام دون مسافات.');
      setActiveTab('basic');
      return;
    }

    const isAvatarChanged = avatar !== (user.avatar || rep?.avatar || '');

    const updatePayload: any = {
      name: name.trim(),
      phone: phone.trim(),
      pendingPhone: pendingPhone.trim() || undefined,
      email: email.trim(),
      governorate,
      nationalId: nationalId.trim() || undefined,
      nationalIdCardPhoto: nationalIdCardPhoto || undefined,
      nationalIdCardBackPhoto: nationalIdCardBackPhoto || undefined,
      activationFacePhoto: activationFacePhoto || undefined,
      ...(isCallerAdmin
        ? {
            avatar: avatar || undefined,
            role,
            roleTitle: roleTitle.trim(),
            referralCode: referralCode.trim(),
            targetMonth: Number(targetMonth) || 50,
            commissionRate: Number(commissionRate) || 42.86,
            status,
          }
        : {
            ...(isAvatarChanged
              ? {
                  pendingAvatar: avatar,
                  avatarPendingApproval: true,
                }
              : {}),
          }),
      ...(hasNewPassword ? { password: password.trim() } : {}),
    };

    if (onUpdateProfile) {
      onUpdateProfile(updatePayload);
    }
    if (onUpdateRep && rep) {
      onUpdateRep({
        ...rep,
        ...updatePayload,
      });
    }
    if (onSuccess) {
      onSuccess();
    }

    if (!isCallerAdmin && isAvatarChanged) {
      setSuccessMsg('تم حفظ البيانات بنجاح. تم إرسال الصورة الشخصية الجديدة للمراجعة والاعتماد من قبل الإدارة.');
    } else {
      setSuccessMsg('تم حفظ وتحديث الملف الشخصي وكافة الوثائق بنجاح على السحابة.');
    }

    setTimeout(() => {
      onClose();
    }, 1100);
  };

  const modalSubtitle = (
    <span>
      {isCallerAdmin
        ? 'إدارة صور الوثائق الرسمية، البيانات الشخصية، إعدادات الحساب والصلاحيات بالكامل'
        : 'مراجعة وتحديث صورتك الشخصية، وثائق الهوية الوطنية، وبيانات الاتصال'}
    </span>
  );

  const headerActions = (
    <Badge variant="warning" size="sm">
      {roleTitle || (role === 'admin' ? 'مدير النظام' : role === 'supervisor' ? 'مشرف إدارة' : role === 'accountant' ? 'محاسب مالي' : 'مندوب')}
    </Badge>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={isCallerAdmin ? 'تعديل الملفات والبيانات الإدارية' : 'تعديل الملف الشخصي والبيانات'}
        subtitle={modalSubtitle}
        icon={<Shield className="w-5 h-5 text-amber-500" />}
        headerActions={headerActions}
        size="lg"
      >
        <div className="space-y-4 text-xs" dir="rtl">
          {/* Feedback Alerts */}
          {successMsg && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-300 p-3 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>الوثائق والملفات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'basic'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>البيانات والاتصال</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('role')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'role'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>الرتبة والصلاحيات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>الأمان وكلمة المرور</span>
            </button>
          </div>

          {/* Modal Form Scrollable Body */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ============================================================== */}
            {/* TAB 1: OFFICIAL DOCUMENTS & PHOTOS */}
            {/* ============================================================== */}
            {activeTab === 'documents' && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. Main Avatar Box */}
                <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-md bg-[var(--bg-card)] flex items-center justify-center text-slate-950 font-black text-2xl">
                      {avatar ? (
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black">
                          <span>{name ? name.trim().charAt(0) : 'م'}</span>
                        </div>
                      )}
                    </div>

                    <label className="absolute -bottom-1.5 -right-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 p-2 rounded-xl shadow-lg border-2 border-[var(--bg-card)] cursor-pointer transition-transform active:scale-90 flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'avatar')}
                        className="hidden"
                      />
                    </label>

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        title="حذف الصورة"
                        className="absolute -top-1.5 -left-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-lg border-2 border-[var(--bg-card)] cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-right space-y-1.5">
                    <span className="text-xs font-black text-[var(--text-primary)] block">صورة الحساب والبروفايل الرسمية</span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      تظهر صورتك الشخصية في الشريط العلوي، قائمة الحسابات الإدارية، وإشعارات النظام.
                    </p>
                    <label className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isCompressing && compressingTarget === 'avatar' ? 'جاري معالجة الصورة...' : 'رفع صورة بروفايل جديدة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'avatar')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Official Identification Documents Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* ID Front */}
                  <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-2 flex flex-col justify-between text-center">
                    <div>
                      <span className="text-[11px] font-black text-[var(--text-primary)] block">بطاقة الرقم القومي (الوجه)</span>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">الصورة الأمامية الواضحة للبطاقة</p>
                    </div>

                    <div className="h-28 rounded-xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] overflow-hidden flex items-center justify-center relative group">
                      {nationalIdCardPhoto ? (
                        <>
                          <img src={nationalIdCardPhoto} alt="بطاقة الرقم القومي" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ src: nationalIdCardPhoto, title: 'بطاقة الرقم القومي (الوجه الأمامي)' })}
                              className="bg-amber-500 text-slate-950 p-1.5 rounded-lg font-bold"
                              title="معاينة وتكبير"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setNationalIdCardPhoto('')}
                              className="bg-rose-600 text-white p-1.5 rounded-lg font-bold"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-[var(--text-muted)] space-y-1">
                          <CreditCard className="w-6 h-6 mx-auto opacity-40" />
                          <span className="text-[10px] block font-bold">لم تُرفع بعد</span>
                        </div>
                      )}
                    </div>

                    <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 py-1.5 px-2 rounded-xl font-black text-[11px] cursor-pointer block transition-colors">
                      <span>{isCompressing && compressingTarget === 'idFront' ? 'جاري الرفع...' : 'رفع وجه البطاقة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'idFront')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* ID Back */}
                  <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-2 flex flex-col justify-between text-center">
                    <div>
                      <span className="text-[11px] font-black text-[var(--text-primary)] block">بطاقة الرقم القومي (الظهر)</span>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">الصورة الخلفية لبيانات البطاقة</p>
                    </div>

                    <div className="h-28 rounded-xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] overflow-hidden flex items-center justify-center relative group">
                      {nationalIdCardBackPhoto ? (
                        <>
                          <img src={nationalIdCardBackPhoto} alt="ظهر البطاقة" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ src: nationalIdCardBackPhoto, title: 'بطاقة الرقم القومي (الوجه الخلفي)' })}
                              className="bg-amber-500 text-slate-950 p-1.5 rounded-lg font-bold"
                              title="معاينة وتكبير"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setNationalIdCardBackPhoto('')}
                              className="bg-rose-600 text-white p-1.5 rounded-lg font-bold"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-[var(--text-muted)] space-y-1">
                          <CreditCard className="w-6 h-6 mx-auto opacity-40" />
                          <span className="text-[10px] block font-bold">لم تُرفع بعد</span>
                        </div>
                      )}
                    </div>

                    <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 py-1.5 px-2 rounded-xl font-black text-[11px] cursor-pointer block transition-colors">
                      <span>{isCompressing && compressingTarget === 'idBack' ? 'جاري الرفع...' : 'رفع ظهر البطاقة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'idBack')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Face Verification / Selfie */}
                  <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-2 flex flex-col justify-between text-center">
                    <div>
                      <span className="text-[11px] font-black text-[var(--text-primary)] block">إثبات الهوية الميداني</span>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">صورة شخصية رسمية / سيلفي</p>
                    </div>

                    <div className="h-28 rounded-xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] overflow-hidden flex items-center justify-center relative group">
                      {activationFacePhoto ? (
                        <>
                          <img src={activationFacePhoto} alt="إثبات الهوية الميداني" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ src: activationFacePhoto, title: 'صورة إثبات الهوية الميداني' })}
                              className="bg-amber-500 text-slate-950 p-1.5 rounded-lg font-bold"
                              title="معاينة وتكبير"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivationFacePhoto('')}
                              className="bg-rose-600 text-white p-1.5 rounded-lg font-bold"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-[var(--text-muted)] space-y-1">
                          <FileCheck className="w-6 h-6 mx-auto opacity-40" />
                          <span className="text-[10px] block font-bold">لم تُرفع بعد</span>
                        </div>
                      )}
                    </div>

                    <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 py-1.5 px-2 rounded-xl font-black text-[11px] cursor-pointer block transition-colors">
                      <span>{isCompressing && compressingTarget === 'facePhoto' ? 'جاري الرفع...' : 'رفع صورة إثبات الهوية'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'facePhoto')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: BASIC & CONTACT INFORMATION */}
            {/* ============================================================== */}
            {activeTab === 'basic' && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">الاسم الشخصي الكامل *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="مثال: أحمد عزالدين محمد"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">البريد الإلكتروني الرسمي *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@dalilaak.com"
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Primary Phone */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم الهاتف الأساسي / واتساب *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="01143888355"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                      />
                    </div>
                  </div>

                  {/* Secondary Phone */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم هاتف إضافي / بديل</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="tel"
                        placeholder="010XXXXXXXX"
                        value={pendingPhone}
                        onChange={(e) => setPendingPhone(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Governorate */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة والمنطقة الإدارية *</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                      <select
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                      >
                        {EGYPT_GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>
                            {gov}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* National ID Number */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">الرقم القومي (14 رقم)</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="29805120104892"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: ROLE & ADMINISTRATIVE SETTINGS */}
            {/* ============================================================== */}
            {activeTab === 'role' && (
              <div className="space-y-3 animate-fade-in">
                {!isCallerAdmin ? (
                  <>
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>
                        هذه الإعدادات والرتب والعمولات المالية محددة رسمياً ومعتمدة من قبل الإدارة المركزية لمنصة دليلك ولا يمكن تعديلها إلا عبر إدارة النظام.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">الرتبة والمستوى المعتمد</span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Crown className="w-4 h-4" />
                          <span>
                            {role === 'supervisor'
                              ? 'مشرف إدارة منطقة ومحافظة'
                              : role === 'accountant'
                              ? 'محاسب ومحصل فواتير'
                              : role === 'admin'
                              ? 'مدير النظام'
                              : 'مندوب مبيعات وتوثيق ميداني'}
                          </span>
                        </span>
                      </div>

                      <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">المسمى الوظيفي المعتمد</span>
                        <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-amber-500" />
                          <span>{roleTitle || 'مندوب مبيعات وتوثيق ميداني'}</span>
                        </span>
                      </div>

                      <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">كود الإحالة المعتمد</span>
                        <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          <span>{referralCode}</span>
                        </span>
                      </div>

                      <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">المستهدف الشهري</span>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          <span>{targetMonth} نشاط شهرياً</span>
                        </span>
                      </div>

                      <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">نسبة العمولة والحافز</span>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Percent className="w-4 h-4" />
                          <span>{commissionRate}%</span>
                        </span>
                      </div>

                      <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">حالة الحساب</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{status === 'active' ? 'نشط ومفعل' : 'معلق مؤقتاً'}</span>
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-primary)]">الدور والصلاحيات بالنظام</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                        >
                          <option value="admin">مدير النظام العام (Administrator)</option>
                          <option value="supervisor">مشرف إدارة وفريق (Supervisor)</option>
                          <option value="accountant">محاسب ومسؤول مالي (Accountant)</option>
                          <option value="rep">مندوب مبيعات وتوثيق ميداني (Sales Rep)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-primary)]">المسمى الوظيفي الإداري</label>
                        <input
                          type="text"
                          value={roleTitle}
                          onChange={(e) => setRoleTitle(e.target.value)}
                          placeholder="مثال: مدير العمليات الميدانية"
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-primary)]">كود الإحالة (Referral Code)</label>
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="DALIL-ADMIN"
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-primary)]">المستهدف الشهري (Target)</label>
                        <input
                          type="number"
                          value={targetMonth}
                          onChange={(e) => setTargetMonth(Number(e.target.value))}
                          placeholder="50"
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-[var(--text-primary)]">نسبة العمولة (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(Number(e.target.value))}
                          placeholder="42.86"
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)]">حالة الحساب وتفعيل الدخول</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStatus('active')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                            status === 'active'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
                          }`}
                        >
                          نشط ومفعل
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus('suspended')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                            status === 'suspended'
                              ? 'bg-rose-500 text-white font-black'
                              : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
                          }`}
                        >
                          معلق مؤقتاً
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: SECURITY & PASSWORD */}
            {/* ============================================================== */}
            {activeTab === 'security' && (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    يمكنك تعيين كلمة مرور قوية للحساب لحماية النظام وتأمين صلاحيات الدخول ومراجعة البيانات.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password Field */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">كلمة المرور الجديدة (اختياري)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="اتركها فارغة للإبقاء على الحالية"
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono text-xs rounded-xl pr-3 pl-9 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl pr-3 pl-9 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-[var(--border-color)]">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 font-black"
                icon={<Save className="w-4 h-4" />}
              >
                {isCallerAdmin ? 'حفظ وتحديث الملف الإداري بالكامل' : 'حفظ وتحديث الملف الشخصي والبيانات'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      </BaseModal>

      {/* Zoomed Document Preview Modal */}
      {previewImage && (
        <BaseModal
          isOpen={true}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
          size="lg"
          zIndex={10050}
        >
          <div className="max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-slate-950 p-2">
            <img src={previewImage.src} alt={previewImage.title} className="max-h-[70vh] w-auto object-contain rounded-lg" />
          </div>
        </BaseModal>
      )}
    </>
  );
};

export const UnifiedProfileModal = AdminProfileModal;
