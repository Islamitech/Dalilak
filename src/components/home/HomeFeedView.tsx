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
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <span className="bg-slate-950/20 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              منظومة دليلك الميدانية الشاملة
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-1">المنصة الشاملة لإدارة وتوثيق الأنشطة والخدمات في مصر</h1>
            <p className="text-xs font-bold text-slate-900/90 mt-1 max-w-lg">
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
        onEditBusiness={(b) => {
          if (user?.role === 'rep') {
            const myId = (currentRep.id || user.id || '').toLowerCase().trim();
            const bRepId = (b.repId || '').toLowerCase().trim();
            if (myId && bRepId === myId) {
              onEditBusiness(b);
            } else {
              addNotification('⚠️ لا يمكن تعديل نشاط مسجل بواسطة مندوب آخر إلا من قِبل إدارة النظام.', 'warning');
            }
          } else {
            onEditBusiness(b);
          }
        }}
        onSelectVideoBiz={onSelectVideoBiz}
      />
    </div>
  );
};
