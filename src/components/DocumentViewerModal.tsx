import { OverlayLayer } from './ui/OverlayLayer';
import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ZoomIn, ZoomOut, ShieldCheck } from 'lucide-react';
import { Business } from '../types';
import { Button } from './design-system/Button';

interface DocumentViewerModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onApproveDocument?: (docType: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  business,
  isOpen,
  onClose,
  onApproveDocument
}) => {
  const [selectedDoc, setSelectedDoc] = useState<'commercial_reg' | 'tax_card' | 'license'>('commercial_reg');
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const docs = [
    {
      id: 'commercial_reg',
      title: 'السجل التجاري الرسمي',
      regNumber: `CR-${business.id.slice(0, 6).toUpperCase()}-2026`,
      status: 'verified',
      date: '2026-01-15',
      authority: 'مكتب السجل التجاري - وزارة التموين والتجارة الداخلية'
    },
    {
      id: 'tax_card',
      title: 'البطاقة الضريبية',
      regNumber: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'verified',
      date: '2025-11-20',
      authority: 'مصلحة الضرائب المصرية'
    },
    {
      id: 'license',
      title: 'رخصة مزاولة النشاط',
      regNumber: `LIC-EG-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      date: '2026-02-01',
      authority: `حي / مجلس مدينة ${business.city}`
    }
  ];

  const currentDoc = docs.find(d => d.id === selectedDoc) || docs[0];

  return (
    <OverlayLayer className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                فحص الوثائق والتراخيص الرسمية
                <span className="text-xs text-indigo-600 font-normal">({business.nameAr})</span>
              </h3>
              <p className="text-xs text-slate-500">تدقيق المستندات القانونية لتوثيق النشاط التجاري</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Selector Tabs */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex gap-2 overflow-x-auto">
          {docs.map(doc => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelectedDoc(doc.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedDoc === doc.id
                  ? 'bg-white text-indigo-600 shadow-xs border border-indigo-200'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{doc.title}</span>
              {doc.status === 'verified' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </button>
          ))}
        </div>

        {/* Document Preview Canvas */}
        <div className="p-6 bg-slate-50/50 flex flex-col items-center justify-center min-h-[300px] border-b border-slate-200">
          {/* Simulated Official Document Sheet */}
          <div
            className="bg-white rounded-xl border-2 border-slate-300 shadow-md p-6 max-w-lg w-full text-slate-800 space-y-4 transition-transform duration-200 relative overflow-hidden"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Watermark Pattern */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none rotate-[-25deg]">
              <span className="text-6xl font-black text-slate-900">دليلك الرسمي</span>
            </div>

            {/* Official Header */}
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 text-xs">
              <div className="text-right">
                <p className="font-bold text-slate-900">جمهورية مصر العربية</p>
                <p className="text-[11px] text-slate-500">{currentDoc.authority}</p>
              </div>
              <div className="w-10 h-10 rounded-full border border-indigo-200 bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                مصر
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span className="text-slate-500">اسم المنشأة التجاري:</span>
                <span className="font-bold text-slate-900">{business.nameAr}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span className="text-slate-500">رقم القيد / المستند:</span>
                <span className="font-mono font-bold text-indigo-600">{currentDoc.regNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span className="text-slate-500">الموقع والحي:</span>
                <span className="font-bold text-slate-800">{business.governorate} • {business.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span className="text-slate-500">المالك / الممثل القانوني:</span>
                <span className="font-bold text-slate-800">{business.ownerName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">تاريخ الإصدار / السريان:</span>
                <span className="font-bold text-slate-800">{currentDoc.date}</span>
              </div>
            </div>

            {/* Official Stamp & QR */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-[9px] text-slate-400">
                  [ QR كود ]
                </div>
                <div className="text-[10px] text-slate-500">
                  <p className="font-bold text-emerald-700">مستند رسمي معتمد</p>
                  <p>تم التحقق الميداني</p>
                </div>
              </div>

              <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600 flex items-center justify-center text-center rotate-[-15deg] text-emerald-700">
                <div className="text-[8px] font-black uppercase leading-tight">
                  ختم التوثيق<br />دليلك المعتمد<br />2026
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-3.5 bg-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(1.3, z + 0.1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.8, z - 0.1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              إغلاق المعاينة
            </Button>

            {onApproveDocument && (
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={() => {
                  onApproveDocument(selectedDoc);
                  onClose();
                }}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                اعتماد وصحة المستند
              </Button>
            )}
          </div>
        </div>
      </div>
    </OverlayLayer>
  );
};
