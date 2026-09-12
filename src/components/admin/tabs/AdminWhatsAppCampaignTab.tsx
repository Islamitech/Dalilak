import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MessageCircle,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Smartphone,
  Send,
  Eye,
  Sliders,
  Filter,
  Check,
  Zap,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  RotateCw,
  Settings2,
  Share2,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Laptop,
  Terminal,
  Copy,
} from 'lucide-react';
import { Business, User } from '../../../types';
import { isSuperAdmin, PRIMARY_WHATSAPP_SENDER_PHONE } from '../../../utils/permissions';
import { getDisplayDirectoryUrl } from '../../../utils/directoryUrl';
import { getApiAuthHeaders } from '../../../utils/storage';
import { triggerHaptic } from '../../../utils/haptics';

export { PRIMARY_WHATSAPP_SENDER_PHONE };

export interface BroadcastLogItem {
  businessId: string;
  businessName: string;
  phone: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  timestamp: string;
}

export interface BroadcastProgress {
  id: string;
  templateType: string;
  total: number;
  current: number;
  successful: number;
  failed: number;
  skipped: number;
  status: 'idle' | 'running' | 'paused' | 'aborted' | 'completed';
  currentBusinessName?: string;
  startedAt: string;
  finishedAt?: string;
  logs: BroadcastLogItem[];
  lastIndex?: number;
}

export interface WhatsAppSessionStatus {
  state: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  activeCampaign: BroadcastProgress | null;
}

interface AdminWhatsAppCampaignTabProps {
  currentUser: User;
  businesses: Business[];
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

// ☎️ Identifies Egyptian Landline Area Codes and Short Hotlines
export function isLandlineOrHotline(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return false;

  // Short hotlines or landlines (5 to 8 digits that don't start with 01)
  if (digits.length <= 8 && !digits.startsWith('01')) return true;

  // Egyptian landlines starting with 02, 03, 013, 040-097
  if (
    /^(?:0020|20)?(?:02|03|013|040|045|047|048|050|055|062|064|065|066|068|069|082|084|086|088|092|093|095|096|097)\d{5,8}$/.test(
      digits
    )
  ) {
    return true;
  }

  // Explicit Cairo/Giza and Alexandria landlines with 7 or 8 local digits
  if (/^(?:02|03)\d{7,8}$/.test(digits)) return true;

  return false;
}

export function isEgyptianMobile(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return /^(?:0020|20)?(?:0)?1[0125]\d{8}$/.test(digits);
}

// 🛡️ Phone validator helper (must be valid mobile, not landline, not dummy)
function isValidTargetPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return false;

  // Reject dummy placeholder numbers
  if (
    /^0+$/.test(digits) ||
    digits === '01000000000' ||
    digits === '01100000000' ||
    digits === '01200000000' ||
    digits === '01500000000' ||
    digits === '0000000000'
  ) {
    return false;
  }

  // Reject landlines and hotlines
  if (isLandlineOrHotline(digits)) {
    return false;
  }

  if (isEgyptianMobile(digits)) return true;
  if (digits.length >= 11 && !digits.startsWith('0')) return true;

  return false;
}

function formatPhoneForWaLink(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  if (!isValidTargetPhone(digits)) return null;

  if (digits.startsWith('0020')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  } else if (!digits.startsWith('20') && digits.length === 10) {
    digits = '20' + digits;
  }
  return digits;
}

// 🛡️ SAFE API FETCH HELPER (With Smart Localhost Auto-Probe & Vercel Fallback)
async function safeFetchGatewayApi(
  endpoint: string,
  options?: RequestInit,
  customBaseUrl?: string
): Promise<{ success: boolean; data?: any; error?: string; isVercelStatic?: boolean }> {
  try {
    const rawBase = (customBaseUrl || localStorage.getItem('dalelak_whatsapp_gateway_url') || '').trim();
    const baseUrl = rawBase ? rawBase.replace(/\/$/, '') : '';
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

    let res: Response;
    let rawText = '';

    try {
      res = await fetch(url, options);
      rawText = await res.text();
    } catch (fetchErr: any) {
      // If primary relative request failed to connect and no customBaseUrl was set,
      // automatically attempt to probe local PC server at http://localhost:3001
      if (!baseUrl) {
        try {
          const localUrl = `http://localhost:3001${endpoint}`;
          const localRes = await fetch(localUrl, options);
          const localText = await localRes.text();
          if (localText && !localText.trim().startsWith('<!doctype') && !localText.trim().startsWith('<html')) {
            const parsed = JSON.parse(localText);
            localStorage.setItem('dalelak_whatsapp_gateway_url', 'http://localhost:3001');
            return {
              success: localRes.ok && parsed.success !== false,
              data: parsed,
              error: parsed.error,
            };
          }
        } catch {
          // Localhost not active
        }
      }
      throw fetchErr;
    }

    // If request returned empty or static HTML (e.g. Vercel SPA) and no customBaseUrl was set,
    // probe local PC server at http://localhost:3001 before failing
    if (
      !baseUrl &&
      (!rawText ||
        rawText.trim().length === 0 ||
        res.status === 405 ||
        res.status === 404 ||
        rawText.trim().startsWith('<!doctype') ||
        rawText.trim().startsWith('<html'))
    ) {
      try {
        const localUrl = `http://localhost:3001${endpoint}`;
        const localRes = await fetch(localUrl, options);
        const localText = await localRes.text();
        if (localText && !localText.trim().startsWith('<!doctype') && !localText.trim().startsWith('<html')) {
          const parsed = JSON.parse(localText);
          localStorage.setItem('dalelak_whatsapp_gateway_url', 'http://localhost:3001');
          return {
            success: localRes.ok && parsed.success !== false,
            data: parsed,
            error: parsed.error,
          };
        }
      } catch {
        // Localhost not active
      }

      return {
        success: false,
        isVercelStatic: true,
        error:
          'سيرفر Baileys الآلي يتطلب تشغيل خادم المنصة محلياً على هذا الحاسوب (عبر npm run dev أو الرابط المحلي http://localhost:3001). يمكنك استخدام «الوضع المباشر للكمبيوتر عبر WhatsApp Web» فوراً بنقرة واحدة.',
      };
    }

    if (!rawText || rawText.trim().length === 0) {
      return {
        success: false,
        error: `استجابة فارغة من السيرفر (كود ${res.status})`,
      };
    }

    if (rawText.trim().startsWith('<!doctype') || rawText.trim().startsWith('<html')) {
      return {
        success: false,
        isVercelStatic: true,
        error:
          'استجاب السيرفر بصفحة واجهة ساكنة. يرجى تفعيل «الوضع المباشر للحاسوب عبر WhatsApp Web» أو تشغيل الخادم محلياً.',
      };
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        success: res.ok && parsed.success !== false,
        data: parsed,
        error: parsed.error,
      };
    } catch {
      return {
        success: false,
        error: `استجابة غير صالحة من السيرفر (كود ${res.status})`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message?.includes('Failed to fetch')
        ? 'تعذر الاتصال بسيرفر الواتساب. تأكد من تشغيل السيرفر على هذا الحاسوب (npm run dev) أو استخدم «الوضع المباشر السريع للكمبيوتر».'
        : err?.message || 'خطأ في الاتصال بالسيرفر',
    };
  }
}

