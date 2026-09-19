import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  SupervisorDashboardProps,
  SupervisorSubView,
  useSupervisorMetrics,
  useSupervisorModals,
  SupervisorHubView,
  SupervisorRepsView,
  SupervisorTargetView,
  SupervisorBusinessesView,
  SupervisorFinanceView,
  SupervisorLeadsView,
  SupervisorMapView,
  SupervisorModals,
} from './supervisor';

export type { SupervisorDashboardProps };

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = (props) => {
  const {
    currentUser,
    businesses,
    representatives,
    payoutRequests = [],
    leads = [],
    onAddNewClick,
    onShowInvoice,
    onCollectPayment,
    onEditBusiness,
    onUpdateBusiness,
    onDeleteBusiness,
    onAddRepresentative,
    onUpdateRepresentative,
    onUpdatePayoutRequest,
    onUpdateLead,
    onDirectConvertLead,
    onSwitchToAdvancedAdmin,
    onLogout,
    onShowNotification,
  } = props;

  const [activeView, setActiveView] = useState<SupervisorSubView>('hub');
  const [selectedGov, setSelectedGov] = useState<string>(() => currentUser.repData?.governorate || 'القاهرة');
  const [searchQuery, setSearchQuery] = useState('');
  const [bizStatusFilter, setBizStatusFilter] = useState<'all' | 'pending' | 'verified' | 'unpaid'>('all');
  const [leadInterestFilter, setLeadInterestFilter] = useState<'all' | 'high' | 'medium' | 'trending_free'>('all');

  const modals = useSupervisorModals({ onShowNotification });

  const { scopedBusinesses, scopedReps, scopedLeads, scopedPayoutRequests, metrics, exportData } = useSupervisorMetrics({
    businesses,
    representatives,
    leads,
    payoutRequests,
    selectedGov,
  });

  const handleExport = () => {
    const ok = exportData();
    modals.showToast(ok ? `تم تصدير كشف محافظة ${selectedGov} بنجاح!` : 'حدث خطأ أثناء تصدير البيانات', ok ? 'success' : 'warning');
  };

  const navTo = (v: SupervisorSubView) => {
    setActiveView(v);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 pb-24 font-['Cairo',sans-serif] animate-fade-in max-w-5xl mx-auto px-2 sm:px-4">
      {modals.toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white text-xs font-black py-2.5 px-5 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{modals.toastMessage}</span>
        </div>
      )}

      {activeView === 'hub' && (
        <SupervisorHubView
          currentUser={currentUser}
          selectedGov={selectedGov}
          setSelectedGov={setSelectedGov}
          metrics={metrics}
          scopedLeadsCount={scopedLeads.length}
          onSwitchToAdvancedAdmin={onSwitchToAdvancedAdmin}
          onLogout={onLogout}
          onAddNewClick={onAddNewClick}
          onNavigate={navTo}
          onAddRepClick={() => modals.setIsAddRepOpen(true)}
          onExportData={handleExport}
          onFilterPendingBusinesses={() => { setBizStatusFilter('pending'); setActiveView('businesses'); }}
        />
      )}

      {activeView === 'reps' && (
        <SupervisorRepsView
          selectedGov={selectedGov}
          scopedReps={scopedReps}
          scopedBusinesses={scopedBusinesses}
          scopedPayoutRequests={scopedPayoutRequests}
          activeRepsCount={metrics.activeReps}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onBack={() => navTo('hub')}
          onAddRepClick={() => modals.setIsAddRepOpen(true)}
          onSelectDossierRep={modals.setSelectedDossierRep}
        />
      )}

      {activeView === 'target' && (
        <SupervisorTargetView
          selectedGov={selectedGov}
          scopedReps={scopedReps}
          scopedBusinesses={scopedBusinesses}
          metrics={metrics}
          onBack={() => navTo('hub')}
        />
      )}

      {activeView === 'businesses' && (
        <SupervisorBusinessesView
          selectedGov={selectedGov}
          scopedBusinesses={scopedBusinesses}
          metrics={metrics}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          bizStatusFilter={bizStatusFilter}
          setBizStatusFilter={setBizStatusFilter}
          onBack={() => navTo('hub')}
          onSelectDrawerBiz={modals.setSelectedDrawerBiz}
        />
      )}

      {activeView === 'finance' && (
        <SupervisorFinanceView
          selectedGov={selectedGov}
          scopedPayoutRequests={scopedPayoutRequests}
          metrics={metrics}
          onBack={() => navTo('hub')}
          onUpdatePayoutRequest={onUpdatePayoutRequest}
          onSelectReceiptPhoto={modals.setSelectedReceiptPhoto}
          onSetPayoutActionModalData={modals.setPayoutActionModalData}
        />
      )}

      {activeView === 'leads' && (
        <SupervisorLeadsView
          selectedGov={selectedGov}
          scopedLeads={scopedLeads}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          leadInterestFilter={leadInterestFilter}
          setLeadInterestFilter={setLeadInterestFilter}
          onBack={() => navTo('hub')}
          onSelectLeadForWhatsApp={modals.setSelectedLeadForWhatsApp}
          onDirectConvertLead={onDirectConvertLead}
        />
      )}

      {activeView === 'map' && (
        <SupervisorMapView
          selectedGov={selectedGov}
          scopedBusinesses={scopedBusinesses}
          onBack={() => navTo('hub')}
          onSelectDrawerBiz={modals.setSelectedDrawerBiz}
          onEditBusiness={onEditBusiness}
        />
      )}

      <SupervisorModals
        modals={modals}
        currentUser={currentUser}
        businesses={businesses}
        representatives={representatives}
        payoutRequests={payoutRequests}
        selectedGov={selectedGov}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onEditBusiness={onEditBusiness}
        onUpdateBusiness={onUpdateBusiness}
        onDeleteBusiness={onDeleteBusiness}
        onAddRepresentative={onAddRepresentative}
        onUpdateRepresentative={onUpdateRepresentative}
        onUpdatePayoutRequest={onUpdatePayoutRequest}
        onUpdateLead={onUpdateLead}
      />
    </div>
  );
};
