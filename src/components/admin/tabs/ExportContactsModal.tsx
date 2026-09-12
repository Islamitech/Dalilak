import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  Users,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Business } from '../../../types';
import {
  downloadVcfFile,
  generateBatchVcf,
  isValidCellPhone,
  isLandlineOrHotline,
  VcfExportOptions,
} from '../../../utils/vcfExporter';
import { triggerHaptic } from '../../../utils/haptics';

interface ExportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBusinesses: Business[];
  filteredBusinesses: Business[];
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ExportContactsModal: React.FC<ExportContactsModalProps> = ({
  isOpen,
  onClose,
  allBusinesses,
  filteredBusinesses,
  onShowNotification,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [nameFormat, setNameFormat] = useState<'name_dalilak' | 'name_category_dalilak' | 'name_only'>('name_dalilak');
  const [groupLabel, setGroupLabel] = useState<string>('دليلك');
  const [includeOwnerPhone, setIncludeOwnerPhone] = useState<boolean>(true);
  const [includeLandlines, setIncludeLandlines] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Active dataset according to selected scope
  const activeBusinesses = useMemo(() => {
    return exportScope === 'all' ? allBusinesses : filteredBusinesses;
  }, [exportScope, allBusinesses, filteredBusinesses]);

  // Statistics
  const stats = useMemo(() => {
    let validMobiles = 0;
    let landlines = 0;
    let invalidOrDummy = 0;

    activeBusinesses.forEach((b) => {
      if ((b as any).isDeleted) return;
      const primary = b.phone || b.ownerPhone;
      if (isValidCellPhone(primary)) {
        validMobiles++;
      } else if (isLandlineOrHotline(primary)) {
        landlines++;
      } else {
        invalidOrDummy++;
      }
    });

    return {
      total: activeBusinesses.length,
      validMobiles,
      landlines,
      invalidOrDummy,
    };
  }, [activeBusinesses]);

  // Preview sample name
  const sampleNamePreview = useMemo(() => {
    const sampleBiz = activeBusinesses[0] || {
      nameAr: 'مطعم أسماك الحوراني',
      category: 'مطاعم ومأكولات',
    };
    const base = sampleBiz.nameAr || sampleBiz.name || 'اسم المنشأة';
    const cat = sampleBiz.category || 'التصنيف';

    if (nameFormat === 'name_dalilak') {
      return `${base} - ${groupLabel || 'دليلك'}`;
    }
    if (nameFormat === 'name_category_dalilak') {
      return `${base} | ${cat} - ${groupLabel || 'دليلك'}`;
    }
    return base;
  }, [activeBusinesses, nameFormat, groupLabel]);

  if (!isOpen) return null;

  const handleDownload = () => {
    triggerHaptic();
    setIsExporting(true);

    try {
      const options: VcfExportOptions = {
        nameFormat,
        groupLabel: groupLabel.trim() || 'دليلك',
        includeOwnerPhone,
        includeLandlines,
        includeDirectoryUrl: true,
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Dalilak_${groupLabel || 'Contacts'}_${exportScope}_${dateStr}.vcf`;

      const result = downloadVcfFile(activeBusinesses, filename, options);

      onShowNotification?.(
        `تم توليد وتحميل ملف جهات الاتصال بنجاح (${result.validCount} منشأة جاهزة للمزامنة)`,
        'success'
      );
    } catch (err: any) {
      onShowNotification?.(err?.message || 'تعذر تصدير ملف جهات الاتصال', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full shadow-2xl space-y-5 animate-scaleUp my-auto overflow-hidden text-[var(--text-primary)]">
        {/* ── HEADER ── */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-5 sm:p-6 border-b border-emerald-500/20 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>نظام المزامنة السحابية الشاملة • Google Contacts VCF 3.0</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">تصدير جهات اتصال المنظومة لحساب Google</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                توليد ملف جهات اتصال قياسي لمزامنة أسماء المنشآت مع هاتفك وظهورها بالاسم فوراً داخل WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* ── CONTENT BODY ── */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto text-xs">
          {/* SECTION 1: EXPORT SCOPE */}
          <div className="space-y-2">
            <label className="font-black text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>1. نطاق المنشآت المراد تصديرها:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'all'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                    : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between font-black text-xs sm:text-sm">
                  <span>كافة أنشطة المنظومة بالكامل</span>
                  {exportScope === 'all' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-emerald-400 font-bold font-mono mt-1">
                  {allBusinesses.length} منشأة مسجلة
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                  تصدير الدليل العام بالكامل لحفظ كافة الأرقام مرة واحدة
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'filtered'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                    : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between font-black text-xs sm:text-sm">
                  <span>الشريحة المفلترة حالياً بالحملة</span>
                  {exportScope === 'filtered' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-teal-400 font-bold font-mono mt-1">
                  {filteredBusinesses.length} منشأة مطابقة
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                  وفقاً للفلاتر الحالية المختارة (المحافظة / التصنيف / التوثيق)
                </p>
              </button>
            </div>
          </div>

          {/* SECTION 2: NAME FORMATTING */}
          <div className="space-y-2">
            <label className="font-black text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>2. صيغة ظهور اسم جهة الاتصال على هاتفك وفي WhatsApp:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNameFormat('name_dalilak')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  nameFormat === 'name_dalilak'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                    : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <p className="font-black text-xs">الاسم + لاحقة دليلك ⭐</p>
                <p className="text-[10px] text-amber-400 font-bold mt-1">مثال: مطعم الحوراني - دليلك</p>
                <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">موصى به لتمييز أرقام العمل فوراً</p>
              </button>

              <button
                type="button"
                onClick={() => setNameFormat('name_category_dalilak')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  nameFormat === 'name_category_dalilak'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                    : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <p className="font-black text-xs">الاسم + التصنيف + دليلك</p>
                <p className="text-[10px] text-amber-400 font-bold mt-1">مثال: الحوراني | مطاعم - دليلك</p>
                <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">تفصيل دقيق مع نوع النشاط</p>
              </button>

              <button
                type="button"
                onClick={() => setNameFormat('name_only')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  nameFormat === 'name_only'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                    : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <p className="font-black text-xs">اسم المنشأة فقط</p>
                <p className="text-[10px] text-amber-400 font-bold mt-1">مثال: مطعم أسماك الحوراني</p>
                <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">بدون أي إضافات</p>
              </button>
            </div>

            {/* Live Name Preview Bar */}
            <div className="p-3 rounded-2xl bg-white/5 border border-[var(--border-color)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">معاينة شكل الاسم في شاشة الاتصال:</span>
              <span className="font-black text-emerald-400 font-mono text-xs bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                {sampleNamePreview}
              </span>
            </div>
          </div>

          {/* SECTION 3: ADVANCED SETTINGS & ISOLATION LABEL */}
          <div className="p-4 rounded-2xl bg-white/5 border border-[var(--border-color)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-xs block text-white">
                  اسم التصنيف / المجلد في Google Contacts (Label):
                </label>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  يضمن عزل كافة أرقام المنشآت في مجلد مستقل يمكنك حذفه أو تحديثه بنقرة واحدة
                </p>
              </div>
              <input
                type="text"
                value={groupLabel}
                onChange={(e) => setGroupLabel(e.target.value)}
                placeholder="دليلك"
                className="w-full sm:w-40 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-center font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--border-color)]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeOwnerPhone}
                  onChange={(e) => setIncludeOwnerPhone(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-white/20 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300">تضمين هاتف صاحب المكان (إن وجد رقم مختلف)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeLandlines}
                  onChange={(e) => setIncludeLandlines(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-white/20 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300">تضمين الأرقام الأرضية والخطوط الساخنة (رقم عمل)</span>
              </label>
            </div>
          </div>

          {/* SECTION 4: DATA QUALITY & AUDIT STATS */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-white/5 border border-[var(--border-color)]">
              <p className="text-[10px] text-[var(--text-secondary)]">إجمالي المنشآت</p>
              <p className="text-base font-black text-white font-mono mt-0.5">{stats.total}</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-[10px] text-emerald-400 font-bold">محمول جاهز للواتساب</p>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">{stats.validMobiles}</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-[10px] text-amber-400 font-bold">أرقام وهمية مستبعدة</p>
              <p className="text-base font-black text-amber-400 font-mono mt-0.5">{stats.invalidOrDummy}</p>
            </div>
          </div>

          {/* SECTION 5: STEP-BY-STEP OPERATIONAL GUIDE (ACCORDION) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2 font-black text-xs text-emerald-400">
                <Smartphone className="w-4 h-4" />
                <span>دليل الاستيراد السريع وضبط الهاتف (خطوات منع التداخل وحفظ الأمان 100%)</span>
              </div>
              {showInstructions ? (
                <ChevronUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {showInstructions && (
              <div className="p-4 pt-1 space-y-3 text-[11px] leading-relaxed text-slate-300 border-t border-emerald-500/20">
                {/* Step 1 */}
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-white">تحميل الملف واستيراده في Google Contacts:</strong>
                    <p className="text-slate-300 mt-0.5">
                      اضغط زر <strong>«تحميل ملف جهات الاتصال»</strong> بالأسفل، ثم افتح الموقع الرسمي{' '}
                      <a
                        href="https://contacts.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline font-bold inline-flex items-center gap-0.5"
                      >
                        contacts.google.com <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      مسجلاً الدخول ببريد المنظومة، واضغط <strong>«استيراد (Import)»</strong> واختر الملف المحمل.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-white">تفعيل مزامنة جهات الاتصال في هاتفك (Android / iPhone):</strong>
                    <p className="text-slate-300 mt-0.5">
                      في إعدادات هاتفك، ادخل إلى <strong>الحسابات (Accounts) &gt; حساب Google التابع للمنظومة</strong>، وتأكد
                      من تفعيل مفتاح <strong>«مزامنة جهات الاتصال (Contacts Sync)»</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-white">تحديث الأسماء داخل تطبيق WhatsApp فوراً:</strong>
                    <p className="text-slate-300 mt-0.5">
                      افتح تطبيق <strong>WhatsApp</strong> على الهاتف &gt; اضغط أيقونة بدء محادثة جديدة &gt; من القائمة العلوية
                      (الثلاث نقاط) اختر <strong>«تحديث (Refresh)»</strong>. ستتحول كافة الأرقام المراسلة إلى أسماء المنشآت
                      الرسمية فوراً!
                    </p>
                  </div>
                </div>

                {/* Safety Guarantee */}
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-2 text-teal-300">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[10.5px]">
                    <strong>ضمان العزل التام:</strong> يتم تصنيف كافة الأرقام تحت تصنيف <strong>«{groupLabel || 'دليلك'}»</strong>،
                    ولن يتم دمجها أو الخلط بينها وبين جهات اتصالك الشخصية، ويمكنك حذف التصنيف كاملاً أو تحديثه في ثوانٍ.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="p-4 sm:p-5 bg-white/5 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[var(--text-secondary)] font-mono">
            الملف الناتج: <span className="text-emerald-400 font-bold">.vcf (vCard 3.0 UTF-8)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              إغلاق
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting || stats.validMobiles === 0}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'جارٍ التوليد...' : `تحميل ملف جهات الاتصال (${stats.validMobiles} منشأة)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
