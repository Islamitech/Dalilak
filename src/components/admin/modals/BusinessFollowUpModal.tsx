import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Business, AdminFollowUpNote, AdminFollowUpType, AdminFollowUpStatus, User } from '../../../types';
import { formatStandardDateTime } from '../../../utils/dateFormatters';
import { getFollowUpUrgency, getBusinessFollowUpSummary } from '../../../utils/followUpUtils';
import { formatWhatsAppPhone } from '../../../utils/whatsappMessages';
import { triggerHaptic } from '../../../utils/haptics';
import { ConfirmDialog } from '../../ConfirmDialog';
import {
  ClipboardList,
  X,
  Phone,
  MessageCircle,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  Check,
  Trash2,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface BusinessFollowUpModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBusiness: (updated: Business) => void;
  onOpenFullEdit?: (biz: Business) => void;
  currentUser?: User | null;
}

const TYPE_CONFIG: Record<AdminFollowUpType, { label: string; icon: string; bg: string }> = {
  call: { label: 'اتصال هاتفي', icon: '📞', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  visit: { label: 'زيارة ميدانية', icon: '🏃', bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
  payment: { label: 'تحصيل مالي', icon: '💰', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  verification: { label: 'خرائط Google', icon: '🌐', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  general: { label: 'ملاحظة عامة', icon: '📝', bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' },
};

export const BusinessFollowUpModal: React.FC<BusinessFollowUpModalProps> = ({
  business,
  isOpen,
  onClose,
  onUpdateBusiness,
  onOpenFullEdit,
  currentUser,
}) => {
  const [newText, setNewText] = useState<string>('');
  const [newType, setNewType] = useState<AdminFollowUpType>('call');
  const [newStatus, setNewStatus] = useState<AdminFollowUpStatus>('pending');
  const [newNextDate, setNewNextDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  if (!isOpen) return null;

  const rawPhone = business.phone || business.ownerPhone || '';
  const cleanPhone = formatWhatsAppPhone(rawPhone);
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : undefined;

  const followUps = business.adminFollowUps || [];
  const fuSummary = getBusinessFollowUpSummary(business);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const diff = e.changedTouches[0].clientY - touchStartY;
    if (diff > 75) {
      triggerHaptic('light');
      onClose();
    }
    setTouchStartY(null);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      setErrorMsg('يرجى كتابة نص المتابعة أو تفاصيل الإجراء');
      return;
    }

    const authorName = currentUser?.name || 'مدير النظام';
    const authorRole = currentUser?.role || 'admin';

    const newNote: AdminFollowUpNote = {
      id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: currentUser?.id || 'admin',
      authorName,
      authorRole,
      type: newType,
      status: newStatus,
      text: newText.trim(),
      createdAt: new Date().toISOString(),
      nextFollowUpDate: newNextDate ? newNextDate : undefined,
    };

    const updatedFollowUps = [newNote, ...followUps];
    const updatedBiz: Business = {
      ...business,
      adminFollowUps: updatedFollowUps,
    };

    onUpdateBusiness(updatedBiz);
    setNewText('');
    setNewNextDate('');
    setErrorMsg(null);
    triggerHaptic('light');
  };

  const handleToggleStatus = (noteId: string) => {
    const updatedFollowUps = followUps.map((n) => {
      if (n.id === noteId) {
        const nextStatus: AdminFollowUpStatus = n.status === 'completed' ? 'pending' : 'completed';
        return { ...n, status: nextStatus };
      }
      return n;
    });

    const updatedBiz: Business = {
      ...business,
      adminFollowUps: updatedFollowUps,
    };

    onUpdateBusiness(updatedBiz);
    triggerHaptic('light');
  };

  const confirmDeleteNote = () => {
    if (!noteToDeleteId) return;
    const updatedFollowUps = followUps.filter((n) => n.id !== noteToDeleteId);
    const updatedBiz: Business = {
      ...business,
      adminFollowUps: updatedFollowUps,
    };
    onUpdateBusiness(updatedBiz);
    setNoteToDeleteId(null);
    triggerHaptic('light');
  };

  return createPortal(
    <div className="fixed inset-0 z-[10060] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in text-right">
      <div className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-0 sm:my-auto relative text-[var(--text-primary)] transition-all duration-300 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Mobile Pull Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full sm:hidden flex justify-center pt-0 pb-1 cursor-grab active:cursor-grabbing select-none"
          title="اسحب لأسفل للإغلاق"
        >
          <div className="w-12 h-1.5 bg-slate-400/40 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold border border-[var(--border-color)] cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 pl-8">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 border ${
              fuSummary.hasOverdue
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-500 animate-pulse'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-500'
            }`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-[var(--text-primary)] leading-none">
                  {business.nameAr}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-[var(--border-color)]">
                  {business.category} • {business.governorate}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-bold mt-1">
                سجل المتابعات الإدارية وإدارة علاقات العملاء (CRM)
              </p>
            </div>
          </div>

          {/* Quick WhatsApp Link */}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0 ml-2"
              title="محادثة واتساب سريعة مع العميل"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب</span>
            </a>
          )}
        </div>

        {/* ── OVERDUE ALERT BANNER (If Any) ── */}
        {fuSummary.hasOverdue && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2.5 rounded-2xl text-xs font-black flex items-center justify-between gap-2 animate-pulse shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>تنبيه عاجل: توجد {fuSummary.overdueCount} متابعات متأخرة تجاوزت موعدها المحدد وتتطلب تدخلاً فورياً!</span>
            </div>
            <span className="text-[10px] bg-rose-500/25 text-rose-700 dark:text-rose-200 px-2 py-0.5 rounded-md shrink-0">
              متأخرة 🚨
            </span>
          </div>
        )}

        {/* ── SCROLLABLE CONTENT AREA ── */}
        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar text-xs flex-1">
          
          {/* ── FORM: ADD QUICK NOTE ── */}
          <form onSubmit={handleAddNote} className="bg-[var(--input-bg)] border border-[var(--border-color)] p-3.5 rounded-2xl space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
                <span>تدوين إجراء أو ملاحظة جديدة:</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                المسؤول: <strong className="text-[var(--text-primary)]">{currentUser?.name || 'مدير النظام'}</strong>
              </span>
            </div>

            {/* Quick Templates */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {[
                '📞 تم الاتصال وأكد السداد غداً',
                '⏳ طلب مهلة للمراجعة',
                '📍 تمت المعاينة ومطابقة اللافتة',
                '🌐 تم رفع وتوثيق الخريطة',
                '💳 تم إرسال بيانات السداد',
                '⚠️ لم يرد وتم إرسال واتساب',
              ].map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewText(tpl);
                    setErrorMsg(null);
                  }}
                  className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap cursor-pointer transition-colors"
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* Note Textarea */}
            <textarea
              rows={2}
              value={newText}
              onChange={(e) => {
                setNewText(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="اكتب تفاصيل المكالمة أو الإجراء أو الملاحظة هنا..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] rounded-xl p-2.5 text-xs font-medium focus:outline-none transition-colors leading-relaxed resize-none shadow-xs"
            />

            {/* Controls: Type + Status + Next Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              {/* Type Select */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] block mb-1">
                  طبيعة الإجراء:
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as AdminFollowUpType)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="call">📞 اتصال هاتفي</option>
                  <option value="visit">🏃 زيارة ميدانية</option>
                  <option value="payment">💰 تحصيل مالي</option>
                  <option value="verification">🌐 خرائط Google</option>
                  <option value="general">📝 ملاحظة عامة</option>
                </select>
              </div>

              {/* Status Select */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] block mb-1">
                  حالة الإجراء:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AdminFollowUpStatus)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="pending">⏳ معلق للمتابعة</option>
                  <option value="urgent">🚨 عاجل وهام</option>
                  <option value="completed">✅ تم الإنجاز</option>
                </select>
              </div>

              {/* Next Follow-up Date */}
              <div>
                <label className="text-[10.5px] font-bold text-[var(--text-muted)] block mb-1">
                  موعد المتابعة القادم:
                </label>
                <input
                  type="date"
                  value={newNextDate}
                  onChange={(e) => setNewNextDate(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={!newText.trim()}
                className={`font-black text-xs py-2 px-5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  newText.trim()
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>تسجيل المتابعة</span>
              </button>
            </div>
          </form>

          {/* ── TIMELINE LIST ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
              <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>سجل المتابعات السابقة ({followUps.length})</span>
              </h4>
              <span className="text-[10.5px] text-[var(--text-muted)] font-bold">
                مرتبة من الأحدث للأقدم
              </span>
            </div>

            {followUps.length === 0 ? (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 text-center space-y-1.5 text-[var(--text-muted)]">
                <ClipboardList className="w-7 h-7 mx-auto opacity-30" />
                <p className="font-bold text-xs">لا توجد متابعات مسجلة لهذا النشاط بعد.</p>
                <p className="text-[10px]">استخدم النموذج أعلاه لتوثيق اتصالاتك وملاحظاتك الميدانية.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {followUps.map((note) => {
                  const tConfig = TYPE_CONFIG[note.type] || TYPE_CONFIG.general;
                  const urgencyInfo = getFollowUpUrgency(note);
                  const isCompleted = note.status === 'completed';

                  return (
                    <div
                      key={note.id}
                      className={`bg-[var(--bg-card)] border rounded-2xl p-3 space-y-2 transition-all shadow-2xs ${
                        urgencyInfo.urgency === 'overdue'
                          ? 'border-rose-500/40 bg-rose-500/5'
                          : urgencyInfo.urgency === 'due_today'
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-[var(--border-color)] hover:border-amber-500/30'
                      }`}
                    >
                      {/* Note Header: Type + Author + Urgency Pill + Date */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[var(--border-color)] pb-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${tConfig.bg}`}>
                            {tConfig.icon} {tConfig.label}
                          </span>

                          <span className="font-black text-[var(--text-primary)]">
                            {note.authorName}
                          </span>

                          {/* Urgency Traffic-Light Pill */}
                          <span className={`text-[9.5px] px-2 py-0.5 rounded-full border ${urgencyInfo.badgeClass}`}>
                            {urgencyInfo.label}
                          </span>

                          {/* Quick Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(note.id)}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-transform active:scale-95 ${
                              isCompleted
                                ? 'bg-slate-500/10 text-slate-500 border-slate-500/30 hover:bg-emerald-500/20'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            }`}
                            title={isCompleted ? 'إعادة فتح المتابعة كمعلقة' : 'تحديد المتابعة كمكتملة'}
                          >
                            {isCompleted ? 'إعادة الفتح ↺' : 'إنجاز ✓'}
                          </button>
                        </div>

                        {/* Date & Actions */}
                        <div className="flex items-center gap-1.5 mr-auto">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] dir-ltr">
                            {formatStandardDateTime(note.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setNoteToDeleteId(note.id)}
                            className="text-[var(--text-muted)] hover:text-rose-500 p-1 cursor-pointer transition-colors"
                            title="حذف الملاحظة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Note Body Text */}
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-medium">
                        {note.text}
                      </p>

                      {/* Next Follow-up Date Tag */}
                      {note.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-[10.5px] text-[var(--text-muted)] pt-0.5">
                          <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>الموعد المحدد للمتابعة: </span>
                          <strong className="font-mono font-bold text-[var(--text-primary)]">{note.nextFollowUpDate}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
          {onOpenFullEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullEdit(business);
              }}
              className="text-amber-600 dark:text-amber-400 hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>فتح بطاقة النشاط الكاملة والتعديل</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mr-auto bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-2 px-4 rounded-xl border border-[var(--border-color)] cursor-pointer transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>

      {/* Confirm Delete Note Dialog */}
      <ConfirmDialog
        isOpen={Boolean(noteToDeleteId)}
        title="حذف المتابعة الإدارية"
        message="هل أنت متأكد من رغبتك في حذف هذه الملاحظة الإدارية نهائياً؟"
        confirmLabel="حذف الملاحظة"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={confirmDeleteNote}
        onCancel={() => setNoteToDeleteId(null)}
      />
    </div>,
    document.body
  );
};
