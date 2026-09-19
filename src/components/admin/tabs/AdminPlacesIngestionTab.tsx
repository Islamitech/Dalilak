import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { isSuperAdmin } from '../../../utils/permissions';
import {
  AdminPlacesIngestionTabProps,
  HadayekSector,
  HADAYEK_SECTORS,
  FUTURE_EXPANSION_HUBS,
  detectEgyptianGovernorate,
  usePlacesIngestionFlow,
  IngestionConfigPanel,
  IngestionAuditDashboard,
  DiscoveredPlacesGrid,
} from './places-ingestion';

export type { HadayekSector };
export { HADAYEK_SECTORS, FUTURE_EXPANSION_HUBS, detectEgyptianGovernorate };

export const AdminPlacesIngestionTab: React.FC<AdminPlacesIngestionTabProps> = ({
  currentUser,
  businesses,
  onAddBusiness,
  onShowNotification,
}) => {
  // 🛡️ 1. الحظر السيادي الصارم (Super Admin Exclusive Security Guard)
  if (!isSuperAdmin(currentUser)) {
    return (
      <div className="p-10 text-center bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-xl mx-auto my-12">
        <ShieldAlert className="w-14 h-14 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-black text-rose-500 mb-2">
          حظر أمني: بوابة الاستيراد محصورة بالسوبر أدمن حصراً
        </h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          هذه الوظيفة سيادية ومخصصة للحساب الأعلى لإدارة المنظومة (403 Forbidden). تم تسجيل محاولة الوصول في سجل أمان المنصة.
        </p>
      </div>
    );
  }

  // 🏛️ State & Business Engine Flow
  const flow = usePlacesIngestionFlow({
    currentUser,
    businesses,
    onAddBusiness,
    onShowNotification,
  });

  return (
    <div className="space-y-6 text-right pb-24 animate-fade-in" dir="rtl">
      {/* ── SEARCH SCOPE CONTROLS & QUERY BUILDER ── */}
      <IngestionConfigPanel
        currentSector={flow.currentSector}
        existingSectorBusinessesCount={flow.existingSectorBusinessesCount}
        selectedSectorIndex={flow.selectedSectorIndex}
        showExpansionHubs={flow.showExpansionHubs}
        setShowExpansionHubs={flow.setShowExpansionHubs}
        selectedExpansionHubIndex={flow.selectedExpansionHubIndex}
        isExpansionHubActive={flow.isExpansionHubActive}
        isCustomHub={flow.isCustomHub}
        selectedCategoryIndex={flow.selectedCategoryIndex}
        isExhaustiveAtlasMode={flow.isExhaustiveAtlasMode}
        setIsExhaustiveAtlasMode={flow.setIsExhaustiveAtlasMode}
        pullCount={flow.pullCount}
        setPullCount={flow.setPullCount}
        customScanRadius={flow.customScanRadius}
        setCustomScanRadius={flow.setCustomScanRadius}
        gridDensity={flow.gridDensity}
        setGridDensity={flow.setGridDensity}
        autoExcludePreviousScans={flow.autoExcludePreviousScans}
        setAutoExcludePreviousScans={flow.setAutoExcludePreviousScans}
        enableDeepStratumScan={flow.enableDeepStratumScan}
        setEnableDeepStratumScan={flow.setEnableDeepStratumScan}
        seenHistoryCount={flow.seenHistoryCount}
        isScanning={flow.isScanning}
        scanChunkStatus={flow.scanChunkStatus}
        onSectorChange={flow.handleSectorChange}
        onExpansionHubChange={flow.handleExpansionHubChange}
        onCategoryChange={flow.handleCategoryChange}
        onExecuteScan={flow.handleExecuteScan}
        onClearHistoryCache={flow.handleClearHistoryCache}
      />

      {/* ── ATLAS SECTOR COVERAGE & AUDIT DASHBOARD ── */}
      {flow.metrics && (
        <IngestionAuditDashboard
          metrics={flow.metrics}
          currentSectorSubZone={flow.currentSector.subZone}
          existingSectorBusinessesCount={flow.existingSectorBusinessesCount}
        />
      )}

      {/* ── BATCH INGESTION ACTION BAR & CANDIDATE LIST ── */}
      {flow.candidatePlaces.length > 0 && (
        <DiscoveredPlacesGrid
          candidatePlaces={flow.candidatePlaces}
          displayedPlaces={flow.displayedPlaces}
          activeBucketTab={flow.activeBucketTab}
          setActiveBucketTab={flow.setActiveBucketTab}
          selectedPlaceIds={flow.selectedPlaceIds}
          currentSectorSubZone={flow.currentSector.subZone}
          showDuplicates={flow.showDuplicates}
          setShowDuplicates={flow.setShowDuplicates}
          filterOnlyQualified={flow.filterOnlyQualified}
          setFilterOnlyQualified={flow.setFilterOnlyQualified}
          isIngesting={flow.isIngesting}
          ingestProgress={flow.ingestProgress}
          ingestionMessage={flow.ingestionMessage}
          pulledPhotosPreview={flow.pulledPhotosPreview}
          loadingPreviewId={flow.loadingPreviewId}
          onToggleSelectAll={flow.handleToggleSelectAll}
          onTogglePlace={flow.handleTogglePlace}
          onSelectTop100Commercial={flow.handleSelectTop100Commercial}
          onPreviewPhoto={flow.handlePreviewPhoto}
          onIngestSelected={flow.handleIngestSelected}
        />
      )}
    </div>
  );
};
