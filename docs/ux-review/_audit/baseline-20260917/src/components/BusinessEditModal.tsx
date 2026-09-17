import React, { useState, useEffect } from 'react';
import {
  Business,
  PaymentStatus,
  User,
  AdditionalServiceInvoice,
  ElectronicPaymentMethod,
  VerificationStatus,
} from '../types';
import { BUSINESS_CATEGORIES, EGYPT_GOVERNORATES } from '../data/mockData';
import { compressImageFile } from '../utils/imageCompressor';
import { extractGooglePlaceData } from '../utils/googlePlaceExtractor';
import { getApiAuthHeaders } from '../utils/storage';
import { getAdditionalInvoiceWhatsAppUrl } from '../utils/whatsapp';
import { formatEGP } from '../utils/formatCurrency';
import {
  X,
  Save,
  Building2,
  MapPin,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Film,
  Star,
  Trash2,
  RotateCw,
  Zap,
  Loader2,
  Plus,
  Eye,
  Check,
  ShieldCheck,
  Receipt,
  DollarSign,
  Send,
  ZoomIn,
} from 'lucide-react';

export interface BusinessEditModalProps {
  business: Business | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave?: (updatedBusiness: Business) => void;
  currentUser?: User | null;
  userRole?: string;
  currentRoleTitle?: string;
  currentUserName?: string;
  currentUserId?: string;
  initialTab?: string;
  canEdit?: boolean;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
  onCollectPayment?: (business: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  businesses?: Business[];
}

export const BusinessEditModal: React.FC<BusinessEditModalProps> = ({
  business,
  isOpen,
  onClose,
  onSave,
  currentUserName,
}) => {
  const [formData, setFormData] = useState<Partial<Business>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'media' | 'finance'>('basic');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Media state
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isPullingGooglePhotos, setIsPullingGooglePhotos] = useState(false);
  const [isRotatingGooglePhoto, setIsRotatingGooglePhoto] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [coverFitMode, setCoverFitMode] = useState<'cover' | 'contain'>('cover');
  const [previewLightbox, setPreviewLightbox] = useState<string | null>(null);

  // Additional Invoices state
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [newInvoiceTitle, setNewInvoiceTitle] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('500');
  const [newInvoicePaid, setNewInvoicePaid] = useState('500');
  const [newInvoiceMethod, setNewInvoiceMethod] = useState<ElectronicPaymentMethod>('vodafone_cash');
  const [newInvoiceRef, setNewInvoiceRef] = useState('');
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('');

  // Owner ID Card Photo state
  const [ownerIdCardPhoto, setOwnerIdCardPhoto] = useState<string>('');
  const [isUploadingOwnerId, setIsUploadingOwnerId] = useState(false);

  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(business);

  useEffect(() => {
    if (business && isModalOpen) {
      setFormData({
        ...business,
        photos: business.photos ? [...business.photos] : [],
        additionalInvoices: business.additionalInvoices ? [...business.additionalInvoices] : [],
      });
      setOwnerIdCardPhoto((business as any).ownerIdCardPhoto || (business as any).nationalIdCardPhoto || '');
      setErrorMsg('');
      setIsSavedSuccess(false);
      setIsAddInvoiceOpen(false);
      setMediaNotice(null);
    }
  }, [business, isModalOpen]);

  if (!isModalOpen || !business) return null;

