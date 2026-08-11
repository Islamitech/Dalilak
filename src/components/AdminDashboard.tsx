import React, { useState } from 'react';
import { Business, Representative, PaymentGatewayConfig, UserRole, VerificationStatus } from '../types';
import { EGYPT_GOVERNORATES } from '../data/mockData';
import { calculateTotalRepCommission, getPackageCommission } from '../utils/commission';
import { UserAvatar } from './UserAvatar';
import { ShieldCheck, TrendingUp, DollarSign, CheckCircle2, Clock, AlertCircle, Users, Plus, Edit, Trash2, Search, ExternalLink, Phone, FileText, Settings, CreditCard, UserCheck, UserX, Briefcase, Crown, Calculator, Key, Mail, Lock, Camera, Activity, Store } from 'lucide-react';

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
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'businesses' | 'reps' | 'gateways'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  // Accounts Management Tab State
  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');

  // Add / Edit Account Modal State
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);

  const [modalRole, setModalRole] = useState<UserRole>('rep');
  const [modalName, setModalName] = useState<string>('');
  const [modalEmail, setModalEmail] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalGov, setModalGov] = useState<string>('القاهرة');
  const [modalTarget, setModalTarget] = useState<number>(20);
  const [modalCommission, setModalCommission] = useState<number>(15);
  const [modalStatus, setModalStatus] = useState<'active' | 'suspended'>('active');
  const [modalPassword, setModalPassword] = useState<string>('Aa123456');

  // Edit Business Google Maps URL State
  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [editMapsUrl, setEditMapsUrl] = useState<string>('');

  // Preview Representative Avatar Modal State
  const [previewAvatarRep, setPreviewAvatarRep] = useState<Representative | null>(null);

  // Payment Config Form
  const [fawryCode, setFawryCode] = useState<string>(paymentConfig.fawryMerchantCode);
  const [vodaNumber, setVodaNumber] = useState<string>(paymentConfig.vodafoneCashNumber);
  const [instaHandle, setInstaHandle] = useState<string>(paymentConfig.instaPayHandle);

  // Financial Stats Calculation
  const totalRevenue = businesses.reduce((acc, b) => acc + b.amountPaid, 0);
  const totalDebt = businesses.reduce((acc, b) => acc + Math.max(0, b.packagePrice - b.amountPaid), 0);
  const verifiedCount = businesses.filter((b) => b.verificationStatus === 'verified').length;
  const inProgressCount = businesses.filter((b) => b.verificationStatus === 'in_progress').length;

  const filteredBusinesses = businesses.filter((b) => {
    if (searchQuery && !b.nameAr.includes(searchQuery) && !b.ownerName.includes(searchQuery) && !b.ownerPhone.includes(searchQuery)) {
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
  });

  // Combine all representatives from props & localStorage to ensure freshly registered accounts are ALWAYS visible to Admin
  const allAdminRepsMap = new Map<string, Representative>();
  representatives.forEach((r) => allAdminRepsMap.set(r.email.trim().toLowerCase(), r));
  const localRepsStr = localStorage.getItem('dalelak_representatives');
  if (localRepsStr) {
    try {
      const parsed = JSON.parse(localRepsStr);
      if (Array.isArray(parsed)) {
        parsed.forEach((pr: Representative) => {
          if (pr.email) allAdminRepsMap.set(pr.email.trim().toLowerCase(), pr);
        });
      }
    } catch (e) {}
  }
  const mergedAdminReps = Array.from(allAdminRepsMap.values());

  // Filter Accounts
  const filteredAccounts = mergedAdminReps.filter((acc) => {
    if (accountSearchQuery && !acc.name.includes(accountSearchQuery) && !acc.email.includes(accountSearchQuery) && !acc.phone.includes(accountSearchQuery)) {
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
  });

  const openAddAccountModal = () => {
    setEditingAccId(null);
    setModalRole('rep');
    setModalName('');
    setModalEmail('');
    setModalPhone('');
    setModalGov('القاهرة');
    setModalTarget(20);
    setModalCommission(15);
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
    setModalCommission(acc.commissionRate || 15);
    setModalStatus(acc.status || 'active');
    setModalPassword(acc.password || 'Aa123456');
    setShowAccountModal(true);
  };

  const handleSaveAccountModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName || !modalPhone) return;

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
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      });
    }

    setShowAccountModal(false);
  };

  const handleToggleAccountStatus = (acc: Representative) => {
    if (!onUpdateRepresentative) return;
    const newStatus = (acc.status || 'active') === 'active' ? 'suspended' : 'active';
    onUpdateRepresentative({ ...acc, status: newStatus });
  };

  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig({
      fawryMerchantCode: fawryCode,
      vodafoneCashNumber: vodaNumber,
      instaPayHandle: instaHandle,
      cardGatewayActive: true,
    });
    alert('تم حفظ إعدادات بوابات الدفع الإلكترونية في مصر بنجاح.');
  };

  const handleSaveMapsUrl = (biz: Business) => {
    onUpdateBusiness({
      ...biz,
      googleMapsUrl: editMapsUrl,
      verificationStatus: 'verified',
      notes: 'تم توثيق النشاط وبثه على خريطة جوجل بنجاح بواسطة مدير النظام.',
    });
    setEditingBizId(null);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Admin Title Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl shadow-md flex flex-wrap items-center justify-between gap-4 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--text-primary)]">لوحة تحكم مدير النظام</h2>
              <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                admin@gmail.com
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
              إدارة كاملة للمناديب والحسابات، الأنشطة المسجلة، الفواتير، وبوابات الدفع في جمهورية مصر العربية
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)] text-xs shadow-inner">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeAdminTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            الإحصائيات
          </button>
          <button
            onClick={() => setActiveAdminTab('businesses')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeAdminTab === 'businesses' ? 'bg-amber-500 text-slate-950 shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            الأنشطة ({businesses.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('reps')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all relative cursor-pointer ${
              activeAdminTab === 'reps' ? 'bg-amber-500 text-slate-950 shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>الحسابات ({mergedAdminReps.length})</span>
            {mergedAdminReps.some((r) => r.status === 'suspended') && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 left-1 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('gateways')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeAdminTab === 'gateways' ? 'bg-amber-500 text-slate-950 shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            بوابات الدفع
          </button>
        </div>
      </div>

      {/* Pending New Accounts Alert Banner */}
      {mergedAdminReps.some((r) => r.status === 'suspended') && (
        <div className="bg-amber-500/15 border-2 border-amber-500/50 p-4 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <UserCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-amber-300">
                🔔 يوجد ({mergedAdminReps.filter((r) => r.status === 'suspended').length}) حسابات جديدة معلقة في انتظار تفعيلك!
              </h3>
              <p className="text-[11px] text-slate-300">
                قام مستخدمون أو مناديب جدد بطلب إنشاء حساب، وتتطلب تفعيلهم لتخطي شاشة المعالجة والدخول للمنظومة.
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
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs border border-amber-500/30"
            >
              عرض وتصفية الحسابات
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>المبالغ المحصلة</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-500">{totalRevenue.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span></p>
          <p className="text-[10px] text-[var(--text-muted)]">إجمالي المدفوعات المستلمة</p>
        </div>

        {/* Total Debt */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>المبالغ المتبقية</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-500">{totalDebt.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span></p>
          <p className="text-[10px] text-[var(--text-muted)]">ديون تحصيل معلقة</p>
        </div>

        {/* Verified Businesses */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>أنشطة تم توثيقها</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-[var(--text-primary)]">{verifiedCount} <span className="text-xs text-[var(--text-muted)]">نشاط</span></p>
          <p className="text-[10px] text-emerald-500 font-bold">ظهرت رسمياً على الخريطة</p>
        </div>

        {/* In Progress */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-sm space-y-1 transition-colors duration-300">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold">
            <span>جاري التوثيق</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-500">{inProgressCount} <span className="text-xs text-[var(--text-secondary)]">نشاط</span></p>
          <p className="text-[10px] text-[var(--text-muted)]">قيد المراجعة الفنية</p>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Businesses Progress */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl space-y-3 shadow-md transition-colors duration-300">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>أحدث الأنشطة المسجلة في الميدان</span>
            </h3>

            <div className="space-y-2">
              {businesses.slice(0, 5).map((biz) => (
                <div key={biz.id} className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs transition-colors duration-300 shadow-sm hover:border-amber-500/30">
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)]">{biz.nameAr}</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">{biz.governorate} • المندوب: {biz.repName}</p>
                  </div>

                  <div className="text-left">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      biz.verificationStatus === 'verified'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}>
                      {biz.verificationStatus === 'verified' ? 'مفعل ومكتمل' : 'جاري المعالجة'}
                    </span>
                    <p className="text-xs font-bold text-amber-500 mt-0.5">{biz.packagePrice} ج.م</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Representatives Leaderboard */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl space-y-3 shadow-md transition-colors duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>أداء الحسابات في المحافظات</span>
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
              {representatives.map((rep) => {
                const repBiz = businesses.filter((b) => b.repId === rep.id);
                const repRevenue = repBiz.reduce((sum, b) => sum + b.amountPaid, 0);

                return (
                  <div key={rep.id} className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs transition-colors duration-300 shadow-sm hover:border-amber-500/30">
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
                        <p className="text-[10px] text-[var(--text-muted)]">{rep.governorate} • {rep.phone}</p>
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-amber-500">{repBiz.length} / {rep.targetMonth} نشاط</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{repRevenue.toLocaleString()} ج.م تحصيل</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time System Audit & Interaction Log for Admin */}
          <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-md transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <span>سجل التوثيقات والأنشطة التفاعلية الحية لجميع الحسابات والأنشطة</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>مزامنة مباشرة بقاعدة البيانات Cloud DB</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {businesses.map((biz, idx) => (
                <div key={`audit_${biz.id}_${idx}`} className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 shadow-sm hover:border-amber-500/30 transition-all">
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
                        تم بواسطة المندوب: <strong className="text-[var(--text-primary)]">{biz.repName}</strong> • {biz.governorate} ({biz.city})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-left">
                    <div>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black block">{biz.amountPaid} ج.م</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">{biz.createdDate || 'اليوم'}</span>
                    </div>
                    <button
                      onClick={() => onShowInvoice(biz)}
                      className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-3 py-1.5 rounded-xl text-[11px] cursor-pointer transition-colors shadow-sm"
                    >
                      معاينة الفاتورة
                    </button>
                  </div>
                </div>
              ))}

              {representatives.filter((r) => r.avatarStatus === 'pending_approval').map((rep) => (
                <div key={`audit_rep_${rep.id}`} className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>رفع صورة شخصية جديدة بواسطة المندوب: <strong>{rep.name}</strong> (تنتظر موافقتك واعتمادك)</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveAdminTab('reps');
                      setAccountStatusFilter('all');
                    }}
                    className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl text-[10px] cursor-pointer shadow"
                  >
                    معاينة وقبول الصورة
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESSES LIST & CONTROLS */}
      {activeAdminTab === 'businesses' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              <input
                type="text"
                placeholder="بحث باسم النشاط أو العميل أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <option key={g} value={g}>{g}</option>
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

          {/* Mobile Swipe Hint & Scrollable Table */}
          <p className="sm:hidden text-[10px] text-amber-600 dark:text-amber-400 font-extrabold mb-1 flex items-center gap-1">
            <span>👈 اسحب الجدول أفقياً لرؤية جميع بيانات المعاينة والتأكيد</span>
          </p>
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-xs text-right border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                  <th className="p-3 font-bold">النشاط التجاري</th>
                  <th className="p-3 font-bold">صاحب النشاط / الهاتف</th>
                  <th className="p-3 font-bold">المحافظة / المندوب</th>
                  <th className="p-3 font-bold">الباقة / الدفع</th>
                  <th className="p-3 font-bold">حالة خرائط جوجل</th>
                  <th className="p-3 font-bold text-center">التحكم والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredBusinesses.map((biz) => {
                  const remaining = Math.max(0, biz.packagePrice - biz.amountPaid);

                  return (
                    <tr key={biz.id} className="hover:bg-amber-500/5 border-b border-[var(--border-color)] transition-colors">
                      <td className="p-3">
                        <p className="font-extrabold text-[var(--text-primary)] text-sm">{biz.nameAr}</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-extrabold">{biz.category}</p>
                      </td>

                      <td className="p-3">
                        <p className="font-extrabold text-[var(--text-primary)]">{biz.ownerName}</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-mono font-bold dir-ltr text-right">{biz.ownerPhone}</p>
                      </td>

                      <td className="p-3">
                        <p className="font-extrabold text-[var(--text-primary)]">{biz.governorate}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-bold">{biz.repName}</p>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-[var(--text-primary)]">{biz.packageName}</p>
                        <p className="text-[11px]">
                          <span className="text-emerald-700 dark:text-emerald-400 font-black">{biz.amountPaid} ج.م</span>
                          {remaining > 0 && <span className="text-rose-700 dark:text-rose-400 font-bold"> (متبقي {remaining})</span>}
                        </p>
                      </td>

                      <td className="p-3">
                        <select
                          value={biz.verificationStatus}
                          onChange={(e) => onUpdateBusiness({ ...biz, verificationStatus: e.target.value as VerificationStatus })}
                          className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl border focus:outline-none shadow-sm ${
                            biz.verificationStatus === 'verified'
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                              : biz.verificationStatus === 'in_progress'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                          }`}
                        >
                          <option value="in_progress">جاري التوثيق والمراجعة</option>
                          <option value="verified">تم التوثيق والظهور على الخريطة</option>
                          <option value="pending">معلق</option>
                          <option value="rejected">مرفوض</option>
                        </select>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onShowInvoice(biz)}
                            title="عرض وتصدير الفاتورة"
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] px-2.5 py-1 rounded-xl border border-amber-500/30 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>الفاتورة</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingBizId(biz.id);
                              setEditMapsUrl(biz.googleMapsUrl || `https://maps.google.com/?q=${biz.lat},${biz.lng}`);
                            }}
                            title="ربط رابط خريطة جوجل"
                            className="bg-[var(--input-bg)] text-[var(--text-primary)] hover:bg-amber-500/10 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-[var(--border-color)] flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`هل أنت تأكد من حذف النشاط ${biz.nameAr}؟`)) {
                                onDeleteBusiness(biz.id);
                              }
                            }}
                            className="text-rose-600 hover:text-rose-700 p-1.5 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER ACCOUNTS MANAGER (إدارة وتخصيص الحسابات) */}
      {activeAdminTab === 'reps' && (
        <div className="space-y-4">
          {/* Explanation Banner & Roles Legend */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>إدارة وتخصيص حسابات المستخدمين والصلاحيات</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  التحكم الشامل بحسابات أدمن النظام، المناديب الميدانيين، المشرفين، والمحاسبين
                </p>
              </div>

              <button
                onClick={openAddAccountModal}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shrink-0 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة حساب جديد</span>
              </button>
            </div>

            {/* Role Explanation Legend Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-black">
                  <ShieldCheck className="w-4 h-4" />
                  <span>مدير النظام (Admin)</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold">
                  تحكم شامل بالبيانات، الإعدادات المالية، واعتمادات التوثيق.
                </p>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-black">
                  <Briefcase className="w-4 h-4" />
                  <span>مندوب ميداني (Rep)</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold">
                  تسجيل المحلات بالميدان، رفع GPS، وإصدار الفواتير المباشرة.
                </p>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-black">
                  <Crown className="w-4 h-4" />
                  <span>مشرف منطقة (Supervisor)</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold">
                  متابعة المناديب بالمحافظة وتحديد الأهداف والتارجد.
                </p>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-black">
                  <Calculator className="w-4 h-4" />
                  <span>محاسب (Accountant)</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold">
                  إدارة تحصيلات فوري، فودافون كاش، وانستاباي المالية.
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="بحث باسم الحساب، البريد، أو رقم الهاتف..."
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
                <option value="all">كل أنواع وتصنيفات الحسابات</option>
                <option value="rep">المناديب الميدانيين فقط</option>
                <option value="supervisor">مشرفي المناطق والمحافظات</option>
                <option value="accountant">المحاسبين والمحصلين</option>
                <option value="admin">مديري النظام والأدمن</option>
              </select>

              <select
                value={accountStatusFilter}
                onChange={(e) => setAccountStatusFilter(e.target.value)}
                className="bg-[var(--input-bg)] border border-amber-500/40 text-amber-700 dark:text-amber-300 font-extrabold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="all">كل حالات الحسابات ({mergedAdminReps.length})</option>
                <option value="suspended">🔔 معلقة بانتظار التفعيل ({mergedAdminReps.filter((r) => r.status === 'suspended').length})</option>
                <option value="active">✅ الحسابات النشطة والمفعلة ({mergedAdminReps.filter((r) => r.status === 'active' || !r.status).length})</option>
              </select>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAccounts.map((acc) => {
              const role = acc.role || 'rep';
              const isSuspended = acc.status === 'suspended';
              const bizCount = businesses.filter((b) => b.repId === acc.id).length;

              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-md ${
                    isSuspended
                      ? 'bg-amber-500/5 border-amber-500/40'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/30'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <UserAvatar
                            avatar={acc.avatar}
                            name={acc.name}
                            role={acc.role}
                            avatarStatus={acc.avatarStatus}
                            size="md"
                            isAdminPreview={true}
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-card)] z-10 ${
                              isSuspended ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            title={isSuspended ? 'حساب معلق' : 'حساب نشط'}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-[var(--text-primary)]">{acc.name}</h4>
                          </div>
                          <p className="text-xs text-amber-500 font-bold">{acc.governorate}</p>
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
                          {isSuspended ? 'معلق (بانتظار تفعيل المدير)' : 'نشط ومصرح'}
                        </span>
                      </div>
                    </div>

                    {/* Details Info */}
                    <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">البريد الإلكتروني:</span>
                        <span className="text-[var(--text-primary)] font-mono text-[11px] font-bold truncate block">{acc.email}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">رقم الهاتف:</span>
                        <span className="text-amber-800 dark:text-amber-400 font-mono font-black text-[11px] dir-ltr text-right block">{acc.phone}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">الهدف والعمولة:</span>
                        <span className="text-emerald-800 dark:text-emerald-400 font-black text-[11px]">
                          {bizCount} / {acc.targetMonth} (عمولة {calculateTotalRepCommission(businesses.filter((b) => b.repId === acc.id || b.repName === acc.name))} ج.م)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">كلمة المرور:</span>
                        <span className="text-[var(--text-primary)] font-mono text-[11px] font-black block">{acc.password || '••••••••'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo Review & Approval Bar */}
                  {acc.avatarStatus === 'pending_approval' && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-2">
                      <span className="text-amber-900 dark:text-amber-300 font-black flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span>صورة جديدة بانتظار موافقتك:</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewAvatarRep(acc)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-1 rounded-xl text-[11px] shadow cursor-pointer flex items-center gap-1"
                        >
                          <span>🔍 معاينة الصورة</span>
                        </button>
                        <button
                          onClick={() => {
                            if (onUpdateRepresentative) {
                              onUpdateRepresentative({ ...acc, avatarStatus: 'approved' });
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2.5 py-1 rounded-xl text-[11px] shadow cursor-pointer"
                        >
                          ✔ قبول
                        </button>
                        <button
                          onClick={() => {
                            if (onUpdateRepresentative) {
                              onUpdateRepresentative({ ...acc, avatarStatus: 'rejected' });
                            }
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-xl text-[11px] shadow cursor-pointer"
                        >
                          ✕ رفض
                        </button>
                      </div>
                    </div>
                  )}

                  {acc.avatarStatus === 'rejected' && (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-2xl flex items-center justify-between text-xs text-rose-900 dark:text-rose-300 font-bold">
                      <span>❌ تم رفض الصورة الشخصية (تم تنبيه المندوب)</span>
                      {acc.avatar && (
                        <button
                          onClick={() => setPreviewAvatarRep(acc)}
                          className="bg-rose-500/20 hover:bg-rose-500 text-rose-900 dark:text-rose-300 hover:text-white font-black px-2 py-0.5 rounded-lg text-[10px] cursor-pointer"
                        >
                          معاينة الصورة
                        </button>
                      )}
                    </div>
                  )}

                  {acc.avatarStatus === 'approved' && acc.avatar && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-400 font-bold">
                      <span>✅ الصورة الشخصية معتمدة ومقبولة رسمياً</span>
                      <button
                        onClick={() => setPreviewAvatarRep(acc)}
                        className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-900 dark:text-emerald-300 hover:text-white font-black px-2 py-0.5 rounded-lg text-[10px] cursor-pointer"
                      >
                        معاينة الصورة
                      </button>
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => openEditAccountModal(acc)}
                      className="flex-1 bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>تعديل الحساب</span>
                    </button>

                    <button
                      onClick={() => handleToggleAccountStatus(acc)}
                      className={`flex-1 font-black py-2 rounded-xl border flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer ${
                        isSuspended
                          ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                          : 'bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-500/40 hover:bg-rose-600 hover:text-white'
                      }`}
                    >
                      {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                      <span>{isSuspended ? 'تفعيل الحساب' : 'تعطيل الحساب'}</span>
                    </button>

                    {onDeleteRepresentative && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت تأكد من حذف الحساب "${acc.name}" نهائياً؟`)) {
                            onDeleteRepresentative(acc.id);
                          }
                        }}
                        className="bg-[var(--input-bg)] hover:bg-rose-600 text-[var(--text-muted)] hover:text-white p-2 rounded-xl border border-[var(--border-color)] transition-colors shadow-sm cursor-pointer"
                        title="حذف الحساب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: EGYPTIAN PAYMENT GATEWAYS CONFIG */}
      {activeAdminTab === 'gateways' && (
        <form onSubmit={handleSavePaymentConfig} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 space-y-4 shadow-md max-w-xl mx-auto transition-colors duration-300">
          <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-[var(--border-color)]">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-black text-base text-[var(--text-primary)]">إعدادات وسائل وبوابات الدفع الإلكترونية في مصر</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">كود التاجر في خدمة فوري (Fawry Merchant Code):</label>
              <input
                type="text"
                value={fawryCode}
                onChange={(e) => setFawryCode(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">رقم تحويل محفظة فودافون كاش (Vodafone Cash):</label>
              <input
                type="text"
                value={vodaNumber}
                onChange={(e) => setVodaNumber(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 text-sm dir-ltr text-right shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-extrabold mb-1">معرف انستاباي للتحويل المباشر (InstaPay Handle):</label>
              <input
                type="text"
                value={instaHandle}
                onChange={(e) => setInstaHandle(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 text-sm dir-ltr text-right shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer mt-2"
          >
            حفظ إعدادات بوابات الدفع
          </button>
        </form>
      )}

      {/* MODAL: ADD & EDIT USER ACCOUNT */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveAccountModal} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300">
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
              {/* Account Role */}
              <div className="sm:col-span-2">
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">نوع وتصنيف الحساب والصلاحية *</label>
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
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">الاسم الثلاثي / الاسم التجاري *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مصطفى علي محمود"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">رقم الهاتف للتواصل والواتساب *</label>
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
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">المحافظة / النطاق الجغرافي *</label>
                <select
                  value={modalGov}
                  onChange={(e) => setModalGov(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
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
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">الهدف الشهري (عدد الأنشطة)</label>
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

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
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
          </form>
        </div>
      )}

      {/* MODAL: EDIT GOOGLE MAPS LINK */}
      {editingBizId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">إدخال رابط توثيق الخريطة الرسمي</h3>

            <div>
              <label className="block text-slate-300 font-bold mb-1">رابط النشاط المفعل على خرائط جوجل:</label>
              <input
                type="url"
                value={editMapsUrl}
                onChange={(e) => setEditMapsUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBizId(null)}
                className="bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = businesses.find((b) => b.id === editingBizId);
                  if (target) handleSaveMapsUrl(target);
                }}
                className="bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl"
              >
                حفظ وتأكيد التوثيق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PHOTO PREVIEW & APPROVAL DIALOG FOR ADMIN */}
      {previewAvatarRep && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative text-[var(--text-primary)] my-auto transition-colors duration-300">
            <button
              onClick={() => setPreviewAvatarRep(null)}
              className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1 pt-1">
              <h3 className="font-black text-base text-[var(--text-primary)]">معاينة الصورة الشخصية المرفوعة</h3>
              <p className="text-xs text-amber-500 font-bold">{previewAvatarRep.name} • {previewAvatarRep.governorate}</p>
            </div>

            {/* Photo Preview Container */}
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

              <div className="text-center text-xs space-y-1">
                <p className="text-[var(--text-secondary)] font-bold">البريد: {previewAvatarRep.email}</p>
                <p className="text-[var(--text-muted)] font-mono">الهاتف: {previewAvatarRep.phone}</p>
                <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full border ${
                  previewAvatarRep.avatarStatus === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : previewAvatarRep.avatarStatus === 'rejected'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {previewAvatarRep.avatarStatus === 'approved'
                    ? '✅ الصورة معتمدة ومقبولة رسمياً'
                    : previewAvatarRep.avatarStatus === 'rejected'
                    ? '❌ الصورة تم رفضها مسبقاً'
                    : '🔒 الصورة بانتظار موافقتك واعتمادك'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
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
                ✕ رفض الصورة وإخفائها
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
