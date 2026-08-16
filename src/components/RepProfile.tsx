import React, { useState } from 'react';
import { Representative, User } from '../types';
import { calculateTotalRepCommission } from '../utils/commission';
import { compressImageFile } from '../utils/imageCompressor';
import { DocViewerModal, DocType } from './DocViewerModal';
import { UserAvatar } from './UserAvatar';
import { Logo } from './Logo';
import {
  User as UserIcon,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Lock,
  Download,
  Printer,
  QrCode,
  CheckCircle2,
  Award,
  Key,
  LogOut,
  Edit3,
  Save,
  Briefcase,
  AlertCircle,
  Percent,
  Upload,
  Camera,
  UploadCloud
} from 'lucide-react';

interface RepProfileProps {
  user: User;
  rep: Representative;
  businessesCount: number;
  totalRevenue: number;
  totalCommission: number;
  onLogout: () => void;
  onUpdateRep: (updatedRep: Representative) => void;
  isExternalView?: boolean;
}

export const RepProfile: React.FC<RepProfileProps> = ({
  user,
  rep,
  businessesCount,
  totalRevenue,
  totalCommission,
  onLogout,
  onUpdateRep,
  isExternalView = false,
}) => {
  // Document Viewer Modal State
  const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);

  // Edit Profile Data Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(rep.name);
  const [editPhone, setEditPhone] = useState<string>(rep.phone);
  const [editEmail, setEditEmail] = useState<string>(rep.email);
  const [editNationalId, setEditNationalId] = useState<string>(rep.nationalId || '29805120104892');
  const [editAvatar, setEditAvatar] = useState<string>(rep.avatar);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  // Payout Settings State
  const [payoutVoda, setPayoutVoda] = useState<string>(rep.phone);
  const [payoutInsta, setPayoutInsta] = useState<string>(`${rep.email.split('@')[0]}@instapay`);
  const [savedPayoutNotice, setSavedPayoutNotice] = useState<boolean>(false);

  // Password Security State
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordNotice, setPasswordNotice] = useState<boolean>(false);

  const repCode = `REP-2026-${rep.id.replace(/\D/g, '') || '084'}`;
  const commissionPercentage = rep.commissionRate || 42.86;
  
  // Dynamic QR Code URL for the digital ID card
  const qrUrl = `${window.location.origin}/?view=rep&id=${rep.id}`;
  const qrData = encodeURIComponent(qrUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;

  // Handle Edit Profile Form Submission with Strict Egyptian Validation Rules
  const handleSaveProfileData = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Rule 1: Name validation
    if (!editName || editName.trim().length < 6) {
      setValidationError('يجب إدخال الاسم ثلاثي على الأقل (أكثر من 6 أحرف).');
      return;
    }

    // Rule 2: Egyptian Phone Number validation (11 digits starting with 01)
    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phoneRegex.test(editPhone)) {
      setValidationError('رقم الهاتف غير صحيح! يجب أن يكون رقم مصري يبدأ بـ 01 ومكون من 11 رقم بالضبط (مثال: 01012345678).');
      return;
    }

    // Rule 3: Egyptian National ID validation (14 digits)
    const nationalIdRegex = /^\d{14}$/;
    if (!nationalIdRegex.test(editNationalId)) {
      setValidationError('الرقم القومي غير صحيح! يجب أن يتكون من 14 رقم قومي مصري بالضبط.');
      return;
    }

    // Update Avatar Status: If avatar changed, mark as pending_approval for Admin approval
    const isNewAvatar = editAvatar !== rep.avatar && editAvatar.length > 0;

    onUpdateRep({
      ...rep,
      name: editName,
      phone: editPhone,
      email: editEmail,
      nationalId: editNationalId,
      avatar: editAvatar || rep.avatar,
      avatarStatus: isNewAvatar ? 'pending_approval' : rep.avatarStatus || 'none',
    });

    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
    setShowEditModal(false);
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedPayoutNotice(true);
    setTimeout(() => setSavedPayoutNotice(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    onUpdateRep({ ...rep, password: newPassword });
    setPasswordNotice(true);
    setNewPassword('');
    setTimeout(() => setPasswordNotice(false), 3000);
  };

  if (isExternalView) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-amber-950/70 to-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6 text-white transform hover:scale-[1.02] transition-transform duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="icon" />
              <h3 className="font-black text-sm text-white">بطاقة التكليف الميداني الرقمية</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>معتمد رسمياً</span>
            </span>
          </div>

          {/* Body */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/80 p-5 rounded-2xl border border-amber-500/30 shadow-inner">
            <img src={qrImageUrl} alt="QR Code" className="w-28 h-28 rounded-2xl border border-amber-500/50 bg-white p-2 shrink-0 shadow-lg" />
            <div className="space-y-1.5 text-center sm:text-right w-full">
              <p className="font-black text-amber-300 text-xl">{rep.name}</p>
              <p className="text-slate-300 font-bold text-sm">{rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-xs mt-1">
                <MapPin className="w-4 h-4" />
                <span>نطاق العمل: {rep.governorate}</span>
              </div>
              <p className="text-xs text-emerald-400 font-black dir-ltr sm:text-right pt-2 border-t border-slate-800 mt-2">ID: {repCode}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 text-center font-bold leading-relaxed shadow-sm">
            يسمح لحامل هذه البطاقة الرسمية بتمثيل شركة دليلك في المعاينات الميدانية وتوثيق الأنشطة وإصدار الفواتير المعتمدة.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Success Notification Banner */}
      {updateSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>تم استيفاء الشروط والضوابط وتحديث بيانات المندوب بنجاح في المنظومة الرسمية!</span>
          </div>
          <button onClick={() => setUpdateSuccess(false)}>✕</button>
        </div>
      )}

      {/* Avatar Rejection Alert Banner */}
      {rep.avatarStatus === 'rejected' && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border-2 border-rose-500 text-white p-4.5 rounded-3xl flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0 shadow">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-black text-sm text-rose-200">⚠️ تم رفض الصورة الشخصية من مدير النظام</h4>
              <p className="text-xs text-slate-100 font-bold mt-0.5">يمكنك الآن التقاط صورة سيلفي جديدة أو اختيار صورة رسمية معتمدة من الاستوديو.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditName(rep.name);
              setEditPhone(rep.phone);
              setEditEmail(rep.email);
              setEditNationalId(rep.nationalId || '29805120104892');
              setEditAvatar('');
              setShowEditModal(true);
            }}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs cursor-pointer shadow-lg transition-transform active:scale-95 shrink-0"
          >
            رفع صورة جديدة الآن
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <UserAvatar
              avatar={rep.avatar}
              name={rep.name}
              role={rep.role}
              avatarStatus={rep.avatarStatus}
              size="lg"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 z-10" title="نشط ومصرح" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{rep.name}</h2>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>مندوب معتمد</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'} • محافظة {rep.governorate}
            </p>
            <div className="flex items-center gap-3 text-[11px] font-mono text-amber-400 font-bold mt-1">
              <span>كود المندوب: {repCode}</span>
              <span>الرقم القومي: {rep.nationalId || '29805120104892'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(rep.name);
              setEditPhone(rep.phone);
              setEditEmail(rep.email);
              setEditNationalId(rep.nationalId || '29805120104892');
              setEditAvatar(rep.avatar);
              setValidationError(null);
              setShowEditModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-2xl shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 stroke-[2.5]" />
            <span>تعديل البيانات (بشروط)</span>
          </button>

          <button
            onClick={onLogout}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-600 dark:text-rose-300 font-bold text-xs px-3.5 py-2.5 rounded-2xl border border-rose-500/30 flex items-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>الخروج</span>
          </button>
        </div>
      </div>

      {/* Grid: Digital ID Card & Dynamic Percentage Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Official Digital Field ID Card */}
        <div className="bg-gradient-to-br from-slate-900 via-amber-950/70 to-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="icon" />
              <h3 className="font-black text-xs sm:text-sm text-white">بطاقة التكليف الميداني الرقمية</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              صريحة وموثقة 2026
            </span>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-2xl border border-amber-500/30">
            <img src={qrImageUrl} alt="QR Code" className="w-20 h-20 rounded-xl border border-amber-500/30 bg-white p-1 shrink-0" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-amber-300 text-sm">{rep.name}</p>
              <p className="text-slate-300 font-medium">{rep.roleTitle || 'مندوب ميداني معتمد'}</p>
              <p className="text-slate-400">النطاق: {rep.governorate}</p>
              <p className="text-[10px] text-emerald-400 font-bold dir-ltr text-right">ID: {repCode}</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-200 text-center font-medium">
            يسمح بحامل هذه البطاقة بتسجيل المحلات وتوثيق المعاينات الميدانية وإصدار فواتير دليلك الرسمية.
          </div>
        </div>

        {/* 2. Dynamic Percentage Commission Earnings Info */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h3 className="font-black text-sm text-[var(--text-primary)]">حساب العمولات والأرباح بالنسية المئوية (%)</h3>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Percent className="w-3 h-3 text-emerald-500" />
              <span>عمولتك المعتمدة {commissionPercentage}%</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)] block text-[10px] font-bold">أنشطتك المسجلة:</span>
              <span className="text-lg font-black text-[var(--text-primary)]">{businessesCount} نشاط</span>
            </div>

            <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
              <span className="text-[var(--text-muted)] block text-[10px] font-bold">عمولتك المستحقة ({commissionPercentage}%):</span>
              <span className="text-lg font-black text-emerald-500">{totalCommission} ج.م</span>
            </div>
          </div>

          {/* Form: Commission Payout Account */}
          <form onSubmit={handleSavePayout} className="space-y-3 text-xs pt-1">
            <div>
              <label className="block text-[var(--text-primary)] font-bold mb-1">رقم فودافون كاش لتحويل العمولات:</label>
              <input
                type="text"
                value={payoutVoda}
                onChange={(e) => setPayoutVoda(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-500 font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-bold mb-1">معرف انستاباي (InstaPay Handle):</label>
              <input
                type="text"
                value={payoutInsta}
                onChange={(e) => setPayoutInsta(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-500 font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedPayoutNotice ? (
                <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>تم حفظ وسائل التحويل بنجاح!</span>
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow transition-colors cursor-pointer"
              >
                حفظ بيانات التحويل
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Official Field Documents List */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 space-y-4 shadow-md transition-colors duration-300">
        <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <FileText className="w-5 h-5 text-amber-500" />
          <span>المستندات والوثائق الميدانية الرسمية الخاصة بك</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Doc 1 */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-sm">
            <div className="space-y-1">
              <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                خطاب رسمي
              </span>
              <h4 className="font-bold text-[var(--text-primary)] text-sm">خطاب التكليف والتصريح الميداني</h4>
              <p className="text-[11px] text-[var(--text-muted)]">تصريح رسمي للمعاينة وتأكيد الملكية في محلات المحافظة.</p>
            </div>
            <button
              onClick={() => setSelectedDocType('field_letter')}
              className="bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-300 hover:text-slate-950 font-bold py-2 rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>عرض واستخراج الخطاب</span>
            </button>
          </div>

          {/* Doc 2 */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-sm">
            <div className="space-y-1">
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                إثبات الهوية
              </span>
              <h4 className="font-bold text-[var(--text-primary)] text-sm">بطاقة الهوية الوظيفية الرقمية</h4>
              <p className="text-[11px] text-[var(--text-muted)]">بطاقة رقمية مشفرة بكود QR لإبرازها للعملاء بالشركات.</p>
            </div>
            <button
              onClick={() => setSelectedDocType('digital_badge')}
              className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-300 hover:text-slate-950 font-bold py-2 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>عرض وتحميل الكارت الرقمي</span>
            </button>
          </div>

          {/* Doc 3 */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-sm">
            <div className="space-y-1">
              <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                لائحة العمولات (%)
              </span>
              <h4 className="font-bold text-[var(--text-primary)] text-sm">عقد وااشتراطات التسجيل والعمولة</h4>
              <p className="text-[11px] text-[var(--text-muted)]">لائحة حقوق المندوب والعمولة المئوية المعتمدة ({commissionPercentage}%).</p>
            </div>
            <button
              onClick={() => setSelectedDocType('rep_contract')}
              className="bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold py-2 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>عرض العقد واللائحة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Password Change Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 space-y-4 shadow-md max-w-xl mx-auto transition-colors duration-300">
        <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <Key className="w-5 h-5 text-amber-500" />
          <span>تغيير كلمة المرور وحماية حساب المندوب</span>
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">البريد الإلكتروني للدخول:</label>
            <input
              type="text"
              readOnly
              value={rep.email}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-muted)] rounded-xl p-3 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">كلمة المرور الجديدة:</label>
            <input
              type="password"
              placeholder="أدخل كلمة المرور الجديدة..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {passwordNotice ? (
              <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>تم تغيير كلمة المرور بنجاح!</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow transition-colors cursor-pointer"
            >
              تحديث كلمة المرور
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: EDIT REP PROFILE DATA WITH STRICT VALIDATION */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProfileData} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 space-y-4 text-xs my-auto shadow-2xl text-[var(--text-primary)] transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <h3 className="font-black text-sm text-[var(--text-primary)]">تعديل بيانات المندوب (بشروط وضوابط إدارية)</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
            </div>

            {validationError && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 p-3 rounded-xl flex items-start gap-2 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-1">اسم المندوب كاملاً (ثلاثي) *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Egyptian Phone Number */}
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-1">رقم الهاتف المصرح (11 رقم مصري يبدأ بـ 01) *</label>
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-500 font-mono rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm"
                />
              </div>

              {/* National ID */}
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-1">الرقم القومي (14 رقم قومي مصري) *</label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  placeholder="29805120104892"
                  value={editNationalId}
                  onChange={(e) => setEditNationalId(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-500 font-mono rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-1">البريد الإلكتروني المعتمد *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Profile Photo Upload Section */}
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-1">رفع أو التقاط الصورة الشخصية (بانتظار موافقة مدير النظام):</label>
                
                <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center gap-3">
                  <UserAvatar avatar={editAvatar} name={rep.name} role={rep.role} avatarStatus={rep.avatarStatus} size="md" />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Direct Selfie Camera Capture */}
                      <label className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl cursor-pointer inline-flex items-center gap-1 shadow-sm transition-transform active:scale-95">
                        <Camera className="w-3.5 h-3.5" />
                        <span>📸 التقاط كاميرا السيلفي</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file, 400, 400, 0.8);
                                setEditAvatar(compressed);
                              } catch (err) {}
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>

                      {/* File Upload from Device */}
                      <label className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-[11px] px-3 py-1.5 rounded-xl cursor-pointer inline-flex items-center gap-1 shadow-sm">
                        <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                        <span>📁 الاستوديو</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file, 400, 400, 0.8);
                                setEditAvatar(compressed);
                              } catch (err) {}
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>

                    <p className="text-[10px] text-[var(--text-muted)] font-bold">
                      {rep.avatarStatus === 'approved'
                        ? '✅ صورتك الشخصية معتمدة رسمياً من مدير النظام.'
                        : rep.avatarStatus === 'rejected'
                        ? '❌ تم رفض الصورة السابقة من مدير النظام. يمكنك التقاط صورة جديدة بالكاميرا أو اختيار صورة رسمية الآن.'
                        : rep.avatarStatus === 'pending_approval'
                        ? '🔒 تبقى الصورة قيد المراجعة حتى موافقة مدير النظام.'
                        : '📸 يمكنك التقاط صورة شخصية جديدة بسيلفي الكاميرا أو رفعها من الجهاز.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Locked Admin Fields Notice */}
              <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] space-y-1">
                <p className="font-bold text-amber-500">🔒 ضوابط وقواعد الأمان الميداني:</p>
                <p>• لا يمكن تغيير المحافظة ({rep.governorate}) أو كود المندوب ({repCode}) إلا بطلب إداري رسمي من مدير النظام لمنع التزوير.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl shadow cursor-pointer"
              >
                حفظ البيانات المصرحة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DOCUMENT VIEWER MODAL */}
      <DocViewerModal
        docType={selectedDocType}
        rep={rep}
        onClose={() => setSelectedDocType(null)}
      />
    </div>
  );
};
