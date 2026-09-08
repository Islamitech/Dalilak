import React, { useState, useEffect } from 'react';
import { Representative, Business, PayoutRequest } from '../../types';
import {
  RepFinanceSummaryCards,
  PayoutAccountsSection,
  RepLedgerTable,
  RemitInfoModal,
  AnnualStatementModal,
} from '../rep-finance';

export interface RepFinanceTabProps {
  rep: Representative;
  commissionPercentage: number;
  settlement: any;
  pendingRemittance?: PayoutRequest;
  pendingPayout?: PayoutRequest;
  myPayouts: PayoutRequest[];
  repBusinesses: Business[];
  businessesCount: number;
  referralSummary: any;
  referralCode: string;
  repMonthlyProfits: any[];
  onRequestPayout?: (payout: PayoutRequest) => void;
  onOpenPayoutModal: () => void;
}

export const RepFinanceTab: React.FC<RepFinanceTabProps> = ({
  rep,
  commissionPercentage,
  settlement,
  pendingRemittance: initialPendingRemittance,
  pendingPayout,
  myPayouts: initialMyPayouts,
  repBusinesses,
  businessesCount,
  referralSummary,
  referralCode,
  repMonthlyProfits,
  onRequestPayout,
  onOpenPayoutModal,
}) => {
  const [showRemitInfoModal, setShowRemitInfoModal] = useState(false);
  const [showAnnualStatementModal, setShowAnnualStatementModal] = useState(false);

  // Internal copy of payouts for instant optimistic updates
  const [myPayouts, setMyPayouts] = useState<PayoutRequest[]>(initialMyPayouts);
  const [pendingRemittance, setPendingRemittance] = useState<PayoutRequest | undefined>(
    initialPendingRemittance
  );

  useEffect(() => {
    setMyPayouts(initialMyPayouts);
    setPendingRemittance(initialPendingRemittance);
  }, [initialMyPayouts, initialPendingRemittance]);

  const handleRemittanceCreated = (newRemittance: PayoutRequest) => {
    setPendingRemittance(newRemittance);
    setMyPayouts((prev) => [newRemittance, ...prev]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Financial Hub Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300">
        <RepFinanceSummaryCards
          repBusinesses={repBusinesses}
          businessesCount={businessesCount}
          commissionPercentage={commissionPercentage}
          settlement={settlement}
          pendingRemittance={pendingRemittance}
          pendingPayout={pendingPayout}
          referralSummary={referralSummary}
          referralCode={referralCode}
          onRequestPayout={onRequestPayout}
          onOpenPayoutModal={onOpenPayoutModal}
          onOpenRemitInfoModal={() => setShowRemitInfoModal(true)}
        />

        <PayoutAccountsSection repId={rep.id} defaultPhone={rep.phone} />

        <RepLedgerTable
          myPayouts={myPayouts}
          repMonthlyProfits={repMonthlyProfits}
          onOpenAnnualStatement={() => setShowAnnualStatementModal(true)}
        />
      </div>

      <RemitInfoModal
        isOpen={showRemitInfoModal}
        onClose={() => setShowRemitInfoModal(false)}
        rep={rep}
        settlement={settlement}
        pendingRemittance={pendingRemittance}
        onRequestPayout={onRequestPayout}
        onRemittanceCreated={handleRemittanceCreated}
      />

      <AnnualStatementModal
        isOpen={showAnnualStatementModal}
        onClose={() => setShowAnnualStatementModal(false)}
        rep={rep}
        commissionPercentage={commissionPercentage}
        settlement={settlement}
        referralSummary={referralSummary}
        referralCode={referralCode}
        repMonthlyProfits={repMonthlyProfits}
      />
    </div>
  );
};
