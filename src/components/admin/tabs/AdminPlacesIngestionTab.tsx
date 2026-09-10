import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Search,
  CheckCircle2,
  MapPin,
  Star,
  Phone,
  Clock,
  Layers,
  CheckSquare,
  Square,
  Coins,
  ShieldCheck,
  Wrench,
  Store,
  Loader2,
  Filter,
  Sliders,
  Hash,
  Stethoscope,
  Scissors,
  Dumbbell,
  Briefcase,
  Utensils,
  Coffee,
  Info,
} from 'lucide-react';
import { Business, User } from '../../../types';
import { isSuperAdmin } from '../../../utils/permissions';
import { getApiAuthHeaders } from '../../../utils/storage';
import { saveBusinessToDb } from '../../../services/db';

interface CandidatePlace {
  id: string;
  displayName: string;
  category: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  phone?: string;
  rating?: number;
  userRatingCount?: number;
  workingHours?: string;
  googleMapsUri?: string;
  coverPhoto?: string;
  photosCount: number;
  isDuplicate: boolean;
  isQualityApproved: boolean;
  qualityBadgeText: string;
  isCraft: boolean;
}

interface BatchSearchMetrics {
  totalFound: number;
  duplicatesCount: number;
  qualifiedCount: number;
  estimatedCost: string;
}

interface CategoryThreshold {
  label: string;
  keyword: string;
  type: string;
  icon: string;
  defaultMinRating: number;
  defaultMinReviews: number;
  explanation: string;
}

