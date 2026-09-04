import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Representative, User, UserRole, Business } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { compressImageFile } from '../../../utils/imageCompressor';
import { canUserDeleteAccount } from '../../../utils/permissions';
import { hashPassword } from '../../../utils/crypto';
import { getRepReferralCode } from '../../../utils/referral';
import {
  UserCheck,
  ShieldCheck,
  Eye,
  FileText,
  FileSignature,
  Trash2,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface AdminAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRep: Representative | null;
  currentUser?: User | null;
  businesses: Business[];
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onDeleteRepresentative?: (id: string) => void;
  onOpenDocViewer: (type: 'field_letter' | 'digital_badge' | 'rep_contract', rep: Representative) => void;
  onPreviewAvatar: (rep: Representative) => void;
}

export const AdminAccountModal: React.FC<AdminAccountModalProps> = ({
  isOpen,
  onClose,
  editingRep,
  currentUser,
  businesses,
  onAddRepresentative,
  onUpdateRepresentative,
  onDeleteRepresentative,
  onOpenDocViewer,
  onPreviewAvatar,
}) => {
  const [modalRole, setModalRole] = useState<UserRole>('rep');
  const [modalRoleTitle, setModalRoleTitle] = useState<string>('');
  const [modalName, setModalName] = useState<string>('');
  const [modalEmail, setModalEmail] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalGov, setModalGov] = useState<string>('القاهرة');
  const [modalTarget, setModalTarget] = useState<number>(25);
  const [modalCommission, setModalCommission] = useState<number>(42.86);
  const [modalStatus, setModalStatus] = useState<'active' | 'suspended'>('active');
  const [modalPassword, setModalPassword] = useState<string>('Aa123456');
  const [modalReferralCode, setModalReferralCode] = useState<string>('');
  const [modalReferredByCode, setModalReferredByCode] = useState<string>('');
  const [modalAdminBypassReferral, setModalAdminBypassReferral] = useState<boolean>(false);

  useEffect(() => {
    if (editingRep) {
      setModalRole(editingRep.role || 'rep');
      setModalRoleTitle(
        editingRep.roleTitle ||
          (editingRep.role === 'supervisor'
            ? 'مشرف إدارة منطقة ومحافظة'
            : editingRep.role === 'accountant'
            ? 'محاسب ومحصل فواتير إلكترونية'
            : editingRep.role === 'admin'
            ? 'مدير النظام المعتمد'
            : 'مندوب مبيعات ميداني')
      );
      setModalName(editingRep.name);
      setModalEmail(editingRep.email);
      setModalPhone(editingRep.phone);
      setModalGov(editingRep.governorate || 'القاهرة');
      setModalTarget(editingRep.targetMonth || 25);
      setModalCommission(editingRep.commissionRate || 42.86);
      setModalStatus(editingRep.status || 'active');
      setModalPassword('');
      setModalReferralCode(getRepReferralCode(editingRep));
      setModalReferredByCode(editingRep.referredByCode || '');
      setModalAdminBypassReferral(Boolean(editingRep.adminBypassReferral || editingRep.referralUnlocked));
    } else {
      setModalRole('rep');
      setModalRoleTitle('مندوب مبيعات ميداني');
      setModalName('');
      setModalEmail('');
      setModalPhone('');
      setModalGov('القاهرة');
      setModalTarget(25);
      setModalCommission(42.86);
      setModalStatus('active');
      setModalPassword('Aa123456');
      setModalReferralCode(`DALIL-${Date.now().toString().slice(-4)}`);
      setModalReferredByCode('');
      setModalAdminBypassReferral(true);
    }
  }, [editingRep, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;

    const finalRoleTitle =
      modalRoleTitle.trim() ||
      (modalRole === 'supervisor'
        ? 'مشرف إدارة منطقة ومحافظة'
        : modalRole === 'accountant'
        ? 'محاسب ومحصل فواتير إلكترونية'
        : modalRole === 'admin'
        ? 'مدير النظام المعتمد'
        : 'مندوب مبيعات ميداني');

    if (editingRep) {
      if (onUpdateRepresentative) {
        let finalPassword = editingRep.password || 'Aa123456';
        if (modalPassword.trim()) {
          finalPassword = await hashPassword(modalPassword.trim());
        }
        onUpdateRepresentative({
          ...editingRep,
          name: modalName.trim(),
          email: modalEmail.trim() || editingRep.email,
          phone: modalPhone.trim() || editingRep.phone,
          governorate: modalGov,
          role: modalRole,
          roleTitle: finalRoleTitle,
          targetMonth: Number(modalTarget) || 25,
          commissionRate: Number(modalCommission) || 42.86,
          status: modalStatus,
          avatarStatus: modalStatus === 'active' ? 'approved' : (editingRep.avatarStatus || 'none'),
          password: finalPassword,
          referralCode: modalReferralCode.trim().toUpperCase() || editingRep.referralCode,
          referredByCode: modalReferredByCode.trim().toUpperCase() || undefined,
          adminBypassReferral: modalAdminBypassReferral,
          referralUnlocked: modalAdminBypassReferral,
        });
      }
    } else {
      const newRepId = `rep_${Date.now()}`;
      const finalPassword = modalPassword.trim()
        ? await hashPassword(modalPassword.trim())
        : await hashPassword('Aa123456');
      onAddRepresentative({
        id: newRepId,
        name: modalName.trim(),
        email: modalEmail.trim() || `${newRepId}@daleelek.eg`,
        phone: modalPhone.trim() || '01000000000',
        governorate: modalGov,
        role: modalRole,
        roleTitle: finalRoleTitle,
        targetMonth: Number(modalTarget) || 25,
        commissionRate: Number(modalCommission) || 42.86,
        status: modalStatus,
        password: finalPassword,
        referralCode: modalReferralCode.trim().toUpperCase() || `DALIL-${Date.now().toString().slice(-4)}`,
        referredByCode: modalReferredByCode.trim().toUpperCase() || undefined,
        adminBypassReferral: modalAdminBypassReferral,
        referralUnlocked: modalAdminBypassReferral,
      });
    }

    onClose();
  };

  const bizCount = editingRep ? businesses.filter((b) => b.repId === editingRep.id).length : 0;
  const target = editingRep?.targetMonth || 20;
  const progressPct = target > 0 ? Math.min(100, (bizCount / target) * 100) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <form
        onSubmit={handleSave}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 max-h-[95vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black border border-amber-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                {editingRep ? 'تعديل بيانات وتصاريح الحساب' : 'إضافة حساب مستخدم جديد'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                {editingRep
                  ? 'مراجعة الهوية الوطنية، الصلاحيات، والمستندات الرسمية'
                  : 'إنشاء حساب جديد وتعيين الصلاحيات والمحافظة'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {editingRep && (
            <>
              {/* ── KPI PERFORMANCE CARDS ── */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 p-3 rounded-2xl">
                <div className="text-center bg-[var(--bg-card)]/80 backdrop-blur-xs p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5">الأنشطة المسجلة</span>
                  <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {bizCount} نشاط
                  </span>
                </div>
                <div className="text-center bg-[var(--bg-card)]/80 backdrop-blur-xs p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5">المستهدف الشهري</span>
                  <span className="text-sm sm:text-base font-black text-[var(--text-primary)] font-mono">
                    {target} نشاط
                  </span>
                </div>
                <div className="text-center bg-[var(--bg-card)]/80 backdrop-blur-xs p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5">نسبة الإنجاز</span>
                  <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                    {progressPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* ── KYC & IDENTITY DOCUMENTS SHOWCASE ── */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3.5 sm:p-4 rounded-3xl space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                      مراجعة وثائق الهوية والتحقق الرسمية (KYC)
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    مطلوب للاعتماد
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Face Verification Photo */}
                  <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-2.5 hover:border-amber-500/30 transition-all shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-1">
                        <span>📸</span>
                        <span>صورة الوجه الرسمية</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          editingRep.activationFacePhoto || editingRep.avatar
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {editingRep.activationFacePhoto || editingRep.avatar ? 'مرفقة ✓' : 'غير مرفقة ✕'}
                      </span>
                    </div>

                    {(() => {
                      const facePhoto = editingRep.activationFacePhoto || editingRep.avatar;
                      return facePhoto ? (
                        <div className="relative group aspect-square max-h-32 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-amber-500/30 flex items-center justify-center shadow-xs">
                          <img
                            src={facePhoto}
                            alt="صورة الوجه"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onPreviewAvatar({ ...editingRep, avatar: facePhoto })}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3 h-3" />
                              <span>تكبير</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square max-h-32 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center text-[var(--text-muted)] gap-1">
                          <UserCheck className="w-6 h-6 opacity-40" />
                          <span className="text-[10px] font-bold">لا توجد صورة شخصية</span>
                        </div>
                      );
                    })()}

                    <label className="text-[10.5px] bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] hover:text-amber-600 font-extrabold py-2 px-2.5 rounded-xl border border-[var(--border-color)] text-center cursor-pointer block transition-colors shadow-2xs">
                      <span>📷 {editingRep.activationFacePhoto || editingRep.avatar ? 'استبدال الصورة' : 'إرفاق صورة الوجه'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && onUpdateRepresentative) {
                            try {
                              const compressed = await compressImageFile(file, 800, 800, 0.85, { applyWatermark: false });
                              onUpdateRepresentative({
                                ...editingRep,
                                activationFacePhoto: compressed,
                              });
                            } catch {}
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* 2. National ID Card Photo (Front) */}
                  <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-2.5 hover:border-blue-500/30 transition-all shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-1">
                        <span>🪪</span>
                        <span>بطاقة الرقم القومي (الوجه)</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          editingRep.nationalIdCardPhoto
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {editingRep.nationalIdCardPhoto ? 'أمامي ✓' : 'غير مرفق ✕'}
                      </span>
                    </div>

                    {editingRep.nationalIdCardPhoto ? (
                      <div className="relative group aspect-[16/10] max-h-32 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-blue-500/30 flex items-center justify-center shadow-xs">
                        <img
                          src={editingRep.nationalIdCardPhoto}
                          alt="وجه البطاقة الأمامي"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreviewAvatar({ ...editingRep, avatar: editingRep.nationalIdCardPhoto })}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Eye className="w-3 h-3" />
                            <span>تكبير</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] max-h-32 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center text-[var(--text-muted)] gap-1">
                        <FileText className="w-6 h-6 opacity-40" />
                        <span className="text-[10px] font-bold">الوجه الأمامي غير مرفق</span>
                      </div>
                    )}

                    <label className="text-[10.5px] bg-[var(--input-bg)] hover:bg-blue-500/15 text-[var(--text-primary)] hover:text-blue-600 font-extrabold py-2 px-2.5 rounded-xl border border-[var(--border-color)] text-center cursor-pointer block transition-colors shadow-2xs">
                      <span>📎 {editingRep.nationalIdCardPhoto ? 'استبدال الوجه' : 'إرفاق وجه البطاقة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && onUpdateRepresentative) {
                            try {
                              const compressed = await compressImageFile(file, 1200, 1200, 0.85, { applyWatermark: false });
                              onUpdateRepresentative({
                                ...editingRep,
                                nationalIdCardPhoto: compressed,
                              });
                            } catch {}
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* 3. National ID Card Photo (Back) */}
                  <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-2.5 hover:border-purple-500/30 transition-all shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-1">
                        <span>🔄</span>
                        <span>بطاقة الرقم القومي (الظهر)</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          editingRep.nationalIdCardBackPhoto
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {editingRep.nationalIdCardBackPhoto ? 'خلفي ✓' : 'غير مرفق ✕'}
                      </span>
                    </div>

                    {editingRep.nationalIdCardBackPhoto ? (
                      <div className="relative group aspect-[16/10] max-h-32 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-purple-500/30 flex items-center justify-center shadow-xs">
                        <img
                          src={editingRep.nationalIdCardBackPhoto}
                          alt="ظهر البطاقة الخلفي"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreviewAvatar({ ...editingRep, avatar: editingRep.nationalIdCardBackPhoto })}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Eye className="w-3 h-3" />
                            <span>تكبير</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] max-h-32 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center text-[var(--text-muted)] gap-1">
                        <FileText className="w-6 h-6 opacity-40" />
                        <span className="text-[10px] font-bold">الظهر الخلفي غير مرفق</span>
                      </div>
                    )}

                    <label className="text-[10.5px] bg-[var(--input-bg)] hover:bg-purple-500/15 text-[var(--text-primary)] hover:text-purple-600 font-extrabold py-2 px-2.5 rounded-xl border border-[var(--border-color)] text-center cursor-pointer block transition-colors shadow-2xs">
                      <span>📎 {editingRep.nationalIdCardBackPhoto ? 'استبدال الظهر' : 'إرفاق ظهر البطاقة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && onUpdateRepresentative) {
                            try {
                              const compressed = await compressImageFile(file, 1200, 1200, 0.85);
                              onUpdateRepresentative({
                                ...editingRep,
                                nationalIdCardBackPhoto: compressed,
                              });
                            } catch {}
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ── ACCOUNT APPROVAL & STATUS CONTROLS ── */}
              <div className={`p-4 rounded-3xl border space-y-3 transition-all ${
                modalStatus === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-black text-xs sm:text-sm text-[var(--text-primary)] block">
                      حالة اعتماد وصلاحية الحساب في المنظومة
                    </span>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                      {modalStatus === 'active'
                        ? '🟢 الحساب معتمد ومفعل بالكامل ويحق له تسجيل الدخول وتوثيق الأنشطة.'
                        : '⏳ الحساب معلق وبانتظار موافقة الإدارة بعد مراجعة وثائق الهوية (KYC).'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {modalStatus !== 'active' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setModalStatus('active');
                            if (editingRep && onUpdateRepresentative) {
                              onUpdateRepresentative({ ...editingRep, status: 'active', avatarStatus: 'approved' });
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>اعتماد وتفعيل الحساب فوراً 🟢</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalStatus('suspended');
                            if (editingRep && onUpdateRepresentative) {
                              onUpdateRepresentative({ ...editingRep, status: 'suspended', avatarStatus: 'rejected' });
                            }
                          }}
                          className="bg-rose-500/20 hover:bg-rose-500 text-rose-700 dark:text-rose-300 hover:text-white font-black text-xs py-2 px-3 rounded-xl border border-rose-500/40 cursor-pointer transition-colors"
                        >
                          <span>رفض الحساب 🔴</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setModalStatus('suspended');
                          if (editingRep && onUpdateRepresentative) {
                            onUpdateRepresentative({ ...editingRep, status: 'suspended' });
                          }
                        }}
                        className="bg-amber-500/20 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl border border-amber-500/40 cursor-pointer transition-colors"
                      >
                        <span>تعليق الحساب مؤقتاً ⏳</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── OFFICIAL DOCUMENTS & LEGAL CREDENTIALS ── */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3.5 rounded-3xl space-y-2.5">
                <label className="block text-[var(--text-primary)] font-black text-xs">
                  📂 الأوراق الثبوتية وتصاريح العمل الرسمية للمندوب
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDocViewer('field_letter', editingRep)}
                    className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] hover:text-amber-600 font-extrabold text-xs p-3 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>تصريح العمل الميداني</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDocViewer('digital_badge', editingRep)}
                    className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] hover:text-amber-600 font-extrabold text-xs p-3 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    <span>كارنيه الهوية الرقمية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDocViewer('rep_contract', editingRep)}
                    className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] hover:text-amber-600 font-extrabold text-xs p-3 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <FileSignature className="w-4 h-4 text-amber-500" />
                    <span>عقد الانضمام والعمل</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── ACCOUNT SETTINGS & PERMISSIONS FORM ── */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3.5 sm:p-4 rounded-3xl space-y-3 shadow-xs">
            <div className="border-b border-[var(--border-color)] pb-2">
              <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                ⚙️ البيانات الأساسية والصلاحيات
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Account Role */}
              <div className="sm:col-span-2">
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">
                  نوع وتصنيف الحساب والصلاحية *
                </label>
                <select
                  value={modalRole}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setModalRole(newRole);
                    if (newRole === 'supervisor') setModalRoleTitle('مشرف إدارة منطقة ومحافظة');
                    else if (newRole === 'accountant') setModalRoleTitle('محاسب ومحصل فواتير إلكترونية');
                    else if (newRole === 'admin') setModalRoleTitle('مدير النظام المعتمد');
                    else setModalRoleTitle('مندوب مبيعات ميداني');
                  }}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-extrabold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                >
                  <option value="rep">💼 مندوب مبيعات ميداني (تسجيل المحلات والتحصيل)</option>
                  <option value="supervisor">👑 مشرف إدارة منطقة ومحافظة</option>
                  <option value="accountant">🧾 محاسب ومحصل فواتير إلكترونية</option>
                  <option value="admin">🛡️ مدير النظام (أدمن بجميع الصلاحيات)</option>
                </select>
              </div>

              {/* Role Title */}
              <div className="sm:col-span-2">
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">
                  المسمى الوظيفي المعتمد (الظاهر في الكارنيه، والبطاقة، والمنظومة) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مشرف منطقة ومحافظة / مندوب مبيعات أول"
                  value={modalRoleTitle}
                  onChange={(e) => setModalRoleTitle(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">الاسم الثلاثي *</label>
                <input
                  type="text"
                  required
                  placeholder="مصطفى علي محمود"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">رقم الهاتف للتواصل *</label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxx"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-xs"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">البريد الإلكتروني للدخول</label>
                <input
                  type="email"
                  placeholder="user@dalelak.eg"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Governorate */}
              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">المحافظة / النطاق *</label>
                <select
                  value={modalGov}
                  onChange={(e) => setModalGov(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Target & Commission */}
              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">المستهدف الشهري (عدد أنشطة)</label>
                <input
                  type="number"
                  min={1}
                  value={modalTarget}
                  onChange={(e) => setModalTarget(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">نسبة العمولة (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={modalCommission}
                  onChange={(e) => setModalCommission(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs font-mono"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">حالة الحساب *</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                >
                  <option value="active">✅ نشط ومصرح له بالعمل</option>
                  <option value="suspended">⏳ معلق وبانتظار المراجعة</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">
                  {editingRep ? 'تغيير كلمة المرور (اختياري)' : 'كلمة المرور *'}
                </label>
                <input
                  type="text"
                  required={!editingRep}
                  placeholder={editingRep ? 'اتركها فارغة للإبقاء على الحالية' : 'Aa123456'}
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Referral Settings Section */}
          <div className="bg-[var(--bg-surface)] p-3.5 sm:p-4 rounded-3xl border border-[var(--border-color)] space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>إعدادات نظام الإحالة والدعوة الميدانية</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={modalAdminBypassReferral}
                  onChange={(e) => setModalAdminBypassReferral(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-400"
                />
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">تجاوز المهام وفتح كود الدعوة فوراً</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[var(--text-muted)] text-[11px] font-bold mb-1">كود الإحالة الخاص بالمندوب:</label>
                <input
                  type="text"
                  value={modalReferralCode}
                  onChange={(e) => setModalReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-mono font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] text-[11px] font-bold mb-1">كود المندوب الذي دعاه (إن وجد):</label>
                <input
                  type="text"
                  placeholder="مثال: DALIL-7711"
                  value={modalReferredByCode}
                  onChange={(e) => setModalReferredByCode(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-mono font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-color)]">
          {editingRep && canUserDeleteAccount(currentUser) && onDeleteRepresentative && (
            <button
              type="button"
              onClick={() => {
                if (confirm('هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً من المنظومة؟')) {
                  onDeleteRepresentative(editingRep.id);
                  onClose();
                }
              }}
              className="bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 font-black px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف الحساب</span>
            </button>
          )}

          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              {editingRep ? 'حفظ التعديلات' : 'إنشاء وتفعيل الحساب'}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
};
