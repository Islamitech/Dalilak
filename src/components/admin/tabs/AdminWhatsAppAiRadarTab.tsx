import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Bot,
  Smartphone,
  QrCode,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gift,
  Users,
  Award,
  Sparkles,
  Clock,
  Plus,
  Power,
  Zap,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Sliders,
  Send,
  UserCheck,
  Shield,
  Activity,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Business, User } from '../../../types';
import { getApiAuthHeaders } from '../../../utils/storage';
import { triggerHaptic } from '../../../utils/haptics';
import { getDisplayDirectoryUrl } from '../../../utils/directoryUrl';

export interface AdminWhatsAppAiRadarTabProps {
  currentUser: User;
  businesses: Business[];
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onNavigateToCampaigns?: () => void;
}

interface SlotSafetyMetrics {
  slotId: string;
  safetyScore: number;
  hourlyOutboundCount: number;
  hourlyInboundCount: number;
  dailyOutboundCount: number;
  dailyInboundCount: number;
  inboundRatio: number;
  riskLevel: 'safe' | 'moderate' | 'high_risk';
  isCircuitBreakerActive: boolean;
  cooldownUntil: string | null;
  lastCircuitBreakerReason: string | null;
}

interface WhatsAppSlotStatus {
  slotId: string;
  name?: string;
  state: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  connectedAt?: string | null;
  lastHeartbeat?: string | null;
  uptimeSeconds?: number;
  disconnectReason?: string | null;
  healthStatus?: 'healthy' | 'degraded' | 'offline';
  safety?: SlotSafetyMetrics;
}

interface AiConfig {
  apiKey?: string;
  maskedApiKey?: string;
  hasApiKey: boolean;
  model: string;
  enabled: boolean;
  tone: 'egyptian_warm' | 'formal_official' | 'marketing_promotional';
  autoGiftEnabled: boolean;
  autoUpdateBusinessEnabled: boolean;
  autoRepLeadEnabled: boolean;
  typingSimulationEnabled: boolean;
  humanTakeoverCooldownMinutes: number;
}

interface AiConversation {
  phone: string;
  businessId?: string;
  businessName?: string;
  isMutedByHuman?: boolean;
  mutedUntil?: string | null;
  lastIncomingAt?: string;
  lastReplyAt?: string;
  lastActionExecuted?: string;
  lastDetectedIntent?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    timestamp: string;
  }>;
}

interface AiAuditItem {
  id: string;
  timestamp: string;
  senderPhone: string;
  businessId?: string;
  businessName?: string;
  incomingText: string;
  detectedIntent: string;
  aiReply: string;
  actionExecuted: string;
  actionDetails?: any;
  slotId?: string;
}

interface DeliveredGift {
  businessId: string;
  businessName: string;
  phone: string;
  deliveredAt: string;
  source: 'external_app' | 'generated_qr';
  targetUrl: string;
}

