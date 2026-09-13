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

// Subcomponents matching prototype UX/UI
import { DrawerHeroHeader } from './business-drawer/DrawerHeroHeader';
import { QuickActionBar } from './business-drawer/QuickActionBar';
import { DrawerInfoTab } from './business-drawer/DrawerInfoTab';
import { DrawerAdminTab } from './business-drawer/DrawerAdminTab';
import { DrawerNotesTab } from './business-drawer/DrawerNotesTab';
import { ConditionalVerificationAlert } from './business-drawer/ConditionalVerificationAlert';
import { AddServiceInvoiceModal } from './business-drawer/AddServiceInvoiceModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { InvoiceModal } from './InvoiceModal';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { VideoPlayerModal } from './VideoPlayerModal';

export interface BusinessDetailsDrawerProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  onShowInvoice?: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdateBusiness?: (biz: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  currentUser?: User | null;
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
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'admin' | 'notes'>('info');
  const [newNoteText, setNewNoteText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Business>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (business) {
      setEditFormData({ ...business });
      setIsEditing(false);
    }
  }, [business, isOpen]);

  if (!business) return null;

  const userRole = (currentUser?.role || 'rep') as string;
  const userName = currentUser?.name || 'مستخدم النظام';
  const isGuest = userRole === 'guest';
  const isManagerial = ['admin', 'supervisor', 'accountant'].includes(userRole);
  const isOwnerRep = userRole === 'rep' && (business.repId === currentUser?.id || business.repName === currentUser?.name);
  const canEdit = isManagerial || isOwnerRep;

  const remaining = business.isFeeExempt
    ? 0
    : Math.max(0, (business.packagePrice || 0) - (business.amountPaid || 0));

  const isUnpaidNonExempt = !business.isFeeExempt && (business.paymentStatus === 'unpaid' || remaining > 0);

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

  // Handler for saving edited fields
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateBusiness) return;
    setIsSaving(true);

    const updatedBiz: Business = {
      ...business,
      ...editFormData,
    };

    addAutoFollowUpNote(
      'general',
      `[تعديل بيانات]: تم تحديث بيانات المنشأة رسمياً بواسطة ${userName}.`,
      editFormData
    );

    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={business.nameAr}
        subtitle={`${business.category} • ${business.governorate} - ${business.city}`}
        width="xl"
      >
        {isEditing ? (
          /* ===================== EDIT MODE ===================== */
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-medium">
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-slate-100 to-indigo-500/15 rounded-2xl border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span className="font-black text-slate-900 text-sm">تعديل وتحديث بيانات المنشأة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>البيانات الأساسية والتصنيف</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم المنشأة (بالعربية) *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nameAr || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, nameAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الاسم بالإنجليزية (اختياري)</label>
                  <input
                    type="text"
                    value={editFormData.nameEn || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">التصنيف التجاري</label>
                  <select
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">التصنيف الفرعي / المهنة</label>
                  <input
                    type="text"
                    value={(editFormData as any).subCategory || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value } as any)}
                    placeholder="مثال: هايبر وبقالة، مأكولات بحرية..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Address & Working Hours */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>الموقع وساعات العمل</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">المحافظة</label>
                  <select
                    value={editFormData.governorate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, governorate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">المدينة / الحي</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الشارع والمنطقة</label>
                  <input
                    type="text"
                    value={editFormData.street || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">علامة مميزة (اختياري)</label>
                  <input
                    type="text"
                    value={editFormData.landmark || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, landmark: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">ساعات ومواعيد العمل</label>
                  <input
                    type="text"
                    value={editFormData.workingHours || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, workingHours: e.target.value })}
                    placeholder="مثال: يومياً من 8:00 ص - 10:00 م"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Contacts & Owner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>أرقام التواصل والمسؤولين</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الهاتف الأساسي *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">هاتف بديل (اختياري)</label>
                  <input
                    type="tel"
                    value={editFormData.secondaryPhone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, secondaryPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم المالك / المسؤول الميداني</label>
                  <input
                    type="text"
                    value={editFormData.ownerName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">هاتف المالك الشخصي</label>
                  <input
                    type="tel"
                    value={editFormData.ownerPhone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, ownerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-slate-600 font-bold mb-1">الوصف التعريفي والخدمات</label>
              <textarea
                rows={3}
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
              />
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {onDeleteBusiness && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>حذف المنشأة</span>
                </button>
              )}

              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ===================== VIEW MODE (100% PROTOTYPE UX/UI) ===================== */
          <>
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

            {/* 3. Internal Navigation Tabs & Quick Edit / Delete Buttons */}
            {!isGuest && (
              <div className="flex items-center justify-between border-b border-slate-200 text-sm font-medium">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveTab('info')}
                    className={`py-2.5 px-3 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold ${
                      activeTab === 'info'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    بيانات المنشأة
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('admin')}
                    className={`py-2.5 px-3 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold ${
                      activeTab === 'admin'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    العمليات والتوثيق المالي
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={`py-2.5 px-3 sm:px-4 border-b-2 transition-colors cursor-pointer text-xs sm:text-sm font-bold ${
                      activeTab === 'notes'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    المتابعات ({business.adminFollowUps?.length || 0})
                  </button>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="py-1 px-2.5 my-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200 shadow-2xs cursor-pointer whitespace-nowrap"
                      title="تعديل وتحديث بيانات المنشأة"
                    >
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span>تعديل البيانات</span>
                    </button>
                  )}

                  {onDeleteBusiness && canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 my-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                      title="حذف المنشأة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: Business Details & Interactive Map */}
            {(isGuest || activeTab === 'info') && (
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
            {!isGuest && activeTab === 'admin' && (
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
            {!isGuest && activeTab === 'notes' && (
              <DrawerNotesTab
                business={business}
                newNoteText={newNoteText}
                setNewNoteText={setNewNoteText}
                onAddNoteSubmit={handleAddNoteSubmit}
              />
            )}
          </>
        )}
      </Drawer>

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
