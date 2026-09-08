import React, { useState, useEffect } from 'react';
import {
  Business,
  PackageOption,
  PaymentStatus,
  Representative,
  InterestedLead,
  User as UserType,
} from '../types';
import {
  BUSINESS_CATEGORIES,
  CATEGORY_GROUPS,
  getGroupFromCategory,
  PACKAGES,
  EXEMPT_PACKAGE,
  ALREADY_ON_GOOGLE_PACKAGE,
} from '../data/mockData';
import { canUserManageFeeExemption } from '../utils/permissions';
import { compressImageFile } from '../utils/imageCompressor';
import { fetchLocationAddress } from '../utils/geocoding';
import { uploadMediaToSupabaseStorage } from '../services/storage';
import { isRepAccountDeleted } from '../utils/accountStatus';
import { triggerHaptic } from '../utils/haptics';
import {
  AlertCircle,
  Sparkles,
  Store,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import {
  useBusinessFormDraft,
  FormRegistrationTypeSection,
  FormGeneralInfoSection,
  FormLocationSection,
  FormOwnerInfoSection,
  FormMediaSection,
  FormPackageSelector,
  BusinessFormSubmittedSuccess,
  InterestedLeadSection,
  BusinessPaymentModal,
} from './business-form';

export interface BusinessFormProps {
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

  // GPS Coordinates & Map
  const [lat, setLat] = useState<number>(29.9753);
  const [lng, setLng] = useState<number>(31.1120);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

  // Package & Payments
  const isRep = currentUser ? currentUser.role === 'rep' : Boolean(currentRep);
  const canExempt = canUserManageFeeExemption(currentUser || null) || currentRep?.role === 'admin' || currentRep?.role === 'supervisor' || currentRep?.role === 'accountant';
  const [isFeeExempt, setIsFeeExempt] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(PACKAGES[0]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(() => (isRep ? 'unpaid' : 'fully_paid'));
  const [amountPaid, setAmountPaid] = useState<number>(() => (isRep ? 0 : PACKAGES[0].price));
  const [paymentMethod, setPaymentMethod] = useState<Business['paymentMethod']>(() => (isRep ? 'platform_collected' : 'cash_by_rep'));
  const [notes, setNotes] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Media
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Success State
  const [submittedBusiness, setSubmittedBusiness] = useState<Business | null>(null);

  // ── 📝 DRAFT AUTO-SAVE & RESTORATION VIA DEDICATED HOOK ──
  const { draftRestored, clearDraft } = useBusinessFormDraft({
    initialLead,
    submittedBusiness,
    fields: {
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
    },
    setters: {
      setNameAr,
      setNameEn,
      setCategory,
      setSelectedGroup,
      setGovernorate,
      setCity,
      setStreet,
      setLandmark,
      setPhone,
      setSecondaryPhone,
      setWorkingHours,
      setDescription,
      setOwnerName,
      setOwnerPhone,
      setOwnerEmail,
      setNationalId,
      setNotes,
      setLat,
      setLng,
    },
  });

  // Sync with initialLead when prop changes
  useEffect(() => {
    if (initialLead) {
      if (initialLead.clientName) setOwnerName(initialLead.clientName);
      if (initialLead.businessName) setNameAr(initialLead.businessName);
      if (initialLead.phone) {
        setPhone(initialLead.phone);
        setOwnerPhone(initialLead.phone);
      }
      if (initialLead.governorate) setGovernorate(initialLead.governorate);
      if (initialLead.city) setCity(initialLead.city);
      if (initialLead.street) setStreet(initialLead.street);
      if (initialLead.lat && initialLead.lng) {
        setLat(initialLead.lat);
        setLng(initialLead.lng);
        setShowMap(true);
      }
      if (initialLead.businessCategory) {
        setCategory(initialLead.businessCategory);
        const found = getGroupFromCategory(initialLead.businessCategory);
        if (found) setSelectedGroup(found.group);
      }
      if (initialLead.locationUrl) {
        setAlreadyGoogleMapsUrl(initialLead.locationUrl);
      }
      if (initialLead.notes) {
        setNotes((prev) => (prev ? `${prev} | ${initialLead.notes}` : initialLead.notes || ''));
      }
      if (initialLead.isTrending || initialLead.interestLevel === 'trending_free') {
        setRegistrationType('already_on_google');
        setIsFeeExempt(true);
        setSelectedPackage(EXEMPT_PACKAGE);
        setAmountPaid(0);
        setPaymentStatus('fully_paid');
      }
    }
  }, [initialLead]);

  // Auto-scroll window to top when submittedBusiness changes or form resets
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [submittedBusiness]);

  const handleGroupChange = (newGroupName: string) => {
    setSelectedGroup(newGroupName);
    const grp = CATEGORY_GROUPS.find((g) => g.group === newGroupName);
    if (grp && grp.items.length > 0) {
      setCategory(grp.items[0]);
    }
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingPhoto(true);
      const newCompressedPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i], 1200, 1200, 0.8, {
            applyWatermark: false,
          });
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
    setSubmittedBusiness(null);
    setShowPaymentModal(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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

  const handleDirectAlreadyOnGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nameAr.trim() && !nameEn.trim()) {
      setErrorMsg('⚠️ يرجى إدخال اسم النشاط التجاري');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalOwner = ownerName.trim() || 'صاحب النشاط';
    const finalPhone = ownerPhone.trim() || phone.trim();

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
      feeExemptionReason: 'مكان مسجل ومفعل بالفعل على خرائط Google (إدراج مجاني بدون رسوم وعمولات)',
      paymentMethod: 'platform_collected',
      cashCollectedByRep: 0,
      paymentStatus: 'fully_paid',
      verificationStatus: 'pending',
      googleMapsUrl: finalGoogleMapUrl,
      googleSyncStatus: finalGoogleMapUrl ? 'synced' : 'not_synced',
      googleSyncDate: finalGoogleMapUrl ? new Date().toISOString().split('T')[0] : undefined,
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
    const finalPhone = ownerPhone.trim() || phone.trim();

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
      amountPaid: isFeeExempt || isRep ? 0 : Number(amountPaid) || 0,
      isFeeExempt: isFeeExempt || undefined,
      feeExemptionReason: isFeeExempt ? 'مكان رائج ومعلم بالمنطقة (إدراج مجاني بدون مقابل مالي)' : undefined,
      paymentMethod: isFeeExempt || isRep || paymentStatus === 'unpaid' ? 'platform_collected' : paymentMethod,
      cashCollectedByRep: !isFeeExempt && !isRep && paymentStatus !== 'unpaid' && paymentMethod === 'cash_by_rep' ? Number(amountPaid) : 0,
      paymentStatus: isFeeExempt ? 'fully_paid' : isRep ? 'unpaid' : paymentStatus,
      verificationStatus: 'pending',
      repLocationUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      googleMapsUrl: undefined,
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

  // When business has been submitted, render dedicated success screen
  if (submittedBusiness) {
    return (
      <BusinessFormSubmittedSuccess
        submittedBusiness={submittedBusiness}
        onShowInvoice={onShowInvoice}
        onSubmitBusiness={onSubmitBusiness}
        setSubmittedBusiness={setSubmittedBusiness}
        resetForm={resetForm}
      />
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
      <FormRegistrationTypeSection
        registrationType={registrationType}
        setRegistrationType={setRegistrationType}
        initialLead={initialLead}
      />

      {/* ── MODE 3 VIEW: INTERESTED LEAD REGISTRATION FORM ── */}
      {registrationType === 'interested_lead' && (
        <InterestedLeadSection currentRep={currentRep} onSaveLead={onSaveLead} />
      )}

      {registrationType !== 'interested_lead' && (
        <>
          {/* 1. البيانات الأساسية للنشاط */}
          <FormGeneralInfoSection
            nameAr={nameAr}
            setNameAr={setNameAr}
            nameEn={nameEn}
            setNameEn={setNameEn}
            selectedGroup={selectedGroup}
            handleGroupChange={handleGroupChange}
            category={category}
            setCategory={setCategory}
            governorate={governorate}
            setGovernorate={setGovernorate}
          />

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
            setNameAr={setNameAr}
            setOwnerPhone={(val) => {
              setOwnerPhone(val);
              setPhone((prev) => (prev ? prev : val));
            }}
            setCategory={(cat) => {
              setCategory(cat);
              const grp = getGroupFromCategory(cat);
              if (grp) setSelectedGroup(grp.group);
            }}
            setSelectedGroup={setSelectedGroup}
            setStreet={setStreet}
            setPhotos={setPhotos}
          />

          {/* 3. بيانات صاحب النشاط والتواصل */}
          <FormOwnerInfoSection
            ownerName={ownerName}
            setOwnerName={setOwnerName}
            ownerPhone={ownerPhone}
            setOwnerPhone={setOwnerPhone}
            secondaryPhone={secondaryPhone}
            setSecondaryPhone={setSecondaryPhone}
          />

          {/* 4. مرفقات الصور (اللوجو، الواجهة، القائمة) */}
          <FormMediaSection
            photos={photos}
            setPhotos={setPhotos}
            isUploadingPhoto={isUploadingPhoto}
            handleFileUpload={handleFileUpload}
            googleMapsUrl={alreadyGoogleMapsUrl}
          />

          {errorMsg && (
            <div className="bg-rose-500/15 border-2 border-rose-500/50 text-rose-700 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-black animate-pulse-subtle shadow-md">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 5. باقات التوثيق والخدمات وإعفاء الإدارة */}
          <FormPackageSelector
            registrationType={registrationType}
            currentRep={currentRep}
            canExempt={canExempt}
            isFeeExempt={isFeeExempt}
            setIsFeeExempt={setIsFeeExempt}
            setSelectedPackage={setSelectedPackage}
            setAmountPaid={setAmountPaid}
            setPaymentStatus={setPaymentStatus}
          />

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
                <span>إدراج النشاط المسجل وتوليد الفاتورة الترحيبية</span>
              </>
            ) : isFeeExempt ? (
              <>
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
                <span>تأكيد تسجيل المنشأة (إدراج مجاني)</span>
              </>
            ) : isRep ? (
              <>
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
                <span>حفظ النشاط وإصدار الفاتورة المؤجلة</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
                <span>حفظ النشاط وتحديد حالة الدفع والفاتورة</span>
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