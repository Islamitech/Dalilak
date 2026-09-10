import React, { useState } from 'react';
import { Business, AdditionalServiceInvoice, AdminFollowUpCategory } from '../../types';
import { AdminReceiptModal } from '../admin/modals/AdminReceiptModal';
import { ConfirmDialog } from '../ui';
import { AddServiceInvoiceModal } from '../modals/AddServiceInvoiceModal';
import { ContextualFollowUpStrip } from './ContextualFollowUpStrip';
import { DollarSign } from 'lucide-react';
import {
  PackageSelectionSection,
  AdditionalInvoicesSection,
  PaymentReceiptSection,
  FinancialWhatsAppMessagesSection,
} from './finance';

export interface EditPackagePaymentTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  isEditMode: boolean;
  isAdminOrFinancial: boolean;
  canEdit: boolean;
  remainingDebt: number;
  handleToggleFeeExempt: (isExempt: boolean) => void;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
  onSaveAdditionalInvoice?: (newInv: AdditionalServiceInvoice) => void;
  onDeleteAdditionalInvoice?: (invoiceId: string) => void;
  onPayAdditionalInvoice?: (invoiceId: string) => void;
  copiedField?: string | null;
  handleCopyText?: (text: string, fieldName: string) => void;
  currentUserName?: string;
  currentUserId?: string;
  currentUserRole?: string;
  onSave?: (biz: Business) => void;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditPackagePaymentTab: React.FC<EditPackagePaymentTabProps> = ({
  formData,
  setFormData,
  isEditMode,
  isAdminOrFinancial,
  canEdit,
  remainingDebt,
  handleToggleFeeExempt,
  onShowInvoice,
  onSaveAdditionalInvoice,
  onDeleteAdditionalInvoice,
  onPayAdditionalInvoice,
  copiedField,
  handleCopyText,
  currentUserName,
  currentUserId,
  currentUserRole,
  onSave,
  onOpenMasterDrawer,
  onShowNotification,
}) => {
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<AdditionalServiceInvoice | null>(null);
  const [invoiceToPay, setInvoiceToPay] = useState<AdditionalServiceInvoice | null>(null);
  const [selectedReceiptPreview, setSelectedReceiptPreview] = useState<string | null>(null);
  const [showConfirmRemoveReceipt, setShowConfirmRemoveReceipt] = useState(false);

  return (
    <div className="space-y-3.5 text-right">
      {/* 1. Core Package, Exemption & Payment Method */}
      <PackageSelectionSection
        formData={formData}
        setFormData={setFormData}
        isEditMode={isEditMode}
        isAdminOrFinancial={isAdminOrFinancial}
        canEdit={canEdit}
        remainingDebt={remainingDebt}
        handleToggleFeeExempt={handleToggleFeeExempt}
      />

      {/* 2. Additional Service Invoices List & Actions */}
      <AdditionalInvoicesSection
        formData={formData}
        isAdminOrFinancial={isAdminOrFinancial}
        onOpenAddInvoiceModal={() => setShowAddInvoiceModal(true)}
        onPayClick={(inv) => setInvoiceToPay(inv)}
        onDeleteClick={(inv) => setInvoiceToDelete(inv)}
        onShowInvoice={onShowInvoice}
      />

      {/* 3. Payment Receipt Upload & Preview */}
      <PaymentReceiptSection
        formData={formData}
        setFormData={setFormData}
        canEdit={canEdit}
        onPreviewReceipt={(url) => setSelectedReceiptPreview(url)}
        onRemoveReceiptClick={() => setShowConfirmRemoveReceipt(true)}
      />

      {/* 4. Financial & Legal WhatsApp Messages */}
      {isAdminOrFinancial && (
        <FinancialWhatsAppMessagesSection
          formData={formData}
          remainingDebt={remainingDebt}
          copiedField={copiedField}
          handleCopyText={handleCopyText}
        />
      )}

      {/* Modal for issuing a new additional service invoice */}
      <AddServiceInvoiceModal
        business={formData}
        isOpen={showAddInvoiceModal}
        onClose={() => setShowAddInvoiceModal(false)}
        onSaveInvoice={(newInv) => {
          if (onSaveAdditionalInvoice) {
            onSaveAdditionalInvoice(newInv);
          } else {
            setFormData((prev) => {
              if (!prev) return prev;
              const existing = prev.additionalInvoices || [];
              return {
                ...prev,
                additionalInvoices: [newInv, ...existing],
              };
            });
          }
        }}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
      />

      {/* Confirm Pay Additional Invoice */}
      <ConfirmDialog
        isOpen={Boolean(invoiceToPay)}
        title="تأكيد سداد الفاتورة الإضافية"
        message={`هل تم استلام وتحصيل مبلغ (${Math.max(
          0,
          (invoiceToPay?.amount || 0) - (invoiceToPay?.amountPaid || 0)
        )} ج.م) لحساب المنصة إلكترونياً عن فاتورة "${
          invoiceToPay?.serviceTitle
        }"؟ سيتم خصم المبلغ فورياً من إجمالي المديونية وتحديث الحسابات.`}
        confirmLabel="تأكيد السداد والتحصيل ✓"
        cancelLabel="إلغاء"
        variant="warning"
        onConfirm={() => {
          if (!invoiceToPay) return;
          if (onPayAdditionalInvoice) {
            onPayAdditionalInvoice(invoiceToPay.id);
          } else {
            setFormData((prev) => {
              if (!prev) return prev;
              const existing = prev.additionalInvoices || [];
              return {
                ...prev,
                additionalInvoices: existing.map((inv) =>
                  inv.id === invoiceToPay.id
                    ? {
                        ...inv,
                        amountPaid: inv.amount,
                        paymentStatus: 'fully_paid',
                        paymentMethod: 'platform_collected',
                      }
                    : inv
                ),
              };
            });
          }
          setInvoiceToPay(null);
        }}
        onCancel={() => setInvoiceToPay(null)}
      />

      {/* Confirm Delete Additional Invoice */}
      <ConfirmDialog
        isOpen={Boolean(invoiceToDelete)}
        title="حذف فاتورة الخدمة الإضافية"
        message={`هل أنت متأكد من حذف فاتورة "${invoiceToDelete?.serviceTitle}" بقيمة ${invoiceToDelete?.amount} ج.م؟ سيتم خصمها من التحصيل العام للمنظومة.`}
        confirmLabel="حذف الفاتورة"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => {
          if (!invoiceToDelete) return;
          if (
            invoiceToDelete.paymentStatus === 'fully_paid' ||
            (invoiceToDelete.amountPaid || 0) > 0
          ) {
            setInvoiceToDelete(null);
            return;
          }
          if (onDeleteAdditionalInvoice) {
            onDeleteAdditionalInvoice(invoiceToDelete.id);
          } else {
            setFormData((prev) => {
              if (!prev) return prev;
              const existing = prev.additionalInvoices || [];
              return {
                ...prev,
                additionalInvoices: existing.filter((inv) => inv.id !== invoiceToDelete.id),
              };
            });
          }
          setInvoiceToDelete(null);
        }}
        onCancel={() => setInvoiceToDelete(null)}
      />

      {/* Lightbox Modal for Receipt Photo Preview */}
      <AdminReceiptModal
        receiptPhoto={selectedReceiptPreview}
        onClose={() => setSelectedReceiptPreview(null)}
      />

      {/* Confirm remove receipt dialog */}
      <ConfirmDialog
        isOpen={showConfirmRemoveReceipt}
        title="حذف إيصال السداد"
        message="هل أنت متأكد من حذف صورة إيصال السداد المرفقة؟"
        confirmLabel="حذف الإيصال"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => {
          setFormData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              paymentReceiptPhoto: undefined,
              paymentReceiptDate: undefined,
            };
          });
          setShowConfirmRemoveReceipt(false);
        }}
        onCancel={() => setShowConfirmRemoveReceipt(false)}
      />

      {/* CONTEXTUAL CRM FOLLOW-UP STRIP FOR FINANCE */}
      {onSave && (
        <ContextualFollowUpStrip
          category="finance"
          categoryLabel="الحسابات والمالية والفواتير"
          categoryIcon={<DollarSign className="w-3.5 h-3.5 text-amber-500" />}
          business={formData}
          onSave={onSave}
          setFormData={setFormData}
          currentUserName={currentUserName}
          currentUserId={currentUserId}
          userRole={currentUserRole}
          onOpenMasterDrawer={onOpenMasterDrawer}
          onShowNotification={onShowNotification}
        />
      )}
    </div>
  );
};
