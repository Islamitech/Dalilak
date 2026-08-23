import React, { useState } from 'react';
import { Business, PackageOption, PaymentStatus, Representative } from '../types';
import { EGYPT_GOVERNORATES, BUSINESS_CATEGORIES, PACKAGES } from '../data/mockData';
import { InteractiveMap } from './InteractiveMap';
import { compressImageFile } from '../utils/imageCompressor';
import { fetchLocationAddress } from '../utils/geocoding';
import { Camera, MapPin, CheckCircle2, DollarSign, Send, User, Phone, FileText, Store, Building2, UploadCloud, AlertCircle, Clock, Sparkles, Loader2, CloudUpload, Navigation, EyeOff, Map, ChevronDown, ChevronUp, CreditCard, X, Check } from 'lucide-react';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';

interface BusinessFormProps {
  onSubmitBusiness: (biz: Business) => void;
  currentRep: Representative | null;
  onShowInvoice: (biz: Business) => void;
  businesses: Business[];
}

export const BusinessForm: React.FC<BusinessFormProps> = ({
  onSubmitBusiness,
  currentRep,
  onShowInvoice,
  businesses,
}) => {
  // Form State
  const [nameAr, setNameAr] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [category, setCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [governorate, setGovernorate] = useState<string>('القاهرة');
  const [city, setCity] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [secondaryPhone, setSecondaryPhone] = useState<string>('');
  const [workingHours, setWorkingHours] = useState<string>('يومياً من 9:00 صباحاً حتى 11:00 مساءً');
  const [description, setDescription] = useState<string>('');

  // GPS Coordinates & Map display state
  const [lat, setLat] = useState<number>(30.0444);
  const [lng, setLng] = useState<number>(31.2357);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = Number(position.coords.latitude.toFixed(6));
          const userLng = Number(position.coords.longitude.toFixed(6));
          setLat(userLat);
          setLng(userLng);
          setIsLocating(false);

          const addrDetails = await fetchLocationAddress(userLat, userLng);
          if (addrDetails.governorate) setGovernorate(addrDetails.governorate);
          if (addrDetails.city) setCity(addrDetails.city);
          if (addrDetails.street) setStreet(addrDetails.street);
          if (addrDetails.landmark) setLandmark(addrDetails.landmark);

          setAutoFillNotice(`✨ تم تحديد موقعك الجغرافي بنجاح (${userLat}, ${userLng})`);
          setTimeout(() => setAutoFillNotice(null), 5000);
        },
        async (error) => {
          console.warn('Geolocation error / fallback:', error);
          setIsLocating(false);
          setAutoFillNotice('⚠️ تعذر جلب GPS تلقائياً، يمكنك إظهار الخريطة لتحديد الموقع يدوياً.');
          setTimeout(() => setAutoFillNotice(null), 5000);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      alert('خدمة GPS غير مدعومة على متصفحك.');
    }
  };

  // Owner Info
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');

  // Package & Payments
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(PACKAGES[0]); // Default Package 1 (Basic 250 EGP)
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null); // For accordion details toggle
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('fully_paid');
  const [amountPaid, setAmountPaid] = useState<number>(PACKAGES[0].price);
  const [notes, setNotes] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Photos attached
  const [photos, setPhotos] = useState<string[]>([]);

  // Auto fill status notice
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

  // Success State
  const [submittedBusiness, setSubmittedBusiness] = useState<Business | null>(null);
  const [showMapsSyncModal, setShowMapsSyncModal] = useState<boolean>(false);

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
    setSubmittedBusiness(null);
    setShowPaymentModal(false);
  };

  // Package select update helper
  const handlePackageChange = (pkg: PackageOption) => {
    setSelectedPackage(pkg);
    if (paymentStatus === 'fully_paid') {
      setAmountPaid(pkg.price);
    } else if (paymentStatus === 'unpaid') {
      setAmountPaid(0);
    } else {
      setAmountPaid(Math.round(pkg.price / 2));
    }
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

  // Compressed Photo upload handler for single/multiple pictures
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploadingPhoto(true);
      const newCompressedPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const compressed = await compressImageFile(files[i]);
          newCompressedPhotos.push(compressed);
        } catch (err) {
          console.warn('Image compression error:', err);
        }
      }
      if (newCompressedPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...newCompressedPhotos]);
      }
      e.target.value = '';
      setIsUploadingPhoto(false);
    }
  };

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nameAr.trim()) {
      setErrorMsg('يرجى إدخال اسم النشاط باللغة العربية');
      return;
    }

    if (!ownerName.trim()) {
      setErrorMsg('يرجى إدخال اسم صاحب النشاط / المسؤول');
      return;
    }

    if (!ownerPhone.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف الواتساب لصاحب النشاط');
      return;
    }

    // Validate phone number uniqueness
    const normalizedPhone = (phone || ownerPhone).trim();
    if (normalizedPhone) {
      const isDuplicate = businesses.some(
        (b) => (b.phone && b.phone.trim() === normalizedPhone) || (b.ownerPhone && b.ownerPhone.trim() === normalizedPhone)
      );
      if (isDuplicate) {
        setErrorMsg('رقم هاتف النشاط مسجل بالفعل لنشاط تجاري آخر!');
        return;
      }
    }

    const normalizedOwnerPhone = ownerPhone.trim();
    if (normalizedOwnerPhone) {
      const isDuplicate = businesses.some(
        (b) => (b.phone && b.phone.trim() === normalizedOwnerPhone) || (b.ownerPhone && b.ownerPhone.trim() === normalizedOwnerPhone)
      );
      if (isDuplicate) {
        setErrorMsg('رقم هاتف مالك النشاط مسجل بالفعل لنشاط تجاري آخر!');
        return;
      }
    }

    const normalizedSecondaryPhone = secondaryPhone.trim();
    if (normalizedSecondaryPhone) {
      const isDuplicate = businesses.some(
        (b) => (b.phone && b.phone.trim() === normalizedSecondaryPhone) ||
               (b.ownerPhone && b.ownerPhone.trim() === normalizedSecondaryPhone) ||
               (b.secondaryPhone && b.secondaryPhone.trim() === normalizedSecondaryPhone)
      );
      if (isDuplicate) {
        setErrorMsg('رقم الهاتف الإضافي مسجل بالفعل لنشاط تجاري آخر!');
        return;
      }
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
    const newBusiness: Business = {
      id: `biz_${timestamp}`,
      nameAr,
      nameEn: nameEn || undefined,
      category,
      governorate,
      city: city || governorate,
      street: street || 'الموقع الجغرافي المسجل على الخريطة',
      landmark: landmark || undefined,
      phone: phone || ownerPhone,
      secondaryPhone: secondaryPhone || undefined,
      workingHours: workingHours || 'يومياً',
      description: description || `نشاط ${nameAr} في ${governorate}`,
      lat,
      lng,
      ownerName,
      ownerPhone,
      ownerEmail: ownerEmail || undefined,
      nationalId: nationalId || undefined,
      photos: photos,
      repId: currentRep?.id || 'rep_1',
      repName: currentRep?.name || 'محمود عبد الفتاح',
      packageId: selectedPackage.id,
      packageName: selectedPackage.title,
      packagePrice: selectedPackage.price,
      amountPaid: Number(amountPaid),
      paymentStatus,
      verificationStatus: 'in_progress', // Default under review
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString(),
      notes: notes || undefined,
    };

    setShowPaymentModal(false);
    onSubmitBusiness(newBusiness);
    setSubmittedBusiness(newBusiness);
  };

  if (submittedBusiness) {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-[var(--bg-card)] border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 animate-fade-in-up">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-3">تم تسجيل النشاط بنجاح!</h2>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
            تم حفظ بيانات نشاط <span className="font-bold text-[var(--text-primary)] px-1">{submittedBusiness.nameAr}</span> بنجاح. سيتم مراجعة البيانات وتوثيقها على خرائط جوجل قريباً.
          </p>
        </div>
        
        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--border-color)] flex justify-between items-center text-sm font-bold shadow-sm">
          <span className="text-[var(--text-secondary)]">حالة النشاط الحالي:</span>
          <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 border border-amber-200 shadow-sm">
            <Clock className="w-4 h-4" />
            <span>قيد المراجعة</span>
          </span>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => setShowMapsSyncModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-3.5 px-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 border border-blue-500/40 cursor-pointer text-sm"
          >
            <CloudUpload className="w-5 h-5" />
            <span>مزامنة وتوثيق النشاط على خرائط Google 🗺️</span>
          </button>

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
    <form onSubmit={handleInitiateSubmit} className="max-w-3xl mx-auto space-y-6 pb-20">
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
            <label className="block text-[var(--text-primary)] font-bold mb-1">اسم النشاط باللغة العربية *</label>
            <input
              type="text"
              required
              placeholder="مثال: مطعم وسوبر ماركت الخير"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">اسم النشاط بالإنجليزية (اختياري)</label>
            <input
              type="text"
              placeholder="e.g. El Kheer Restaurant"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">تصنيف النشاط الرئيسي *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
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
              {showMap ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Map className="w-4 h-4 text-amber-500" />}
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
                  if (details.street) setStreet(details.street);
                  if (details.landmark) setLandmark(details.landmark);
                  setAutoFillNotice('✨ تم تحديد إحداثيات الموقع على الخريطة بنجاح!');
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

      {/* 5. باقة التوثيق وحالة الفاتورة والدفع */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-5 shadow-md transition-colors duration-300">
        <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-[var(--border-color)]">
          <DollarSign className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">5. اختيار الباقات والفاتورة المعتمدة (بالجنيه المصري)</h3>
        </div>

        {/* Packages Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            const isExpanded = expandedPackageId === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => handlePackageChange(pkg)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between shadow-sm relative ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                    : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-amber-500/40'
                }`}
              >
                <div>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {pkg.popular ? (
                      <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                        ⭐ الأكثر طلباً
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)] font-bold bg-[var(--bg-card)] px-2.5 py-0.5 rounded-full border border-[var(--border-color)]">
                        باقة معتمدة
                      </span>
                    )}

                    {isSelected ? (
                      <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        محددة
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        اضغط للتحديد
                      </span>
                    )}
                  </div>

                  {/* Title & Pricing */}
                  <h4 className="font-extrabold text-sm text-[var(--text-primary)] leading-tight">{pkg.title}</h4>
                  
                  <div className="my-2.5 flex items-baseline gap-1.5 bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                    <span className="text-2xl font-black text-amber-500">{pkg.price}</span>
                    <span className="text-xs font-bold text-[var(--text-secondary)]">جنيه مصري</span>
                    {pkg.id === 'pkg_vip' && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold mr-auto bg-amber-500/10 px-2 py-0.5 rounded-md">
                        (أول شهر)
                      </span>
                    )}
                  </div>

                  {/* Concise Tagline */}
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium mb-3">
                    {pkg.description}
                  </p>

                  {/* Dropdown Accordion Trigger Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPackageId(isExpanded ? null : pkg.id);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                      isExpanded
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-[var(--bg-card)] hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-[var(--border-color)]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{isExpanded ? 'إخفاء تفاصيل ومميزات الباقة' : 'عرض كافة التفاصيل والمميزات'}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-950' : ''}`} />
                  </button>
                </div>

                {/* Collapsible Dropdown Content */}
                {isExpanded && (
                  <div className="pt-3 mt-3 border-t border-[var(--border-color)] space-y-2.5 animate-fade-in">
                    <div className="text-[11px] font-extrabold text-[var(--text-primary)]">المميزات المشمولة:</div>
                    
                    <ul className="text-[11px] text-[var(--text-secondary)] space-y-2">
                      {pkg.features.filter(f => !f.startsWith('💡')).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {pkg.features.filter(f => f.startsWith('💡')).map((note, i) => (
                      <div key={i} className="text-[10.5px] bg-amber-500/15 text-amber-950 dark:text-amber-300 p-2.5 rounded-xl border border-amber-500/35 font-bold leading-relaxed shadow-sm">
                        {note}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Select Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePackageChange(pkg);
                  }}
                  className={`w-full mt-3 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      : 'bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-amber-500 border border-[var(--border-color)]'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>الباقة المحددة حالياً</span>
                    </>
                  ) : (
                    <span>تحديد هذه الباقة</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CreditCard className="w-5 h-5 stroke-[2.5]" />
          <span>حفظ النشاط وتحديد حالة الدفع والفاتورة 💳</span>
        </button>
      </div>

      {/* 💳 Dedicated Payment Confirmation Modal Popup */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto">
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
        </div>
      )}
    </form>
  );
};
