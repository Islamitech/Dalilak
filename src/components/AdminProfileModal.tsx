import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Representative, UserRole } from '../types';
import { EGYPT_GOVERNORATES } from '../data/mockData';
import { compressImageFile } from '../utils/imageCompressor';
import { hashPassword } from '../utils/crypto';
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
  CreditCard,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  MapPin,
  Award,
  Hash,
  Crown,
  Briefcase,
  AlertTriangle,
  FileCheck,
  Percent,
  TrendingUp,
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

    let finalPassword = rep?.password;
    if (hasNewPassword) {
      finalPassword = await hashPassword(password.trim());
    }

    // Strict Role & Permission Security Guard: Non-admins cannot alter their role, status, or commission
    const isCallerAdmin = user.role === 'admin';

    onUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      pendingPhone: pendingPhone.trim() || undefined,
      governorate: governorate,
      nationalId: nationalId.trim() || undefined,
      role: isCallerAdmin ? role : (user.role || 'rep'),
      roleTitle: isCallerAdmin ? (roleTitle.trim() || undefined) : (rep?.roleTitle || undefined),
      referralCode: referralCode.trim().toUpperCase() || undefined,
      targetMonth: isCallerAdmin ? (Number(targetMonth) || 25) : (rep?.targetMonth || 25),
      commissionRate: isCallerAdmin ? (Number(commissionRate) || 42.86) : (rep?.commissionRate || 42.86),
      status: isCallerAdmin ? status : (rep?.status || 'active'),
      password: finalPassword,
      avatar: avatar,
      avatarStatus: 'approved',
      nationalIdCardPhoto: nationalIdCardPhoto || undefined,
      nationalIdCardBackPhoto: nationalIdCardBackPhoto || undefined,
      activationFacePhoto: activationFacePhoto || undefined,
    });

    setSuccessMsg('🎉 تم حفظ وتحديث الملف الإداري وكافة الوثائق بنجاح على السحابة!');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto relative max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
                <span>تعديل الملفات والبيانات الإدارية</span>
                <span className="bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                  {roleTitle || (role === 'admin' ? 'مدير النظام' : role === 'supervisor' ? 'مشرف إدارة' : role === 'accountant' ? 'محاسب مالي' : 'مندوب')}
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                إدارة صور الوثائق الرسمية، البيانات الشخصية، إعدادات الحساب والصلاحيات بالكامل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold transition-colors cursor-pointer border border-[var(--border-color)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-300 p-3 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] text-xs font-bold shrink-0 overflow-x-auto">
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

          {user.role === 'admin' && (
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
          )}

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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
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

                  <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 py-1.5 px-2 rounded-xl font-black text-[11px] cursor-pointer block transition-colors">
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

                  <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 py-1.5 px-2 rounded-xl font-black text-[11px] cursor-pointer block transition-colors">
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

                  <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 py-1.5 px-2 rounded-xl font-black text-[11px] cursor-pointer block transition-colors">
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
                      placeholder="مثال: Ahmed Ezalden"
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
          {/* TAB 3: ROLE & ADMINISTRATIVE SETTINGS (STRICT ADMIN ONLY) */}
          {/* ============================================================== */}
          {activeTab === 'role' && user.role === 'admin' && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* User Role */}
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">الرتبة والمستوى الإداري *</label>
                  <div className="relative">
                    <Crown className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      <option value="admin">مدير النظام (Admin) - صلاحيات كاملة</option>
                      <option value="supervisor">مشرف منطقة (Supervisor)</option>
                      <option value="accountant">محاسب ومحصل مالي (Accountant)</option>
                      <option value="rep">مندوب مبيعات ميداني (Field Rep)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Role Title */}
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">المسمى الوظيفي المعتمد</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="مثال: مدير العمليات الميدانية"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Referral Code */}
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">كود الإحالة الخاص بالمسؤول</label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="DALIL-ADMIN"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-black font-mono rounded-xl pr-9 pl-3 py-2.5 uppercase focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Monthly Target */}
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">الهدف الشهري (نشاط/شهر)</label>
                  <div className="relative">
                    <TrendingUp className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                    <input
                      type="number"
                      min={1}
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(Number(e.target.value))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Commission Rate */}
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">نسبة العمولة والحافز (%)</label>
                  <div className="relative">
                    <Percent className="w-4 h-4 text-amber-500 absolute right-3 top-3" />
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block font-bold mb-1 text-[var(--text-primary)]">حالة النشاط الإداري للحساب</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500 font-black shadow-xs'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>نشط ومعتمد رسمياً (Active)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('suspended')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      status === 'suspended'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500 font-black shadow-xs'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>معلق وموقوف مؤقتاً (Suspended)</span>
                  </button>
                </div>
              </div>
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
                  يمكنك تعيين كلمة مرور قوية للحساب الإداري لحماية النظام والبيانات وتأمين صلاحيات المراجعة والإشراف.
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
                      className="absolute left-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
          <div className="flex gap-2 pt-3 border-t border-[var(--border-color)] shrink-0">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5 text-xs"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ وتحديث الملف الإداري بالكامل على السحابة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold py-3 px-5 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>

      {/* Zoomed Document Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-xl w-full p-4 space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="font-black text-sm text-[var(--text-primary)]">{previewImage.title}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-black"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-slate-950">
              <img src={previewImage.src} alt={previewImage.title} className="max-h-[75vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
