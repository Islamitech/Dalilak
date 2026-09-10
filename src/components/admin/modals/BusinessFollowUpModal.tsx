import React, { useState } from 'react';
import { Business, AdminFollowUpNote, AdminFollowUpType, AdminFollowUpStatus, User } from '../../../types';
import { formatStandardDateTime } from '../../../utils/dateFormatters';
import { getBusinessFollowUpSummary } from '../../../utils/followUpUtils';
import { triggerHaptic } from '../../../utils/haptics';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { BaseModal } from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { WhatsAppButton } from '../../shared/WhatsAppButton';
import {
  ClipboardList,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  Check,
  Trash2,
  ExternalLink,
  Phone,
} from 'lucide-react';

export interface BusinessFollowUpModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBusiness: (updated: Business) => void;
  onOpenFullEdit?: (biz: Business) => void;
  currentUser?: User | null;
}

const TYPE_CONFIG: Record<AdminFollowUpType, { label: string; icon: string; bg: string }> = {
  call: { label: 'اتصال هاتفي', icon: '📞', bg: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
  visit: { label: 'زيارة ميدانية', icon: '🏃', bg: 'bg-purple-500/15 text-purple-700 border-purple-500/30' },
  payment: { label: 'تحصيل مالي', icon: '💰', bg: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  verification: { label: 'خرائط Google', icon: '🌐', bg: 'bg-blue-500/15 text-blue-700 border-blue-500/30' },
  general: { label: 'ملاحظة عامة', icon: '📝', bg: 'bg-slate-500/15 text-slate-700 border-slate-500/30' },
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

  if (!isOpen) return null;

  const rawPhone = business.phone || business.ownerPhone || '';
  const followUps = business.adminFollowUps || [];
  const fuSummary = getBusinessFollowUpSummary(business);

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

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={
          <div className="flex items-center gap-2 flex-wrap">
            <span>{business.nameAr}</span>
            <Badge variant="neutral" size="xs">
              {business.category} • {business.governorate}
            </Badge>
          </div>
        }
        subtitle="سجل المتابعات الإدارية وإدارة علاقات العملاء (CRM)"
        icon={<ClipboardList className="w-5 h-5" />}
        headerActions={
          rawPhone && (
            <WhatsAppButton
              phone={rawPhone}
              label="واتساب"
              size="sm"
            />
          )
        }
        footer={
          <div className="w-full flex items-center justify-between gap-2">
            {onOpenFullEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullEdit(business);
                }}
                className="text-amber-600 hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>فتح بطاقة النشاط الكاملة والتعديل</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="mr-auto"
            >
              إغلاق النافذة
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Overdue Alert Banner */}
          {fuSummary.hasOverdue && (
            <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 p-3 rounded-2xl text-xs font-black flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>تنبيه عاجل: توجد {fuSummary.overdueCount} متابعات متأخرة تجاوزت موعدها المحدد وتتطلب تدخلاً فورياً!</span>
              </div>
              <Badge variant="danger" size="xs">متأخرة</Badge>
            </div>
          )}

          {/* Form: Add Quick Note */}
          <form onSubmit={handleAddNote} className="bg-[var(--input-bg)] border border-[var(--border-color)] p-4 rounded-2xl space-y-3 shadow-inner">
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
                    setNewText((prev) => (prev ? `${prev} - ${tpl}` : tpl));
                    triggerHaptic('selection');
                  }}
                  className="shrink-0 bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-amber-600 border border-[var(--border-color)] hover:border-amber-500/40 text-[10.5px] font-bold px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={newText}
                onChange={(e) => {
                  setNewText(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                rows={2}
                placeholder="اكتب تفاصيل المكالمة، الاتفاق، أو الزيارة الميدانية هنا..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-[var(--text-muted)]"
              />
              {errorMsg && <p className="text-rose-500 text-[11px] font-bold mt-1">{errorMsg}</p>}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type Selection */}
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as AdminFollowUpType)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-bold py-1.5 px-2.5 rounded-xl outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Object.entries(TYPE_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.icon} {cfg.label}
                    </option>
                  ))}
                </select>

                {/* Status Selection */}
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AdminFollowUpStatus)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-bold py-1.5 px-2.5 rounded-xl outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="pending">⏳ معلقة (بانتظار إجراء)</option>
                  <option value="completed">✓ منجزة ومكتملة</option>
                  <option value="urgent">🚨 عاجلة وفورية</option>
                </select>

                {/* Next Date Input */}
                <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] py-1 px-2 rounded-xl text-[11px] text-[var(--text-muted)]">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[10px]">الموعد القادم:</span>
                  <input
                    type="date"
                    value={newNextDate}
                    onChange={(e) => setNewNextDate(e.target.value)}
                    className="bg-transparent text-[var(--text-primary)] outline-none text-[11px] font-mono cursor-pointer"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                تسجيل المتابعة
              </Button>
            </div>
          </form>

          {/* Timeline History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>سجل الإجراءات السابق ({followUps.length}):</span>
              </span>
              {followUps.length > 0 && (
                <span className="text-[10px] text-[var(--text-muted)] font-bold">
                  مرتب من الأحدث إلى الأقدم
                </span>
              )}
            </div>

            {followUps.length === 0 ? (
              <div className="text-center py-8 bg-[var(--input-bg)]/40 rounded-2xl border border-dashed border-[var(--border-color)] space-y-2">
                <ClipboardList className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
                <p className="text-xs text-[var(--text-muted)] font-bold">
                  لا توجد متابعات مسجلة لهذا النشاط حتى الآن.
                </p>
                <p className="text-[10.5px] text-[var(--text-muted)]">
                  استخدم النموذج أعلاه لتدوين مكالمة أو زيارة ميدانية لتنسيق العمل مع الإدارة.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {followUps.map((note) => {
                  const cfg = TYPE_CONFIG[note.type] || TYPE_CONFIG.general;
                  const isCompleted = note.status === 'completed';
                  const isUrgent = note.status === 'urgent';

                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                        isCompleted
                          ? 'bg-[var(--bg-card)] border-[var(--border-color)] opacity-75'
                          : isUrgent
                          ? 'bg-rose-500/5 border-rose-500/30'
                          : 'bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs'
                      }`}
                    >
                      {/* Note Header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[var(--border-color)]/60 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.bg}`}>
                            {cfg.icon} {cfg.label}
                          </span>

                          <Badge
                            variant={isCompleted ? 'success' : isUrgent ? 'danger' : 'warning'}
                            size="xs"
                          >
                            {isCompleted ? 'مكتملة ✓' : isUrgent ? 'عاجلة 🚨' : 'معلقة ⏳'}
                          </Badge>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(note.id)}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-transform active:scale-95 ${
                              isCompleted
                                ? 'bg-slate-500/10 text-slate-500 border-slate-500/30 hover:bg-emerald-500/20'
                                : 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/30'
                            }`}
                          >
                            {isCompleted ? 'إعادة الفتح ↺' : 'إنجاز ✓'}
                          </button>
                        </div>

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
      </BaseModal>

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
    </>
  );
};
