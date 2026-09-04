import React from 'react';
import { Representative } from '../../types';
import { Logo } from '../Logo';
import { DocType } from '../DocViewerModal';
import { FileText, Printer, Download } from 'lucide-react';

interface RepIdCardTabProps {
  rep: Representative;
  qrImageUrl: string;
  repCode: string;
  commissionPercentage: number;
  onSelectDocType: (docType: DocType) => void;
}

export const RepIdCardTab: React.FC<RepIdCardTabProps> = ({
  rep,
  qrImageUrl,
  repCode,
  commissionPercentage,
  onSelectDocType,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Official Digital Field ID Card */}
        <div className="bg-gradient-to-br from-slate-900 via-amber-950/70 to-slate-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3.5 text-white">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="icon" />
              <h3 className="font-black text-xs sm:text-sm text-white">بطاقة التكليف الميداني الذكية</h3>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              صريحة وموثقة 2026
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-amber-500/30 shadow-inner">
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border border-amber-500/40 bg-white p-1 shrink-0"
            />
            <div className="space-y-0.5 sm:space-y-1 text-xs min-w-0 flex-1">
              <p className="font-black text-amber-300 text-sm sm:text-base truncate">{rep.name}</p>
              <p className="text-slate-200 font-bold text-[11px] sm:text-xs truncate">
                {rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'}
              </p>
              <p className="text-slate-400 text-[10px] sm:text-[11px]">
                نطاق العمل: محافظة {rep.governorate}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-400 font-mono font-black dir-ltr text-right pt-0.5">
                ID: {repCode}
              </p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 sm:p-3 rounded-xl text-[10px] sm:text-[11px] text-amber-200 text-center font-bold leading-relaxed">
            يسمح لحامل هذه البطاقة الرسمية بتمثيل منصة دليلك وتسجيل المحلات وإصدار الفواتير
            الإلكترونية المعتمدة.
          </div>
        </div>

        {/* 2. Official Field Documents & Verification Letters */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-3 transition-colors duration-300">
          <div className="border-b border-[var(--border-color)] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                التصاريح والمستندات الميدانية
              </h3>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
              جاهزة للطباعة
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Doc 1 */}
            <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between gap-2 hover:border-amber-500/30 transition-all">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">
                  خطاب التكليف والتصريح الميداني
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  مستند رسمي لإبرازه لأصحاب المحلات والجهات
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectDocType('field_letter')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>معاينة وطباعة</span>
              </button>
            </div>

            {/* Doc 2 */}
            <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between gap-2 hover:border-amber-500/30 transition-all">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">
                  بطاقة الهوية والباركود الرقمي
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  كارت رقمي مشفر بكود QR للتحقق السريع
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectDocType('digital_badge')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل الكارت</span>
              </button>
            </div>

            {/* Doc 3 */}
            <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between gap-2 hover:border-amber-500/30 transition-all">
              <div>
                <span className="font-bold text-[var(--text-primary)] block">
                  عقد ولائحة العمولات المعتمدة
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  لائحة حقوق المندوب والعمولة ({commissionPercentage}%)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectDocType('rep_contract')}
                className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] font-bold text-xs px-3 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 cursor-pointer shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>مراجعة اللائحة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
