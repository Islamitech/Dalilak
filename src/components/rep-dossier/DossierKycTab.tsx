import React from 'react';
import { Representative, UserRole } from '../../types';
import { isReferredByInviter } from '../../utils/referral';
import {
  Percent,
  FileText,
  Eye,
  Users,
} from 'lucide-react';

export interface DossierKycTabProps {
  rep: Representative;
  allReps: Representative[];
  editingCommRate: number;
  setEditingCommRate: (r: number) => void;
  editingRoleTitle: string;
  setEditingRoleTitle: (t: string) => void;
  isSavingRate: boolean;
  onSaveCommissionRate: () => void;
  onChangeRole: (role: UserRole) => void;
  onSelectPhoto: (photo: string) => void;
  canManageRoles: boolean;
}

export const DossierKycTab: React.FC<DossierKycTabProps> = ({
  rep,
  allReps,
  editingCommRate,
  setEditingCommRate,
  editingRoleTitle,
  setEditingRoleTitle,
  isSavingRate,
  onSaveCommissionRate,
  onChangeRole,
  onSelectPhoto,
  canManageRoles,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Commission Rate & Role Setting */}
        <div className="bg-[var(--input-bg)] p-4 rounded-3xl border border-[var(--border-color)] space-y-3">
          <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
            <Percent className="w-4 h-4 text-amber-500" />
            <span>إعدادات نسبة العمولة والرتبة</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[var(--text-muted)] mb-1">
                نسبة العمولة الميدانية المعتمدة (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  disabled={!canManageRoles || isSavingRate}
                  value={editingCommRate}
                  onChange={(e) => setEditingCommRate(Number(e.target.value))}
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-sm rounded-xl p-2 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                />
                {canManageRoles && (
                  <button
                    type="button"
                    disabled={isSavingRate}
                    onClick={onSaveCommissionRate}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {isSavingRate ? 'جاري...' : 'حفظ النسبة'}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">النسبة الافتراضية للنظام هي 42.86% (107 ج من باقة الـ 250 ج).</p>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-muted)] mb-1">
                المسمى الوظيفي المعتمد (يظهر في الهوية وكافة الوثائق):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="مثال: مشرف منطقة ومحافظة / مدير توثيق ميداني..."
                  disabled={!canManageRoles || isSavingRate}
                  value={editingRoleTitle}
                  onChange={(e) => setEditingRoleTitle(e.target.value)}
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                />
                {canManageRoles && (
                  <button
                    type="button"
                    disabled={isSavingRate}
                    onClick={onSaveCommissionRate}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer text-xs shrink-0 disabled:opacity-60"
                  >
                    حفظ المسمى
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-muted)] mb-1">
                رتبة الحساب والصلاحيات:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!canManageRoles}
                  onClick={() => onChangeRole('rep')}
                  className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer disabled:opacity-60 ${
                    rep.role === 'rep'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/40'
                  }`}
                >
                  مندوب ميداني
                </button>
                <button
                  type="button"
                  disabled={!canManageRoles}
                  onClick={() => onChangeRole('supervisor')}
                  className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer disabled:opacity-60 ${
                    rep.role === 'supervisor'
                      ? 'bg-blue-600 text-white border-blue-400 font-black shadow-xs'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-blue-500/40'
                  }`}
                >
                  مشرف منطقة
                </button>
                <button
                  type="button"
                  disabled={!canManageRoles}
                  onClick={() => onChangeRole('accountant')}
                  className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer disabled:opacity-60 ${
                    rep.role === 'accountant'
                      ? 'bg-teal-600 text-white border-teal-400 font-black shadow-xs'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-teal-500/40'
                  }`}
                >
                  محاسب مالي
                </button>
                <button
                  type="button"
                  disabled={!canManageRoles}
                  onClick={() => onChangeRole('admin')}
                  className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer disabled:opacity-60 ${
                    rep.role === 'admin'
                      ? 'bg-purple-600 text-white border-purple-400 font-black shadow-xs'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-purple-500/40'
                  }`}
                >
                  مدير نظام
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Documents & National ID */}
        <div className="bg-[var(--input-bg)] p-4 rounded-3xl border border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
            <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>وثائق الهوية والتسجيل المرفوعة (KYC)</span>
            </h4>
            <span className="text-[10px] text-[var(--text-muted)] font-bold">
              اضغط على أي صورة لتكبيرها وفحصها
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Face Photo */}
            <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] text-center space-y-1.5 group">
              <span className="text-[10px] font-bold text-[var(--text-muted)] block">1. صورة الوجه التوثيقية</span>
              {rep.activationFacePhoto ? (
                <div
                  onClick={() => onSelectPhoto(rep.activationFacePhoto!)}
                  className="relative h-28 rounded-xl overflow-hidden border border-slate-700 cursor-pointer"
                  title="اضغط للتكبير"
                >
                  <img
                    src={rep.activationFacePhoto}
                    alt="صورة الوجه التوثيقية"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">
                  غير مرفوعة
                </div>
              )}
            </div>

            {/* Front ID Card Photo */}
            <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] text-center space-y-1.5 group">
              <span className="text-[10px] font-bold text-[var(--text-muted)] block">2. بطاقة الرقم القومي (الوجه)</span>
              {rep.nationalIdCardPhoto ? (
                <div
                  onClick={() => onSelectPhoto(rep.nationalIdCardPhoto!)}
                  className="relative h-28 rounded-xl overflow-hidden border border-slate-700 cursor-pointer"
                  title="اضغط للتكبير"
                >
                  <img
                    src={rep.nationalIdCardPhoto}
                    alt="بطاقة الرقم القومي - الوجه"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">
                  غير مرفوعة
                </div>
              )}
            </div>

            {/* Back ID Card Photo */}
            <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] text-center space-y-1.5 group">
              <span className="text-[10px] font-bold text-[var(--text-muted)] block">3. بطاقة الرقم القومي (الظهر)</span>
              {rep.nationalIdCardBackPhoto ? (
                <div
                  onClick={() => onSelectPhoto(rep.nationalIdCardBackPhoto!)}
                  className="relative h-28 rounded-xl overflow-hidden border border-slate-700 cursor-pointer"
                  title="اضغط للتكبير"
                >
                  <img
                    src={rep.nationalIdCardBackPhoto}
                    alt="بطاقة الرقم القومي - الظهر"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">
                  غير مرفوعة
                </div>
              )}
            </div>
          </div>

          {/* National ID details row */}
          <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] font-mono text-[11px] flex items-center justify-between">
            <span className="text-[var(--text-muted)] font-bold">الرقم القومي المسجل:</span>
            <span className="font-black text-[var(--text-primary)] text-xs tracking-wider">{rep.nationalId || 'غير مسجل'}</span>
          </div>

          {/* Referral Link & Inviter info */}
          {rep.referredByCode && (
            <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-purple-700 font-bold block">انضم بدعوة من:</span>
                  <span className="font-black text-[var(--text-primary)]">
                    {(() => {
                      const inviter = allReps.find((r) => isReferredByInviter(rep, r));
                      return inviter ? `${inviter.name} (${inviter.phone})` : 'مندوب معتمد (كود مباشر)';
                    })()}
                  </span>
                </div>
              </div>
              <span className="font-mono font-black bg-[var(--bg-card)] px-2.5 py-1 rounded-lg border border-purple-500/30 text-purple-700 text-[11px]">
                {rep.referredByCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
