import React from 'react';
import { Representative } from '../../types';
import { RepSettlementSummary } from '../../utils/commission';
import { RepReferralSummary } from '../../utils/referral';
import { UserAvatar } from '../UserAvatar';
import {
  CheckCircle2,
  X,
  Phone,
  Mail,
  MapPin,
  Store,
  DollarSign,
  Users,
  ShieldCheck,
} from 'lucide-react';

export interface DossierHeaderProps {
  rep: Representative;
  onClose: () => void;
  repBusinessesCount: number;
  totalRevenue: number;
  verifiedCount: number;
  exemptCount: number;
  settlement: RepSettlementSummary;
  referralSummary: RepReferralSummary;
  effectiveRate: number;
  activeTab: 'activities' | 'ledger' | 'referrals' | 'kyc';
  setActiveTab: (tab: 'activities' | 'ledger' | 'referrals' | 'kyc') => void;
  onToggleStatus?: () => void;
  onRejectAccount?: () => void;
  canUpdateRep: boolean;
}

export const DossierHeader: React.FC<DossierHeaderProps> = ({
  rep,
  onClose,
  repBusinessesCount,
  totalRevenue,
  verifiedCount,
  exemptCount,
  settlement,
  referralSummary,
  effectiveRate,
  activeTab,
  setActiveTab,
  onToggleStatus,
  onRejectAccount,
  canUpdateRep,
}) => {
  return (
    <>
      {/* ── 1. MODAL HEADER & REP IDENTITY ─────────────────────────────────── */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <UserAvatar
            avatar={rep.avatar}
            name={rep.name}
            role={rep.role}
            avatarStatus={rep.avatarStatus}
            size="lg"
            isAdminPreview={true}
          />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-white truncate">
                {rep.name}
              </h3>
              <span
                className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30"
                title={rep.roleTitle}
              >
                {rep.roleTitle ||
                  (rep.role === 'admin'
                    ? 'مدير نظام'
                    : rep.role === 'supervisor'
                    ? 'مشرف منطقة'
                    : rep.role === 'accountant'
                    ? 'محاسب'
                    : 'مندوب ميداني')}
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  rep.status === 'suspended'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {rep.status === 'suspended' ? 'تحت المراجعة' : 'حساب مفعل'}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-300">
              <span className="flex items-center gap-1 font-bold">
                <Phone className="w-3 h-3 text-amber-400" />
                <span className="font-mono dir-ltr">{rep.phone}</span>
              </span>
              {rep.email && (
                <span className="flex items-center gap-1 font-bold">
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span className="font-mono">{rep.email}</span>
                </span>
              )}
              <span className="flex items-center gap-1 font-bold">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{rep.governorate || 'الجيزة'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {canUpdateRep && onToggleStatus && (
            <button
              type="button"
              onClick={onToggleStatus}
              className={`text-xs font-black px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                rep.status === 'suspended'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{rep.status === 'suspended' ? 'قبول وتفعيل الحساب' : 'تعليق الحساب'}</span>
            </button>
          )}

          {canUpdateRep && onRejectAccount && rep.status === 'suspended' && rep.avatarStatus !== 'rejected' && (
            <button
              type="button"
              onClick={onRejectAccount}
              className="text-xs font-black px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="رفض طلب تسجيل الحساب"
            >
              <X className="w-3.5 h-3.5" />
              <span>رفض الحساب</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── 2. TOP FINANCIAL & RECONCILIATION KPI RIBBON ─────────────────────── */}
      <div className="bg-[var(--bg-surface)] p-3 sm:p-4 border-b border-[var(--border-color)] shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
          {/* 1. Total Businesses */}
          <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">أنشطة مسجلة</span>
            <span className="font-black text-base text-[var(--text-primary)] font-mono block">
              {repBusinessesCount} <span className="text-[10px]">نشاط</span>
            </span>
            <span className="text-[9px] text-emerald-600 font-bold block">
              {verifiedCount} موثق • {exemptCount} معفى
            </span>
          </div>

          {/* 2. Total Collected Revenue */}
          <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي الإيراد المحصل</span>
            <span className="font-black text-base text-emerald-600 font-mono block">
              {totalRevenue.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] block">من فواتير الأنشطة</span>
          </div>

          {/* 3. Physical Cash in Hand */}
          <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">كاش محصل باليد</span>
            <span className="font-black text-base text-blue-600 font-mono block">
              {settlement.totalCashInHand.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] block">مقبوضات نقدية في الشارع</span>
          </div>

          {/* 4. Total Earned Commissions */}
          <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/30 space-y-0.5">
            <span className="text-[10px] text-amber-800 font-black block">إجمالي العمولات المستحقة</span>
            <span className="font-black text-base text-amber-600 font-mono block">
              {settlement.totalEarnedCommission.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-amber-700/80 font-bold block">
              {effectiveRate}% عمولة أساسية + إحالة
            </span>
          </div>

          {/* 5. Approved Payouts Paid Out */}
          <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">حوالات تم صرفها</span>
            <span className="font-black text-base text-indigo-600 font-mono block">
              {settlement.totalPaidOut.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] block">محافظ / إنستاباي / بنك</span>
          </div>

          {/* 6. Net Financial Status (Debt or Withdrawable) */}
          <div
            className={`p-2.5 rounded-2xl border space-y-0.5 ${
              settlement.isDebtToPlatform
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-700'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700'
            }`}
          >
            <span className="text-[10px] font-black block">
              {settlement.isDebtToPlatform ? 'عهدة كاش للتوريد' : 'رصيد متاح للسحب'}
            </span>
            <span className="font-black text-base font-mono block">
              {settlement.isDebtToPlatform
                ? settlement.debtToPlatformAmount.toLocaleString()
                : settlement.withdrawableBalance.toLocaleString()}{' '}
              <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] font-bold block opacity-90">
              {settlement.isDebtToPlatform ? 'مطلوب توريدها للمنصة' : 'جاهز للصرف فوراً'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. SUB-TABS NAVIGATION ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-2 bg-[var(--input-bg)] border-b border-[var(--border-color)] overflow-x-auto shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'activities'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>الأنشطة الميدانية المسجلة ({repBusinessesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>كشف الحساب والتسوية النقدية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'referrals'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>شبكة المناديب المحالة ({referralSummary.totalInvitedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'kyc'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>الوثائق ونسبة العمولة والصلاحيات</span>
        </button>
      </div>
    </>
  );
};
