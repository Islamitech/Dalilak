import React, { useState, useEffect } from 'react';
import { Business, AdminFollowUpNote, AdminFollowUpType, AdminFollowUpStatus, AdminFollowUpCategory, User } from '../../types';
import { isSuperAdmin } from '../../utils/permissions';
import { formatStandardDateTime } from '../../utils/dateFormatters';
import { getFollowUpUrgency } from '../../utils/followUpUtils';
import { ConfirmDialog } from '../ConfirmDialog';
import {
  ClipboardList,
  Plus,
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  Search,
  Calendar,
  Trash2,
  Lock,
  X,
  Phone,
  Navigation,
  DollarSign,
  Globe,
  FileText,
  Store,
  MapPin,
  Image as ImageIcon,
  Tag,
  MessageCircle,
} from 'lucide-react';

interface EditFollowUpsTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  onSave: (updatedBiz: Business) => void;
  currentUser?: User | null;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  currentRoleTitle?: string;
  onShowNotification?: (msg: string) => void;
  initialCategory?: AdminFollowUpCategory | 'all';
  onCloseDrawer?: () => void;
}

export const EditFollowUpsTab: React.FC<EditFollowUpsTabProps> = ({
  formData,
  setFormData,
  onSave,
  currentUser,
  currentUserName,
  currentUserId,
  userRole,
  currentRoleTitle,
  onShowNotification,
  initialCategory = 'all',
  onCloseDrawer,
}) => {
  const isSuperAdminViewer = isSuperAdmin(currentUser);

  const [newFollowUpText, setNewFollowUpText] = useState('');
  const [newFollowUpType, setNewFollowUpType] = useState<AdminFollowUpType | null>(null);
  const [newFollowUpStatus, setNewFollowUpStatus] = useState<AdminFollowUpStatus | null>(null);
  const [newFollowUpCategory, setNewFollowUpCategory] = useState<AdminFollowUpCategory>('general');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [followUpFilterType, setFollowUpFilterType] = useState<AdminFollowUpType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AdminFollowUpCategory | 'all'>(initialCategory);
  const [followUpSearch, setFollowUpSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory && initialCategory !== 'all') {
      setCategoryFilter(initialCategory);
      setNewFollowUpCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleAddFollowUp = () => {
    if (!newFollowUpText.trim()) {
      setFollowUpError('يرجى كتابة نص الملاحظة أولاً');
      return;
    }
    if (!newFollowUpType) {
      setFollowUpError('يرجى اختيار طبيعة الإجراء (اتصال، زيارة، سداد...)');
      return;
    }
    if (!newFollowUpStatus) {
      setFollowUpError('يرجى اختيار حالة الإجراء (مكتمل، معلق، عاجل)');
      return;
    }

    const noteId = `fu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const effectiveCategory = newFollowUpCategory || (categoryFilter !== 'all' ? categoryFilter : 'general');

    const newNote: AdminFollowUpNote = {
      id: noteId,
      text: newFollowUpText.trim(),
      type: newFollowUpType,
      status: newFollowUpStatus,
      category: effectiveCategory,
      createdAt: new Date().toISOString(),
      authorId: currentUserId || currentUser?.id || 'admin',
      authorName: currentUserName || currentUser?.name || 'الإدارة',
      authorRole: userRole || currentUser?.role || 'admin',
      nextFollowUpDate: nextFollowUpDate || undefined,
    };

    const currentFollowUps = formData.adminFollowUps || [];
    const updatedFollowUps = [newNote, ...currentFollowUps];

    const updatedBiz: Business = {
      ...formData,
      adminFollowUps: updatedFollowUps,
    };

    setFormData(updatedBiz);
    onSave(updatedBiz);

    setNewFollowUpText('');
    setNewFollowUpType(null);
    setNewFollowUpStatus(null);
    setNextFollowUpDate('');
    setFollowUpError(null);
    onShowNotification?.('تم تسجيل وحفظ الملاحظة بنجاح');
  };

  const handleToggleFollowUpStatus = (noteId: string) => {
    const currentFollowUps = formData.adminFollowUps || [];
    const updatedFollowUps = currentFollowUps.map((n) => {
      if (n.id !== noteId) return n;
      const nextStatus: AdminFollowUpStatus =
        n.status === 'completed' ? 'pending' : 'completed';
      return { ...n, status: nextStatus };
    });

    const updatedBiz: Business = {
      ...formData,
      adminFollowUps: updatedFollowUps,
    };
    setFormData(updatedBiz);
    onSave(updatedBiz);
  };

  const handleDeleteFollowUp = (noteId: string) => {
    setDeleteConfirmId(noteId);
  };

  const confirmDeleteFollowUp = () => {
    if (!deleteConfirmId) return;
    const currentFollowUps = formData.adminFollowUps || [];
    const updatedFollowUps = currentFollowUps.filter((n) => n.id !== deleteConfirmId);
    setDeleteConfirmId(null);

    const updatedBiz: Business = {
      ...formData,
      adminFollowUps: updatedFollowUps,
    };
    setFormData(updatedBiz);
    onSave(updatedBiz);
  };

  const getTypeInfo = (type: AdminFollowUpType) => {
    switch (type) {
      case 'call':
        return { label: 'اتصال هاتفي', Icon: Phone, bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      case 'visit':
        return { label: 'زيارة ميدانية', Icon: Navigation, bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' };
      case 'payment':
        return { label: 'متابعة سداد', Icon: DollarSign, bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
      case 'verification':
        return { label: 'توثيق الخريطة', Icon: Globe, bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' };
      default:
        return { label: 'ملاحظة عامة', Icon: FileText, bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' };
    }
  };

  const getCategoryInfo = (cat?: AdminFollowUpCategory) => {
    switch (cat) {
      case 'directory':
        return { label: 'الدليل', Icon: Store, cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      case 'maps':
        return { label: 'الخرائط', Icon: MapPin, cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' };
      case 'finance':
        return { label: 'المالية', Icon: DollarSign, cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
      case 'media':
        return { label: 'الوسائط', Icon: ImageIcon, cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' };
      case 'info':
        return { label: 'البيانات', Icon: Tag, cls: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30' };
      case 'whatsapp':
        return { label: 'واتساب', Icon: MessageCircle, cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      default:
        return { label: 'عام', Icon: FileText, cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    }
  };

  const allFollowUps = formData.adminFollowUps || [];
  const filtered = allFollowUps.filter((f) => {
    if (followUpFilterType !== 'all' && f.type !== followUpFilterType) return false;
    if (categoryFilter !== 'all' && (f.category || 'general') !== categoryFilter) return false;
    if (followUpSearch.trim()) {
      const q = followUpSearch.trim().toLowerCase();
      const matchText = f.text.toLowerCase().includes(q);
      const matchAuthor = f.authorName.toLowerCase().includes(q);
      if (!matchText && !matchAuthor) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[var(--input-bg)] to-amber-500/5 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black shrink-0">
              <ClipboardList className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                سجل المتابعات الشامل (CRM)
              </h4>
              <span className="text-[9px] bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                <span>سري</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
              {allFollowUps.length} إجراء
            </span>
            {onCloseDrawer && (
              <button
                type="button"
                onClick={onCloseDrawer}
                className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق السجل"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick CRM Metrics Strip */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-xl">
            <span className="text-[9px] text-[var(--text-muted)] block font-bold truncate">اتصالات</span>
            <span className="font-mono font-black text-xs text-[var(--text-primary)]">
              {allFollowUps.filter((f) => f.type === 'call').length}
            </span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-xl">
            <span className="text-[9px] text-[var(--text-muted)] block font-bold truncate">زيارات</span>
            <span className="font-mono font-black text-xs text-[var(--text-primary)]">
              {allFollowUps.filter((f) => f.type === 'visit').length}
            </span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-xl">
            <span className="text-[9px] text-[var(--text-muted)] block font-bold truncate">تحصيل</span>
            <span className="font-mono font-black text-xs text-[var(--text-primary)]">
              {allFollowUps.filter((f) => f.type === 'payment').length}
            </span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 p-1.5 rounded-xl">
            <span className="text-[9px] text-amber-600 dark:text-amber-300 block font-bold truncate">معلق</span>
            <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
              {allFollowUps.filter((f) => f.status === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      {/* ── ADD NEW FOLLOW-UP NOTE BOX ── */}
      <div className="bg-[var(--input-bg)] border border-[var(--border-color)] focus-within:border-amber-500/50 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
          <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
            <span>إضافة متابعة / ملاحظة</span>
          </h5>
          <span className="text-[10px] text-[var(--text-secondary)] font-bold truncate max-w-[180px]">
            <strong className="text-amber-600 dark:text-amber-400">
              {currentUserName || currentRoleTitle || 'المسؤول'}
            </strong>
          </span>
        </div>

        {/* Quick Templates Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {[
            'تم الاتصال وأكد السداد غداً',
            'طلب مهلة للمراجعة',
            'تمت المعاينة ومطابقة اللافتة',
            'تم رفع وتوثيق الخريطة',
            'تم إرسال بيانات السداد',
            'لم يرد وتم إرسال واتساب',
          ].map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setNewFollowUpText(tpl);
                setFollowUpError(null);
              }}
              className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap cursor-pointer transition-colors"
            >
              {tpl}
            </button>
          ))}
        </div>

        {/* Textarea Input */}
        <div>
          <textarea
            rows={2}
            value={newFollowUpText}
            onChange={(e) => {
              setNewFollowUpText(e.target.value);
              if (followUpError) setFollowUpError(null);
            }}
            placeholder="اكتب ملاحظة أو تفاصيل الإجراء هنا..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-amber-500 text-[var(--text-primary)] rounded-xl p-2.5 text-xs font-medium focus:outline-none transition-colors leading-relaxed resize-none"
          />
        </div>

        {/* Step 2 Box: Appears ONLY when admin starts typing or enters text or has selected a type/status */}
        {(newFollowUpText.trim().length > 0 || newFollowUpType !== null || newFollowUpStatus !== null) && (
          <div className="bg-[var(--bg-card)] border-2 border-amber-500/40 rounded-2xl p-3 sm:p-3.5 space-y-3 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>تحديد تصنيف وحالة هذا الإجراء (إلزامي للتذكير):</span>
              </span>
              {!newFollowUpType || !newFollowUpStatus ? (
                <span className="text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black px-2 py-0.5 rounded-md animate-pulse">
                  * مطلوب الاختيار
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500" /> جاهز للحفظ
                </span>
              )}
            </div>

            {/* Type Selector Buttons */}
            <div>
              <span className="text-[10.5px] text-[var(--text-muted)] font-bold block mb-1.5">
                1. طبيعة الإجراء (اختر نوع المتابعة):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs font-bold">
                {[
                  { type: 'call', label: 'اتصال', Icon: Phone, color: 'bg-emerald-600 text-white' },
                  { type: 'visit', label: 'زيارة', Icon: Navigation, color: 'bg-purple-600 text-white' },
                  { type: 'payment', label: 'تحصيل', Icon: DollarSign, color: 'bg-amber-600 text-white' },
                  { type: 'verification', label: 'خرائط', Icon: Globe, color: 'bg-blue-600 text-white' },
                  { type: 'general', label: 'عامة', Icon: FileText, color: 'bg-slate-700 text-white' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setNewFollowUpType(item.type as AdminFollowUpType);
                      setFollowUpError(null);
                    }}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      newFollowUpType === item.type
                        ? `${item.color} font-black ring-2 ring-amber-500 shadow-xs scale-98`
                        : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
                    }`}
                  >
                    <item.Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selector Buttons */}
            <div>
              <span className="text-[10.5px] text-[var(--text-muted)] font-bold block mb-1.5">
                2. حالة الإجراء (هل اكتمل أم معلق أم عاجل؟):
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                {[
                  { status: 'completed', label: 'تم واكتمل', Icon: Check, color: 'bg-emerald-600 text-white' },
                  { status: 'pending', label: 'معلق للمتابعة', Icon: Clock, color: 'bg-amber-500 text-slate-950' },
                  { status: 'urgent', label: 'عاجل وهام', Icon: AlertTriangle, color: 'bg-rose-600 text-white' },
                ].map((s) => (
                  <button
                    key={s.status}
                    type="button"
                    onClick={() => {
                      setNewFollowUpStatus(s.status as AdminFollowUpStatus);
                      setFollowUpError(null);
                    }}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      newFollowUpStatus === s.status
                        ? `${s.color} font-black ring-2 ring-amber-500 shadow-xs scale-98`
                        : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
                    }`}
                  >
                    <s.Icon className="w-3.5 h-3.5" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Next follow-up date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] text-[var(--text-muted)] font-bold whitespace-nowrap">
                  موعد المتابعة القادمة (اختياري):
                </span>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-[11px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                />
              </div>
              {nextFollowUpDate && (
                <button
                  type="button"
                  onClick={() => setNextFollowUpDate('')}
                  className="text-[10px] text-rose-500 hover:underline font-bold"
                >
                  إلغاء الموعد
                </button>
              )}
            </div>
          </div>
        )}

        {/* Validation Error Message */}
        {followUpError && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{followUpError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={handleAddFollowUp}
            disabled={!newFollowUpText.trim()}
            className={`w-full sm:w-auto font-black text-xs px-5 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
              !newFollowUpText.trim()
                ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                : !newFollowUpType || !newFollowUpStatus
                ? 'bg-amber-500/50 hover:bg-amber-500/70 text-slate-900 border border-amber-500/40'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>تسجيل المتابعة</span>
          </button>
        </div>
      </div>

      {/* ── FOLLOW-UP HISTORY & TIMELINE ── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
          <h5 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>الجدول الزمني للمتابعات السابقة ({allFollowUps.length})</span>
          </h5>

          {/* Filter & Search Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-2" />
              <input
                type="text"
                value={followUpSearch}
                onChange={(e) => setFollowUpSearch(e.target.value)}
                placeholder="بحث في الملاحظات..."
                className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl pr-8 pl-2 py-1 w-36 sm:w-44 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={followUpFilterType}
              onChange={(e) => setFollowUpFilterType(e.target.value as AdminFollowUpType | 'all')}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-2 py-1 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">كل الإجراءات</option>
              <option value="call">اتصالات هاتفية</option>
              <option value="visit">زيارات ميدانية</option>
              <option value="payment">متابعة سداد</option>
              <option value="verification">خرائط Google</option>
              <option value="general">ملاحظات عامة</option>
            </select>
          </div>
        </div>

        {/* ── Category Filter Chips ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'directory', label: 'الدليل' },
            { id: 'maps', label: 'الخرائط' },
            { id: 'finance', label: 'المالية' },
            { id: 'media', label: 'الوسائط' },
            { id: 'info', label: 'البيانات' },
            { id: 'whatsapp', label: 'واتساب' },
            { id: 'general', label: 'عامة' },
          ].map((cat) => {
            const count = cat.id === 'all'
              ? allFollowUps.length
              : allFollowUps.filter((f) => (f.category || 'general') === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-2.5 py-1 rounded-xl font-bold transition-colors shrink-0 text-[11px] cursor-pointer flex items-center gap-1 ${
                  categoryFilter === cat.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                  categoryFilter === cat.id ? 'bg-slate-950 text-amber-400' : 'bg-slate-500/15 text-[var(--text-muted)]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Render Filtered Timeline List */}
        {filtered.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 text-center space-y-2">
            <ClipboardList className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-40" />
            <p className="font-bold text-xs text-[var(--text-secondary)]">
              {allFollowUps.length === 0
                ? 'لا توجد متابعات أو ملاحظات إدارية مسجلة بعد لهذا المكان.'
                : 'لا توجد ملاحظات مطابقة لمعايير التصفية المحددة.'}
            </p>
            <p className="text-[10.5px] text-[var(--text-muted)]">
              استخدم النموذج أعلاه لتوثيق اتصالاتك الهاتفية، المعاينات الميدانية، أو تدقيق التحصيل.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((note) => {
              const tInfo = getTypeInfo(note.type);
              const cInfo = getCategoryInfo(note.category);
              const urgencyInfo = getFollowUpUrgency(note);
              const isPending = note.status === 'pending';
              const isUrgent = note.status === 'urgent';
              const createdFormatted = formatStandardDateTime(note.createdAt);

              return (
                <div
                  key={note.id}
                  className={`bg-[var(--bg-card)] border-2 rounded-2xl p-3.5 sm:p-4 space-y-2.5 transition-all shadow-xs ${
                    urgencyInfo.urgency === 'overdue'
                      ? 'border-rose-500/50 bg-rose-500/5'
                      : urgencyInfo.urgency === 'due_today'
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : isPending
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-[var(--border-color)] hover:border-amber-500/30'
                  }`}
                >
                  {/* Note Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${tInfo.bg}`}>
                        <tInfo.Icon className="w-3 h-3" />
                        <span>{tInfo.label}</span>
                      </span>

                      {note.category && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${cInfo.cls}`}>
                          <cInfo.Icon className="w-3 h-3" />
                          <span>{cInfo.label}</span>
                        </span>
                      )}

                      {isSuperAdminViewer ? (
                        <>
                          <span className="text-[10.5px] font-extrabold text-[var(--text-primary)]">
                            {note.authorName}
                          </span>

                          <span className="text-[9px] bg-slate-500/15 text-[var(--text-secondary)] font-bold px-1.5 py-0.2 rounded">
                            {note.authorRole === 'admin'
                              ? 'الإدارة العامة'
                              : note.authorRole === 'accountant'
                              ? 'الحسابات'
                              : 'المشرف'}
                          </span>

                          <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>رقابة عليا</span>
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--text-muted)] bg-slate-500/10 px-2 py-0.5 rounded-md">
                          ملاحظة إدارية معتمدة
                        </span>
                      )}

                      {/* Urgency Traffic-Light Pill */}
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-full border ${urgencyInfo.badgeClass}`}>
                        {urgencyInfo.label}
                      </span>

                      {/* Clickable Status Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleFollowUpStatus(note.id)}
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-transform active:scale-95 ${
                          isUrgent
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                            : isPending
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40'
                        }`}
                        title="انقر لتغيير الحالة بين مكتمل ومعلق"
                      >
                        {isUrgent ? 'عاجل' : isPending ? 'معلق للمتابعة' : 'تم الإنجاز'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] font-mono dir-ltr">
                        {createdFormatted}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteFollowUp(note.id)}
                        className="text-[var(--text-muted)] hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        title="حذف الملاحظة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Body Text */}
                  <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-medium">
                    {note.text}
                  </p>

                  {/* Next Date Tag if present */}
                  {note.nextFollowUpDate && (
                    <div className="flex items-center gap-1.5 pt-1 text-[10.5px]">
                      <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span>موعد المتابعة القادم: </span>
                        <strong className="font-mono font-black">{note.nextFollowUpDate}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Delete Note Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        title="حذف المتابعة الإدارية"
        message="هل أنت متأكد من رغبتك في حذف هذه الملاحظة الإدارية؟"
        confirmLabel="حذف الملاحظة"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={confirmDeleteFollowUp}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
