import { useState, useMemo, useCallback, useRef, useEffect, Suspense } from 'react';
import { Business, Representative, InterestedLead } from './types';
import { calculateTotalRepCommission } from './utils/commission';
import { sortBusinessesNewestFirst } from './utils/dateFormatters';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { InteractiveMap } from './components/InteractiveMap';
import { InvoiceModal } from './components/InvoiceModal';
import { InvoicesLeadsHub } from './components/InvoicesLeadsHub';
import { LoginModal } from './components/LoginModal';
import { AboutUsModal } from './components/AboutUsModal';
import { TermsModal } from './components/TermsModal';
import { AppModals } from './components/modals/AppModals';
import { AppToastContainer } from './components/layout/AppToastContainer';
import { AppOfflineBanner } from './components/layout/AppOfflineBanner';
import { AppFooter } from './components/layout/AppFooter';
import { HomeFeedView } from './components/home/HomeFeedView';
import { useAuthSession } from './hooks/useAuthSession';
import { useAppRouting } from './hooks/useAppRouting';
import { useAppNotifications } from './hooks/useAppNotifications';
import { useOfflineSyncStatus } from './hooks/useOfflineSyncStatus';
import { useAppDataSync } from './hooks/useAppDataSync';
import { useAppEntityHandlers } from './hooks/useAppEntityHandlers';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { canUserAccessAdminPanel } from './utils/permissions';
import { isRepAccountDeleted } from './utils/accountStatus';
import { ShieldCheck } from 'lucide-react';

// ⚡ Code Splitting: تحميل المكونات الضخمة عند الحاجة فقط مع معالجة ذكية لتحديثات السيرفر
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const BusinessForm = lazyWithRetry(() => import('./components/BusinessForm').then(m => ({ default: m.BusinessForm })));
const RepProfile = lazyWithRetry(() => import('./components/RepProfile').then(m => ({ default: m.RepProfile })));

