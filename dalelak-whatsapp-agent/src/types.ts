/**
 * Standalone Type Definitions for Dalelak WhatsApp Agent
 */

export type WhatsAppConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'qr_ready'
  | 'connected'
  | 'banned'
  | 'logged_out'
  | 'error'
  | 'tripped';

export interface SlotSafetyMetrics {
  messagesSentLastHour: number;
  hourlyCap: number;
  riskScore: number; // 0 to 100
  circuitBreakerTripped: boolean;
  tripReason?: string;
  lastSentAt?: string;
}

export interface WhatsAppSlotStatus {
  slotId: string;
  state: WhatsAppConnectionState;
  qrCode?: string | null;
  phoneNumber?: string | null;
  name?: string | null;
  lastConnected?: string | null;
  lastHeartbeat?: string | null;
  uptimeSeconds?: number;
  disconnectReason?: string | null;
  reconnectAttempts?: number;
  safety: SlotSafetyMetrics;
}

export type AdminFollowUpType = 'call' | 'visit' | 'payment' | 'verification' | 'general';
export type AdminFollowUpStatus = 'completed' | 'pending' | 'urgent';
export type AdminFollowUpCategory = 'info' | 'directory' | 'maps' | 'finance' | 'media' | 'whatsapp' | 'general';

export interface AdminFollowUpNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  author?: string;
  date?: string;
  type: AdminFollowUpType;
  status?: AdminFollowUpStatus;
  category?: AdminFollowUpCategory;
  text: string;
  createdAt: string;
  nextFollowUpDate?: string;
}

export interface Business {
  id: string;
  nameAr: string;
  nameEn?: string;
  name?: string;
  category?: string;
  governorate?: string;
  city?: string;
  street?: string;
  phone?: string;
  workingHours?: string;
  description?: string;
  lat?: number;
  lng?: number;
  ownerName?: string;
  ownerPhone?: string;
  verificationStatus?: 'pending' | 'in_progress' | 'verified' | 'rejected' | 'needs_action';
  publishedStatus?: 'published' | 'draft' | 'unlisted';
  customDirectoryUrl?: string;
  repName?: string;
  packageName?: string;
  notes?: string;
  adminFollowUps?: AdminFollowUpNote[];
  adminFollowUpNotes?: AdminFollowUpNote[];
  updatedAt?: string;
  createdAt?: string;
}

export interface WhatsAppAiConfig {
  apiKey: string;
  apiKeys?: string[];
  activeKeyIndex?: number;
  model: string;
  enabled: boolean;
  tone: 'egyptian_warm' | 'formal_arabic';
  autoGiftEnabled: boolean;
  autoUpdateBusinessEnabled: boolean;
  autoRepLeadEnabled: boolean;
  typingSimulationEnabled: boolean;
  humanTakeoverCooldownMinutes: number;
}

export interface AiConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: any[];
}

export interface AiConversationThread {
  phone: string;
  businessId?: string;
  businessName?: string;
  lastIncomingAt?: string;
  lastAiReplyAt?: string;
  isMutedForHuman?: boolean;
  mutedUntil?: string;
  messages: AiConversationMessage[];
}

export interface AiAuditLogItem {
  id: string;
  timestamp: string;
  phone: string;
  businessName?: string;
  incomingText: string;
  detectedIntent: string;
  aiReply: string;
  actionExecuted: string;
  actionDetails?: any;
  slotId?: string;
}

export interface BusinessGiftResult {
  buffer: Buffer;
  caption: string;
  contentType: 'image/png' | 'image/jpeg';
  source: 'external_app' | 'generated_qr';
  targetUrl: string;
}

export interface DeliveredGiftRecord {
  businessId: string;
  businessName: string;
  phone: string;
  deliveredAt: string;
  source: 'external_app' | 'generated_qr';
  targetUrl: string;
}
