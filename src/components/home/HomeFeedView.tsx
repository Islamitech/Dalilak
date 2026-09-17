import React, { Suspense } from 'react';
import { PlusCircle } from 'lucide-react';
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
      {/* Field Banner (Only for non-rep or general view to avoid duplicate headers) */}
      {user?.role !== 'rep' && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="bg-slate-950/20 text-slate-950 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              منظومة دليلك الميدانية الشاملة
            </span>
            <h1 className="text-base sm:text-2xl font-black mt-1 leading-snug">المنصة الشاملة لإدارة وتوثيق الأنشطة والخدمات في مصر</h1>
            <p className="text-[11px] sm:text-xs font-bold text-slate-900/90 mt-0.5 sm:mt-1 max-w-lg line-clamp-2 sm:line-clamp-none">
              تسجيل مباشر لبيانات المحلات، إحداثيات GPS الدقيقة، وإصدار الفواتير الإلكترونية على واتساب صاحب النشاط في جميع محافظات مصر.
            </p>
          </div>

          <button
            onClick={onAddNewClick}
            className="hidden sm:flex bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs px-4 py-3 rounded-2xl shadow-lg items-center gap-2 transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <span>تسجيل نشاط جديد</span>
          </button>
        </div>
      )}

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