// 📋 Pre-configured high-conversion official message templates
const TEMPLATE_DEFINITIONS = [
  {
    id: 'honorary_invitation',
    name: 'دعوة إدراج شرفي رسمي مجاني (0.00$)',
    badge: 'موصى به للمستوردين من Google',
    badgeColor: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    description: 'دعوة ترحيبية رسمية لإعلام صاحب المنشأة بإدراجه كشريك استراتيجي مجاناً في دليل المحافظة.',
    defaultText: `السلام عليكم ورحمة الله وبركاته،

تحية طيبة لإدارة {name} المحترمين 💐

يسعدنا إعلامكم بأنه تم اختيار وتوثيق منشأتكم {name} رسميًا كأحد الأنشطة المميزة ضمن:
🌟 *دليل خدمات المحافظة الذكي* (منصة دليلك)

✨ *مزايا إدراجكم الشرفي المجاني بالكامل (0.00 ج.م):*
1. ظهور رسمي موثق لرواد المنطقة الباحثين عن خدماتكم.
2. صفحة رقمية متكاملة تتضمن الاتصال المباشر وموقعكم الجغرافي وساعات العمل.
3. دعم كامل للربط المباشر مع خرائط Google.

🔗 *يمكنكم معاينة بطاقة منشأتكم الرقمية عبر الرابط المعتمد التالي:*
{url}

لأي استفسار أو تحديث لبيانات العمل وساعات النشاط، يسعدنا تواصلكم المباشر.
مع خالص التحية،
*فريق إدارة منصة دليلك المعتمد*`,
  },
  {
    id: 'directory_live',
    name: 'إشعار نشر وتفعيل الصفحة بالدليل',
    badge: 'للأنشطة المكتملة',
    badgeColor: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    description: 'إشعار مباشر باكتمال تجهيز ونشر صفحة النشاط وظهورها للجمهور مع رابط مباشر للمعاينة.',
    defaultText: `أهلاً وسهلاً بكم {owner} 💐
إدارة {name} الكرام،

يسرنا إبلاغكم بأن صفحتكم الرسمية في *دليل المحافظة* باتت *نشطة ومتاحة للجمهور الآن* 🚀

📍 *الموقع:* {location}
🌐 *رابط ملفكم المباشر في الدليل:*
{url}

يمكنكم مشاركة الرابط مع عملائكم واستقبال الاتصالات وطلبات الاتجاهات مباشرة.
نتمنى لكم دوام التوفيق والنجاح!
*منصة دليلك*`,
  },
  {
    id: 'welcome_invoice',
    name: 'إشعار الفاتورة والاعتماد الشرفي الموثق',
    badge: 'توثيق مالي ورسمي',
    badgeColor: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    description: 'إشعار توثيق رقمي وفاتورة رمزية صفرية تثبت الاعتماد الرسمي بالمحافظة.',
    defaultText: `السادة إدارة {name}،
تحية طيبة،

تم إصدار شهادة التوثيق والإدراج الرسمية لمنشأتكم في *منصة دليلك*:
- المنشأة: {name}
- الموقع: {location}
- نوع الاعتماد: إدراج شرفي معتمد (مجاني 0.00 ج.م)

🔗 رابط المعاينة والتحقق:
{url}

نشكر ثقتكم ونتطلع دائماً لخدمتكم بأفضل معايير الجودة.
*إدارة الشؤون الإدارية - دليلك*`,
  },
  {
    id: 'custom',
    name: 'رسالة مخصصة (نص حر مع متغيرات ذكية)',
    badge: 'تخصيص كامل',
    badgeColor: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
    description: 'اكتب نصك الخاص مع إمكانية استخدام المتغيرات: {name}، {owner}، {location}، {url}',
    defaultText: `تحية طيبة لإدارة {name}،

يسعدنا التواصل معكم من منصة دليلك...
رابط ملفكم: {url}`,
  },
];