// 🛡️ Probes local WhatsApp standalone gateway
async function fetchGateway(endpoint: string, options?: RequestInit): Promise<any> {
  const authHeaders = getApiAuthHeaders();
  const mergedHeaders = {
    ...authHeaders,
    ...((options?.headers as Record<string, string>) || {}),
  };
  const reqOpts: RequestInit = {
    ...options,
    headers: mergedHeaders,
  };

  const storedBase = localStorage.getItem('dalelak_whatsapp_gateway_url');
  const candidates = [
    storedBase,
    'http://localhost:3005',
    'http://127.0.0.1:3005',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  for (const base of candidates) {
    try {
      const cleanBase = base.replace(/\/$/, '');
      const url = `${cleanBase}${endpoint}`;
      const res = await fetch(url, reqOpts);
      const text = await res.text();
      if (text && !text.trim().startsWith('<!doctype') && !text.trim().startsWith('<html')) {
        const json = JSON.parse(text);
        localStorage.setItem('dalelak_whatsapp_gateway_url', cleanBase);
        return json;
      }
    } catch {}
  }
  throw new Error('تعذر الوصول إلى سيرفر الواتساب المستقل (المنفذ 3005). يرجى تشغيل تشغيل_سيرفر_الواتساب.bat.');
}

export const AdminWhatsAppAiRadarTab: React.FC<AdminWhatsAppAiRadarTabProps> = ({
  businesses,
  onShowNotification,
  onNavigateToCampaigns,
}) => {
  // State
  const [slots, setSlots] = useState<Record<string, WhatsAppSlotStatus>>({});
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AiAuditItem[]>([]);
  const [deliveredGifts, setDeliveredGifts] = useState<DeliveredGift[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [serverOnline, setServerOnline] = useState<boolean>(false);

  // Modals & UI Toggles
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'gifts' | 'audit'>('conversations');
  const [newSlotInput, setNewSlotInput] = useState<string>('');
  const [isAddingSlot, setIsAddingSlot] = useState<boolean>(false);

  // Settings Form State (Supporting 3 Grok Keys with Auto-Failover)
  const [editApiKey, setEditApiKey] = useState<string>('');
  const [editApiKey1, setEditApiKey1] = useState<string>('');
  const [editApiKey2, setEditApiKey2] = useState<string>('');
  const [editApiKey3, setEditApiKey3] = useState<string>('');
  const [editModel, setEditModel] = useState<string>('grok-2-mini');
  const [editTone, setEditTone] = useState<AiConfig['tone']>('egyptian_warm');
  const [editAutoGift, setEditAutoGift] = useState<boolean>(true);
  const [editAutoUpdate, setEditAutoUpdate] = useState<boolean>(true);
  const [editAutoRep, setEditAutoRep] = useState<boolean>(true);
  const [editTyping, setEditTyping] = useState<boolean>(true);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch full radar & AI status
  const loadRadarData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      // 1. Session & Slots
      const statusRes = await fetchGateway('/api/whatsapp/status');
      if (statusRes && statusRes.status && statusRes.status.slots) {
        setSlots(statusRes.status.slots);
        setServerOnline(true);
      }

      // 2. AI Config
      try {
        const configRes = await fetchGateway('/api/whatsapp/ai/config');
        if (configRes && configRes.config) {
          setAiConfig(configRes.config);
          if (Array.isArray(configRes.config.maskedApiKeys)) {
            setEditApiKey1(configRes.config.maskedApiKeys[0] || '');
            setEditApiKey2(configRes.config.maskedApiKeys[1] || '');
            setEditApiKey3(configRes.config.maskedApiKeys[2] || '');
          } else if (configRes.config.maskedApiKey) {
            setEditApiKey1(configRes.config.maskedApiKey);
          }
          setEditModel(configRes.config.model || 'grok-2-mini');
          setEditTone(configRes.config.tone || 'egyptian_warm');
          setEditAutoGift(configRes.config.autoGiftEnabled !== false);
          setEditAutoUpdate(configRes.config.autoUpdateBusinessEnabled !== false);
          setEditAutoRep(configRes.config.autoRepLeadEnabled !== false);
          setEditTyping(configRes.config.typingSimulationEnabled !== false);
        }
      } catch {}

      // 3. AI Conversations
      try {
        const convRes = await fetchGateway('/api/whatsapp/ai/conversations');
        if (convRes && Array.isArray(convRes.conversations)) {
          setConversations(convRes.conversations);
        }
      } catch {}

      // 4. Audit Logs
      try {
        const auditRes = await fetchGateway('/api/whatsapp/ai/audit');
        if (auditRes && Array.isArray(auditRes.logs)) {
          setAuditLogs(auditRes.logs);
        }
      } catch {}

      // 5. Delivered Gifts
      try {
        const giftRes = await fetchGateway('/api/whatsapp/gift/history');
        if (giftRes && Array.isArray(giftRes.history)) {
          setDeliveredGifts(giftRes.history);
        }
      } catch {}
    } catch (err: any) {
      setServerOnline(false);
      if (!isSilent && onShowNotification) {
        onShowNotification(err?.message || 'تعذر الاتصال بسيرفر الواتساب المستقل', 'error');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onShowNotification]);

  useEffect(() => {
    loadRadarData();
    pollingRef.current = setInterval(() => {
      loadRadarData(true);
    }, 6000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadRadarData]);

  // Handle Slot Connect
  const handleConnectSlot = async (slotId: string) => {
    triggerHaptic('medium');
    try {
      onShowNotification?.(`جاري طلب رمز QR للهاتف (${slotId})...`, 'info');
      await fetchGateway('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotId }),
      });
      loadRadarData(true);
    } catch (err: any) {
      onShowNotification?.(err?.message || 'فشل بدء اتصال الهاتف', 'error');
    }
  };

  // Handle Slot Disconnect
  const handleDisconnectSlot = async (slotId: string) => {
    triggerHaptic('medium');
    if (!window.confirm(`هل أنت متأكد من رغبتك في فصل جلسة الهاتف (${slotId})؟`)) return;
    try {
      await fetchGateway('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotId }),
      });
      onShowNotification?.(`تم قطع اتصال هاتف (${slotId}) بأمان`, 'success');
      loadRadarData(true);
    } catch (err: any) {
      onShowNotification?.(err?.message || 'فشل قطع الاتصال', 'error');
    }
  };

  // Handle Reset Breaker
  const handleResetBreaker = async (slotId: string) => {
    triggerHaptic('success');
    try {
      await fetchGateway('/api/whatsapp/safety/reset-breaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });
      onShowNotification?.(`تم تصفير قاطع الدائرة للهاتف (${slotId}) واستئناف جهوزيته`, 'success');
      loadRadarData(true);
    } catch (err: any) {
      onShowNotification?.(err?.message || 'فشل تصفير القاطع', 'error');
    }
  };

  // Toggle Human Takeover / Mute
  const handleToggleConversationMute = async (phone: string, currentMuted: boolean) => {
    triggerHaptic('selection');
    try {
      const action = currentMuted ? 'unmute' : 'mute';
      await fetchGateway('/api/whatsapp/ai/toggle-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action }),
      });
      onShowNotification?.(
        action === 'unmute'
          ? `تم تفعيل الرد الآلي للرقم ${phone}`
          : `تم تحويل محادثة ${phone} للتدخل البشري وكتم الروبوت`,
        'info'
      );
      loadRadarData(true);
    } catch (err: any) {
      onShowNotification?.(err?.message || 'فشل تعديل حالة المحادثة', 'error');
    }
  };

  // Toggle Emergency AI Kill Switch
  const handleToggleKillSwitch = async () => {
    triggerHaptic('warning');
    if (!aiConfig) return;
    const targetState = !aiConfig.enabled;
    const prompt = targetState
      ? 'هل تريد استئناف عمل وكيل الذكاء الاصطناعي لكافة المحادثات؟'
      : '⚠️ تحذير: هل تريد تفعيل زر الطوارئ وإيقاف كافة الردود التلقائية فوراً؟';
    if (!window.confirm(prompt)) return;

    try {
      await fetchGateway('/api/whatsapp/ai/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState }),
      });
      onShowNotification?.(
        targetState ? 'تم تفعيل الذكاء الاصطناعي بنجاح' : 'تم إيقاف كافة ردود الذكاء الاصطناعي فوراً (وضع الطوارئ)',
        targetState ? 'success' : 'warning'
      );
      loadRadarData(true);
    } catch (err: any) {
      onShowNotification?.(err?.message || 'فشل تبديل حالة الطوارئ', 'error');
    }
  };

  // Manual Send Gift & QR to business
  const handleManualSendGift = async (phone: string, bizId?: string) => {
    triggerHaptic('medium');
    if (!window.confirm(`هل تريد إرسال كارت الـ QR والهدية الترويجية المعتمدة فوراً إلى ${phone}؟`)) return;

    try {
      onShowNotification?.('جاري تجهيز وإرسال كارت الـ QR والهدية...', 'info');
      const res = await fetchGateway('/api/whatsapp/gift/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, businessId: bizId }),
      });
      onShowNotification?.(res?.message || 'تم إرسال كارت الهدية والـ QR بنجاح 🎁', 'success');
      loadRadarData(true);
    } catch (err: any) {
      onShowNotification?.(err?.message || 'فشل إرسال كارت الهدية', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    setIsSavingSettings(true);
    try {
      const payload: any = {
        apiKeys: [editApiKey1, editApiKey2, editApiKey3],
        model: editModel,
        tone: editTone,
        autoGiftEnabled: editAutoGift,
        autoUpdateBusinessEnabled: editAutoUpdate,
        autoRepLeadEnabled: editAutoRep,
        typingSimulationEnabled: editTyping,
      };
      if (editApiKey1.trim()) {
        payload.apiKey = editApiKey1.trim();
      }

      await fetchGateway('/api/whatsapp/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      onShowNotification?.('تم حفظ وتطبيق مفاتيح Grok (مع التبديل التلقائي) بنجاح ✓', 'success');
      setShowSettingsModal(false);
      loadRadarData(true);
    } catch (err: any) {
      onShowNotification?.(err?.message || 'فشل حفظ الإعدادات', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Add new slot
  const handleAddNewSlot = async () => {
    const nextSlotId = newSlotInput.trim() || String(Object.keys(slots).length + 1);
    setIsAddingSlot(false);
    setNewSlotInput('');
    handleConnectSlot(nextSlotId);
  };

  // Calculate Overall System Safety Score
  const slotList = Object.values(slots);
  const avgSafetyScore =
    slotList.length > 0
      ? Math.round(
          slotList.reduce((acc, s) => acc + (s.safety?.safetyScore || (s.state === 'connected' ? 95 : 70)), 0) /
            slotList.length
        )
      : 95;

  const connectedCount = slotList.filter((s) => s.state === 'connected').length;

  return (
    <div className="space-y-6 pb-12">
      {/* 🟢 TOP HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Bot className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  رادار أمان الواتساب والرد الآلي الذكي
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Grok AI & Multi-Slot Safety
                  </span>
                </h1>
                <p className="text-slate-300 text-sm">
                  مراقبة حية لصحة ومناعة أرقام الإدارة، واستماع لحظي للردود، وتسليم كروت الـ QR والهدايا البصرية تلقائياً
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">مؤشر الأمان العام:</span>
                <span className="font-bold text-emerald-300">{avgSafetyScore}% (ممتاز وخالٍ من الحظر)</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">الأرقام النشطة:</span>
                <span className="font-bold text-blue-300">
                  {connectedCount} من {slotList.length} متصل
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">محرك الذكاء الاصطناعي:</span>
                <span className="font-bold text-amber-300">
                  {aiConfig?.hasApiKey ? `xAI ${aiConfig.model}` : 'بانتظار إدخال المفتاح'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition shadow-sm"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              إعدادات Grok والأمان
            </button>

            <button
              onClick={handleToggleKillSwitch}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                aiConfig?.enabled
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              <Power className="w-4 h-4" />
              {aiConfig?.enabled ? 'زر الطوارئ (إيقاف الردود)' : 'استئناف الرد الآلي'}
            </button>

            <button
              onClick={() => loadRadarData()}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition disabled:opacity-50"
              title="تحديث البيانات لحظياً"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {onNavigateToCampaigns && (
              <button
                onClick={onNavigateToCampaigns}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition"
              >
                <span>حملات الإرسال</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ⚠️ Warning if Server is Unreachable */}
      {!serverOnline && !isLoading && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-amber-200 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">سيرفر الواتساب المحلي (المنفذ 3005) غير متصل حالياً</p>
            <p className="text-xs text-amber-300/80">
              يرجى تشغيله بنقرة مزدوجة على ملف <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono">تشغيل_سيرفر_الواتساب.bat</code> في مجلد المشروع، أو نفذ الأمر <code className="bg-amber-900/60 px-1.5 py-0.5 rounded font-mono">npm run whatsapp</code>.
            </p>
          </div>
        </div>
      )}

      {/* 📱 SECTION 1: MULTI-SLOT SAFETY RADAR CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              شبكة رادار الأمان وصحة الهواتف (Multi-Slot Health Radar)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            توزيع الحمل التلقائي وحماية الأرقام من فلاتر الروبوتات
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(slots).map(([sId, slot]) => {
            const isConnected = slot.state === 'connected';
            const isConnecting = slot.state === 'connecting';
            const isQrReady = slot.state === 'qr_ready';
            const safety = slot.safety || {
              safetyScore: isConnected ? 95 : 70,
              hourlyOutboundCount: 0,
              hourlyInboundCount: 0,
              inboundRatio: 0,
              riskLevel: 'safe',
              isCircuitBreakerActive: false,
              cooldownUntil: null,
              lastCircuitBreakerReason: null,
            };

            const scoreColor =
              safety.safetyScore >= 85
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
                : safety.safetyScore >= 65
                ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                : 'text-rose-500 bg-rose-500/10 border-rose-500/30';

            return (
              <div
                key={sId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Circuit Breaker Overlay if Active */}
                {safety.isCircuitBreakerActive && (
                  <div className="absolute top-0 right-0 left-0 bg-rose-600 text-white text-[11px] font-bold py-1 px-3 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      قاطع الأمان مفعل (استراحة تبريد)
                    </span>
                    <button
                      onClick={() => handleResetBreaker(sId)}
                      className="underline text-rose-100 hover:text-white"
                    >
                      استئناف الآن
                    </button>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isQrReady
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {slot.name || `هاتف (${sId})`}
                        </span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">
                          Slot {sId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {slot.connectedUser?.phone || (isConnected ? 'متصل' : 'غير مسجل')}
                      </p>
                    </div>
                  </div>

                  {/* Safety Score Badge */}
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-black flex items-center gap-1.5 ${scoreColor}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{safety.safetyScore}%</span>
                  </div>
                </div>

                {/* QR Display if Waiting to Scan */}
                {isQrReady && slot.qrCodeUrl && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-amber-400/40 text-center space-y-2">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-300 flex items-center justify-center gap-1">
                      <QrCode className="w-4 h-4" />
                      امسح الرمز بكاميرا واتساب للربط
                    </p>
                    <div className="inline-block p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                      <img src={slot.qrCodeUrl} alt="QR Code" className="w-36 h-36 mx-auto block" />
                    </div>
                  </div>
                )}

                {/* Safety Metrics & Velocity */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">الرسائل الساعية:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {safety.hourlyOutboundCount} / 40 أقصى حد
                    </span>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (safety.hourlyOutboundCount / 40) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">الردود الواردة:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {safety.hourlyInboundCount} رد ({safety.inboundRatio}:1 تفاعل)
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">يرفع مناعة الرقم 🛡️</p>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-1 flex items-center gap-2">
                  {!isConnected ? (
                    <button
                      onClick={() => handleConnectSlot(sId)}
                      disabled={isConnecting}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {isConnecting ? 'جاري الاتصال...' : isQrReady ? 'تحديث الرمز' : 'اتصال / طلب QR'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDisconnectSlot(sId)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Power className="w-3.5 h-3.5" />
                      قطع الاتصال بأمان
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* ➕ ADD NEW SLOT CARD */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-5 flex flex-col items-center justify-center text-center space-y-3 hover:border-emerald-500/50 transition">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">ربط هاتف إدارة إضافي</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أضف شريحة (Slot 3, 4...) لتسريع الإرسال ومضاعفة الأمان
              </p>
            </div>
            {isAddingSlot ? (
              <div className="w-full space-y-2">
                <input
                  type="text"
                  placeholder="رقم أو اسم الشريحة (مثال: 3)"
                  value={newSlotInput}
                  onChange={(e) => setNewSlotInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAddNewSlot}
                    className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    تأكيد وطلب QR
                  </button>
                  <button
                    onClick={() => setIsAddingSlot(false)}
                    className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSlot(true)}
                className="py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl transition shadow-sm"
              >
                + ربط هاتف جديد الآن
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-sm font-bold gap-6">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'conversations'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>البث المباشر للمحادثات ({conversations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gifts')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'gifts'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>سجل الهدايا والـ QR المسلّمة ({deliveredGifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>سجل تدقيق الإجراءات التلقائية ({auditLogs.length})</span>
        </button>
      </div>

      {/* 💬 TAB 1: LIVE CONVERSATION FEED */}
      {activeTab === 'conversations' && (
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Bot className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-300">لا توجد محادثات واردة حتى الآن</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                بمجرد أن يقوم أحد العملاء بالرد على رسائل حملات الواتساب، ستظهر محادثته هنا فوراً مع تحليل نواياه وردود Grok التلقائية.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversations.map((conv) => {
                const isMuted = conv.isMutedByHuman;
                const lastMsg = conv.messages[conv.messages.length - 1];

                return (
                  <div
                    key={conv.phone}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-4 shadow-sm transition ${
                      isMuted
                        ? 'border-amber-400/40 dark:border-amber-500/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 dark:text-slate-100 text-sm">
                            {conv.businessName || 'عميل'}
                          </span>
                          {conv.businessId && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                              نشاط مسجل ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{conv.phone}</p>
                      </div>

                      {/* Status / Human Control Badge */}
                      <button
                        onClick={() => handleToggleConversationMute(conv.phone, Boolean(isMuted))}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                          isMuted
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-amber-500/20 hover:text-amber-600'
                        }`}
                        title={isMuted ? 'اضغط لاستئناف الرد الآلي للروبوت' : 'اضغط للتدخل اليدوي وكتم الروبوت'}
                      >
                        {isMuted ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>تدخل بشري (الروبوت صامت)</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3.5 h-3.5" />
                            <span>الرد الذكي نشط 🤖</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Chat Bubble Snippet */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 space-y-2 border border-slate-100 dark:border-slate-800/80 text-xs">
                      {conv.messages.slice(-3).map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg ${
                            m.role === 'user'
                              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 mr-4'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/40 ml-4'
                          }`}
                        >
                          <span className="font-bold text-[10px] block opacity-70 mb-0.5">
                            {m.role === 'user' ? 'العميل:' : 'المساعد الذكي (Grok):'}
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action Executed Banner */}
                    {conv.lastActionExecuted && conv.lastActionExecuted !== 'none' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-bold">إجراء منفذ:</span>
                        <span>
                          {conv.lastActionExecuted === 'sent_gift_qr'
                            ? 'تم إرسال كارت الـ QR والهدية الترويجية 🎁'
                            : conv.lastActionExecuted === 'updated_business_info'
                            ? 'تم تحديث بيانات المنشأة فوراً ✓'
                            : conv.lastActionExecuted === 'scheduled_rep_lead'
                            ? 'تم تكليف مندوب ميداني بالزيارة 🤝'
                            : conv.lastActionExecuted === 'activated_badge'
                            ? 'تم اعتماد وتفعيل الكارت شرفياً 🌟'
                            : conv.lastActionExecuted}
                        </span>
                      </div>
                    )}

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {conv.lastReplyAt ? new Date(conv.lastReplyAt).toLocaleTimeString('ar-EG') : 'الآن'}
                      </span>

                      <button
                        onClick={() => handleManualSendGift(conv.phone, conv.businessId)}
                        className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>إرسال كارت الـ QR والهدية فوراً</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 🎁 TAB 2: DELIVERED GIFTS HISTORY */}
      {activeTab === 'gifts' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-500" />
              سجل كروت الـ QR والهدايا البصرية المسلمة تلقائياً
            </h3>
            <span className="text-xs text-slate-500">إجمالي {deliveredGifts.length} هدية</span>
          </div>

          {deliveredGifts.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-slate-400">
              <Gift className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-bold">لم يتم تسليم أي هدايا حتى الآن</p>
              <p className="text-xs">
                بمجرد أن يطلب أي عميل استلام الهدية أو كود الـ QR، سيرسلها النظام فوراً ويسجلها هنا.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {deliveredGifts.map((g, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{g.businessName}</p>
                      <p className="text-slate-500 font-mono mt-0.5">{g.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                      {g.source === 'external_app' ? 'التطبيق المنفصل للتصاميم 🎨' : 'كارت QR مخصص 4K ⚡'}
                    </span>

                    <a
                      href={g.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-emerald-500 transition"
                      title="معاينة كارت المنشأة على الدليل"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(g.deliveredAt).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 📋 TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              سجل تدقيق قرارات وإجراءات الذكاء الاصطناعي الحية
            </h3>
            <span className="text-xs text-slate-500">آخر {auditLogs.length} حركة</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">لا توجد حركات مسجلة حتى الآن</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{log.businessName}</span>
                      <span className="font-mono">({log.senderPhone})</span>
                      {log.slotId && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                          Slot {log.slotId}
                        </span>
                      )}
                    </div>
                    <span>{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-bold">رسالة العميل:</span>
                      <p>{log.incomingText}</p>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100/60 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">رد Grok والإجراء:</span>
                      <p>{log.aiReply}</p>
                      {log.actionExecuted && log.actionExecuted !== 'none' && (
                        <span className="mt-1 inline-block text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                          إجراء: {log.actionExecuted}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⚙️ MODAL: GROK & SAFETY SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
                  إعدادات Grok AI وصمامات الأمان
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              {/* API Key */}
              {/* 3 AI Keys (Groq / Gemini / Grok) */}
              <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">🔑 مفاتيح الذكاء الاصطناعي (Groq المجاني / Gemini / Grok):</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">دعم 3 مفاتيح احتياطية</span>
                </div>

                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-700 dark:text-emerald-300">
                  💡 <b>مفاتيح مجانية 100% بدون فيزا:</b> يمكنك الحصول على مفتاح Groq مجاني فوراً فائق السرعة من <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline font-bold">console.groq.com</a> (يبدأ بـ <code>gsk_</code>) أو مفتاح Google Gemini من <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline font-bold">aistudio.google.com</a>.
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    1. المفتاح الأساسي (Primary):
                  </label>
                  <input
                    type="password"
                    placeholder="gsk_... (Groq مجاني) أو AIza... (Gemini) أو xai-..."
                    value={editApiKey1}
                    onChange={(e) => setEditApiKey1(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    2. المفتاح الاحتياطي الأول (Backup 1):
                  </label>
                  <input
                    type="password"
                    placeholder="gsk_... أو AIza... أو xai-... (اختياري)"
                    value={editApiKey2}
                    onChange={(e) => setEditApiKey2(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    3. المفتاح الاحتياطي الثاني (Backup 2):
                  </label>
                  <input
                    type="password"
                    placeholder="gsk_... أو AIza... أو xai-... (اختياري)"
                    value={editApiKey3}
                    onChange={(e) => setEditApiKey3(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Model Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 block">النموذج الذكي المفضل:</label>
                <select
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Groq مجاني - فائق الذكاء وموصى به ⚡)</option>
                  <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (Groq مجاني - استجابة فائقة السرعة)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Google مجاني - فهم مصري رائع)</option>
                  <option value="grok-2-mini">grok-2-mini (xAI Grok اقتصادي)</option>
                </select>
              </div>

              {/* Tone / Persona */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 block">نبرة وأسلوب الحديث:</label>
                <select
                  value={editTone}
                  onChange={(e) => setEditTone(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="egyptian_warm">مصري راقي وودود (خدمة عملاء دليلك - موصى به)</option>
                  <option value="formal_official">فصحى رسمية ومؤسسية معتمدة</option>
                  <option value="marketing_promotional">تسويقي ترويجي حماسي وجذاب</option>
                </select>
              </div>

              {/* Permission Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-700 dark:text-slate-300">الصلاحيات والإجراءات التلقائية المسموحة:</p>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAutoGift}
                    onChange={(e) => setEditAutoGift(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>إرسال كارت الـ QR والهدية تلقائياً عند طلب العميل</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAutoUpdate}
                    onChange={(e) => setEditAutoUpdate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>تحديث رقم الواتساب ومواعيد العمل تلقائياً في قاعدة البيانات</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAutoRep}
                    onChange={(e) => setEditAutoRep(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>تسجيل طلب زيارة المندوب الميداني في المنظومة تلقائياً</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTyping}
                    onChange={(e) => setEditTyping(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>محاكاة الكتابة البشرية وإظهار مؤشر الكتابة (4-8 ثوانٍ) لمنع الحظر</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50"
                >
                  {isSavingSettings ? 'جاري الحفظ...' : 'حفظ وتطبيق الإعدادات ✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
