import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  CreditCard,
  CheckCircle2,
  FileText,
  DollarSign,
  Edit3,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  Star,
  ExternalLink,
  Film,
  MessageCircle,
  AlertCircle,
  Plus,
  Send,
  UserCheck,
} from 'lucide-react';
import { Drawer } from './design-system/Drawer';
import { VerificationPill, PaymentPill, PublishedPill } from './design-system/StatusPill';
import { Business, User } from '../types';
import { canUserManageFeeExemption } from '../utils/permissions';

interface BusinessDetailsDrawerProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  onShowInvoice?: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdateBusiness?: (biz: Business) => void;
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
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'admin' | 'notes'>('info');
  const [newNote, setNewNote] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!business) return null;

  const isManagerial = ['admin', 'supervisor', 'accountant'].includes(currentUser?.role || '');
  const isOwnerRep = currentUser?.role === 'rep' && (business.repId === currentUser.id || business.repName === currentUser.name);
  const canEdit = isManagerial || isOwnerRep;

  const remaining = business.isFeeExempt
    ? 0
    : Math.max(0, (business.packagePrice || 0) - (business.amountPaid || 0));

  const allPhotos: string[] = [
    ...(business.coverPhoto ? [business.coverPhoto] : []),
    ...(business.photos || []),
  ].filter((url, idx, self) => Boolean(url) && self.indexOf(url) === idx);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !onUpdateBusiness) return;
    const author = currentUser?.name || 'مستخدم مسجل';
    const noteEntry = `[${new Date().toLocaleDateString('ar-EG')}] ${author}: ${newNote.trim()}`;
    const updatedNotes = business.notes ? `${business.notes}\n${noteEntry}` : noteEntry;
    onUpdateBusiness({ ...business, notes: updatedNotes });
    setNewNote('');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={business.nameAr}
      subtitle={`${business.category} • ${business.governorate} - ${business.city}`}
      width="xl"
    >
      {/* Top Quick Status & Actions Bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
        <div className="flex items-center gap-2 flex-wrap">
          <VerificationPill status={business.verificationStatus} size="sm" />
          <PaymentPill status={business.paymentStatus} isFeeExempt={business.isFeeExempt} size="sm" />
          <PublishedPill status={business.publishedStatus} size="sm" />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onShowInvoice && (
            <button
              onClick={() => onShowInvoice(business)}
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="عرض الفاتورة الإلكترونية"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الفاتورة</span>
            </button>
          )}

          {canEdit && onEditBusiness && (
            <button
              onClick={() => {
                onClose();
                onEditBusiness(business);
              }}
              className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-[var(--border-color)]"
              title="تعديل البيانات"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">تعديل</span>
            </button>
          )}
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-black transition-all cursor-pointer border-b-2 ${
            activeTab === 'info'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            <span>بيانات النشاط</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-black transition-all cursor-pointer border-b-2 ${
            activeTab === 'admin'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            <span>الإدارة والمالية</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-black transition-all cursor-pointer border-b-2 ${
            activeTab === 'notes'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>سجل الملاحظات والتدقيق</span>
          </div>
        </button>
      </div>

      {/* TAB 1: INFO */}
      {activeTab === 'info' && (
        <div className="space-y-5 animate-fade-in">
          {/* Main Info Card */}
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--text-muted)] block mb-1">الاسم التجاري:</span>
                <span className="font-black text-[var(--text-primary)] text-sm">{business.nameAr}</span>
                {business.nameEn && (
                  <span className="text-slate-400 block text-[11px] font-mono mt-0.5">{business.nameEn}</span>
                )}
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-1">التصنيف والنشاط:</span>
                <span className="font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 inline-block">
                  {business.category}
                </span>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-1">العنوان الجغرافي:</span>
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {business.governorate} - {business.city}، {business.street}
                </span>
                {business.landmark && (
                  <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">علامة مميزة: {business.landmark}</span>
                )}
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-1">ساعات العمل:</span>
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  {business.workingHours || 'غير محدد'}
                </span>
              </div>
            </div>

            {business.description && (
              <div className="pt-2 border-t border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] block text-xs mb-1">الوصف التعريفي:</span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)]">
                  {business.description}
                </p>
              </div>
            )}
          </div>

          {/* Contact Information & Direct Buttons */}
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>أرقام التواصل والمسؤولين</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">الهاتف الرئيسي:</span>
                  <span className="font-bold font-mono text-[var(--text-primary)] text-sm">{business.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${business.phone}`}
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                    title="اتصال"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/2${(business.phone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title="واتساب"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {business.secondaryPhone && (
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">الهاتف البديل:</span>
                    <span className="font-bold font-mono text-[var(--text-primary)] text-sm">{business.secondaryPhone}</span>
                  </div>
                  <a
                    href={`tel:${business.secondaryPhone}`}
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {business.ownerName && (
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">اسم المالك أو المسؤول الميداني:</span>
                    <span className="font-bold text-[var(--text-primary)]">{business.ownerName}</span>
                    {business.ownerPhone && (
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">{business.ownerPhone}</span>
                    )}
                  </div>
                  <UserCheck className="w-4 h-4 text-amber-500" />
                </div>
              )}
            </div>
          </div>

          {/* Google Maps & Rating Hub */}
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>بيانات التوثيق وخرائط Google</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block">رابط التوثيق المعتمد:</span>
                {business.googleMapsUrl ? (
                  <a
                    href={business.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-500 font-bold hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">فتح الموقع على خرائط Google</span>
                  </a>
                ) : (
                  <span className="text-slate-400 font-medium block mt-1">لم يتم إدراج الرابط المعتمد بعد</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">التقييم الرقمي:</span>
                  <span className="font-black text-sm text-[var(--text-primary)]">
                    {business.googleRating ? `${business.googleRating.toFixed(1)} من 5` : 'غير متوفر'}
                  </span>
                </div>
                {business.googleRating && (
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg font-bold border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{business.googleRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photos Showcase */}
          {allPhotos.length > 0 && (
            <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
              <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center justify-between">
                <span>معرض الصور والتوثيق ({allPhotos.length} صورة)</span>
              </h4>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allPhotos.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPhoto(url)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-color)] cursor-pointer group hover:border-amber-500 transition-colors"
                  >
                    <img
                      src={url}
                      alt={`${business.nameAr} - ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 right-1 text-[9px] font-black bg-slate-950/80 text-amber-400 px-1.5 py-0.5 rounded-md">
                        الغلاف
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADMIN & FINANCE */}
      {activeTab === 'admin' && (
        <div className="space-y-5 animate-fade-in">
          {/* Financial Overview Card */}
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-4">
            <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>الوضع المالي والمحاسبي</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">فاتورة #{business.invoiceNumber}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block">سعر الباقة المعتمدة:</span>
                <span className="font-black text-sm text-[var(--text-primary)]">{business.packagePrice || 0} ج.م</span>
                <span className="text-[10px] text-amber-500 block font-bold mt-0.5">{business.packageName}</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block">المبلغ المسدد:</span>
                <span className="font-black text-sm text-emerald-600">{business.amountPaid || 0} ج.م</span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                  طريقة: {business.paymentMethod === 'cash_by_rep' ? 'كاش للمندوب' : business.paymentMethod || 'غير محدد'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[var(--text-muted)] block">المتبقي المطلوب تحصيله:</span>
                <span className={`font-black text-sm ${remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {business.isFeeExempt ? '0 ج.م (معفى)' : `${remaining} ج.م`}
                </span>
              </div>
            </div>

            {/* Financial Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)] flex-wrap">
              {remaining > 0 && onCollectPayment && canEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onCollectPayment(business);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>تسجيل تحصيل أو سداد دفعة</span>
                </button>
              )}

              {onShowInvoice && (
                <button
                  onClick={() => onShowInvoice(business)}
                  className="bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-xs px-4 py-2.5 rounded-xl border border-[var(--border-color)] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>معاينة الفاتورة الرسمية</span>
                </button>
              )}
            </div>
          </div>

          {/* Representative Attribution */}
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              <span>المندوب والمسؤولية الميدانية</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block">اسم المندوب:</span>
                <span className="font-bold text-[var(--text-primary)]">{business.repName || 'غير مسجل'}</span>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">معرف: {business.repId}</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block">تاريخ التسجيل والفوترة:</span>
                <span className="font-bold text-[var(--text-primary)]">{business.invoiceDate || 'غير مسجل'}</span>
              </div>
            </div>
          </div>

          {/* Additional Service Invoices if any */}
          {business.additionalInvoices && business.additionalInvoices.length > 0 && (
            <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
              <h4 className="text-xs font-black text-[var(--text-primary)]">
                فواتير الخدمات الإضافية ({business.additionalInvoices.length})
              </h4>
              <div className="space-y-2">
                {business.additionalInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">{inv.serviceTitle}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">رقم #{inv.invoiceNumber} • {inv.issueDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 block">{inv.amount} ج.م</span>
                      <span className="text-[10px] text-slate-400">{inv.paymentStatus === 'fully_paid' ? 'مسدد' : 'معلق'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NOTES & AUDIT */}
      {activeTab === 'notes' && (
        <div className="space-y-4 animate-fade-in">
          {/* Notes Log */}
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
            <h4 className="text-xs font-black text-[var(--text-primary)]">سجل الملاحظات والتدقيق الزمني</h4>

            {business.notes ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {business.notes.split('\n').map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] leading-relaxed font-medium"
                  >
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[var(--text-muted)] text-xs font-bold">
                لا توجد ملاحظات مدونة لهذا النشاط حتى الآن.
              </div>
            )}

            {/* Add Note Form */}
            {canEdit && (
              <form onSubmit={handleAddNote} className="pt-3 border-t border-[var(--border-color)] flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="أضف ملاحظة أو توثيقاً تدقيقياً..."
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
    </Drawer>
  );
};
