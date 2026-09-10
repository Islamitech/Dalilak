import React, { useState, useCallback } from 'react';
import {
  UserCheck,
  Phone,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  Building2,
  ShieldCheck,
  Flame,
  FileText,
  Tag,
} from 'lucide-react';
import {
  InterestedLead,
  AdminFollowUpNote,
  AdminFollowUpType,
  AdminFollowUpStatus,
  LeadStatus,
  LeadInterestLevel,
  User,
} from '../types';
import { formatActivityDateTime } from '../utils/dateFormatters';
import { BaseModal } from './ui/BaseModal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { CopyButton } from './shared/CopyButton';
import { WhatsAppButton } from './shared/WhatsAppButton';
import { triggerHaptic } from '../utils/haptics';

export interface LeadFollowUpModalProps {
  lead: InterestedLead;
  currentUser?: User | null;
  onClose: () => void;
  onSaveLead: (updatedLead: InterestedLead) => void;
  onConvertToBusiness?: (lead: InterestedLead) => void;
}

const FOLLOW_UP_TYPE_LABELS: Record<AdminFollowUpType, { label: string; icon: string; color: string }> = {
  call: { label: 'اتصال هاتفي', icon: '📞', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30' },
  visit: { label: 'زيارة ميدانية', icon: '🏃', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
  verification: { label: 'مراجعة وتوثيق', icon: '🔍', color: 'bg-purple-500/15 text-purple-700 border-purple-500/30' },
  payment: { label: 'استفسار مالي / دفع', icon: '💰', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  general: { label: 'ملاحظة عامة', icon: '📝', color: 'bg-slate-500/15 text-slate-700 border-slate-500/30' },
};

const FOLLOW_UP_STATUS_LABELS: Record<AdminFollowUpStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'تم التنفيذ ✓', variant: 'success' },
  pending: { label: 'بانتظار الإجراء ⏳', variant: 'warning' },
  urgent: { label: 'عاجل وهام 🚨', variant: 'danger' },
};

export const LeadFollowUpModal: React.FC<LeadFollowUpModalProps> = ({
  lead,
  currentUser,
  onClose,
  onSaveLead,
  onConvertToBusiness,
}) => {
  const [currentLead, setCurrentLead] = useState<InterestedLead>(lead);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newNoteType, setNewNoteType] = useState<AdminFollowUpType>('call');
  const [newNoteStatus, setNewNoteStatus] = useState<AdminFollowUpStatus>('completed');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const extractNotesAndMapUrl = useCallback((notes?: string, locationUrl?: string): { cleanText: string; mapUrl?: string } => {
    if (!notes && !locationUrl) return { cleanText: '' };
    let url: string | undefined = locationUrl || undefined;
    let cleanText = notes || '';
    const urlRegex = /https?:\/\/(?:www\.google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)[^\s\n]*/g;
    const urlsInNotes = cleanText.match(urlRegex);
    if (urlsInNotes && urlsInNotes.length > 0) {
      if (!url) url = urlsInNotes[0];
      cleanText = cleanText.replace(urlRegex, '').replace(/📍\s*موقع الخريطة:\s*/g, '').trim();
      cleanText = cleanText.replace(/\|+/g, '').replace(/\n{3,}/g, '\n\n').trim();
    }
    return { cleanText, mapUrl: url };
  }, []);

  const waMsg = `أهلاً بحضرتك أستاذ ${currentLead.clientName}، بخصوص استفسارك عن إضافة "${currentLead.businessName || 'نشاطك التجاري'}" على منصة دليلك وتوثيقه على خرائط جوجل...`;

  const mapUrl =
    currentLead.locationUrl ||
    (currentLead.lat && currentLead.lng
      ? `https://www.google.com/maps?q=${currentLead.lat},${currentLead.lng}`
      : null);

  const handleAddFollowUpNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const authorName = currentUser?.name || 'مدير النظام';
    const authorRole = currentUser?.role === 'admin' ? 'مدير النظام' : currentUser?.role === 'supervisor' ? 'مشرف ميداني' : 'مسؤول إداري';

    const newNote: AdminFollowUpNote = {
      id: `lead_fn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: currentUser?.id || 'admin',
      authorName,
      authorRole,
      type: newNoteType,
      status: newNoteStatus,
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
      nextFollowUpDate: nextFollowUpDate || undefined,
    };

    const updatedFollowUps = [newNote, ...(currentLead.adminFollowUps || [])];
    const updatedLead: InterestedLead = {
      ...currentLead,
      adminFollowUps: updatedFollowUps,
      lastContactedDate: new Date().toISOString().split('T')[0],
      followUpDate: nextFollowUpDate || currentLead.followUpDate,
    };

    setCurrentLead(updatedLead);
    onSaveLead(updatedLead);
    setNewNoteText('');
    setNextFollowUpDate('');
    triggerHaptic('light');
    setNotification('تم تسجيل الملاحظة الإدارية وتحديث سجل المتابعات بنجاح');
    setTimeout(() => setNotification(null), 3000);
  };

  const confirmDeleteNote = () => {
    if (!noteToDeleteId) return;
    const updatedFollowUps = (currentLead.adminFollowUps || []).filter((n) => n.id !== noteToDeleteId);
    const updatedLead: InterestedLead = {
      ...currentLead,
      adminFollowUps: updatedFollowUps,
    };
    setCurrentLead(updatedLead);
    onSaveLead(updatedLead);
    setNoteToDeleteId(null);
    triggerHaptic('light');
    setNotification('تم حذف الملاحظة بنجاح');
    setTimeout(() => setNotification(null), 2500);
  };

  const handleToggleNoteStatus = (noteId: string) => {
    const updatedFollowUps = (currentLead.adminFollowUps || []).map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          status: (n.status === 'completed' ? 'pending' : 'completed') as AdminFollowUpStatus,
        };
      }
      return n;
    });
    const updatedLead: InterestedLead = {
      ...currentLead,
      adminFollowUps: updatedFollowUps,
    };
    setCurrentLead(updatedLead);
    onSaveLead(updatedLead);
    triggerHaptic('light');
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    const updated: InterestedLead = { ...currentLead, status: newStatus };
    setCurrentLead(updated);
    onSaveLead(updated);
    triggerHaptic('selection');
  };

  const handleInterestChange = (newInterest: LeadInterestLevel) => {
    const updated: InterestedLead = {
      ...currentLead,
      interestLevel: newInterest,
      isTrending: newInterest === 'trending_free',
    };
    setCurrentLead(updated);
    onSaveLead(updated);
    triggerHaptic('selection');
  };

  const { cleanText, mapUrl: parsedMapUrl } = extractNotesAndMapUrl(currentLead.notes, currentLead.locationUrl);
  const effectiveMapUrl = mapUrl || parsedMapUrl;

  return (
    <>
      <BaseModal
        isOpen={true}
        onClose={onClose}
        size="lg"
        title={
          <div className="flex items-center gap-2 flex-wrap">
            <span>{currentLead.businessName || currentLead.clientName}</span>
            {currentLead.isTrending ? (
              <Badge variant="warning" size="xs" icon={<Flame className="w-3 h-3 text-amber-500" />}>
                منشأة رائجة
              </Badge>
            ) : (
              <Badge variant="neutral" size="xs">
                عميل محتمل
              </Badge>
            )}
          </div>
        }
        subtitle={`محافظة ${currentLead.governorate} ${currentLead.city ? '• ' + currentLead.city : ''}`}
        icon={<UserCheck className="w-5 h-5" />}
        headerActions={
          <WhatsAppButton
            phone={currentLead.phone}
            message={waMsg}
            label="واتساب"
            size="sm"
          />
        }
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            <span className="text-[11px] text-[var(--text-muted)] font-bold">
              رقم سجل العميل: <span className="font-mono">{currentLead.id}</span>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              إغلاق
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {notification && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold flex items-center gap-2">
              <span>{notification}</span>
            </div>
          )}

          {/* Lead Details Card */}
          <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-bold">العميل:</span>
                <span className="font-black text-[var(--text-primary)]">{currentLead.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-bold">الهاتف:</span>
                <span className="font-mono font-black text-amber-600">{currentLead.phone}</span>
                <CopyButton textToCopy={currentLead.phone} size="xs" label="" copiedLabel="" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-bold">النشاط:</span>
                <span className="font-bold text-[var(--text-primary)]">{currentLead.businessCategory || 'عام'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-bold">المندوب:</span>
                <span className="font-bold text-[var(--text-primary)]">{currentLead.repName || 'مندوب معتمد'}</span>
              </div>
            </div>

            {/* Google Maps Location Link if available */}
            {effectiveMapUrl && (
              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                <a
                  href={effectiveMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 hover:underline flex items-center gap-1.5 font-bold truncate"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{effectiveMapUrl}</span>
                </a>
                <CopyButton textToCopy={effectiveMapUrl} size="xs" label="نسخ الرابط" />
              </div>
            )}

            {/* Quick Status Selectors */}
            <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)] font-bold">حالة المتابعة:</span>
                <select
                  value={currentLead.status}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2 py-1 text-xs font-bold text-[var(--text-primary)] outline-none"
                >
                  <option value="pending_followup">⏳ قيد المتابعة</option>
                  <option value="converted">✓ تم التحويل لنشاط معتمد</option>
                  <option value="cancelled">✕ ملغي / غير مهتم</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)] font-bold">مستوى الاهتمام:</span>
                <select
                  value={currentLead.interestLevel}
                  onChange={(e) => handleInterestChange(e.target.value as LeadInterestLevel)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2 py-1 text-xs font-bold text-[var(--text-primary)] outline-none"
                >
                  <option value="high">🔥 عالي جداً</option>
                  <option value="medium">⚡ متوسط</option>
                  <option value="low">🌱 منخفض</option>
                  <option value="trending_free">⭐ منشأة رائجة (مجاني)</option>
                </select>
              </div>

              {onConvertToBusiness && currentLead.status !== 'converted' && (
                <Button
                  variant="primary"
                  size="xs"
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onClose();
                    onConvertToBusiness(currentLead);
                  }}
                  className="mr-auto"
                >
                  تحويل لمنشأة معتمدة
                </Button>
              )}
            </div>
          </div>

          {/* Form: Add Follow Up Note */}
          <form onSubmit={handleAddFollowUpNote} className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 shadow-inner">
            <span className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>إضافة ملاحظة متابعة إدارية:</span>
            </span>

            {/* Quick Templates */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {[
                '📞 تم الاتصال وأكد رغبته بالاشتراك',
                '⏳ طلب معاودة الاتصال لاحقاً',
                '📍 تمت الزيارة الميدانية بنجاح',
                '💬 تم إرسال تفاصيل الباقات عبر الواتساب',
                '⚠️ العميل متردد بشأن التكلفة',
              ].map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewNoteText((prev) => (prev ? `${prev} - ${tpl}` : tpl))}
                  className="shrink-0 bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-amber-600 border border-[var(--border-color)] text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                >
                  {tpl}
                </button>
              ))}
            </div>

            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              rows={2}
              placeholder="اكتب تفاصيل المتابعة مع العميل..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 transition-all"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value as AdminFollowUpType)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-bold py-1.5 px-2 rounded-xl outline-none"
                >
                  {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.icon} {cfg.label}
                    </option>
                  ))}
                </select>

                <select
                  value={newNoteStatus}
                  onChange={(e) => setNewNoteStatus(e.target.value as AdminFollowUpStatus)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] font-bold py-1.5 px-2 rounded-xl outline-none"
                >
                  <option value="completed">✓ تم التنفيذ</option>
                  <option value="pending">⏳ بانتظار الإجراء</option>
                  <option value="urgent">🚨 عاجل وهام</option>
                </select>

                <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] py-1 px-2 rounded-xl text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[10px] text-[var(--text-muted)]">الموعد القادم:</span>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
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
                تسجيل
              </Button>
            </div>
          </form>

          {/* Follow up Notes Timeline */}
          <div className="space-y-2.5">
            <span className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>سجل المتابعات الإدارية ({currentLead.adminFollowUps?.length || 0}):</span>
            </span>

            {(!currentLead.adminFollowUps || currentLead.adminFollowUps.length === 0) ? (
              <div className="text-center py-6 bg-[var(--input-bg)]/40 rounded-xl border border-dashed border-[var(--border-color)] text-[var(--text-muted)]">
                لا توجد ملاحظات إدارية مسجلة بعد لهذا العميل.
              </div>
            ) : (
              <div className="space-y-2">
                {currentLead.adminFollowUps.map((note) => {
                  const typeConfig = FOLLOW_UP_TYPE_LABELS[note.type] || FOLLOW_UP_TYPE_LABELS.general;
                  const statusConfig = (note.status && FOLLOW_UP_STATUS_LABELS[note.status]) || FOLLOW_UP_STATUS_LABELS.pending;

                  return (
                    <div
                      key={note.id}
                      className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold border ${typeConfig.color}`}>
                            {typeConfig.icon} {typeConfig.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleNoteStatus(note.id)}
                            className="cursor-pointer"
                            title="اضغط لتغيير الحالة"
                          >
                            <Badge variant={statusConfig.variant} size="xs">
                              {statusConfig.label}
                            </Badge>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono text-[10px]">
                          <span>{formatActivityDateTime(note.createdAt)}</span>
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

                      <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed whitespace-pre-wrap">
                        {note.text}
                      </p>

                      {note.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold pt-1 border-t border-[var(--border-color)]">
                          <Clock className="w-3 h-3" />
                          <span>المتابعة القادمة المحددة: {note.nextFollowUpDate}</span>
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
