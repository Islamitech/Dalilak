import React, { useState, useMemo } from 'react';
import { InterestedLead, LeadInterestLevel, Representative, User, Business } from '../../types';
import { EGYPT_GOVERNORATES, CATEGORY_GROUPS } from '../../data/mockData';
import { getCategoryGroupFor } from '../../utils/categoryMatcher';
import { findDuplicatePhoneEntity } from '../../utils/phoneValidator';
import { extractGooglePlaceData, isGoogleMapsUrl } from '../../utils/googlePlaceExtractor';
import { Button } from '../ui';
import {
  UserCheck,
  Sparkles,
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface LeadAddFormProps {
  businesses?: Business[];
  leads?: InterestedLead[];
  currentUser: User | null;
  currentRep?: Representative;
  onSubmit: (lead: InterestedLead) => void;
  onCancel: () => void;
}

export const LeadAddForm: React.FC<LeadAddFormProps> = ({
  businesses = [],
  leads = [],
  currentUser,
  currentRep,
  onSubmit,
  onCancel,
}) => {
  const [newClientName, setNewClientName] = useState<string>('');
  const [newBizName, setNewBizName] = useState<string>('');
  const [newGroup, setNewGroup] = useState<string>('المطاعم والأغذية والمشروبات');
  const [newCategory, setNewCategory] = useState<string>('مطعم / مأكولات ومشويات');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newGovernorate, setNewGovernorate] = useState<string>('القاهرة');
  const [newCity, setNewCity] = useState<string>('');
  const [newInterestLevel, setNewInterestLevel] = useState<LeadInterestLevel>('medium');
  const [newIsTrending, setNewIsTrending] = useState<boolean>(false);
  const [newLocationUrl, setNewLocationUrl] = useState<string>('');
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newNotes, setNewNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const [isExtractingInlineLead, setIsExtractingInlineLead] = useState<boolean>(false);
  const [inlineExtractNotice, setInlineExtractNotice] = useState<string | null>(null);
  const [rawImportedCategory, setRawImportedCategory] = useState<string | null>(null);

  const duplicateNewPhone = useMemo(() => {
    return findDuplicatePhoneEntity(newPhone, { businesses, leads });
  }, [newPhone, businesses, leads]);

  const handleAutoExtractInlineLead = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setIsExtractingInlineLead(true);
    setInlineExtractNotice('جاري فحص الرابط واستخراج بيانات المنشأة من خرائط Google...');
    try {
      const data = await extractGooglePlaceData(trimmed);
      if (data) {
        if (data.name) {
          setNewBizName(data.name);
          if (!newClientName.trim()) {
            setNewClientName(`مسؤول ${data.name}`);
          }
        }
        if (data.phone) setNewPhone(data.phone);
        if (data.governorate) setNewGovernorate(data.governorate);
        if (data.city) setNewCity(data.city);
        if (data.resolvedUrl) setNewLocationUrl(data.resolvedUrl);

        if (data.category) {
          const cleanCat = data.category.trim();
          setNewCategory(cleanCat);
          const inferredGroup = getCategoryGroupFor(cleanCat);
          setNewGroup(inferredGroup);
          setRawImportedCategory(null);
        }
        setInlineExtractNotice('تم استخراج البيانات وتحديث الحقول بنجاح');
        setTimeout(() => setInlineExtractNotice(null), 5000);
      } else {
        setInlineExtractNotice('تعذر استخراج كامل البيانات تلقائياً، يمكنك إكمال الحقول يدوياً.');
        setTimeout(() => setInlineExtractNotice(null), 4000);
      }
    } catch {
      setInlineExtractNotice('حدث خطأ في الاتصال، يمكنك إدخال البيانات يدوياً.');
      setTimeout(() => setInlineExtractNotice(null), 4000);
    } finally {
      setIsExtractingInlineLead(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newClientName || newClientName.trim().length < 3) {
      setFormError('يرجى إدخال اسم العميل بشكل صحيح.');
      return;
    }

    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('يرجى إدخال رقم هاتف صحيح (11 رقم).');
      return;
    }

    const duplicate = findDuplicatePhoneEntity(cleanPhone, { businesses, leads });
    if (duplicate) {
      const entityTypeStr = duplicate.type === 'business' ? 'نشاط تجاري مسجل مسبقاً' : 'عميل مهتم مسجل مسبقاً';
      setFormError(`رقم الهاتف (${duplicate.phone}) مسجل بالفعل مع ${entityTypeStr}: "${duplicate.name}" ${duplicate.location ? `(${duplicate.location})` : ''}. لا يمكن تكرار تسجيل نفس رقم الهاتف.`);
      return;
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const repId = currentUser?.repData?.id || currentUser?.id || currentRep?.id || 'rep_1';
    const repName = currentUser?.repData?.name || currentUser?.name || currentRep?.name || 'مندوب معتمد';

    const rawClient = newClientName.trim();
    const rawBiz = newBizName.trim();
    const cleanClientName = (rawClient && rawClient !== 'عميل مهتم' && rawClient !== 'عملاء مهتمون')
      ? rawClient
      : (rawBiz && rawBiz !== 'عميل مهتم' && rawBiz !== 'عملاء مهتمون')
      ? rawBiz
      : 'صاحب المنشأة';
    const cleanBizName = (rawBiz && rawBiz !== 'عميل مهتم' && rawBiz !== 'عملاء مهتمون')
      ? rawBiz
      : cleanClientName;

    const finalCategory = newCategory.trim() || rawImportedCategory?.trim() || 'نشاط تجاري / خدمي آخر';

    const newLead: InterestedLead = {
      id: leadId,
      clientName: cleanClientName,
      businessName: cleanBizName,
      businessCategory: finalCategory,
      phone: cleanPhone,
      governorate: newGovernorate,
      city: newCity.trim() || undefined,
      interestLevel: newIsTrending ? 'trending_free' : newInterestLevel,
      isTrending: newIsTrending || undefined,
      locationUrl: newLocationUrl.trim() || undefined,
      followUpDate: newFollowUpDate || undefined,
      notes: newNotes.trim() || undefined,
      createdDate: new Date().toISOString(),
      repId,
      repName,
      status: 'pending_followup',
    };

    onSubmit(newLead);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-amber-500/40 rounded-3xl p-4 sm:p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-lg animate-fade-in">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
              تسجيل شخص مهتم / زيارة جديدة
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-bold">
              حفظ بيانات المنشأة والشخص في سجل المراجعات للمتابعة لاحقاً
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold cursor-pointer transition-colors"
          title="إغلاق النموذج"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {formError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 p-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Link-First Auto-Extraction */}
      <div className="bg-gradient-to-r from-blue-500/10 via-[var(--bg-card)] to-indigo-500/10 border border-blue-500/30 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-blue-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>استيراد فوري عبر رابط خرائط Google (اختياري)</span>
          </label>
          <span className="text-[10px] bg-blue-500/15 text-blue-800 px-2 py-0.5 rounded-full font-black">
            تعبئة تلقائية
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            dir="ltr"
            value={newLocationUrl}
            onChange={(e) => {
              const val = e.target.value;
              setNewLocationUrl(val);
              if (isGoogleMapsUrl(val)) {
                handleAutoExtractInlineLead(val);
              }
            }}
            placeholder="الصق رابط خرائط Google (maps.app.goo.gl/...)"
            className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-blue-500 text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none text-right"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={isExtractingInlineLead || !newLocationUrl.trim()}
            onClick={() => handleAutoExtractInlineLead(newLocationUrl)}
            icon={isExtractingInlineLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
          >
            {isExtractingInlineLead ? 'جاري الاستيراد...' : 'استيراد فوري'}
          </Button>
        </div>
        {inlineExtractNotice && (
          <div className="text-[11px] font-bold p-2 rounded-xl bg-blue-500/15 text-blue-900 border border-blue-500/30 flex items-center gap-2">
            <span>{inlineExtractNotice}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Mode Toggle: Normal Lead vs Trending Venue */}
        <div className="grid grid-cols-2 gap-2 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => {
              setNewIsTrending(false);
              if (newInterestLevel === 'trending_free') setNewInterestLevel('medium');
            }}
            className={`py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !newIsTrending
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>عميل مهتم عادي</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewIsTrending(true);
              setNewInterestLevel('trending_free');
            }}
            className={`py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              newIsTrending
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>منشأة رائجة (إدراج مجاني)</span>
          </button>
        </div>

        {/* Names & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">
              {newIsTrending ? 'اسم المسؤول / صاحب المكان *' : 'اسم الشخص / صاحب المنشأة *'}
            </label>
            <input
              type="text"
              required
              placeholder="مثال: أ. محمد أحمد"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم المكان / المحل *</label>
            <input
              type="text"
              required={newIsTrending}
              placeholder="مثال: مطعم أو كافيه أو متجر..."
              value={newBizName}
              onChange={(e) => setNewBizName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم الهاتف / واتساب *</label>
            <input
              type="tel"
              required
              placeholder="010XXXXXXXX"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
            />
            {duplicateNewPhone && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 mt-1.5 animate-fade-in">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>
                  مسجل مسبقاً مع {duplicateNewPhone.type === 'business' ? 'نشاط' : 'مراجعة'}: {duplicateNewPhone.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-2 bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
          {rawImportedCategory && (
            <div className="bg-amber-500/15 border border-amber-500/40 text-amber-800 p-2 rounded-xl text-[11px] font-bold flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                تصنيف Google المستخرج: <strong>"{rawImportedCategory}"</strong> — يرجى تأكيد التصنيف المعتمد:
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold mb-1 text-[var(--text-primary)]">مجموعة الأنشطة *</label>
              <select
                value={newGroup}
                onChange={(e) => {
                  const grpName = e.target.value;
                  setNewGroup(grpName);
                  const found = CATEGORY_GROUPS.find((g) => g.group === grpName);
                  if (found && found.items.length > 0) {
                    setNewCategory(found.items[0]);
                  }
                }}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
              >
                {CATEGORY_GROUPS.map((g) => (
                  <option key={g.group} value={g.group}>
                    {g.icon} {g.group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-[var(--text-primary)] flex items-center justify-between">
                <span>نوع النشاط والتصنيف *</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  معتمد بدليلك
                </span>
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-emerald-700 font-black rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
              >
                {newCategory && !(CATEGORY_GROUPS.find((g) => g.group === newGroup)?.items || []).includes(newCategory) && (
                  <option value={newCategory}>
                    {newCategory} (تصنيف خرائط Google)
                  </option>
                )}
                {(CATEGORY_GROUPS.find((g) => g.group === newGroup)?.items || []).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location & Follow-up Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة *</label>
            <select
              value={newGovernorate}
              onChange={(e) => setNewGovernorate(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
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
              placeholder="مثال: الدقي / المهندسين"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">موعد المتابعة القادم</label>
            <input
              type="date"
              value={newFollowUpDate}
              onChange={(e) => setNewFollowUpDate(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold mb-1 text-[var(--text-primary)]">ملاحظات الزيارة أو الاتفاق</label>
          <textarea
            rows={2}
            placeholder="سجل أي ملاحظات خاصة بالعميل أو تفاصيل الزيارة..."
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-medium rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            إلغاء
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={<CheckCircle2 className="w-4 h-4" />}
            className="font-black"
          >
            حفظ السجل في المراجعات
          </Button>
        </div>
      </form>
    </div>
  );
};
