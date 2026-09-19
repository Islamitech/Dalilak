import React, { useMemo } from 'react';
import { Business, User } from '../../../types';
import { isSuperAdmin } from '../../../utils/permissions';
import { ExportContactsModal } from './ExportContactsModal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import type {
  SlotId,
  BroadcastLogItem,
  BroadcastProgress,
  WhatsAppSlotStatus,
  WhatsAppRotationState,
  WhatsAppSessionStatus,
} from './whatsapp-campaign';
import {
  PRIMARY_WHATSAPP_SENDER_PHONE,
  isLandlineOrHotline,
  isEgyptianMobile,
  resolveSpintaxText,
  useWhatsAppGateway,
  useCampaignState,
  useCampaignSender,
  CampaignHeader,
  CampaignGatewayBar,
  CampaignAudienceSelector,
  CampaignMessageComposer,
  CampaignLiveRadar,
  CampaignConfirmationModal,
} from './whatsapp-campaign';

export { PRIMARY_WHATSAPP_SENDER_PHONE, isLandlineOrHotline, isEgyptianMobile, resolveSpintaxText };
export type { SlotId, BroadcastLogItem, BroadcastProgress, WhatsAppSlotStatus, WhatsAppRotationState, WhatsAppSessionStatus };

export interface AdminWhatsAppCampaignTabProps {
  currentUser: User;
  businesses: Business[];
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AdminWhatsAppCampaignTab: React.FC<AdminWhatsAppCampaignTabProps> = ({
  currentUser,
  businesses,
  onShowNotification,
}) => {
  const isLikelyStaticHosting = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname.toLowerCase();
    return h.includes('vercel.app') || h.includes('dalilaak.com');
  }, []);

  const isDesktop = useMemo(() => {
    if (typeof navigator === 'undefined') return true;
    return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const gateway = useWhatsAppGateway({ isDesktop, onShowNotification });
  const campaign = useCampaignState({ businesses, isDesktop, onShowNotification });
  const sender = useCampaignSender({
    sessionStatus: gateway.sessionStatus,
    fetchStatus: gateway.fetchStatus,
    targetBusinesses: campaign.targetBusinesses,
    validPhoneCount: campaign.validPhoneCount,
    selectedTemplate: campaign.selectedTemplate,
    customText: campaign.customText,
    isLikelyStaticHosting,
    onShowNotification,
  });

  if (!isSuperAdmin(currentUser)) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-400 font-bold">هذا القسم متاح للمدير العام فقط (SuperAdmin).</p>
      </div>
    );
  }

  const isCampaignRunning =
    gateway.sessionStatus.activeCampaign?.status === 'running' ||
    gateway.sessionStatus.activeCampaign?.status === 'cooldown';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn text-[var(--text-primary)] font-cairo">
      {/* ── HEADER BANNER ── */}
      <CampaignHeader
        dispatchMode={sender.dispatchMode}
        onModeChange={sender.handleModeChange}
        showServerSettings={gateway.showServerSettings}
        setShowServerSettings={gateway.setShowServerSettings}
        gatewayCustomUrl={gateway.gatewayCustomUrl}
        setGatewayCustomUrl={gateway.setGatewayCustomUrl}
        onSaveGatewayUrl={gateway.handleSaveGatewayUrl}
        isServerReachable={gateway.isServerReachable}
        isLoadingStatus={gateway.isLoadingStatus}
        onRefreshStatus={gateway.fetchStatus}
        onOpenExportContacts={() => sender.setShowExportContactsModal(true)}
        isDesktop={isDesktop}
      />

      {/* ── GATEWAY STATUS BAR & PREFERENCES (SERVER MODE ONLY) ── */}
      {sender.dispatchMode === 'server_gateway' && (
        <CampaignGatewayBar
          slot1={gateway.slot1}
          slot2={gateway.slot2}
          connectingSlot={gateway.connectingSlot}
          disconnectingSlot={gateway.disconnectingSlot}
          isCampaignRunning={isCampaignRunning}
          isBothConnected={gateway.isBothConnected}
          isAnyConnected={gateway.isAnyConnected}
          enableRotation={sender.enableRotation}
          setEnableRotation={sender.setEnableRotation}
          rotationBatchSize={sender.rotationBatchSize}
          setRotationBatchSize={sender.setRotationBatchSize}
          pacingPreset={sender.pacingPreset}
          onSelectPreset={sender.handleSelectPreset}
          minDelaySeconds={sender.minDelaySeconds}
          setMinDelaySeconds={sender.setMinDelaySeconds}
          maxDelaySeconds={sender.maxDelaySeconds}
          setMaxDelaySeconds={sender.setMaxDelaySeconds}
          enableStealthRandomMode={sender.enableStealthRandomMode}
          setEnableStealthRandomMode={sender.setEnableStealthRandomMode}
          stealthMinMinutes={sender.stealthMinMinutes}
          setStealthMinMinutes={sender.setStealthMinMinutes}
          stealthMaxMinutes={sender.stealthMaxMinutes}
          setStealthMaxMinutes={sender.setStealthMaxMinutes}
          onConnect={gateway.handleConnect}
          onDisconnect={gateway.executeDisconnect}
          serverNoticeMessage={gateway.serverNoticeMessage}
          isDesktop={isDesktop}
          onModeChange={sender.handleModeChange}
          hasCopiedCommand={sender.hasCopiedCommand}
          setHasCopiedCommand={sender.setHasCopiedCommand}
          onRefreshStatus={gateway.fetchStatus}
        />
      )}

      {/* ── STEP 1: AUDIENCE SELECTOR ── */}
      <CampaignAudienceSelector
        targetBusinesses={campaign.targetBusinesses}
        totalBusinessesCount={businesses.length}
        audienceFilter={campaign.audienceFilter}
        setAudienceFilter={campaign.setAudienceFilter}
        governorateFilter={campaign.governorateFilter}
        setGovernorateFilter={campaign.setGovernorateFilter}
        cityFilter={campaign.cityFilter}
        setCityFilter={campaign.setCityFilter}
        categoryFilter={campaign.categoryFilter}
        setCategoryFilter={campaign.setCategoryFilter}
        hadayekRadiusFilter={campaign.hadayekRadiusFilter}
        setHadayekRadiusFilter={campaign.setHadayekRadiusFilter}
        hadayekTotalCount={campaign.hadayekTotalCount}
        governorateList={campaign.governorateList}
        cityList={campaign.cityList}
        categoryList={campaign.categoryList}
        validPhoneCount={campaign.validPhoneCount}
        landlineCount={campaign.landlineCount}
        dummyPhoneCount={campaign.dummyPhoneCount}
        onOpenExportContacts={() => sender.setShowExportContactsModal(true)}
        onResetQueueIndex={() => campaign.setMobileQueueIndex(0)}
      />

      {/* ── STEP 2: MESSAGE COMPOSER ── */}
      <CampaignMessageComposer
        selectedTemplate={campaign.selectedTemplate}
        onTemplateChange={campaign.handleTemplateChange}
        customText={campaign.customText}
        setCustomText={campaign.setCustomText}
      />

      {/* ── STEP 3: LIVE RADAR & DISPATCH DASHBOARD ── */}
      <CampaignLiveRadar
        dispatchMode={sender.dispatchMode}
        sessionStatus={gateway.sessionStatus}
        targetBusinesses={campaign.targetBusinesses}
        validPhoneCount={campaign.validPhoneCount}
        minDelaySeconds={sender.minDelaySeconds}
        maxDelaySeconds={sender.maxDelaySeconds}
        isAnyConnected={gateway.isAnyConnected}
        isConnecting={gateway.isConnecting}
        isCampaignRunning={isCampaignRunning}
        isStartingCampaign={sender.isStartingCampaign}
        onLaunchClick={() => sender.setShowConfirmModal(true)}
        onConnectSlot1={() => gateway.handleConnect('1')}
        sampleBiz={campaign.sampleBiz}
        previewBizIndex={campaign.previewBizIndex}
        setPreviewBizIndex={campaign.setPreviewBizIndex}
        setSpintaxSeed={campaign.setSpintaxSeed}
        previewMessage={campaign.previewMessage}
        onSkipDelay={sender.handleSkipDelay}
        isSkippingDelay={sender.isSkippingDelay}
        onAbortCampaign={sender.handleAbortCampaign}
        isAbortingCampaign={sender.isAbortingCampaign}
        onResumeCampaign={sender.handleResumeCampaign}
        isResumingCampaign={sender.isResumingCampaign}
        currentMobileBiz={campaign.currentMobileBiz}
        currentMobilePhone={campaign.currentMobilePhone}
        isCurrentMobilePhoneValid={campaign.isCurrentMobilePhoneValid}
        isCurrentMobilePhoneLandline={campaign.isCurrentMobilePhoneLandline}
        mobileQueueIndex={campaign.mobileQueueIndex}
        setMobileQueueIndex={campaign.setMobileQueueIndex}
        sentBusinessIds={campaign.sentBusinessIds}
        skippedBusinessIds={campaign.skippedBusinessIds}
        onMobileSendCurrent={campaign.handleMobileSendCurrent}
        onMobileSkipCurrent={campaign.handleMobileSkipCurrent}
        compileMessageForBiz={campaign.compileMessageForBiz}
        selectedTemplate={campaign.selectedTemplate}
        isDesktop={isDesktop}
      />

      {/* ── FINAL CONFIRMATION MODAL (FOR SERVER CAMPAIGN) ── */}
      <CampaignConfirmationModal
        isOpen={sender.showConfirmModal}
        onClose={() => sender.setShowConfirmModal(false)}
        onConfirm={sender.handleLaunchCampaign}
        isStartingCampaign={sender.isStartingCampaign}
        targetBusinessesCount={campaign.targetBusinesses.length}
        validPhoneCount={campaign.validPhoneCount}
        landlineCount={campaign.landlineCount}
        dummyPhoneCount={campaign.dummyPhoneCount}
        minDelaySeconds={sender.minDelaySeconds}
        maxDelaySeconds={sender.maxDelaySeconds}
        enableStealthRandomMode={sender.enableStealthRandomMode}
        stealthMinMinutes={sender.stealthMinMinutes}
        stealthMaxMinutes={sender.stealthMaxMinutes}
        enableRotation={sender.enableRotation}
        isBothConnected={gateway.isBothConnected}
        rotationBatchSize={sender.rotationBatchSize}
        slot1={gateway.slot1}
        slot2={gateway.slot2}
        skipRecentlyContacted={sender.skipRecentlyContacted}
        setSkipRecentlyContacted={sender.setSkipRecentlyContacted}
      />

      {/* ── GOOGLE CONTACTS VCF 3.0 EXPORT MODAL ── */}
      <ExportContactsModal
        isOpen={sender.showExportContactsModal}
        onClose={() => sender.setShowExportContactsModal(false)}
        allBusinesses={businesses}
        filteredBusinesses={campaign.targetBusinesses}
        onShowNotification={onShowNotification}
      />

      {/* ── CENTRAL CONFIRM DIALOG ── */}
      {sender.confirmDialogConfig && (
        <ConfirmDialog
          isOpen={sender.confirmDialogConfig.isOpen}
          title={sender.confirmDialogConfig.title}
          message={sender.confirmDialogConfig.message}
          confirmLabel={sender.confirmDialogConfig.confirmLabel}
          variant={sender.confirmDialogConfig.variant}
          onConfirm={() => {
            sender.confirmDialogConfig?.onConfirm();
            sender.setConfirmDialogConfig(null);
          }}
          onCancel={() => sender.setConfirmDialogConfig(null)}
        />
      )}
    </div>
  );
};

export default AdminWhatsAppCampaignTab;
