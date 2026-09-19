import React from 'react';
import { OverlayLayer } from './ui/OverlayLayer';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Business, User } from '../types';
import {
  X,
  Save,
  Building2,
  MapPin,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  useBusinessEditForm,
  EditGeneralInfoTab,
  EditLocationTab,
  EditMediaTab,
  EditPackagePaymentTab,
  MediaLightboxModal,
} from './business-edit';

export interface BusinessEditModalProps {
  business: Business | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave?: (updatedBusiness: Business) => void;
  currentUser?: User | null;
  userRole?: string;
  currentRoleTitle?: string;
  currentUserName?: string;
  currentUserId?: string;
  initialTab?: string;
  canEdit?: boolean;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
  onCollectPayment?: (business: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  businesses?: Business[];
}

export const BusinessEditModal: React.FC<BusinessEditModalProps> = ({
  business,
  isOpen,
  onClose,
  onSave,
  currentUser,
  currentUserName: explicitUserName,
  initialTab,
}) => {
  const form = useBusinessEditForm({
    business,
    isOpen,
    onClose,
    onSave,
    currentUserName: explicitUserName || currentUser?.name,
    initialTab,
  });

  if (!form.isModalOpen || !business) return null;

  const tabs = [
    { id: 'basic', label: 'البيانات الأساسية', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'location', label: 'العنوان والموقع', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'media', label: `الوسائط والفيديو (${form.formData.photos?.length || 0})`, icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'finance', label: `المالية والباقة (${form.formData.additionalInvoices?.length ? `+${form.formData.additionalInvoices.length} فواتير` : 'الاعتماد'})`, icon: <CreditCard className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <OverlayLayer className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-['Tajawal',sans-serif] animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/95">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">تعديل وتحديث بيانات المنشأة</h3>
                {form.formData.verificationStatus === 'verified' && (
                  <span className="bg-emerald-500/15 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>معتمد</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {form.formData.nameAr || business.nameAr} • كود: {business.id}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="إغلاق (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-white overflow-x-auto text-xs font-bold shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => form.setActiveTab(tab.id as any)}
              className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                form.activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {form.errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{form.errorMsg}</span>
          </div>
        )}
        {form.mediaNotice && (
          <div className="mx-5 mt-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{form.mediaNotice}</span>
          </div>
        )}
        {form.isSavedSuccess && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تم حفظ وتحديث بيانات المنشأة بنجاح تام!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={form.handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {form.activeTab === 'basic' && <EditGeneralInfoTab {...form} />}
          {form.activeTab === 'location' && <EditLocationTab {...form} />}
          {form.activeTab === 'media' && <EditMediaTab {...form} />}
          {form.activeTab === 'finance' && <EditPackagePaymentTab {...form} business={business} />}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer">
              إلغاء التعديلات
            </button>
            <button type="submit" className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95">
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد التعديلات</span>
            </button>
          </div>
        </form>
      </div>

      <MediaLightboxModal photoUrl={form.previewLightbox} onClose={() => form.setPreviewLightbox(null)} />

      <ConfirmDialog
        isOpen={Boolean(form.invoiceToDeleteId)}
        title="إلغاء الفاتورة الإضافية"
        message="هل أنت متأكد من رغبتك في إلغاء وحذف هذه الفاتورة الإضافية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف الفاتورة"
        cancelLabel="تراجع"
        variant="danger"
        onConfirm={form.confirmDeleteAdditionalInvoice}
        onCancel={() => form.setInvoiceToDeleteId(null)}
      />
    </OverlayLayer>
  );
};
