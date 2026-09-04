import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, PackageOption, PaymentStatus, Representative, InterestedLead, LeadInterestLevel, User as UserType } from '../types';
import { EGYPT_GOVERNORATES, BUSINESS_CATEGORIES, CATEGORY_GROUPS, getGroupFromCategory, PACKAGES, EXEMPT_PACKAGE, ALREADY_ON_GOOGLE_PACKAGE } from '../data/mockData';
import { canUserManageFeeExemption } from '../utils/permissions';
import { InteractiveMap } from './InteractiveMap';
import { compressImageFile } from '../utils/imageCompressor';
import { validateAndProcessShortVideo, convertVideoToDataUrl } from '../utils/videoProcessor';
import { fetchLocationAddress } from '../utils/geocoding';
import { saveLeadToDb, updateBusinessInDb } from '../services/db';
import { uploadMediaToSupabaseStorage, uploadMultipleMediaToStorage } from '../services/storage';
import {
  Camera,
  Video,
  Film,
  Play,
  MapPin,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  Navigation,
  Loader2,
  CreditCard,
  X,
  UserCheck,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  UploadCloud,
  Store,
  EyeOff,
  Map as MapIcon,
  Share2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import { InterestedLeadSection } from './business-form/InterestedLeadSection';
import { BusinessPaymentModal } from './business-form/BusinessPaymentModal';
import { FormLocationSection } from './business-form/FormLocationSection';
import { FormMediaSection } from './business-form/FormMediaSection';
import { safeGetLocalStorageItem, safeSetLocalStorageItem, safeRemoveLocalStorageItem } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import { isRepAccountDeleted } from '../utils/accountStatus';

interface BusinessFormProps {
  currentRep: Representative | null;
  currentUser?: UserType | null;
  onSubmitBusiness: (business: Business) => void;
  onShowInvoice: (biz: Business) => void;
  businesses?: Business[];
  onSaveLead?: (lead: InterestedLead) => void;
  initialLead?: InterestedLead | null;
  onOpenPackages?: () => void;
}

export const BusinessForm: React.FC<BusinessFormProps> = ({
  currentRep,
  currentUser,
  onSubmitBusiness,
  onShowInvoice,
  onSaveLead,
  initialLead,
}) => {

  // Registration Mode: 1. New Google Package, 2. Already on Google Maps, 3. Interested Lead
  const [registrationType, setRegistrationType] = useState<'new_verification' | 'already_on_google' | 'interested_lead'>('new_verification');
  const [alreadyGoogleMapsUrl, setAlreadyGoogleMapsUrl] = useState<string>('');

  // Form State
  const [nameAr, setNameAr] = useState<string>(initialLead?.businessName || '');
  const [nameEn, setNameEn] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    const found = getGroupFromCategory(initialLead?.businessCategory);
    return found?.group || CATEGORY_GROUPS[0].group;
  });
  const [category, setCategory] = useState<string>(() => {
    return initialLead?.businessCategory || CATEGORY_GROUPS[0].items[0];
  });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [governorate, setGovernorate] = useState<string>(initialLead?.governorate || 'الجيزة');
  const [city, setCity] = useState<string>(initialLead?.city || 'حدائق الأهرام');
  const [street, setStreet] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [phone, setPhone] = useState<string>(initialLead?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState<string>('');
  const [workingHours, setWorkingHours] = useState<string>('يومياً من 9:00 صباحاً حتى 11:00 مساءً');
  const [description, setDescription] = useState<string>('');

  // Owner Info
  const [ownerName, setOwnerName] = useState<string>(initialLead?.clientName || '');
  const [ownerPhone, setOwnerPhone] = useState<string>(initialLead?.phone || '');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');

  // Sync with initialLead when prop changes
  useEffect(() => {
    if (initialLead) {
      if (initialLead.clientName) setOwnerName(initialLead.clientName);
      if (initialLead.businessName) setNameAr(initialLead.businessName);
      if (initialLead.phone) {
        setPhone(initialLead.phone);
        setOwnerPhone(initialLead.phone);
      }
      if (initialLead.governorate) {
        setGovernorate(initialLead.governorate);
        setLeadGov(initialLead.governorate);
      }
      if (initialLead.city) {
        setCity(initialLead.city);
        setLeadCity(initialLead.city);
      }
      if (initialLead.street) {
        setStreet(initialLead.street);
        setLeadStreet(initialLead.street);
      }
      if (initialLead.lat && initialLead.lng) {
        setLat(initialLead.lat);
        setLng(initialLead.lng);
        setShowMap(true);
        setLeadLat(initialLead.lat);
        setLeadLng(initialLead.lng);
        setHasLeadLocation(true);
      }
      if (initialLead.businessCategory) {
        setCategory(initialLead.businessCategory);
        const found = getGroupFromCategory(initialLead.businessCategory);
        if (found) setSelectedGroup(found.group);
      }
    }
  }, [initialLead]);

  const handleGroupChange = (newGroupName: string) => {
    setSelectedGroup(newGroupName);
    const grp = CATEGORY_GROUPS.find((g) => g.group === newGroupName);
    if (grp && grp.items.length > 0) {
      setCategory(grp.items[0]);
    }
  };

  const currentGroupObj = CATEGORY_GROUPS.find((g) => g.group === selectedGroup) || CATEGORY_GROUPS[0];

  // Lead Section State at the bottom
  const [showLeadSection, setShowLeadSection] = useState<boolean>(false);
  const [leadClientName, setLeadClientName] = useState<string>('');
  const [leadBizName, setLeadBizName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadGov, setLeadGov] = useState<string>('الجيزة');
  const [leadCity, setLeadCity] = useState<string>('');
  const [leadStreet, setLeadStreet] = useState<string>('');
  const [isSavingLead, setIsSavingLead] = useState<boolean>(false);
  const [leadInterest, setLeadInterest] = useState<LeadInterestLevel>('medium');
  const [leadFollowDate, setLeadFollowDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [leadNotes, setLeadNotes] = useState<string>('');
  const [leadSuccessMsg, setLeadSuccessMsg] = useState<string | null>(null);
  const [savedLeadForWhatsApp, setSavedLeadForWhatsApp] = useState<InterestedLead | null>(null);

  // GPS Coordinates & Map  // Location Coordinates (Default: حدائق الأهرام - الجيزة)
  const [lat, setLat] = useState<number>(29.9753);
  const [lng, setLng] = useState<number>(31.1120);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      let bestPosition: GeolocationPosition | null = null;
      let watchId: number | null = null;
      let sampleCount = 0;

      const finalizePosition = async (pos: GeolocationPosition) => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        setIsLocating(false);

        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);

        setLat(userLat);
        setLng(userLng);

        const addrDetails = await fetchLocationAddress(userLat, userLng);
        if (addrDetails.governorate) setGovernorate(addrDetails.governorate);
        if (addrDetails.city) setCity(addrDetails.city);
        if (addrDetails.street) setStreet(addrDetails.street);
        if (addrDetails.landmark) setLandmark(addrDetails.landmark);

        setAutoFillNotice(`🎯 تم تحديد الموقع بدقة قمر صناعي عالية (±${acc}م) - الإحداثيات: ${userLat}, ${userLng}`);
        setTimeout(() => setAutoFillNotice(null), 6000);
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          sampleCount++;
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }
          if (position.coords.accuracy <= 8 || sampleCount >= 4) {
            finalizePosition(bestPosition || position);
          }
        },
        (error) => {
          console.warn('Geolocation error / fallback:', error);
          if (bestPosition) {
            finalizePosition(bestPosition);
          } else {
            setIsLocating(false);
            setAutoFillNotice('⚠️ تعذر جلب GPS تلقائياً، يمكنك فتح الخريطة لتحديد الموقع يدوياً.');
            setTimeout(() => setAutoFillNotice(null), 5000);
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );

      setTimeout(() => {
        if (isLocating && bestPosition) {
          finalizePosition(bestPosition);
        } else if (isLocating) {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          setIsLocating(false);
        }
      }, 4500);
    } else {
      setIsLocating(false);
      alert('خدمة GPS غير مدعومة على متصفحك.');
    }
  };

  // 📍 Interested Lead Location States & GPS
  const [leadLat, setLeadLat] = useState<number>(29.9753);
  const [leadLng, setLeadLng] = useState<number>(31.1120);
  const [hasLeadLocation, setHasLeadLocation] = useState<boolean>(false);
  const [showLeadMap, setShowLeadMap] = useState<boolean>(false);
  const [isLocatingLead, setIsLocatingLead] = useState<boolean>(false);
  const [leadLocationNotice, setLeadLocationNotice] = useState<string | null>(null);

  const handleGetLeadLocation = () => {
    setIsLocatingLead(true);
    triggerHaptic('light');
    if ('geolocation' in navigator) {
      let bestPosition: GeolocationPosition | null = null;
      let watchId: number | null = null;
      let sampleCount = 0;

      const finalizeLeadPosition = async (pos: GeolocationPosition) => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        setIsLocatingLead(false);

        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);

        setLeadLat(userLat);
        setLeadLng(userLng);
        setHasLeadLocation(true);
        triggerHaptic('success');

        const addrDetails = await fetchLocationAddress(userLat, userLng);
        if (addrDetails.governorate) setLeadGov(addrDetails.governorate);
        if (addrDetails.city) setLeadCity(addrDetails.city);
        if (addrDetails.street && !leadStreet) setLeadStreet(addrDetails.street);
        else if (addrDetails.landmark && !leadStreet) setLeadStreet(addrDetails.landmark);

        setLeadLocationNotice(`🎯 تم تحديد موقع العميل بدقة (±${acc}م) - الإحداثيات: ${userLat}, ${userLng}`);
        setTimeout(() => setLeadLocationNotice(null), 6000);
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          sampleCount++;
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }
          if (position.coords.accuracy <= 8 || sampleCount >= 4) {
            finalizeLeadPosition(bestPosition || position);
          }
        },
        (error) => {
          console.warn('Geolocation lead error / fallback:', error);
          if (bestPosition) {
            finalizeLeadPosition(bestPosition);
          } else {
            setIsLocatingLead(false);
            setLeadLocationNotice('⚠️ تعذر جلب GPS تلقائياً، يمكنك فتح الخريطة لتحديد الموقع يدوياً.');
            setTimeout(() => setLeadLocationNotice(null), 5000);
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );

      setTimeout(() => {
        if (isLocatingLead && bestPosition) {
          finalizeLeadPosition(bestPosition);
        } else if (isLocatingLead) {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          setIsLocatingLead(false);
        }
      }, 4500);
    } else {
      setIsLocatingLead(false);
      alert('خدمة GPS غير مدعومة على متصفحك.');
    }
  };

  // Package & Payments
  const isRep = currentUser ? currentUser.role === 'rep' : Boolean(currentRep);
  const canExempt = canUserManageFeeExemption(currentUser || null) || currentRep?.role === 'admin' || currentRep?.role === 'supervisor' || currentRep?.role === 'accountant';
  const [isFeeExempt, setIsFeeExempt] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(PACKAGES[0]); // Default Package 1 (Basic 250 EGP)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(() => isRep ? 'unpaid' : 'fully_paid');
  const [amountPaid, setAmountPaid] = useState<number>(() => isRep ? 0 : PACKAGES[0].price);
  const [paymentMethod, setPaymentMethod] = useState<Business['paymentMethod']>(() => isRep ? 'platform_collected' : 'cash_by_rep');
  const [notes, setNotes] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Photos & Short Videos attached
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Auto fill status notice
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

  // Success State
  const [submittedBusiness, setSubmittedBusiness] = useState<Business | null>(null);
  const [showMapsSyncModal, setShowMapsSyncModal] = useState<boolean>(false);

  // Auto-scroll window to top when submittedBusiness changes or form resets
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [submittedBusiness]);

  // ── 📝 DRAFT AUTO-SAVE & RESTORATION (PROTECTS FIELD REPS FROM DATA LOSS) ──
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  // 1. Restore draft on initial mount if not provided initialLead
  useEffect(() => {
    if (initialLead) return;
    try {
      const savedDraftStr = safeGetLocalStorageItem('dalelak_business_form_draft');
      if (savedDraftStr) {
        const d = JSON.parse(savedDraftStr);
        if (d && (d.nameAr || d.phone || d.street)) {
          if (d.nameAr) setNameAr(d.nameAr);
          if (d.nameEn) setNameEn(d.nameEn);
          if (d.category) setCategory(d.category);
          if (d.selectedGroup) setSelectedGroup(d.selectedGroup);
          if (d.governorate) setGovernorate(d.governorate);
          if (d.city) setCity(d.city);
          if (d.street) setStreet(d.street);
          if (d.landmark) setLandmark(d.landmark);
          if (d.phone) setPhone(d.phone);
          if (d.secondaryPhone) setSecondaryPhone(d.secondaryPhone);
          if (d.workingHours) setWorkingHours(d.workingHours);
          if (d.description) setDescription(d.description);
          if (d.ownerName) setOwnerName(d.ownerName);
          if (d.ownerPhone) setOwnerPhone(d.ownerPhone);
          if (d.ownerEmail) setOwnerEmail(d.ownerEmail);
          if (d.nationalId) setNationalId(d.nationalId);
          if (d.notes) setNotes(d.notes);
          if (d.lat && d.lng) {
            setLat(d.lat);
            setLng(d.lng);
          }
          setDraftRestored(true);
        }
      }
    } catch (e) {}
  }, []);

  // 2. Auto-save draft on any field change
  useEffect(() => {
    if (submittedBusiness) return;
    if (!nameAr && !phone && !street && !ownerName) return;

    const draft = {
      nameAr,
      nameEn,
      category,
      selectedGroup,
      governorate,
      city,
      street,
      landmark,
      phone,
      secondaryPhone,
      workingHours,
      description,
      ownerName,
      ownerPhone,
      ownerEmail,
      nationalId,
      notes,
      lat,
      lng,
      updatedAt: Date.now(),
    };
    safeSetLocalStorageItem('dalelak_business_form_draft', JSON.stringify(draft));
  }, [
    nameAr, nameEn, category, selectedGroup, governorate, city, street,
    landmark, phone, secondaryPhone, workingHours, description,
    ownerName, ownerPhone, ownerEmail, nationalId, notes, lat, lng,
    submittedBusiness,
  ]);

  const clearDraft = () => {
    safeRemoveLocalStorageItem('dalelak_business_form_draft');
    setDraftRestored(false);
  };

  const resetForm = () => {
    clearDraft();
    setNameAr('');
    setNameEn('');
    setCategory(BUSINESS_CATEGORIES[0]);
    setGovernorate('القاهرة');
    setCity('');
    setStreet('');
    setLandmark('');
    setPhone('');
    setSecondaryPhone('');
    setWorkingHours('يومياً من 9:00 صباحاً حتى 11:00 مساءً');
    setDescription('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setNationalId('');
    setIsFeeExempt(false);
    setSelectedPackage(PACKAGES[0]);
    if (isRep) {
      setPaymentStatus('unpaid');
      setAmountPaid(0);
      setPaymentMethod('platform_collected');
    } else {
      setPaymentStatus('fully_paid');
      setAmountPaid(PACKAGES[0].price);
      setPaymentMethod('cash_by_rep');
    }
    setNotes('');
    setPhotos([]);
    setVideos([]);
    setVideoError(null);
    setSubmittedBusiness(null);
    setShowPaymentModal(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handlePaymentStatusChange = (status: PaymentStatus) => {
    if (isRep) {
      setPaymentStatus('unpaid');
      setAmountPaid(0);
      setPaymentMethod('platform_collected');
      return;
    }
    if (isFeeExempt) {
      setPaymentStatus('fully_paid');
      setAmountPaid(0);
      return;
    }
    setPaymentStatus(status);
    if (status === 'fully_paid') {
      setAmountPaid(selectedPackage.price);
    } else if (status === 'unpaid') {
      setAmountPaid(0);
    } else {
      setAmountPaid(Math.round(selectedPackage.price / 2));
    }
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Compressed Photo upload handler with mandatory automatic Daleelek Watermark branding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingPhoto(true);
      const newCompressedPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i], 1000, 1000, 0.72, {
            applyWatermark: true,
            position: 'bottom-right',
          });
          // Upload directly to Supabase Storage 'business-media' bucket
          const publicUrl = await uploadMediaToSupabaseStorage(compressed, 'photos');
          newCompressedPhotos.push(publicUrl);
        } catch (err) {
          console.warn('Image compression/upload error:', err);
        }
      }
      if (newCompressedPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...newCompressedPhotos]);
      }
      e.target.value = '';
      setIsUploadingPhoto(false);
    }
  };

  // Post-Registration Short Video upload handler (Direct Supabase Storage Stream)
  const handlePostRegistrationVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!submittedBusiness) return;
    const files = e.target.files;
    setVideoError(null);
    if (files && files.length > 0) {
      setIsUploadingVideo(true);
      const newVideos: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const validation = await validateAndProcessShortVideo(file, 30.5);
          if (!validation.valid) {
            setVideoError(validation.error || 'الملف غير صالح أو يتجاوز 30 ثانية.');
            continue;
          }

          const publicVideoUrl = await uploadMediaToSupabaseStorage(file, 'videos');
          if (publicVideoUrl && (publicVideoUrl.startsWith('http://') || publicVideoUrl.startsWith('https://'))) {
            newVideos.push(publicVideoUrl);
          } else {
            setVideoError('تعذر رفع الفيديو سحابياً لضعف شبكة الإنترنت. يرجى إعادة المحاولة.');
          }
        } catch (err) {
          console.warn('Post-registration video upload error:', err);
          setVideoError('تعذر معالجة ملف الفيديو.');
        }
      }

      if (newVideos.length > 0) {
        const currentVideos = Array.isArray(submittedBusiness.videos) ? submittedBusiness.videos : [];
        const updatedVideos = [...currentVideos, ...newVideos];
        const updatedBusiness: Business = { ...submittedBusiness, videos: updatedVideos };
        setSubmittedBusiness(updatedBusiness);
        onSubmitBusiness(updatedBusiness);
        await updateBusinessInDb(submittedBusiness.id, { videos: updatedVideos });
      }

      e.target.value = '';
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveSubmittedVideo = async (indexToRemove: number) => {
    if (!submittedBusiness) return;
    const currentVideos = Array.isArray(submittedBusiness.videos) ? submittedBusiness.videos : [];
    const updatedVideos = currentVideos.filter((_, idx) => idx !== indexToRemove);
    const updatedBusiness: Business = { ...submittedBusiness, videos: updatedVideos };
    setSubmittedBusiness(updatedBusiness);
    onSubmitBusiness(updatedBusiness);
    await updateBusinessInDb(submittedBusiness.id, { videos: updatedVideos });
  };

  // Listen for bottom navigation trigger
  useEffect(() => {
    const handleRemoteSubmit = () => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleInitiateSubmit(fakeEvent);
    };

    window.addEventListener('dalelak_submit_business_form', handleRemoteSubmit);
    return () => {
      window.removeEventListener('dalelak_submit_business_form', handleRemoteSubmit);
    };
  }, [nameAr, nameEn, ownerName, ownerPhone, phone, secondaryPhone, paymentStatus, selectedPackage]);



  const handleSaveLeadSubmit = async () => {
    // 🛡️ Security Check: Block submission if user or currentRep is deleted/blacklisted
    if (isRepAccountDeleted(currentUser) || isRepAccountDeleted(currentRep)) {
      setErrorMsg('⛔ هذا الحساب تم حذفه أو تعطيله من قِبل إدارة المنظومة، ولا يمكنه رفع أو تسجيل أنشطة تجارية.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!leadClientName.trim() && !leadBizName.trim()) {
      alert('يرجى إدخال اسم العميل أو اسم النشاط على الأقل');
      return;
    }
    if (!leadPhone.trim()) {
      alert('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }

    setIsSavingLead(true);
    try {
      const locationMapUrl = hasLeadLocation ? `https://www.google.com/maps?q=${leadLat},${leadLng}` : undefined;
      const cleanNotes = leadNotes.trim();
      const combinedNotes = hasLeadLocation && locationMapUrl
        ? (cleanNotes ? `${cleanNotes}\n\n📍 موقع الخريطة: ${locationMapUrl}` : `📍 موقع الخريطة: ${locationMapUrl}`)
        : cleanNotes || undefined;

      const lead: InterestedLead = {
        id: `lead_${Date.now()}`,
        clientName: leadClientName.trim() || 'عميل مهتم',
        businessName: leadBizName.trim() || undefined,
        phone: leadPhone.trim(),
        governorate: leadGov,
        city: leadCity.trim() || undefined,
        street: leadStreet.trim() || undefined,
        lat: hasLeadLocation ? leadLat : undefined,
        lng: hasLeadLocation ? leadLng : undefined,
        locationUrl: locationMapUrl,
        interestLevel: leadInterest,
        followUpDate: leadFollowDate || undefined,
        notes: combinedNotes,
        createdDate: new Date().toISOString(),
        repId: currentRep?.id || 'rep_1',
        repName: currentRep?.name || 'مندوب معتمد',
        status: 'pending_followup',
      };

      if (onSaveLead) {
        onSaveLead(lead);
      } else {
        await saveLeadToDb(lead);
      }

      setLeadSuccessMsg(`✅ تم حفظ بيانات العميل "${lead.clientName}" بنجاح في مركز المراجعات والمتابعة!`);
      setLeadClientName('');
      setLeadBizName('');
      setLeadPhone('');
      setLeadGov('الجيزة');
      setLeadCity('');
      setLeadStreet('');
      setLeadNotes('');
      setHasLeadLocation(false);
      setShowLeadMap(false);
      setLeadLocationNotice(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLead(false);
    }
  };

  const handleDirectAlreadyOnGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nameAr.trim() && !nameEn.trim()) {
      setErrorMsg('⚠️ يرجى إدخال اسم النشاط التجاري');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalOwner = ownerName.trim() || 'صاحب النشاط';
    const finalPhone = (ownerPhone.trim() || phone.trim());

    if (!finalPhone) {
      setErrorMsg('⚠️ يرجى إدخال رقم هاتف الواتساب أو هاتف المحل للتواصل وإصدار الفاتورة الترحيبية');
      window.scrollTo({ top: 250, behavior: 'smooth' });
      return;
    }

    if (!alreadyGoogleMapsUrl.trim()) {
      setErrorMsg('⚠️ يرجى إدخال الرابط الدقيق للنشاط الظاهر على خرائط Google');
      window.scrollTo({ top: 250, behavior: 'smooth' });
      return;
    }

    // 🛡️ Security Check: Block submission if user or currentRep is deleted/blacklisted
    if (isRepAccountDeleted(currentUser) || isRepAccountDeleted(currentRep)) {
      setErrorMsg('⛔ هذا الحساب تم حذفه أو تعطيله من قِبل إدارة المنظومة، ولا يمكنه رفع أو تسجيل أنشطة تجارية.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const timestamp = Date.now();
    const finalNameAr = (nameAr && nameAr.trim()) || (nameEn && nameEn.trim()) || 'نشاط تجاري قائم';
    const finalNameEn = nameEn?.trim() || undefined;
    const finalGoogleMapUrl = alreadyGoogleMapsUrl.trim() || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined);

    const newBusiness: Business = {
      id: `biz_${timestamp}`,
      nameAr: finalNameAr,
      nameEn: finalNameEn,
      category,
      governorate,
      city,
      street: street.trim() || 'الموقع الجغرافي المسجل على الخريطة',
      landmark: landmark.trim() || undefined,
      phone: finalPhone,
      secondaryPhone: secondaryPhone.trim() || undefined,
      workingHours: workingHours.trim() || 'يومياً',
      description: description.trim() || `نشاط ${finalNameAr} في ${governorate} - ${city}`,
      lat: lat || 30.0444,
      lng: lng || 31.2357,
      ownerName: finalOwner,
      ownerPhone: finalPhone,
      ownerEmail: ownerEmail.trim() || undefined,
      nationalId: nationalId.trim() || undefined,
      photos: Array.isArray(photos) ? photos : [],
      videos: Array.isArray(videos) ? videos : [],
      repId: currentRep?.id || 'rep_1',
      repName: currentRep?.name || 'مندوب معتمد',
      packageId: ALREADY_ON_GOOGLE_PACKAGE.id,
      packageName: ALREADY_ON_GOOGLE_PACKAGE.title,
      packagePrice: 0,
      amountPaid: 0,
      isFeeExempt: true,
      isAlreadyOnGoogle: true,
      registrationType: 'already_on_google',
      feeExemptionReason: 'نشاط مسجل ومفعل بالفعل على خرائط Google (إدراج مجاني بدون رسوم وعمولات)',
      paymentMethod: 'platform_collected',
      cashCollectedByRep: 0,
      paymentStatus: 'fully_paid',
      verificationStatus: 'pending', // Requires admin review and confirmation before publishing on public directory
      googleMapsUrl: finalGoogleMapUrl,
      googleSyncStatus: 'not_synced',
      googleSyncDate: undefined,
      invoiceNumber: `INV-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString(),
      notes: notes || undefined,
    };

    clearDraft();
    triggerHaptic('success');
    onSubmitBusiness(newBusiness);
    setSubmittedBusiness(newBusiness);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 🛡️ Security Check: Block submission if user or currentRep is deleted/blacklisted
    if (isRepAccountDeleted(currentUser) || isRepAccountDeleted(currentRep)) {
      setErrorMsg('⛔ هذا الحساب تم حذفه أو تعطيله من قِبل إدارة المنظومة، ولا يمكنه رفع أو تسجيل أنشطة تجارية.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (registrationType === 'interested_lead') {
      handleSaveLeadSubmit();
      return;
    }
    if (registrationType === 'already_on_google') {
      handleDirectAlreadyOnGoogleSubmit(e);
      return;
    }

    if (!nameAr.trim() && !nameEn.trim()) {
      setErrorMsg('⚠️ يرجى إدخال اسم النشاط التجاري (باللغة العربية أو باللغة الإنجليزية)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalOwner = ownerName.trim() || 'صاحب النشاط';
    const finalPhone = (ownerPhone.trim() || phone.trim());

    if (!finalPhone) {
      setErrorMsg('⚠️ يرجى إدخال رقم هاتف الواتساب أو هاتف المحل للتواصل وإصدار الفاتورة');
      window.scrollTo({ top: 250, behavior: 'smooth' });
      return;
    }

    if (!ownerName.trim()) {
      setOwnerName(finalOwner);
    }
    if (!ownerPhone.trim() && phone.trim()) {
      setOwnerPhone(phone.trim());
    }

    // Ensure amountPaid is synced with package if fully_paid
    if (isRep) {
      setPaymentStatus('unpaid');
      setAmountPaid(0);
      setPaymentMethod('platform_collected');
    } else if (paymentStatus === 'fully_paid') {
      setAmountPaid(selectedPackage.price);
    }

    // Open Payment Details Confirmation Popup
    setShowPaymentModal(true);
  };

  const handleFinalConfirmPayment = () => {
    const timestamp = Date.now();
    const finalNameAr = (nameAr && nameAr.trim()) || (nameEn && nameEn.trim()) || 'نشاط تجاري جديد';
    const finalNameEn = nameEn?.trim() || undefined;
    const finalOwnerName = (ownerName && ownerName.trim()) || 'صاحب النشاط';
    const finalPhone = (phone && phone.trim()) || (ownerPhone && ownerPhone.trim()) || '01000000000';
    const finalOwnerPhone = (ownerPhone && ownerPhone.trim()) || (phone && phone.trim()) || finalPhone;

    const newBusiness: Business = {
      id: `biz_${timestamp}`,
      nameAr: finalNameAr,
      nameEn: finalNameEn,
      category: category || 'عام',
      governorate: governorate || 'القاهرة',
      city: city?.trim() || governorate || 'القاهرة',
      street: street?.trim() || 'الموقع الجغرافي المسجل على الخريطة',
      landmark: landmark?.trim() || undefined,
      phone: finalPhone,
      secondaryPhone: secondaryPhone?.trim() || undefined,
      workingHours: workingHours || 'يومياً من 9:00 صباحاً حتى 11:00 مساءً',
      description: description?.trim() || `نشاط ${finalNameAr} في ${governorate}`,
      lat,
      lng,
      ownerName: finalOwnerName,
      ownerPhone: finalOwnerPhone,
      ownerEmail: ownerEmail?.trim() || undefined,
      nationalId: nationalId?.trim() || undefined,
      photos: Array.isArray(photos) ? photos : [],
      videos: Array.isArray(videos) ? videos : [],
      repId: currentRep?.id || 'rep_1',
      repName: currentRep?.name || 'مندوب معتمد',
      packageId: isFeeExempt ? EXEMPT_PACKAGE.id : selectedPackage.id,
      packageName: isFeeExempt ? EXEMPT_PACKAGE.title : selectedPackage.title,
      packagePrice: isFeeExempt ? 0 : selectedPackage.price,
      amountPaid: isFeeExempt || isRep ? 0 : (Number(amountPaid) || 0),
      isFeeExempt: isFeeExempt || undefined,
      feeExemptionReason: isFeeExempt ? 'نشاط رائج ومعلم بالمنطقة (إدراج مجاني بدون مقابل مالي)' : undefined,
      // Set payment method and cash in hand accurately:
      paymentMethod: isFeeExempt || isRep || paymentStatus === 'unpaid' ? 'platform_collected' : paymentMethod,
      cashCollectedByRep: !isFeeExempt && !isRep && paymentStatus !== 'unpaid' && paymentMethod === 'cash_by_rep' ? Number(amountPaid) : 0,
      paymentStatus: isFeeExempt ? 'fully_paid' : (isRep ? 'unpaid' : paymentStatus),
      verificationStatus: 'pending', // Default: new registration, not submitted to Google yet
      repLocationUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      googleMapsUrl: undefined, // Strictly verified by Admin only
      googleSyncStatus: 'not_synced',
      invoiceNumber: `INV-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString(),
      notes: notes || undefined,
    };

    clearDraft();
    triggerHaptic('success');
    setShowPaymentModal(false);
    onSubmitBusiness(newBusiness);
    setSubmittedBusiness(newBusiness);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  if (submittedBusiness) {
    return (
      <div className="max-w-xl mx-auto mt-6 sm:mt-10 bg-[var(--bg-card)] border border-emerald-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl text-center space-y-5 animate-fade-in-up">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-300 dark:border-emerald-700/50">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-2">تم تسجيل وحفظ النشاط بنجاح! 🎉</h2>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm leading-relaxed">
            تم حفظ بيانات نشاط <span className="font-bold text-[var(--text-primary)] px-1">{submittedBusiness.nameAr}</span> بأمان في المنظومة وإصدار الفاتورة الإلكترونية المعتمدة.
          </p>
        </div>
        
        <div className="bg-[var(--input-bg)] rounded-2xl p-3.5 border border-[var(--border-color)] flex justify-between items-center text-xs font-bold shadow-xs">
          <span className="text-[var(--text-secondary)]">حالة النشاط في المنظومة:</span>
          <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>مسجل ومتاح للعملاء (قيد المراجعة)</span>
          </span>
        </div>

        {/* 🎬 Optional Post-Registration Short Video Card */}
        <div className="bg-[var(--input-bg)] border border-amber-500/35 rounded-2xl p-4 space-y-3 text-right shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
            <div className="flex items-center gap-2 text-amber-500">
              <Film className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                  خطوة إضافية: فيديو ترويجي للنشاط (Reels / Shorts)
                </h4>
                <p className="text-[10.5px] text-[var(--text-muted)] font-bold mt-0.5">
                  اختياري • تصوير جولة سريعة داخل المحل أو للمنتجات حتى 30 ثانية
                </p>
              </div>
            </div>
            <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/25">
              {(submittedBusiness.videos?.length || 0)} فيديو
            </span>
          </div>

          {videoError && (
            <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-400 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{videoError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm">
              {isUploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4 stroke-[2.5]" />}
              <span>{isUploadingVideo ? 'جاري رفع الفيديو سحابياً...' : '🎬 تسجيل فيديو فوري بالكاميرا'}</span>
              <input type="file" accept="video/*" capture="environment" onChange={handlePostRegistrationVideoUpload} className="hidden" disabled={isUploadingVideo} />
            </label>

            <label className="flex-1 bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold py-2.5 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-xs">
              <UploadCloud className="w-4 h-4 text-amber-500" />
              <span>📁 اختيار فيديو من المعرض</span>
              <input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*" multiple onChange={handlePostRegistrationVideoUpload} className="hidden" disabled={isUploadingVideo} />
            </label>
          </div>

          {submittedBusiness.videos && submittedBusiness.videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {submittedBusiness.videos.map((vid, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-slate-950 shadow-md">
                  <video src={vid} controls playsInline preload="metadata" className="w-full h-36 object-cover bg-black" />
                  <VideoWatermarkBadge position="bottom-right" />
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                    <span className="bg-slate-950/80 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/30">
                      🎬 فيديو {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubmittedVideo(idx)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow cursor-pointer transition-transform active:scale-95"
                      title="حذف الفيديو"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {(currentRep?.role === 'admin' || currentRep?.role === 'supervisor') && (
            <button
              onClick={() => setShowMapsSyncModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-3.5 px-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 border border-blue-500/40 cursor-pointer text-sm"
            >
              <CloudUpload className="w-5 h-5" />
              <span>مزامنة وتوثيق النشاط على خرائط Google 🗺️</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onShowInvoice(submittedBusiness)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-emerald-700/50 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>معاينة وإصدار الفاتورة</span>
            </button>
            
            <button
              onClick={() => setSubmittedBusiness(null)}
              className="flex-1 bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-5 h-5" />
              <span>تعديل البيانات</span>
            </button>
          </div>
        </div>

        {/* Google Maps Sync Modal */}
        <GoogleMapsSyncModal
          business={submittedBusiness}
          isOpen={showMapsSyncModal}
          onClose={() => setShowMapsSyncModal(false)}
          onUpdateBusiness={(updated) => {
            setSubmittedBusiness(updated);
            onSubmitBusiness(updated);
          }}
        />

        <div className="pt-4 border-t border-[var(--border-color)] mt-6">
          <button 
             onClick={resetForm}
             className="text-sm text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
             <Store className="w-4 h-4" />
             <span>تسجيل نشاط تجاري جديد</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleInitiateSubmit} className="max-w-3xl mx-auto space-y-6 pb-36 sm:pb-24">
      {errorMsg && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-pulse-subtle">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 📋 Auto-Restored Draft Notification Banner */}
      {draftRestored && (
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>تم استرجاع مسودة تسجيل غير مكتملة تلقائياً 📋</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearDraft();
              resetForm();
              triggerHaptic('medium');
            }}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-xl text-[11px] font-black transition-colors cursor-pointer shrink-0"
          >
            مسح المسودة
          </button>
        </div>
      )}

      {/* Step Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-lg">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">تسجيل وتوثيق نشاط تجاري جديد في المنظومة</h2>
            <p className="text-xs text-amber-300 font-bold mt-0.5">
              تعبئة كافة البيانات وتوثيق النشاط الميداني وإصدار الفاتورة فورياً في مصر
            </p>
          </div>
        </div>
      </div>


      {/* ── 🚀 UNIFIED REGISTRATION MODE SELECTOR (3 OPTIONS) ── */}
      <div className="bg-[var(--bg-card)] border-2 border-amber-500/30 rounded-3xl p-3 shadow-md space-y-2">
        <span className="text-[11px] font-black text-[var(--text-muted)] block px-1 text-right">
          اختر نوع وطبيعة التسجيل الميداني:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Mode 1: New Google Maps Verification */}
          <button
            type="button"
            onClick={() => setRegistrationType('new_verification')}
            className={`p-3 rounded-2xl font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
              registrationType === 'new_verification'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-500 shadow-md scale-[1.02]'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <div className="text-center sm:text-right">
              <span className="block font-black leading-tight">باقة خرائط جوجل</span>
              <span className="text-[9.5px] opacity-80 block">توثيق جديد (250 / 750 / 2000 ج)</span>
            </div>
          </button>

          {/* Mode 2: Already on Google Maps */}
          <button
            type="button"
            onClick={() => setRegistrationType('already_on_google')}
            className={`p-3 rounded-2xl font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
              registrationType === 'already_on_google'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md scale-[1.02]'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-500/40'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <div className="text-center sm:text-right">
              <span className="block font-black leading-tight">نشاط مسجل بالفعل</span>
              <span className="text-[9.5px] opacity-80 block">مفعل على Google (إدراج مجاني)</span>
            </div>
          </button>

          {/* Mode 3: Interested Lead */}
          <button
            type="button"
            onClick={() => setRegistrationType('interested_lead')}
            className={`p-3 rounded-2xl font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
              registrationType === 'interested_lead'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md scale-[1.02]'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-emerald-500/40'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <div className="text-center sm:text-right">
              <span className="block font-black leading-tight">عميل مهتم / زيارة</span>
              <span className="text-[9.5px] opacity-80 block">تسجيل طلب متابعة ومراجعة</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── MODE 3 VIEW: INTERESTED LEAD REGISTRATION FORM ── */}
      {registrationType === 'interested_lead' && (
        <InterestedLeadSection
          currentRep={currentRep}
          onSaveLead={onSaveLead}
        />
      )}

      {registrationType !== 'interested_lead' && (
        <>
      {/* 1. البيانات الأساسية للنشاط */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
        <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-[var(--border-color)]">
          <Building2 className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">1. بيانات النشاط التجاري (Google Business Profile)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[var(--text-primary)] font-bold">اسم النشاط باللغة العربية</label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">عربي أو إنجليزي</span>
            </div>
            <input
              type="text"
              placeholder="مثال: مطعم وسوبر ماركت الخير"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 transition-all shadow-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[var(--text-primary)] font-bold">اسم النشاط بالإنجليزية</label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">اختياري / بديل</span>
            </div>
            <input
              type="text"
              placeholder="e.g. El Kheer Restaurant"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 transition-all shadow-sm dir-ltr text-right font-sans"
            />
          </div>

          {/* 1. القسم الرئيسي للنشاط */}
          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">
              القسم / النشاط الرئيسي *
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm text-xs sm:text-sm cursor-pointer"
            >
              {CATEGORY_GROUPS.map((g) => (
                <option key={g.group} value={g.group}>
                  {g.icon} {g.group}
                </option>
              ))}
            </select>
          </div>

          {/* 2. التخصص والتصنيف الداخلي */}
          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1 flex items-center justify-between">
              <span>التخصص / التصنيف الداخلي *</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                {currentGroupObj.items.length} تخصص متاح
              </span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm text-xs sm:text-sm cursor-pointer"
            >
              {currentGroupObj.items.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">المحافظة *</label>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. موقع النشاط الجغرافي */}
      <FormLocationSection
        registrationType={registrationType}
        alreadyGoogleMapsUrl={alreadyGoogleMapsUrl}
        setAlreadyGoogleMapsUrl={setAlreadyGoogleMapsUrl}
        lat={lat}
        setLat={setLat}
        lng={lng}
        setLng={setLng}
        isLocating={isLocating}
        handleGetLocation={handleGetLocation}
        showMap={showMap}
        setShowMap={setShowMap}
        autoFillNotice={autoFillNotice}
        setAutoFillNotice={setAutoFillNotice}
        setGovernorate={setGovernorate}
        setCity={setCity}
        setLandmark={setLandmark}
      />

      {/* 3. بيانات صاحب النشاط والتواصل */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
        <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-[var(--border-color)]">
          <User className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">3. بيانات صاحب النشاط للتواصل والفاتورة</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">اسم صاحب النشاط / المسؤول *</label>
            <input
              type="text"
              required
              placeholder="اسم صاحب المحل أو المدير المسؤول"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">رقم هاتف الواتساب (لإرسال الفاتورة) *</label>
            <input
              type="tel"
              required
              placeholder="مثال: 01012345678"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 font-mono dir-ltr text-right shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">رقم هاتف آخر (اختياري)</label>
            <input
              type="tel"
              placeholder="مثال: 01123456789 أو رقم أرضي"
              value={secondaryPhone}
              onChange={(e) => setSecondaryPhone(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 font-mono dir-ltr text-right shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* 4. مرفقات الصور (اللوجو، الواجهة، القائمة) */}
      <FormMediaSection
        photos={photos}
        setPhotos={setPhotos}
        isUploadingPhoto={isUploadingPhoto}
        handleFileUpload={handleFileUpload}
      />

      {errorMsg && (
        <div className="bg-rose-500/15 border-2 border-rose-500/50 text-rose-700 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-black animate-pulse-subtle shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 5. باقات التوثيق والخدمات */}
      {registrationType === 'already_on_google' ? (
        <div className="bg-gradient-to-br from-blue-500/10 via-[var(--bg-card)] to-indigo-500/10 border-2 border-blue-500/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-md text-right">
          <div className="flex items-center gap-2.5 text-blue-500 border-b border-[var(--border-color)] pb-2.5">
            <MapPin className="w-5 h-5" />
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              باقة الإدراج الميداني للأنشطة المسجلة بالفعل على Google Maps
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
            هذا النشاط قائم بالفعل في الشارع ومفعل على خرائط Google. يتم إدراجه في دليل المنظومة كنشاط موثق رسمياً <strong className="text-blue-600 dark:text-blue-400 font-bold">(إدراج مجاني 0 ج.م بدون أي مديونية أو عمولات)</strong> مع توليد فاتورة ترحيبية فورية وإشعار انضمام.
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>قيد المراجعة والاعتماد للرفع على الدليل من قبل الإدارة (0 ج.م)</span>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-amber-500">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">5. باقة التوثيق الميداني المعتمدة</h3>
            </div>
            <span className="text-xs font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 rounded-xl shadow-xs">
              250 ج.م (الباقة الأساسية)
            </span>
          </div>

          <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-500/50 rounded-2xl p-4 space-y-2 text-right shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <span className="font-black text-sm text-[var(--text-primary)]">باقة التوثيق الأساسي لخرائط Google</span>
              </div>
              <span className="font-mono font-black text-base text-amber-600 dark:text-amber-400">250 ج.م</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
              التفعيل الميداني الرسمي واستخراج الإحداثيات الدقيقة على خرائط Google، تثبيت مواعيد العمل والهواتف، ورفع الصور مع إصدار الفاتورة المعتمدة وهدية تصميم باركود QR.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <span>✨ عمولة المندوب المعتمدة:</span>
              <span className="font-mono font-black">+{Math.round((250 * (currentRep?.commissionRate || 42.86)) / 100)} ج.م</span>
              <span className="text-[10px] text-[var(--text-muted)]">(تتاح الباقات الإضافية للتطوير والترقية لاحقاً من قسم التفاصيل)</span>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Admin/Manager Special Feature: Fee-Exempt Popular Area Landmark/Activity */}
      {canExempt && (
        <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300 ${
          isFeeExempt
            ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-500/60 shadow-lg'
            : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-emerald-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                isFeeExempt ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                    نشاط رائج ومعلم بالمنطقة (إدراج مجاني بدون مقابل مالي)
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">
                    خاص بالإدارة
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                  الأنشطة ذات الرواج والشهرة العالية في المنطقة لإثراء الدليل مجاناً (فاتورة 0 ج.م - لا تحتسب ضمن الإحصائيات)
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isFeeExempt}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsFeeExempt(val);
                  if (val) {
                    setSelectedPackage(EXEMPT_PACKAGE);
                    setAmountPaid(0);
                    setPaymentStatus('fully_paid');
                  } else {
                    setSelectedPackage(PACKAGES[0]);
                    setAmountPaid(PACKAGES[0].price);
                    setPaymentStatus('fully_paid');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
            </label>
          </div>
        </div>
      )}

      {/* Submit Action Button */}
      <button
        type="submit"
        className={`w-full font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
          registrationType === 'already_on_google'
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white'
            : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950'
        }`}
      >
        {registrationType === 'already_on_google' ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>إدراج النشاط المسجل وتوليد الفاتورة الترحيبية 📄✨</span>
          </>
        ) : isFeeExempt ? (
          <>
            <CreditCard className="w-5 h-5 stroke-[2.5]" />
            <span>تأكيد تسجيل النشاط الرائج (إدراج مجاني) 🌟</span>
          </>
        ) : isRep ? (
          <>
            <CreditCard className="w-5 h-5 stroke-[2.5]" />
            <span>حفظ النشاط وإصدار الفاتورة المؤجلة 📄</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 stroke-[2.5]" />
            <span>حفظ النشاط وتحديد حالة الدفع والفاتورة 💳</span>
          </>
        )}
      </button>
        </>
      )}

      {/* 💳 Dedicated Payment Confirmation Modal Popup */}
      <BusinessPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        nameAr={nameAr}
        ownerName={ownerName}
        ownerPhone={ownerPhone}
        selectedPackage={selectedPackage}
        isFeeExempt={isFeeExempt}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        paymentMethod={paymentMethod || 'platform_collected'}
        setPaymentMethod={setPaymentMethod}
        notes={notes}
        setNotes={setNotes}
        currentRep={currentRep}
        userRole={currentUser?.role}
        isRep={isRep}
        onConfirmPayment={handleFinalConfirmPayment}
      />
    </form>
  );
};