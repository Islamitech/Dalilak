import React from 'react';
import { PayoutRequest, Representative, User } from '../../../types';
import { PAYOUT_METHOD_LABELS } from '../../../utils/commission';
import { isSuperAdmin } from '../../../utils/permissions';
import {
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
  DollarSign,
  Check,
  X,
  MessageCircle,
  Eye,
  FileCheck,
  Trash2,
} from 'lucide-react';

interface AdminPayoutsTabProps {
  payoutRequests: PayoutRequest[];
  representatives: Representative[];
  payoutFilter: 'all' | 'pending' | 'approved' | 'rejected';
  setPayoutFilter: (filter: 'all' | 'pending' | 'approved' | 'rejected') => void;
  onOpenPayoutActionModal: (payout: PayoutRequest, action: 'approve' | 'reject') => void;
  onSelectReceiptPhoto: (photo: string) => void;
  onInspectRep?: (rep: Representative) => void;
  currentUser?: User | null;
  onDeletePayout?: (id: string) => void;
}

export const AdminPayoutsTab: React.FC<AdminPayoutsTabProps> = ({
  payoutRequests = [],
  representatives = [],
  payoutFilter,
  setPayoutFilter,
  onOpenPayoutActionModal,
  onSelectReceiptPhoto,
  onInspectRep,
  currentUser,
  onDeletePayout,
}) => {
  const filteredPayouts = payoutRequests.filter((p) => payoutFilter === 'all' || p.status === payoutFilter);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Summary & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[var(--bg-card)] border border-amber-500/40 p-4 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
            <span>الطلبات المعلقة قيد التحويل</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-500 font-mono">
            {payoutRequests.filter((p) => p.status === 'pending').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()} <span className="text-xs">ج.م</span>
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-bold">
            {payoutRequests.filter((p) => p.status === 'pending').length} طلب بانتظار الاعتماد
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border border-emerald-500/40 p-4 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-500 font-bold">
            <span>إجمالي العمولات المصروفة</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-500 font-mono">
            {payoutRequests.filter((p) => p.status === 'approved').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()} <span className="text-xs">ج.م</span>
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-bold">
            {payoutRequests.filter((p) => p.status === 'approved').length} حوالة مكتملة
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>إجمالي طلبات السحب المسجلة</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)] font-mono">
            {payoutRequests.length}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-bold">
            من جميع المناديب الميدانيين
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border-color)] text-xs flex-wrap">
        <span className="font-bold text-[var(--text-muted)] px-2 text-[11px]">تصفية الطلبات:</span>
        {[
          { key: 'all', label: `الكل (${payoutRequests.length})` },
          { key: 'pending', label: `قيد المراجعة ⏳ (${payoutRequests.filter((p) => p.status === 'pending').length})` },
          { key: 'approved', label: `تم الصرف والتحويل ✅ (${payoutRequests.filter((p) => p.status === 'approved').length})` },
          { key: 'rejected', label: `مرفوضة ❌ (${payoutRequests.filter((p) => p.status === 'rejected').length})` },
        ].map((f) => (
          <button
            type="button"
            key={f.key}
            onClick={() => setPayoutFilter(f.key as any)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              payoutFilter === f.key
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Payouts List */}
      {filteredPayouts.length > 0 ? (
        <div className="space-y-2.5">
          {filteredPayouts.map((payout) => {
            const rep = representatives.find((r) => r.id === payout.repId);
            const isPending = payout.status === 'pending';
            const formattedPhone = (payout.repPhone || '').replace(/^0/, '');
            const waUrl = `https://wa.me/20${formattedPhone}?text=${encodeURIComponent(
              `مرحباً زميلنا ${payout.repName}، بخصوص طلب سحب العمولة بقيمة ${payout.amount} ج.م...`
            )}`;
            const isRemittance = payout.type === 'remittance';
            const repToInspect = rep || {
              id: payout.repId,
              name: payout.repName,
              phone: payout.repPhone || '',
              role: 'rep' as const,
              governorate: 'الجيزة',
              targetMonth: 25,
              commissionRate: 42.86,
              status: 'active' as const,
            };

            return (
              <div
                key={payout.id}
                className={`bg-[var(--bg-card)] border rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors ${
                  isRemittance ? 'border-blue-500/40 hover:border-blue-500' : 'border-[var(--border-color)] hover:border-amber-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      isRemittance ? 'bg-blue-500/15 text-blue-500' : 'bg-emerald-500/15 text-emerald-500'
                    }`}>
                      {isRemittance ? <CreditCard className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-[var(--text-primary)]">
                          {payout.repName}
                        </h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          isRemittance 
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                        }`}>
                          {isRemittance ? '📥 إشعار سداد وتوريد للمنصة' : '💵 طلب سحب عمولة'}
                        </span>
                        {rep && (
                          <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {rep.roleTitle || `مندوب ${rep.governorate}`}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          • {new Date(payout.requestDate).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                        رقم المندوب: <span className="font-mono font-bold">{payout.repPhone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-black text-lg ${
                      isRemittance ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {payout.amount.toLocaleString()} ج.م
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                      payout.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : payout.status === 'rejected'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse-subtle'
                    }`}>
                      {payout.status === 'approved'
                        ? isRemittance ? 'تم اعتماد السداد ✅' : 'تم الصرف والتحويل ✅'
                        : payout.status === 'rejected'
                        ? 'مرفوض ❌'
                        : 'قيد المراجعة ⏳'}
                    </span>
                  </div>
                </div>

                {/* Details & Transfer info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold">
                      {isRemittance ? 'وسيلة السداد المستخدمة:' : 'وسيلة الاستلام والتحويل:'}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {PAYOUT_METHOD_LABELS[payout.method]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold">
                      {isRemittance ? 'رقم الحساب / المحفظة المحول منها أو إليها:' : 'رقم المحفظة / معرف إنستاباي:'}
                    </span>
                    <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                      {payout.accountDetails}
                    </span>
                  </div>
                  {payout.transactionRef && (
                    <div className="sm:col-span-2">
                      <span className="text-[var(--text-muted)] block text-[10px] font-bold">رقم المعاملة / الحوالة المسجلة:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {payout.transactionRef}
                      </span>
                    </div>
                  )}

                  {/* Receipt Photo Section */}
                  {payout.receiptPhoto && (
                    <div className="sm:col-span-2 bg-[var(--bg-card)] p-2.5 rounded-xl border border-amber-500/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={payout.receiptPhoto}
                          alt="صورة إيصال التحويل"
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-600 bg-slate-900 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onSelectReceiptPhoto(payout.receiptPhoto!)}
                        />
                        <div>
                          <p className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>مرفق صورة إيصال المعاملة الرسمية</span>
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            انقر على الصورة لمعاينتها وتكبيرها بدقة كاملة
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectReceiptPhoto(payout.receiptPhoto!)}
                        className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة الإيصال</span>
                      </button>
                    </div>
                  )}

                  {payout.adminNotes && (
                    <div className="sm:col-span-2">
                      <span className="text-[var(--text-muted)] block text-[10px] font-bold">ملاحظات الإدارة:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{payout.adminNotes}</p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {payout.repPhone && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>مراسلة واتساب</span>
                      </a>
                    )}

                    {onInspectRep && (
                      <button
                        type="button"
                        onClick={() => onInspectRep(repToInspect)}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 font-black px-3.5 py-1.5 rounded-xl border border-amber-500/40 flex items-center gap-1.5 text-xs transition-transform active:scale-95 cursor-pointer shadow-xs"
                        title="استعراض حالة المندوب، كشف الحساب والأنشطة المسجلة"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        <span>استعراض حالة المندوب 👤</span>
                      </button>
                    )}

                    {isSuperAdmin(currentUser) && onDeletePayout && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`⚠️ تأكيد الحذف النهائي:\nهل أنت متأكد من رغبتك في حذف هذا الطلب / المعاملة المالية نهائياً من المنظومة وقاعدة البيانات؟\nالمبلغ: ${payout.amount} ج.م - المندوب: ${payout.repName}`)) {
                            onDeletePayout(payout.id);
                          }
                        }}
                        className="bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-black px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                        title="حذف نهائي بات للمعاملة من قاعدة البيانات (حصري للـ Super Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف المعاملة 🗑️</span>
                      </button>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 mr-auto">
                      <button
                        type="button"
                        onClick={() => onOpenPayoutActionModal(payout, 'reject')}
                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white font-black px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isRemittance ? 'رفض السداد' : 'رفض الطلب'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenPayoutActionModal(payout, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 text-xs transition-transform active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{isRemittance ? 'اعتماد استلام السداد' : 'اعتماد وصرف الحوالة'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 text-center space-y-2">
          <DollarSign className="w-10 h-10 text-amber-500/50 mx-auto" />
          <p className="font-black text-sm text-[var(--text-primary)]">لا توجد طلبات سحب أو إشعارات سداد مطابقة للتصفية</p>
          <p className="text-xs text-[var(--text-muted)]">عند قيام المناديب بطلب سحب عمولاتهم أو تسجيل إيصالات سداد، ستظهر الطلبات هنا فورياً.</p>
        </div>
      )}
    </div>
  );
};
