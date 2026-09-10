import React, { useState, useMemo, useCallback } from 'react';
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
  ExternalLink,
  Navigation,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Loader2,
} from 'lucide-react';
import { InterestedLead, LeadInterestLevel, LeadStatus, Representative, User, Business } from '../types';
import { EGYPT_GOVERNORATES, CATEGORY_GROUPS, findClosestCategory, BUSINESS_CATEGORIES } from '../data/mockData';
import { getCategoryGroupFor } from '../utils/categoryMatcher';
import { LeadFollowUpModal } from './LeadFollowUpModal';
import { formatActivityDateTime } from '../utils/dateFormatters';
import { sanitizeExternalUrl } from '../utils/urlSanitizer';
import {
  generateTrendingVenuePermissionWhatsAppMessage,
  getTrendingVenuePermissionWhatsAppUrl,
  safeWhatsAppEncode,
  formatWhatsAppPhone,
  cleanWhatsAppText,
} from '../utils/whatsappMessages';
import { findDuplicatePhoneEntity } from '../utils/phoneValidator';
import { extractGooglePlaceData, isGoogleMapsUrl } from '../utils/googlePlaceExtractor';

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
  const [customMsgType, setCustomMsgType] = useState<'intro' | 'followup' | 'offer' | 'permission'>('intro');

  // Quick New Lead Form States (Inside Modal)
  const [newClientName, setNewClientName] = useState<string>('');
  const [newBizName, setNewBizName] = useState<string>('');
  const [newGroup, setNewGroup] = useState<string>('المطاعم والأغذية والمشروبات');
  const [newCategory, setNewCategory] = useState<string>('مطعم / مأكولات ومشويات');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newGovernorate, setNewGovernorate] = useState<string>('القاهرة');
  const [newCity, setNewCity] = useState<string>('');
  const [newInterestLevel, setNewInterestLevel] = useState<LeadInterestLevel>('medium');
  const [newIsTrending, setNewIsTrending] = useState<boolean>(false);
  const [newLocationUrl, setNewLocationUrl] = useState<string>('');
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newNotes, setNewNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // 🏷️ Accordion state (Single expanded card at a time - UX Overhaul)
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // ⚡ Inline lead form Google link extraction states
  const [isExtractingInlineLead, setIsExtractingInlineLead] = useState<boolean>(false);
  const [inlineExtractNotice, setInlineExtractNotice] = useState<string | null>(null);
  const [rawImportedCategory, setRawImportedCategory] = useState<string | null>(null);

  const handleAutoExtractInlineLead = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setIsExtractingInlineLead(true);
    setInlineExtractNotice('جاري فحص الرابط واستخراج بيانات المنشأة من خرائط Google...');
    try {
      const data = await extractGooglePlaceData(trimmed);
      if (data) {
        if (data.name) {
          setNewBizName(data.name);
          if (!newClientName.trim()) {
            setNewClientName(`مسؤول ${data.name}`);
          }
        }
        if (data.phone) setNewPhone(data.phone);
        if (data.governorate) setNewGovernorate(data.governorate);
        if (data.city) setNewCity(data.city);
        if (data.resolvedUrl) setNewLocationUrl(data.resolvedUrl);

        if (data.category) {
          const cleanCat = data.category.trim();
          setNewCategory(cleanCat);
          const inferredGroup = getCategoryGroupFor(cleanCat);
          setNewGroup(inferredGroup);
          setRawImportedCategory(null);
        }
        setInlineExtractNotice('✅ تم استخراج البيانات وتحديث الحقول بنجاح');
        setTimeout(() => setInlineExtractNotice(null), 5000);
      } else {
        setInlineExtractNotice('⚠️ تعذر استخراج كامل البيانات تلقائياً، يمكنك إكمال الحقول يدوياً.');
        setTimeout(() => setInlineExtractNotice(null), 4000);
      }
    } catch {
      setInlineExtractNotice('⚠️ حدث خطأ في الاتصال، يمكنك إدخال البيانات يدوياً.');
      setTimeout(() => setInlineExtractNotice(null), 4000);
    } finally {
      setIsExtractingInlineLead(false);
    }
  };

  /** Extract clean map URL and clean notes text from combined notes field */
  const extractNotesAndMapUrl = useCallback((notes?: string, locationUrl?: string): { cleanText: string; mapUrl?: string } => {
    if (!notes && !locationUrl) return { cleanText: '' };
    let mapUrl: string | undefined = locationUrl || undefined;
    let cleanText = notes || '';
    // Find and remove embedded Google Maps URL from notes text
    const urlRegex = /https?:\/\/(?:www\.google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)[^\s\n]*/g;
    const urlsInNotes = cleanText.match(urlRegex);
    if (urlsInNotes && urlsInNotes.length > 0) {
      if (!mapUrl) mapUrl = urlsInNotes[0];
      cleanText = cleanText.replace(urlRegex, '').replace(/📍\s*موقع الخريطة:\s*/g, '').trim();
      // Remove any leading/trailing pipe separators or empty lines
      cleanText = cleanText.replace(/\|+/g, '').replace(/\n{3,}/g, '\n\n').trim();
    }
    return { cleanText, mapUrl };
  }, []);

  const handleCopyLink = useCallback((id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    });
  }, []);

  // Scoped Data (Filter by Rep if not Admin)
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

  // 🔍 Duplicate Phone Detectors
  const duplicateNewPhone = useMemo(() => {
    return findDuplicatePhoneEntity(newPhone, { businesses, leads });
  }, [newPhone, businesses, leads]);

  const duplicateEditPhone = useMemo(() => {
    if (!editingLead?.phone) return null;
    return findDuplicatePhoneEntity(editingLead.phone, { businesses, leads, excludeId: editingLead.id });
  }, [editingLead?.phone, editingLead?.id, businesses, leads]);

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

    // 🛡️ Prevent Duplicate Phone Numbers
    const duplicate = findDuplicatePhoneEntity(cleanPhone, { businesses, leads });
    if (duplicate) {
      const entityTypeStr = duplicate.type === 'business' ? 'نشاط تجاري مسجل مسبقاً' : 'عميل مهتم مسجل مسبقاً';
      setFormError(`⛔ رقم الهاتف (${duplicate.phone}) مسجل بالفعل مع ${entityTypeStr}: "${duplicate.name}" ${duplicate.location ? `(${duplicate.location})` : ''}. لا يمكن تكرار تسجيل نفس رقم الهاتف.`);
      return;
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const repId = currentUser?.repData?.id || currentUser?.id || currentRep?.id || 'rep_1';
    const repName = currentUser?.repData?.name || currentUser?.name || currentRep?.name || 'مندوب معتمد';

    const rawClient = newClientName.trim();
    const rawBiz = newBizName.trim();
    const cleanClientName = (rawClient && rawClient !== 'عميل مهتم' && rawClient !== 'عملاء مهتمون')
      ? rawClient
      : (rawBiz && rawBiz !== 'عميل مهتم' && rawBiz !== 'عملاء مهتمون')
      ? rawBiz
      : 'صاحب المنشأة';
    const cleanBizName = (rawBiz && rawBiz !== 'عميل مهتم' && rawBiz !== 'عملاء مهتمون')
      ? rawBiz
      : cleanClientName;

    // Retain authentic category as extracted or selected
    const finalCategory = newCategory.trim() || rawImportedCategory?.trim() || 'نشاط تجاري / خدمي آخر';

    const newLead: InterestedLead = {
      id: leadId,
      clientName: cleanClientName,
      businessName: cleanBizName,
      businessCategory: finalCategory,
      phone: cleanPhone,
      governorate: newGovernorate,
      city: newCity.trim() || undefined,
      interestLevel: newIsTrending ? 'trending_free' : newInterestLevel,
      isTrending: newIsTrending || undefined,
      locationUrl: newLocationUrl.trim() || undefined,
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
    setNewGroup('المطاعم والأغذية والمشروبات');
    setNewCategory('مطعم / مأكولات ومشويات');
    setNewPhone('');
    setNewCity('');
    setNewInterestLevel('medium');
    setNewIsTrending(false);
    setNewLocationUrl('');
    setRawImportedCategory(null);
    setInlineExtractNotice(null);
    setNewNotes('');
    setFormError('');
  };

  // WhatsApp Message Generator (مختصرة، طبيعية، بدون طابع ترويجي مع توضيح الدفع بعد التوثيق)
  const generateWhatsAppMessage = (lead: InterestedLead, type: 'intro' | 'followup' | 'offer' | 'permission') => {
    const clientName = lead.clientName?.trim() || 'صاحب المنشأة';
    const bizTitle = lead.businessName?.trim() ? `منشأتكم (${lead.businessName.trim()})` : 'مكانكم';

    if (type === 'permission' || (lead.isTrending && type === 'intro')) {
      return generateTrendingVenuePermissionWhatsAppMessage({
        clientName: lead.clientName,
        businessName: lead.businessName,
      });
    }

    if (type === 'intro') {
      return `السلام عليكم ورحمة الله،
أهلاً بحضرتك أستاذ ${clientName}، بخصوص ${bizTitle}:

قام مندوبنا بزيارة المنطقة المتواجد بها مكانكم وقام بعرض باقة التوثيق على سيادتكم (أو أحد العاملين بالمكان).

الباقة تشمل تثبيت وتوثيق الموقع الجغرافي للمنشأة بدقة على خرائط Google، وإضافة أرقام التواصل ومواعيد العمل والصور الرسمية، برسوم 250 جنيه (سداد لمرة واحدة بدون اشتراكات، ويمكن أن يتم السداد بعد إتمام التوثيق والظهور على الخريطة).

في حال رغبتكم في استكمال التوثيق أو وجود أي استفسار، يسعدنا تواصلكم معنا عبر هذه المحادثة.`;
    }

    if (type === 'followup') {
      return `السلام عليكم ورحمة الله يا فندم،
متابعة مع حضرتك بخصوص توثيق ${bizTitle} على خرائط Google.
هل نحدد موعداً مناسباً لزيارة المندوب والبدء في تسجيل ورفع البيانات؟ (مع العلم أن السداد يمكن أن يتم بعد التوثيق والظهور).`;
    }

    // Offer / Service details
    return `السلام عليكم ورحمة الله،
توضيح لخدمات التوثيق المتاحة لـ ${bizTitle}:

1. باقة التوثيق الأساسي (250 ج): تثبيت وتوثيق المنشأة على خرائط Google مع إضافة بيانات الاتصال ومواعيد العمل والصور (ويمكن السداد بعد إتمام التوثيق والظهور على الخريطة).
2. باقة التأسيس والربط (750 ج): توثيق الخريطة + تأسيس وتنسيق الصفحات وتصميم الإعلان ومتابعة مستمرة.

متاحين لأي استفسار أو لترتيب موعد الزيارة والتنفيذ.`;
  };

  const handleOpenWhatsApp = (lead: InterestedLead, type: 'intro' | 'followup' | 'offer' | 'permission') => {
    let url: string;
    if (type === 'permission') {
      url = getTrendingVenuePermissionWhatsAppUrl(lead.phone, {
        clientName: lead.clientName,
        businessName: lead.businessName,
      });
    } else {
      const msg = cleanWhatsAppText(generateWhatsAppMessage(lead, type));
      const waPhone = formatWhatsAppPhone(lead.phone);
      url = waPhone ? `https://wa.me/${waPhone}?text=${safeWhatsAppEncode(msg)}` : '#';
    }
    if (url && url !== '#') {
      window.open(url, '_blank');
    }

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
      case 'trending_free':
        return (
          <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span>منشأة رائجة (إدراج مجاني) 🌟</span>
          </span>
        );
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

          {/* Add Lead Quick Button (Toggles Inline Form) */}
          <button
            type="button"
            onClick={() => {
              setShowAddLeadModal(!showAddLeadModal);
              if (showAddLeadModal) resetNewLeadForm();
            }}
            className={`font-black text-xs px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-transform active:scale-95 self-stretch sm:self-auto ${
              showAddLeadModal
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950'
            }`}
          >
            {showAddLeadModal ? (
              <>
                <X className="w-4 h-4 stroke-[3]" />
                <span>إلغاء وإغلاق النموذج</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ تسجيل شخص مهتم جديد</span>
              </>
            )}
          </button>
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
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block">بانتظار المتابعة</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{pendingLeadsCount}</span>
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
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-bold block">تم التواصل معهم</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{contactedLeadsCount}</span>
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
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">تحولوا لمشتركين</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{convertedLeadsCount}</span>
          </button>
        </div>

        {/* ========================================================
            INLINE REGISTRATION FORM (Replaces Pop-up Modal)
            ======================================================== */}
        {showAddLeadModal && (
          <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl p-4 sm:p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-lg animate-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                    تسجيل شخص مهتم / زيارة جديدة
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-bold">
                    حفظ بيانات المنشأة والشخص في سجل المراجعات للمتابعة لاحقاً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddLeadModal(false);
                  resetNewLeadForm();
                }}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold cursor-pointer transition-colors"
                title="إغلاق النموذج"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl font-bold text-xs">
                {formError}
              </div>
            )}

            {/* Link-First Auto-Extraction */}
            <div className="bg-gradient-to-r from-blue-500/10 via-[var(--bg-card)] to-indigo-500/10 border border-blue-500/30 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  <span>استيراد فوري عبر رابط خرائط Google (اختياري)</span>
                </label>
                <span className="text-[10px] bg-blue-500/15 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-black">
                  تعبئة تلقائية
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  dir="ltr"
                  value={newLocationUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewLocationUrl(val);
                    if (isGoogleMapsUrl(val)) {
                      handleAutoExtractInlineLead(val);
                    }
                  }}
                  placeholder="الصق رابط خرائط Google (maps.app.goo.gl/...)"
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-blue-500 text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none text-right"
                />
                <button
                  type="button"
                  disabled={isExtractingInlineLead || !newLocationUrl.trim()}
                  onClick={() => handleAutoExtractInlineLead(newLocationUrl)}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95"
                >
                  {isExtractingInlineLead ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الاستيراد...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>استيراد فوري</span>
                    </>
                  )}
                </button>
              </div>
              {inlineExtractNotice && (
                <div className="text-[11px] font-bold p-2 rounded-xl bg-blue-500/15 text-blue-900 dark:text-blue-200 border border-blue-500/30 flex items-center gap-2">
                  <span>{inlineExtractNotice}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-3">
              {/* Mode Toggle: Normal Lead vs Trending Venue */}
              <div className="grid grid-cols-2 gap-2 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => {
                    setNewIsTrending(false);
                    if (newInterestLevel === 'trending_free') setNewInterestLevel('medium');
                  }}
                  className={`py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !newIsTrending
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>عميل مهتم عادي</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewIsTrending(true);
                    setNewInterestLevel('trending_free');
                  }}
                  className={`py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    newIsTrending
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>منشأة رائجة (إدراج مجاني)</span>
                </button>
              </div>

              {/* Names & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">
                    {newIsTrending ? 'اسم المسؤول / صاحب المكان *' : 'اسم الشخص / صاحب المنشأة *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ. محمد أحمد"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم المكان / المحل *</label>
                  <input
                    type="text"
                    required={newIsTrending}
                    placeholder="مثال: مطعم أو كافيه أو متجر..."
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
                  {duplicateNewPhone && (
                    <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 mt-1.5 animate-fade-in">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>
                        مسجل مسبقاً مع {duplicateNewPhone.type === 'business' ? 'نشاط' : 'مراجعة'}: {duplicateNewPhone.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Selection (Always visible with warning if raw category was extracted) */}
              <div className="space-y-2 bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                {rawImportedCategory && (
                  <div className="bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 p-2 rounded-xl text-[11px] font-bold flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      تصنيف Google المستخرج: <strong>"{rawImportedCategory}"</strong> — يرجى تأكيد التصنيف المعتمد:
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">مجموعة الأنشطة *</label>
                    <select
                      value={newGroup}
                      onChange={(e) => {
                        const grpName = e.target.value;
                        setNewGroup(grpName);
                        const found = CATEGORY_GROUPS.find((g) => g.group === grpName);
                        if (found && found.items.length > 0) {
                          setNewCategory(found.items[0]);
                        }
                      }}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                    >
                      {CATEGORY_GROUPS.map((g) => (
                        <option key={g.group} value={g.group}>
                          {g.icon} {g.group}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)] flex items-center justify-between">
                      <span>نوع النشاط والتصنيف *</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        معتمد بدليلك
                      </span>
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-emerald-700 dark:text-emerald-300 font-black rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                    >
                      {newCategory && !(CATEGORY_GROUPS.find((g) => g.group === newGroup)?.items || []).includes(newCategory) && (
                        <option value={newCategory}>
                          {newCategory} (تصنيف خرائط Google)
                        </option>
                      )}
                      {(CATEGORY_GROUPS.find((g) => g.group === newGroup)?.items || []).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location & Follow-up Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة *</label>
                  <select
                    value={newGovernorate}
                    onChange={(e) => setNewGovernorate(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
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

                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">موعد المتابعة القادم</label>
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[var(--text-primary)]">ملاحظات الزيارة أو الاتفاق</label>
                <textarea
                  rows={2}
                  placeholder="سجل أي ملاحظات خاصة بالعميل أو تفاصيل الزيارة..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-medium rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLeadModal(false);
                    resetNewLeadForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ السجل في المراجعات</span>
                </button>
              </div>
            </form>
          </div>
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
            <option value="trending_free">🌟 منشآت رائجة (إدراج مجاني)</option>
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
                عند زيارتك الميدانية لمحل أو صاحب منشأة يرغب في التفكير أو المراسلة لاحقاً، اضغط على زر "تسجيل شخص مهتم جديد" لحفظ بياناته ومراجعته هنا.
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
              const isExpanded = expandedLeadId === lead.id;
              const cleanBizName = (lead.businessName && lead.businessName !== 'عميل مهتم' && lead.businessName !== 'عملاء مهتمون')
                ? lead.businessName.trim()
                : '';
              const cleanClientName = (lead.clientName && lead.clientName !== 'عميل مهتم' && lead.clientName !== 'عملاء مهتمون')
                ? lead.clientName.trim()
                : '';
              const displayTitle = cleanBizName || cleanClientName || 'منشأة بدون اسم';
              const rawCat = (lead.businessCategory && lead.businessCategory !== 'عميل مهتم' && lead.businessCategory !== 'عملاء مهتمون')
                ? lead.businessCategory.trim()
                : '';
              const verifiedCat = rawCat || '';
              const { cleanText, mapUrl } = extractNotesAndMapUrl(lead.notes, lead.locationUrl);
              const linkId = `lead-card-${lead.id}`;

              return (
                <div
                  key={lead.id}
                  className={`bg-[var(--bg-surface)] rounded-2xl border transition-all duration-200 shadow-xs ${
                    isExpanded
                      ? 'border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                      : 'border-[var(--border-color)] hover:border-amber-500/40'
                  }`}
                >
                  {/* Collapsed / Summary Row (Always Visible) */}
                  <div className="p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs">
                            {displayTitle}
                          </h4>

                          {verifiedCat && (
                            <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10.5px] px-2 py-0.5 rounded-md border border-amber-500/30">
                              {verifiedCat}
                            </span>
                          )}

                          <span className="text-[11px] text-[var(--text-muted)] font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{lead.governorate} {lead.city ? `- ${lead.city}` : ''}</span>
                          </span>

                          <a
                            href={`tel:${lead.phone}`}
                            className="font-mono font-bold text-[11px] text-amber-700 dark:text-amber-300 dir-ltr hover:underline bg-[var(--input-bg)] px-1.5 py-0.5 rounded border border-[var(--border-color)]"
                          >
                            {lead.phone}
                          </a>

                          {lead.followUpDate && (
                            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
                              متابعة: {lead.followUpDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Left Side: Badges + Quick WhatsApp + Accordion Toggle */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
                      {(lead.isTrending || lead.interestLevel === 'trending_free') && (
                        <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span>رائجة</span>
                        </span>
                      )}

                      {getStatusBadge(lead.status)}

                      {/* Quick WhatsApp intro button */}
                      {lead.isTrending || lead.interestLevel === 'trending_free' ? (
                        <a
                          href={getTrendingVenuePermissionWhatsAppUrl(lead.phone, {
                            clientName: lead.clientName,
                            businessName: lead.businessName,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            onUpdateLead({
                              ...lead,
                              lastContactedDate: new Date().toISOString(),
                              status: lead.status === 'pending_followup' ? 'contacted' : lead.status,
                            });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                          title="طلب سماح بالإدراج عبر واتساب"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">طلب سماح</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setWhatsAppModalLead(lead);
                            setCustomMsgType('intro');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                          title="مراسلة واتساب"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">واتساب</span>
                        </button>
                      )}

                      {/* Accordion Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                        className={`flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                            : 'bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                        title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل الكاملة'}
                      >
                        <span>{isExpanded ? 'أقل' : 'المزيد'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-color)] p-3.5 sm:p-4 bg-[var(--bg-card)]/50 rounded-b-2xl space-y-3 animate-fade-in text-xs">
                      {/* Grid info: Client Name, Rep, Interest */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {cleanClientName && cleanClientName !== cleanBizName && (
                          <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                            <span className="text-[var(--text-muted)] font-bold text-[11px]">المسؤول / صاحب المكان:</span>
                            <span className="font-bold text-[var(--text-primary)]">{cleanClientName}</span>
                          </div>
                        )}

                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                          <span className="text-[var(--text-muted)] font-bold text-[11px]">المندوب المسجل:</span>
                          <span className="font-bold text-[var(--text-secondary)] truncate max-w-[140px]">{lead.repName}</span>
                        </div>

                        <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                          <span className="text-[var(--text-muted)] font-bold text-[11px]">مستوى الاهتمام:</span>
                          <div>{getInterestBadge(lead.interestLevel)}</div>
                        </div>

                        {lead.street && (
                          <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between sm:col-span-2">
                            <span className="text-[var(--text-muted)] font-bold text-[11px]">الشارع / العنوان:</span>
                            <span className="font-bold text-[var(--text-primary)]">{lead.street}</span>
                          </div>
                        )}
                      </div>

                      {/* Map Location Link */}
                      {((lead.lat && lead.lng) || lead.locationUrl) && (
                        <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                          <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300">نقطة الخريطة الجغرافية محددة:</span>
                          <a
                            href={sanitizeExternalUrl(lead.locationUrl || `https://www.google.com/maps?q=${lead.lat},${lead.lng}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-[11px] inline-flex items-center gap-1 mr-auto"
                          >
                            <span>فتح الرابط في خرائط Google</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Notes snippet & Map Link Button */}
                      {cleanText && (
                        <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl text-xs text-[var(--text-secondary)] leading-relaxed break-words">
                          <strong className="text-amber-600 dark:text-amber-400 font-bold block text-[10px] mb-0.5">ملاحظات الزيارة الميدانية:</strong>
                          {cleanText}
                        </div>
                      )}

                      {mapUrl && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(linkId, mapUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-700 dark:text-blue-300 text-[11px] font-bold transition-colors cursor-pointer"
                            title="نسخ رابط الخريطة"
                          >
                            {copiedLinkId === linkId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedLinkId === linkId ? 'تم النسخ' : 'نسخ رابط الخريطة'}</span>
                          </button>
                          <a
                            href={sanitizeExternalUrl(mapUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-700 dark:text-green-300 text-[11px] font-bold transition-colors"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>فتح الخريطة</span>
                          </a>
                        </div>
                      )}

                      {/* Admin Follow-ups */}
                      {lead.adminFollowUps && lead.adminFollowUps.length > 0 && (
                        <div className="bg-purple-500/10 border border-purple-500/25 p-2.5 rounded-xl text-xs text-purple-950 dark:text-purple-200 space-y-1">
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

                      {/* Full Action Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Call */}
                          <a
                            href={`tel:${lead.phone}`}
                            className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-primary)] font-bold px-3 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1.5 transition-colors text-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-500" />
                            <span>اتصال</span>
                          </a>

                          {/* Follow-up Notes */}
                          <button
                            type="button"
                            onClick={() => setSelectedFollowUpLead(lead)}
                            className="bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 font-black px-3 py-1.5 rounded-xl border border-purple-500/30 shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 text-xs"
                            title="عرض وتسجيل المتابعات والملاحظات الإدارية"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>متابعات ({lead.adminFollowUps?.length || 0})</span>
                          </button>

                          {/* Direct Convert to Business */}
                          {onDirectConvertLead && lead.status !== 'converted' && (
                            <button
                              type="button"
                              onClick={() => onDirectConvertLead(lead)}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 text-xs"
                              title="تحويل فوري إلى نشاط معتمد وموثق بالدليل بدون رسوم"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>تحويل فوري لتسجيل معتمد</span>
                            </button>
                          )}

                          {/* Open in full Registration Form */}
                          {lead.status !== 'converted' && (
                            <button
                              type="button"
                              onClick={() => onConvertToBusiness(lead)}
                              className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 cursor-pointer transition-transform active:scale-95 text-xs"
                              title="فتح نموذج التسجيل وتعبئة البيانات يدوياً خطوة بخطوة"
                            >
                              <FileText className="w-3 h-3 text-amber-500" />
                              <span>فتح بالنموذج الكامل</span>
                            </button>
                          )}

                          {lead.status === 'converted' && (
                            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تم التحويل لمشترك معتمد</span>
                            </span>
                          )}
                        </div>

                        {/* Edit and Delete */}
                        <div className="flex items-center gap-1 mr-auto">
                          <button
                            type="button"
                            onClick={() => setEditingLead(lead)}
                            className="p-1.5 rounded-lg bg-[var(--input-bg)] hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
                            title="تعديل بيانات العميل وحالة المتابعة"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

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
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

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
                    تعديل بيانات المنشأة والمتابعة: {editingLead.businessName || (editingLead.clientName !== 'عميل مهتم' ? editingLead.clientName : 'المراجعة')}
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
                {/* 1. Name & Venue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم المكان / المحل *</label>
                    <input
                      type="text"
                      value={editingLead.businessName || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, businessName: e.target.value })}
                      placeholder="مثال: قصر المندي أو دكان البنا"
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم العميل / المسؤول</label>
                    <input
                      type="text"
                      value={editingLead.clientName || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, clientName: e.target.value })}
                      placeholder="اسم صاحب المنشأة أو المسؤول"
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* 2. Phone & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم الهاتف / واتساب *</label>
                    <input
                      type="tel"
                      value={editingLead.phone || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                    />
                    {duplicateEditPhone && (
                      <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 mt-1.5 animate-fade-in">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>
                          ⛔ مسجل مسبقاً مع {duplicateEditPhone.type === 'business' ? 'نشاط' : 'مراجعة'}: {duplicateEditPhone.name} {duplicateEditPhone.location ? `(${duplicateEditPhone.location})` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">نوع النشاط والتصنيف *</label>
                    <select
                      value={editingLead.businessCategory || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, businessCategory: e.target.value })}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      {(!editingLead.businessCategory ||
                        editingLead.businessCategory === 'عميل مهتم' ||
                        editingLead.businessCategory === 'عملاء مهتمون' ||
                        !CATEGORY_GROUPS.some(g => g.items.includes(editingLead.businessCategory || ''))) && (
                        <option value={editingLead.businessCategory || ''} disabled>
                          ⚠️ غير مصنف ({editingLead.businessCategory || 'اختر التصنيف'})
                        </option>
                      )}
                      {CATEGORY_GROUPS.map((g) => (
                        <optgroup key={g.group} label={`${g.icon} ${g.group}`}>
                          {g.items.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة</label>
                    <select
                      value={editingLead.governorate || 'القاهرة'}
                      onChange={(e) => setEditingLead({ ...editingLead, governorate: e.target.value })}
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
                      value={editingLead.city || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, city: e.target.value })}
                      placeholder="مثال: الدقي / المهندسين"
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

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
                      onChange={(e) => {
                        const val = e.target.value as LeadInterestLevel;
                        setEditingLead({
                          ...editingLead,
                          interestLevel: val,
                          isTrending: val === 'trending_free' ? true : editingLead.isTrending,
                        });
                      }}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      <option value="trending_free">🌟 منشأة رائجة (طلب سماح بإدراج مجاني)</option>
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
                      if (duplicateEditPhone) {
                        const entityTypeStr = duplicateEditPhone.type === 'business' ? 'نشاط تجاري مسجل مسبقاً' : 'عميل مهتم مسجل مسبقاً';
                        alert(`⛔ رقم الهاتف (${duplicateEditPhone.phone}) مسجل بالفعل مع ${entityTypeStr}: "${duplicateEditPhone.name}" ${duplicateEditPhone.location ? `(${duplicateEditPhone.location})` : ''}. لا يمكن تكرار تسجيل نفس رقم الهاتف.`);
                        return;
                      }

                      const cleanBiz = (editingLead.businessName && editingLead.businessName !== 'عميل مهتم' && editingLead.businessName !== 'عملاء مهتمون')
                        ? editingLead.businessName.trim()
                        : '';
                      const cleanClient = (editingLead.clientName && editingLead.clientName !== 'عميل مهتم' && editingLead.clientName !== 'عملاء مهتمون')
                        ? editingLead.clientName.trim()
                        : '';
                      const rawCat = editingLead.businessCategory?.trim();
                      const cleanCat = (rawCat && rawCat !== 'عميل مهتم' && rawCat !== 'عملاء مهتمون')
                        ? rawCat
                        : 'خدمات وأنشطة عامة';

                      onUpdateLead({
                        ...editingLead,
                        businessName: cleanBiz || cleanClient || 'منشأة تجارية',
                        clientName: cleanClient || cleanBiz || 'صاحب المنشأة',
                        businessCategory: cleanCat,
                        phone: (editingLead.phone || '').replace(/\D/g, ''),
                      });
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomMsgType('permission')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      customMsgType === 'permission'
                        ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-500/40'
                    }`}
                  >
                    طلب سماح (مجاني) 🌟
                  </button>

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

      {/* ========================================================
          MODAL: LEAD ADMINISTRATIVE FOLLOW-UPS & NOTES
          ======================================================== */}
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
