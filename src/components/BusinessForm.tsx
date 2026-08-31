import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, PackageOption, PaymentStatus, Representative, InterestedLead, LeadInterestLevel } from '../types';
import { EGYPT_GOVERNORATES, BUSINESS_CATEGORIES, CATEGORY_GROUPS, getGroupFromCategory, PACKAGES } from '../data/mockData';
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
  Share2
} from 'lucide-react';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';

interface BusinessFormProps {
  currentRep: Representative | null;
  onSubmitBusiness: (business: Business) => void;
  onShowInvoice: (biz: Business) => void;
  businesses?: Business[];
  onSaveLead?: (lead: InterestedLead) => void;
  initialLead?: InterestedLead | null;
  onOpenPackages?: () => void;
}

export const BusinessForm: React.FC<BusinessFormProps> = ({
  currentRep,
  onSubmitBusiness,
  onShowInvoice,
  onSaveLead,
  initialLead,
}) => {
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
      if (initialLead.governorate) setGovernorate(initialLead.governorate);
      if (initialLead.city) setCity(initialLead.city);
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
  const [leadGov, setLeadGov] = useState<string>('القاهرة');
  const [leadCity, setLeadCity] = useState<string>('');
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

  // Package & Payments
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(PACKAGES[0]); // Default Package 1 (Basic 250 EGP)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('fully_paid');
  const [amountPaid, setAmountPaid] = useState<number>(PACKAGES[0].price);
  const [paymentMethod, setPaymentMethod] = useState<Business['paymentMethod']>('cash_by_rep');
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

  const resetForm = () => {
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
    setSelectedPackage(PACKAGES[0]);
    setPaymentStatus('fully_paid');
    setAmountPaid(PACKAGES[0].price);
    setNotes('');
    setPhotos([]);
    setVideos([]);
    setVideoError(null);
    setSubmittedBusiness(null);
    setShowPaymentModal(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handlePaymentStatusChange = (status: PaymentStatus) => {
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
  const [enableWatermark, setEnableWatermark] = useState<boolean>(true);
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');

  // Compressed Photo upload handler with automatic Daleelek Watermark branding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingPhoto(true);
      const newCompressedPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i], 1000, 1000, 0.72, {
            applyWatermark: enableWatermark,
            position: watermarkPosition,
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

          const videoDataUrl = await convertVideoToDataUrl(file);
          const publicVideoUrl = await uploadMediaToSupabaseStorage(videoDataUrl, 'videos');
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

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
    if (paymentStatus === 'fully_paid') {
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
      videos: [],
      repId: currentRep?.id || 'rep_1',
      repName: currentRep?.name || 'مندوب معتمد',
      packageId: selectedPackage.id,
      packageName: selectedPackage.title,
      packagePrice: selectedPackage.price,
      amountPaid: Number(amountPaid) || 0,
      // Set payment method and cash in hand accurately:
      paymentMethod: paymentStatus === 'unpaid' ? 'platform_collected' : paymentMethod,
      cashCollectedByRep: paymentStatus !== 'unpaid' && paymentMethod === 'cash_by_rep' ? Number(amountPaid) : 0,
      paymentStatus,
      verificationStatus: 'pending', // Default: new registration, not submitted to Google yet
      repLocationUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      googleMapsUrl: undefined, // Strictly verified by Admin only
      googleSyncStatus: 'not_synced',
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString(),
      notes: notes || undefined,
    };

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

      {/* 2. موقع النشاط الجغرافي وتحديد GPS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3 shadow-md transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-amber-500">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">2. موقع النشاط الجغرافي (GPS Coordinates)</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* GPS Locator Button - Always Visible */}
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl shadow transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 fill-slate-950" />}
              <span>{isLocating ? 'جاري تحديد موقعك...' : '📍 تحديد موقعي الحالي'}</span>
            </button>

            {/* Map Toggle Button (Show/Hide) */}
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                showMap
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-amber-500/10'
              }`}
            >
              {showMap ? <EyeOff className="w-4 h-4 text-amber-500" /> : <MapIcon className="w-4 h-4 text-amber-500" />}
              <span>{showMap ? 'إخفاء الخريطة' : 'إظهار الخريطة'}</span>
              {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Current Coordinates Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--input-bg)] px-3.5 py-2 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] text-[11px]">الإحداثيات المسجلة:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 dir-ltr font-bold text-xs bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {showMap ? 'اسحب الخريطة أو الدبوس للتعديل اليدوي الدقيق' : 'اضغط "تحديد موقعي الحالي" للتحديد الفوري أو "إظهار الخريطة" للضبط اليدوي'}
          </span>
        </div>

        {autoFillNotice && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{autoFillNotice}</span>
          </div>
        )}

        {/* Collapsible Interactive Map */}
        {showMap && (
          <div className="animate-fade-in pt-1">
            <InteractiveMap
              mode="picker"
              lat={lat}
              lng={lng}
              onLocationSelect={(newLat, newLng, details) => {
                setLat(newLat);
                setLng(newLng);
                if (details) {
                  if (details.governorate) setGovernorate(details.governorate);
                  if (details.city) setCity(details.city);
                  if (details.landmark) setLandmark(details.landmark);
                  setAutoFillNotice(`✨ تم تحديد النطاق الجغرافي: ${details.governorate || 'الجيزة'} - ${details.city || 'حدائق الأهرام'}`);
                  setTimeout(() => setAutoFillNotice(null), 5000);
                }
              }}
              heightClass="h-[280px]"
            />
          </div>
        )}
      </div>

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
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-amber-500">
            <Camera className="w-5 h-5" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">4. صور النشاط المرفقة (اللوجو / اليافطة / الداخلي)</h3>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Direct Camera Capture */}
            <label className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md">
              {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 stroke-[2.5]" />}
              <span>{isUploadingPhoto ? 'جاري ضغط ومعالجة الصورة...' : '📸 التقاط كاميرا الهاتف'}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Gallery Upload */}
            <label className="flex-1 sm:flex-none bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-sm">
              <UploadCloud className="w-4 h-4 text-amber-500" />
              <span>📁 الاستوديو</span>
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Watermark Auto-branding Control Bar */}
        <div className="bg-[var(--input-bg)]/80 border border-amber-500/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-[var(--text-primary)]">
                  شعار دليلك التلقائي على الصور 🛡️
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${enableWatermark ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'}`}>
                  {enableWatermark ? 'مفعل تلقائياً 🟢' : 'معطل ✕'}
                </span>
              </div>
              <span className="text-[10.5px] text-[var(--text-muted)] font-bold mt-0.5">
                دمج الشعار الرسمي (دليلك • Daleelek) تلقائياً لحفظ الهوية الرقمية للصور
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-auto sm:mr-0">
            {enableWatermark && (
              <div className="flex items-center bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--border-color)] text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setWatermarkPosition('bottom-right')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${watermarkPosition === 'bottom-right' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  أسفل اليمين
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkPosition('bottom-left')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${watermarkPosition === 'bottom-left' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  أسفل اليسار
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setEnableWatermark(!enableWatermark)}
              className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                enableWatermark
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {enableWatermark ? 'تعطيل الختم' : 'تفعيل الختم 🛡️'}
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center space-y-2 bg-[var(--input-bg)]/50">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-[var(--text-primary)]">لم يتم التقاط صور حقيقية للنشاط بعد</h4>
            <p className="text-xs text-[var(--text-secondary)] font-bold max-w-md mx-auto">
              اضغط على زر <strong className="text-amber-600 dark:text-amber-400">"📸 التقاط كاميرا الهاتف"</strong> لفتح كاميرا الجوال مباشرة وتصوير واجهة المحل أو اليافطة ميدانياً!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-[var(--border-color)] bg-slate-950 h-28 shadow-sm">
                <img src={photo} alt={`صورة النشاط ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-rose-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow cursor-pointer transition-transform active:scale-95"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-500/15 border-2 border-rose-500/50 text-rose-700 dark:text-rose-400 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-black animate-pulse-subtle shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submit Action Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
      >
        <CreditCard className="w-5 h-5 stroke-[2.5]" />
        <span>حفظ النشاط وتحديد حالة الدفع والفاتورة 💳</span>
      </button>

        {/* ========================================================
            ⚡ BOTTOM SECTION: REGISTER INTERESTED LEAD / PROSPECT
            ======================================================== */}
        <div className="pt-2 border-t-2 border-dashed border-amber-500/30">
          <div className="bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] leading-tight">
                    ⚡ تسجيل عميل مهتم / زيارة ميدانية (بدون باقة حالياً)
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-bold mt-1 leading-relaxed">
                    قابلت صاحب نشاط مهتم لكنه لم يطلب باقة بعد؟ سجّل رقمه هنا لحفظه وإرسال رسالة تعريفية ومتابعته لاحقاً
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLeadSection(!showLeadSection)}
                className="w-full sm:w-auto justify-center bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                {showLeadSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showLeadSection ? 'إخفاء النموذج' : 'فتح نموذج المهتمين'}</span>
              </button>
            </div>

            {leadSuccessMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{leadSuccessMsg} (تم حفظ العميل للمتابعة الإدارية)</span>
              </div>
            )}

            {showLeadSection && (
              <div className="space-y-3 pt-2 border-t border-[var(--border-color)] animate-fade-in text-xs">
                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم صاحب النشاط / العميل *</label>
                  <input
                    type="text"
                    placeholder="مثال: أ. محمود خالد"
                    value={leadClientName}
                    onChange={(e) => setLeadClientName(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">اسم المحل / النشاط (اختياري)</label>
                    <input
                      type="text"
                      placeholder="مثال: صيدلية النور"
                      value={leadBizName}
                      onChange={(e) => setLeadBizName(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">رقم الهاتف / واتساب (11 رقم) *</label>
                    <input
                      type="tel"
                      placeholder="011XXXXXXXX"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs dir-ltr text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة</label>
                    <select
                      value={leadGov}
                      onChange={(e) => setLeadGov(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">المدينة / المنطقة</label>
                    <input
                      type="text"
                      placeholder="مثال: مدينة نصر"
                      value={leadCity}
                      onChange={(e) => setLeadCity(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">درجة الاهتمام</label>
                    <select
                      value={leadInterest}
                      onChange={(e) => setLeadInterest(e.target.value as LeadInterestLevel)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    >
                      <option value="high">🔥 مهتم جداً (أولوية عالية)</option>
                      <option value="medium">⏳ يحتاج تفكير ومتابعة</option>
                      <option value="need_visit">📅 طلب زيارة ميدانية</option>
                      <option value="intro_sent">💬 طلب رسالة تعريفية</option>
                      <option value="low">متردد / استفسار عام</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[var(--text-primary)]">موعد المتابعة المقترح</label>
                    <input
                      type="date"
                      value={leadFollowDate}
                      onChange={(e) => setLeadFollowDate(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-[var(--text-primary)]">ملاحظات الزيارة (اختياري)</label>
                  <textarea
                    rows={2}
                    placeholder="مثال: تم شرح الباقات وسيقوم بالرد بعد العودة لمدير الفرع..."
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!leadClientName || leadClientName.trim().length < 3) {
                      alert('يرجى كتابة اسم العميل بشكل صحيح.');
                      return;
                    }
                    const cleanP = leadPhone.replace(/\D/g, '');
                    if (cleanP.length < 10) {
                      alert('يرجى إدخال رقم هاتف صحيح (11 رقم).');
                      return;
                    }

                    const lead: InterestedLead = {
                      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                      clientName: leadClientName.trim(),
                      businessName: leadBizName.trim() || undefined,
                      phone: cleanP,
                      governorate: leadGov,
                      city: leadCity.trim() || undefined,
                      interestLevel: leadInterest,
                      followUpDate: leadFollowDate || undefined,
                      notes: leadNotes.trim() || undefined,
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

                    setSavedLeadForWhatsApp(lead);
                    setLeadSuccessMsg(`✅ تم حفظ بيانات العميل "${lead.clientName}" بنجاح في مركز المتابعات والمهتمين!`);
                    setLeadClientName('');
                    setLeadBizName('');
                    setLeadPhone('');
                    setLeadCity('');
                    setLeadNotes('');
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4 stroke-[3]" />
                  <span>حفظ العميل في مركز المتابعات والمهتمين 📋</span>
                </button>
              </div>
            )}
          </div>
        </div>

      {/* 💳 Dedicated Payment Confirmation Modal Popup */}
      {showPaymentModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                      تأكيد حالة الدفع والتحصيل المالي
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">
                      يرجى مراجعة وتحديد حالة سداد الفاتورة بدقة قبل الحفظ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {/* Business Summary Card */}
            <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-bold">النشاط:</span>
                <span className="font-black text-[var(--text-primary)] text-sm">{nameAr}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[var(--text-muted)] font-bold">صاحب النشاط:</span>
                <span className="font-bold text-[var(--text-primary)]">{ownerName} ({ownerPhone})</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]">
                <span className="text-amber-500 font-bold">الباقة المختارة:</span>
                <span className="font-black text-amber-500 font-mono text-sm">
                  {selectedPackage.title} ({selectedPackage.price} ج.م)
                </span>
              </div>
            </div>

            {/* Payment Status 3 Big Options */}
            <div className="space-y-2.5">
              <label className="block font-black text-xs text-[var(--text-primary)]">
                اختر حالة السداد المحصلة من العميل:
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Fully Paid */}
                <div
                  onClick={() => handlePaymentStatusChange('fully_paid')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm ${
                    paymentStatus === 'fully_paid'
                      ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      paymentStatus === 'fully_paid' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-xs">مدفوع بالكامل (سداد كلي)</div>
                      <div className="text-[10px] opacity-80">تم استلام كامل قيمة الباقة من العميل</div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {selectedPackage.price} ج.م
                  </span>
                </div>

                {/* 2. Partially Paid (Deposit) */}
                <div
                  onClick={() => handlePaymentStatusChange('partially_paid')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2.5 shadow-sm ${
                    paymentStatus === 'partially_paid'
                      ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20 text-amber-800 dark:text-amber-300'
                      : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        paymentStatus === 'partially_paid' ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-xs">مبلغ جزئي (عربون مقدم)</div>
                        <div className="text-[10px] opacity-80">تم استلام دفعة مقدمة والباقي آجل</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                      {amountPaid} ج.م
                    </span>
                  </div>

                  {paymentStatus === 'partially_paid' && (
                    <div className="pt-2 border-t border-amber-500/30 flex flex-wrap items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <label className="font-black text-xs">المبلغ المستلم فعلياً:</label>
                        <input
                          type="number"
                          min={0}
                          max={selectedPackage.price}
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(Number(e.target.value))}
                          className="w-24 bg-[var(--bg-card)] border-2 border-amber-500 text-[var(--text-primary)] font-mono font-black rounded-xl px-2.5 py-1.5 text-center focus:outline-none shadow-sm"
                        />
                        <span className="font-bold text-xs">ج.م</span>
                      </div>
                      <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-lg font-black text-xs border border-rose-500/30">
                        المتبقي: {Math.max(0, selectedPackage.price - amountPaid)} ج.م
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Unpaid (Deferred) */}
                <div
                  onClick={() => handlePaymentStatusChange('unpaid')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm ${
                    paymentStatus === 'unpaid'
                      ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/20 text-rose-700 dark:text-rose-400'
                      : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      paymentStatus === 'unpaid' ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-xs">غير مدفوع (آجل بالكامل)</div>
                      <div className="text-[10px] opacity-80">لم يتم تحصيل أي مبالغ حتى الآن</div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                    0 ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Collection Method Selector & Financial Breakdown */}
            {paymentStatus !== 'unpaid' && amountPaid > 0 && (
              <div className="space-y-3">
                <label className="block font-black text-xs text-[var(--text-primary)]">
                  طريقة استلام المبلغ المحصل ({amountPaid} ج.م):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option A: Platform / Online Collection */}
                  <div
                    onClick={() => setPaymentMethod('platform_collected')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between shadow-xs ${
                      paymentMethod === 'platform_collected'
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        paymentMethod === 'platform_collected' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        💳
                      </div>
                      <div>
                        <div className="font-black text-xs">سداد للمنصة مباشرة</div>
                        <div className="text-[10px] opacity-80">إنستاباي / فودافون كاش / إلكتروني</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                      ✨ عمولتك (+{Math.round((amountPaid * (currentRep?.commissionRate || 42.86)) / 100)} ج) تضاف كأرباح متاحة لك!
                    </div>
                  </div>

                  {/* Option B: Cash in Rep's Hand */}
                  <div
                    onClick={() => setPaymentMethod('cash_by_rep')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between shadow-xs ${
                      paymentMethod === 'cash_by_rep'
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20 text-amber-800 dark:text-amber-300'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        paymentMethod === 'cash_by_rep' ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        💵
                      </div>
                      <div>
                        <div className="font-black text-xs">كاش بيدك في الميدان</div>
                        <div className="text-[10px] opacity-80">استلمت المبلغ نقداً من العميل بيدك</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-[10.5px] font-bold text-amber-700 dark:text-amber-400">
                      ⚠️ أخذت عمولتك بيدك وتلتزم بتوريد حصة المنصة
                    </div>
                  </div>
                </div>

                {/* Real-time Commission & Platform Share Calculation */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[var(--text-primary)]">
                      الموقف المالي ({currentRep?.commissionRate || 42.86}%):
                    </span>
                    <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                      المحصل: {amountPaid} ج.م
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold">عمولتك المعتمدة:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-sm">
                        +{Math.round((amountPaid * (currentRep?.commissionRate || 42.86)) / 100)} ج.م
                      </span>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold">
                        {paymentMethod === 'cash_by_rep' ? 'مطلوب توريده للمنصة:' : 'كاش استلمته بيدك:'}
                      </span>
                      <span className={`font-black font-mono text-sm ${paymentMethod === 'cash_by_rep' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                        {paymentMethod === 'cash_by_rep'
                          ? `${amountPaid - Math.round((amountPaid * (currentRep?.commissionRate || 42.86)) / 100)} ج.م`
                          : '0 ج.م (سداد للمنصة)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10.5px] text-[var(--text-secondary)] font-bold flex items-start gap-1.5 pt-1">
                    <span className="text-amber-500 font-black shrink-0">💡 ملاحظة:</span>
                    <span>
                      {paymentMethod === 'cash_by_rep'
                        ? 'استلمت الكاش بيدك وأخذت عمولتك فوراً، ويتم تقييد باقي المبلغ عليك لتوريده للمنصة.'
                        : 'تم السداد مباشرة للمنصة إلكترونياً، لذلك عمولتك بالكامل رصيد أرباح متاح لك لسحبه فورياً.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="block font-bold mb-1 text-[var(--text-secondary)]">ملاحظات مالية أو تفاصيل التحصيل (اختياري):</label>
              <input
                type="text"
                placeholder="مثال: تم الاتفاق على تحصيل باقي المبلغ عند معاينة التوثيق..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-medium focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={handleFinalConfirmPayment}
                className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>تأكيد الدفع وحفظ النشاط فوراً 🚀</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="bg-[var(--input-bg)] hover:bg-slate-500/10 text-[var(--text-secondary)] font-bold py-3.5 px-5 rounded-xl border border-[var(--border-color)] transition-all cursor-pointer text-xs"
              >
                رجوع للتعديل
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </form>
  );
};
