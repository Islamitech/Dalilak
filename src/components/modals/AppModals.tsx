import React, { Suspense, lazy } from 'react';
import { User, Business, Representative, PaymentGatewayConfig } from '../../types';
import { InvoiceModal } from '../InvoiceModal';
import { LoginModal } from '../LoginModal';
import { AboutUsModal } from '../AboutUsModal';
import { TermsModal } from '../TermsModal';
import { PermissionsModal } from '../PermissionsModal';
import { PackagesModal } from '../PackagesModal';
import { OfflineSyncModal } from '../OfflineSyncModal';
import { canUserEditBusiness, canUserDeleteBusiness } from '../../utils/permissions';
import { fetchBusinessesFromDb } from '../../services/db';
import { lazyWithRetry } from '../../utils/lazyWithRetry';

const BusinessEditModal = lazyWithRetry(() => import('../BusinessEditModal').then((m) => ({ default: m.BusinessEditModal })));
const PaymentGatewayModal = lazyWithRetry(() => import('../PaymentGatewayModal').then((m) => ({ default: m.PaymentGatewayModal })));
const AdminProfileModal = lazyWithRetry(() => import('../AdminProfileModal').then((m) => ({ default: m.AdminProfileModal })));
const VideoPlayerModal = lazyWithRetry(() => import('../VideoPlayerModal').then((m) => ({ default: m.VideoPlayerModal })));

interface AppModalsProps {
  user: User | null;
  showAboutModal: boolean;
  setShowAboutModal: (show: boolean) => void;
  showTermsModal: boolean;
  setShowTermsModal: (show: boolean) => void;
  showPermissionsModal: boolean;
  setShowPermissionsModal: (show: boolean) => void;
  showPackagesModal: boolean;
  setShowPackagesModal: (show: boolean) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showAdminProfileModal: boolean;
  setShowAdminProfileModal: (show: boolean) => void;
  showOfflineSyncModal: boolean;
  setShowOfflineSyncModal: (show: boolean) => void;

  editingBusiness: Business | null;
  setEditingBusiness: (b: Business | null) => void;
  selectedInvoiceBiz: Business | null;
  setSelectedInvoiceBiz: (b: Business | null) => void;
  selectedPayBiz: Business | null;
  setSelectedPayBiz: (b: Business | null) => void;
  selectedVideoBiz: Business | null;
  setSelectedVideoBiz: (b: Business | null) => void;

  businesses: Business[];
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  representatives: Representative[];
  paymentConfig: PaymentGatewayConfig;

  onUpdateBusiness: (biz: Business) => Promise<void>;
  onDeleteBusiness: (id: string) => Promise<void>;
  onLoginUser: (u: User) => void;
  onAddRepresentative: (rep: Partial<Representative>) => Promise<void>;
  onUpdateUserProfile: (data: any) => Promise<void>;
}