export default function App() {
  // 1. App Routing & Deep Linking
  const {
    activeTab,
    setActiveTab,
    profileInitialTab,
    handleNavigateToProfile,
    externalView,
    pendingReferralCode,
  } = useAppRouting();

  // 2. Modals & Local Selections
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedInvoiceBiz, setSelectedInvoiceBiz] = useState<Business | null>(null);
  const [selectedPayBiz, setSelectedPayBiz] = useState<Business | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [showPackagesModal, setShowPackagesModal] = useState<boolean>(false);
  const [showAdminProfileModal, setShowAdminProfileModal] = useState<boolean>(false);
  const [selectedVideoBiz, setSelectedVideoBiz] = useState<Business | null>(null);
  const [convertingLead, setConvertingLead] = useState<InterestedLead | null>(null);
  const [repViewScope, setRepViewScope] = useState<'my' | 'all'>('my');

  // Stable notification dispatcher ref for useAuthSession
  const notifyRef = useRef<(message: string, type?: 'success' | 'error' | 'info' | 'warning') => void>(() => {});
  const handleNotify = useCallback((message: string, type?: 'success' | 'error' | 'info' | 'warning') => {
    notifyRef.current(message, type);
  }, []);

  const setRepresentativesRef = useRef<React.Dispatch<React.SetStateAction<Representative[]>>>(() => {});
  const setBusinessesRef = useRef<React.Dispatch<React.SetStateAction<Business[]>>>(() => {});
  const setRepsCallback: React.Dispatch<React.SetStateAction<Representative[]>> = useCallback((action) => {
    setRepresentativesRef.current(action);
  }, []);
  const setBizCallback: React.Dispatch<React.SetStateAction<Business[]>> = useCallback((action) => {
    setBusinessesRef.current(action);
  }, []);

  // 3. User Authentication & Session Management
  const { user, setUser, userRef, handleLoginUser, handleLogout } = useAuthSession({
    onNotify: handleNotify,
    onLogoutCleanup: () => {
      setEditingBusiness(null);
      setSelectedInvoiceBiz(null);
      setSelectedPayBiz(null);
      setSelectedVideoBiz(null);
      setConvertingLead(null);
      setShowAdminProfileModal(false);
      setShowLoginModal(false);
      setShowPackagesModal(false);
      setShowPermissionsModal(false);
    },
    setActiveTab,
    setRepresentatives: setRepsCallback,
    setBusinesses: setBizCallback,
  });

  // 4. App Data State & Cloud Sync
  const {
    businesses,
    setBusinesses,
    representatives,
    setRepresentatives,
    payoutRequests,
    setPayoutRequests,
    leads,
    setLeads,
    deletedBusinesses,
    setDeletedBusinesses,
    deletedRepresentatives,
    setDeletedRepresentatives,
    paymentConfig,
    setPaymentConfig,
    isLoadingData,
    hasInitialCloudSynced,
    showSyncBadge,
  } = useAppDataSync({
    user,
    setUser,
    userRef,
    addNotification: handleNotify,
  });

  setRepresentativesRef.current = setRepresentatives;
  setBusinessesRef.current = setBusinesses;

  // 5. App Notifications (Toasts & Bell System Notifications)
  const {
    notifications,
    setNotifications,
    addNotification,
    setSystemNotifications,
    addSystemNotification,
    handleMarkAllNotificationsAsRead,
    handleMarkNotificationAsRead,
    handleClearNotifications,
    selectedAdminDossierRep,
    setSelectedAdminDossierRep,
    handleNotificationNavigate,
    allNotifications,
  } = useAppNotifications({
    user,
    representatives,
    businesses,
    setActiveTab,
    setEditingBusiness,
    setSelectedInvoiceBiz,
  });

  // Connect notifyRef to addNotification
  notifyRef.current = addNotification;

  // 6. Offline-First Sync Status
  const {
    offlineSyncStatus,
    showOfflineSyncModal,
    setShowOfflineSyncModal,
  } = useOfflineSyncStatus({
    user,
    setLeads,
    setBusinesses,
  });

  // 🛡️ CRITICAL GUARD: Immediately log out and terminate session if active user was deleted
  useEffect(() => {
    if (user && isRepAccountDeleted(user)) {
      handleLogout();
      addNotification('⛔ تم إنهاء الجلسة وإغلاق الحساب لأنه تم حذفه من قِبل إدارة المنظومة.', 'error');
    }
  }, [user, handleLogout, addNotification]);

  // Derived current representative
  const liveRep = user
    ? representatives.find((r) => r.id === user.id || (user.email && r.email && r.email.toLowerCase() === user.email.toLowerCase()))
    : null;

  const currentRep: Representative = useMemo(() => ({
    id: user?.repData?.id || liveRep?.id || user?.id || 'rep_1',
    name: user?.repData?.name || liveRep?.name || user?.name || 'مندوب معتمد',
    email: user?.repData?.email || liveRep?.email || user?.email || '',
    phone: user?.repData?.phone || liveRep?.phone || user?.phone || '',
    nationalId: user?.repData?.nationalId || liveRep?.nationalId || '',
    role: user?.repData?.role || liveRep?.role || user?.role || 'rep',
    roleTitle: user?.repData?.roleTitle || liveRep?.roleTitle || (user?.role === 'admin' ? 'مدير النظام' : 'مندوب مبيعات ميداني'),
    governorate: user?.repData?.governorate || liveRep?.governorate || 'القاهرة',
    targetMonth: user?.repData?.targetMonth || liveRep?.targetMonth || 25,
    avatar: user?.repData?.avatar || liveRep?.avatar || user?.avatar || '',
    avatarStatus: user?.repData?.avatarStatus || liveRep?.avatarStatus || user?.avatarStatus || 'none',
    commissionRate: user?.repData?.commissionRate || liveRep?.commissionRate || (user?.role === 'admin' ? 0 : 42.86),
    status: user?.repData?.status || liveRep?.status || 'active',
    referralCode: user?.repData?.referralCode || liveRep?.referralCode || undefined,
    referredByCode: user?.repData?.referredByCode || liveRep?.referredByCode || undefined,
    referralUnlocked: user?.repData?.referralUnlocked ?? liveRep?.referralUnlocked ?? false,
    adminBypassReferral: user?.repData?.adminBypassReferral ?? liveRep?.adminBypassReferral ?? false,
  }), [user, liveRep]);

  // 7. App Entity CRUD Handlers
  const {
    handleAddBusiness,
    handleUpdateBusiness,
    handleDeleteBusiness,
    handleRestoreBusiness,
    handleHardDeleteBusiness,
    handleCreatePayoutRequest,
    handleUpdatePayoutRequest,
    handleDeletePayoutRequest,
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
    handleConvertToBusiness,
    handleDirectConvertLeadToBusiness,
    handleUpdateUserProfile,
    handleAddRepresentative,
    handleUpdateRepresentative,
    handleRestoreRepresentative,
    handleHardDeleteRepresentative,
    handleDeleteRepresentative,
    handleUpdatePaymentConfig,
  } = useAppEntityHandlers({
    user,
    setUser,
    currentRep,
    businesses,
    setBusinesses,
    representatives,
    setRepresentatives,
    payoutRequests,
    setPayoutRequests,
    leads,
    setLeads,
    deletedBusinesses,
    setDeletedBusinesses,
    deletedRepresentatives,
    setDeletedRepresentatives,
    paymentConfig,
    setPaymentConfig,
    editingBusiness,
    setEditingBusiness,
    selectedInvoiceBiz,
    setSelectedInvoiceBiz,
    selectedPayBiz,
    setSelectedPayBiz,
    convertingLead,
    setConvertingLead,
    setSystemNotifications,
    setActiveTab,
    addNotification,
    addSystemNotification,
    handleLogout,
  });

  // Business filtering & scoping
  const isManagerialUser = ['admin', 'supervisor', 'accountant'].includes(user?.role || '');

  const myBusinesses = useMemo(() => {
    if (user?.role === 'rep') {
      const myId = (currentRep.id || user.id || '').toLowerCase().trim();
      const myName = (currentRep.name || user.name || '').toLowerCase().trim();
      return businesses.filter((b) => {
        const bRepId = (b.repId || '').toLowerCase().trim();
        const bRepName = (b.repName || '').toLowerCase().trim();
        return (myId && bRepId === myId) || (myName && bRepName === myName);
      });
    }
    return businesses;
  }, [businesses, user, currentRep]);

  const visibleBusinesses = useMemo(() => {
    if (user?.role === 'rep') {
      return repViewScope === 'all' ? businesses : myBusinesses;
    }
    return businesses;
  }, [user, repViewScope, businesses, myBusinesses]);

  const scopedBusinesses = useMemo(() => {
    if (isManagerialUser) return sortBusinessesNewestFirst(businesses);
    if (user?.role === 'rep') return sortBusinessesNewestFirst(visibleBusinesses);
    return sortBusinessesNewestFirst(businesses);
  }, [isManagerialUser, user?.role, visibleBusinesses, businesses]);

  // -------------------------------------------------------------
  // EXTERNAL READ-ONLY VIEWS (For QR Codes)
  // -------------------------------------------------------------
  if (externalView?.type === 'invoice') {
    const biz = businesses.find(b => b.id === externalView.id || b.invoiceNumber === externalView.id);
    if (isLoadingData) return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-[3px] border-amber-500/20 border-t-amber-500 animate-spin" style={{ animation: 'spinGlow 1s linear infinite' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-500 font-black text-lg">د</span>
          </div>
        </div>
        <p className="text-sm font-bold text-[var(--text-muted)]" style={{ animation: 'breathe 2s ease-in-out infinite' }}>جاري تحميل الفاتورة...</p>
      </div>
    );
    if (!biz) return <div className="min-h-screen flex items-center justify-center font-bold text-rose-500">هذه الفاتورة غير موجودة أو تم حذفها.</div>;

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <InvoiceModal business={biz} onClose={() => {}} isExternalView={true} />
      </div>
    );
  }

  if (externalView?.type === 'rep') {
    const rep = representatives.find(r => r.id === externalView.id);
    if (isLoadingData) return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-[3px] border-amber-500/20 border-t-amber-500" style={{ animation: 'spinGlow 1s linear infinite' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-500 font-black text-lg">د</span>
          </div>
        </div>
        <p className="text-sm font-bold text-[var(--text-muted)]" style={{ animation: 'breathe 2s ease-in-out infinite' }}>جاري تحميل البطاقة...</p>
      </div>
    );
    if (!rep) return <div className="min-h-screen flex items-center justify-center font-bold text-rose-500">هذا المندوب غير مسجل في النظام.</div>;

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Suspense fallback={
          <div className="min-h-screen flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl border-[3px] border-amber-500/20 border-t-amber-500 animate-spin" style={{ animation: 'spinGlow 1s linear infinite' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-amber-500 font-black text-lg">د</span>
              </div>
            </div>
            <p className="text-sm font-bold text-[var(--text-muted)]" style={{ animation: 'breathe 2s ease-in-out infinite' }}>جاري تحميل البطاقة...</p>
          </div>
        }>
          <RepProfile 
            user={null as any} 
            rep={rep} 
            businessesCount={0} 
            totalRevenue={0} 
            totalCommission={0} 
            allReps={representatives}
            allBusinesses={businesses}
            onLogout={() => {}} 
            onUpdateRep={() => {}} 
            isExternalView={true} 
          />
        </Suspense>
      </div>
    );
  }

  // Strict Unauthenticated Protection: If user is not logged in, render ONLY the Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-['Cairo',sans-serif] transition-colors duration-300">
        <div className="flex-1 flex items-center justify-center p-4">
          <LoginModal
            isInline={true}
            onClose={() => {}}
            onOpenAbout={() => setShowAboutModal(true)}
            onOpenTerms={() => setShowTermsModal(true)}
            onLoginSuccess={handleLoginUser}
            representatives={representatives}
            onAddRepresentative={handleAddRepresentative}
            initialReferralCode={pendingReferralCode}
          />
        </div>

        {/* Informational Modals for Unauthenticated Visitors */}
        {showAboutModal && (
          <AboutUsModal
            onClose={() => setShowAboutModal(false)}
            onOpenTerms={() => {
              setShowAboutModal(false);
              setShowTermsModal(true);
            }}
          />
        )}

        {showTermsModal && (
          <TermsModal
            onClose={() => setShowTermsModal(false)}
            onOpenAbout={() => {
              setShowTermsModal(false);
              setShowAboutModal(true);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-safe bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo'] transition-colors duration-300 selection:bg-amber-500/30`}>
      {/* ===================== PROFESSIONAL TOAST NOTIFICATIONS & LIVE SYNC BADGE ===================== */}
      <AppToastContainer
        notifications={notifications}
        setNotifications={setNotifications}
        showSyncBadge={showSyncBadge}
      />

      {/* =========================================================================== */}
      {/* Top App Bar - Fixed */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={canUserAccessAdminPanel(user)}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onOpenProfile={() => {
          setActiveTab('profile');
        }}
        systemNotifications={allNotifications}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearNotifications={handleClearNotifications}
        onNavigateTab={handleNotificationNavigate}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenTerms={() => setShowTermsModal(true)}
        onOpenPermissions={() => setShowPermissionsModal(true)}
        onOpenPackages={() => setShowPackagesModal(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl p-3 sm:p-5 pb-28 sm:pb-12">
        {/* 🛰️ Live Offline & Sync Status Banner */}
        <AppOfflineBanner
          offlineSyncStatus={offlineSyncStatus}
          onOpenSyncModal={() => setShowOfflineSyncModal(true)}
        />

        {/* TAB 1: HOME FEED */}
        {activeTab === 'home' && (
          <HomeFeedView
            user={user}
            currentRep={currentRep}
            businesses={businesses}
            scopedBusinesses={scopedBusinesses}
            myBusinesses={myBusinesses}
            representatives={representatives}
            payoutRequests={payoutRequests}
            isLoadingData={isLoadingData}
            hasInitialCloudSynced={hasInitialCloudSynced}
            repViewScope={repViewScope}
            onToggleRepScope={setRepViewScope}
            onAddNewClick={() => setActiveTab('add')}
            onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
            onEditBusiness={(b) => setEditingBusiness(b)}
            onSelectVideoBiz={(b) => setSelectedVideoBiz(b)}
            onRequestPayout={handleCreatePayoutRequest}
            onNavigateToProfile={handleNavigateToProfile}
            addNotification={addNotification}
          />
        )}

        {/* TAB 2: INTERACTIVE MAP OVERVIEW */}
        {activeTab === 'map' && (
          <div className="space-y-4 pb-20 tab-content-enter">
            <InteractiveMap
              mode="view"
              businesses={scopedBusinesses}
              onSelectBusiness={(b) => setSelectedInvoiceBiz(b)}
              onEditBusiness={(b) => {
                if (user?.role === 'rep') {
                  const myId = (currentRep.id || user.id || '').toLowerCase().trim();
                  const myName = (currentRep.name || user.name || '').toLowerCase().trim();
                  const bRepId = (b.repId || '').toLowerCase().trim();
                  const bRepName = (b.repName || '').toLowerCase().trim();
                  if ((myId && bRepId === myId) || (myName && bRepName === myName)) {
                    setEditingBusiness(b);
                  }
                } else {
                  setEditingBusiness(b);
                }
              }}
              heightClass="h-[520px]"
            />
          </div>
        )}

        {/* TAB 3: REGISTER NEW BUSINESS FORM */}
        {activeTab === 'add' && (
          <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-xl border-2 border-amber-500/30 border-t-amber-500 animate-spin" /></div>}>
            <BusinessForm
              currentUser={user}
              onSubmitBusiness={(newBiz) => {
                handleAddBusiness(newBiz);
                if (convertingLead) {
                  handleUpdateLead({ ...convertingLead, status: 'converted' });
                  setConvertingLead(null);
                }
              }}
              currentRep={currentRep}
              onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
              businesses={businesses}
              onSaveLead={handleCreateLead}
              initialLead={convertingLead}
              onOpenPackages={() => setShowPackagesModal(true)}
            />
          </Suspense>
        )}

        {/* TAB 4: REVIEWS & INTERESTED LEADS HUB */}
        {activeTab === 'invoices' && (
          <InvoicesLeadsHub
            leads={leads}
            currentUser={user}
            currentRep={currentRep}
            onCreateLead={handleCreateLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onConvertToBusiness={handleConvertToBusiness}
            onDirectConvertLead={handleDirectConvertLeadToBusiness}
          />
        )}

        {/* TAB 5 (ADMIN DASHBOARD / REP PROFILE) */}
        {activeTab === 'admin' && canUserAccessAdminPanel(user) && (
          <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-xl border-2 border-amber-500/30 border-t-amber-500 animate-spin" /></div>}>
            <AdminDashboard
              currentUser={user}
              businesses={businesses}
              representatives={representatives}
              paymentConfig={paymentConfig}
              payoutRequests={payoutRequests}
              leads={leads}
              deletedBusinesses={deletedBusinesses}
              deletedRepresentatives={deletedRepresentatives}
              initialDossierRep={selectedAdminDossierRep}
              onClearInitialDossierRep={() => setSelectedAdminDossierRep(null)}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onConvertToBusiness={handleConvertToBusiness}
              onDirectConvertLead={handleDirectConvertLeadToBusiness}
              onUpdateBusiness={handleUpdateBusiness}
              onDeleteBusiness={handleDeleteBusiness}
              onRestoreBusiness={handleRestoreBusiness}
              onHardDeleteBusiness={handleHardDeleteBusiness}
              onAddRepresentative={handleAddRepresentative}
              onUpdateRepresentative={handleUpdateRepresentative}
              onDeleteRepresentative={handleDeleteRepresentative}
              onRestoreRepresentative={handleRestoreRepresentative}
              onHardDeleteRepresentative={handleHardDeleteRepresentative}
              onUpdatePaymentConfig={handleUpdatePaymentConfig}
              onUpdatePayoutRequest={handleUpdatePayoutRequest}
              onDeletePayoutRequest={handleDeletePayoutRequest}
              onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
              onCollectPayment={(b) => setSelectedPayBiz(b)}
            />
          </Suspense>
        )}

        {(activeTab === 'profile' || (activeTab === 'admin' && !canUserAccessAdminPanel(user))) && (
          user ? (
            <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-xl border-2 border-amber-500/30 border-t-amber-500 animate-spin" /></div>}>
              <RepProfile
                user={user}
                rep={currentRep}
                businessesCount={businesses.filter(b => b.repId === currentRep.id).length}
                totalRevenue={businesses.filter(b => b.repId === currentRep.id).reduce((acc, b) => acc + (b.amountPaid || 0), 0)}
                totalCommission={calculateTotalRepCommission(businesses.filter(b => b.repId === currentRep.id), currentRep.commissionRate)}
                allReps={representatives}
                allBusinesses={businesses}
                payoutRequests={payoutRequests}
                initialTab={profileInitialTab}
                onLogout={handleLogout}
                onUpdateRep={handleUpdateRepresentative}
                onRequestPayout={handleCreatePayoutRequest}
                onNavigateHome={() => setActiveTab('home')}
                onNavigateAdmin={() => setActiveTab('admin')}
              />
            </Suspense>
          ) : (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-4 max-w-md mx-auto shadow-md transition-colors duration-300">
              <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-black text-lg text-[var(--text-primary)]">تسجيل الدخول للحساب</h3>
              <p className="text-xs text-[var(--text-secondary)] px-6 leading-relaxed font-bold">
                برجاء تسجيل الدخول للوصول إلى لوحة التحكم وملفك الشخصي وتوثيقات الميدان.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                تسجيل الدخول الآن
              </button>
            </div>
          )
        )}

        {/* Global Professional Footer */}
        <AppFooter
          user={user}
          onOpenAbout={() => setShowAboutModal(true)}
          onOpenTerms={() => setShowTermsModal(true)}
          onOpenPermissions={() => setShowPermissionsModal(true)}
          onOpenPackages={() => setShowPackagesModal(true)}
          onNavigateTab={setActiveTab}
        />
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={canUserAccessAdminPanel(user)}
      />

      {/* All Application Modals Encapsulated */}
      <AppModals
        user={user}
        showAboutModal={showAboutModal}
        setShowAboutModal={setShowAboutModal}
        showTermsModal={showTermsModal}
        setShowTermsModal={setShowTermsModal}
        showPermissionsModal={showPermissionsModal}
        setShowPermissionsModal={setShowPermissionsModal}
        showPackagesModal={showPackagesModal}
        setShowPackagesModal={setShowPackagesModal}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        showAdminProfileModal={showAdminProfileModal}
        setShowAdminProfileModal={setShowAdminProfileModal}
        showOfflineSyncModal={showOfflineSyncModal}
        setShowOfflineSyncModal={setShowOfflineSyncModal}
        editingBusiness={editingBusiness}
        setEditingBusiness={setEditingBusiness}
        selectedInvoiceBiz={selectedInvoiceBiz}
        setSelectedInvoiceBiz={setSelectedInvoiceBiz}
        selectedPayBiz={selectedPayBiz}
        setSelectedPayBiz={setSelectedPayBiz}
        selectedVideoBiz={selectedVideoBiz}
        setSelectedVideoBiz={setSelectedVideoBiz}
        businesses={businesses}
        setBusinesses={setBusinesses}
        representatives={representatives}
        paymentConfig={paymentConfig}
        onUpdateBusiness={handleUpdateBusiness}
        onDeleteBusiness={handleDeleteBusiness}
        onLoginUser={handleLoginUser}
        onAddRepresentative={handleAddRepresentative}
        onUpdateUserProfile={handleUpdateUserProfile}
      />
    </div>
  );
}
