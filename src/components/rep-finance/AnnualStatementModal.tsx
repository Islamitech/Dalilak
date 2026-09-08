import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Representative } from '../../types';
import { Logo } from '../Logo';
import { toPng } from 'html-to-image';
import { generateQrDataUrl } from '../../utils/qrGenerator';
import { downloadSinglePhoto } from '../../utils/photoDownloader';
import { formatStandardDate } from '../../utils/dateFormatters';
import {
  FileText,
  Printer,
  Download,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Check,
  Copy,
} from 'lucide-react';

export interface AnnualStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  rep: Representative;
  commissionPercentage: number;
  settlement: any;
  referralSummary: any;
  referralCode: string;
  repMonthlyProfits: any[];
}

export const AnnualStatementModal: React.FC<AnnualStatementModalProps> = ({
  isOpen,
  onClose,
  rep,
  commissionPercentage,
  settlement,
  referralSummary,
  referralCode,
  repMonthlyProfits,
}) => {
  const statementRef = useRef<HTMLDivElement>(null);
  const [isSavingStatementImage, setIsSavingStatementImage] = useState(false);
  const [copiedStatementRef, setCopiedStatementRef] = useState(false);

  if (!isOpen) return null;

  const handlePrintStatement = () => {
    document.body.classList.add('printing-statement');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-statement');
    }, 1000);
  };

  const handleSaveStatementImage = async () => {
    if (!statementRef.current) return;
    try {
      setIsSavingStatementImage(true);
      const dataUrl = await toPng(statementRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
      });
      await downloadSinglePhoto(
        dataUrl,
        `كشف-حساب-رسمي-${rep.name.replace(/\s+/g, '-')}-${new Date().getFullYear()}.png`
      );
    } catch (err) {
      console.warn('html-to-image capture error, falling back to print:', err);
      handlePrintStatement();
    } finally {
      setIsSavingStatementImage(false);
    }
  };

  const totalSalesAll = repMonthlyProfits.reduce((s, m) => s + m.totalSales, 0);
  const totalCommissionsAll = repMonthlyProfits.reduce((s, m) => s + m.earnedCommission, 0);
  const totalPayoutsAll = repMonthlyProfits.reduce((s, m) => s + m.payoutsReceived, 0);
  const totalVerifiedAll = repMonthlyProfits.reduce((s, m) => s + m.verifiedBiz, 0);
  const netWithdrawable =
    settlement?.withdrawableBalance ?? totalCommissionsAll - totalPayoutsAll;
  const isDebt = Boolean(settlement?.isDebtToPlatform);
  const debtAmount = settlement?.debtToPlatformAmount || 0;
  const statementSerial = `DALIL-STMT-2026-${
    (rep.id || 'REP').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-8) || '8355'
  }`;
  const issueDateFormatted = formatStandardDate(new Date());
  const statementVerifyUrl = `https://www.dalilaak.com/?view=statement&rep=${encodeURIComponent(
    rep.id
  )}&serial=${statementSerial}`;
  const qrCodeDataUrl = generateQrDataUrl(statementVerifyUrl, 200);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-[var(--modal-bg)] border-2 border-amber-500/50 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl relative animate-fade-in my-auto max-h-[94vh] overflow-y-auto">
        {/* Modal Control Header (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                كشف الحساب المالي السنوي الرسمي المعتمد 2026
              </h4>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                وثيقة تسوية مالية معتمدة وموثقة بشعار المنصة وأختام الإدارة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintStatement}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs shadow-xs transition-transform active:scale-95"
              title="طباعة المستند الرسمي"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة المستند الرسمي</span>
            </button>

            <button
              type="button"
              onClick={handleSaveStatementImage}
              disabled={isSavingStatementImage}
              className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] font-bold px-3.5 py-2 rounded-xl border border-[var(--border-color)] flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
              title="تحميل كصورة PNG"
            >
              {isSavingStatementImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <Download className="w-4 h-4 text-amber-500" />
              )}
              <span className="hidden sm:inline">تحميل كصورة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer border border-[var(--border-color)] transition-colors"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>

        {/* OFFICIAL STATEMENT DOCUMENT CONTAINER */}
        <div
          ref={statementRef}
          id="official-statement-document"
          className="bg-white text-slate-900 rounded-3xl p-5 sm:p-7 border-2 border-slate-200 shadow-md space-y-5 relative overflow-hidden font-sans"
        >
          {/* Subtle Luxury Brand Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Logo size="2xl" showSubtitle={false} variant="watermark" />
          </div>

          {/* Top Official Platform Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-amber-500/30 pb-4">
            {/* Platform Brand Logo & Tagline */}
            <div className="flex items-center gap-3">
              <Logo size="lg" showSubtitle={true} variant="full" />
              <div className="border-r-2 border-amber-500/40 pr-3 mr-1 text-right">
                <span className="text-[11px] sm:text-xs font-black text-slate-900 block leading-tight">
                  منظومة دليلك للتوثيق والتحول الرقمي
                </span>
                <span className="text-[9.5px] sm:text-[10px] text-amber-800 font-bold block">
                  قطاع الإدارة المالية والحسابات المركزية المعتمدة
                </span>
                <span className="text-[9px] text-slate-400 font-mono block">
                  جمهورية مصر العربية • السجل الميداني والاعتماد
                </span>
              </div>
            </div>

            {/* Statement Serial & Status */}
            <div className="text-right sm:text-left space-y-1 w-full sm:w-auto">
              <div className="flex items-center sm:justify-end gap-1.5">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>مستند معتمد رسمياً 2026</span>
                </span>
              </div>
              <div className="text-xs font-mono font-black text-slate-800 tracking-wider" dir="ltr">
                {statementSerial}
              </div>
              <div className="text-[10px] text-slate-500 font-bold">
                تاريخ الإصدار: {issueDateFormatted}
              </div>
            </div>
          </div>

          {/* Document Formal Title Ribbon */}
          <div className="text-center py-2.5 px-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/80 rounded-2xl">
            <h3 className="font-black text-sm sm:text-base text-amber-950">
              كشف الحساب المالي والتسوية السنوية المعتمدة (2026)
            </h3>
            <p className="text-[10px] sm:text-[11px] text-amber-900/80 font-bold mt-0.5">
              وثيقة تسوية مالية رسمية لكافة العمليات الميدانية والعمولات المسجلة بالسجلات السحابية
            </p>
          </div>

          {/* Representative Official Information Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">المندوب المعتمد:</span>
              <span className="font-black text-slate-900 text-sm block truncate">{rep.name}</span>
              <span className="text-[10px] text-slate-500 font-mono block">كود: {rep.id}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">رقم الهاتف المسجل:</span>
              <span className="font-bold text-slate-800 font-mono text-xs block" dir="ltr">
                {rep.phone}
              </span>
              <span className="text-[10px] text-amber-800 font-bold block">
                نطاق: محافظة {rep.governorate}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">نسبة العمولة المعتمدة:</span>
              <span className="font-black text-emerald-700 text-sm font-mono block">
                {commissionPercentage}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold block">شريحة أساسية معتمدة</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">الصفة الوظيفية:</span>
              <span className="font-black text-slate-900 text-xs block truncate">
                {rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'}
              </span>
              <span className="text-[10px] text-purple-700 font-mono font-bold block">
                إحالة:{' '}
                {referralSummary.isUnlocked
                  ? referralCode || 'DALIL-8355'
                  : 'مقفل (قيد استكمال 25 نشاطاً)'}
              </span>
            </div>
          </div>

          {/* Summary KPI Indicators (Financial Position) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold block">
                إجمالي المبيعات المحققة
              </span>
              <span className="font-black font-mono text-sm sm:text-base text-slate-950 mt-1 block">
                {totalSalesAll.toLocaleString()}{' '}
                <span className="text-[10px] font-sans text-slate-500">ج.م</span>
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-700 font-bold block">
                إجمالي العمولات المستحقة
              </span>
              <span className="font-black font-mono text-sm sm:text-base text-emerald-700 mt-1 block">
                {totalCommissionsAll.toLocaleString()}{' '}
                <span className="text-[10px] font-sans text-emerald-600">ج.م</span>
              </span>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 shadow-2xs">
              <span className="text-[10px] text-blue-700 font-bold block">الحوالات المصروفة</span>
              <span className="font-black font-mono text-sm sm:text-base text-blue-700 mt-1 block">
                {totalPayoutsAll.toLocaleString()}{' '}
                <span className="text-[10px] font-sans text-blue-600">ج.م</span>
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border shadow-2xs ${
                isDebt
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                  : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 text-amber-950'
              }`}
            >
              <span className="text-[10px] text-slate-600 font-bold block">
                {isDebt ? 'مستحق للمنصة' : 'الرصيد الصافي المتاح'}
              </span>
              <span
                className={`font-black font-mono text-sm sm:text-base mt-1 block ${
                  isDebt ? 'text-amber-800' : 'text-amber-900'
                }`}
              >
                {isDebt
                  ? `-${Math.abs(debtAmount).toLocaleString()}`
                  : `+${Math.abs(netWithdrawable).toLocaleString()}`}{' '}
                <span className="text-[10px] font-sans">ج.م</span>
              </span>
            </div>
          </div>

          {/* Detailed Accounting Ledger Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs shadow-2xs">
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between font-black text-slate-700 text-xs">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>تفريغ العمليات والحركات المالية الشهرية</span>
              </span>
              <span className="text-[10.5px] text-slate-500 font-bold font-mono">
                إجمالي الأنشطة الموثقة: {totalVerifiedAll} نشاط
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500">
                    <th className="p-2.5">الشهر والفترة</th>
                    <th className="p-2.5 text-center">الأنشطة الموثقة</th>
                    <th className="p-2.5">المبيعات المحققة</th>
                    <th className="p-2.5">العمولة المستحقة</th>
                    <th className="p-2.5">الحوالات المصروفة</th>
                    <th className="p-2.5">الصافي التراكمي</th>
                    <th className="p-2.5 text-center">حالة القيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {repMonthlyProfits.length > 0 ? (
                    repMonthlyProfits.map((m) => {
                      const monthNet = m.earnedCommission - m.payoutsReceived;
                      return (
                        <tr key={m.monthKey} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-2.5 font-black text-slate-900">{m.monthLabel}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-amber-700">
                            {m.verifiedBiz}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-700">
                            {m.totalSales.toLocaleString()} ج.م
                          </td>
                          <td className="p-2.5 font-mono font-bold text-emerald-700">
                            {m.earnedCommission.toLocaleString()} ج.م
                          </td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">
                            {m.payoutsReceived.toLocaleString()} ج.م
                          </td>
                          <td className="p-2.5 font-mono font-black text-slate-900">
                            {monthNet >= 0
                              ? `+${monthNet.toLocaleString()}`
                              : monthNet.toLocaleString()}{' '}
                            ج.م
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="text-[9.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                              معتمد ومسوى ✓
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400 font-bold">
                        لا توجد حركات مسجلة لهذا الحساب حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5">الإجمالي العام السنوي</td>
                    <td className="p-2.5 text-center font-mono text-amber-800">{totalVerifiedAll}</td>
                    <td className="p-2.5 font-mono">{totalSalesAll.toLocaleString()} ج.م</td>
                    <td className="p-2.5 font-mono text-emerald-800">
                      {totalCommissionsAll.toLocaleString()} ج.م
                    </td>
                    <td className="p-2.5 font-mono text-blue-800">
                      {totalPayoutsAll.toLocaleString()} ج.م
                    </td>
                    <td className="p-2.5 font-mono text-amber-900">
                      {(totalCommissionsAll - totalPayoutsAll).toLocaleString()} ج.م
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="text-[9.5px] font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                        نهائي معتمد
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Seal, QR Verification & Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t-2 border-slate-100 items-center">
            {/* 1. Official Platform Circular Seal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 rounded-full border-4 border-dashed border-amber-600/80 p-1 flex items-center justify-center relative shadow-2xs rotate-[-4deg]">
                <div className="w-full h-full rounded-full border-2 border-amber-600 flex flex-col items-center justify-center p-1.5 bg-amber-500/10">
                  <span className="text-[8px] font-black text-amber-900 tracking-wider">
                    منظومة دليلك الرقمية
                  </span>
                  <div className="flex items-center gap-1 my-0.5 text-amber-700 text-[10px]">
                    <span>★</span>
                    <span className="font-black text-[9px] text-amber-950">معتمد رسمياً</span>
                    <span>★</span>
                  </div>
                  <span className="text-[7.5px] font-bold text-amber-800">
                    الإدارة المالية والحسابات
                  </span>
                  <div className="font-mono text-[8.5px] font-black text-amber-900 border-t border-b border-amber-600/40 px-2 py-0.2 my-0.5">
                    2026 - AUDITED
                  </div>
                  <span className="text-[7px] font-mono text-amber-700">
                    SERIAL: {statementSerial.slice(-8)}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-bold mt-1.5">
                ختم الإدارة المالية المعتمد
              </span>
            </div>

            {/* 2. QR Code Verification */}
            <div className="flex flex-col items-center justify-center text-center space-y-1">
              <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-18 h-18 rounded-lg block" />
              </div>
              <span className="text-[9.5px] font-black text-slate-800">رمز التحقق السحابي الفوري</span>
              <p className="text-[8.5px] text-slate-500 max-w-[170px] leading-tight">
                امسح الرمز للتحقق الفوري من صحة المستند ومطابقته بالسجلات السحابية
              </p>
            </div>

            {/* 3. Official Signatures Box */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right">
              <div className="border-b border-slate-200 pb-1.5">
                <span className="text-[9px] text-slate-400 font-bold block">المندوب الشريك المعتمد:</span>
                <span className="font-black text-xs text-slate-900">{rep.name}</span>
              </div>
              <div className="border-b border-slate-200 pb-1.5">
                <span className="text-[9px] text-slate-400 font-bold block">مراجعة وتدقيق الحسابات:</span>
                <span className="font-black text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>مطابق ومفحوص بالسجلات المركزية ✓</span>
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">اعتماد المدير العام:</span>
                <span className="font-black text-xs text-amber-900 font-serif">أحمد عزالدين محمد</span>
              </div>
            </div>
          </div>

          {/* Document Legal Footer Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-[9.5px] text-slate-500 font-medium">
            هذا المستند وثيقة تسوية مالية رسمية صادرة إلكترونياً عن منظومة دليلك (www.dalilaak.com)،
            ومسجلة في السجلات السحابية المعتمدة لعام 2026.
          </div>
        </div>

        {/* Bottom Action Footer (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)] no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrintStatement}
              className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-xs shadow-md transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند الرسمي</span>
            </button>

            <button
              type="button"
              onClick={handleSaveStatementImage}
              disabled={isSavingStatementImage}
              className="flex-1 sm:flex-none bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-2 cursor-pointer text-xs transition-colors"
            >
              {isSavingStatementImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <Download className="w-4 h-4 text-amber-500" />
              )}
              <span>تحميل صورة المستند (PNG)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(statementSerial);
                setCopiedStatementRef(true);
                setTimeout(() => setCopiedStatementRef(false), 2500);
              }}
              className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold px-3 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedStatementRef ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedStatementRef ? 'تم النسخ' : 'نسخ كود المستند'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold px-5 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
