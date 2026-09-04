import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UserCheck,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
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

interface LeadFollowUpModalProps {
  lead: InterestedLead;
  currentUser?: User | null;
  onClose: () => void;
  onSaveLead: (updatedLead: InterestedLead) => void;
  onConvertToBusiness?: (lead: InterestedLead) => void;
}

const FOLLOW_UP_TYPE_LABELS: Record<AdminFollowUpType, { label: string; icon: string; color: string }> = {
  call: { label: 'اتصال هاتفي', icon: '📞', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  visit: { label: 'زيارة ميدانية', icon: '🚶‍♂️', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  verification: { label: 'مراجعة وتوثيق', icon: '🔍', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
  payment: { label: 'استفسار مالي / دفع', icon: '💰', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  general: { label: 'ملاحظة عامة', icon: '📝', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' },
};

const FOLLOW_UP_STATUS_LABELS: Record<AdminFollowUpStatus, { label: string; color: string }> = {
  completed: { label: 'تم التنفيذ ✅', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' },
  pending: { label: 'بانتظار الإجراء ⏳', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40' },
  urgent: { label: 'عاجل وهام 🔥', color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40' },
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

  const cleanPhone = (currentLead.phone || '').replace(/\D/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/2${cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone}?text=${encodeURIComponent(
        `أهلاً بحضرتك أستاذ ${currentLead.clientName}، بخصوص استفسارك عن إضافة "${currentLead.businessName || 'نشاطك التجاري'}" على منصة دليلك وتوثيقه على خرائط جوجل...`
      )}`
    : null;

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
    setNotification('✅ تم تسجيل الملاحظة الإدارية وتحديث سجل المتابعات بنجاح');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteFollowUpNote = (noteId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة الإدارية؟')) return;
    const updatedFollowUps = (currentLead.adminFollowUps || []).filter((n) => n.id !== noteId);
    const updatedLead: InterestedLead = {
      ...currentLead,
      adminFollowUps: updatedFollowUps,
    };
    setCurrentLead(updatedLead);
    onSaveLead(updatedLead);
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
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    const updatedLead: InterestedLead = { ...currentLead, status: newStatus };
    setCurrentLead(updatedLead);
    onSaveLead(updatedLead);
    setNotification(`تم تحديث حالة العميل إلى: ${newStatus === 'converted' ? 'تم التحويل لاشتراك' : newStatus === 'contacted' ? 'تم التواصل' : 'بانتظار المتابعة'}`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleInterestChange = (newLevel: LeadInterestLevel) => {
    const updatedLead: InterestedLead = { ...currentLead, interestLevel: newLevel };
    setCurrentLead(updatedLead);
    onSaveLead(updatedLead);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden text-[var(--text-primary)] animate-scale-up">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-b border-[var(--border-color)] p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                  {currentLead.businessName || currentLead.clientName}
                </h3>
                {currentLead.status === 'converted' && (
                  <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    تم التحويل لاشتراك 🌟
                  </span>
                )}
                {currentLead.status === 'contacted' && (
                  <span className="bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/30">
                    تم التواصل 📞
                  </span>
                )}
                {currentLead.status === 'pending_followup' && (
                  <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    بانتظار المتابعة ⏳
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                سجل المتابعات الإدارية • إدارة وتوثيق التواصل مع العميل
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {notification && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[var(--text-muted)] font-bold">صاحب النشاط:</span>
                <span className="font-black text-[var(--text-primary)]">{currentLead.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-[var(--text-muted)] font-bold">الهاتف:</span>
                <span className="font-mono font-bold text-[var(--text-primary)] dir-ltr">{currentLead.phone}</span>
                {currentLead.secondaryPhone && (
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">({currentLead.secondaryPhone})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="text-[var(--text-muted)] font-bold">المجال / النشاط:</span>
                <span className="font-bold text-[var(--text-primary)]">{currentLead.businessCategory || 'عام'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[var(--text-muted)] font-bold">المنطقة:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {currentLead.governorate}
                  {currentLead.city ? ` - ${currentLead.city}` : ''}
                  {currentLead.street ? ` - ${currentLead.street}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                <span className="text-[var(--text-muted)] font-bold">سجله المندوب:</span>
                <span className="font-bold text-[var(--text-primary)]">{currentLead.repName || 'مندوب معتمد'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-[var(--text-muted)] font-bold">تاريخ التسجيل:</span>
                <span className="font-mono text-[var(--text-muted)]">
                  {formatActivityDateTime(currentLead.createdDate)}
                </span>
              </div>
            </div>

            {/* Original Lead Visit Notes */}
            {currentLead.notes && (
              <div className="pt-2 border-t border-[var(--border-color)]">
                <span className="font-bold text-[11px] text-[var(--text-muted)] block mb-1">
                  📝 تقرير وملاحظات الزيارة الميدانية:
                </span>
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                  {currentLead.notes}
                </p>
              </div>
            )}

            {/* Location Link & Communication Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${currentLead.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال</span>
                </a>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                )}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>موقع الخريطة</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Convert to Business Quick Button */}
              {onConvertToBusiness && currentLead.status !== 'converted' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConvertToBusiness(currentLead);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تحويل إلى نشاط مسجل 🌟</span>
                </button>
              )}
            </div>
          </div>

          {/* CRM Status & Interest Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Lead Status Selector */}
            <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5">
              <label className="font-bold text-[11px] text-[var(--text-muted)] block">
                حالة العميل والمتابعة:
              </label>
              <select
                value={currentLead.status || 'pending_followup'}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="pending_followup">بانتظار المتابعة ⏳</option>
                <option value="contacted">تم التواصل والمتابعة 📞</option>
                <option value="converted">تم التحويل لاشتراك رسمي 🌟</option>
                <option value="cancelled">ملغي / غير مهتم ❌</option>
              </select>
            </div>

            {/* Interest Level Selector */}
            <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5">
              <label className="font-bold text-[11px] text-[var(--text-muted)] block">
                درجة اهتمام العميل:
              </label>
              <select
                value={currentLead.interestLevel || 'medium'}
                onChange={(e) => handleInterestChange(e.target.value as LeadInterestLevel)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="high">اهتمام مرتفع جداً 🔥 (أولوية قصوى)</option>
                <option value="medium">اهتمام متوسط ⚡ (متابعة عادية)</option>
                <option value="low">استفسار عام / غير محدد 💬</option>
              </select>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* ADMIN FOLLOW-UP LOGS & NEW NOTE FORM */}
          {/* ----------------------------------------------------------------- */}
          <div className="border border-emerald-500/30 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-500/5 via-[var(--bg-card)] to-teal-500/5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
              <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <span>سجل الملاحظات والمتابعات الإدارية الداخلية</span>
                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  {(currentLead.adminFollowUps || []).length} متابعة
                </span>
              </h4>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">
                خاص بالإدارة والمشرفين
              </span>
            </div>

            {/* Add Follow-Up Note Form */}
            <form onSubmit={handleAddFollowUpNote} className="space-y-3 bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Note Type */}
                <div>
                  <label className="font-bold text-[10px] text-[var(--text-muted)] block mb-1">
                    نوع الإجراء:
                  </label>
                  <select
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value as AdminFollowUpType)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                  >
                    <option value="call">📞 اتصال هاتفي</option>
                    <option value="visit">🚶‍♂️ زيارة ميدانية</option>
                    <option value="verification">🔍 مراجعة وتوثيق</option>
                    <option value="payment">💰 استفسار مالي / دفع</option>
                    <option value="general">📝 ملاحظة عامة</option>
                  </select>
                </div>

                {/* Note Status */}
                <div>
                  <label className="font-bold text-[10px] text-[var(--text-muted)] block mb-1">
                    حالة الإجراء:
                  </label>
                  <select
                    value={newNoteStatus}
                    onChange={(e) => setNewNoteStatus(e.target.value as AdminFollowUpStatus)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                  >
                    <option value="completed">✅ تم التنفيذ</option>
                    <option value="pending">⏳ بانتظار المتابعة</option>
                    <option value="urgent">🔥 عاجل وهام</option>
                  </select>
                </div>

                {/* Next Follow Up Date */}
                <div>
                  <label className="font-bold text-[10px] text-[var(--text-muted)] block mb-1">
                    تاريخ المتابعة القادمة:
                  </label>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[10px] text-[var(--text-muted)] block mb-1">
                  نص الملاحظة والتفاصيل الإدارية:
                </label>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="مثال: تم الاتصال بالعميل وأبدى موافقته على باقة التوثيق، وتم تحديد موعد الزيارة غداً الساعة 4 عصراً..."
                  rows={2}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل المتابعة الإدارية</span>
                </button>
              </div>
            </form>

            {/* Timeline of Previous Notes */}
            <div className="space-y-2.5">
              <span className="font-black text-xs text-[var(--text-secondary)] block">
                الجدول الزمني للمتابعات السابقة ({(currentLead.adminFollowUps || []).length}):
              </span>

              {(currentLead.adminFollowUps && currentLead.adminFollowUps.length > 0) ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {currentLead.adminFollowUps.map((note) => {
                    const typeConfig = FOLLOW_UP_TYPE_LABELS[note.type || 'general'] || FOLLOW_UP_TYPE_LABELS.general;
                    const statusConfig = FOLLOW_UP_STATUS_LABELS[note.status || 'completed'] || FOLLOW_UP_STATUS_LABELS.completed;

                    return (
                      <div
                        key={note.id}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1.5 shadow-2xs hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[var(--text-primary)]">{note.authorName}</span>
                            {note.authorRole && (
                              <span className="bg-[var(--input-bg)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md font-bold">
                                {note.authorRole}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full font-bold border ${typeConfig.color}`}>
                              {typeConfig.icon} {typeConfig.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleNoteStatus(note.id)}
                              className={`px-2 py-0.5 rounded-full font-bold border cursor-pointer hover:opacity-80 transition-opacity ${statusConfig.color}`}
                              title="اضغط لتغيير حالة الإجراء"
                            >
                              {statusConfig.label}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)] font-mono">
                              {formatActivityDateTime(note.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteFollowUpNote(note.id)}
                              className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1 cursor-pointer"
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
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold pt-1 border-t border-[var(--border-color)]">
                            <Clock className="w-3 h-3" />
                            <span>المتابعة القادمة المحددة: {note.nextFollowUpDate}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 bg-[var(--input-bg)] rounded-xl border border-dashed border-[var(--border-color)] text-[var(--text-muted)] text-[11px]">
                  لا توجد ملاحظات إدارية مسجلة لهذا العميل بعد. يمكنك تسجيل أول إجراء متابعة من النموذج أعلاه.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[var(--text-muted)] font-bold">
            رقم سجل العميل: <span className="font-mono">{currentLead.id}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[var(--text-primary)] font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
