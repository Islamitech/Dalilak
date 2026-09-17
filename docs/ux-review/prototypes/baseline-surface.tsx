import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BaseModal } from '../_audit/baseline-20260917/BaseModal';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { BottomNav } from '../../../src/components/BottomNav';
import { OverlayLayer } from '../../../src/components/ui/OverlayLayer';
import { ImagePreviewModal } from '../../../src/components/auth/ImagePreviewModal';
import '../../../src/index.css';

function Preview() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('home');
  const [submitted, setSubmitted] = useState(0);
  const [legacy, setLegacy] = useState(false);
  const [photo, setPhoto] = useState(false);
  return <main className="p-5 space-y-5" style={{ minHeight: 1200 }}>
    <h1 className="font-black text-xl">دليلك — فحص النوافذ والتنقل</h1>
    <p>بيانات صناعية؛ لا توجد اتصالات بقاعدة البيانات.</p>
    <button className="p-3 rounded-xl bg-amber-500" onClick={() => setOpen(true)}>فتح نافذة الاختبار</button>
    <button className="p-3 rounded-xl bg-amber-500" onClick={() => setLegacy(true)}>اختبار نافذة عالية الطبقة</button>
    <p>التبويب الحالي: {tab} — إرسال النموذج: {submitted}</p>
    <form onSubmit={e => { e.preventDefault(); setSubmitted(v => v + 1); }}>
      <BottomNav activeTab={tab} setActiveTab={setTab} isAdmin={false} />
    </form>
    <BaseModal isOpen={open} onClose={() => setOpen(false)} title="متابعة نشاط تجريبي بعنوان عربي طويل للتحقق من الالتفاف" subtitle="مراجعة البيانات قبل اعتماد الإجراء" size="sm" footer={<button className="p-3" onClick={() => setOpen(false)}>إنهاء المراجعة</button>}>
      <label htmlFor="note">ملاحظات المتابعة</label>
      <input id="note" className="border rounded-xl p-3 w-full" defaultValue="بيانات اختبار فقط" />
      <button className="p-3 bg-amber-500 rounded-xl mt-4" onClick={() => setConfirm(true)}>فتح تأكيد متداخل</button>
      <div className="space-y-4 mt-4">{Array.from({length: 12}, (_, i) => <p key={i}>تفاصيل تجريبية {i + 1} — نص طويل لفحص التمرير مع بقاء رأس النافذة متاحًا.</p>)}</div>
    </BaseModal>
    <ConfirmDialog isOpen={confirm} title="تأكيد تجريبي" message="اختبار Escape والعودة إلى النافذة السابقة" loading={busy} onCancel={() => setConfirm(false)} onConfirm={() => { setBusy(true); setTimeout(() => { setBusy(false); setConfirm(false); }, 8000); }} />
    {legacy && <OverlayLayer className="fixed inset-0 z-[100300] bg-slate-900/70 flex items-center justify-center p-4" onEscape={() => setLegacy(false)} aria-label="نافذة عالية الطبقة">
      <div className="bg-white p-6 rounded-xl space-y-4" style={{transform:'translateZ(0)'}}>
        <h2>نافذة أصلية بطبقة 100300</h2>
        <button className="p-3 bg-amber-500" onClick={() => setPhoto(true)}>فتح صورة بطبقة قديمة 9999</button>
        <button className="p-3" onClick={() => setLegacy(false)}>إغلاق الأصل</button>
        <ImagePreviewModal previewImage={photo ? {title:'صورة اختبار صناعية', url:'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260"><rect width="400" height="260" fill="#f59e0b"/><circle cx="200" cy="130" r="70" fill="#fff"/></svg>')} : null} onClose={() => setPhoto(false)} />
      </div>
    </OverlayLayer>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Preview /></React.StrictMode>);