  const handleChange = (field: keyof Business, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const showNotice = (msg: string, duration = 4000) => {
    setMediaNotice(msg);
    setTimeout(() => setMediaNotice(null), duration);
  };

  // 📸 Upload Photos from device / camera
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    showNotice('جاري ضغط ومعالجة الصور المرفوعة بأعلى جودة...');

    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const compressed = await compressImageFile(file, 1200, 1200, 0.85, { applyWatermark: false });
          uploaded.push(compressed);
        } catch (err) {
          console.error('Failed to compress image:', err);
        }
      }

      if (uploaded.length > 0) {
        setFormData((prev) => {
          const currentPhotos = prev.photos || [];
          const merged = Array.from(new Set([...currentPhotos, ...uploaded])).slice(0, 15);
          return {
            ...prev,
            photos: merged,
            coverPhoto: prev.coverPhoto || merged[0],
          };
        });
        showNotice(`✅ تم رفع وإضافة ${uploaded.length} صورة بنجاح إلى معرض النشاط!`, 5000);
      }
    } catch {
      showNotice('⚠️ حدث خطأ أثناء رفع الصور، يرجى المحاولة مرة أخرى');
    } finally {
      setIsUploadingPhotos(false);
      e.target.value = '';
    }
  };

  // 🎥 Upload Video from device
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    showNotice('جاري قراءة ورفع مقطع الفيديو...');

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const videoDataUrl = reader.result as string;
        setFormData((prev) => {
          const currentVideos = prev.videos || [];
          return {
            ...prev,
            videos: [videoDataUrl, ...currentVideos],
            videoTourUrl: videoDataUrl,
          };
        });
        showNotice('✅ تم إرفاق مقطع الفيديو بنجاح!');
        setIsUploadingVideo(false);
      };
      reader.onerror = () => {
        showNotice('⚠️ تعذر قراءة ملف الفيديو');
        setIsUploadingVideo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showNotice('⚠️ حدث خطأ أثناء رفع الفيديو');
      setIsUploadingVideo(false);
    } finally {
      e.target.value = '';
    }
  };

  // 🪪 Upload Owner ID card photo
  const handleOwnerIdPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingOwnerId(true);
    try {
      const compressed = await compressImageFile(file, 1200, 1200, 0.85, { applyWatermark: false });
      setOwnerIdCardPhoto(compressed);
      setFormData((prev) => ({
        ...prev,
        ownerIdCardPhoto: compressed,
      } as any));
    } catch {
      setErrorMsg('⚠️ تعذر معالجة صورة البطاقة');
    } finally {
      setIsUploadingOwnerId(false);
      e.target.value = '';
    }
  };

  // ⚡ Pull Cover from Google Maps
  const handlePullGooglePhotos = async () => {
    if (!formData.googleMapsUrl?.trim()) {
      showNotice('⚠️ يرجى تزويد رابط خرائط Google في تبويب الموقع أولاً');
      return;
    }
    setIsPullingGooglePhotos(true);
    showNotice('جاري سحب صورة الغلاف من خرائط Google...');

    try {
      const data = await extractGooglePlaceData(formData.googleMapsUrl);
      const rawIncoming = (data && data.photos && data.photos.length > 0)
        ? data.photos
        : (data && data.photo ? [data.photo] : []);
      const incomingPhotos = rawIncoming.slice(0, 1);

      if (incomingPhotos.length > 0) {
        const coverPhoto = incomingPhotos[0];
        setFormData((prev) => {
          const existingPhotos = prev.photos || [];
          const merged = Array.from(new Set([...existingPhotos, coverPhoto])).slice(0, 15);
          return {
            ...prev,
            coverPhoto,
            photos: merged,
          };
        });
        showNotice('✅ تم سحب صورة الغلاف بنجاح من خرائط Google وتعيينها للبطاقة!', 5000);
      } else {
        showNotice('⚠️ لم يتم العثور على صور إضافية على رابط خرائط Google');
      }
    } catch {
      showNotice('⚠️ فشل الاتصال بمحرك استخراج الصور');
    } finally {
      setIsPullingGooglePhotos(false);
    }
  };

  // 🔄 Rotate Google photo
  const handleRotateGooglePhoto = async () => {
    if (!formData.googleMapsUrl?.trim() && !formData.googlePlaceId && !formData.nameAr) {
      showNotice('⚠️ يرجى تزويد رابط أو اسم المنشأة لاستعراض وتدوير الصور من Google');
      return;
    }

    setIsRotatingGooglePhoto(true);
    showNotice('جاري فحص صور Google وتدوير صورة جديدة...');

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/admin/places-photo-rotate', {
          method: 'POST',
          headers: getApiAuthHeaders(),
          body: JSON.stringify({
            googlePlaceId: formData.googlePlaceId,
            placeName: formData.nameAr || formData.nameEn,
            currentPhotos: formData.photos || [],
            lat: formData.lat,
            lng: formData.lng,
          }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {}

      if (!data || !data.success) {
        const apiKey =
          (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY ||
          'AIzaSyD3eyrkvcPrYKgGFqUf2p3OrzKgMep_7c4';

        let googlePhotos: Array<{ name: string }> = [];
        if (formData.googlePlaceId) {
          const pRes = await fetch(
            `https://places.googleapis.com/v1/places/${encodeURIComponent(formData.googlePlaceId)}`,
            {
              headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'id,photos',
              },
            }
          );
          if (pRes.ok) {
            const pData = await pRes.json();
            if (Array.isArray(pData.photos)) googlePhotos = pData.photos;
          }
        }
        if (googlePhotos.length === 0 && (formData.nameAr || formData.nameEn)) {
          const sRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.id,places.photos',
            },
            body: JSON.stringify({
              textQuery: formData.nameAr || formData.nameEn,
              languageCode: 'ar',
            }),
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.places && sData.places[0] && Array.isArray(sData.places[0].photos)) {
              googlePhotos = sData.places[0].photos;
            }
          }
        }

        if (googlePhotos.length > 0) {
          const seenSignatures = new Set(
            (formData.photos || []).map((u) => u.split('=')[0].replace(/^https?:\/\//, ''))
          );
          for (let i = 0; i < googlePhotos.length; i++) {
            const item = googlePhotos[i];
            if (!item || !item.name) continue;
            const mRes = await fetch(
              `https://places.googleapis.com/v1/${item.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${apiKey}&skipHttpRedirect=true`
            );
            if (mRes.ok) {
              const mData = await mRes.json();
              if (mData?.photoUri) {
                const baseUri = mData.photoUri.split('=')[0].replace(/^https?:\/\//, '');
                if (!seenSignatures.has(baseUri)) {
                  data = {
                    success: true,
                    photo: mData.photoUri,
                    message: `تم سحب وتدوير صورة جديدة بنجاح (${i + 1} من ${googlePhotos.length})`,
                  };
                  break;
                }
              }
            }
          }
        }
      }

      if (data?.success && data?.photo) {
        setFormData((prev) => {
          const existing = prev.photos || [];
          const merged = Array.from(new Set([...existing, data.photo])).slice(0, 15);
          return {
            ...prev,
            photos: merged,
          };
        });
        showNotice(data.message || '✅ تم تدوير وسحب صورة مميزة جديدة من Google وحفظها بالمعرض!', 5000);
      } else {
        showNotice('ℹ️ تم استعراض كافة الصور المتاحة لهذا المكان على Google Maps');
      }
    } catch {
      showNotice('⚠️ حدث خطأ أثناء تدوير وسحب الصورة من خرائط Google');
    } finally {
      setIsRotatingGooglePhoto(false);
    }
  };

  // 🏷️ Set photo as card cover
  const handleSetCoverPhoto = (photoUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      coverPhoto: photoUrl,
    }));
    showNotice('⭐ تم اعتماد هذه الصورة كغلاف رسمي لبطاقة المنشأة بالدليل!');
  };

  // ❌ Remove photo from gallery
  const handleRemovePhoto = (indexToRemove: number) => {
    setFormData((prev) => {
      const existing = prev.photos || [];
      const targetPhoto = existing[indexToRemove];
      const updated = existing.filter((_, idx) => idx !== indexToRemove);
      let newCover = prev.coverPhoto;
      if (prev.coverPhoto === targetPhoto) {
        newCover = updated.length > 0 ? updated[0] : '';
      }
      return {
        ...prev,
        photos: updated,
        coverPhoto: newCover,
      };
    });
    showNotice('تم حذف الصورة من المعرض');
  };

  // 🔀 Reorder photos (change place in card/gallery)
  const handleReorderPhoto = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const photos = [...(prev.photos || [])];
      if (toIndex < 0 || toIndex >= photos.length) return prev;
      const [moved] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, moved);
      return {
        ...prev,
        photos,
      };
    });
  };

  // 🧾 Add Additional Service Invoice
  const handleCreateAdditionalInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceTitle.trim()) return;

    const amt = parseFloat(newInvoiceAmount) || 0;
    const paid = parseFloat(newInvoicePaid) || 0;
    if (amt <= 0) {
      alert('يرجى إدخال قيمة صحيحة للخدمة');
      return;
    }

    const pStatus: PaymentStatus = paid >= amt ? 'fully_paid' : paid > 0 ? 'partially_paid' : 'unpaid';

    const newInv: AdditionalServiceInvoice = {
      id: `inv-add-${Date.now()}`,
      businessId: business.id,
      businessName: formData.nameAr || business.nameAr,
      invoiceNumber: `ADD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceTitle: newInvoiceTitle.trim(),
      amount: amt,
      amountPaid: paid,
      paymentStatus: pStatus,
      paymentMethod: newInvoiceMethod,
      issueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      issuedByName: currentUserName || business.repName || 'إدارة المنظومة',
      issuedByRole: 'admin',
      notes: newInvoiceNotes.trim() || undefined,
    };

    setFormData((prev) => {
      const existing = prev.additionalInvoices || [];
      return {
        ...prev,
        additionalInvoices: [newInv, ...existing],
      };
    });

    setIsAddInvoiceOpen(false);
    setNewInvoiceTitle('');
    setNewInvoiceAmount('500');
    setNewInvoicePaid('500');
    setNewInvoiceRef('');
    setNewInvoiceNotes('');
    showNotice(`✅ تم إصدار فاتورة إضافية (${newInv.serviceTitle}) برقم ${newInv.invoiceNumber}!`);
  };

  // 💰 Mark Additional Invoice as fully paid
  const handleMarkInvoicePaid = (invoiceId: string) => {
    setFormData((prev) => {
      const existing = prev.additionalInvoices || [];
      const updated = existing.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            amountPaid: inv.amount,
            paymentStatus: 'fully_paid' as PaymentStatus,
          };
        }
        return inv;
      });
      return {
        ...prev,
        additionalInvoices: updated,
      };
    });
    showNotice('✅ تم تسجيل سداد الفاتورة الإضافية بالكامل!');
  };

  // 🗑️ Delete Additional Invoice
  const handleDeleteAdditionalInvoice = (invoiceId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء وحذف هذه الفاتورة الإضافية؟')) return;
    setFormData((prev) => {
      const existing = prev.additionalInvoices || [];
      return {
        ...prev,
        additionalInvoices: existing.filter((inv) => inv.id !== invoiceId),
      };
    });
    showNotice('تم حذف الفاتورة الإضافية');
  };

  // 🟢 Instant Acceptance & Verification
  const handleInstantApprove = () => {
    setFormData((prev) => ({
      ...prev,
      verificationStatus: 'verified',
      isConditionalVerification: Boolean(
        !prev.isFeeExempt &&
        (Number(prev.amountPaid) || 0) < (Number(prev.packagePrice) || 250)
      ),
    }));
    showNotice('✅ تم اعتماد وقبول المنشأة رسمياً بالدليل العام!');
  };

  // 💾 Submit & Save all changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr?.trim()) {
      setErrorMsg('يرجى إدخال اسم المنشأة باللغة العربية');
      setActiveTab('basic');
      return;
    }
    if (!formData.phone?.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف المنشأة الأساسي');
      setActiveTab('basic');
      return;
    }

    const price = Number(formData.packagePrice) || 0;
    const paid = Number(formData.amountPaid) || 0;
    let paymentStatus: PaymentStatus = formData.paymentStatus || 'unpaid';
    if (formData.isFeeExempt) {
      paymentStatus = 'fully_paid';
    } else if (paid >= price && price > 0) {
      paymentStatus = 'fully_paid';
    } else if (paid > 0) {
      paymentStatus = 'partially_paid';
    } else {
      paymentStatus = 'unpaid';
    }

    const effectivePhotos = formData.photos && formData.photos.length > 0 ? formData.photos : (business.photos || []);
    const effectiveCover = formData.coverPhoto || (effectivePhotos.length > 0 ? effectivePhotos[0] : '');

    const updatedBusiness: Business = {
      ...business,
      ...(formData as Business),
      packagePrice: price,
      amountPaid: paid,
      paymentStatus,
      verificationStatus: formData.verificationStatus || business.verificationStatus || 'pending',
      photos: effectivePhotos,
      coverPhoto: effectiveCover,
      additionalInvoices: formData.additionalInvoices || [],
      isConditionalVerification: Boolean(formData.isConditionalVerification),
      isFeeExempt: Boolean(formData.isFeeExempt),
      ownerIdCardPhoto: ownerIdCardPhoto || undefined,
    } as Business;

    if (onSave) {
      onSave(updatedBusiness);
    }
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-['Tajawal',sans-serif] animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/95">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">تعديل وتحديث بيانات المنشأة</h3>
                {formData.verificationStatus === 'verified' && (
                  <span className="bg-emerald-500/15 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>معتمد</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {formData.nameAr || business.nameAr} • كود: {business.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-white overflow-x-auto text-xs font-bold shrink-0">
          {[
            { id: 'basic', label: 'البيانات الأساسية', icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'location', label: 'العنوان والموقع', icon: <MapPin className="w-3.5 h-3.5" /> },
            {
              id: 'media',
              label: `الوسائط والفيديو (${formData.photos?.length || 0})`,
              icon: <ImageIcon className="w-3.5 h-3.5" />,
            },
            {
              id: 'finance',
              label: `المالية والباقة (${formData.additionalInvoices?.length ? `+${formData.additionalInvoices.length} فواتير` : 'الاعتماد'})`,
              icon: <CreditCard className="w-3.5 h-3.5" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Media Notification Strip */}
        {mediaNotice && (
          <div className="mx-5 mt-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{mediaNotice}</span>
          </div>
        )}

        {/* Saved Success Notification */}
        {isSavedSuccess && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تم حفظ وتحديث بيانات المنشأة بنجاح تام!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    اسم المنشأة التجاري (بالعربية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr || ''}
                    onChange={(e) => handleChange('nameAr', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn || ''}
                    onChange={(e) => handleChange('nameEn', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تصنيف النشاط الرئيسي *</label>
                  <select
                    value={formData.category || BUSINESS_CATEGORIES[0]}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">مواعيد وساعات العمل</label>
                  <input
                    type="text"
                    placeholder="مثال: يومياً من 10 ص إلى 11 م"
                    value={formData.workingHours || ''}
                    onChange={(e) => handleChange('workingHours', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    رقم هاتف المنشأة الأساسي (موبايل / واتساب) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">هاتف إضافي / أرضي</label>
                  <input
                    type="tel"
                    value={formData.secondaryPhone || ''}
                    onChange={(e) => handleChange('secondaryPhone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وصف المنشأة والخدمات المقدمة</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Owner & KYC Data */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span>👤</span>
                  <span>بيانات المسؤول وبطاقة الهوية الرسمية (سجلات الإدارة فقط)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">اسم صاحب النشاط / المدير</label>
                    <input
                      type="text"
                      value={formData.ownerName || ''}
                      onChange={(e) => handleChange('ownerName', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">هاتف المالك الشخصي</label>
                    <input
                      type="tel"
                      value={formData.ownerPhone || ''}
                      onChange={(e) => handleChange('ownerPhone', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">البريد الإلكتروني للمالك</label>
                    <input
                      type="email"
                      value={formData.ownerEmail || ''}
                      onChange={(e) => handleChange('ownerEmail', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الرقم القومي للمالك / السجل</label>
                    <input
                      type="text"
                      value={formData.nationalId || ''}
                      onChange={(e) => handleChange('nationalId', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                    />
                  </div>
                </div>

                {/* Owner ID Card / Document Attachment */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>🪪</span>
                      <span>صورة بطاقة الرقم القومي أو السجل التجاري</span>
                    </span>
                    <label className="cursor-pointer bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 font-bold text-[10.5px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                      {isUploadingOwnerId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3 h-3" />
                      )}
                      <span>{ownerIdCardPhoto ? 'استبدال الصورة' : 'إرفاق صورة البطاقة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleOwnerIdPhotoUpload}
                        className="hidden"
                        disabled={isUploadingOwnerId}
                      />
                    </label>
                  </div>

                  {ownerIdCardPhoto ? (
                    <div className="relative aspect-[16/9] max-h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 group">
                      <img
                        src={ownerIdCardPhoto}
                        alt="بطاقة الهوية أو السجل"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewLightbox(ownerIdCardPhoto)}
                          className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                        >
                          <ZoomIn className="w-3 h-3" />
                          <span>تكبير</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnerIdCardPhoto('')}
                          className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-slate-400 font-medium">لم يتم إرفاق صورة بطاقة الرقم القومي حتى الآن.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المحافظة</label>
                  <select
                    value={formData.governorate || EGYPT_GOVERNORATES[0]}
                    onChange={(e) => handleChange('governorate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المدينة / الحي</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العنوان والشارع التفصيلي</label>
                <input
                  type="text"
                  value={formData.street || ''}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">علامة مميزة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: بجوار البنك الأهلي، أمام محطة المترو..."
                  value={formData.landmark || ''}
                  onChange={(e) => handleChange('landmark', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  رابط موقع النقطة من المندوب (الموقع الميداني)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=... أو رابط الموقع المسجل من المندوب"
                  value={formData.repLocationUrl || ''}
                  onChange={(e) => handleChange('repLocationUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  رابط خرائط Google المباشر (المعتمد)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=... أو رابط المنشأة المعتمد على Google Maps"
                  value={formData.googleMapsUrl || ''}
                  onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                />
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & VIDEO (Upload, Gallery, Cover Selection, Display Framing) */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              {/* Media Action Toolbar */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>معرض صور وفيديوهات المنشأة</span>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {formData.photos?.length || 0} صور
                    </span>
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    ارفع صور النشاط مباشرة من هاتفك، أو اختر الغلاف الذي يظهر على بطاقة المنشأة بالدليل
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {/* Upload Photos Button */}
                  <label className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95">
                    {isUploadingPhotos ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingPhotos ? 'جاري الرفع...' : 'إضافة صور 📷'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploadingPhotos}
                    />
                  </label>

                  {/* Upload Video Button */}
                  <label className="flex-1 sm:flex-none bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95">
                    {isUploadingVideo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    ) : (
                      <Film className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{isUploadingVideo ? 'جاري الرفع...' : 'فيديو قصير 🎥'}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={isUploadingVideo}
                    />
                  </label>

                  {/* Pull Cover from Google Maps */}
                  {Boolean(formData.googleMapsUrl && formData.googleMapsUrl.trim().length > 0) && (
                    <button
                      type="button"
                      disabled={isPullingGooglePhotos || isRotatingGooglePhoto}
                      onClick={handlePullGooglePhotos}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                      title="سحب صورة الغلاف من خرائط Google"
                    >
                      {isPullingGooglePhotos ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>{isPullingGooglePhotos ? 'جاري السحب...' : 'سحب Google ⚡'}</span>
                    </button>
                  )}

                  {/* Rotate Google Photos */}
                  {Boolean(
                    (formData.googleMapsUrl && formData.googleMapsUrl.trim().length > 0) ||
                    formData.googlePlaceId
                  ) && (
                    <button
                      type="button"
                      disabled={isRotatingGooglePhoto || isPullingGooglePhotos}
                      onClick={handleRotateGooglePhoto}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                      title="تدوير وسحب صورة أخرى من خرائط Google"
                    >
                      {isRotatingGooglePhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCw className="w-3.5 h-3.5" />
                      )}
                      <span>{isRotatingGooglePhoto ? 'جاري التدوير...' : 'تدوير صورة 🔄'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cover Card Display & Framing Controls */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>صورة غلاف بطاقة النشاط بالدليل (Card Display & Framing)</span>
                  </span>

                  {/* Display Mode Toggle */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                    <span className="text-slate-500 px-1">طريقة العرض:</span>
                    <button
                      type="button"
                      onClick={() => setCoverFitMode('cover')}
                      className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        coverFitMode === 'cover'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ملء الإطار (Cover)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverFitMode('contain')}
                      className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        coverFitMode === 'contain'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      احتواء كامل (Contain)
                    </button>
                  </div>
                </div>

                {formData.coverPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 h-44 sm:h-52 flex items-center justify-center group">
                    <img
                      src={formData.coverPhoto}
                      alt="غلاف بطاقة المنشأة"
                      className={`w-full h-full ${
                        coverFitMode === 'cover' ? 'object-cover' : 'object-contain'
                      } transition-transform group-hover:scale-[1.02] duration-300`}
                    />
                    <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-slate-950" />
                      <span>الغلاف المعروض ببطاقة الدليل</span>
                    </div>

                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewLightbox(formData.coverPhoto || null)}
                        className="bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm backdrop-blur-xs cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>معاينة مكبرة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 gap-1.5">
                    <ImageIcon className="w-6 h-6 opacity-40" />
                    <span className="text-xs font-bold">لم يتم تعيين صورة غلاف للبطاقة بعد. اختر صورة من المعرض أدناه أو ارفع صورة جديدة.</span>
                  </div>
                )}

                {/* Direct URLs for cover & video tour */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1 text-[11px]">
                      رابط صورة الغلاف المباشر (اختياري)
                    </label>
                    <input
                      type="url"
                      value={formData.coverPhoto || ''}
                      onChange={(e) => handleChange('coverPhoto', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1 text-[11px]">
                      رابط جولة الفيديو (YouTube / MP4)
                    </label>
                    <input
                      type="url"
                      placeholder="https://... أو رابط يوتيوب أو ملف فيديو"
                      value={formData.videoTourUrl || ''}
                      onChange={(e) => handleChange('videoTourUrl', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Photos Gallery: Reorder, Set Cover, Delete */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    جميع صور النشاط المحفوظة ({formData.photos?.length || 0}) — اضغط على أي صورة لتحديدها كغلاف للبطاقة
                  </span>
                </div>

                {formData.photos && formData.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {formData.photos.map((photo, idx) => {
                      const isCover = formData.coverPhoto ? photo === formData.coverPhoto : idx === 0;

                      return (
                        <div
                          key={idx}
                          className={`relative group rounded-2xl overflow-hidden bg-slate-900 h-32 transition-all duration-200 ${
                            isCover
                              ? 'ring-3 ring-amber-400 border-2 border-amber-400 shadow-md'
                              : 'border border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          <img
                            src={photo}
                            alt={`صورة ${idx + 1}`}
                            onClick={() => setPreviewLightbox(photo)}
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Cover Badge */}
                          {isCover ? (
                            <div className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 z-10 pointer-events-none">
                              <Star className="w-2.5 h-2.5 fill-slate-950" />
                              <span>غلاف البطاقة</span>
                            </div>
                          ) : (
                            /* Reorder controls */
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReorderPhoto(idx, idx - 1);
                                  }}
                                  className="bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                  title="تحريك للأمام"
                                >
                                  ▶
                                </button>
                              )}
                              {idx < formData.photos!.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReorderPhoto(idx, idx + 1);
                                  }}
                                  className="bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                  title="تحريك للخلف"
                                >
                                  ◀
                                </button>
                              )}
                            </div>
                          )}

                          {/* Delete Photo Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow cursor-pointer active:scale-90 z-10"
                            title="حذف الصورة"
                          >
                            ✕
                          </button>

                          {/* Bottom Action: Set as Cover */}
                          {!isCover && (
                            <div className="absolute bottom-1.5 inset-x-1.5 z-10 opacity-90 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCoverPhoto(photo);
                                }}
                                className="w-full bg-slate-900/80 hover:bg-amber-500 text-slate-100 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-[9.5px] font-black py-1 px-1 rounded-lg transition-all flex items-center justify-center gap-1 backdrop-blur-xs shadow cursor-pointer active:scale-95"
                                title="تعيين كغلاف لبطاقة المنشأة"
                              >
                                <Star className="w-2.5 h-2.5 text-amber-400" />
                                <span>تعيين كغلاف</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                    لا توجد صور مضافة للمنشأة حتى الآن. اضغط على زر "إضافة صور 📷" بالأعلى لرفع صور من هاتفك.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE, PACKAGE & ADDITIONAL INVOICES */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              {/* 🟢 Instant Acceptance & Verification Hub */}
              <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
                formData.verificationStatus === 'verified'
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-amber-50/70 border-amber-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-3">
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>حالة توثيق واعتماد المنشأة بالدليل العام</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      التحكم المباشر في قبول وتفعيل ظهور المنشأة ببطاقتها على الدليل العام
                    </p>
                  </div>

                  {formData.verificationStatus !== 'verified' ? (
                    <button
                      type="button"
                      onClick={handleInstantApprove}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>قبول واعتماد المنشأة فوراً ✅</span>
                    </button>
                  ) : (
                    <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>المنشأة معتمدة ومقبولة رسمياً</span>
                    </span>
                  )}
                </div>

                {/* Verification Status Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">تحديد حالة التوثيق:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'verified', label: 'معتمد وموثق ✅', color: 'emerald' },
                      { id: 'pending', label: 'قيد المراجعة ⏳', color: 'amber' },
                      { id: 'in_progress', label: 'جاري الفحص 🔍', color: 'blue' },
                      { id: 'needs_action', label: 'يتطلب إجراء ⚠️', color: 'orange' },
                      { id: 'rejected', label: 'مرفوض ✕', color: 'rose' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleChange('verificationStatus', st.id as VerificationStatus)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                          formData.verificationStatus === st.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Verification Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isConditionalVerification)}
                    onChange={(e) => handleChange('isConditionalVerification', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    اعتماد مشروط مع وسم متأخرات مالية (يسمح بنشر المنشأة بالدليل مع جدولة المتبقي)
                  </span>
                </label>
              </div>

              {/* Package & Payment Basics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">سعر الباقة المقررة (ج.م)</label>
                  <input
                    type="number"
                    value={formData.packagePrice ?? 750}
                    onChange={(e) => handleChange('packagePrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المحصل فعلياً (ج.م)</label>
                  <input
                    type="number"
                    value={formData.amountPaid ?? 0}
                    onChange={(e) => handleChange('amountPaid', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isFeeExempt)}
                    onChange={(e) => handleChange('isFeeExempt', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    مكان رائج معفى رسمياً من الرسوم (إدراج مجاني معتمد)
                  </span>
                </label>

                {formData.isFeeExempt && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      سبب الإعفاء الرسمي
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: منشأة تاريخية رائدة بالمنطقة، إدراج شرفي..."
                      value={formData.feeExemptionReason || ''}
                      onChange={(e) => handleChange('feeExemptionReason', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المندوب الميداني المسؤول</label>
                  <input
                    type="text"
                    value={formData.repName || ''}
                    onChange={(e) => handleChange('repName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">كود المندوب (repId)</label>
                  <input
                    type="text"
                    value={formData.repId || ''}
                    onChange={(e) => handleChange('repId', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                  />
                </div>
              </div>

              {/* 🧾 Additional Service Invoices Hub */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <span>فواتير الخدمات الإضافية المخصصة ({formData.additionalInvoices?.length || 0})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      جلسات تصوير 360، ستاندات QR الذكية، الحملات الإعلانية الممولة، والخدمات الخاصة
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddInvoiceOpen(!isAddInvoiceOpen)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddInvoiceOpen ? 'إغلاق النموذج ✕' : '+ إصدار فاتورة إضافية'}</span>
                  </button>
                </div>

                {/* Inline Add Additional Invoice Form */}
                {isAddInvoiceOpen && (
                  <div className="p-3.5 bg-white rounded-2xl border-2 border-indigo-200 shadow-sm space-y-3 animate-fade-in">
                    <span className="font-bold text-indigo-900 text-xs block">
                      إصدار فاتورة خدمة إضافية جديدة للمنشأة:
                    </span>

                    {/* Quick Presets */}
                    <div className="space-y-1">
                      <span className="text-[10.5px] text-slate-500 font-bold block">نماذج خدمات سريعة:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { title: 'جلسة تصوير احترافي وتصوير 360 افتراضي', price: 650 },
                          { title: 'تصميم وطباعة ستاند QR باركود ذكي للمقر', price: 350 },
                          { title: 'حملة ترويجية ممولة عبر منصات التواصل', price: 1200 },
                          { title: 'تصميم هوية بصرية وبانرات دعائية', price: 500 },
                        ].map((preset) => (
                          <button
                            key={preset.title}
                            type="button"
                            onClick={() => {
                              setNewInvoiceTitle(preset.title);
                              setNewInvoiceAmount(String(preset.price));
                              setNewInvoicePaid(String(preset.price));
                            }}
                            className={`py-1 px-2 rounded-lg border text-[10.5px] font-bold transition-all cursor-pointer ${
                              newInvoiceTitle === preset.title
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{preset.title}</span>
                            <span className="opacity-75 mr-1 font-mono">({preset.price} ج)</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                        عنوان أو مسمى الخدمة الإضافية *
                      </label>
                      <input
                        type="text"
                        value={newInvoiceTitle}
                        onChange={(e) => setNewInvoiceTitle(e.target.value)}
                        placeholder="مثال: تصوير جوي، تصميم منيو ديجيتال..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                          إجمالي قيمة الخدمة (ج.م) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newInvoiceAmount}
                          onChange={(e) => setNewInvoiceAmount(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                          المبلغ المسدد الآن (ج.م) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newInvoicePaid}
                          onChange={(e) => setNewInvoicePaid(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                          طريقة السداد والتحصيل
                        </label>
                        <select
                          value={newInvoiceMethod}
                          onChange={(e) => setNewInvoiceMethod(e.target.value as ElectronicPaymentMethod)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                        >
                          <option value="vodafone_cash">فودافون كاش ومحافظ إلكترونية</option>
                          <option value="instapay">إنستاباي (InstaPay)</option>
                          <option value="bank_transfer">تحويل بنكي رسمي</option>
                          <option value="platform_collected">تحصيل إلكتروني</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                          رقم التحويل أو العملية (اختياري)
                        </label>
                        <input
                          type="text"
                          value={newInvoiceRef}
                          onChange={(e) => setNewInvoiceRef(e.target.value)}
                          placeholder="REF-..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsAddInvoiceOpen(false)}
                        className="py-1.5 px-3 rounded-lg text-slate-500 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateAdditionalInvoice}
                        className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>إصدار الفاتورة واعتمادها</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Invoices List */}
                {formData.additionalInvoices && formData.additionalInvoices.length > 0 ? (
                  <div className="space-y-2">
                    {formData.additionalInvoices.map((inv) => {
                      const isPaid = inv.paymentStatus === 'fully_paid' || (inv.amountPaid || 0) >= (inv.amount || 0);
                      const waUrl = getAdditionalInvoiceWhatsAppUrl(business, inv);

                      return (
                        <div
                          key={inv.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900">{inv.serviceTitle}</span>
                              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                {inv.invoiceNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : (inv.amountPaid || 0) > 0
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isPaid ? 'مسدد بالكامل ✓' : (inv.amountPaid || 0) > 0 ? 'مسدد جزئياً' : 'غير مسدد ✕'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              القيمة: <strong>{formatEGP(inv.amount)}</strong> • المسدد: <strong>{formatEGP(inv.amountPaid)}</strong>
                              {inv.paymentMethod && ` • طريقة السداد: ${inv.paymentMethod}`}
                            </p>
                            {inv.notes && <p className="text-[10px] text-slate-400">ملاحظات: {inv.notes}</p>}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleMarkInvoicePaid(inv.id)}
                                className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="تسجيل سداد الفاتورة بالكامل"
                              >
                                <Check className="w-3 h-3" />
                                <span>سداد كامل</span>
                              </button>
                            )}
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[10.5px] flex items-center gap-1 transition-colors"
                              title="إرسال إشعار الفاتورة عبر واتساب"
                            >
                              <Send className="w-3 h-3" />
                              <span>واتساب</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdditionalInvoice(inv.id)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-xs py-2">
                    لا توجد فواتير خدمات إضافية حالياً لهذا النشاط. اضغط على "+ إصدار فاتورة إضافية" لإضافة واحدة.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              إلغاء التعديلات
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد التعديلات</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Modal */}
      {previewLightbox && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setPreviewLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewLightbox(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewLightbox}
              alt="معاينة الصورة"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20 animate-fade-in"
            />
          </div>
        </div>
      )}
    </div>
  );
};