export const AdminWhatsAppCampaignTab: React.FC<AdminWhatsAppCampaignTabProps> = ({
  currentUser,
  businesses,
  onShowNotification,
}) => {
  // ── DUAL ENGINE MODE STATE ──
  // Auto-detect if currently running on static hosting (e.g. Vercel) to offer Mobile Direct Mode natively
  const isLikelyStaticHosting = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname.toLowerCase();
    return h.includes('vercel.app') || h.includes('dalilaak.com');
  }, []);

  // Device detection: PC / Laptop vs Mobile phone
  const isDesktop = useMemo(() => {
    if (typeof navigator === 'undefined') return true;
    return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const [dispatchMode, setDispatchMode] = useState<'server_gateway' | 'mobile_direct'>(() => {
    const saved = localStorage.getItem('dalelak_whatsapp_dispatch_mode');
    if (saved === 'server_gateway' || saved === 'mobile_direct') return saved;
    return isLikelyStaticHosting ? 'mobile_direct' : 'server_gateway';
  });

  const handleModeChange = (mode: 'server_gateway' | 'mobile_direct') => {
    setDispatchMode(mode);
    localStorage.setItem('dalelak_whatsapp_dispatch_mode', mode);
  };

  // Custom Gateway Server URL config (e.g. for connecting mobile to PC local server)
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [gatewayCustomUrl, setGatewayCustomUrl] = useState<string>(() => {
    return localStorage.getItem('dalelak_whatsapp_gateway_url') || '';
  });

  // Server Session & Polling state
  const [sessionStatus, setSessionStatus] = useState<WhatsAppSessionStatus>({
    state: 'disconnected',
    qrCodeUrl: null,
    connectedUser: null,
    lastActive: null,
    activeCampaign: null,
  });
  const [isServerReachable, setIsServerReachable] = useState<boolean | null>(null);
  const [serverNoticeMessage, setServerNoticeMessage] = useState<string | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);
  const [isAbortingCampaign, setIsAbortingCampaign] = useState(false);
  const [isResumingCampaign, setIsResumingCampaign] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasCopiedCommand, setHasCopiedCommand] = useState(false);
  const [skipRecentlyContacted, setSkipRecentlyContacted] = useState(true);

  // Throttling & Pacing state
  const [pacingPreset, setPacingPreset] = useState<'balanced' | 'ultra_safe' | 'fast' | 'custom'>('balanced');
  const [minDelaySeconds, setMinDelaySeconds] = useState<number>(10);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState<number>(20);

  // Audience Targeting state
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'honorary' | 'verified'>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('honorary_invitation');
  const [customText, setCustomText] = useState<string>(TEMPLATE_DEFINITIONS[0].defaultText);
  const [previewBizIndex, setPreviewBizIndex] = useState<number>(0);

  // ── MOBILE DIRECT QUEUE STATE ──
  const [mobileQueueIndex, setMobileQueueIndex] = useState<number>(0);
  const [sentBusinessIds, setSentBusinessIds] = useState<Set<string>>(() => new Set());
  const [skippedBusinessIds, setSkippedBusinessIds] = useState<Set<string>>(() => new Set());

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply Pacing Preset
  const handleSelectPreset = (preset: 'balanced' | 'ultra_safe' | 'fast' | 'custom') => {
    setPacingPreset(preset);
    if (preset === 'balanced') {
      setMinDelaySeconds(10);
      setMaxDelaySeconds(20);
    } else if (preset === 'ultra_safe') {
      setMinDelaySeconds(15);
      setMaxDelaySeconds(30);
    } else if (preset === 'fast') {
      setMinDelaySeconds(6);
      setMaxDelaySeconds(12);
    }
  };

  // Sync custom text when changing template
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = TEMPLATE_DEFINITIONS.find((t) => t.id === templateId);
    if (tmpl) {
      setCustomText(tmpl.defaultText);
    }
  };

  // Save Gateway URL
  const handleSaveGatewayUrl = (url: string) => {
    setGatewayCustomUrl(url);
    localStorage.setItem('dalelak_whatsapp_gateway_url', url.trim());
    fetchStatus();
  };

  // Safe Fetch Status from Server
  const fetchStatus = useCallback(async () => {
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/status', {
        headers: getApiAuthHeaders(),
      });

      if (res.success && res.data?.status) {
        setSessionStatus(res.data.status);
        setIsServerReachable(true);
        setServerNoticeMessage(null);
      } else {
        setIsServerReachable(false);
        if (res.isVercelStatic) {
          setServerNoticeMessage(res.error || null);
        }
      }
    } catch {
      setIsServerReachable(false);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    fetchStatus();

    const intervalMs =
      sessionStatus.activeCampaign?.status === 'running' || sessionStatus.activeCampaign?.status === 'paused'
        ? 1500
        : sessionStatus.state === 'qr_ready' || sessionStatus.state === 'connecting'
        ? 2500
        : 8000;

    pollTimerRef.current = setInterval(fetchStatus, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchStatus, sessionStatus.state, sessionStatus.activeCampaign?.status]);

  // Connect WhatsApp Gateway
  const handleConnect = async () => {
    triggerHaptic();
    setIsConnecting(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/connect', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (res.success && res.data?.status) {
        setSessionStatus(res.data.status);
        setIsServerReachable(true);
        setServerNoticeMessage(null);
        onShowNotification?.('تم بدء تشغيل محرك الواتساب، انتظر ظهور رمز الـ QR أو استعادة الجلسة', 'info');
      } else {
        if (res.isVercelStatic) {
          onShowNotification?.(
            isDesktop
              ? 'تنبيه: سيرفر Baileys يتطلب تشغيل السيرفر محلياً على الحاسوب، أو استخدم الوضع المباشر (WhatsApp Web) للإرسال الفوري بدون سيرفر!'
              : 'سيرفر Baileys يتطلب تشغيل بيئة Node.js (أو تفعيل الوضع المباشر للجوال أدناه)',
            'warning'
          );
          setServerNoticeMessage(res.error || null);
        } else {
          onShowNotification?.(res.error || 'فشل الاتصال بمحرك الواتساب', 'error');
        }
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في الاتصال بالسيرفر', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect WhatsApp Gateway
  const handleDisconnect = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في قطع الاتصال وحذف جلسة الواتساب؟ سيتطلب الدخول مجدداً مسح الـ QR.')) {
      return;
    }
    triggerHaptic();
    setIsDisconnecting(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (res.success) {
        setSessionStatus({
          state: 'disconnected',
          qrCodeUrl: null,
          connectedUser: null,
          lastActive: null,
          activeCampaign: null,
        });
        onShowNotification?.('تم قطع الاتصال وحذف الجلسة بنجاح', 'success');
      } else {
        onShowNotification?.(res.error || 'تعذر قطع الاتصال', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في السيرفر', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Filtered Target Businesses
  const { targetBusinesses, validPhoneCount, landlineCount, dummyPhoneCount, governorateList, categoryList } = useMemo(() => {
    const govs = new Set<string>();
    const cats = new Set<string>();

    businesses.forEach((b) => {
      if (b.governorate) govs.add(b.governorate);
      if (b.category) cats.add(b.category);
    });

    const filtered = businesses.filter((b) => {
      if ((b as any).isDeleted) return false;

      if (audienceFilter === 'honorary') {
        const isHonorary = b.isFeeExempt || b.isAlreadyOnGoogle || b.registrationType === 'already_on_google';
        if (!isHonorary) return false;
      } else if (audienceFilter === 'verified') {
        if (b.verificationStatus !== 'verified') return false;
      }

      if (governorateFilter !== 'all' && b.governorate !== governorateFilter) {
        return false;
      }

      if (categoryFilter !== 'all' && b.category !== categoryFilter) {
        return false;
      }

      return true;
    });

    let valids = 0;
    let landlines = 0;
    let dummies = 0;
    filtered.forEach((b) => {
      const p = b.phone || b.ownerPhone;
      if (isValidTargetPhone(p)) {
        valids++;
      } else if (isLandlineOrHotline(p)) {
        landlines++;
      } else {
        dummies++;
      }
    });

    return {
      targetBusinesses: filtered,
      validPhoneCount: valids,
      landlineCount: landlines,
      dummyPhoneCount: dummies,
      governorateList: Array.from(govs),
      categoryList: Array.from(cats),
    };
  }, [businesses, audienceFilter, governorateFilter, categoryFilter]);

  // Interpolator for a specific business
  const compileMessageForBiz = useCallback(
    (biz: Business) => {
      const name = biz.nameAr || biz.name || 'المنشأة الكريمة';
      const owner = biz.ownerName || 'صاحب المنشأة';
      const location = [biz.street, biz.city, biz.governorate].filter(Boolean).join(' - ') || 'المحافظة';
      // 🛡️ STRICT PRIVACY & PUBLIC DIRECTORY ROUTING:
      // NEVER leak internal admin app origin (e.g. dalilak-two.vercel.app).
      // Always attach the official PUBLIC Directory URL specific to this business (https://www.dalilaak.com/biz/...)
      const url = getDisplayDirectoryUrl(biz);

      let text = customText || '';
      text = text.replace(/{name}/g, name);
      text = text.replace(/{owner}/g, owner);
      text = text.replace(/{location}/g, location);
      text = text.replace(/{url}/g, url);
      return text;
    },
    [customText]
  );

  // Live Message Preview interpolator
  const sampleBiz = targetBusinesses[previewBizIndex] || businesses[0] || {
    id: 'sample',
    nameAr: 'مستشفى السلام التخصصي',
    ownerName: 'د. محمود حسن',
    city: 'الزقازيق',
    governorate: 'الشرقية',
    phone: '01012345678',
  };

  const previewMessage = useMemo(() => {
    return compileMessageForBiz(sampleBiz);
  }, [compileMessageForBiz, sampleBiz]);

  // Current Mobile Queue Business
  const currentMobileBiz: Business | undefined = targetBusinesses[mobileQueueIndex];
  const currentMobilePhone = currentMobileBiz?.phone || currentMobileBiz?.ownerPhone;
  const isCurrentMobilePhoneValid = isValidTargetPhone(currentMobilePhone);
  const isCurrentMobilePhoneLandline = isLandlineOrHotline(currentMobilePhone);
  const currentMobileWaDigits = formatPhoneForWaLink(currentMobilePhone);

  // Launch Server Gateway Campaign
  const handleLaunchCampaign = async () => {
    if (sessionStatus.state !== 'connected') {
      onShowNotification?.('محرك الواتساب غير متصل. يرجى مسح رمز الـ QR أولاً وتأكيد الاتصال.', 'warning');
      return;
    }
    if (targetBusinesses.length === 0) {
      onShowNotification?.('لا توجد أي منشآت مستهدفة تطابق الفلاتر المحددة.', 'warning');
      return;
    }
    if (validPhoneCount === 0) {
      onShowNotification?.('لا توجد أرقام هواتف صالحة بين المنشآت المحددة (جميعها أرقام وهمية).', 'error');
      return;
    }

    triggerHaptic();
    setIsStartingCampaign(true);
    setShowConfirmModal(false);

    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/broadcast', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType: selectedTemplate,
          customText: selectedTemplate === 'custom' ? customText : undefined,
          targetBusinessIds: targetBusinesses.map((b) => b.id),
          targetBusinesses: targetBusinesses.map((b) => ({
            id: b.id,
            name: b.name,
            nameAr: b.nameAr,
            phone: b.phone,
            ownerPhone: b.ownerPhone,
            ownerName: b.ownerName,
            governorate: b.governorate,
            city: b.city,
            category: b.category,
            packageId: b.packageId,
            verificationStatus: b.verificationStatus,
            invoiceNumber: (b as any).invoiceNumber,
            isFeeExempt: (b as any).isFeeExempt,
            isAlreadyOnGoogle: (b as any).isAlreadyOnGoogle,
            registrationType: (b as any).registrationType,
            photos: b.photos,
            coverPhoto: (b as any).coverPhoto,
            logo: b.logo,
          })),
          skipRecentlyContacted,
          minDelaySeconds,
          maxDelaySeconds,
        }),
      });

      if (res.success) {
        onShowNotification?.(res.data?.message || 'تم إطلاق حملة المراسلة بنجاح في الخلفية!', 'success');
        fetchStatus();
      } else {
        onShowNotification?.(res.error || 'تعذر إطلاق الحملة', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ أثناء بدء الحملة', 'error');
    } finally {
      setIsStartingCampaign(false);
    }
  };

  // Emergency Abort Broadcast
  const handleAbortCampaign = async () => {
    if (!confirm('🛑 تحذير طارئ: هل تريد إيقاف حملة الواتساب فوراً وتجميد طابور الإرسال؟')) {
      return;
    }
    triggerHaptic();
    setIsAbortingCampaign(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/broadcast-abort', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (res.success) {
        onShowNotification?.(res.data?.message || 'تم تفعيل زر الطوارئ وإيقاف الحملة بنجاح', 'info');
        fetchStatus();
      } else {
        onShowNotification?.(res.error || 'فشل إيقاف الحملة', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في إيقاف الحملة', 'error');
    } finally {
      setIsAbortingCampaign(false);
    }
  };

  // Resume Paused Campaign
  const handleResumeCampaign = async () => {
    triggerHaptic();
    setIsResumingCampaign(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/broadcast-resume', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (res.success) {
        onShowNotification?.(res.data?.message || 'تم استئناف الحملة بنجاح ⏯️', 'success');
        fetchStatus();
      } else {
        onShowNotification?.(res.error || 'فشل استئناف الحملة', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في استئناف الحملة', 'error');
    } finally {
      setIsResumingCampaign(false);
    }
  };

  // 📲 DIRECT DISPATCH HANDLER (Universal for PC WhatsApp Web & Mobile)
  const handleMobileSendCurrent = () => {
    if (!currentMobileBiz) return;
    if (!isCurrentMobilePhoneValid || !currentMobileWaDigits) {
      onShowNotification?.('رقم الهاتف مسجل كأصفار أو غير صالح للإرسال، يفضل تخطيه', 'warning');
      return;
    }

    triggerHaptic();
    const msg = compileMessageForBiz(currentMobileBiz);
    const encodedText = encodeURIComponent(msg);
    // On Desktop PC, open WhatsApp Web directly; on mobile, open native app
    const waUrl = isDesktop
      ? `https://web.whatsapp.com/send?phone=${currentMobileWaDigits}&text=${encodedText}`
      : `https://api.whatsapp.com/send?phone=${currentMobileWaDigits}&text=${encodedText}`;

    // Mark as sent in session set
    setSentBusinessIds((prev) => new Set(prev).add(currentMobileBiz.id));

    // Open WhatsApp natively on device / browser
    window.open(waUrl, '_blank');

    onShowNotification?.(
      `تم فتح محادثة ${isDesktop ? 'WhatsApp Web' : 'WhatsApp'} لـ: ${currentMobileBiz.nameAr || currentMobileBiz.name}`,
      'success'
    );

    // Auto-advance to next if not at end
    if (mobileQueueIndex < targetBusinesses.length - 1) {
      setMobileQueueIndex((i) => i + 1);
    }
  };

  const handleMobileSkipCurrent = () => {
    if (!currentMobileBiz) return;
    triggerHaptic();
    setSkippedBusinessIds((prev) => new Set(prev).add(currentMobileBiz.id));
    if (mobileQueueIndex < targetBusinesses.length - 1) {
      setMobileQueueIndex((i) => i + 1);
    }
  };

  const isCampaignRunning = sessionStatus.activeCampaign?.status === 'running';
  const isCampaignPaused = sessionStatus.activeCampaign?.status === 'paused';
  const campaign = sessionStatus.activeCampaign;
  const progressPercent = campaign && campaign.total > 0 ? Math.round((campaign.current / campaign.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn text-[var(--text-primary)]" dir="rtl">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام المراسلة السيادي المباشر • 0.00$ مجاني بالكامل</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>📢 حملات WhatsApp الجماعية الذكية</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              إرسال مباشر بنقرة واحدة لكافة المنشآت المسجلة والشرفية المستوردة مع{' '}
              <strong className="text-amber-400">صمام الأمان الذكي ضد الحظر (Anti-Ban Jitter)</strong> أو عبر{' '}
              <strong className="text-emerald-400">الوضع المباشر السريع للجوال</strong> بدون تكاليف.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setShowServerSettings(!showServerSettings)}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="إعدادات خادم البوابة"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">إعدادات السيرفر</span>
            </button>

            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
              title="تحديث الحالة لحظياً"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── COLLAPSIBLE SERVER CONNECTIVITY SETTINGS ── */}
      {showServerSettings && (
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-sm space-y-4 animate-slideDown text-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2 font-black text-sm">
              <Settings2 className="w-4 h-4 text-amber-500" />
              <span>إعدادات اتصال سيرفر الواتساب (Remote Gateway URL)</span>
            </div>
            <div className="flex items-center gap-2">
              {isServerReachable ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black border border-emerald-500/30">
                  🟢 السيرفر متصل وجاهز
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black border border-amber-500/30">
                  🔴 السيرفر غير نشط محلياً
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-[var(--text-secondary)] block">
              رابط خادم Node.js المخصص (إذا كنت تتصفح من الجوال عبر Wi-Fi أو نفق سحابي):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gatewayCustomUrl}
                onChange={(e) => setGatewayCustomUrl(e.target.value)}
                placeholder="مثال: http://192.168.1.15:3001 أو اتركه فارغاً للافتراضي"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => handleSaveGatewayUrl(gatewayCustomUrl)}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer text-xs"
              >
                حفظ واختبار
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              * استضافة Vercel تعمل كواجهة ساكنة؛ محرك Baileys يعمل داخل خادم المنصة (`server.ts`). عند استخدام الحاسوب أو الجوال،
              يمكنك كتابة IP أو تشغيل الخادم محلياً للربط الآلي، أو التبديل للوضع المباشر (WhatsApp Web / الجوال) بدون خادم.
            </p>
          </div>
        </div>
      )}

      {/* ── DUAL-ENGINE MODE TOGGLE SELECTOR ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-2 text-xs font-black text-[var(--text-secondary)]">
          <span>اختر مسار الإرسال المفضل:</span>
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1 sm:max-w-xl">
          <button
            type="button"
            onClick={() => handleModeChange('mobile_direct')}
            className={`py-2.5 px-3 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              dispatchMode === 'mobile_direct'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-white/5 text-[var(--text-secondary)] hover:text-white border border-[var(--border-color)]'
            }`}
          >
            {isDesktop ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            <span>{isDesktop ? 'الوضع المباشر للكمبيوتر (WhatsApp Web • فوري) 💻' : 'الوضع المباشر للجوال (100% بدون خادم) 📲'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('server_gateway')}
            className={`py-2.5 px-3 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              dispatchMode === 'server_gateway'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white/5 text-[var(--text-secondary)] hover:text-white border border-[var(--border-color)]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>سيرفر Baileys الآلي (صمام الأمان) ⚡</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: DIRECT DISPATCH ENGINE (100% CLIENT-SIDE ON VERCEL & SMARTPHONE/DESKTOP) ── */}
      {dispatchMode === 'mobile_direct' && (
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  {isDesktop ? <Laptop className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  <span>
                    {isDesktop
                      ? 'يعمل مباشرة عبر متصفح الكمبيوتر (WhatsApp Web) بنقرة واحدة ودون الحاجة لتشغيل أي سيرفر'
                      : 'جاهز للعمل من أي هاتف وشبكة 5G دون الحاجة لتشغيل جهاز الكمبيوتر'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black">
                  <span>📱 رقم الإرسال الأساسي المعتمد:</span>
                  <span className="font-mono text-white tracking-wider" dir="ltr">{PRIMARY_WHATSAPP_SENDER_PHONE}</span>
                </div>
              </div>
              <h2 className="text-xl font-black text-white">
                {isDesktop
                  ? 'طابور الإرسال المباشر الذكي عبر متصفح الكمبيوتر (WhatsApp Web)'
                  : 'طابور الإرسال المباشر الذكي عبر تطبيق WhatsApp'}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-300">التقدم في الطابور:</span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-black">
                {targetBusinesses.length > 0 ? mobileQueueIndex + 1 : 0} / {targetBusinesses.length}
              </span>
            </div>
          </div>

          {/* Current Mobile Business Card */}
          {currentMobileBiz ? (
            <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-3xl p-6 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs">
                      #{mobileQueueIndex + 1}
                    </span>
                    <h3 className="font-black text-lg text-white">
                      {currentMobileBiz.nameAr || currentMobileBiz.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                    <span>المسؤول: {currentMobileBiz.ownerName || 'غير محدد'}</span>
                    <span>•</span>
                    <span>الموقع: {[currentMobileBiz.city, currentMobileBiz.governorate].filter(Boolean).join(' - ')}</span>
                  </p>
                </div>

                <div className="text-right sm:text-left">
                  <p className="text-[11px] text-[var(--text-secondary)]">رقم هاتف المنشأة:</p>
                  <p
                    className={`font-mono text-base font-black ${
                      isCurrentMobilePhoneValid ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                    dir="ltr"
                  >
                    {currentMobilePhone || 'لا يوجد هاتف'}
                  </p>
                  {!isCurrentMobilePhoneValid && (
                    <span className="text-[10px] text-amber-400 font-bold">
                      {isCurrentMobilePhoneLandline
                        ? '☎️ رقم أرضي / خط ساخن لا يدعم واتساب - يفضل تخطيه'
                        : '⚠️ رقم وهمي أو غير صالح - يفضل تخطيه'}
                    </span>
                  )}
                </div>
              </div>

              {/* Message Preview Container */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-bold">
                  <span>معاينة نص الرسالة الجاهزة للإرسال:</span>
                  <span className="text-[11px] text-amber-400">القالب: {selectedTemplate}</span>
                </div>
                <div className="bg-[#0b141a] rounded-2xl p-4 border border-[#202c33] text-xs text-emerald-50 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                  {compileMessageForBiz(currentMobileBiz)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleMobileSendCurrent}
                  disabled={!isCurrentMobilePhoneValid}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm sm:text-base transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>
                    {isDesktop
                      ? `إرسال إلى ${currentMobileBiz.nameAr || currentMobileBiz.name} عبر WhatsApp Web 💻`
                      : `إرسال إلى ${currentMobileBiz.nameAr || currentMobileBiz.name} عبر WhatsApp 💬`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleMobileSkipCurrent}
                  className="py-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>تخطي للنشاط التالي ⏭️</span>
                </button>
              </div>

              {/* Queue Controls Bar */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setMobileQueueIndex((i) => Math.max(0, i - 1))}
                  disabled={mobileQueueIndex === 0}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>النشاط السابق</span>
                </button>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-emerald-400 font-bold">تم إرساله بالجلسة: {sentBusinessIds.size}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">مستبعد: {skippedBusinessIds.size}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileQueueIndex((i) => Math.min(targetBusinesses.length - 1, i + 1))}
                  disabled={mobileQueueIndex >= targetBusinesses.length - 1}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <span>النشاط التالي</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white/5 rounded-3xl">
              لا توجد منشآت تطابق الفلاتر المحددة حالياً.
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: BAILEYS SERVER GATEWAY SOCKET & PACING CONFIG ── */}
      {dispatchMode === 'server_gateway' && (
        <>
          {serverNoticeMessage && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border-2 border-amber-500/30 text-xs text-slate-200 space-y-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  {isDesktop ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-black text-sm text-amber-400">
                      دليل تشغيل سيرفر الواتساب الآلي (Vercel vs Local Node.js)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                      بنية الاستضافة السحابية
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    موقع دليلك مرفوع على Vercel كواجهة ساكنة (Static Web App)، بينما يحتاج محرك Baileys الآلي إلى بيئة تشغيل Node.js حقيقية للحفاظ على جلسة الواتساب في الخلفية. اختر الخيار الأنسب لك:
                  </p>
                </div>
              </div>

              {/* TWO PATHS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* PATH 1: Direct WhatsApp Web / Mobile (Instant, Zero Server) */}
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                      {isDesktop ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      <span>المسار الأول (فوري وبدون أي تشغيل سيرفر):</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {isDesktop
                        ? 'إرسال مباشر من متصفح الكمبيوتر عبر WhatsApp Web الرسمي؛ يفتح لك المحادثة المعبأة فوراً بنقرة واحدة دون الحاجة لتشغيل أي سيرفر.'
                        : 'إرسال مباشر من الهاتف عبر تطبيق WhatsApp المباشر دون الحاجة لأي خوادم خارجية.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleModeChange('mobile_direct')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                  >
                    {isDesktop ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    <span>{isDesktop ? 'التبديل الآن إلى WhatsApp Web للكمبيوتر 💻' : 'التبديل للوضع المباشر للجوال 📲'}</span>
                  </button>
                </div>

                {/* PATH 2: Run Local Baileys Server */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                      <Terminal className="w-4 h-4" />
                      <span>المسار الثاني (تشغيل السيرفر الآلي على جهازك):</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      إذا كنت على جهاز الكمبيوتر وتريد الإرسال الجماعي الآلي بالخلفية: اضغط مرتين على ملف <span className="font-mono text-amber-300 font-bold">تشغيل_سيرفر_الواتساب.bat</span> في مجلد المشروع، أو نفّذ الأمر التالي:
                    </p>
                    <div className="flex items-center justify-between gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-emerald-400 text-xs">
                      <span>npm run dev</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('npm run dev');
                          setHasCopiedCommand(true);
                          setTimeout(() => setHasCopiedCommand(false), 2000);
                        }}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{hasCopiedCommand ? 'تم النسخ!' : 'نسخ'}</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      fetchStatus();
                      onShowNotification?.('جاري إعادة فحص الاتصال بمحرك السيرفر المحلي...', 'info');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة فحص الاتصال بالسيرفر الآن 🔄</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CARD 1: WHATSAPP WEB GATEWAY STATUS */}
            <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-sm sm:text-base">بوابة ربط WhatsApp Web</h2>
                      <p className="text-[11px] text-[var(--text-secondary)]">سيرفر Baileys الخفيف المدمج</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {sessionStatus.state === 'connected' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-black animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        متصل ونشط
                      </span>
                    ) : sessionStatus.state === 'qr_ready' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 text-xs font-black">
                        <QrCode className="w-3.5 h-3.5" />
                        امسح رمز QR
                      </span>
                    ) : sessionStatus.state === 'connecting' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-black">
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        جارٍ الاتصال...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 text-xs font-black">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        غير متصل
                      </span>
                    )}
                  </div>
                </div>

                {/* CONNECTED STATE DETAILS */}
                {sessionStatus.state === 'connected' && sessionStatus.connectedUser && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-emerald-400 font-bold">الحساب المتصل حالياً بالإرسال:</p>
                        <p className="text-lg font-black text-white font-mono" dir="ltr">
                          {sessionStatus.connectedUser.phone}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {sessionStatus.connectedUser.phone.includes(PRIMARY_WHATSAPP_SENDER_PHONE) ||
                          sessionStatus.connectedUser.phone.includes('1556221141')
                            ? '⭐ هاتف إدارة المنصة الأساسي المعتمد'
                            : sessionStatus.connectedUser.name || 'إدارة دليلك'}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-inner">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="text-[11px] text-[var(--text-secondary)] border-t border-emerald-500/20 pt-2 flex items-center justify-between">
                      <span>آخر نشاط موثق:</span>
                      <span className="font-mono" dir="ltr">
                        {sessionStatus.lastActive ? new Date(sessionStatus.lastActive).toLocaleTimeString('ar-EG') : 'الآن'}
                      </span>
                    </div>
                  </div>
                )}

                {/* QR CODE READY STATE */}
                {sessionStatus.state === 'qr_ready' && sessionStatus.qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-blue-500/30 rounded-2xl space-y-3 text-center">
                    <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-emerald-500">
                      <img
                        src={sessionStatus.qrCodeUrl}
                        alt="WhatsApp QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="font-black text-white">
                        افتح واتساب على هاتف الإدارة ({PRIMARY_WHATSAPP_SENDER_PHONE}) &gt; الأجهزة المرتبطة &gt; ربط جهاز
                      </p>
                      <p className="text-[var(--text-secondary)]">وجّه الكاميرا نحو الرمز أعلاه لتفعيل الإرسال الجماعي فوراً</p>
                    </div>
                  </div>
                )}

                {/* DISCONNECTED / CONNECTING PROMPT */}
                {sessionStatus.state === 'disconnected' && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>المحرك غير مرتبط بهاتف الإدارة حالياً</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 text-slate-200 font-mono text-[11px] font-bold" dir="ltr">
                        المعتمد: {PRIMARY_WHATSAPP_SENDER_PHONE}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      اضغط على زر <strong>"ربط هاتف الإدارة (مسح QR)"</strong> بالأسفل لتوليد كود الربط السريع لهاتف المنصة المعتمد (<strong>{PRIMARY_WHATSAPP_SENDER_PHONE}</strong>). الجلسة تُحفظ
                      محلياً ولا تتطلب إعادة المسح في كل مرة.
                    </p>
                    {!isServerReachable && (
                      <p className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
                        💡 <strong>تنبيه:</strong> إذا كنت تتصفح من رابط Vercel السحابي، يتطلب هذا الوضع تشغيل خادم المنصة محلياً (<code className="font-mono text-white">npm run dev</code>)، أو يمكنك التبديل للوضع المباشر للكمبيوتر بالأعلى للإرسال فوراً بدون سيرفر.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[var(--border-color)]">
                {sessionStatus.state === 'connected' ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting || isCampaignRunning}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 transition-all font-black text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isDisconnecting ? 'جارٍ قطع الاتصال...' : 'قطع الاتصال وحذف الجلسة'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isConnecting ? 'جارٍ توليد الرمز...' : 'ربط هاتف الإدارة (توليد / مسح QR)'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* CARD 2: ANTI-BAN THROTTLING VALVE SETTINGS */}
            <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-sm sm:text-base">صمام الأمان الذكي ضد الحظر (Anti-Ban Jitter)</h2>
                      <p className="text-[11px] text-[var(--text-secondary)]">محاكاة السلوك البشري الطبيعي لتفادي حظر الرقم</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                    حماية مفعلة 🛡️
                  </span>
                </div>

                {/* Pacing Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-[var(--text-secondary)]">اختر معدل التباعد الزمني بين الرسائل:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('balanced')}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        pacingPreset === 'balanced'
                          ? 'bg-amber-500/15 border-amber-500 text-[var(--text-primary)] shadow-sm'
                          : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-xs">
                        <span>متزن وآمن (موصى به)</span>
                        {pacingPreset === 'balanced' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <p className="text-[11px] text-amber-400 mt-1 font-mono font-bold">10 - 20 ثانية عشوائي</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">الحل الأمثل للحملات المعتادة</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset('ultra_safe')}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        pacingPreset === 'ultra_safe'
                          ? 'bg-emerald-500/15 border-emerald-500 text-[var(--text-primary)] shadow-sm'
                          : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-xs">
                        <span>فائق الأمان</span>
                        {pacingPreset === 'ultra_safe' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <p className="text-[11px] text-emerald-400 mt-1 font-mono font-bold">15 - 30 ثانية عشوائي</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">للحملات الضخمة &gt; 500 منشأة</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset('fast')}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        pacingPreset === 'fast'
                          ? 'bg-blue-500/15 border-blue-500 text-[var(--text-primary)] shadow-sm'
                          : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-xs">
                        <span>سريع نسبي</span>
                        {pacingPreset === 'fast' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <p className="text-[11px] text-blue-400 mt-1 font-mono font-bold">6 - 12 ثانية عشوائي</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">للقوائم الصغيرة والمستعجلة</p>
                    </button>
                  </div>
                </div>

                {/* Custom Delay Sliders */}
                <div className="p-4 rounded-2xl bg-white/5 border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>الحد الأدنى للانتظار (ثوانٍ):</span>
                    </span>
                    <span className="font-black text-amber-400 font-mono">{minDelaySeconds} ثانية</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={minDelaySeconds}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinDelaySeconds(val);
                      if (maxDelaySeconds < val + 2) setMaxDelaySeconds(val + 5);
                      setPacingPreset('custom');
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>الحد الأقصى للانتظار (ثوانٍ):</span>
                    </span>
                    <span className="font-black text-amber-400 font-mono">{maxDelaySeconds} ثانية</span>
                  </div>
                  <input
                    type="range"
                    min={minDelaySeconds + 2}
                    max="60"
                    value={maxDelaySeconds}
                    onChange={(e) => {
                      setMaxDelaySeconds(Number(e.target.value));
                      setPacingPreset('custom');
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>كيف يعمل صمام الحماية؟</strong> يُرسل المحرك كل رسالة ثم يختار فاصلاً زمنياً عشوائياً مختلفاً (مثلاً:
                  14.2 ث ثم 18.7 ث ثم 11.1 ث). خوارزميات مكافحة السبام في واتساب تعتبر هذا النمط تصرّفاً بشرياً أصيلاً فلا تحظر
                  الرقم.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── LIVE ACTIVE CAMPAIGN PROGRESS MONITOR (IF RUNNING, PAUSED, OR COMPLETED) ── */}
      {dispatchMode === 'server_gateway' && campaign && campaign.status !== 'idle' && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-slideDown">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {isCampaignRunning ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                    </>
                  ) : isCampaignPaused ? (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400" />
                  )}
                </span>
                <h3 className="font-black text-lg text-white">
                  {isCampaignRunning ? (
                    'حملة إرسال نشطة قيد التنفيذ الآن...'
                  ) : isCampaignPaused ? (
                    <span className="text-amber-400">الحملة متوقفة مؤقتاً (جاهزة للاستئناف) ⏸️</span>
                  ) : (
                    'نتائج آخر حملة إرسال'
                  )}
                </h3>
                <span className="text-xs text-[var(--text-secondary)] font-mono">[{campaign.id}]</span>
              </div>
              {isCampaignRunning && campaign.currentBusinessName && (
                <p className="text-xs text-amber-400">
                  جارٍ معالجة الآن: <strong>{campaign.currentBusinessName}</strong>
                </p>
              )}
              {isCampaignPaused && (
                <p className="text-xs text-amber-300">
                  توقفت الحملة عند المنشأة رقم <strong>{(campaign.lastIndex ?? 0) + 1}</strong> من أصل{' '}
                  <strong>{campaign.total}</strong>. يمكنك استئنافها بعد مسح رمز QR أو تأكيد الاتصال.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Resume Button if Paused */}
              {isCampaignPaused && (
                <button
                  type="button"
                  onClick={handleResumeCampaign}
                  disabled={isResumingCampaign || sessionStatus.state !== 'connected'}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  title={sessionStatus.state !== 'connected' ? 'يرجى مسح رمز QR والاتصال أولاً' : 'استئناف الحملة من حيث توقفت'}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isResumingCampaign
                      ? 'جارٍ الاستئناف...'
                      : `استئناف الحملة من المنشأة ${(campaign.lastIndex ?? 0) + 1} ⏯️`}
                  </span>
                </button>
              )}

              {/* Emergency Abort Switch */}
              {(isCampaignRunning || isCampaignPaused) && (
                <button
                  type="button"
                  onClick={handleAbortCampaign}
                  disabled={isAbortingCampaign}
                  className="px-4 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-black text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                  title="إلغاء الحملة نهائياً"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{isAbortingCampaign ? 'جارٍ الإلغاء...' : isCampaignPaused ? 'إلغاء نهائي 🛑' : '🛑 إيقاف الحملة فوراً (طوارئ)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Alert Guidance when paused due to disconnect */}
          {isCampaignPaused && sessionStatus.state !== 'connected' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">انقطع اتصال WhatsApp أثناء الحملة وتم حفظ التقدم بأمان (توقفت عند المنشأة {(campaign.lastIndex ?? 0) + 1})</p>
                <p className="text-[11px] text-slate-300">
                  يرجى مسح رمز الـ QR الجديد من قسم "بوابة ربط WhatsApp Web" بالأعلى لإعادة الاتصال، وفور ظهور "متصل ونشط" اضغط على زر "استئناف الحملة" لتكمل عملها تلقائياً بدون أي تكرار.
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar & Numerical Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>التقدم الإجمالي:</span>
              <span className="font-mono text-amber-400 font-black text-sm">
                {campaign.current} / {campaign.total} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-[11px] text-[var(--text-secondary)]">الإجمالي المستهدف</p>
              <p className="text-xl font-black text-white font-mono mt-0.5">{campaign.total}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <p className="text-[11px] text-emerald-400">تم الإرسال بنجاح ✅</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{campaign.successful}</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <p className="text-[11px] text-amber-400">مستبعد (وهمية / مكررة) ⚠️</p>
              <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{campaign.skipped}</p>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
              <p className="text-[11px] text-rose-400">فشل الإرسال ❌</p>
              <p className="text-xl font-black text-rose-400 font-mono mt-0.5">{campaign.failed}</p>
            </div>
          </div>

          {/* Live Dispatch Logs */}
          {campaign.logs && campaign.logs.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>سجل الإرسال اللحظي (آخر العمليات):</span>
                <span className="text-[11px] text-[var(--text-secondary)]">{campaign.logs.length} سجل مسجل</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {campaign.logs.slice(0, 20).map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      {log.status === 'sent' ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ) : log.status === 'skipped' ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      )}
                      <span className="font-bold text-white">{log.businessName}</span>
                      <span className="text-[var(--text-secondary)] font-mono" dir="ltr">
                        ({log.phone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          log.status === 'sent'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.status === 'skipped'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {log.status === 'sent'
                          ? 'تم الإرسال'
                          : log.status === 'skipped'
                          ? log.reason || 'مستبعد'
                          : log.reason || 'فشل'}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TARGETING & TEMPLATE SELECTION SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / MAIN COLUMN: AUDIENCE & TEMPLATE (Col 12 / 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: AUDIENCE SELECTION */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm sm:text-base">1. تحديد الشريحة المستهدفة</h3>
              </div>

              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                {targetBusinesses.length} منشأة مطابقة
              </span>
            </div>

            {/* Filter Pills */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">فئة الأنشطة:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAudienceFilter('all');
                      setMobileQueueIndex(0);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      audienceFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    كافة الأنشطة بالدليل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAudienceFilter('honorary');
                      setMobileQueueIndex(0);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      audienceFilter === 'honorary'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    الشرفية / المستوردة فقط ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAudienceFilter('verified');
                      setMobileQueueIndex(0);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      audienceFilter === 'verified'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    الأنشطة الموثقة فقط ✅
                  </button>
                </div>
              </div>

              {/* Governorate & Category Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">المحافظة:</label>
                  <select
                    value={governorateFilter}
                    onChange={(e) => {
                      setGovernorateFilter(e.target.value);
                      setMobileQueueIndex(0);
                    }}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="all">كافة المحافظات ({businesses.length})</option>
                    {governorateList.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">التصنيف:</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setMobileQueueIndex(0);
                    }}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="all">كافة التصنيفات</option>
                    {categoryList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone Quality Audit Alert */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <p className="font-black text-white flex items-center gap-2">
                    <span>أرقام محمول صالحة للواتساب:</span>
                    <span className="text-emerald-400 font-mono text-sm">{validPhoneCount}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    {landlineCount > 0 && (
                      <span className="text-blue-400 font-bold">
                        ☎️ تم استبعاد {landlineCount} رقم أرضي / خط ساخن
                      </span>
                    )}
                    {dummyPhoneCount > 0 && (
                      <span className="text-amber-400 font-bold">
                        ⚠️ تم استبعاد {dummyPhoneCount} رقم وهمي
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] font-mono shrink-0">
                  نسبة السلامة: {targetBusinesses.length > 0 ? Math.round((validPhoneCount / targetBusinesses.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: TEMPLATE SELECTION & CUSTOMIZATION */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm sm:text-base">2. اختيار وصياغة قالب الرسالة</h3>
              </div>
            </div>

            {/* Template Selector Radio Cards */}
            <div className="space-y-2.5">
              {TEMPLATE_DEFINITIONS.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    selectedTemplate === tmpl.id
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                      : 'bg-white/5 border-[var(--border-color)] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="radio"
                      name="templateSelect"
                      checked={selectedTemplate === tmpl.id}
                      onChange={() => handleTemplateChange(tmpl.id)}
                      className="accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-[var(--text-primary)]">{tmpl.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${tmpl.badgeColor}`}>
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{tmpl.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Body Editor */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-black text-[var(--text-secondary)]">نص الرسالة المرسلة (يدعم التنسيق والرموز):</label>
                <span className="text-[10px] text-amber-400 font-mono">
                  المتغيرات: {'{name}'} | {'{owner}'} | {'{location}'} | {'{url}'}
                </span>
              </div>
              <textarea
                rows={7}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 text-xs leading-relaxed font-sans text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                placeholder="اكتب نص الرسالة هنا..."
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE WHATSAPP CHAT PREVIEW & LAUNCH CTA (Col 12 / 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* WHATSAPP REALISTIC CHAT BUBBLE CARD */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <h3 className="font-black text-xs sm:text-sm">معاينة الرسالة الحية كما تظهر للعميل</h3>
              </div>

              {/* Sample Biz Navigator */}
              {targetBusinesses.length > 1 && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
                  <span>نموذج:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewBizIndex((i) => (i > 0 ? i - 1 : targetBusinesses.length - 1))}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    ‹
                  </button>
                  <span className="font-mono font-black">{previewBizIndex + 1}/{targetBusinesses.length}</span>
                  <button
                    type="button"
                    onClick={() => setPreviewBizIndex((i) => (i < targetBusinesses.length - 1 ? i + 1 : 0))}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Target Sample Biz Info */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <p className="font-black text-white">{sampleBiz.nameAr || sampleBiz.name}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{sampleBiz.city || sampleBiz.governorate}</p>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 font-bold" dir="ltr">
                {sampleBiz.phone || sampleBiz.ownerPhone || 'لا يوجد هاتف'}
              </span>
            </div>

            {/* WhatsApp Phone Mockup Container */}
            <div className="bg-[#0b141a] rounded-2xl p-4 border border-[#202c33] shadow-inner relative space-y-2 font-sans">
              {/* WhatsApp Chat Bubble */}
              <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-md space-y-2 text-xs leading-relaxed max-w-full">
                <div className="whitespace-pre-wrap font-sans text-emerald-50 text-[12px] leading-relaxed select-text">
                  {previewMessage}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/80 pt-1 font-mono" dir="ltr">
                  <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sky-300">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* FINAL LAUNCH CALL-TO-ACTION CARD (FOR SERVER GATEWAY MODE) */}
          {dispatchMode === 'server_gateway' ? (
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="space-y-1">
                <h4 className="font-black text-base text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>جاهز لإطلاق الحملة عبر خادم Baileys</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  سيتم إرسال الرسائل تلقائياً في الخلفية إلى{' '}
                  <strong className="text-emerald-400">{validPhoneCount} منشأة</strong> مع فاصل زمني عشوائي من{' '}
                  <strong className="text-amber-400">{minDelaySeconds} إلى {maxDelaySeconds} ثانية</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>الوقت التقديري للحملة:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.round((validPhoneCount * ((minDelaySeconds + maxDelaySeconds) / 2)) / 60)} دقيقة
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>التكلفة المالية:</span>
                  <span className="font-mono text-emerald-400 font-black">0.00 ج.م ($0.00 مجاني)</span>
                </div>
              </div>

              {sessionStatus.state !== 'connected' ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  <span>اربط WhatsApp أولاً لتفعيل الإرسال</span>
                </button>
              ) : isCampaignRunning ? (
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-center text-xs text-amber-300 font-black">
                  ⏳ توجد حملة قيد التنفيذ حالياً، يمكنك متابعة شريط التقدم بالأعلى.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={validPhoneCount === 0 || isStartingCampaign}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm sm:text-base transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>🚀 بدء حملة الإرسال الجماعي الآن</span>
                </button>
              )}
            </div>
          ) : (
            /* QUICK SHORTCUT CARD FOR MOBILE DIRECT MODE */
            <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Smartphone className="w-4 h-4" />
                <span>الوضع المباشر للجوال نشط</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                يمكنك التمرير للأعلى واستخدام زر <strong>«إرسال عبر WhatsApp 💬»</strong> لمراسلة المنشآت تباعاً بنقرة واحدة
                لكل منشأة بدون الحاجة لأي خادم خارجي.
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>إجمالي المنشآت: {targetBusinesses.length}</span>
                <span>المتبقي في الطابور: {Math.max(0, targetBusinesses.length - mobileQueueIndex)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FINAL CONFIRMATION MODAL (FOR SERVER CAMPAIGN) ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[var(--text-primary)]">تأكيد إطلاق حملة WhatsApp الجماعية</h3>
                <p className="text-xs text-[var(--text-secondary)]">مراجعة المعايير النهائية قبل التنفيذ</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-[var(--border-color)] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">إجمالي المنشآت المشمولة بالفلاتر:</span>
                  <span className="font-black text-white font-mono text-sm">{targetBusinesses.length} منشأة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">منشآت بأرقام محمول صالحة للإرسال:</span>
                  <span className="font-black text-emerald-400 font-mono text-sm">{validPhoneCount} منشأة</span>
                </div>
                {landlineCount > 0 && (
                  <div className="flex justify-between text-blue-400">
                    <span>أرقام أرضية وخطوط ساخنة (استبعاد آلي):</span>
                    <span className="font-mono font-bold">{landlineCount} منشأة ☎️</span>
                  </div>
                )}
                {dummyPhoneCount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>أرقام وهمية أو غير صالحة (استبعاد آلي):</span>
                    <span className="font-mono font-bold">{dummyPhoneCount} منشأة ⚠️</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">معدل التباعد الزمني (صمام الأمان):</span>
                  <span className="font-bold text-amber-400 font-mono">{minDelaySeconds} - {maxDelaySeconds} ثانية عشوائي</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">الحساب المرسل:</span>
                  <span className="font-mono text-white" dir="ltr">
                    {sessionStatus.connectedUser?.phone || `${PRIMARY_WHATSAPP_SENDER_PHONE} (هاتف الإدارة الأساسي)`}
                  </span>
                </div>
              </div>

              {/* Duplicate Prevention Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipRecentlyContacted}
                  onChange={(e) => setSkipRecentlyContacted(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-white/20 cursor-pointer"
                />
                <span className="text-[11px] text-emerald-300 font-bold">
                  استبعاد من تم مراسلتهم بنجاح مسبقاً (حماية ذكية ضد تكرار الإرسال) 🛡️
                </span>
              </label>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  ستعمل الحملة في الخلفية تلقائياً وبشكل متتابع عبر السيرفر لكل المنشآت المستهدفة ({targetBusinesses.length}). يمكنك إيقاف الحملة في أي لحظة عبر زر الطوارئ 🛑.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={isStartingCampaign}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isStartingCampaign ? 'جارٍ الإطلاق...' : 'تأكيد وبدء الإرسال'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isStartingCampaign}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
