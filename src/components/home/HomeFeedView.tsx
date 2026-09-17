import React, { Suspense } from 'react';
import { User, Business, Representative, PayoutRequest } from '../../types';
import { PublicBusinessDirectory } from '../directory/PublicBusinessDirectory';
import { lazyWithRetry } from '../../utils/lazyWithRetry';

const RepDashboard = lazyWithRetry(() => import('../RepDashboard').then(m => ({ default: m.RepDashboard })));

interface HomeFeedViewProps {
  user: User | null;
  currentRep: Representative;
  businesses: Business[];
  scopedBusinesses: Business[];
  myBusinesses: Business[];
  representatives: Representative[];
  payoutRequests: PayoutRequest[];
  isLoadingData: boolean;
  hasInitialCloudSynced: boolean;
  repViewScope: 'my' | 'all';
  onToggleRepScope: (scope: 'my' | 'all') => void;
  onAddNewClick: () => void;
  onShowInvoice: (b: Business) => void;
  onEditBusiness: (b: Business) => void;
  onSelectVideoBiz: (b: Business) => void;
  onRequestPayout: (payout: PayoutRequest) => void;
  onNavigateToProfile: (subTab?: 'id_docs' | 'finance' | 'activities' | 'referral') => void;
  addNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  user,
  currentRep,
  businesses,
  scopedBusinesses,
  myBusinesses,
  representatives,
  payoutRequests,
  isLoadingData,
  hasInitialCloudSynced,
  repViewScope,
  onToggleRepScope,
  onAddNewClick,
  onShowInvoice,
  onEditBusiness,
  onSelectVideoBiz,
  onRequestPayout,
  onNavigateToProfile,
  addNotification,
}) => {
  return (
    <div className="space-y-5 pb-20 tab-content-enter">


      {/* Quick Rep Workspace summary if Rep logged in */}
      {user?.role === 'rep' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 rounded-xl border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
            </div>
          }
        >
          <RepDashboard
            rep={currentRep}
            businesses={myBusinesses}
            allReps={representatives}
            payoutRequests={payoutRequests}
            onAddNewClick={onAddNewClick}
            onShowInvoice={onShowInvoice}
            onRequestPayout={onRequestPayout}
            onNavigateToProfile={onNavigateToProfile}
          />
        </Suspense>
      )}

      {/* Modern Global Directory Container */}
      <PublicBusinessDirectory
        businesses={businesses}
        isLoadingData={isLoadingData}
        hasInitialCloudSynced={hasInitialCloudSynced}
        currentUser={user}
        scopedBusinesses={scopedBusinesses}
        repScope={repViewScope}
        myBusinessesCount={myBusinesses.length}
        onToggleRepScope={onToggleRepScope}
        onAddNewClick={onAddNewClick}
        onShowInvoice={onShowInvoice}
        onEditBusiness={onEditBusiness}
        onSelectVideoBiz={onSelectVideoBiz}
      />
    </div>
  );
};
