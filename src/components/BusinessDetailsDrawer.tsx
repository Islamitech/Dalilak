import React, { useState, useEffect } from 'react';
import { Drawer } from './design-system/Drawer';
import {
  Business,
  User,
  VerificationStatus,
  PaymentStatus,
  AdditionalServiceInvoice,
  AdminFollowUpNote
} from '../types';
import { Pencil, Trash2, Check, X, Building2, MapPin, Phone, Clock, FileText, DollarSign, UserCheck, ShieldCheck } from 'lucide-react';
import { EGYPT_GOVERNORATES, BUSINESS_CATEGORIES } from '../data/mockData';
import { ConfirmDialog } from './ui';
import { isTrendingFreeActivity, isUnpaidActivity } from '../utils/categoryMatcher';
import { setDynamicSEO, resetSEO } from '../utils/seoHelper';

// Subcomponents matching prototype UX/UI
import { DrawerHeroHeader } from './business-drawer/DrawerHeroHeader';
import { QuickActionBar } from './business-drawer/QuickActionBar';
import { DrawerInfoTab } from './business-drawer/DrawerInfoTab';
import { DrawerAdminTab } from './business-drawer/DrawerAdminTab';
import { DrawerNotesTab } from './business-drawer/DrawerNotesTab';
import { DrawerDirectoryTab } from './business-drawer/DrawerDirectoryTab';
import { DrawerWhatsAppTab } from './business-drawer/DrawerWhatsAppTab';
import { ConditionalVerificationAlert } from './business-drawer/ConditionalVerificationAlert';
import { AddServiceInvoiceModal } from './business-drawer/AddServiceInvoiceModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { InvoiceModal } from './InvoiceModal';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { VideoPlayerModal } from './VideoPlayerModal';
import { BusinessEditModal } from './BusinessEditModal';

export interface BusinessDetailsDrawerProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  onShowInvoice?: (biz: Business, additionalInvoiceId?: string) => void;
  onCollectPayment?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdateBusiness?: (biz: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  currentUser?: User | null;
  initialTab?: string;
}

