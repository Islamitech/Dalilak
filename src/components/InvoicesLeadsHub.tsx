import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCheck,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Share2,
  Trash2,
  Edit,
  Send,
  X,
  MapPin,
  Flame,
} from 'lucide-react';
import { InterestedLead, LeadInterestLevel, LeadStatus, Representative, User } from '../types';
import { EGYPT_GOVERNORATES } from '../data/mockData';

interface InvoicesLeadsHubProps {
  leads: InterestedLead[];
  currentUser: User | null;
  currentRep?: Representative;
  onCreateLead: (lead: InterestedLead) => void;
  onUpdateLead: (lead: InterestedLead) => void;
  onDeleteLead: (leadId: string) => void;
  onConvertToBusiness: (lead: InterestedLead) => void;
}

export const InvoicesLeadsHub: React.FC<InvoicesLeadsHubProps> = ({
  leads,
  currentUser,
  currentRep,
  onCreateLead,
  onUpdateLead,
  onDeleteLead,
  onConvertToBusiness,
}) => {
  // Leads Filter States
  const [leadSearch, setLeadSearch] = useState<string>('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [leadInterestFilter, setLeadInterestFilter] = useState<string>('all');
  const [leadGovFilter, setLeadGovFilter] = useState<string>('all');

  // Modals
  const [showAddLeadModal, setShowAddLeadModal] = useState<boolean>(false);
  const [editingLead, setEditingLead] = useState<InterestedLead | null>(null);
  const [whatsAppModalLead, setWhatsAppModalLead] = useState<InterestedLead | null>(null);
  const [customMsgType, setCustomMsgType] = useState<'intro' | 'followup' | 'offer'>('intro');

  // Quick New Lead Form States (Inside Modal)
  const [newClientName, setNewClientName] = useState<string>('');
  const [newBizName, setNewBizName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newGovernorate, setNewGovernorate] = useState<string>('القاهرة');
  const [newCity, setNewCity] = useState<string>('');
  const [newInterestLevel, setNewInterestLevel] = useState<LeadInterestLevel>('medium');
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newNotes, setNewNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Scoped Data (Filter by Rep if not Admin)
  const isRepAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'accountant' || !currentUser;
  const scopedLeads = useMemo(() => {
    if (isRepAdmin) return leads;
    const myId = (currentUser?.id || currentRep?.id || '').toLowerCase().trim();
    const myRepDataId = (currentUser?.repData?.id || '').toLowerCase().trim();
    const myName = (currentUser?.name || currentRep?.name || '').toLowerCase().trim();

    return leads.filter((l) => {
      const lRepId = (l.repId || '').toLowerCase().trim();
      const lRepName = (l.repName || '').toLowerCase().trim();

      const matchId = (myId && lRepId === myId) || (myRepDataId && lRepId === myRepDataId);
      const matchName =
        (myName && lRepName === myName) ||
        (myName && lRepName && (lRepName.includes(myName) || myName.includes(lRepName)));

      return matchId || matchName;
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
        (l.phone || '').includes(q) ||
        (l.city || '').toLowerCase().includes(q);

      const matchStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter;
      const matchInterest = leadInterestFilter === 'all' || l.interestLevel === leadInterestFilter;
      const matchGov = leadGovFilter === 'all' || l.governorate === leadGovFilter;

      return matchSearch && matchStatus && matchInterest && matchGov;
    });
  }, [scopedLeads, leadSearch, leadStatusFilter, leadInterestFilter, leadGovFilter]);

  // Stats calculation
  const totalLeadsCount = scopedLeads.length;
  const pendingLeadsCount = scopedLeads.filter((l) => l.status === 'pending_followup').length;
  const contactedLeadsCount = scopedLeads.filter((l) => l.status === 'contacted').length;
  const convertedLeadsCount = scopedLeads.filter((l) => l.status === 'converted').length;

  // Handle Add Lead Submit
  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newClientName || newClientName.trim().length < 3) {
      setFormError('يرجى إدخال اسم العميل بشكل صحيح.');
      return;
    }

    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('يرجى إدخال رقم هاتف صحيح (11 رقم).');
      return;
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const repId = currentUser?.repData?.id || currentUser?.id || currentRep?.id || 'rep_1';
    const repName = currentUser?.repData?.name || currentUser?.name || currentRep?.name || 'مندوب معتمد';

    const newLead: InterestedLead = {
      id: leadId,
      clientName: newClientName.trim(),
      businessName: newBizName.trim() || undefined,
      phone: cleanPhone,
      governorate: newGovernorate,
      city: newCity.trim() || undefined,
      interestLevel: newInterestLevel,
      followUpDate: newFollowUpDate || undefined,
      notes: newNotes.trim() || undefined,
      createdDate: new Date().toISOString(),
      repId,
      repName,
      status: 'pending_followup',
    };

    onCreateLead(newLead);
    setShowAddLeadModal(false);
    resetNewLeadForm();
  };

  const resetNewLeadForm = () => {
    setNewClientName('');
    setNewBizName('');
    setNewPhone('');
    setNewCity('');
    setNewInterestLevel('medium');
    setNewNotes('');
    setFormError('');
  };

  // WhatsApp Message Generator (مختصرة، طبيعية، بدون طابع ترويجي)
  const generateWhatsAppMessage = (lead: InterestedLead, type: 'intro' | 'followup' | 'offer') => {
    const clientName = lead.clientName?.trim() || 'صاحب النشاط';
    const bizTitle = lead.businessName?.trim() ? `نشاطكم (${lead.businessName.trim()})` : 'نشاطكم التجاري';

    if (type === 'intro') {
      return `السلام عليكم ورحمة الله،
أهلاً بحضرتك أستاذ ${clientName}، بخصوص ${bizTitle}:

قام مندوبنا بزيارة المنطقة المتواجد بها نشاطكم وقام بعرض باقة التوثيق على سيادتكم (أو أحد العاملين بالمكان).

الباقة تشمل تثبيت الموقع الجغرافي للنشاط بدقة على خرائط Google، وإضافة أرقام التواصل ومواعيد العمل والصور الرسمية، برسوم 250 جنيه (سداد لمرة واحدة بدون أي اشتراكات).

في حال رغبتكم في استكمال التوثيق أو وجود أي استفسار، يسعدنا تواصلكم معنا عبر هذه المحادثة.`;
    }

    if (type === 'followup') {
      return `السلام عليكم ورحمة الله يا فندم،
متابعة مع حضرتك بخصوص توثيق ${bizTitle} على خرائط Google.
هل نحدد موعداً مناسباً لزيارة المندوب والبدء في تسجيل ورفع البيانات؟`;
    }

    // Offer / Service details
    return `السلام عليكم ورحمة الله،
توضيح لخدمات التوثيق المتاحة لنشاط ${bizTitle}:

1. باقة التوثيق الأساسي (250 ج): تثبيت وتوثيق النشاط على خرائط Google مع إضافة بيانات الاتصال ومواعيد العمل والصور.
2. باقة التأسيس والربط (750 ج): توثيق الخريطة + تأسيس وتنسيق الصفحات وتصميم الإعلان ومتابعة مستمرة.

متاحين لأي استفسار أو لترتيب موعد الزيارة والتنفيذ.`;
  };

  const handleOpenWhatsApp = (lead: InterestedLead, type: 'intro' | 'followup' | 'offer') => {
    const msg = generateWhatsAppMessage(lead, type);
    const phoneClean = lead.phone.replace(/\D/g, '');
    const internationalPhone = phoneClean.startsWith('0') ? `2${phoneClean}` : phoneClean;
    const url = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Update lead contact date
    onUpdateLead({
      ...lead,
      lastContactedDate: new Date().toISOString(),
      status: lead.status === 'pending_followup' ? 'contacted' : lead.status,
    });
    setWhatsAppModalLead(null);
  };

  const getInterestBadge = (level: LeadInterestLevel) => {
    switch (level) {
      case 'high':
        return (
          <span className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>مهتم جداً 🔥</span>
          </span>
        );
      case 'medium':
        return (
          <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>يحتاج متابعة ⏳</span>
          </span>
        );
      case 'low':
        return (
          <span className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            متردد / استفسار
          </span>
        );
      case 'intro_sent':
        return (
          <span className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-blue-500" />
            <span>أُرسلت رسالة 💬</span>
          </span>
        );
      case 'need_visit':
        return (
          <span className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
            <Calendar className="w-3 h-3 text-purple-500" />
            <span>طلب زيارة 📅</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'pending_followup':
        return (
          <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>بانتظار المتابعة</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>تم التواصل</span>
          </span>
        );
      case 'converted':
        return (
          <span className="badge-success text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>⭐ تم التحويل لمشترك</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
            ملغي / غير مهتم
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24 tab-content-enter">
      {/* ========================================================
          HEADER SECTION
          ======================================================== */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-md transition-colors duration-300 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <UserCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
                  سجل مراجعات العملاء المهتمين
                </h2>
                <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {scopedLeads.length} شخص مهتم
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
                متابعة العملاء المحتملين والزيارات الميدانية، إرسال رسائل التوثيق التعريفية، وتحويلهم لأنشطة مسجلة
              </p>
            </div>
          </div>

          {/* Add Lead Quick Button */}
          <button
            type="button"
            onClick={() => setShowAddLeadModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-transform active:scale-95 self-stretch sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ تسجيل شخص مهتم جديد</span>
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[11px] text-[var(--text-muted)] font-bold block">إجمالي المهتمين</span>
            <span className="text-lg font-black text-amber-500 font-mono">{totalLeadsCount}</span>
          </div>
          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block">بانتظار المتابعة</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{pendingLeadsCount}</span>
          </div>
          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-bold block">تم التواصل معهم</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{contactedLeadsCount}</span>
          </div>
          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">تحولوا لمشتركين</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{convertedLeadsCount} ⭐</span>
          </div>
        </div>

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
            <option value="pending_followup">⏳ بانتظار المتابعة</option>
            <option value="contacted">💬 تم التواصل</option>
            <option value="converted">⭐ تم التحويل لمشترك</option>
            <option value="cancelled">ملغي / غير مهتم</option>
          </select>

          <select
            value={leadInterestFilter}
            onChange={(e) => setLeadInterestFilter(e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="all">كل درجات الاهتمام</option>
            <option value="high">🔥 مهتم جداً (أولوية قصوى)</option>
            <option value="medium">⏳ يحتاج تفكير ومتابعة</option>
            <option value="need_visit">📅 طلب زيارة ميدانية</option>
            <option value="intro_sent">💬 أُرسلت رسالة تعريفية</option>
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

        {/* Leads List Grid */}
        <div className="space-y-3 pt-1">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)] space-y-3 animate-fade-in">
              <UserCheck className="w-14 h-14 text-[var(--text-muted)] mx-auto opacity-30" />
              <h4 className="font-black text-sm text-[var(--text-secondary)]">لا توجد سجلات لأشخاص مهتمين حالياً</h4>
              <p className="text-xs text-[var(--text-muted)] font-bold max-w-md mx-auto leading-relaxed">
                عند زيارتك الميدانية لمحل أو صاحب نشاط يرغب في التفكير أو المراسلة لاحقاً، اضغط على زر "تسجيل شخص مهتم جديد" لحفظ بياناته ومراجعته هنا.
              </p>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow cursor-pointer transition-transform active:scale-95"
              >
                + تسجيل أول شخص مهتم الآن
              </button>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              return (
                <div
                  key={lead.id}
                  className="bg-[var(--bg-surface)] p-4 rounded-3xl border border-[var(--border-color)] space-y-3 hover:border-amber-500/40 transition-all shadow-xs"
                >
                  {/* Top Row: Name, Status, Badges */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-[var(--text-primary)]">{lead.clientName}</h4>
                          {lead.businessName && (
                            <span className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold text-[11px] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
                              {lead.businessName}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          <span>{lead.governorate} {lead.city ? `- ${lead.city}` : ''}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                      {getInterestBadge(lead.interestLevel)}
                      {getStatusBadge(lead.status)}
                    </div>
                  </div>

                  {/* Details & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-bold text-[11px]">رقم الهاتف:</span>
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-mono font-bold text-amber-700 dark:text-amber-300 dir-ltr text-right hover:underline"
                      >
                        {lead.phone}
                      </a>
                    </div>

                    <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-bold text-[11px]">موعد المتابعة:</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {lead.followUpDate || 'غير محدد'}
                      </span>
                    </div>

                    <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-bold text-[11px]">المندوب المسجل:</span>
                      <span className="font-bold text-[var(--text-secondary)] truncate max-w-[140px]">
                        {lead.repName}
                      </span>
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {lead.notes && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl text-xs text-[var(--text-secondary)] leading-relaxed">
                      <strong className="text-amber-600 dark:text-amber-400 font-bold block text-[10px] mb-0.5">ملاحظات المتابعة:</strong>
                      {lead.notes}
                    </div>
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)] text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 1. Send WhatsApp Intro Button */}
                      <button
                        type="button"
                        onClick={() => setWhatsAppModalLead(lead)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                        title="إرسال رسالة تعريفية أو عرض عبر واتساب"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>مراسلة واتساب</span>
                      </button>

                      {/* 2. Direct Call */}
                      <a
                        href={`tel:${lead.phone}`}
                        className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-primary)] font-bold px-3 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>اتصال</span>
                      </a>

                      {/* 3. Convert to Registered Business */}
                      <button
                        type="button"
                        onClick={() => onConvertToBusiness(lead)}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                        title="تحويل بيانات العميل فوراً إلى نموذج تسجيل نشاط جديد"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>⭐ تحويل إلى نشاط مسجل</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 mr-auto">
                      {/* Edit / Update Status */}
                      <button
                        type="button"
                        onClick={() => setEditingLead(lead)}
                        className="p-1.5 rounded-lg bg-[var(--input-bg)] hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
                        title="تعديل بيانات العميل وحالة المتابعة"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Lead */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الشخص المهتم "${lead.clientName}"؟`)) {
                            onDeleteLead(lead.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors cursor-pointer"
                        title="حذف هذا السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL: ADD NEW INTERESTED LEAD
          ======================================================== */}
      {showAddLeadModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[var(--text-primary)]">
                      تسجيل شخص مهتم / زيارة جديدة
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">
                      حفظ بيانات الشخص في سجل المراجعات دون طلب باقة حالياً
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl font-bold text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddLeadSubmit} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم الشخص / صاحب النشاط *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ. محمد أحمد"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم النشاط / المحل (اختياري)</label>
                    <input
                      type="text"
                      placeholder="مثال: سوبر ماركت الأمل"
                      value={newBizName}
                      onChange={(e) => setNewBizName(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم الهاتف / واتساب *</label>
                    <input
                      type="tel"
                      required
                      placeholder="010XXXXXXXX"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة *</label>
                    <select
                      value={newGovernorate}
                      onChange={(e) => setNewGovernorate(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">المدينة / المنطقة</label>
                    <input
                      type="text"
                      placeholder="مثال: الدقي / المهندسين"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">درجة الاهتمام</label>
                    <select
                      value={newInterestLevel}
                      onChange={(e) => setNewInterestLevel(e.target.value as LeadInterestLevel)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      <option value="high">🔥 مهتم جداً (أولوية عالية)</option>
                      <option value="medium">⏳ يحتاج تفكير ومتابعة</option>
                      <option value="need_visit">📅 طلب زيارة ميدانية قادمة</option>
                      <option value="intro_sent">💬 طلب إرسال رسالة تعريفية</option>
                      <option value="low">متردد / استفسار عام</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">تاريخ المتابعة المقترح</label>
                    <input
                      type="date"
                      value={newFollowUpDate}
                      onChange={(e) => setNewFollowUpDate(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">ملاحظات المتابعة (اختياري)</label>
                  <textarea
                    rows={2}
                    placeholder="مثال: العميل طلب التفكير ومراجعة الشركاء، سيتم مراسلته بالأسعار..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>حفظ في سجل المراجعات 📋</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(false)}
                    className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold py-3 px-4 rounded-xl border border-[var(--border-color)] cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================
          MODAL: EDIT LEAD / UPDATE STATUS
          ======================================================== */}
      {editingLead &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-base text-[var(--text-primary)]">
                    تعديل ومتابعة: {editingLead.clientName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">حالة المتابعة</label>
                    <select
                      value={editingLead.status}
                      onChange={(e) =>
                        setEditingLead({ ...editingLead, status: e.target.value as LeadStatus })
                      }
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      <option value="pending_followup">⏳ بانتظار المتابعة</option>
                      <option value="contacted">💬 تم التواصل والمراسلة</option>
                      <option value="converted">⭐ تم التحويل لمشترك (مسجل)</option>
                      <option value="cancelled">ملغي / غير مهتم</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">درجة الاهتمام</label>
                    <select
                      value={editingLead.interestLevel}
                      onChange={(e) =>
                        setEditingLead({ ...editingLead, interestLevel: e.target.value as LeadInterestLevel })
                      }
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      <option value="high">🔥 مهتم جداً</option>
                      <option value="medium">⏳ يحتاج تفكير ومتابعة</option>
                      <option value="need_visit">📅 طلب زيارة</option>
                      <option value="intro_sent">💬 أُرسلت رسالة</option>
                      <option value="low">متردد / استفسار</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">موعد المتابعة القادم</label>
                  <input
                    type="date"
                    value={editingLead.followUpDate || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, followUpDate: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">ملاحظات المتابعة</label>
                  <textarea
                    rows={3}
                    value={editingLead.notes || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateLead(editingLead);
                      setEditingLead(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-2.5 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    حفظ التعديلات
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold py-2.5 px-4 rounded-xl border border-[var(--border-color)] cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================
          MODAL: WHATSAPP QUICK INTRO / FOLLOW-UP SENDER
          ======================================================== */}
      {whatsAppModalLead &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-[var(--bg-card)] border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="font-black text-base text-[var(--text-primary)]">
                      إرسال رسالة واتساب للشخص المهتم
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">
                      إلى: {whatsAppModalLead.clientName} ({whatsAppModalLead.phone})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsAppModalLead(null)}
                  className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Template Chooser */}
              <div className="space-y-2">
                <label className="block font-bold text-[var(--text-primary)]">اختر نموذج الرسالة الجاهزة:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomMsgType('intro')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      customMsgType === 'intro'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-sm'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
                    }`}
                  >
                    تعريف بالخدمة 🚀
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomMsgType('followup')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      customMsgType === 'followup'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-sm'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
                    }`}
                  >
                    متابعة وتذكير 📅
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomMsgType('offer')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      customMsgType === 'offer'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 shadow-sm'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
                    }`}
                  >
                    عرض خاص وتأسيس 🎁
                  </button>
                </div>
              </div>

              {/* Message Preview Box */}
              <div className="space-y-1">
                <label className="block font-bold text-[var(--text-muted)] text-[11px]">معاينة نص الرسالة:</label>
                <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {generateWhatsAppMessage(whatsAppModalLead, customMsgType)}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(whatsAppModalLead, customMsgType)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>فتح واتساب والإرسال فوراً 🚀</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWhatsAppModalLead(null)}
                  className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold py-3 px-4 rounded-xl border border-[var(--border-color)] cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
