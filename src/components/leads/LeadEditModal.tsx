import React, { useState, useEffect } from 'react';
import { InterestedLead, LeadInterestLevel, LeadStatus, Business } from '../../types';
import { BaseModal, Button } from '../ui';
import { EGYPT_GOVERNORATES, CATEGORY_GROUPS } from '../../data/mockData';
import { findDuplicatePhoneEntity } from '../../utils/phoneValidator';
import { Edit, AlertTriangle, Save } from 'lucide-react';

interface LeadEditModalProps {
  lead: InterestedLead | null;
  businesses: Business[];
  leads: InterestedLead[];
  onClose: () => void;
  onUpdateLead: (lead: InterestedLead) => void;
}

export const LeadEditModal: React.FC<LeadEditModalProps> = ({
  lead,
  businesses,
  leads,
  onClose,
  onUpdateLead,
}) => {
  const [formData, setFormData] = useState<InterestedLead | null>(lead);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setFormData(lead);
    setErrorMessage('');
  }, [lead]);

  if (!formData) return null;

  const duplicateEditPhone = formData.phone
    ? findDuplicatePhoneEntity(formData.phone, {
        businesses,
        leads,
        excludeLeadId: formData.id,
      })
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (duplicateEditPhone) {
      const entityTypeStr = duplicateEditPhone.type === 'business' ? 'نشاط تجاري مسجل مسبقاً' : 'عميل مهتم مسجل مسبقاً';
      setErrorMessage(`رقم الهاتف (${duplicateEditPhone.phone}) مسجل بالفعل مع ${entityTypeStr}: "${duplicateEditPhone.name}". لا يمكن تكرار تسجيل نفس رقم الهاتف.`);
      return;
    }

    const cleanBiz = (formData.businessName && formData.businessName !== 'عميل مهتم' && formData.businessName !== 'عملاء مهتمون')
      ? formData.businessName.trim()
      : '';
    const cleanClient = (formData.clientName && formData.clientName !== 'عميل مهتم' && formData.clientName !== 'عملاء مهتمون')
      ? formData.clientName.trim()
      : '';
    const rawCat = formData.businessCategory?.trim();
    const cleanCat = (rawCat && rawCat !== 'عميل مهتم' && rawCat !== 'عملاء مهتمون')
      ? rawCat
      : 'خدمات وأنشطة عامة';

    onUpdateLead({
      ...formData,
      businessName: cleanBiz || cleanClient || 'منشأة تجارية',
      clientName: cleanClient || cleanBiz || 'صاحب المنشأة',
      businessCategory: cleanCat,
      phone: (formData.phone || '').replace(/\D/g, ''),
    });
    onClose();
  };

  const modalFooter = (
    <div className="w-full flex gap-2">
      <Button
        variant="primary"
        size="md"
        onClick={handleSubmit}
        icon={<Save className="w-4 h-4" />}
        className="flex-1 font-black"
      >
        حفظ التعديلات
      </Button>

      <Button
        variant="secondary"
        size="md"
        onClick={onClose}
      >
        إلغاء
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="تعديل بيانات المنشأة والمتابعة"
      subtitle={formData.businessName || formData.clientName}
      icon={<Edit className="w-5 h-5 text-amber-500" />}
      footer={modalFooter}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs" dir="rtl">
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-300 p-3 rounded-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Name & Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم المكان / المحل *</label>
            <input
              type="text"
              required
              value={formData.businessName || ''}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="مثال: قصر المندي أو دكان البنا"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم العميل / المسؤول</label>
            <input
              type="text"
              value={formData.clientName || ''}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="اسم صاحب المنشأة أو المسؤول"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* 2. Phone & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم الهاتف / واتساب *</label>
            <input
              type="tel"
              required
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
            />
            {duplicateEditPhone && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>
                  مسجل مسبقاً مع {duplicateEditPhone.type === 'business' ? 'نشاط' : 'مراجعة'}: {duplicateEditPhone.name}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">نوع النشاط والتصنيف *</label>
            <select
              value={formData.businessCategory || ''}
              onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              {(!formData.businessCategory ||
                formData.businessCategory === 'عميل مهتم' ||
                formData.businessCategory === 'عملاء مهتمون' ||
                !CATEGORY_GROUPS.some(g => g.items.includes(formData.businessCategory || ''))) && (
                <option value={formData.businessCategory || ''} disabled>
                  غير مصنف ({formData.businessCategory || 'اختر التصنيف'})
                </option>
              )}
              {CATEGORY_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة</label>
            <select
              value={formData.governorate || 'القاهرة'}
              onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">المدينة / المنطقة</label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="مثال: الدقي / المهندسين"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* 4. Status & Interest */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">حالة المتابعة</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as LeadStatus })
              }
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="pending_followup">بانتظار المتابعة</option>
              <option value="contacted">تم التواصل والمراسلة</option>
              <option value="converted">تم التحويل لمشترك (مسجل)</option>
              <option value="cancelled">ملغي / غير مهتم</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">درجة الاهتمام</label>
            <select
              value={formData.interestLevel}
              onChange={(e) => {
                const val = e.target.value as LeadInterestLevel;
                setFormData({
                  ...formData,
                  interestLevel: val,
                  isTrending: val === 'trending_free' ? true : formData.isTrending,
                });
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="trending_free">منشأة رائجة (طلب سماح بإدراج مجاني)</option>
              <option value="high">مهتم جداً</option>
              <option value="medium">يحتاج تفكير ومتابعة</option>
              <option value="need_visit">طلب زيارة</option>
              <option value="intro_sent">أُرسلت رسالة</option>
              <option value="low">متردد / استفسار</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold mb-1 text-[var(--text-primary)]">موعد المتابعة القادم</label>
          <input
            type="date"
            value={formData.followUpDate || ''}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        <div>
          <label className="block font-bold mb-1 text-[var(--text-primary)]">ملاحظات المتابعة</label>
          <textarea
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>
      </form>
    </BaseModal>
  );
};
