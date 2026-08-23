import React, { useState, useEffect, useMemo } from 'react';
import { DocViewerModal } from './DocViewerModal';
import { Business, Representative, PaymentGatewayConfig, UserRole, VerificationStatus, PaymentStatus } from '../types';
import { EGYPT_GOVERNORATES, PACKAGES, BUSINESS_CATEGORIES } from '../data/mockData';
import { calculateTotalRepCommission } from '../utils/commission';
import { UserAvatar } from './UserAvatar';
import { BusinessEditModal } from './BusinessEditModal';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  Phone,
  FileText,
  FileSignature,
  CreditCard,
  UserCheck,
  UserX,
  Briefcase,
  Crown,
  Calculator,
  Camera,
  Activity,
  Store,
  MapPin,
  Settings,
  X,
  Save,
  Check,
  Building2,
  Eye,
  Image as ImageIcon,
  User,
  Info,
  Calendar,
  Hash,
  Compass,
  UploadCloud,
} from 'lucide-react';

interface AdminDashboardProps {
  businesses: Business[];
  representatives: Representative[];
  paymentConfig: PaymentGatewayConfig;
  onUpdateBusiness: (biz: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onDeleteRepresentative?: (id: string) => void;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
  onShowInvoice: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  businesses,
  representatives,
  paymentConfig,
  onUpdateBusiness,
  onDeleteBusiness,
  onAddRepresentative,
  onUpdateRepresentative,
  onDeleteRepresentative,
  onUpdatePaymentConfig,
  onShowInvoice,
  onCollectPayment,
}) => {
  // Main Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'businesses' | 'reps' | 'gateways'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubtab = urlParams.get('subtab');
    if (urlSubtab && ['overview', 'businesses', 'reps', 'gateways'].includes(urlSubtab)) {
      return urlSubtab as any;
    }

    const savedSubtab = localStorage.getItem('dalelak_active_admin_tab');
    if (savedSubtab && ['overview', 'businesses', 'reps', 'gateways'].includes(savedSubtab)) {
      return savedSubtab as any;
    }

    return 'overview';
  });

  // Sync activeAdminTab state with localStorage and browser URL query params
  useEffect(() => {
    if (activeAdminTab) {
      localStorage.setItem('dalelak_active_admin_tab', activeAdminTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('subtab') !== activeAdminTab) {
        url.searchParams.set('subtab', activeAdminTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeAdminTab]);

  // Search & Filter States
  const [bizSearchQuery, setBizSearchQuery] = useState<string>('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');

  // ---------------------------------------------------------------------------
  // MODAL STATES (Dedicated Pop-ups for Editing & Management)
  // ---------------------------------------------------------------------------
  // 1. Business Editing & Full Details Modal State
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // 2. Account Editing / Adding Modal State
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [modalRole, setModalRole] = useState<UserRole>('rep');
  const [modalName, setModalName] = useState<string>('');
  const [modalEmail, setModalEmail] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalGov, setModalGov] = useState<string>('القاهرة');
  const [modalTarget, setModalTarget] = useState<number>(25);
  const [modalCommission, setModalCommission] = useState<number>(42.86);
  const [modalStatus, setModalStatus] = useState<'active' | 'suspended'>('active');
  const [modalPassword, setModalPassword] = useState<string>('Aa123456');

  // 3. Payment Gateway Config Editing Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [vodaNumber, setVodaNumber] = useState<string>(paymentConfig.vodafoneCashNumber || '01143888355');
  const [vodaNumber2, setVodaNumber2] = useState<string>(paymentConfig.vodafoneCashNumber2 || '01556221141');

  // 4. Avatar Preview & Approval Modal State
  const [previewAvatarRep, setPreviewAvatarRep] = useState<Representative | null>(null);
  const [selectedAdminDoc, setSelectedAdminDoc] = useState<{ type: 'field_letter' | 'digital_badge' | 'rep_contract', rep: Representative } | null>(null);

  // ---------------------------------------------------------------------------
  // CALCULATIONS & MERGED DATA
  // ---------------------------------------------------------------------------
  const totalRevenue = businesses.reduce((acc, b) => acc + b.amountPaid, 0);
  const totalDebt = businesses.reduce((acc, b) => acc + Math.max(0, b.packagePrice - b.amountPaid), 0);
  const verifiedCount = businesses.filter((b) => b.verificationStatus === 'verified').length;
  const inProgressCount = businesses.filter((b) => b.verificationStatus === 'in_progress').length;

  // Filtered Businesses
  const filteredBusinesses = useMemo(
    () =>
      businesses.filter((b) => {
        if (
          bizSearchQuery &&
          !b.nameAr.includes(bizSearchQuery) &&
          !b.ownerName.includes(bizSearchQuery) &&
          !b.ownerPhone.includes(bizSearchQuery)
        ) {
          return false;
        }
        if (governorateFilter !== 'all' && !b.governorate.includes(governorateFilter)) {
          return false;
        }
        if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) {
          return false;
        }
        if (verificationFilter !== 'all' && b.verificationStatus !== verificationFilter) {
          return false;
        }
        return true;
      }),
    [businesses, bizSearchQuery, governorateFilter, paymentFilter, verificationFilter]
  );

  // Merged Representatives Map (Props only, no localStorage)
  const allAdminRepsMap = new Map<string, Representative>();
  representatives.forEach((r) => allAdminRepsMap.set(r.email.trim().toLowerCase(), r));
  const mergedAdminReps = Array.from(allAdminRepsMap.values());

  // Filtered Accounts
  const filteredAccounts = useMemo(
    () =>
      mergedAdminReps.filter((acc) => {
        if (
          accountSearchQuery &&
          !acc.name.includes(accountSearchQuery) &&
          !acc.email.includes(accountSearchQuery) &&
          !acc.phone.includes(accountSearchQuery)
        ) {
          return false;
        }
        if (accountRoleFilter !== 'all') {
          const accRole = acc.role || 'rep';
          if (accRole !== accountRoleFilter) return false;
        }
        if (accountStatusFilter !== 'all') {
          const accStatus = acc.status || 'active';
          if (accStatus !== accountStatusFilter) return false;
        }
        return true;
      }),
    [mergedAdminReps, accountSearchQuery, accountRoleFilter, accountStatusFilter]
  );

  // ---------------------------------------------------------------------------
  // HANDLERS FOR MODALS & ACTIONS
  // ---------------------------------------------------------------------------
  const openAddAccountModal = () => {
    setEditingAccId(null);
    setModalRole('rep');
    setModalName('');
    setModalEmail('');
    setModalPhone('');
    setModalGov('القاهرة');
    setModalTarget(25);
    setModalCommission(42.86);
    setModalStatus('active');
    setModalPassword('Aa123456');
    setShowAccountModal(true);
  };

  const openEditAccountModal = (acc: Representative) => {
    setEditingAccId(acc.id);
    setModalRole(acc.role || 'rep');
    setModalName(acc.name);
    setModalEmail(acc.email);
    setModalPhone(acc.phone);
    setModalGov(acc.governorate);
    setModalTarget(acc.targetMonth);
    setModalCommission(acc.commissionRate || 42.86);
    setModalStatus(acc.status || 'active');
    setModalPassword(acc.password || 'Aa123456');
    setShowAccountModal(true);
  };

  const handleSaveAccountModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName || !modalPhone) return;

    // Arabic name validation
    const arabicNameRegex = /^[\u0600-\u06ff\u0750-\u077f\ufb50-\ufbff\ufe70-\ufeff ]+$/;
    if (!arabicNameRegex.test(modalName.trim())) {
      alert('يجب إدخال الاسم باللغة العربية فقط (لا تستخدم أحرف إنجليزية أو أرقام).');
      return;
    }

    const roleTitleMap: Record<UserRole, string> = {
      admin: 'مدير النظام دليلك',
      rep: 'مندوب مبيعات ميداني',
      supervisor: 'مشرف منطقة ومحافظة',
      accountant: 'محاسب ومحصل فواتير',
    };

    if (editingAccId && onUpdateRepresentative) {
      const existing = representatives.find((r) => r.id === editingAccId);
      if (existing) {
        onUpdateRepresentative({
          ...existing,
          name: modalName,
          email: modalEmail || existing.email,
          phone: modalPhone,
          role: modalRole,
          roleTitle: roleTitleMap[modalRole],
          governorate: modalGov,
          targetMonth: modalTarget,
          commissionRate: modalCommission,
          status: modalStatus,
          password: modalPassword,
        });
      }
    } else {
      onAddRepresentative({
        name: modalName,
        email: modalEmail || `acc_${Date.now()}@daleelek.eg`,
        phone: modalPhone,
        role: modalRole,
        roleTitle: roleTitleMap[modalRole],
        governorate: modalGov,
        targetMonth: modalTarget,
        commissionRate: modalCommission,
        status: modalStatus,
        password: modalPassword,
        avatar: '', // No avatar — will show first letter initial
      });
    }

    setShowAccountModal(false);
  };

  const handleSaveBusinessFromModal = (updatedBiz: Business) => {
    onUpdateBusiness(updatedBiz);
  };

  const handleSavePaymentConfigModal = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig({
      fawryMerchantCode: fawryCode,
      vodafoneCashNumber: vodaNumber,
      instaPayHandle: instaHandle,
      cardGatewayActive: true,
    });
    setShowPaymentModal(false);
  };

  const handleToggleAccountStatus = (acc: Representative) => {
    if (!onUpdateRepresentative) return;
    const newStatus = (acc.status || 'active') === 'active' ? 'suspended' : 'active';
    onUpdateRepresentative({ ...acc, status: newStatus });
  };

  // Render role badge helper
  const renderRoleBadge = (role: UserRole = 'rep') => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>مدير النظام</span>
          </span>
        );
      case 'supervisor':
        return (
          <span className="bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>مشرف منطقة</span>
          </span>
        );
      case 'accountant':
        return (
          <span className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Calculator className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>محاسب ومحصل</span>
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/15 text-blue-900 dark:text-blue-300 border border-blue-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>مندوب ميداني</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-['Cairo',sans-serif]">
      {/* --------------------------------------------------------------------- */}
      {/* HEADER & TOP NAVIGATION TABS */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl shadow-md flex flex-wrap items-center justify-between gap-4 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--text-primary)]">لوحة تحكم مدير النظام</h2>
              <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                dalilaakeg@gmail.com
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
              عرض كامل لبيانات الأنشطة الميدانية المرفوعة بواسطة المناديب ومعاينتها وتعديلها
            </p>
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)] text-xs shadow-inner">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer ${
              activeAdminTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            الإحصائيات
          </button>
          <button
            onClick={() => setActiveAdminTab('businesses')}
            className={`px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer ${
              activeAdminTab === 'businesses'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            الأنشطة ({businesses.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('reps')}
            className={`px-3.5 py-2 rounded-xl font-black transition-all relative cursor-pointer ${
              activeAdminTab === 'reps'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>الحسابات ({mergedAdminReps.length})</span>
            {mergedAdminReps.some((r) => r.status === 'suspended') && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1 left-1 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('gateways')}
            className={`px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer ${
              activeAdminTab === 'gateways'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            بوابات الدفع
          </button>
        </div>
      </div>

      {/* Pending Account Alert Banner if any suspended accounts exist */}
      {mergedAdminReps.some((r) => r.status === 'suspended') && (
        <div className="bg-amber-500/15 border-2 border-amber-500/50 p-4 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <UserCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-amber-300">
                🔔 يوجد ({mergedAdminReps.filter((r) => r.status === 'suspended').length}) حسابات معلقة بانتظار تفعيلك!
              </h3>
              <p className="text-[11px] text-slate-300">
                يمكنك الموافقة المباشرة بنقرة واحدة أو الدخول لتبويب الحسابات للمعاينة والتعديل.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (onUpdateRepresentative) {
                  mergedAdminReps
                    .filter((r) => r.status === 'suspended')
                    .forEach((r) => onUpdateRepresentative({ ...r, status: 'active' }));
                }
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>تفعيل جميع الحسابات المعلقة الآن</span>
            </button>
            <button
              onClick={() => {
                setActiveAdminTab('reps');
                setAccountStatusFilter('suspended');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs border border-amber-500/30 cursor-pointer"
            >
              عرض الحسابات
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SUMMARY KPI CARDS */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>المبالغ المحصلة</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-500">
            {totalRevenue.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span>
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">إجمالي المدفوعات المستلمة</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>المبالغ المتبقية</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-500">
            {totalDebt.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span>
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">ديون تحصيل معلقة</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>أنشطة موثقة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-[var(--text-primary)]">
            {verifiedCount} <span className="text-xs text-[var(--text-muted)]">نشاط</span>
          </p>
          <p className="text-[10px] text-emerald-500 font-bold">مبثوثة رسمياً على الخريطة</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>جاري التوثيق</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-500">
            {inProgressCount} <span className="text-xs text-[var(--text-secondary)]">نشاط</span>
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">قيد المراجعة الفنية</p>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & AUDIT */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Businesses Summary */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl space-y-3 shadow-md transition-colors duration-300">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>أحدث الأنشطة المسجلة</span>
              </span>
              <button
                onClick={() => setActiveAdminTab('businesses')}
                className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold hover:underline"
              >
                عرض الكل ({businesses.length})
              </button>
            </h3>

            <div className="space-y-2">
              {businesses.slice(0, 5).map((biz) => (
                <div
                  key={biz.id}
                  className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs transition-colors duration-300 shadow-sm hover:border-amber-500/30"
                >
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)]">{biz.nameAr}</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {biz.governorate} • المندوب: {biz.repName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        biz.verificationStatus === 'verified'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {biz.verificationStatus === 'verified' ? 'مفعل' : 'قيد المراجعة'}
                    </span>
                    <button
                      onClick={() => setEditingBusiness(biz)}
                      className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-2.5 py-1 rounded-xl border border-amber-500/30 transition-colors shadow-sm cursor-pointer flex items-center gap-1 text-[11px]"
                      title="عرض البيانات بالكامل والتعديل"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض وتعديل</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accounts Summary */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl space-y-3 shadow-md transition-colors duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>ملخص أدوات وحسابات النظام</span>
              </h3>
              <button
                onClick={openAddAccountModal}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حساب</span>
              </button>
            </div>

            <div className="space-y-2">
              {mergedAdminReps.slice(0, 5).map((rep) => {
                const repBiz = businesses.filter((b) => b.repId === rep.id);

                return (
                  <div
                    key={rep.id}
                    className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs transition-colors duration-300 shadow-sm hover:border-amber-500/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        avatar={rep.avatar}
                        name={rep.name}
                        role={rep.role}
                        avatarStatus={rep.avatarStatus}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-[var(--text-primary)]">{rep.name}</h4>
                          {renderRoleBadge(rep.role)}
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {rep.governorate} • {rep.phone}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openEditAccountModal(rep)}
                      className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-2.5 py-1 rounded-xl text-[11px] border border-amber-500/30 cursor-pointer shadow-sm"
                    >
                      تعديل
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit log for recent interactions */}
          <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-md transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <span>سجل التوثيقات والأنشطة الميدانية الحية</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                مزامنة حية Cloud DB
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {businesses.map((biz, idx) => (
                <div
                  key={`audit_${biz.id}_${idx}`}
                  className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 shadow-sm hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[var(--text-primary)]">{biz.nameAr}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {biz.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-0.5">
                        المندوب: <strong className="text-[var(--text-primary)]">{biz.repName}</strong> • {biz.governorate} ({biz.city})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingBusiness(biz)}
                      className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-3 py-1.5 rounded-xl text-[11px] cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض البيانات الكاملة والتعديل</span>
                    </button>
                    <button
                      onClick={() => onShowInvoice(biz)}
                      className="bg-[var(--input-bg)] text-[var(--text-primary)] hover:text-amber-500 font-bold px-3 py-1.5 rounded-xl text-[11px] border border-[var(--border-color)] cursor-pointer"
                    >
                      الفاتورة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: BUSINESSES TABLE & FULL DATA ACCESS */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'businesses' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
          {/* Simple Filters Header */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              <input
                type="text"
                placeholder="بحث باسم النشاط أو العميل أو الهاتف..."
                value={bizSearchQuery}
                onChange={(e) => setBizSearchQuery(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <select
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
            >
              <option value="all">كل المحافظات</option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
            >
              <option value="all">كل حالات الدفع</option>
              <option value="fully_paid">مدفوعة بالكامل</option>
              <option value="partially_paid">مدفوع جزء منها</option>
              <option value="unpaid">لم يتم الدفع نهائياً</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
            >
              <option value="all">كل حالات التوثيق</option>
              <option value="verified">تم التوثيق والظهور</option>
              <option value="in_progress">جاري التوثيق والمراجعة</option>
              <option value="pending">معلق</option>
            </select>
          </div>

          {/* Table displaying essential data with full pop-up view */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-xs text-right border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                  <th className="p-3">اسم النشاط والتصنيف</th>
                  <th className="p-3">الموقع الجغرافي والمندوب</th>
                  <th className="p-3">حالة التوثيق</th>
                  <th className="p-3 text-center">التفاصيل والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredBusinesses.map((biz) => {
                  return (
                    <tr key={biz.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-3">
                        <p className="font-extrabold text-[var(--text-primary)] text-sm">{biz.nameAr}</p>
                        {biz.nameEn && <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.nameEn}</p>}
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">{biz.category}</p>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-[var(--text-primary)]">{biz.governorate} ({biz.city})</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-bold">المندوب: {biz.repName}</p>
                      </td>

                      <td className="p-3">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm ${
                            biz.verificationStatus === 'verified'
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                              : biz.verificationStatus === 'in_progress'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {biz.verificationStatus === 'verified'
                            ? 'مفعل ومبثوث'
                            : biz.verificationStatus === 'in_progress'
                            ? 'جاري التوثيق'
                            : 'معلق'}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setEditingBusiness(biz)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-4 py-2 rounded-xl transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                          title="عرض كل البيانات التي أدخلها المندوب والتعديل عليها"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض وتفاصيل النشاط</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: ACCOUNTS MANAGEMENT */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'reps' && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>إدارة حسابات المستخدمين والصلاحيات</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  عرض موجز وبسيط لجميع المناديب، المشرفين، المحاسبين، والأدمن مع التعديل في نوافذ خاصة
                </p>
              </div>

              <button
                onClick={openAddAccountModal}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shrink-0 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة حساب جديد</span>
              </button>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="بحث باسم الحساب، البريد، أو الهاتف..."
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl pr-8 pl-3 py-2 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <select
                value={accountRoleFilter}
                onChange={(e) => setAccountRoleFilter(e.target.value)}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="all">كل الصلاحيات ({mergedAdminReps.length})</option>
                <option value="rep">المناديب الميدانيين</option>
                <option value="supervisor">مشرفي المناطق</option>
                <option value="accountant">المحاسبين والمحصلين</option>
                <option value="admin">مديري النظام والأدمن</option>
              </select>

              <select
                value={accountStatusFilter}
                onChange={(e) => setAccountStatusFilter(e.target.value)}
                className="bg-[var(--input-bg)] border border-amber-500/40 text-amber-700 dark:text-amber-300 font-extrabold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="all">كل حالات الحسابات</option>
                <option value="suspended">
                  🔔 المعلقة ({mergedAdminReps.filter((r) => r.status === 'suspended').length})
                </option>
                <option value="active">✅ النشطة والمفعلة</option>
              </select>
            </div>
          </div>

          {/* DEDICATED PENDING REGISTRATIONS SECTION */}
          {mergedAdminReps.some((r) => r.status === 'suspended') && (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-lg animate-fade-in-up">
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <h4 className="font-black text-sm text-amber-800 dark:text-amber-300">
                    طلبات الحسابات الجديدة المعلقة بانتظار التفعيل ({mergedAdminReps.filter((r) => r.status === 'suspended').length})
                  </h4>
                </div>
                <button
                  onClick={() => {
                    if (onUpdateRepresentative) {
                      mergedAdminReps
                        .filter((r) => r.status === 'suspended')
                        .forEach((r) => onUpdateRepresentative({ ...r, status: 'active' }));
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تفعيل الكل دفعة واحدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mergedAdminReps
                  .filter((r) => r.status === 'suspended')
                  .map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-[var(--bg-surface)] border-2 border-amber-500/40 rounded-2xl p-3.5 shadow-md flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            avatar={acc.avatar}
                            name={acc.name}
                            role={acc.role}
                            avatarStatus={acc.avatarStatus}
                            size="md"
                            isAdminPreview={true}
                          />
                          <div>
                            <h5 className="font-black text-sm text-[var(--text-primary)]">{acc.name}</h5>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">{acc.governorate}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono dir-ltr text-right">{acc.phone} • {acc.email}</p>
                          </div>
                        </div>

                        <span className="bg-amber-500/20 text-amber-900 dark:text-amber-300 font-black text-[10px] px-2.5 py-1 rounded-lg border border-amber-500/40 shrink-0">
                          معلق ⏳
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--border-color)]">
                        <button
                          onClick={() => {
                            if (onUpdateRepresentative) onUpdateRepresentative({ ...acc, status: 'active' });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] py-2 rounded-xl shadow flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>قبول وتفعيل</span>
                        </button>
                        <button
                          onClick={() => openEditAccountModal(acc)}
                          className="bg-amber-500/20 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black text-[11px] py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من رفض وحذف طلب حساب "${acc.name}"؟`)) {
                              if (onDeleteRepresentative) onDeleteRepresentative(acc.id);
                            }
                          }}
                          className="bg-rose-500/15 hover:bg-rose-500 text-rose-800 dark:text-rose-300 hover:text-white font-black text-[11px] py-2 rounded-xl border border-rose-500/40 flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAccounts.map((acc) => {
              const role = acc.role || 'rep';
              const isSuspended = acc.status === 'suspended';

              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-md ${
                    isSuspended
                      ? 'bg-amber-500/5 border-amber-500/40'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatar={acc.avatar}
                        name={acc.name}
                        role={acc.role}
                        avatarStatus={acc.avatarStatus}
                        size="md"
                        isAdminPreview={true}
                      />
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{acc.name}</h4>
                        <p className="text-xs text-amber-500 font-bold">{acc.governorate}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono dir-ltr text-right">{acc.phone}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {renderRoleBadge(role)}
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border shadow-sm ${
                          isSuspended
                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/50'
                            : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {isSuspended ? 'معلق' : 'نشط'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center gap-2 text-xs">
                    {isSuspended ? (
                      <>
                        <button
                          onClick={() => {
                            if (onUpdateRepresentative) onUpdateRepresentative({ ...acc, status: 'active' });
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl shadow flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>قبول وتفعيل</span>
                        </button>
                        <button
                          onClick={() => openEditAccountModal(acc)}
                          className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-3 py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openEditAccountModal(acc)}
                        className="w-full bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span>عرض وتعديل الحساب</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: PAYMENT GATEWAY SETTINGS */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'gateways' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 space-y-5 shadow-md max-w-2xl mx-auto transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2 text-amber-500">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-black text-base text-[var(--text-primary)]">إعدادات وسائل وبوابات الدفع الإلكتروني</h3>
            </div>

            <button
              onClick={() => {
                setVodaNumber(paymentConfig.vodafoneCashNumber || '01143888355');
                setVodaNumber2(paymentConfig.vodafoneCashNumber2 || '01556221141');
                setShowPaymentModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span>تعديل أرقام المحافظ</span>
            </button>
          </div>

          {/* Simple Display Cards */}
          <div className="space-y-3 text-xs">
            {/* 1. Vodafone Cash / Wallets - Primary and active (with 2 numbers) */}
            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">محافظ التحويل الإلكتروني المعتمدة (فودافون كاش / اتصالات / وي / أورانج):</span>
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                    مفعلة للاستلام
                  </span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  E-Wallets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block font-bold">رقم المحفظة الرئيسي (1):</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-base dir-ltr text-right inline-block">
                      {paymentConfig.vodafoneCashNumber || '01143888355'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">رئيسي</span>
                </div>

                <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block font-bold">رقم المحفظة الإضافي (2):</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-base dir-ltr text-right inline-block">
                      {paymentConfig.vodafoneCashNumber2 || '01556221141'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">إضافي</span>
                </div>
              </div>
            </div>

            {/* 2. InstaPay - Under Development (No fake data) */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between opacity-80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">شبكة المدفوعات اللحظية إنستاباي (InstaPay Egypt):</span>
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                    قيد التطوير والربط
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">جاري استكمال الربط المباشر مع المنظومة البنكية للمدفوعات اللحظية</p>
              </div>
              <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-500/30">
                InstaPay
              </span>
            </div>

            {/* 3. Fawry - Under Development (No fake data) */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between opacity-80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">خدمة الدفع عبر شبكة فوري (Fawry Merchant / FawryPay):</span>
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                    قيد التطوير والربط
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">جاري الربط البرمجي المباشر مع كود التاجر بشبكة فوري</p>
              </div>
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-500/30">
                فوري Fawry
              </span>
            </div>

            {/* 4. Credit & Debit Cards (Visa / Mastercard / Meeza) - Under Development */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between opacity-80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">بطاقات الدفع البنكية (Visa / MasterCard / Meeza):</span>
                  <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-500/30">
                    قيد الاعتماد المصرفي
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">بوابة الدفع الإلكتروني المباشر عبر البطاقات الائتمانية والبنكية قيد الإعداد</p>
              </div>
              <span className="bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-500/30">
                Visa / MasterCard
              </span>
            </div>

            {/* 5. Aman Payments - Under Development */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between opacity-80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">خدمات التحصيل عبر شبكة أمان (Aman Payments):</span>
                  <span className="bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-500/30">
                    قيد التجهيز
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">التحصيل والسداد عبر منافذ وفروع أمان في جميع المحافظات قريباً</p>
              </div>
              <span className="bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-orange-500/30">
                أمان Aman
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SHARED MODAL: Business Data View & Editing */}
      <BusinessEditModal
        business={editingBusiness}
        onClose={() => setEditingBusiness(null)}
        onSave={handleSaveBusinessFromModal}
        userRole="admin"
        canEdit={true}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onDeleteBusiness={onDeleteBusiness}
        businesses={businesses}
      />
      {/* MODAL 2: USER ACCOUNT CREATION / EDITING POP-UP */}
      {/* --------------------------------------------------------------------- */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveAccountModal}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-black text-base text-[var(--text-primary)]">
                {editingAccId ? 'تعديل بيانات وصلاحيات الحساب' : 'إضافة حساب مستخدم جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editingAccId && (
                (() => {
                  const editingRep = mergedAdminReps.find((r) => r.id === editingAccId);
                  const bizCount = editingRep ? businesses.filter((b) => b.repId === editingRep.id).length : 0;
                  const target = editingRep?.targetMonth || 20;

                  return (
                    <>
                      <div className="sm:col-span-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl grid grid-cols-3 gap-2 text-center text-xs font-bold my-1">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">الأنشطة المسجلة:</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-black">{bizCount} نشاط</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">المستهدف الشهري:</span>
                          <span className="text-[var(--text-primary)] font-black">{target} نشاط</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">نسبة الإنجاز:</span>
                          <span className="text-amber-600 dark:text-amber-400 font-black">
                            {target > 0 ? ((bizCount / target) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Avatar Image Review */}
                      <div className="sm:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {editingRep?.avatar ? (
                              <img
                                src={editingRep.avatar}
                                alt="الصورة الشخصية"
                                className="w-14 h-14 rounded-xl object-cover border border-[var(--border-color)] shadow-sm cursor-pointer hover:opacity-90 animate-pulse-subtle"
                                onClick={() => setPreviewAvatarRep(editingRep)}
                                title="اضغط للتكبير والمراجعة الكاملة"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center text-[10px] text-[var(--text-muted)] font-bold text-center">
                                لا توجد صورة
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-[var(--text-primary)] text-xs">الصورة الشخصية للملف</p>
                              <p className="text-[10px] text-[var(--text-muted)] font-medium">مراجعة واعتماد صورة المندوب الرسمية</p>
                            </div>
                          </div>

                          {editingRep?.avatar && (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border shadow-sm ${
                                editingRep.avatarStatus === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                                  : editingRep.avatarStatus === 'rejected'
                                  ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                              }`}>
                                {editingRep.avatarStatus === 'approved'
                                  ? 'مقبولة وموثقة'
                                  : editingRep.avatarStatus === 'rejected'
                                  ? 'مرفوضة'
                                  : 'قيد المراجعة'}
                              </span>
                              
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingRep) onUpdateRepresentative({ ...editingRep, avatarStatus: 'approved' });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                >
                                  ✓ قبول
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingRep) onUpdateRepresentative({ ...editingRep, avatarStatus: 'rejected' });
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                >
                                  ✕ رفض
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Documents Preview Section */}
                      <div className="sm:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-2xl space-y-2">
                        <label className="block text-[var(--text-primary)] font-extrabold text-[11px] mb-1">
                          📂 الأوراق الثبوتية والمستندات الرسمية للمندوب
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'field_letter', rep: editingRep });
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] py-2 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <FileText className="w-4 h-4 text-amber-500 animate-bounce-subtle" />
                            <span>تصريح الميدان</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'digital_badge', rep: editingRep });
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] py-2 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <UserCheck className="w-4 h-4 text-amber-500" />
                            <span>بطاقة المندوب</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'rep_contract', rep: editingRep });
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] py-2 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <FileSignature className="w-4 h-4 text-amber-500" />
                            <span>عقد الانضمام</span>
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()
              )}

              {/* Account Role */}
              <div className="sm:col-span-2">
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">
                  نوع وتصنيف الحساب والصلاحية *
                </label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as UserRole)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="rep">💼 مندوب مبيعات ميداني (تسجيل المحلات والتحصيل)</option>
                  <option value="supervisor">👑 مشرف إدارة منطقة ومحافظة</option>
                  <option value="accountant">🧾 محاسب ومحصل فواتير إلكترونية</option>
                  <option value="admin">🛡️ مدير النظام (أدمن بجميع الصلاحيات)</option>
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">الاسم الثلاثي *</label>
                <input
                  type="text"
                  required
                  placeholder="مصطفى علي محمود"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">رقم الهاتف للتواصل *</label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxx"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">البريد الإلكتروني للدخول</label>
                <input
                  type="email"
                  placeholder="user@daleelek.eg"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">كلمة المرور للدخول</label>
                <input
                  type="text"
                  placeholder="Aa123456"
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Governorate */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">المحافظة *</label>
                <select
                  value={modalGov}
                  onChange={(e) => setModalGov(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">حالة الحساب *</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as 'active' | 'suspended')}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-extrabold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="active">🟢 حساب نشط ومسموح له بالدخول</option>
                  <option value="suspended">🔴 حساب معطل وموقوف مؤقتاً</option>
                </select>
              </div>

              {/* Monthly Target */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">الهدف الشهري (عدد المحلات)</label>
                <input
                  type="number"
                  value={modalTarget}
                  onChange={(e) => setModalTarget(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">نسبة العمولة (%)</label>
                <input
                  type="number"
                  value={modalCommission}
                  onChange={(e) => setModalCommission(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-800 dark:text-emerald-400 font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-3 border-t border-[var(--border-color)]">
              <div>
                {editingAccId && onDeleteRepresentative && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف الحساب "${modalName}" نهائياً؟`)) {
                        onDeleteRepresentative(editingAccId);
                        setShowAccountModal(false);
                      }
                    }}
                    className="bg-rose-500/15 hover:bg-rose-600 text-rose-900 dark:text-rose-300 hover:text-white font-black px-4 py-2.5 rounded-xl border border-rose-500/40 flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الحساب نهائياً</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg cursor-pointer"
                >
                  {editingAccId ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: PAYMENT GATEWAY CONFIG DIALOG */}
      {/* --------------------------------------------------------------------- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdatePaymentConfig({
                vodafoneCashNumber: vodaNumber,
                vodafoneCashNumber2: vodaNumber2,
                fawryMerchantCode: '',
                instaPayHandle: '',
                cardGatewayActive: false,
              });
              setShowPaymentModal(false);
            }}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-[var(--text-primary)] my-auto transition-colors duration-300"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-black text-base text-[var(--text-primary)]">تعديل أرقام محافظ التحويل الإلكتروني</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">
                  رقم المحفظة الرئيسي (1) - فودافون كاش / محافظ:
                </label>
                <input
                  type="text"
                  required
                  value={vodaNumber}
                  onChange={(e) => setVodaNumber(e.target.value)}
                  placeholder="01143888355"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 text-sm dir-ltr text-right shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">
                  رقم المحفظة الإضافي (2) - فودافون كاش / محافظ:
                </label>
                <input
                  type="text"
                  required
                  value={vodaNumber2}
                  onChange={(e) => setVodaNumber2(e.target.value)}
                  placeholder="01556221141"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 text-sm dir-ltr text-right shadow-sm"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1 font-bold">
                <p>💡 باقي وسائل الدفع (فوري، إنستاباي، البطاقات البنكية، أمان):</p>
                <p className="font-normal opacity-90">مدرجة كأنظمة تحت التطوير وسيتم تفعيل إعداداتها وتعيين أكوادها فور انتهاء الربط البرمجي المباشر.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg cursor-pointer"
              >
                حفظ التغيرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 4: AVATAR PHOTO PREVIEW DIALOG */}
      {/* --------------------------------------------------------------------- */}
      {previewAvatarRep && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative text-[var(--text-primary)] my-auto transition-colors duration-300">
            <button
              onClick={() => setPreviewAvatarRep(null)}
              className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1 pt-1">
              <h3 className="font-black text-base text-[var(--text-primary)]">معاينة الصورة الشخصية المرفوعة</h3>
              <p className="text-xs text-amber-500 font-bold">
                {previewAvatarRep.name} • {previewAvatarRep.governorate}
              </p>
            </div>

            <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center space-y-3">
              {previewAvatarRep.avatar ? (
                <img
                  src={previewAvatarRep.avatar}
                  alt={previewAvatarRep.name}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-2xl border-2 border-amber-500 shadow-xl"
                />
              ) : (
                <div className="w-40 h-40 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 font-black text-4xl">
                  {previewAvatarRep.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateRepresentative) {
                    onUpdateRepresentative({ ...previewAvatarRep, avatarStatus: 'approved' });
                  }
                  setPreviewAvatarRep(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow cursor-pointer transition-transform active:scale-95"
              >
                ✔ قبول وتأكيد الصورة
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onUpdateRepresentative) {
                    onUpdateRepresentative({ ...previewAvatarRep, avatarStatus: 'rejected' });
                  }
                  setPreviewAvatarRep(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-3 rounded-xl shadow cursor-pointer transition-transform active:scale-95"
              >
                ✕ رفض الصورة
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 5: DOCUMENT VIEWER MODAL */}
      {selectedAdminDoc && (
        <DocViewerModal
          docType={selectedAdminDoc.type}
          rep={selectedAdminDoc.rep}
          onClose={() => setSelectedAdminDoc(null)}
        />
      )}
    </div>
  );
};
