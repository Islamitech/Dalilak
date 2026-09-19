import { useState, useMemo, useCallback } from 'react';
import { Business } from '../../../../../types';
import { getDisplayDirectoryUrl } from '../../../../../utils/directoryUrl';
import { triggerHaptic } from '../../../../../utils/haptics';
import { isWithinHadayekAlAhramScope } from '../../../../../utils/geoBoundaryGuard';
import {
  TEMPLATE_DEFINITIONS,
  isValidTargetPhone,
  isLandlineOrHotline,
  formatPhoneForWaLink,
  resolveSpintaxText,
} from '../constants';

interface UseCampaignStateProps {
  businesses: Business[];
  isDesktop: boolean;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useCampaignState = ({
  businesses,
  isDesktop,
  onShowNotification,
}: UseCampaignStateProps) => {
  // Audience Targeting state
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'honorary' | 'verified'>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hadayekRadiusFilter, setHadayekRadiusFilter] = useState<boolean>(false);
  const [spintaxSeed, setSpintaxSeed] = useState<number>(0);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('hadayek_invitation');
  const [customText, setCustomText] = useState<string>(TEMPLATE_DEFINITIONS[0].defaultText);
  const [previewBizIndex, setPreviewBizIndex] = useState<number>(0);

  // ── MOBILE DIRECT QUEUE STATE ──
  const [mobileQueueIndex, setMobileQueueIndex] = useState<number>(0);
  const [sentBusinessIds, setSentBusinessIds] = useState<Set<string>>(() => new Set());
  const [skippedBusinessIds, setSkippedBusinessIds] = useState<Set<string>>(() => new Set());

  // Filtered Target Businesses
  const {
    targetBusinesses,
    validPhoneCount,
    landlineCount,
    dummyPhoneCount,
    governorateList,
    cityList,
    categoryList,
    hadayekTotalCount,
  } = useMemo(() => {
    const govs = new Set<string>();
    const cities = new Set<string>();
    const cats = new Set<string>();
    let hadayekTotal = 0;

    businesses.forEach((b) => {
      if ((b as any).isDeleted) return;
      if (b.governorate) govs.add(b.governorate);
      if (b.city) cities.add(b.city);
      if (b.category) cats.add(b.category);
      if (isWithinHadayekAlAhramScope(b, 8).matches) {
        hadayekTotal++;
      }
    });

    const isHadayekActive = hadayekRadiusFilter || governorateFilter === '__hadayek_8km__';

    const filtered = businesses.filter((b) => {
      if ((b as any).isDeleted) return false;

      if (audienceFilter === 'honorary') {
        const isHonorary = b.isFeeExempt || b.isAlreadyOnGoogle || b.registrationType === 'already_on_google';
        if (!isHonorary) return false;
      } else if (audienceFilter === 'verified') {
        if (b.verificationStatus !== 'verified') return false;
      }

      // 📍 Strict Geofence Filter: Hadayek Al Ahram (8 km radius)
      if (isHadayekActive) {
        const check = isWithinHadayekAlAhramScope(b, 8);
        if (!check.matches) return false;
      } else if (governorateFilter !== 'all' && b.governorate !== governorateFilter) {
        return false;
      }

      if (cityFilter !== 'all' && b.city !== cityFilter) {
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
      cityList: Array.from(cities),
      categoryList: Array.from(cats),
      hadayekTotalCount: hadayekTotal,
    };
  }, [businesses, audienceFilter, governorateFilter, cityFilter, categoryFilter, hadayekRadiusFilter]);

  // Sync custom text when changing template
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = TEMPLATE_DEFINITIONS.find((t) => t.id === templateId);
    if (tmpl) {
      setCustomText(tmpl.defaultText);
    }
  };

  // Interpolator for a specific business
  const compileMessageForBiz = useCallback(
    (biz: Business) => {
      const name = biz.nameAr || biz.name || 'المنشأة الكريمة';
      const owner = biz.ownerName || 'صاحب المنشأة';
      const location = [biz.street, biz.city, biz.governorate].filter(Boolean).join(' - ') || 'المحافظة';
      const url = getDisplayDirectoryUrl(biz);

      let text = customText || '';
      text = text.replace(/{name}/g, name);
      text = text.replace(/{owner}/g, owner);
      text = text.replace(/{location}/g, location);
      text = text.replace(/{url}/g, url);
      return resolveSpintaxText(text);
    },
    [customText, spintaxSeed]
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
    const waUrl = isDesktop
      ? `https://web.whatsapp.com/send?phone=${currentMobileWaDigits}&text=${encodedText}`
      : `https://api.whatsapp.com/send?phone=${currentMobileWaDigits}&text=${encodedText}`;

    setSentBusinessIds((prev) => new Set(prev).add(currentMobileBiz.id));

    window.open(waUrl, '_blank');

    onShowNotification?.(
      `تم فتح محادثة ${isDesktop ? 'WhatsApp Web' : 'WhatsApp'} لـ: ${currentMobileBiz.nameAr || currentMobileBiz.name}`,
      'success'
    );

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

  return {
    audienceFilter,
    setAudienceFilter,
    governorateFilter,
    setGovernorateFilter,
    cityFilter,
    setCityFilter,
    categoryFilter,
    setCategoryFilter,
    hadayekRadiusFilter,
    setHadayekRadiusFilter,
    spintaxSeed,
    setSpintaxSeed,
    selectedTemplate,
    setSelectedTemplate,
    customText,
    setCustomText,
    previewBizIndex,
    setPreviewBizIndex,
    targetBusinesses,
    validPhoneCount,
    landlineCount,
    dummyPhoneCount,
    governorateList,
    cityList,
    categoryList,
    hadayekTotalCount,
    compileMessageForBiz,
    sampleBiz,
    previewMessage,
    mobileQueueIndex,
    setMobileQueueIndex,
    sentBusinessIds,
    skippedBusinessIds,
    currentMobileBiz,
    currentMobilePhone,
    isCurrentMobilePhoneValid,
    isCurrentMobilePhoneLandline,
    currentMobileWaDigits,
    handleTemplateChange,
    handleMobileSendCurrent,
    handleMobileSkipCurrent,
  };
};
