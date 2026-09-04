import React, { useState, useMemo } from 'react';
import { InterestedLead, User } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { formatActivityDateTime } from '../../../utils/dateFormatters';
import { sanitizeExternalUrl } from '../../../utils/urlSanitizer';
import {
  UserCheck,
  Sparkles,
  Search,
  MapPin,
  Users,
  Phone,
  Calendar,
  MessageSquare,
  ExternalLink,
  FileText,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface AdminLeadsTabProps {
  leads: InterestedLead[];
  leadStats: {
    total: number;
    pendingFollowup: number;
    contacted: number;
    converted: number;
    highInterest: number;
    conversionRate: number;
  };
  currentUser?: User | null;
  onUpdateLead?: (lead: InterestedLead) => void;
  onDeleteLead?: (id: string) => void;
  onConvertToBusiness?: (lead: InterestedLead) => void;
  onSelectFollowUpLead: (lead: InterestedLead) => void;
}

export const AdminLeadsTab: React.FC<AdminLeadsTabProps> = ({
  leads = [],
  leadStats,
  currentUser,
  onUpdateLead,
  onDeleteLead,
  onConvertToBusiness,
  onSelectFollowUpLead,
}) => {
  const [leadSearchQuery, setLeadSearchQuery] = useState<string>('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [leadInterestFilter, setLeadInterestFilter] = useState<string>('all');
  const [leadGovFilter, setLeadGovFilter] = useState<string>('all');

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (leadSearchQuery) {
        const q = leadSearchQuery.toLowerCase();
        const cName = (l.clientName || '').toLowerCase();
        const bName = (l.businessName || '').toLowerCase();
        const phone = (l.phone || '').toLowerCase();
        const notes = (l.notes || '').toLowerCase();
        if (!cName.includes(q) && !bName.includes(q) && !phone.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      if (leadStatusFilter !== 'all' && l.status !== leadStatusFilter) {
        return false;
      }
      if (leadInterestFilter !== 'all' && l.interestLevel !== leadInterestFilter) {
        return false;
      }
      if (leadGovFilter !== 'all' && l.governorate !== leadGovFilter) {
        return false;
      }
      return true;
    });
  }, [leads, leadSearchQuery, leadStatusFilter, leadInterestFilter, leadGovFilter]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header & KPI Summary */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border border-emerald-500/30 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
                <span>سجل متابعة ومراجعات العملاء المهتمين (CRM Leads)</span>
                <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {leadStats.total} عميل مهتم
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                متابعة زيارات المناديب الميدانية للمحلات غير المشتركة بعد، والتواصل المباشر مع أصحابها لتحويلهم لاشتراكات رسمية.
              </p>
            </div>
          </div>

          {/* Conversion Rate Badge */}
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-emerald-500/30 px-3.5 py-2 rounded-2xl">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-[var(--text-muted)]">معدل التحويل لاشتراكات:</span>
            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
              {leadStats.conversionRate}% ({leadStats.converted} من {leadStats.total})
            </span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">إجمالي العملاء المهتمين</span>
            <span className="text-xl font-black text-[var(--text-primary)] font-mono">{leadStats.total}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-amber-500/30 p-3 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">بانتظار المتابعة</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{leadStats.pendingFollowup}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-blue-500/30 p-3 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block">تم التواصل معهم</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{leadStats.contacted}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-emerald-500/30 p-3 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">تحولوا لاشتراكات فعلية</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{leadStats.converted}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 sm:p-4 rounded-3xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث باسم العميل، النشاط، الهاتف..."
              value={leadSearchQuery}
              onChange={(e) => setLeadSearchQuery(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={leadStatusFilter}
              onChange={(e) => setLeadStatusFilter(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">كل الحالات ({leads.length})</option>
              <option value="pending_followup">بانتظار المتابعة ({leadStats.pendingFollowup})</option>
              <option value="contacted">تم التواصل ({leadStats.contacted})</option>
              <option value="converted">تحول إلى نشاط مسجل ({leadStats.converted})</option>
            </select>
          </div>

          {/* Interest Level Filter */}
          <div>
            <select
              value={leadInterestFilter}
              onChange={(e) => setLeadInterestFilter(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">كل درجات الاهتمام</option>
              <option value="high">اهتمام مرتفع جداً 🔥</option>
              <option value="medium">اهتمام متوسط ⚡</option>
              <option value="low">استفسار عام / غير محدد 💬</option>
            </select>
          </div>

          {/* Governorate Filter */}
          <div>
            <select
              value={leadGovFilter}
              onChange={(e) => setLeadGovFilter(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">جميع المحافظات</option>
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
          <span>
            النتائج المطابقة: <strong className="font-mono font-black text-emerald-600 dark:text-emerald-400">{filteredLeads.length}</strong> عميل مهتم
          </span>
          {(leadSearchQuery || leadStatusFilter !== 'all' || leadInterestFilter !== 'all' || leadGovFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setLeadSearchQuery('');
                setLeadStatusFilter('all');
                setLeadInterestFilter('all');
                setLeadGovFilter('all');
              }}
              className="text-amber-600 hover:text-amber-500 font-bold cursor-pointer"
            >
              إعادة ضبط الفلاتر ↺
            </button>
          )}
        </div>
      </div>

      {/* Leads Cards Grid */}
      {filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLeads.map((lead) => {
            const cleanPhone = (lead.phone || '').replace(/\D/g, '');
            const waUrl = cleanPhone
              ? `https://wa.me/2${cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone}?text=${encodeURIComponent(
                  `أهلاً بحضرتك أستاذ ${lead.clientName}، بخصوص استفسارك عن إضافة "${lead.businessName || 'نشاطك التجاري'}" على منصة دليلك وتوثيقه على خرائط جوجل...`
                )}`
              : '#';

            return (
              <div
                key={lead.id}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 transition-all"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-[var(--text-primary)]">
                        {lead.businessName || `عميل: ${lead.clientName}`}
                      </h4>
                      {lead.interestLevel === 'high' && (
                        <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-500/30">
                          اهتمام مرتفع 🔥
                        </span>
                      )}
                      {lead.interestLevel === 'medium' && (
                        <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                          اهتمام متوسط ⚡
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                      صاحب النشاط: <strong className="text-[var(--text-primary)]">{lead.clientName}</strong>
                      {lead.businessCategory && ` • ${lead.businessCategory}`}
                    </p>
                  </div>

                  {/* Status Selector */}
                  <select
                    value={lead.status || 'pending_followup'}
                    onChange={(e) => {
                      if (onUpdateLead) {
                        onUpdateLead({ ...lead, status: e.target.value as any });
                      }
                    }}
                    className={`text-[11px] font-black px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none ${
                      lead.status === 'converted'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : lead.status === 'contacted'
                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}
                  >
                    <option value="pending_followup">بانتظار المتابعة ⏳</option>
                    <option value="contacted">تم التواصل 📞</option>
                    <option value="converted">تم التحويل لاشتراك 🌟</option>
                  </select>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{lead.governorate}{lead.city ? ` - ${lead.city}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">المندوب: {lead.repName || 'مندوب معتمد'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono dir-ltr text-right">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span>{lead.followUpDate ? `متابعة: ${lead.followUpDate}` : formatActivityDateTime(lead.createdDate || '')}</span>
                  </div>
                </div>

                {/* Notes Box */}
                {lead.notes && (
                  <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)]">
                    <span className="font-bold text-[10px] text-[var(--text-muted)] block mb-0.5">ملاحظات الزيارة الميدانية:</span>
                    <p className="line-clamp-2">{lead.notes}</p>
                  </div>
                )}

                {/* Latest Admin Follow-up Note Snippet */}
                {lead.adminFollowUps && lead.adminFollowUps.length > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/25 p-2.5 rounded-xl text-[11px] text-purple-900 dark:text-purple-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-[10px] text-purple-700 dark:text-purple-300">
                      <span className="flex items-center gap-1">
                        <span>آخر متابعة إدارية:</span>
                        <strong className="text-[var(--text-primary)]">{lead.adminFollowUps[0].authorName}</strong>
                      </span>
                      <span className="font-mono text-[9px]">{formatActivityDateTime(lead.adminFollowUps[0].createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 font-medium">{lead.adminFollowUps[0].text}</p>
                  </div>
                )}

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <a
                      href={`tel:${lead.phone}`}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>اتصال</span>
                    </a>
                    {cleanPhone && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>واتساب</span>
                      </a>
                    )}
                    {(lead.locationUrl || (lead.lat && lead.lng)) && (
                      <a
                        href={sanitizeExternalUrl(lead.locationUrl || `https://www.google.com/maps?q=${lead.lat},${lead.lng}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>الموقع</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectFollowUpLead(lead)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>المتابعات ({lead.adminFollowUps?.length || 0})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {onConvertToBusiness && lead.status !== 'converted' && (
                      <button
                        type="button"
                        onClick={() => onConvertToBusiness(lead)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>تحويل إلى نشاط مسجل 🌟</span>
                      </button>
                    )}
                    {lead.status === 'converted' && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>مشترك مسجل بالدليل</span>
                      </span>
                    )}
                    {onDeleteLead && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف سجل العميل "${lead.clientName}"؟`)) {
                            onDeleteLead(lead.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-10 text-center space-y-2">
          <UserCheck className="w-10 h-10 text-emerald-500/50 mx-auto" />
          <p className="font-black text-sm text-[var(--text-primary)]">لا توجد مراجعات أو عملاء مهتمين مطابقة للبحث</p>
          <p className="text-xs text-[var(--text-muted)]">
            عندما يسجل أي مندوب ميداني بيانات زيارة لعميل مهتم، ستظهر بياناته وملاحظات المتابعة هنا فورياً.
          </p>
        </div>
      )}
    </div>
  );
};
