import { Business, User } from '../../../../types';

export type SlotId = '1' | '2';

export interface BroadcastLogItem {
  businessId: string;
  businessName: string;
  phone: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  timestamp: string;
  senderSlot?: SlotId;
  senderPhone?: string;
}

export interface BroadcastProgress {
  id: string;
  templateType: string;
  total: number;
  current: number;
  successful: number;
  failed: number;
  skipped: number;
  status: 'idle' | 'running' | 'paused' | 'aborted' | 'completed' | 'cooldown';
  currentBusinessName?: string;
  startedAt: string;
  finishedAt?: string;
  logs: BroadcastLogItem[];
  lastIndex?: number;
  cooldownRemainingSeconds?: number;
  cooldownBatchCount?: number;
  currentSlot?: SlotId;
  currentSlotSentCount?: number;
  rotationBatchSize?: number;
  currentSenderSlot?: SlotId;
  rotationBatchCount?: number;
  // 🌿 Organic Stealth Mode
  stealthModeActive?: boolean;
  nextDispatchInSeconds?: number;
  nextSlotTarget?: SlotId;
  slot1SentCount?: number;
  slot2SentCount?: number;
  enableStealthRandomMode?: boolean;
  stealthMinMinutes?: number;
  stealthMaxMinutes?: number;
  stealthInitialBurstPerSlot?: number;
}

export interface WhatsAppSlotStatus {
  slotId: SlotId;
  name?: string;
  state: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  connectedAt?: string | null;
  lastHeartbeat?: string | null;
  uptimeSeconds?: number;
  disconnectReason?: string | null;
  autoReconnectAttempts?: number;
  healthStatus?: 'healthy' | 'degraded' | 'offline';
}

export interface WhatsAppRotationState {
  enabled: boolean;
  batchSize: number;
  currentSlot: SlotId;
  currentSlotSentCount: number;
}

export interface WhatsAppSessionStatus {
  state: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  activeCampaign: BroadcastProgress | null;
  slots?: {
    '1': WhatsAppSlotStatus;
    '2': WhatsAppSlotStatus;
  };
  rotationConfig?: WhatsAppRotationState;
}

export interface AdminWhatsAppCampaignTabProps {
  currentUser: User;
  businesses: Business[];
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export type DispatchMode = 'server_gateway' | 'mobile_direct';

export type PacingPreset = 'balanced' | 'ultra_safe' | 'fast' | 'custom';

export interface TemplateDefinition {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  defaultText: string;
}
