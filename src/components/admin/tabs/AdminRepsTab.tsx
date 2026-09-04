import React from 'react';
import { Representative, Business, PayoutRequest, User, UserRole } from '../../../types';
import { calculateRepSettlement } from '../../../utils/commission';
import { getRepReferralCode, isReferralSystemUnlocked, isReferredByInviter, getRepReferralSummary } from '../../../utils/referral';
import { exportRepsToCsv } from '../../../utils/exportCsv';
import { UserAvatar } from '../../UserAvatar';
import {
  Users,
  ShieldCheck,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Edit,
  ChevronRight,
  ChevronLeft,
  Crown,
  Calculator,
  Briefcase,
  X,
  Eye,
} from 'lucide-react';

interface AdminRepsTabProps {
  currentUser?: User | null;
  businesses: Business[];
  mergedAdminReps: Representative[];
  filteredAccounts: Representative[];
  pagedAccounts: Representative[];
  accountSearchQuery: string;
  setAccountSearchQuery: (q: string) => void;
  accountRoleFilter: string;
  setAccountRoleFilter: (r: string) => void;
  accountStatusFilter: string;
  setAccountStatusFilter: (s: string) => void;
  accountPageSize: number;
  setAccountPageSize: (s: number) => void;
  accountPage: number;
  setAccountPage: React.Dispatch<React.SetStateAction<number>>;
  totalAccountPages: number;
  payoutRequests?: PayoutRequest[];
  onOpenAddAccountModal: () => void;
  onOpenEditAccountModal: (rep: Representative) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onShowPermissionsModal: () => void;
}