export const AppModals: React.FC<AppModalsProps> = ({
  user,
  showAboutModal,
  setShowAboutModal,
  showTermsModal,
  setShowTermsModal,
  showPermissionsModal,
  setShowPermissionsModal,
  showPackagesModal,
  setShowPackagesModal,
  showLoginModal,
  setShowLoginModal,
  showAdminProfileModal,
  setShowAdminProfileModal,
  showOfflineSyncModal,
  setShowOfflineSyncModal,
  editingBusiness,
  setEditingBusiness,
  selectedInvoiceBiz,
  setSelectedInvoiceBiz,
  selectedPayBiz,
  setSelectedPayBiz,
  selectedVideoBiz,
  setSelectedVideoBiz,
  businesses,
  setBusinesses,
  representatives,
  paymentConfig,
  onUpdateBusiness,
  onDeleteBusiness,
  onLoginUser,
  onAddRepresentative,
  onUpdateUserProfile,
}) => {
  return (
    <>
      {/* MODAL: ABOUT US */}
      {showAboutModal && (
        <AboutUsModal
          onClose={() => setShowAboutModal(false)}
          onOpenTerms={() => {
            setShowAboutModal(false);
            setShowTermsModal(true);
          }}
        />
      )}

      {/* MODAL: TERMS OF SERVICE */}
      {showTermsModal && (
        <TermsModal
          onClose={() => setShowTermsModal(false)}
          onOpenAbout={() => {
            setShowTermsModal(false);
            setShowAboutModal(true);
          }}
        />
      )}

      {/* MODAL: PERMISSIONS & ROLES MATRIX */}
      {showPermissionsModal && (
        <PermissionsModal onClose={() => setShowPermissionsModal(false)} />
      )}

      {/* MODAL: PACKAGES & OFFERS GUIDE */}
      {showPackagesModal && (
        <PackagesModal onClose={() => setShowPackagesModal(false)} />
      )}

      {/* MODAL: FULL BUSINESS DATA VIEW & EDITING */}
      {editingBusiness && user && (
        <Suspense fallback={null}>
          <BusinessEditModal
            business={editingBusiness}
            onClose={() => setEditingBusiness(null)}
            onSave={(updatedBiz) => {
              onUpdateBusiness(updatedBiz);
              setEditingBusiness(updatedBiz);
            }}
            userRole={user?.role}
            currentRoleTitle={user?.repData?.roleTitle || user?.roleTitle}
            currentUserName={user?.name}
            currentUserId={user?.id}
            canEdit={canUserEditBusiness(user, editingBusiness)}
            onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
            onCollectPayment={
              user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'accountant'
                ? (b) => setSelectedPayBiz(b)
                : undefined
            }
            businesses={businesses}
            onDeleteBusiness={
              canUserDeleteBusiness(user, editingBusiness) ? onDeleteBusiness : undefined
            }
          />
        </Suspense>
      )}

      {/* MODAL: INVOICE VIEWER & WHATSAPP DISPATCH */}
      {selectedInvoiceBiz && user && (
        <InvoiceModal
          business={selectedInvoiceBiz}
          onClose={() => setSelectedInvoiceBiz(null)}
          onUpdateBusiness={onUpdateBusiness}
          onCollectPayment={
            user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'accountant'
              ? (b) => setSelectedPayBiz(b)
              : undefined
          }
          userRole={user?.role}
          isAdmin={user?.role === 'admin' || user?.role === 'supervisor'}
        />
      )}

      {/* MODAL: PAYMENT GATEWAY */}
      {selectedPayBiz && user && (
        <Suspense fallback={null}>
          <PaymentGatewayModal
            business={selectedPayBiz}
            config={paymentConfig}
            onClose={() => setSelectedPayBiz(null)}
            onPaymentSuccess={(newPaid, method = 'gateway_online') => {
              if (selectedPayBiz && (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'accountant')) {
                const status = newPaid >= (selectedPayBiz.packagePrice || 250) ? 'fully_paid' : 'partially_paid';
                const updatedBiz: Business = {
                  ...selectedPayBiz,
                  amountPaid: newPaid,
                  paymentStatus: status,
                  paymentMethod: method,
                  cashCollectedByRep: method === 'cash_by_rep' ? newPaid : 0,
                };
                onUpdateBusiness(updatedBiz);

                if (editingBusiness && editingBusiness.id === updatedBiz.id) {
                  setEditingBusiness(updatedBiz);
                }
                if (selectedInvoiceBiz && selectedInvoiceBiz.id === updatedBiz.id) {
                  setSelectedInvoiceBiz(updatedBiz);
                }
              }
            }}
          />
        </Suspense>
      )}

      {/* MODAL: LOGIN DIALOG */}
      {showLoginModal && user && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onOpenAbout={() => setShowAboutModal(true)}
          onOpenTerms={() => setShowTermsModal(true)}
          onLoginSuccess={onLoginUser}
          representatives={representatives}
          onAddRepresentative={onAddRepresentative}
        />
      )}

      {/* MODAL: ADMIN & USER PROFILE / AVATAR MODAL */}
      {showAdminProfileModal && user && user.role === 'admin' && (
        <Suspense fallback={null}>
          <AdminProfileModal
            user={user}
            onClose={() => setShowAdminProfileModal(false)}
            onUpdateProfile={onUpdateUserProfile}
          />
        </Suspense>
      )}

      {/* MODAL: SHORT VIDEO PLAYER */}
      {selectedVideoBiz && (
        <Suspense fallback={null}>
          <VideoPlayerModal
            business={selectedVideoBiz}
            onClose={() => setSelectedVideoBiz(null)}
          />
        </Suspense>
      )}

      {/* MODAL: OFFLINE SYNC HUB */}
      <OfflineSyncModal
        isOpen={showOfflineSyncModal}
        currentUser={user}
        onClose={() => setShowOfflineSyncModal(false)}
        onSyncComplete={async () => {
          try {
            const fresh = await fetchBusinessesFromDb();
            if (fresh && fresh.length > 0) {
              setBusinesses(fresh);
            }
          } catch {}
        }}
      />
    </>
  );
};
