import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Globe,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Search,
} from 'lucide-react';
import { Business } from '../../../types';
import { getPublicDirectoryUrl, getBusinessSlug } from '../../../utils/directoryUrl';

interface ExportDirectoryLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBusinesses: Business[];
  filteredBusinesses: Business[];
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ExportDirectoryLinksModal: React.FC<ExportDirectoryLinksModalProps> = ({
  isOpen,
  onClose,
  allBusinesses,
  filteredBusinesses,
  onShowNotification,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchPreview, setSearchPreview] = useState<string>('');

  const verifiedBusinesses = useMemo(() => {
    return allBusinesses.filter(
      (b) => b.verificationStatus === 'verified' && (b as any).publishedStatus !== 'draft' && (b as any).publishedStatus !== 'unlisted'
    );
  }, [allBusinesses]);

  const activeBusinesses = useMemo(() => {
    const list = exportScope === 'all' ? verifiedBusinesses : filteredBusinesses;
    return list.filter((b) => (b as any).isDeleted !== true);
  }, [exportScope, verifiedBusinesses, filteredBusinesses]);

  const filteredPreview = useMemo(() => {
    if (!searchPreview.trim()) return activeBusinesses.slice(0, 30);
    const q = searchPreview.toLowerCase();
    return activeBusinesses
      .filter((b) => (b.nameAr || '').toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q) || (b.city || '').toLowerCase().includes(q))
      .slice(0, 30);
  }, [activeBusinesses, searchPreview]);

  if (!isOpen) return null;

  const handleCopySingle = async (biz: Business) => {
    const url = getPublicDirectoryUrl(biz);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(biz.id);
      setTimeout(() => setCopiedId(null), 2000);
      onShowNotification?.('تم نسخ رابط المنشأة النظيف بنجاح', 'success');
    } catch {}
  };

  const handleCopyAll = async () => {
    const lines = activeBusinesses.map((b) => {
      const url = getPublicDirectoryUrl(b);
      return `${b.nameAr || b.nameEn || 'نشاط'}\t${b.category || ''}\t${b.city || ''}\t${url}`;
    });
    const content = lines.join('\n');
    try {
      await navigator.clipboard.writeText(content);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
      onShowNotification?.(`تم نسخ ${activeBusinesses.length} رابط نظيف بنجاح`, 'success');
    } catch {}
  };

  const handleDownloadCsv = () => {
    const headers = ['معرف المنشأة', 'اسم المنشأة', 'التصنيف', 'المحافظة', 'المدينة', 'الرابط النظيف الدائم (SEO URL)'];
    const rows = activeBusinesses.map((b) => {
      const url = getPublicDirectoryUrl(b);
      return [
        `"${(b.id || '').replace(/"/g, '""')}"`,
        `"${(b.nameAr || b.nameEn || '').replace(/"/g, '""')}"`,
        `"${(b.category || '').replace(/"/g, '""')}"`,
        `"${(b.governorate || '').replace(/"/g, '""')}"`,
        `"${(b.city || '').replace(/"/g, '""')}"`,
        `"${url}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Dalilak_SEO_Links_${exportScope}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowNotification?.('تم تصدير ملف الروابط بنجاح', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-['Cairo',sans-serif]">
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-scale"
        style={{ direction: 'rtl' }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                <span>استخراج روابط الدليل النظيفة وخرائط الموقع</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  SEO Ready
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                توليد وتصدير الروابط الدلالية المعتمدة لمحركات البحث (Google / Bing) وحملات الأرشفة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] text-xs text-right">
          {/* Scope Selector */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>نطاق استخراج الروابط:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>كافة الأنشطة المعتمدة</span>
                </div>
                <span className="font-mono text-[11px] font-black bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {verifiedBusinesses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  exportScope === 'filtered'
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>النتائج المفلترة الحالية</span>
                </div>
                <span className="font-mono text-[11px] font-black bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {filteredBusinesses.length}
                </span>
              </button>
            </div>
          </div>

          {/* Sitemap Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>خريطة الموقع الرسمية لمحركات البحث (XML Sitemap)</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium">
                متاحة دائماً ومحدثة سحابياً تلقائياً بأحدث المنشآت: <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono text-[10.5px]">https://www.dalilaak.com/sitemap.xml</code>
              </p>
            </div>
            <a
              href="https://www.dalilaak.com/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-1 shrink-0 transition-colors"
            >
              <span>فتح XML</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Search Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs">معاينة الروابط النظيفة (أول 30 نشاط):</span>
              <span className="text-[11px] text-slate-500 font-medium">إجمالي {activeBusinesses.length} رابط جاهز</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPreview}
                onChange={(e) => setSearchPreview(e.target.value)}
                placeholder="تصفية سريعة بالاسم أو التصنيف أو المدينة..."
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/50">
              {filteredPreview.map((biz) => {
                const url = getPublicDirectoryUrl(biz);
                const isCopied = copiedId === biz.id;
                return (
                  <div key={biz.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-white transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs truncate">{biz.nameAr || biz.nameEn}</span>
                        <span className="text-[10px] text-slate-500 truncate bg-slate-200/70 px-1.5 py-0.2 rounded">{biz.category}</span>
                      </div>
                      <p className="text-[10.5px] font-mono text-indigo-700 truncate select-all mt-0.5" dir="ltr">
                        {url}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopySingle(biz)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isCopied ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="نسخ الرابط"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
                        title="فتح الرابط"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>تم نسخ كافة الروابط ({activeBusinesses.length})</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ كافة الروابط ({activeBusinesses.length})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>تصدير ملف CSV للـ SEO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
