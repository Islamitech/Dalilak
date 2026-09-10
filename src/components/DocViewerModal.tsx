import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Representative } from '../types';
import { Logo } from './Logo';
import { Printer, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { downloadSinglePhoto } from '../utils/photoDownloader';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { formatStandardDate } from '../utils/dateFormatters';
import { BaseModal } from './ui/BaseModal';
import { Button } from './ui/Button';
import { FieldLetterDoc, DigitalBadgeDoc, RepContractDoc } from './documents';

export type DocType = 'field_letter' | 'digital_badge' | 'rep_contract';

export interface DocViewerModalProps {
  docType: DocType | null;
  rep: Representative;
  onClose: () => void;
}

export const DocViewerModal: React.FC<DocViewerModalProps> = ({ docType, rep, onClose }) => {
  const docRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!docType) return null;

  const repCode = `REP-2026-${rep.id.replace(/\D/g, '') || '084'}`;
  const nationalId = rep.nationalId || '— (قيد التوثيق)';
  const qrData = `DALEELEK-OFFICIAL-CONTRACT-${rep.name}-${nationalId}-${repCode}`;
  const qrImageUrl = generateQrDataUrl(qrData, 150);

  const handleDownloadDocument = async () => {
    if (!docRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(docRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const docName =
        docType === 'field_letter'
          ? 'خطاب-تكليف-ميداني'
          : docType === 'digital_badge'
          ? 'بطاقة-هوية-رقمية'
          : 'عقد-مندوب-معتمد';
      await downloadSinglePhoto(dataUrl, `${docName}-${rep.name || 'مندوب'}-${repCode}.png`);
    } catch (err) {
      console.warn('Document capture notice, falling back to print:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const modalTitles: Record<DocType, string> = {
    field_letter: 'خطاب التكليف الميداني المعتمد',
    digital_badge: 'بطاقة الهوية الرقمية للمندوب',
    rep_contract: 'عقد التكليف والتعيين الرسمي',
  };

  return (
    <BaseModal
      isOpen={Boolean(docType)}
      onClose={onClose}
      title={modalTitles[docType]}
      subtitle={`كود المندوب: ${repCode}`}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-end no-print">
          <Button
            variant="primary"
            size="md"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
            className="w-full sm:w-auto"
          >
            طباعة الوثيقة المعتمدة
          </Button>

          <Button
            variant="secondary"
            size="md"
            loading={isDownloading}
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadDocument}
            className="w-full sm:w-auto"
          >
            {isDownloading ? 'جاري التحميل...' : 'تحميل نسخة'}
          </Button>
        </div>
      }
    >
      {/* Printable Official Document Container */}
      <div ref={docRef} className="bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-inner border border-slate-200 space-y-5">
        {/* Official Letterhead Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-500 pb-4">
          <div className="flex items-center gap-3">
            <Logo size="md" showSubtitle={false} />
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-900">منصة "دليلك للخدمات الرقمية"</h2>
              <p className="text-[10px] text-slate-500 font-bold">تسجيل وتوثيق الأنشطة التجارية في جمهورية مصر العربية</p>
            </div>
          </div>

          <div className="text-left text-xs">
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 inline-block">
              وثيقة قانونية رسمية
            </span>
            <p className="font-mono font-bold text-slate-700 mt-1 text-[11px]">كود المندوب: {repCode}</p>
            <p className="text-[10px] text-slate-500">التاريخ: {formatStandardDate(new Date())}</p>
          </div>
        </div>

        {/* Dynamic Atomic Document Views */}
        {docType === 'field_letter' && (
          <FieldLetterDoc rep={rep} repCode={repCode} nationalId={nationalId} />
        )}

        {docType === 'digital_badge' && (
          <DigitalBadgeDoc rep={rep} repCode={repCode} nationalId={nationalId} qrImageUrl={qrImageUrl} />
        )}

        {docType === 'rep_contract' && (
          <RepContractDoc rep={rep} repCode={repCode} nationalId={nationalId} />
        )}

        {/* Footer Verification Notice */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
          <span className="flex items-center gap-1 font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>وثيقة الكترونية رسمية مشفرة بضمان منصة دليلك 2026</span>
          </span>
          <img src={qrImageUrl} alt="QR Code" className="w-8 h-8 rounded border border-slate-300" />
        </div>
      </div>
    </BaseModal>
  );
};
