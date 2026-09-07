import React, { useState } from 'react';
import { Business, AdminFollowUpNote, AdminFollowUpCategory, AdminFollowUpStatus, AdminFollowUpType } from '../../types';
import { getFollowUpUrgency } from '../../utils/followUpUtils';
import {
  ClipboardList,
  Plus,
  AlertTriangle,
  ChevronUp,
  Send,
  Calendar,
  Layers,
} from 'lucide-react';

interface ContextualFollowUpStripProps {
  category: AdminFollowUpCategory;
  categoryLabel: string;
  categoryIcon?: React.ReactNode;
  business: Business;
  onSave: (updatedBiz: Business) => void;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  onOpenMasterDrawer?: (initialFilterCategory?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const ContextualFollowUpStrip: React.FC<ContextualFollowUpStripProps> = ({
  category,
  categoryLabel,
  categoryIcon,
  business,
  onSave,
  setFormData,
  currentUserName,
  currentUserId,
  userRole,
  onOpenMasterDrawer,
  onShowNotification,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [quickNoteText, setQuickNoteText] = useState<string>('');
  const [quickStatus, setQuickStatus] = useState<AdminFollowUpStatus>('pending');
  const [quickNextDate, setQuickNextDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allNotes = business.adminFollowUps || [];
  const categoryNotes = allNotes.filter(
    (n) => n.category === category || (!n.category && category === 'general')
  );
  const latestNote = categoryNotes[0] || null;
  const urgency = latestNote ? getFollowUpUrgency(latestNote) : null;

  const handleAddQuickNote = () => {
    if (!quickNoteText.trim()) {
      setErrorMsg('يرجى كتابة نص الملاحظة أولاً');
      return;
    }

    setIsSubmitting(true);
    try {
      // Automatic type assignment based on category
      const autoType: AdminFollowUpType =
        category === 'finance'
          ? 'payment'
          : category === 'maps' || category === 'directory'
          ? 'verification'
          : 'general';

      const newNote: AdminFollowUpNote = {
        id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: quickNoteText.trim(),
        type: autoType,
        status: quickStatus,
        category: category,
        authorName: currentUserName || 'المسؤول',
        authorId: currentUserId || 'admin',
        authorRole: userRole || 'admin',
        createdAt: new Date().toISOString(),
        nextFollowUpDate: quickNextDate ? quickNextDate : undefined,
      };

      const updatedFollowUps = [newNote, ...allNotes];
      const updatedBiz: Business = {
        ...business,
        adminFollowUps: updatedFollowUps,
      };

      setFormData(updatedBiz);
      onSave(updatedBiz);
      setQuickNoteText('');
      setQuickNextDate('');
      setErrorMsg(null);
      setIsExpanded(false);
      onShowNotification?.(`تم تسجيل متابعة ${categoryLabel} بنجاح 📋`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-[var(--border-color)]/70 space-y-2.5">
      {/* ── HEADER STRIP ── */}
      <div className="bg-[var(--input-bg)]/80 hover:bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-2.5 sm:p-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black shrink-0 border border-amber-500/20">
              {categoryIcon || <ClipboardList className="w-3.5 h-3.5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-[var(--text-primary)]">
                  متابعات {categoryLabel}
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded-full border border-amber-500/20">
                  {categoryNotes.length}
                </span>
                {urgency?.urgency === 'overdue' && (
                  <span className="text-[9.5px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/30 animate-pulse flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>متأخرة</span>
                  </span>
                )}
              </div>

              {latestNote ? (
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 font-bold">
                  <span className="text-[var(--text-secondary)] font-extrabold">{latestNote.authorName}: </span>
                  {latestNote.text}
                </p>
              ) : (
                <p className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
                  لا توجد متابعات مسجلة في هذا التبويب حتى الآن.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                isExpanded
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              <span>{isExpanded ? 'إلغاء' : 'تدوين ✍️'}</span>
            </button>

            {onOpenMasterDrawer && (
              <button
                type="button"
                onClick={() => onOpenMasterDrawer(category)}
                className="text-[11px] font-bold px-2 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer hidden sm:flex items-center gap-1"
                title="عرض كافة المتابعات في السجل الزمني"
              >
                <Layers className="w-3 h-3 text-amber-500" />
                <span>السجل</span>
              </button>
            )}
          </div>
        </div>

        {/* ── INLINE QUICK LOGGER EXPANSION ── */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black text-amber-600 dark:text-amber-400">
                تدوين ملاحظة سريعة في تبويب ({categoryLabel}):
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickStatus('completed')}
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    quickStatus === 'completed'
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                      : 'bg-[var(--bg-card)] text-slate-400 border-[var(--border-color)]'
                  }`}
                >
                  تم الإجراء ✓
                </button>
                <button
                  type="button"
                  onClick={() => setQuickStatus('pending')}
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    quickStatus === 'pending'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : 'bg-[var(--bg-card)] text-slate-400 border-[var(--border-color)]'
                  }`}
                >
                  معلقة ⏳
                </button>
                <button
                  type="button"
                  onClick={() => setQuickStatus('urgent')}
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    quickStatus === 'urgent'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                      : 'bg-[var(--bg-card)] text-slate-400 border-[var(--border-color)]'
                  }`}
                >
                  عاجل 🚨
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder={`اكتب تفاصيل الملاحظة أو المتابعة الخاصة بـ ${categoryLabel}...`}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 rounded-xl p-2 text-xs text-[var(--text-primary)] font-bold focus:outline-none shadow-inner resize-none"
            />

            {errorMsg && (
              <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input
                  type="date"
                  value={quickNextDate}
                  onChange={(e) => setQuickNextDate(e.target.value)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[10px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                  title="تاريخ المتابعة القادمة إن وجد"
                />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAddQuickNote}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>حفظ الملاحظة</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