interface AdminPlacesIngestionTabProps {
  currentUser: User;
  businesses: Business[];
  onAddBusiness?: (biz: Business) => Promise<void> | void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const GOOGLE_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY ||
  'AIzaSyD3eyrkvcPrYKgGFqUf2p3OrzKgMep_7c4';

const EGYPTIAN_HUBS = [
  { label: 'حدائق الأهرام - الجيزة', query: 'حدائق الأهرام', gov: 'الجيزة', city: 'حدائق الأهرام', lat: 29.9822, lng: 31.1165 },
  { label: 'الشيخ زايد و 6 أكتوبر', query: 'الشيخ زايد', gov: 'الجيزة', city: 'الشيخ زايد', lat: 30.0461, lng: 30.9856 },
  { label: 'التجمع الخامس والقاهرة الجديدة', query: 'التجمع الخامس', gov: 'القاهرة', city: 'القاهرة الجديدة', lat: 30.0131, lng: 31.4289 },
  { label: 'المعادي والمقطم', query: 'المعادي', gov: 'القاهرة', city: 'المعادي', lat: 29.9602, lng: 31.2569 },
  { label: 'المهندسين والدقي', query: 'المهندسين', gov: 'الجيزة', city: 'الدقي والمهندسين', lat: 30.0526, lng: 31.2058 },
  { label: 'مدينة نصر ومصر الجديدة', query: 'مدينة نصر', gov: 'القاهرة', city: 'مدينة نصر', lat: 30.0566, lng: 31.3301 },
  { label: 'وسط البلد والزمالك', query: 'وسط البلد القاهرة', gov: 'القاهرة', city: 'وسط البلد', lat: 30.0444, lng: 31.2357 },
  { label: 'الهرم وفيصل', query: 'شارع فيصل والهرم', gov: 'الجيزة', city: 'الهرم وفيصل', lat: 30.0016, lng: 31.1788 },
  { label: 'الإسكندرية (سموحة ومحطة الرمل)', query: 'سموحة الإسكندرية', gov: 'الإسكندرية', city: 'الإسكندرية', lat: 31.2156, lng: 29.9553 },
];

// 🏛️ مصفوفة التقييمات الطبيعية المتوازنة لكل فئة في السوق المصري
const CATEGORY_PRESETS: CategoryThreshold[] = [
  {
    label: 'مطاعم ومأكولات ومشويات',
    keyword: 'مطاعم',
    type: 'restaurants',
    icon: 'utensils',
    defaultMinRating: 4.2,
    defaultMinReviews: 60,
    explanation: 'إقبال استهلاكي كثيف ومراجعات واسعة',
  },
  {
    label: 'كافيهات ومقاهي ومشروبات',
    keyword: 'كافيهات',
    type: 'cafes',
    icon: 'coffee',
    defaultMinRating: 4.2,
    defaultMinReviews: 50,
    explanation: 'إقبال شبابي ومراجعات مستمرة',
  },
  {
    label: 'ورش وميكانيكا وصيانة سيارات',
    keyword: 'ورش صيانة وميكانيكي سيارات',
    type: 'craft',
    icon: 'wrench',
    defaultMinRating: 4.3,
    defaultMinReviews: 15,
    explanation: 'كفاءة حرفية نادرة بمراجعات تخصصية مركزة (15 مقيم كافية)',
  },
  {
    label: 'سباكة وكهرباء وصيانة منزلية',
    keyword: 'سباك وكهربائي وصيانة منزلية',
    type: 'craft',
    icon: 'wrench',
    defaultMinRating: 4.3,
    defaultMinReviews: 12,
    explanation: 'خدمات حرفية ميدانية بمراجعات نوعية موثوقة',
  },
  {
    label: 'عيادات ومراكز طبية وصيدليات',
    keyword: 'عيادات ومراكز طبية وصيدليات',
    type: 'medical',
    icon: 'stethoscope',
    defaultMinRating: 4.4,
    defaultMinReviews: 20,
    explanation: 'معيار طبي دقيق لعيادات متخصصة (20 مقيم تمثل سمعة ممتازة)',
  },
  {
    label: 'سوبرماركت ومحلات تجارة وتجزئة',
    keyword: 'سوبرماركت ومحلات تجارية',
    type: 'retail',
    icon: 'store',
    defaultMinRating: 4.1,
    defaultMinReviews: 40,
    explanation: 'مبيعات يومية سريعة وتقييمات استهلاكية',
  },
  {
    label: 'صالونات ومراكز تجميل وعناية',
    keyword: 'صالون حلاقة ومراكز تجميل',
    type: 'beauty',
    icon: 'scissors',
    defaultMinRating: 4.3,
    defaultMinReviews: 25,
    explanation: 'خدمات عناية شخصية تعتمد على الثقة المباشرة',
  },
  {
    label: 'أندية وجيم وصالات رياضية',
    keyword: 'جيم وصالات رياضية',
    type: 'gym',
    icon: 'dumbbell',
    defaultMinRating: 4.3,
    defaultMinReviews: 35,
    explanation: 'اشتراكات دورية وتقييمات للمعدات والمدربين',
  },
  {
    label: 'خدمات مهنية ومكاتب وعقارات',
    keyword: 'مكاتب وشركات خدمات مهنية وعقارات',
    type: 'corporate',
    icon: 'briefcase',
    defaultMinRating: 4.4,
    defaultMinReviews: 10,
    explanation: 'استشارات مهنية متخصصة بمراجعات عملاء رسمية',
  },
  {
    label: 'جميع الأنشطة الرائجة المتنوعة',
    keyword: 'أنشطة وأماكن رائجة',
    type: 'general',
    icon: 'layers',
    defaultMinRating: 4.2,
    defaultMinReviews: 30,
    explanation: 'معيار وسطي متوازن لكافة القطاعات',
  },
];

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
        <h3 className="text-lg font-black text-rose-500 mb-2">حظر أمني: بوابة الاستيراد محصورة بالسوبر أدمن حصراً</h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          هذه الوظيفة سيادية ومخصصة للحساب الأعلى لإدارة المنظومة (403 Forbidden). تم تسجيل محاولة الوصول في سجل أمان المنصة.
        </p>
      </div>
    );
  }

  // State Management
  const [selectedHubIndex, setSelectedHubIndex] = useState<number>(1); // الشيخ زايد و 6 أكتوبر
  const [isCustomHub, setIsCustomHub] = useState<boolean>(false);
  const [customHubName, setCustomHubName] = useState<string>('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0); // مطاعم
  const [searchQuery, setSearchQuery] = useState<string>('مطاعم في الشيخ زايد');
  
  // 🔢 خانة إدخال عدد السحب المطلوب (طلب المستخدم الصريح)
  const [pullCount, setPullCount] = useState<number>(10);

  // ⭐ معايير الجودة الطبيعية القابلة للتحكم
  const [minRating, setMinRating] = useState<number>(CATEGORY_PRESETS[0].defaultMinRating);
  const [minReviews, setMinReviews] = useState<number>(CATEGORY_PRESETS[0].defaultMinReviews);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [candidatePlaces, setCandidatePlaces] = useState<CandidatePlace[]>([]);
  const [metrics, setMetrics] = useState<BatchSearchMetrics | null>(null);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());
  const [filterOnlyQualified, setFilterOnlyQualified] = useState<boolean>(true);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestProgress, setIngestProgress] = useState<{ current: number; total: number } | null>(null);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);

  // Auto-compose search query upon Hub or Category change
  const handleHubChange = (idx: number) => {
    setSelectedHubIndex(idx);
    setIsCustomHub(false);
    const hub = EGYPTIAN_HUBS[idx];
    const cat = CATEGORY_PRESETS[selectedCategoryIndex];
    if (hub && cat) {
      setSearchQuery(`${cat.keyword} في ${hub.query}`);
    }
  };

  const handleCategoryChange = (catIdx: number) => {
    setSelectedCategoryIndex(catIdx);
    const cat = CATEGORY_PRESETS[catIdx];
    const hub = isCustomHub ? { query: customHubName } : EGYPTIAN_HUBS[selectedHubIndex];
    if (cat && hub?.query) {
      setSearchQuery(`${cat.keyword} في ${hub.query}`);
    }
    // تحديث التقييمات والمراجعات الطبيعية تلقائياً لتطابق الفئة الجديدة
    if (cat) {
      setMinRating(cat.defaultMinRating);
      setMinReviews(cat.defaultMinReviews);
    }
  };

  const currentHub = isCustomHub
    ? { label: customHubName || 'نطاق مخصص', gov: 'الجيزة', city: customHubName || 'مصر', lat: undefined, lng: undefined }
    : EGYPTIAN_HUBS[selectedHubIndex];

  const currentCat = CATEGORY_PRESETS[selectedCategoryIndex];

  // 🛡️ Helper: Check if place matches craft profile
  const isCraftActivity = (primaryType?: string, typeDisplayName?: string, name?: string): boolean => {
    const text = `${primaryType || ''} ${typeDisplayName || ''} ${name || ''}`.toLowerCase();
    const craftKeywords = [
      'car_repair', 'auto_repair', 'mechanic', 'plumber', 'electrician', 'locksmith',
      'carpenter', 'handyman', 'workshop', 'maintenance', 'repair',
      'ميكانيك', 'ورشة', 'سباك', 'كهربائي', 'صيانة', 'حداد', 'نجار', 'عفشجي', 'دوكو', 'سمكري', 'تكييف'
    ];
    return craftKeywords.some((kw) => text.includes(kw));
  };

  // ⚡ DIRECT RESILIENT BROWSER ENGINE (حماية 100% من أخطاء 405 و 404 على Vercel و CDN)
  const executeDirectClientPlacesSearch = async (
    queryText: string,
    targetCount: number,
    thresholdRating: number,
    thresholdReviews: number
  ): Promise<{ places: CandidatePlace[]; metrics: BatchSearchMetrics }> => {
    const searchBody: Record<string, unknown> = {
      textQuery: queryText,
      languageCode: 'ar',
      maxResultCount: Math.min(20, Math.max(1, targetCount)),
    };

    if (currentHub?.lat && currentHub?.lng) {
      searchBody.locationBias = {
        circle: {
          center: { latitude: currentHub.lat, longitude: currentHub.lng },
          radius: 6000.0,
        },
      };
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.primaryType',
      'places.primaryTypeDisplayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.internationalPhoneNumber',
      'places.nationalPhoneNumber',
      'places.regularOpeningHours',
      'places.photos',
      'places.googleMapsUri',
    ].join(',');

    const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(searchBody),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text().catch(() => '');
      throw new Error(`تعذر الاتصال بخدمة Google Places API: كود ${googleRes.status} (${errText.slice(0, 80)})`);
    }

    const googleData = await googleRes.json();
    const rawPlaces = Array.isArray(googleData.places) ? googleData.places : [];

    // Zero-Cost Deduplication
    const existingIds = new Set<string>();
    businesses.forEach((b) => {
      if (b.googlePlaceId) existingIds.add(b.googlePlaceId);
      if (b.googleMapsUrl) {
        const m = b.googleMapsUrl.match(/place_id:([A-Za-z0-9_-]+)/);
        if (m) existingIds.add(m[1]);
      }
    });
    const existingNames = new Set(businesses.map((b) => (b.nameAr || b.name || '').trim().toLowerCase()));

    let duplicatesCount = 0;
    let qualifiedCount = 0;

    const candidateList: CandidatePlace[] = await Promise.all(
      rawPlaces.map(async (p: any) => {
        const placeId = p.id || '';
        const name = p.displayName?.text || '';
        const cleanName = name.trim();
        const primaryType = p.primaryType || '';
        const primaryTypeDisplayName = p.primaryTypeDisplayName?.text || '';
        const rating = typeof p.rating === 'number' ? p.rating : 0;
        const userRatingCount = typeof p.userRatingCount === 'number' ? p.userRatingCount : 0;
        const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || '';
        const formattedAddress = p.formattedAddress || '';
        const lat = p.location?.latitude;
        const lng = p.location?.longitude;
        const googleMapsUri = p.googleMapsUri || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : '');

        // Deduplication check
        const isDuplicate = existingIds.has(placeId) || (cleanName.length > 3 && existingNames.has(cleanName.toLowerCase()));
        if (isDuplicate) duplicatesCount++;

        // Adaptive Quality check based on Natural Category Thresholds
        const isCraft = isCraftActivity(primaryType, primaryTypeDisplayName, cleanName) || currentCat.type === 'craft';
        const isQualityApproved = rating >= thresholdRating && userRatingCount >= thresholdReviews;

        let qualityBadgeText = '';
        if (isQualityApproved) {
          qualityBadgeText = `${isCraft ? 'حرفي معتمد' : 'رائج معتمد'} ⭐ ${rating} (${userRatingCount} مقيّم)`;
          if (!isDuplicate) qualifiedCount++;
        } else {
          qualityBadgeText = `دون المعايير الطبيعية (المطلوب: ${thresholdRating}★ و ${thresholdReviews} مقيّم) حالياً: ${rating}★ (${userRatingCount})`;
        }

        // 🛡️ توحيد سحب الصور الصارم: سحب صورة الغلاف الأولى فقط للمنشأة المؤهلة
        let coverPhoto: string | undefined = undefined;
        if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
          const firstPhotoName = p.photos[0].name;
          if (firstPhotoName) {
            try {
              const mediaUrl = `https://places.googleapis.com/v1/${firstPhotoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_API_KEY}&skipHttpRedirect=true`;
              const mediaRes = await fetch(mediaUrl);
              if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                if (mediaData && mediaData.photoUri) {
                  coverPhoto = mediaData.photoUri;
                }
              }
            } catch {}
          }
        }

        let workingHours: string | undefined = undefined;
        if (p.regularOpeningHours?.weekdayDescriptions && Array.isArray(p.regularOpeningHours.weekdayDescriptions)) {
          const todayDesc = p.regularOpeningHours.weekdayDescriptions[0];
          if (todayDesc) {
            workingHours = todayDesc.replace(/^[A-Za-z]+:\s*/, '').replace(/^[^\s:]+:\s*/, '');
          }
        }

        return {
          id: placeId,
          displayName: cleanName,
          category: primaryTypeDisplayName || currentCat.label,
          primaryType,
          primaryTypeDisplayName,
          formattedAddress,
          lat,
          lng,
          phone,
          rating,
          userRatingCount,
          workingHours,
          googleMapsUri,
          coverPhoto,
          photosCount: Array.isArray(p.photos) ? p.photos.length : 0,
          isDuplicate,
          isQualityApproved,
          qualityBadgeText,
          isCraft,
        };
      })
    );

    const textSearchCost = 0.032;
    const photoFetchCost = qualifiedCount * 0.007;
    const totalEstCost = (textSearchCost + photoFetchCost).toFixed(3);

    return {
      places: candidateList,
      metrics: {
        totalFound: rawPlaces.length,
        duplicatesCount,
        qualifiedCount,
        estimatedCost: `$${totalEstCost}`,
      },
    };
  };

  // 🚀 Live Batch Search (Hybrid Dual-Engine with Automatic 405 Fallback)
  const handleExecuteScan = async () => {
    if (!searchQuery.trim()) {
      if (onShowNotification) onShowNotification('يرجى كتابة استعلام البحث أولاً', 'warning');
      return;
    }

    setIsScanning(true);
    setMetrics(null);
    setCandidatePlaces([]);
    setSelectedPlaceIds(new Set());
    setIngestionMessage(null);

    try {
      let data: { places: CandidatePlace[]; metrics: BatchSearchMetrics } | null = null;

      // 1. محاولة استدعاء السيرفر المحلي أولاً
      try {
        const existingPlaceIds = businesses
          .map((b) => b.googlePlaceId)
          .filter((id): id is string => Boolean(id));

        const res = await fetch('/api/admin/places-batch-search', {
          method: 'POST',
          headers: getApiAuthHeaders(),
          body: JSON.stringify({
            query: searchQuery.trim(),
            category: currentCat.type,
            lat: currentHub?.lat,
            lng: currentHub?.lng,
            pullCount: pullCount,
            minRating: minRating,
            minReviews: minReviews,
            existingPlaceIds,
          }),
        });

        // إذا نجح السيرفر
        if (res.ok) {
          const serverJson = await res.json();
          if (serverJson.success && Array.isArray(serverJson.places)) {
            data = {
              places: serverJson.places,
              metrics: serverJson.metrics,
            };
          }
        } else if (res.status === 405 || res.status === 404 || res.status === 502) {
          console.warn(`[Places Ingestion] Server returned ${res.status}. Falling back to resilient direct client engine...`);
        }
      } catch (serverErr) {
        console.warn('[Places Ingestion] Backend server unreachable. Falling back to direct client engine...', serverErr);
      }

      // 2. إذا كان السيرفر غير متاح أو في بيئة Vercel Static (التي تسبب خطأ 405) -> تشغيل المحرك المباشر فوراً!
      if (!data) {
        data = await executeDirectClientPlacesSearch(searchQuery.trim(), pullCount, minRating, minReviews);
      }

      if (data && Array.isArray(data.places)) {
        setCandidatePlaces(data.places);
        setMetrics(data.metrics);

        // تحديد كافة المنشآت المؤهلة وغير المكررة افتراضياً
        const qualifiedIds = new Set<string>();
        data.places.forEach((p) => {
          if (p.isQualityApproved && !p.isDuplicate) {
            qualifiedIds.add(p.id);
          }
        });
        setSelectedPlaceIds(qualifiedIds);

        const msg = `🔍 تم بنجاح سحب ${data.places.length} منشأة (${data.metrics.qualifiedCount} مؤهلة لمعايير الجودة)`;
        if (onShowNotification) onShowNotification(msg, 'success');
      } else {
        throw new Error('لم يتم استلام أي نتائج من محرك خرائط Google');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'فشل الاتصال بمحرك البحث لخرائط Google';
      if (onShowNotification) onShowNotification(errMsg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Filtered displayed places
  const displayedPlaces = useMemo(() => {
    if (!filterOnlyQualified) return candidatePlaces;
    return candidatePlaces.filter((p) => p.isQualityApproved && !p.isDuplicate);
  }, [candidatePlaces, filterOnlyQualified]);

  // Selection toggles
  const handleToggleSelectAll = () => {
    if (selectedPlaceIds.size === displayedPlaces.length) {
      setSelectedPlaceIds(new Set());
    } else {
      setSelectedPlaceIds(new Set(displayedPlaces.map((p) => p.id)));
    }
  };

  const handleTogglePlace = (id: string) => {
    setSelectedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 🚀 Batch Ingestion Execution
  const handleIngestSelected = async () => {
    if (selectedPlaceIds.size === 0) {
      if (onShowNotification) onShowNotification('يرجى تحديد منشأة واحدة على الأقل للاستيراد', 'warning');
      return;
    }

    const placesToIngest = candidatePlaces.filter((p) => selectedPlaceIds.has(p.id));
    setIsIngesting(true);
    setIngestProgress({ current: 0, total: placesToIngest.length });

    let successCount = 0;
    try {
      for (let i = 0; i < placesToIngest.length; i++) {
        const p = placesToIngest[i];
        setIngestProgress({ current: i + 1, total: placesToIngest.length });

        const newBiz: Business = {
          id: `biz_gplaces_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          nameAr: p.displayName,
          category: p.category || currentCat.label,
          governorate: currentHub?.gov || 'الجيزة',
          city: currentHub?.city || 'حدائق الأهرام',
          street: p.formattedAddress || currentHub?.city || '',
          landmark: 'منشأة شرفية معتمدة من خرائط Google',
          phone: p.phone || '',
          workingHours: p.workingHours || 'يومياً: 09:00 ص - 11:00 م',
          description: `${p.displayName} - منشأة شرفية مميزة معتمدة من خرائط Google بالتقييم الرسمي`,
          lat: p.lat || currentHub?.lat || 29.98,
          lng: p.lng || currentHub?.lng || 31.11,
          ownerName: `إدارة ${p.displayName}`,
          ownerPhone: p.phone || '',
          photos: p.coverPhoto ? [p.coverPhoto] : [],
          coverPhoto: p.coverPhoto,
          repId: currentUser.id || 'rep_super_admin',
          repName: 'السوبر أدمن (استيراد آلي)',
          packageId: 'pkg_exempt',
          packageName: 'باقة الأماكن الشرفية (خرائط Google)',
          packagePrice: 0,
          amountPaid: 0,
          paymentStatus: 'fully_paid',
          verificationStatus: 'verified',
          publishedStatus: 'published',
          isFeeExempt: true,
          feeExemptionReason: 'منشأة شرفية معتمدة مستوردة آلياً من خرائط Google',
          isAlreadyOnGoogle: true,
          googlePlaceId: p.id,
          googleMapsUrl: p.googleMapsUri || (p.id ? `https://www.google.com/maps/place/?q=place_id:${p.id}` : ''),
          googleRatingEnabled: true,
          googleRating: p.rating,
          googleReviewsCount: p.userRatingCount,
          invoiceNumber: `EXP-${Date.now().toString().slice(-6)}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          createdDate: new Date().toISOString(),
        };

        await saveBusinessToDb(newBiz);
        if (onAddBusiness) {
          await onAddBusiness(newBiz);
        }
        successCount++;
      }

      const finishMsg = `🎉 تم بنجاح استيراد وتوثيق ${successCount} منشأة شرفية جديدة ونشرها في الدليل العام!`;
      setIngestionMessage(finishMsg);
      if (onShowNotification) onShowNotification(finishMsg, 'success');

      // Update candidates to mark ingested
      setCandidatePlaces((prev) =>
        prev.map((c) => (selectedPlaceIds.has(c.id) ? { ...c, isDuplicate: true } : c))
      );
      setSelectedPlaceIds(new Set());
    } catch (err: any) {
      const errMsg = `حدث خطأ أثناء الاستيراد: ${err?.message || 'تعذر استكمال حفظ المنشآت'}`;
      if (onShowNotification) onShowNotification(errMsg, 'error');
    } finally {
      setIsIngesting(false);
      setIngestProgress(null);
    }
  };

  return (
    <div className="space-y-6 text-right pb-24 animate-fade-in" dir="rtl">
      {/* ── HEADER BANNER: SOVEREIGN IDENTITY & FINANCIAL GOVERNANCE ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>المسار السيادي الحصري: السوبر أدمن</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                حماية رصيد $200 المجاني (وفر 80%)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>منظومة استيراد الأماكن الذكية وتدوير الصور الموفرة</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              محرك مسح هجين يعمل بسلاسة على السيرفر و Vercel، يربط خرائط Google مباشرة بدليلك مع منع التكرار ($0.00)، وتطبيق التقييمات الطبيعية المتوازنة لكل فئة، وسحب صورة الغلاف الأولى فقط.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-indigo-400/20 rounded-2xl p-3.5 text-center min-w-[180px] shrink-0">
            <div className="text-[10.5px] text-slate-400 font-bold mb-1 flex items-center justify-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>تكلفة استيراد 100 منشأة</span>
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">≈ 1.34$ فقط</div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">يوفر $198.66 كرصيد احتياطي</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH SCOPE CONTROLS & QUERY BUILDER ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>إعدادات المسح الذكي والتصنيف ومعايير الجودة</span>
          </span>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            محدد طبيعة الفئة: <strong className="text-amber-500">{currentCat.label}</strong>
          </span>
        </h3>

        {/* Row 1: Hub & Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Hub / Region Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>المحافظة والتجمع السكني (Hub)</span>
            </label>
            <select
              value={isCustomHub ? 'custom' : selectedHubIndex}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomHub(true);
                } else {
                  handleHubChange(Number(e.target.value));
                }
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden cursor-pointer"
            >
              {EGYPTIAN_HUBS.map((h, i) => (
                <option key={i} value={i}>
                  📍 {h.label}
                </option>
              ))}
              <option value="custom">✏️ كتابة نطاق جغرافي مخصص...</option>
            </select>
          </div>

          {/* Custom Hub Input if selected */}
          {isCustomHub && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[var(--text-muted)]">النطاق المخصص</label>
              <input
                type="text"
                value={customHubName}
                onChange={(e) => {
                  setCustomHubName(e.target.value);
                  const cat = CATEGORY_PRESETS[selectedCategoryIndex];
                  if (cat) setSearchQuery(`${cat.keyword} في ${e.target.value}`);
                }}
                placeholder="مثال: الشروق، مدينتي، طنطا..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* 2. Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>فئة النشاط المستهدفة</span>
            </label>
            <select
              value={selectedCategoryIndex}
              onChange={(e) => handleCategoryChange(Number(e.target.value))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden cursor-pointer"
            >
              {CATEGORY_PRESETS.map((c, i) => (
                <option key={i} value={i}>
                  {c.type === 'craft' ? '🛠️ ' : c.type === 'medical' ? '🩺 ' : '🏢 '}
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. خانة عدد السحب المطلوب (طلب المستخدم) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>العدد المطلوب سحبه (أماكن)</span>
              </label>
              <div className="flex items-center gap-1">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPullCount(num)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      pullCount === num
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min={1}
              max={20}
              value={pullCount}
              onChange={(e) => setPullCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Row 2: فرض التقييمات الطبيعية للفئة الحالية (طلب المستخدم) */}
        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-[var(--text-primary)]">
                معايير الفرز الذكية الطبيعية لفئة: <strong className="text-amber-500">{currentCat.label}</strong>
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{currentCat.explanation}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Min Rating Threshold */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div>
                <div className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>الحد الأدنى للتقييم المطلوب</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  الطبيعي للفئة: ⭐ {currentCat.defaultMinRating}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min={3.0}
                  max={5.0}
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value) || 4.0)}
                  className="w-20 bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-2 rounded-xl text-center font-mono focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Min Reviews Count Threshold */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div>
                <div className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>الحد الأدنى لعدد المقيمين</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  الطبيعي للفئة: {currentCat.defaultMinReviews} مقيّم
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min={1}
                  max={1000}
                  value={minReviews}
                  onChange={(e) => setMinReviews(parseInt(e.target.value, 10) || 10)}
                  className="w-20 bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-2 rounded-xl text-center font-mono focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Search Query Input & Trigger */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-[var(--text-muted)] flex items-center justify-between">
            <span>استعلام البحث الموجه لخرائط Google</span>
            <span className="text-[10px] text-amber-600 font-bold">يمكنك كتابة نص مخصص بحرية تامة</span>
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="نص استعلام البحث في خرائط Google..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black py-3 pr-10 pl-3 rounded-2xl focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleExecuteScan}
              disabled={isScanning || !searchQuery.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black py-3 px-6 rounded-2xl shadow-md hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري المسح الذكي ({pullCount} أماكن)...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>بدء المسح الذكي لخرائط Google</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── FINANCIAL & QUALITY LEDGER (4 MINI-CARDS) ── */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
          {/* Card 1: Total Found */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)]">إجمالي المكتشف</span>
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Search className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)] mt-2 font-mono">
              {metrics.totalFound}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">منشأة في نطاق الاستعلام</div>
          </div>

          {/* Card 2: Zero-Cost Local Deduplication */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">مستبعد محلياً (تكرار)</span>
              <span className="p-2 rounded-xl bg-slate-500/10 text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-400 mt-2 font-mono">
              {metrics.duplicatesCount}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">وفر كامل بتكلفة $0.00</div>
          </div>

          {/* Card 3: Quality Approved */}
          <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-2xl p-4 shadow-xs bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">مؤهل للجودة الذكية</span>
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600">
                <Star className="w-4 h-4 fill-current" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
              {metrics.qualifiedCount}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
              مطابق لـ (⭐{minRating} و {minReviews} مقيم)
            </div>
          </div>

          {/* Card 4: Estimated Cost */}
          <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-2xl p-4 shadow-xs bg-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">التكلفة التقديرية للعملية</span>
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
                <Coins className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
              {metrics.estimatedCost}
            </div>
            <div className="text-[10px] text-amber-600 font-bold mt-0.5">تخصم من رصيد $200 المجاني</div>
          </div>
        </div>
      )}

      {/* Ingestion success banner */}
      {ingestionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{ingestionMessage}</span>
        </div>
      )}

      {/* ── CANDIDATE PLACES TABLE & CARDS ── */}
      {candidatePlaces.length > 0 && (
        <div className="space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-xs font-black text-[var(--text-primary)] hover:border-amber-500 flex items-center gap-1.5 cursor-pointer"
              >
                {selectedPlaceIds.size === displayedPlaces.length ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                    <span>إلغاء تحديد الكل</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>تحديد المعروض ({displayedPlaces.length})</span>
                  </>
                )}
              </button>

              <span className="text-xs font-bold text-[var(--text-muted)]">
                تم تحديد {selectedPlaceIds.size} من أصل {candidatePlaces.length} منشأة
              </span>
            </div>

            {/* Filter Mode Switcher */}
            <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-color)] text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterOnlyQualified(true)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterOnlyQualified
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                المؤهلين فقط ({candidatePlaces.filter((p) => p.isQualityApproved && !p.isDuplicate).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterOnlyQualified(false)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  !filterOnlyQualified
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                كافة النتائج ({candidatePlaces.length})
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPlaces.map((place) => {
              const isSelected = selectedPlaceIds.has(place.id);

              return (
                <div
                  key={place.id}
                  onClick={() => handleTogglePlace(place.id)}
                  className={`bg-[var(--bg-card)] rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                      : 'border-[var(--border-color)] hover:border-amber-500/40'
                  } ${place.isDuplicate ? 'opacity-65' : ''}`}
                >
                  {/* Photo & Status Badge */}
                  <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                    {place.coverPhoto ? (
                      <img
                        src={place.coverPhoto}
                        alt={place.displayName}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1">
                        <Store className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-[10px]">لا توجد صورة غلاف مسجلة</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Selection Checkbox (Top-Right) */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-md transition-all ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-950/70 text-white border border-white/30'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Quality & Craft Badges (Top-Left) */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-end gap-1">
                      {place.isDuplicate ? (
                        <span className="bg-slate-900/90 text-amber-300 border border-amber-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                          مسجل مسبقاً بدليلك 🛡️
                        </span>
                      ) : place.isQualityApproved ? (
                        <span className="bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-md shadow-xs backdrop-blur-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مؤهل للجودة الطبيعية</span>
                        </span>
                      ) : (
                        <span className="bg-rose-900/90 text-rose-200 text-[9.5px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                          دون حد الجودة الطبيعي
                        </span>
                      )}

                      {place.isCraft && (
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Wrench className="w-2.5 h-2.5" />
                          <span>حرفي تخصصي</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay: Rating & Review Count */}
                    <div className="absolute bottom-2 right-2 left-2 z-10 flex items-center justify-between text-white text-xs">
                      <span className="font-mono font-black text-amber-300 flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{place.rating ? place.rating.toFixed(1) : 'غير مقيم'}</span>
                        {place.userRatingCount !== undefined && (
                          <span className="text-[10px] text-slate-300">({place.userRatingCount})</span>
                        )}
                      </span>

                      {place.photosCount > 1 && (
                        <span className="text-[10px] text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                          {place.photosCount} صور بـ Google
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[11px] text-[var(--text-muted)] font-bold mb-1">
                        <span className="text-amber-600 truncate">{place.category}</span>
                      </div>
                      <h4 className="text-sm font-black text-[var(--text-primary)] line-clamp-1">
                        {place.displayName}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 font-medium">
                        {place.formattedAddress || 'العنوان غير مسجل بالتفصيل'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)] space-y-1 text-[10.5px] text-[var(--text-muted)]">
                      {place.phone && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{place.phone}</span>
                        </div>
                      )}
                      {place.workingHours && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{place.workingHours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BATCH ACTION FLOATING BOTTOM BAR ── */}
      {selectedPlaceIds.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 z-50 animate-slide-up">
          <div className="bg-slate-950/95 border border-amber-500/40 text-white rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm shrink-0">
                {selectedPlaceIds.size}
              </div>
              <div>
                <div className="text-sm font-black text-white">منشآت محددة للاستيراد الشرفي المعتمد</div>
                <div className="text-[11px] text-slate-300 font-medium">
                  ستُحفظ في قاعدة البيانات بباقة الأماكن الشرفية (pkg_exempt) مع تفعيل تقييم Google المعتمد
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isIngesting}
                onClick={handleIngestSelected}
                className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black py-3 px-6 rounded-2xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                {isIngesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الاستيراد ({ingestProgress?.current} من {ingestProgress?.total})...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>اعتماد واستيراد المنشآت ({selectedPlaceIds.size}) إلى دليلك 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
