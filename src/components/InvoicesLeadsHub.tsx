import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  X,
} from 'lucide-react';
import { InterestedLead, Representative, User, Business } from '../types';
import { EGYPT_GOVERNORATES } from '../data/mockData';
import { LeadFollowUpModal } from './LeadFollowUpModal';
import { LeadCard, LeadAddForm, LeadEditModal, LeadWhatsAppModal } from './leads';
import { Button } from './ui';

interface InvoicesLeadsHubProps {
  leads: InterestedLead[];
  businesses?: Business[];
  currentUser: User | null;
  currentRep?: Representative;
  onCreateLead: (lead: InterestedLead) => void;
  onUpdateLead: (lead: InterestedLead) => void;
  onDeleteLead: (leadId: string) => void;
  onConvertToBusiness: (lead: InterestedLead) => void;
  onDirectConvertLead?: (lead: InterestedLead) => void;
}

export const InvoicesLeadsHub: React.FC<InvoicesLeadsHubProps> = ({
  leads,
  businesses = [],
  currentUser,
  currentRep,
  onCreateLead,
  onUpdateLead,
  onDeleteLead,
  onConvertToBusiness,
  onDirectConvertLead,
}) => {
  // Leads Filter States
  const [leadSearch, setLeadSearch] = useState<string>('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [leadInterestFilter, setLeadInterestFilter] = useState<string>('all');
  const [leadGovFilter, setLeadGovFilter] = useState<string>('all');

  // Modals
  const [showAddLeadModal, setShowAddLeadModal] = useState<boolean>(false);
  const [editingLead, setEditingLead] = useState<InterestedLead | null>(null);
  const [selectedFollowUpLead, setSelectedFollowUpLead] = useState<InterestedLead | null>(null);
  const [whatsAppModalLead, setWhatsAppModalLead] = useState<InterestedLead | null>(null);

  // Scoped Data (Filter by Rep if not Admin/Supervisor/Accountant)
  const isRepAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'accountant' || !currentUser;
  const scopedLeads = useMemo(() => {
    if (isRepAdmin) return leads;
    const myId = (currentUser?.id || currentRep?.id || '').toLowerCase().trim();
    const myRepDataId = (currentUser?.repData?.id || '').toLowerCase().trim();

    return leads.filter((l) => {
      const lRepId = (l.repId || '').toLowerCase().trim();
      return Boolean((myId && lRepId === myId) || (myRepDataId && lRepId === myRepDataId));
    });
  }, [leads, currentUser, currentRep, isRepAdmin]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return scopedLeads.filter((l) => {
      const q = leadSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (l.clientName || '').toLowerCase().includes(q) ||
        (l.businessName || '').toLowerCase().includes(q) ||
        (l.businessCategory || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.city || '').toLowerCase().includes(q);

      const matchStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter;
      const matchInterest =
        leadInterestFilter === 'all' ||
        l.interestLevel === leadInterestFilter ||
        (leadInterestFilter === 'trending_free' && Boolean(l.isTrending));
      const matchGov = leadGovFilter === 'all' || l.governorate === leadGovFilter;

      return matchSearch && matchStatus && matchInterest && matchGov;
    });
  }, [scopedLeads, leadSearch, leadStatusFilter, leadInterestFilter, leadGovFilter]);

  // Stats calculation
  const totalLeadsCount = scopedLeads.length;
  const pendingLeadsCount = scopedLeads.filter((l) => l.status === 'pending_followup').length;
  const contactedLeadsCount = scopedLeads.filter((l) => l.status === 'contacted').length;
  const convertedLeadsCount = scopedLeads.filter((l) => l.status === 'converted').length;

  return (
    <div className="space-y-6 animate-fade-in text-[var(--text-primary)]">
      {/* Header & Main Actions */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  سجل العملاء المهتمين والزيارات
                </h2>
                <span className="bg-amber-500/15 text-amber-800 border border-amber-500/30 text-[11px] font-black px-2 py-0.5 rounded-full">
                  {scopedLeads.length} شخص مهتم
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                متابعة العملاء المحتملين والزيارات الميدانية، إرسال رسائل التوثيق التعريفية، وتحويلهم لأنشطة مسجلة
              </p>
            </div>
          </div>

          <Button
            variant={showAddLeadModal ? 'danger' : 'primary'}
            size="md"
            onClick={() => setShowAddLeadModal(!showAddLeadModal)}
            icon={showAddLeadModal ? <X className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
            className="self-stretch sm:self-auto font-black"
          >
            {showAddLeadModal ? 'إلغاء وإغلاق النموذج' : 'تسجيل شخص مهتم جديد'}
          </Button>
        </div>

        {/* KPI Summary Cards (Interactive Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => { setLeadStatusFilter('all'); setLeadInterestFilter('all'); }}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
              leadStatusFilter === 'all' && leadInterestFilter === 'all'
                ? 'bg-amber-500/15 border-amber-500 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/40'
            }`}
          >
            <span className="text-[11px] text-[var(--text-muted)] font-bold block">إجمالي المهتمين</span>
            <span className="text-lg font-black text-amber-500 font-mono">{totalLeadsCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setLeadStatusFilter(leadStatusFilter === 'pending_followup' ? 'all' : 'pending_followup')}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
              leadStatusFilter === 'pending_followup'
                ? 'bg-amber-500/15 border-amber-500 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/40'
            }`}
          >
            <span className="text-[11px] text-amber-700 font-bold block">بانتظار المتابعة</span>
            <span className="text-lg font-black text-amber-600 font-mono">{pendingLeadsCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setLeadStatusFilter(leadStatusFilter === 'contacted' ? 'all' : 'contacted')}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
              leadStatusFilter === 'contacted'
                ? 'bg-blue-500/15 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-blue-500/40'
            }`}
          >
            <span className="text-[11px] text-blue-700 font-bold block">تم التواصل معهم</span>
            <span className="text-lg font-black text-blue-600 font-mono">{contactedLeadsCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setLeadStatusFilter(leadStatusFilter === 'converted' ? 'all' : 'converted')}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
              leadStatusFilter === 'converted'
                ? 'bg-emerald-500/15 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-emerald-500/40'
            }`}
          >
            <span className="text-[11px] text-emerald-700 font-bold block">تحولوا لمشتركين</span>
            <span className="text-lg font-black text-emerald-600 font-mono">{convertedLeadsCount}</span>
          </button>
        </div>

        {/* Inline Registration Form Component */}
        {showAddLeadModal && (
          <LeadAddForm
            businesses={businesses}
            leads={leads}
            currentUser={currentUser}
            currentRep={currentRep}
            onSubmit={(newLead) => {
              onCreateLead(newLead);
              setShowAddLeadModal(false);
            }}
            onCancel={() => setShowAddLeadModal(false)}
          />
        )}

        {/* Leads Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث باسم العميل أو النشاط أو الهاتف..."
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-8 pl-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <select
            value={leadStatusFilter}
            onChange={(e) => setLeadStatusFilter(e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="all">كل حالات المتابعة</option>
            <option value="pending_followup">بانتظار المتابعة</option>
            <option value="contacted">تم التواصل</option>
            <option value="converted">تم التحويل لمشترك</option>
            <option value="cancelled">ملغي / غير مهتم</option>
          </select>

          <select
            value={leadInterestFilter}
            onChange={(e) => setLeadInterestFilter(e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="all">كل درجات الاهتمام</option>
            <option value="trending_free">منشآت رائجة (إدراج مجاني)</option>
            <option value="high">مهتم جداً (أولوية قصوى)</option>
            <option value="medium">يحتاج تفكير ومتابعة</option>
            <option value="need_visit">طلب زيارة ميدانية</option>
            <option value="intro_sent">أُرسلت رسالة تعريفية</option>
            <option value="low">متردد / استفسار</option>
          </select>

          <select
            value={leadGovFilter}
            onChange={(e) => setLeadGovFilter(e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="all">كل المحافظات</option>
            {EGYPT_GOVERNORATES.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>

        {/* Leads List */}
        <div className="space-y-3 pt-1">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)] space-y-3 animate-fade-in">
              <UserCheck className="w-14 h-14 text-[var(--text-muted)] mx-auto opacity-30" />
              <h4 className="font-black text-sm text-[var(--text-secondary)]">لا توجد سجلات لأشخاص مهتمين حالياً</h4>
              <p className="text-xs text-[var(--text-muted)] font-bold max-w-md mx-auto leading-relaxed">
                عند زيارتك الميدانية لمحل أو صاحب منشأة يرغب في التفكير أو المراسلة لاحقاً، اضغط على زر "تسجيل شخص مهتم جديد" لحفظ بياناته ومراجعته هنا.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddLeadModal(true)}
                icon={<Plus className="w-4 h-4" />}
                className="font-black"
              >
                تسجيل أول شخص مهتم الآن
              </Button>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={(targetLead) => setEditingLead(targetLead)}
                onDelete={(targetId) => onDeleteLead(targetId)}
                onOpenWhatsAppModal={(targetLead) => setWhatsAppModalLead(targetLead)}
                onOpenFollowUpModal={(targetLead) => setSelectedFollowUpLead(targetLead)}
                onConvertToBusiness={onConvertToBusiness}
                onDirectConvertLead={onDirectConvertLead}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Lead Modal */}
      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          businesses={businesses}
          leads={leads}
          onClose={() => setEditingLead(null)}
          onUpdateLead={onUpdateLead}
        />
      )}

      {/* WhatsApp Modal */}
      {whatsAppModalLead && (
        <LeadWhatsAppModal
          lead={whatsAppModalLead}
          onClose={() => setWhatsAppModalLead(null)}
          onUpdateLead={onUpdateLead}
        />
      )}

      {/* Follow-up & History Modal */}
      {selectedFollowUpLead && (
        <LeadFollowUpModal
          lead={selectedFollowUpLead}
          currentUser={currentUser}
          onClose={() => setSelectedFollowUpLead(null)}
          onSaveLead={(updated) => {
            onUpdateLead(updated);
            setSelectedFollowUpLead(updated);
          }}
          onConvertToBusiness={onConvertToBusiness}
        />
      )}
    </div>
  );
};