export const BusinessDetailsDrawer: React.FC<BusinessDetailsDrawerProps> = ({
  business,
  isOpen,
  onClose,
  onShowInvoice,
  onCollectPayment,
  onEditBusiness,
  onUpdateBusiness,
  onDeleteBusiness,
  currentUser,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'admin' | 'notes' | 'directory' | 'whatsapp'>('info');
  const [newNoteText, setNewNoteText] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Modals state
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isGmapsModalOpen, setIsGmapsModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAddServiceInvoiceModalOpen, setIsAddServiceInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<AdditionalServiceInvoice | null>(null);

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (business && isOpen) {
      setDynamicSEO({ business });
      setIsEditModalOpen(false);
      if (initialTab) {
        if (initialTab === 'payment' || initialTab === 'admin') {
          setActiveTab('admin');
        } else if (initialTab === 'admin_followup' || initialTab === 'notes') {
          setActiveTab('notes');
        } else if (initialTab === 'directory') {
          setActiveTab('directory');
        } else if (initialTab === 'whatsapp') {
          setActiveTab('whatsapp');
        } else if (initialTab === 'edit') {
          setIsEditModalOpen(true);
        }
      }
    }
    return () => {
      resetSEO();
    };
  }, [business, isOpen, initialTab]);

  if (!business) return null;

  const isGuest = !currentUser || currentUser.role === 'guest';
  const userRole = (currentUser?.role || 'guest') as string;
  const userName = currentUser?.name || (isGuest ? 'زائر' : 'مستخدم النظام');
  const isManagerial = Boolean(currentUser && ['admin', 'supervisor', 'accountant'].includes(userRole));
  const isOwnerRep = Boolean(currentUser && userRole === 'rep' && (business.repId === currentUser?.id || business.repName === currentUser?.name));
  const canEdit = isManagerial || isOwnerRep;
  const showInternalTabs = canEdit;

  const isExemptOrTrending = isTrendingFreeActivity(business);
  const remaining = isExemptOrTrending
    ? 0
    : Math.max(0, (business.packagePrice || 250) - (business.amountPaid || 0));

  const isUnpaidNonExempt = !isExemptOrTrending && isUnpaidActivity(business);

  const repCommissionRate = business.repCommissionRate || 40;
  const earnedCommission = Math.round((business.amountPaid || 0) * (repCommissionRate / 100));

  const allPhotos: string[] = [
    ...(business.coverPhoto ? [business.coverPhoto] : []),
    ...(business.photos || []),
  ].filter((url, idx, self) => Boolean(url) && self.indexOf(url) === idx);

  // Helper to record automated follow-up note in timeline
  const addAutoFollowUpNote = (type: 'payment' | 'verification' | 'general', text: string, updatedBizData: Partial<Business>) => {
    if (!onUpdateBusiness) return;

    const newFollowUp: AdminFollowUpNote = {
      id: `fup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: currentUser?.id || 'sys',
      authorName: userName,
      authorRole: userRole,
      type,
      text,
      createdAt: new Date().toISOString(),
    };

    const existingNotes = business.adminFollowUps || [];
    const updatedNotesStr = business.notes
      ? `${business.notes}\n[${new Date().toLocaleDateString('ar-EG')}] ${userName}: ${text}`
      : `[${new Date().toLocaleDateString('ar-EG')}] ${userName}: ${text}`;

    onUpdateBusiness({
      ...business,
      ...updatedBizData,
      adminFollowUps: [newFollowUp, ...existingNotes],
      notes: updatedNotesStr,
    });
  };

  // Handlers for Verification Status
  const handleStatusClick = (st: VerificationStatus) => {
    if (st === 'verified' && isUnpaidNonExempt) {
      setShowVerificationAlert(true);
      return;
    }
    setShowVerificationAlert(false);

    const statusLabel =
      st === 'verified'
        ? 'معتمد وموثق'
        : st === 'pending'
        ? 'قيد المراجعة'
        : st === 'in_progress'
        ? 'جاري الفحص'
        : st === 'needs_action'
        ? 'يتطلب إجراء'
        : 'مرفوض';

    addAutoFollowUpNote(
      'verification',
      `[توثيق ميداني]: تم تعديل حالة التوثيق إلى (${statusLabel}) بواسطة ${userName}.`,
      { verificationStatus: st, isConditionalVerification: false }
    );
  };

  const handleConfirmConditionalVerification = () => {
    setShowVerificationAlert(false);
    addAutoFollowUpNote(
      'verification',
      `[اعتماد مشروط]: تم اعتماد المنشأة توثيقياً مع وسم متأخرات مالية بمبلغ ${remaining} ج.م بواسطة ${userName}.`,
      { verificationStatus: 'verified', isConditionalVerification: true }
    );
  };

  const handleMarkAsFeeExempt = () => {
    setShowVerificationAlert(false);
    addAutoFollowUpNote(
      'verification',
      `[إعفاء رسمي]: تم إعفاء المنشأة رسمياً من الرسوم والتحصيل واعتمادها كمكان رائج مجاني بواسطة ${userName}.`,
      { isFeeExempt: true, verificationStatus: 'verified', isConditionalVerification: false }
    );
  };

  // Handlers for Payment Updates
  const handleUpdatePayment = (bizId: string, status: PaymentStatus) => {
    const statusLabel =
      status === 'fully_paid' ? 'مسدد بالكامل' : status === 'partially_paid' ? 'مسدد جزئياً' : 'غير مسدد';

    let amountPaid = business.amountPaid || 0;
    if (status === 'fully_paid') {
      amountPaid = business.packagePrice || 0;
    } else if (status === 'unpaid') {
      amountPaid = 0;
    }

    addAutoFollowUpNote(
      'payment',
      `[تحديث مالي]: قام ${userName} بتغيير حالة السداد السريعة إلى (${statusLabel}). المبلغ المسدد: ${amountPaid} ج.م.`,
      { paymentStatus: status, amountPaid }
    );
  };

  const handleUpdateReceiptPhoto = (bizId: string, photoUrl: string) => {
    addAutoFollowUpNote(
      'payment',
      `[إيصال سداد]: تم إرفاق/تحديث رابط إيصال السداد المالي بواسطة ${userName}.`,
      { paymentReceiptPhoto: photoUrl, paymentReceiptDate: new Date().toISOString() }
    );
  };

  // Handler for custom notes
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !onUpdateBusiness) return;

    addAutoFollowUpNote(
      'general',
      newNoteText.trim(),
      {}
    );
    setNewNoteText('');
  };

  // Handler for adding additional service invoice
  const handleAddAdditionalInvoice = (
    bizId: string,
    invoiceData: Omit<AdditionalServiceInvoice, 'id' | 'issueDate' | 'invoiceNumber' | 'createdAt'>
  ) => {
    const newInvoice: AdditionalServiceInvoice = {
      id: `inv-add-${Date.now()}`,
      invoiceNumber: `ADD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...invoiceData,
    };

    const currentAdditional = business.additionalInvoices || [];
    addAutoFollowUpNote(
      'payment',
      `[فاتورة خدمة إضافية]: تم إصدار فاتورة (${newInvoice.serviceTitle}) برقم ${newInvoice.invoiceNumber} بقيمة ${newInvoice.amount} ج.م بواسطة ${userName}.`,
      { additionalInvoices: [newInvoice, ...currentAdditional] }
    );
    setIsAddServiceInvoiceModalOpen(false);
  };

  // Handler for saving edited fields from modal
  const handleSaveModal = (updatedBiz: Business) => {
    addAutoFollowUpNote(
      'general',
      `[تعديل بيانات]: تم تحديث بيانات المنشأة رسمياً بواسطة ${userName}.`,
      updatedBiz
    );
    if (onUpdateBusiness) {
      onUpdateBusiness(updatedBiz);
    }
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={business.nameAr}
        subtitle={`${business.category} • ${business.governorate} - ${business.city}`}
        width="xl"
        headerActions={
          canEdit ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="py-1 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200 shadow-2xs cursor-pointer whitespace-nowrap active:scale-95"
                title="تعديل وتحديث بيانات المنشأة"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                <span>تعديل البيانات</span>
              </button>

              {onDeleteBusiness && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer active:scale-95"
                  title="حذف المنشأة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : null
        }
      >
            {/* 1. Panoramic Hero Header with Watermark Badge & Status Pill */}
            <DrawerHeroHeader
              business={business}
              isGuest={isGuest}
              onOpenLightbox={() => {
                if (allPhotos.length > 0) {
                  setSelectedPhoto(allPhotos[0]);
                }
              }}
            />

            {/* 2. Quick Action Bar (Call / WhatsApp / Directions / Share) */}
            <QuickActionBar business={business} compact={false} />

            {/* 3. Internal Navigation Tabs */}
            {showInternalTabs && (
              <div className="flex items-center border-b border-slate-200 text-sm font-medium overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-full justify-between sm:justify-start sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('info')}
                    className={`py-2.5 px-2.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold whitespace-nowrap ${
                      activeTab === 'info'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    البيانات
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('admin')}
                    className={`py-2.5 px-2.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold whitespace-nowrap ${
                      activeTab === 'admin'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    مالي
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={`py-2.5 px-2.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold whitespace-nowrap ${
                      activeTab === 'notes'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    متابعات ({business.adminFollowUps?.length || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className={`py-2.5 px-2.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'directory'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>الدليل</span>
                    {business.verificationStatus === 'verified' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('whatsapp')}
                    className={`py-2.5 px-2.5 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'whatsapp'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    الواتس اب
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: Business Details & Interactive Map */}
            {(!showInternalTabs || activeTab === 'info') && (
              <DrawerInfoTab
                business={business}
                isGuest={isGuest}
                allPhotos={allPhotos}
                onOpenLightbox={(idx) => {
                  if (allPhotos[idx]) {
                    setSelectedPhoto(allPhotos[idx]);
                  }
                }}
                onOpenGmapsModal={() => setIsGmapsModalOpen(true)}
                onOpenVideoModal={() => setIsVideoModalOpen(true)}
              />
            )}

            {/* TAB 2: Financial & Operational Review */}
            {showInternalTabs && activeTab === 'admin' && (
              <>
                <ConditionalVerificationAlert
                  isOpen={showVerificationAlert}
                  remaining={remaining}
                  onRecordPayment={() => {
                    setShowVerificationAlert(false);
                    if (onCollectPayment) {
                      onClose();
                      onCollectPayment(business);
                    }
                  }}
                  onConfirmConditional={handleConfirmConditionalVerification}
                  onMarkAsFeeExempt={handleMarkAsFeeExempt}
                  onClose={() => setShowVerificationAlert(false)}
                />

                <DrawerAdminTab
                  business={business}
                  remaining={remaining}
                  earnedCommission={earnedCommission}
                  repCommissionRate={repCommissionRate}
                  onStatusClick={handleStatusClick}
                  onOpenDocModal={() => setIsDocModalOpen(true)}
                  onOpenInvoiceModal={() => {
                    if (onShowInvoice) {
                      onShowInvoice(business);
                    }
                  }}
                  onOpenPaymentModal={() => {
                    if (onCollectPayment) {
                      onClose();
                      onCollectPayment(business);
                    }
                  }}
                  onUpdatePayment={handleUpdatePayment}
                  onUpdateReceiptPhoto={handleUpdateReceiptPhoto}
                  onOpenAddServiceInvoiceModal={() => setIsAddServiceInvoiceModalOpen(true)}
                  onSelectInvoiceForView={(inv) => setSelectedInvoiceForView(inv)}
                />
              </>
            )}

            {/* TAB 3: Notes & Automated Timeline Follow-ups */}
            {showInternalTabs && activeTab === 'notes' && (
              <DrawerNotesTab
                business={business}
                newNoteText={newNoteText}
                setNewNoteText={setNewNoteText}
                onAddNoteSubmit={handleAddNoteSubmit}
              />
            )}

            {/* TAB 4: Public Directory Management */}
            {showInternalTabs && activeTab === 'directory' && (
              <DrawerDirectoryTab
                business={business}
                canEdit={canEdit}
                onUpdateStatus={(newStatus) => handleStatusClick(newStatus)}
                onUpdateCustomUrl={(customUrl) => {
                  addAutoFollowUpNote('general', `[تخصيص رابط الدليل]: تم تعيين رابط مخصص (${customUrl}) بواسطة ${userName}.`, {
                    customDirectoryUrl: customUrl,
                  });
                }}
              />
            )}

            {/* TAB 5: WhatsApp Marketing & Communications Hub */}
            {showInternalTabs && activeTab === 'whatsapp' && (
              <DrawerWhatsAppTab
                business={business}
              />
            )}
      </Drawer>

      {/* Business Full Interactive Edit Modal (matches prototype & media_1789316245753.png) */}
      <BusinessEditModal
        business={business}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveModal}
      />

      {/* KYC Document Viewer Modal */}
      <DocumentViewerModal
        business={business}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onApproveDocument={(docType) => {
          addAutoFollowUpNote(
            'verification',
            `[فحص وثائق]: تم فحص واعتماد صحة مستند (${docType === 'commercial_reg' ? 'السجل التجاري' : docType === 'tax_card' ? 'البطاقة الضريبية' : 'رخصة النشاط'}) بواسطة ${userName}.`,
            {}
          );
        }}
      />

      {/* Google Maps Sync Modal */}
      <GoogleMapsSyncModal
        business={business}
        isOpen={isGmapsModalOpen}
        onClose={() => setIsGmapsModalOpen(false)}
        onUpdateBusiness={(updated) => {
          if (onUpdateBusiness) {
            onUpdateBusiness(updated);
          }
        }}
      />

      {/* Video Tour Player Modal */}
      {isVideoModalOpen && (
        <VideoPlayerModal
          business={business}
          onClose={() => setIsVideoModalOpen(false)}
        />
      )}

      {/* Additional Service Invoice Viewer Modal */}
      {selectedInvoiceForView && (
        <InvoiceModal
          business={business}
          selectedAdditionalInvoiceId={selectedInvoiceForView.id}
          onClose={() => setSelectedInvoiceForView(null)}
          userRole={userRole}
          isAdmin={isManagerial}
          currentUserName={userName}
        />
      )}

      {/* Add Additional Service Invoice Modal */}
      <AddServiceInvoiceModal
        isOpen={isAddServiceInvoiceModalOpen}
        business={business}
        onClose={() => setIsAddServiceInvoiceModalOpen(false)}
        onAddInvoice={handleAddAdditionalInvoice}
      />

      {/* Lightbox for Photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20 animate-fade-in"
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="تأكيد حذف المنشأة"
        message={`هل أنت متأكد من رغبتك في حذف نشاط "${business.nameAr}" من المنظومة؟`}
        confirmLabel="حذف المنشأة"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => {
          if (onDeleteBusiness) {
            onDeleteBusiness(business.id);
            onClose();
          }
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