export const AdminRepsTab: React.FC<AdminRepsTabProps> = ({
  currentUser,
  businesses,
  mergedAdminReps,
  filteredAccounts,
  pagedAccounts,
  accountSearchQuery,
  setAccountSearchQuery,
  accountRoleFilter,
  setAccountRoleFilter,
  accountStatusFilter,
  setAccountStatusFilter,
  accountPageSize,
  setAccountPageSize,
  accountPage,
  setAccountPage,
  totalAccountPages,
  payoutRequests = [],
  onOpenAddAccountModal,
  onOpenEditAccountModal,
  onUpdateRepresentative,
  onShowPermissionsModal,
}) => {
  const renderRoleBadge = (role: UserRole = 'rep', customTitle?: string) => {
    let label = (customTitle || '').trim();
    if (!label || (role !== 'rep' && label === 'مندوب مبيعات ميداني')) {
      label = (
        role === 'admin' ? 'مدير النظام (أدمن)' :
        role === 'supervisor' ? 'مشرف إدارة منطقة' :
        role === 'accountant' ? 'محاسب ومحصل فواتير' : 'مندوب مبيعات ميداني'
      );
    }

    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs" title={label}>
            <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
        );
      case 'supervisor':
        return (
          <span className="bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs" title={label}>
            <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
        );
      case 'accountant':
        return (
          <span className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs" title={label}>
            <Calculator className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/15 text-blue-900 dark:text-blue-300 border border-blue-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs" title={label}>
            <Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>إدارة حسابات المناديب والمشرفين والموظفين</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              مراجعة الوثائق المرفوعة (صورة الوجه، بطاقة الرقم القومي) والتحكم في تفعيل وصلاحيات الحسابات
            </p>
          </div>

          <button
            type="button"
            onClick={onShowPermissionsModal}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs px-3.5 py-2.5 rounded-2xl border border-amber-500/30 flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            title="استعراض مصفوفة ودليل الصلاحيات والرتب"
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>دليل الصلاحيات 🛡️</span>
          </button>

          <button
            type="button"
            onClick={() => exportRepsToCsv(filteredAccounts, businesses)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
            title="تصدير بيانات الحسابات إلى Excel"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={onOpenAddAccountModal}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>إضافة حساب جديد</span>
          </button>
        </div>

        {/* Filter Controls & Page Size Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs flex-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3" />
              <input
                type="text"
                placeholder="بحث باسم الحساب، البريد، أو الهاتف..."
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl pr-8 pl-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <select
              value={accountRoleFilter}
              onChange={(e) => setAccountRoleFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="all">كل الصلاحيات ({mergedAdminReps.length})</option>
              <option value="rep">المناديب الميدانيين</option>
              <option value="supervisor">مشرفي المناطق</option>
              <option value="accountant">المحاسبين والمحصلين</option>
              <option value="admin">مديري النظام والأدمن</option>
            </select>

            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-amber-500/40 text-amber-700 dark:text-amber-300 font-extrabold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="all">كل حالات الحسابات</option>
              <option value="suspended">
                🔔 المعلقة ({mergedAdminReps.filter((r) => r.status === 'suspended').length})
              </option>
              <option value="active">✅ النشطة والمفعلة</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] font-bold text-xs shrink-0 self-start sm:self-auto">
            <span className="text-[var(--text-muted)]">عرض:</span>
            <select
              value={accountPageSize}
              onChange={(e) => setAccountPageSize(Number(e.target.value))}
              className="bg-transparent text-[var(--text-primary)] font-black focus:outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pagedAccounts.map((acc) => {
          const role = acc.role || 'rep';
          const isSuspended = acc.status === 'suspended';
          const isCurrentActiveUser = Boolean(
            currentUser && (currentUser.id === acc.id || (currentUser.email && acc.email && currentUser.email.toLowerCase() === acc.email.toLowerCase()) || currentUser.name === acc.name)
          );
          const effectiveTimestamp = isCurrentActiveUser ? Date.now() : (acc.lastActiveTimestamp ? Number(acc.lastActiveTimestamp) : 0);
          const isOnline = Boolean(
            isCurrentActiveUser || (effectiveTimestamp > 0 && (Date.now() - effectiveTimestamp < 59 * 60 * 1000))
          );

          return (
            <div
              key={acc.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-xs ${
                isSuspended
                  ? 'bg-amber-500/5 border-amber-500/40'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatar={acc.avatar}
                    name={acc.name}
                    role={acc.role}
                    avatarStatus={acc.avatarStatus}
                    size="md"
                    isAdminPreview={true}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-[var(--text-primary)]">{acc.name}</h4>
                      {isOnline ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="متواجد بالمنظومة حالياً" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-50" title="غير متصل" />
                      )}
                    </div>
                    <p className="text-xs text-amber-500 font-bold">{acc.governorate}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono dir-ltr text-right">{acc.phone}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {renderRoleBadge(role, acc.roleTitle)}
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border shadow-xs ${
                      acc.avatarStatus === 'rejected'
                        ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/50'
                        : isSuspended
                        ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/50'
                        : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {acc.avatarStatus === 'rejected' ? '🔴 مرفوض' : isSuspended ? '⏳ تحت المراجعة' : '🟢 فعال ومصرح'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)] flex flex-col gap-2 text-xs">
                {/* Financial Settlement & Cash Indicator Row */}
                {(() => {
                  const repBiz = businesses.filter((b) => b.repId === acc.id || b.repName === acc.name || b.repId === acc.phone);
                  const repReferral = getRepReferralSummary(acc, mergedAdminReps, businesses);
                  const repSettlement = calculateRepSettlement(acc.id, repBiz, acc.commissionRate || 42.86, payoutRequests, repReferral.totalNetEarnings);

                  return (
                    <div className="bg-[var(--input-bg)] p-2 rounded-xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-muted)] font-bold">أنشطة: <strong className="text-[var(--text-primary)]">{repBiz.length}</strong></span>
                        {repSettlement.totalCashInHand > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">كاش بيده: {repSettlement.totalCashInHand} ج</span>
                        )}
                      </div>

                      <div>
                        {repSettlement.isDebtToPlatform ? (
                          <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-md border border-amber-500/30">
                            ⚠️ للمنصة: {repSettlement.debtToPlatformAmount} ج.م
                          </span>
                        ) : (
                          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black px-2 py-0.5 rounded-md">
                            متاح سحب: {repSettlement.withdrawableBalance} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Referral & Mission Status Row */}
                {(() => {
                  const repBizCount = businesses.filter((b) => b.repId === acc.id || b.repName === acc.name).length;
                  const repRefCode = getRepReferralCode(acc);
                  const isRefUnlocked = isReferralSystemUnlocked(acc, repBizCount);
                  const invitedCount = mergedAdminReps.filter((r) => isReferredByInviter(r, acc)).length;

                  return (
                    <div className="bg-[var(--input-bg)] p-2 rounded-xl border border-[var(--border-color)] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className="text-[var(--text-muted)]">كود:</span>
                        <span className="text-amber-700 dark:text-amber-300">{repRefCode}</span>
                        {invitedCount > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">دعا {invitedCount}</span>
                        )}
                        {acc.referredByCode && (
                          <span className="text-[10px] text-[var(--text-muted)]">(دعاه: {acc.referredByCode})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isRefUnlocked ? 'badge-success' : 'badge-warning'}`}>
                          {isRefUnlocked ? '✨ الإحالة مفتوحة' : `🔒 مقفولة (${repBizCount}/25)`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateRepresentative) {
                              onUpdateRepresentative({
                                ...acc,
                                adminBypassReferral: !isRefUnlocked,
                                referralUnlocked: !isRefUnlocked,
                              });
                            }
                          }}
                          className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                          title="تجاوز مهام الإحالة وفتح/قفل الكود مباشرة"
                        >
                          {isRefUnlocked ? 'قفل' : 'تجاوز وتفعيل'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-1.5">
                  {isSuspended ? (
                    <>
                      <button
                        onClick={() => {
                          if (onUpdateRepresentative) onUpdateRepresentative({ ...acc, status: 'active', avatarStatus: 'approved' });
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl shadow flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[11px]"
                        title="الموافقة وتفعيل الحساب فوراً"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>قبول وتفعيل</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateRepresentative) onUpdateRepresentative({ ...acc, status: 'suspended', avatarStatus: 'rejected' });
                        }}
                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-700 dark:text-rose-300 hover:text-white font-black px-2.5 py-2 rounded-xl border border-rose-500/40 flex items-center justify-center gap-1 transition-colors cursor-pointer text-[11px]"
                        title="رفض طلب تسجيل الحساب"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                      <button
                        onClick={() => onOpenEditAccountModal(acc)}
                        className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-2.5 py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 transition-colors cursor-pointer text-[11px]"
                        title="معاينة وفحص وثائق الهوية والبيانات"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onOpenEditAccountModal(acc)}
                      className="w-full bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>تعديل ومراجعة الوثائق 📝</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accounts Pagination Controls */}
      {totalAccountPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
          <span className="text-[var(--text-muted)] font-bold">
            عرض {((accountPage - 1) * accountPageSize) + 1} إلى {Math.min(filteredAccounts.length, accountPage * accountPageSize)} من {filteredAccounts.length} حساب
          </span>

          <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              type="button"
              disabled={accountPage === 1}
              onClick={() => setAccountPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <div className="flex items-center gap-1 px-2 font-mono font-bold text-[var(--text-primary)]">
              <span>{accountPage}</span> / <span>{totalAccountPages}</span>
            </div>

            <button
              type="button"
              disabled={accountPage === totalAccountPages}
              onClick={() => setAccountPage((p) => Math.min(totalAccountPages, p + 1))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
