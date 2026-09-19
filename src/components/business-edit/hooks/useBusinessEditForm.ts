import React, { useState, useEffect } from 'react';
import {
  Business,
  PaymentStatus,
  AdditionalServiceInvoice,
  ElectronicPaymentMethod,
  VerificationStatus,
} from '../../../types';
import { compressImageFile } from '../../../utils/imageCompressor';
import { extractGooglePlaceData } from '../../../utils/googlePlaceExtractor';
import { getApiAuthHeaders } from '../../../utils/storage';

export interface UseBusinessEditFormProps {
  business: Business | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave?: (updatedBusiness: Business) => void;
  currentUserName?: string;
  initialTab?: string;
}

export const useBusinessEditForm = ({
  business,
  isOpen,
  onClose,
  onSave,
  currentUserName,
  initialTab,
}: UseBusinessEditFormProps) => {
  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(business);

  const [formData, setFormData] = useState<Business>(() => (business || {}) as Business);
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'media' | 'finance'>(() => {
    if (initialTab && ['basic', 'location', 'media', 'finance'].includes(initialTab)) {
      return initialTab as 'basic' | 'location' | 'media' | 'finance';
    }
    return 'basic';
  });
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
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);

  // Owner ID Card Photo state
  const [ownerIdCardPhoto, setOwnerIdCardPhoto] = useState<string>('');
  const [isUploadingOwnerId, setIsUploadingOwnerId] = useState(false);

  useEffect(() => {
    if (business && isModalOpen) {
      setFormData({
        ...business,
        photos: business.photos ? [...business.photos] : [],
        additionalInvoices: business.additionalInvoices ? [...business.additionalInvoices] : [],
      });
      setOwnerIdCardPhoto(
        (business as any).ownerIdCardPhoto || (business as any).nationalIdCardPhoto || ''
      );
      setErrorMsg('');
      setIsSavedSuccess(false);
      setIsAddInvoiceOpen(false);
      setMediaNotice(null);
      if (initialTab && ['basic', 'location', 'media', 'finance'].includes(initialTab)) {
        setActiveTab(initialTab as any);
      }
    }
  }, [business, isModalOpen, initialTab]);

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
      const rawIncoming =
        data && data.photos && data.photos.length > 0
          ? data.photos
          : data && data.photo
          ? [data.photo]
          : [];
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

  // 🔀 Reorder photos
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
    if (!newInvoiceTitle.trim() || !business) return;

    const amt = parseFloat(newInvoiceAmount) || 0;
    const paid = parseFloat(newInvoicePaid) || 0;
    if (amt <= 0) {
      showNotice('⚠️ يرجى إدخال قيمة صحيحة للخدمة');
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
    setInvoiceToDeleteId(invoiceId);
  };

  const confirmDeleteAdditionalInvoice = () => {
    if (!invoiceToDeleteId) return;
    setFormData((prev) => {
      const existing = prev.additionalInvoices || [];
      return {
        ...prev,
        additionalInvoices: existing.filter((inv) => inv.id !== invoiceToDeleteId),
      };
    });
    setInvoiceToDeleteId(null);
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

    if (!business) return;

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

    const effectivePhotos =
      formData.photos && formData.photos.length > 0 ? formData.photos : business.photos || [];
    const effectiveCover = formData.coverPhoto || (effectivePhotos.length > 0 ? effectivePhotos[0] : '');

    const updatedBusiness: Business = ({
      ...business,
      ...formData,
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
    } as any) as Business;

    if (onSave) {
      onSave(updatedBusiness);
    }
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 600);
  };

  return {
    isModalOpen,
    formData,
    setFormData,
    activeTab,
    setActiveTab,
    errorMsg,
    setErrorMsg,
    isSavedSuccess,
    mediaNotice,
    coverFitMode,
    setCoverFitMode,
    previewLightbox,
    setPreviewLightbox,
    ownerIdCardPhoto,
    setOwnerIdCardPhoto,
    isUploadingOwnerId,
    isUploadingPhotos,
    isUploadingVideo,
    isPullingGooglePhotos,
    isRotatingGooglePhoto,
    isAddInvoiceOpen,
    setIsAddInvoiceOpen,
    newInvoiceTitle,
    setNewInvoiceTitle,
    newInvoiceAmount,
    setNewInvoiceAmount,
    newInvoicePaid,
    setNewInvoicePaid,
    newInvoiceMethod,
    setNewInvoiceMethod,
    newInvoiceRef,
    setNewInvoiceRef,
    newInvoiceNotes,
    setNewInvoiceNotes,
    invoiceToDeleteId,
    setInvoiceToDeleteId,
    handleChange,
    showNotice,
    handlePhotoUpload,
    handleVideoUpload,
    handleOwnerIdPhotoUpload,
    handlePullGooglePhotos,
    handleRotateGooglePhoto,
    handleSetCoverPhoto,
    handleRemovePhoto,
    handleReorderPhoto,
    handleCreateAdditionalInvoice,
    handleMarkInvoicePaid,
    handleDeleteAdditionalInvoice,
    confirmDeleteAdditionalInvoice,
    handleInstantApprove,
    handleSubmit,
  };
};
