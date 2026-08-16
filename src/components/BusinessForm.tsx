import React, { useState } from 'react';
import { Business, PackageOption, PaymentStatus, Representative } from '../types';
import { EGYPT_GOVERNORATES, BUSINESS_CATEGORIES, PACKAGES } from '../data/mockData';
import { InteractiveMap } from './InteractiveMap';
import { compressImageFile } from '../utils/imageCompressor';
import { Camera, MapPin, CheckCircle2, DollarSign, Send, User, Phone, FileText, Store, Building2, UploadCloud, AlertCircle, Clock, Sparkles, Loader2 } from 'lucide-react';

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

  // GPS Coordinates
  const [lat, setLat] = useState<number>(30.0444);
  const [lng, setLng] = useState<number>(31.2357);

  // Owner Info
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');

  // Package & Payments
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(PACKAGES[1]); // Default Gold
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('fully_paid');
  const [amountPaid, setAmountPaid] = useState<number>(PACKAGES[1].price);
  const [notes, setNotes] = useState<string>('');

  // Photos attached
  const [photos, setPhotos] = useState<string[]>([]);

  // Auto fill status notice
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

  // Success State
  const [submittedBusiness, setSubmittedBusiness] = useState<Business | null>(null);

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
    setSelectedPackage(PACKAGES[1]);
    setPaymentStatus('fully_paid');
    setAmountPaid(PACKAGES[1].price);
    setNotes('');
    setPhotos([]);
    setSubmittedBusiness(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validate phone number uniqueness
    const normalizedPhone = phone.trim();
    if (normalizedPhone) {
      const isDuplicate = businesses.some(
        (b) => b.phone.trim() === normalizedPhone || (b.ownerPhone && b.ownerPhone.trim() === normalizedPhone)
      );
      if (isDuplicate) {
        setErrorMsg('رقم هاتف النشاط هذا مسجل بالفعل لنشاط تجاري آخر!');
        return;
      }
    }

    const normalizedOwnerPhone = ownerPhone.trim();
    if (normalizedOwnerPhone) {
      const isDuplicate = businesses.some(
        (b) => b.phone.trim() === normalizedOwnerPhone || (b.ownerPhone && b.ownerPhone.trim() === normalizedOwnerPhone)
      );
      if (isDuplicate) {
        setErrorMsg('رقم هاتف مالك النشاط مسجل بالفعل لنشاط تجاري آخر!');
        return;
      }
    }

    const timestamp = Date.now();
    const newBusiness: Business = {
      id: `biz_${timestamp}`,
      nameAr,
      nameEn: nameEn || undefined,
      category,
      governorate,
      city,
      street,
      landmark: landmark || undefined,
      phone: phone || ownerPhone,
      secondaryPhone: secondaryPhone || undefined,
      workingHours,
      description: description || `محل ${nameAr} في ${governorate} - ${city}`,
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
      createdDate: new Date().toISOString().split('T')[0],
      notes: notes || undefined,
    };

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

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pb-20">
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
            <h2 className="text-lg font-black text-white">تسجيل نشاط تجاري جديد على خرائط جوجل</h2>
            <p className="text-xs text-amber-300 font-bold mt-0.5">
              تعبئة كافة البيانات المطلوبة لتفعيل وتوثيق النشاط مباشرة في مصر
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

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">المدينة / الحي / المنطقة *</label>
            <input
              type="text"
              required
              placeholder="مثال: الدقي / سموحة / حي الجامعة"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">العنوان التفصيلي / الشارع *</label>
            <input
              type="text"
              required
              placeholder="مثال: شارع مصدق الرئيسي - عمارة 14"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">علامة مميزة للموقع</label>
            <input
              type="text"
              placeholder="مثال: بجوار محطة المترو أو خلف بنك مصر"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">أوقات العمل وأيام الدوام</label>
            <input
              type="text"
              placeholder="مثال: يومياً من 9 صباحاً حتى 11 مساءً"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Business Description */}
        <div className="pt-2">
          <label className="block text-[var(--text-primary)] font-bold text-xs mb-1.5">وصف النشاط التجاري لصفحة جوجل ماب</label>

          <textarea
            rows={3}
            placeholder="اكتب نبذة عن الخدمات والمنتجات أو مميزات النشاط التجاري..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* 2. الخريطة المصغرة وتحديد الموقع الجغرافي GPS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3 shadow-md transition-colors duration-300">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] text-xs">
          <div className="flex items-center gap-2 text-amber-500">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">2. موقع النشاط على الخريطة (GPS Coordinates)</h3>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-bold">تحديد دقيق للموقع على جوجل ماب</span>
        </div>

        {autoFillNotice && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{autoFillNotice}</span>
          </div>
        )}

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
              setAutoFillNotice('✨ تم استخراج عنوان الموقع تلقائياً وتعبئة الخانات (المحافظة، المدينة، والشارع)!');
              setTimeout(() => setAutoFillNotice(null), 5000);
            }
          }}
          heightClass="h-[260px]"
        />
      </div>

      {/* 3. بيانات صاحب النشاط والتواصل */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
        <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-[var(--border-color)]">
          <User className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">3. بيانات صاحب النشاط للتواصل والفاتورة</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
            <label className="block text-[var(--text-primary)] font-bold mb-1">البريد الإلكتروني (إن وجد)</label>
            <input
              type="email"
              placeholder="owner@gmail.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">الرقم القومي / السجل التجاري (اختياري)</label>
            <input
              type="text"
              placeholder="14 رقم قومي أو رقم السجل"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => handlePackageChange(pkg)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between shadow-sm ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/30'
                }`}
              >
                <div>
                  {pkg.popular && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full mb-2 inline-block shadow">
                      الأكثر طلباً
                    </span>
                  )}
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{pkg.title}</h4>
                  <p className="text-xl font-black text-amber-500 my-1">
                    {pkg.price} <span className="text-xs font-bold text-[var(--text-secondary)]">ج.م</span>
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2">{pkg.description}</p>
                </div>

                <ul className="text-[10px] text-[var(--text-secondary)] space-y-1 pt-2 border-t border-[var(--border-color)]">
                  {pkg.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Payment Status Switcher */}
        <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-4">
          <label className="block text-xs font-bold text-amber-500">حالة دفع الفاتورة لصاحب النشاط:</label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handlePaymentStatusChange('fully_paid')}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                paymentStatus === 'fully_paid'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>مدفوع بالكامل</span>
              </div>
              <span className="font-mono font-black">{selectedPackage.price} ج.م</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentStatusChange('partially_paid')}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                paymentStatus === 'partially_paid'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>مبلغ جزئي (عربون)</span>
              </div>
              <span className="font-mono font-black">{amountPaid} ج.م</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentStatusChange('unpaid')}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                paymentStatus === 'unpaid'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-black'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>غير مدفوع (آجل)</span>
              </div>
              <span className="font-mono font-black">0 ج.م</span>
            </button>
          </div>

          {/* Amount Paid custom adjustment */}
          {paymentStatus === 'partially_paid' && (
            <div className="pt-2 border-t border-[var(--border-color)] text-xs flex items-center gap-3">
              <label className="font-bold text-[var(--text-primary)] shrink-0">المبلغ المحصل فعلياً (ج.م):</label>
              <input
                type="number"
                min={0}
                max={selectedPackage.price}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-32 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
              />
              <span className="text-rose-500 font-bold">
                المتبقي غير مدفوع: {selectedPackage.price - amountPaid} ج.م
              </span>
            </div>
          )}
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-5 h-5 stroke-[2.5]" />
          <span>حفظ النشاط وإصدار الفاتورة المعتمدة فوراً</span>
        </button>
      </div>
    </form>
  );
};
