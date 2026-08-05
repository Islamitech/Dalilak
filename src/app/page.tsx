'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { useRouter } from 'next/navigation';
import {
  MapPin, Store, Phone, Mail, Clock, Calendar, CheckCircle,
  ChevronLeft, ChevronRight, Navigation, Trash2, AlertCircle,
  Building2, Map, Upload, RefreshCw, Copy, ExternalLink, Clipboard,
  Search, Filter, Eye, X, ShieldCheck, Layers, Check,
  User, MessageSquare, Share2, Download, FileSpreadsheet, HardDrive, Tag,
  Receipt, Send, DollarSign, Edit3, Printer, FileText, LogIn, LogOut, Shield,
  Sparkles, Camera, QrCode, Globe, Bot, TrendingUp, Megaphone, Star, Scale, FileCode, CheckSquare, Plus, Images
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

const InteractiveMap = dynamic(() => import('./components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold">
      جاري تحميل الخريطة التفاعلية...
    </div>
  ),
});

export interface PlaceItem {
  id: string;
  businessName: string;
  nameEn?: string;
  status: string;
  category: string;
  subCategory: string;
  customCategory?: string;
  latitude: string;
  longitude: string;
  city: string;
  neighborhood: string;
  street: string;
  landmark?: string;
  phone: string;
  whatsapp?: string;
  googleEmail: string;
  workFrom: string;
  workTo: string;
  holidays: string[];
  facadeImage: string;
  internalImage?: string;
  additionalImages?: string[];
  documenterName?: string;
  notes?: string;
  date: string;
  time: string;
  dms: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
}

const CATEGORY_MAP: Record<string, string[]> = {
  'مطاعم ومأكولات': [
    'مطعم فول وطعمية وشعبيات',
    'مطعم مشويات وكباب',
    'مطعم أسماك ومأكولات بحرية',
    'مطعم كشري ومكرونات',
    'مطعم بيتزا وفطائر',
    'مطعم وجبات سريعة وبرجر',
    'مطعم شاورما وساندوتشات سورية',
    'مطعم مأكولات شرقية وطواجن',
    'مطعم مأكولات هندية وآسيوية',
    'أخرى (إدخال مخصص)',
  ],
  'مقاهي ومشروبات': [
    'كافيه ومقهى حديث (Specialty Coffee)',
    'مقهى بلدي وشعبي',
    'محل عصائر وفرش',
    'كشك ومشروبات سريعة',
    'أخرى (إدخال مخصص)',
  ],
  'سوبرماركت ومواد غذائية': [
    'سوبرماركت / بقالة عامة',
    'هايبرماركت وماركيت كبير',
    'محل ألبان وجبن',
    'خضروات وفواكه طازجة',
    'محمصة ومكسرات وعطارة',
    'جزارة ولحوم طازجة',
    'محل بيع دواجن وطيور',
    'تجارة أسماك طازجة',
    'أخرى (إدخال مخصص)',
  ],
  'خدمات وصيانة السيارات': [
    'كهرباء وتكييف سيارات',
    'إطارات وكاوتش وبطاريات',
    'غيار زيوت وفلاتر',
    'ميكانيكا وعمرة محركات',
    'سمكرة ودوكو سيارات',
    'مغسلة وسيارة ديتيلنج',
    'قطع غيار سيارات',
    'كماليات واكسسوارات سيارات',
    'مركز صيانة متكامل (3S/4S)',
    'أخرى (إدخال مخصص)',
  ],
  'صيدليات ومستلزمات طبية': [
    'صيدلية بيع دواء',
    'معمل تحاليل طبية',
    'مركز أشعة تشخيصية',
    'مستلزمات وتجهيزات طبية',
    'أخرى (إدخال مخصص)',
  ],
  'عيادات ومراكز طبية': [
    'عيادة أسنان وتجميل أسنان',
    'عيادة باطنة وأطفال',
    'عيادة عيون وجراحة عيون',
    'عيادة عظام وعلاج طبيعي',
    'عيادة جلدية وتجميل',
    'مركز طبي مجمع / مستشفى',
    'أخرى (إدخال مخصص)',
  ],
  'ملابس وأحذية وأزياء': [
    'ملابس رجالي',
    'ملابس حريمي وعبايات',
    'ملابس أطفال ومواليد',
    'أحذية وحقائب جلديات',
    'ملابس رياضية',
    'أخرى (إدخال مخصص)',
  ],
  'صالونات تجميل وحلاقة': [
    'صالون حلاقة رجالي',
    'كوافير وصالون تجميل حريمي',
    'مركز عناية واستجمام (Spa)',
    'أخرى (إدخال مخصص)',
  ],
  'مخابز وحلويات': [
    'مخبز بلدي وآلي (خبز)',
    'مخبز أفرنجي وباتيسري',
    'حلويات شرقية وغربية',
    'آيس كريم وشوكولاتة',
    'أخرى (إدخال مخصص)',
  ],
  'أجهزة وإلكترونيات وموبايل': [
    'محل موبايلات وصيانة جوالات',
    'محل أجهزة كهربائية ومنزلية',
    'محل كمبيوتر وشبكات',
    'محل دش ورسيفرات وأنظمة أمان',
    'أخرى (إدخال مخصص)',
  ],
  'خدمات عامة ومكاتب': [
    'مكتب خدمات حكومية وعامة',
    'مكتب شحن وطرد سريع',
    'مكتب طباعة وتصوير وتصاميم',
    'مكتب استشارات وقانون',
    'مكتب عقارات وتسويق',
    'مغسلة ومصبغة ملابس ومفروشات',
    'أخرى (إدخال مخصص)',
  ],
  'أخرى': [
    'أخرى (إدخال مخصص)',
  ],
};

const CATEGORIES = Object.keys(CATEGORY_MAP);

const formSchema = z.object({
  businessName: z.string().min(3, 'اسم المكان التجاري يجب أن يكون 3 أحرف على الأقل'),
  nameEn: z.string().optional(),
  status: z.string().default('مفتوح (شغال)'),
  category: z.string().min(1, 'يرجى تحديد التصنيف الرئيسي للمكان'),
  subCategory: z.string().min(1, 'يرجى تحديد التصنيف الفرعي الدقيق للمكان'),
  customCategory: z.string().optional(),
  latitude: z.string().min(1, 'خط العرض مطلوب'),
  longitude: z.string().min(1, 'خط الطول مطلوب'),
  city: z.string().min(2, 'يرجى إدخال اسم المدينة'),
  neighborhood: z.string().min(2, 'يرجى إدخال اسم الشارع والحي'),
  street: z.string().min(2, 'يرجى إدخال اسم الشارع'),
  landmark: z.string().optional(),
  phone: z
    .string()
    .min(8, 'رقم الهاتف قصير جداً')
    .regex(
      /^(\+20|0020|0)?[1][0-9]\d{8}$/,
      'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678 أو +201012345678)',
    ),
  whatsapp: z.string().optional(),
  facebookUrl: z.string().optional(),
  googleEmail: z
    .string()
    .email('يرجى إدخال بريد Gmail إلكتروني صحيح لنقل الملكية'),
  workFrom: z.string().min(1, 'يرجى تحديد وقت بدء العمل'),
  workTo: z.string().min(1, 'يرجى تحديد وقت انتهاء العمل'),
  holidays: z.array(z.string()),
  facadeImage: z.string().min(1, 'صورة واجهة المحل مع اليافطة إلزامية'),
  internalImage: z.string().optional(),
  additionalImages: z.array(z.string()).optional(),
  documenterName: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.number().default(300),
  paidAmount: z.number().default(0),
  paymentStatus: z.string().min(1, 'يرجى تحديد طريقة وحالة الدفع (الآن أم لاحقاً)'),
}).superRefine((data, ctx) => {
  if (
    (data.category === 'أخرى' || data.subCategory === 'أخرى (إدخال مخصص)') &&
    (!data.customCategory || data.customCategory.trim() === '')
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'يرجى كتابة اسم التصنيف المخصص',
      path: ['customCategory'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

const PLACE_STATUSES = [
  'مفتوح (شغال)',
  'جديد (افتتاح قريب)',
  'قيد التجهيز والديكور',
  'انتقل لمكان آخر',
];

const DAYS = [
  { label: 'الأحد', value: 'الأحد' },
  { label: 'الإثنين', value: 'الإثنين' },
  { label: 'الثلاثاء', value: 'الثلاثاء' },
  { label: 'الأربعاء', value: 'الأربعاء' },
  { label: 'الخميس', value: 'الخميس' },
  { label: 'الجمعة', value: 'الجمعة' },
  { label: 'السبت', value: 'السبت' },
];

function toDMS(latStr: string, lngStr: string): string {
  const toSegment = (val: number, pos: string, neg: string) => {
    const abs = Math.abs(val);
    const d = Math.floor(abs);
    const mFull = (abs - d) * 60;
    const m = Math.floor(mFull);
    const s = ((mFull - m) * 60).toFixed(1);
    const dir = val >= 0 ? pos : neg;
    return `${d}°${String(m).padStart(2, '0')}'${s}"${dir}`;
  };
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng)) return '';
  return `${toSegment(lat, 'N', 'S')} ${toSegment(lng, 'E', 'W')}`;
}

function parseCoords(raw: string): { lat: string; lng: string } | null {
  const s = raw.trim();
  if (!s) return null;

  const atMatch = s.match(/@([-\d.]+),([-\d.]+)/);
  if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };

  const qMatch = s.match(/[?&](?:query|q)=([-\d.]+),([-\d.]+)/);
  if (qMatch) return { lat: qMatch[1], lng: qMatch[2] };

  const dmsRe =
    /(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"\s*([NSns])[\s,]+(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"\s*([EWew])/i;
  const dm = s.match(dmsRe);
  if (dm) {
    let lat = +dm[1] + +dm[2] / 60 + +dm[3] / 3600;
    if (dm[4].toUpperCase() === 'S') lat = -lat;
    let lng = +dm[5] + +dm[6] / 60 + +dm[7] / 3600;
    if (dm[8].toUpperCase() === 'W') lng = -lng;
    return { lat: lat.toFixed(6), lng: lng.toFixed(6) };
  }

  const decRe = /([-\d.]+)\s*,\s*([-\d.]+)/;
  const dec = s.match(decRe);
  if (dec) {
    const la = parseFloat(dec[1]);
    const ln = parseFloat(dec[2]);
    if (la >= -90 && la <= 90 && ln >= -180 && ln <= 180)
      return { lat: la.toFixed(6), lng: ln.toFixed(6) };
  }
  return null;
}

function compressImage(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function downloadImageFile(dataUrl: string, filename: string) {
  if (!dataUrl || dataUrl.indexOf('data:image') === -1) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getCleanFileName(placeName: string, city: string, type: string): string {
  const cleanPlace = (placeName || 'مكان').replace(/[^a-zA-Z0-9\u0600-\u06FF _-]/g, '_');
  const cleanCity = (city || '').replace(/[^a-zA-Z0-9\u0600-\u06FF _-]/g, '_');
  return `${cleanPlace}_${cleanCity ? cleanCity + '_' : ''}صورة_${type}.jpg`;
}

function generateInvoiceImageDataUrl(place: PlaceItem): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 800, 1120);

  // Outer Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(15, 15, 770, 1090);

  // Diagonal Watermark Background (الجرأة والاعتمادية)
  ctx.save();
  ctx.translate(400, 560);
  ctx.rotate(-Math.PI / 6);
  ctx.font = 'bold 22px Tahoma, Arial, sans-serif';
  ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
  ctx.textAlign = 'center';
  for (let y = -400; y <= 400; y += 120) {
    ctx.fillText('DALEELAK DIGITAL SERVICES  ★  توثيق معتمد رسمياً  ★  OFFICIALLY VERIFIED', 0, y);
  }
  ctx.restore();

  // Top Header Bar (Dark Slate)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(17, 17, 766, 140);

  // Green Emerald Line
  ctx.fillStyle = '#10b981';
  ctx.fillRect(17, 152, 766, 5);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  // Company Name & Subtitle
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Tahoma, Arial, sans-serif';
  ctx.fillText('دليلك للخدمات الرقمية (توثيق الخرائط)', 750, 60);

  ctx.font = '13px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('المنظومة الميدانية المعتمدة لتوثيق وإدارة المنشآت على خرائط جوجل', 750, 95);
  ctx.fillText('سجل تجاري وترخيص ميداني معتمد - القاهرة، مصر', 750, 122);

  // Draw QR / Barcode Mockup Box on left header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(40, 32, 110, 110);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(40, 32, 110, 110);

  // Simple QR pattern representation inside
  ctx.fillStyle = '#10b981';
  ctx.fillRect(48, 40, 30, 30);
  ctx.fillRect(112, 40, 30, 30);
  ctx.fillRect(48, 104, 30, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(55, 47, 16, 16);
  ctx.fillRect(119, 47, 16, 16);
  ctx.fillRect(55, 111, 16, 16);

  // Title & Date
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px Tahoma, Arial, sans-serif';
  ctx.fillText(`فاتورة توثيق ميداني رسمية رقم: INV-${place.id.slice(-6)}`, 750, 195);

  ctx.font = '13px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`تاريخ الإصدار: ${place.date}   |   وقت الإصدار: ${place.time}`, 750, 222);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 240);
  ctx.lineTo(760, 240);
  ctx.stroke();

  // Business Info Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, 260, 720, 185);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(40, 260, 720, 185);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
  ctx.fillText('بيانات المنشأة التجارية والعنوان الميداني الموثق:', 740, 290);

  ctx.font = '13px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`• اسم المنشأة التجارية:  ${place.businessName}`, 740, 322);
  ctx.fillText(`• النشاط والتصنيف:  ${place.category} - ${place.subCategory || ''}`, 740, 352);
  ctx.fillText(`• العنوان التفصيلي:  ${place.city} - ${place.neighborhood} - ${place.street}`, 740, 382);
  ctx.fillText(`• الإحداثيات الجغرافية (DMS):  ${place.dms}`, 740, 412);
  ctx.fillText(`• رقم هاتف التواصل والواتساب:  ${place.phone}   |   البريد: ${place.googleEmail}`, 740, 432);

  // Table Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, 465, 720, 40);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px Tahoma, Arial, sans-serif';
  ctx.fillText('تفاصيل الخدمة الميدانية المقدمة', 740, 490);
  ctx.textAlign = 'left';
  ctx.fillText('القيمة (جنيه مصري)', 60, 490);

  // Table Row
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(40, 505, 720, 75);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(40, 505, 720, 75);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  ctx.fillText('خدمة إضافة وتوثيق المنشأة التجارية ونقل الملكية على خرائط جوجل الرسمية', 740, 538);

  ctx.font = '12px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('تشمل المعاينة الميدانية، التقاط الصور، تسجيل الإحداثيات، وإصدار التقرير الرقمي', 740, 562);

  ctx.textAlign = 'left';
  ctx.font = 'bold 16px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${place.totalAmount || 300} ج.م`, 60, 545);

  const tot = place.totalAmount || 300;
  const paid = place.paidAmount ?? tot;
  const rem = place.remainingAmount ?? Math.max(0, tot - paid);

  // Payment Status Summary Box
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, 600, 720, 160);
  ctx.strokeRect(40, 600, 720, 160);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('الحساب المالي وحالة سداد الفاتورة الميدانية:', 740, 630);

  ctx.font = '13px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`• إجمالي قيمة الخدمة المستحقة:   ${tot} جنيه مصري`, 740, 662);

  ctx.fillStyle = '#047857';
  ctx.fillText(`• المبلغ المدفوع حالياً:   ${paid} جنيه مصري`, 740, 692);

  ctx.fillStyle = rem > 0 ? '#b45309' : '#047857';
  ctx.fillText(`• المبلغ المتبقي المستحق:   ${rem} جنيه مصري`, 740, 722);

  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`• حالة الفاتورة:  [ ${place.paymentStatus} ]`, 740, 747);

  ctx.font = '12px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  let noteLine = '';
  if (place.paymentStatus === 'مدفوعة بالكامل') {
    noteLine = 'ملاحظة: تم سداد كامل مبلغ الفاتورة بنجاح وجاري متابعة ظهور المنشأة المباشر على الخريطة.';
  } else if (place.paymentStatus === 'دفع جزء من المبلغ (عربون)') {
    noteLine = `ملاحظة: تم استلام عربون مقدماً (${paid} ج.م)، وسيتم سداد المتبقي (${rem} ج.م) فور تفعيل المكان وتأكيده.`;
  } else {
    noteLine = `ملاحظة: الفاتورة غير مدفوعة حالياً (مؤجلة بالكامل بقيمة ${rem} ج.م)، ويكون السداد فور ظهور المنشأة على الخريطة.`;
  }
  ctx.fillText(noteLine, 740, 792);

  // OFFICIAL DISTINCTIVE STAMP WITH BRAND LOGO (الختم المميز المعتمد)
  const stampX = 200;
  const stampY = 945;

  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate(-0.14);

  // Stamp Outer Double Rings
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 76, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Filled Badge Circle for Logo
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw Logo Symbol inside stamp
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.bezierCurveTo(12, -18, 16, -6, 16, 2);
  ctx.bezierCurveTo(16, 12, 0, 22, 0, 22);
  ctx.bezierCurveTo(0, 22, -16, 12, -16, 2);
  ctx.bezierCurveTo(-16, -6, -12, -18, 0, -18);
  ctx.fill();

  // Building & Check inside logo stamp
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-6, -4, 12, 14);
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(-3, -1, 6, 4);

  // Stamp Curved Text Upper and Lower
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 10.5px Tahoma, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.fillText('دليلك للخدمات الرقمية', 0, -48);
  ctx.fillText('★ توثيق الخرائط الميداني ★', 0, -38);
  ctx.fillText('سجل رقمي معتمد 2026', 0, 46);
  ctx.fillText('VERIFIED & APPROVED', 0, 58);

  ctx.restore();

  // Documenter Signature
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px Tahoma, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('الموثق الميداني المسؤول:', 740, 920);
  ctx.font = '13px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(place.documenterName || 'مكتب دليلك للخدمات الرقمية', 740, 945);

  ctx.font = 'italic 12px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('التوقيع الإلكتروني والختم الميداني معتمد رسمياً', 740, 970);

  // Footer Certificate Bar
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(17, 1040, 766, 62);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(17, 1040, 766, 62);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Tahoma, Arial, sans-serif';
  ctx.fillText('دليلك للخدمات الرقمية - إدارة توثيق خرائط جوجل الرسمية - جميع الحقوق محفوظة © 2026', 400, 1068);
  ctx.fillText('هذه الفاتورة مستند رسمية موثق صادرة ومطبوعة إلكترونياً من المنظومة الميدانية الحاوية للعلامة المائية', 400, 1088);

  return canvas.toDataURL('image/png');
}

function generateWhatsAppInvoiceText(place: PlaceItem): string {
  const invNum = `INV-${place.id.slice(-6)}`;
  const tot = place.totalAmount || 300;
  const paid = place.paidAmount ?? tot;
  const rem = place.remainingAmount ?? Math.max(0, tot - paid);

  let noteText = '';
  if (place.paymentStatus === 'مدفوعة بالكامل') {
    noteText = 'تم سداد كامل رسوم الخدمة بنجاح، وجاري تفعيل وإظهار المنشأة على خرائط جوجل الرسمية.';
  } else if (place.paymentStatus === 'دفع جزء من المبلغ (عربون)') {
    noteText = `تم استلام عربون مقدماً بقيمة (${paid} جنيه مصري)، ويتم سداد المبلغ المتبقي (${rem} جنيه مصري) فور تفعيل المنشأة وظهورها على خرائط جوجل.`;
  } else {
    noteText = `الفاتورة غير مدفوعة حالياً (مؤجلة بالكامل بقيمة ${rem} جنيه مصري)، ويتم السداد فور تفعيل المنشأة وظهورها المباشر على خرائط جوجل.`;
  }

  return `دليلك للخدمات الرقمية (توثيق الخرائط)

فاتورة توثيق ميداني رقم: ${invNum}
تاريخ التوثيق: ${place.date} - ${place.time}

بيانات المنشأة التجارية:
- اسم المنشأة: ${place.businessName}
- العنوان: ${place.city} - ${place.neighborhood} - ${place.street}
- الإحداثيات الجغرافية DMS: ${place.dms}
- رقم التواصل: ${place.phone}

تفاصيل الحساب المالي:
- إجمالي تكلفة خدمة التوثيق: ${tot} جنيه مصري
- المبلغ المدفوع: ${paid} جنيه مصري
- المبلغ المتبقي المستحق: ${rem} جنيه مصري
- حالة الفاتورة: ${place.paymentStatus}

ملاحظات التوثيق والسداد:
${noteText}

الموثق الميداني المسؤول: ${place.documenterName || 'مكتب دليلك للخدمات الرقمية'}

شاكرين لثقتكم بشركة دليلك للخدمات الرقمية.`;
}

function sendWhatsAppInvoiceUrl(phone: string, text: string) {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('01')) {
    cleanPhone = '2' + cleanPhone;
  } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
    cleanPhone = '20' + cleanPhone;
  }
  const encodedText = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  window.open(url, '_blank');
}

async function sendWhatsAppInvoiceWithImage(place: PlaceItem, showToast: (msg: string) => void) {
  const txt = generateWhatsAppInvoiceText(place);
  const dataUrl = generateInvoiceImageDataUrl(place);
  const targetPhone = place.whatsapp || place.phone;

  try {
    if (dataUrl && typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      showToast('جاري فتح محادثة الواتساب! تم نسخ صورة الفاتورة، اضغط Ctrl+V لصقها.');
    } else {
      showToast('جاري فتح محادثة الواتساب لإرسال الفاتورة الرسمية...');
    }
  } catch {
    showToast('جاري فتح محادثة الواتساب لإرسال الفاتورة الرسمية...');
  }

  if (dataUrl) {
    const fn = `${place.businessName}_فاتورة_رسمية_مطبوعة.png`;
    downloadImageFile(dataUrl, fn);
  }

  sendWhatsAppInvoiceUrl(targetPhone, txt);
}

async function downloadSinglePlaceZip(place: PlaceItem) {
  const zip = new JSZip();
  const cleanPlaceName = (place.businessName || 'مكان').replace(/[^a-zA-Z0-9\u0600-\u06FF _-]/g, '_');
  const cleanCity = (place.city || '').replace(/[^a-zA-Z0-9\u0600-\u06FF _-]/g, '_');
  const zipFilename = `${cleanPlaceName}_${cleanCity ? cleanCity + '_' : ''}حزمة_التوثيق.zip`;

  const invoiceTxt = generateWhatsAppInvoiceText(place);
  const invoiceDataUrl = generateInvoiceImageDataUrl(place);

  zip.file('فاتورة_التوثيق_والحساب.txt', invoiceTxt);
  zip.file('data.json', JSON.stringify(place, null, 2));

  const addB64 = (b64Str: string, fileName: string) => {
    if (!b64Str || !b64Str.startsWith('data:image')) return;
    const commaIdx = b64Str.indexOf(',');
    if (commaIdx === -1) return;
    zip.file(fileName, b64Str.substring(commaIdx + 1), { base64: true });
  };

  if (invoiceDataUrl) addB64(invoiceDataUrl, 'الفاتورة_الرسمية_المطبوعة.png');
  if (place.facadeImage) addB64(place.facadeImage, 'صورة_الواجهة_واليافطة.jpg');
  if (place.internalImage) addB64(place.internalImage, 'صورة_داخلية_للمكان.jpg');

  if (place.additionalImages && place.additionalImages.length > 0) {
    place.additionalImages.forEach((img, idx) => {
      addB64(img, `صورة_إضافية_${idx + 1}.jpg`);
    });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function downloadMasterZip(places: PlaceItem[]) {
  if (!places.length) return;
  const masterZip = new JSZip();

  places.forEach((place, index) => {
    const cleanPlaceName = (place.businessName || 'مكان').replace(/[^a-zA-Z0-9\u0600-\u06FF _-]/g, '_');
    const folderName = `${index + 1}_${cleanPlaceName}_${place.city || ''}`;
    const folder = masterZip.folder(folderName);
    if (!folder) return;

    const invoiceTxt = generateWhatsAppInvoiceText(place);
    const invoiceDataUrl = generateInvoiceImageDataUrl(place);

    folder.file('فاتورة_الخدمة.txt', invoiceTxt);
    folder.file('data.json', JSON.stringify(place, null, 2));

    const addB64 = (b64Str: string, fileName: string) => {
      if (!b64Str || !b64Str.startsWith('data:image')) return;
      const commaIdx = b64Str.indexOf(',');
      if (commaIdx === -1) return;
      folder.file(fileName, b64Str.substring(commaIdx + 1), { base64: true });
    };

    if (invoiceDataUrl) addB64(invoiceDataUrl, 'الفاتورة_الرسمية_المطبوعة.png');
    if (place.facadeImage) addB64(place.facadeImage, 'صورة_الواجهة.jpg');
    if (place.internalImage) addB64(place.internalImage, 'صورة_داخلية.jpg');
    if (place.additionalImages && place.additionalImages.length > 0) {
      place.additionalImages.forEach((img, idx) => {
        addB64(img, `صورة_إضافية_${idx + 1}.jpg`);
      });
    }
  });

  const content = await masterZip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Daleelak_Maps_Archive_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToCSV(places: PlaceItem[]) {
  if (!places.length) return;
  const headers = [
    'المعرف',
    'اسم المكان التجاري',
    'الاسم بالإنجليزي',
    'الحالة',
    'التصنيف الرئيسي',
    'التصنيف الفرعي الدقيق',
    'إجمالي الفاتورة ج.م',
    'المبلغ المدفوع ج.م',
    'المبلغ المتبقي ج.م',
    'حالة الفاتورة',
    'خط العرض',
    'خط الطول',
    'الإحداثيات DMS',
    'المدينة / المحافظة',
    'الحي / المنطقة',
    'الشارع',
    'علامة مميزة',
    'رقم الهاتف',
    'واتساب',
    'بريد جوجل للعميل',
    'بداية العمل',
    'نهاية العمل',
    'أيام العطلة',
    'اسم الموثق الميداني',
    'ملاحظات',
    'تاريخ التوثيق',
    'وقت التوثيق',
  ];

  const escapeCSV = (val?: string | number | null) => {
    if (val === undefined || val === null) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const rows = places.map((p) => [
    escapeCSV(p.id),
    escapeCSV(p.businessName),
    escapeCSV(p.nameEn || ''),
    escapeCSV(p.status || 'مفتوح'),
    escapeCSV(p.category),
    escapeCSV(p.subCategory || ''),
    escapeCSV(p.totalAmount || 300),
    escapeCSV(p.paidAmount || 0),
    escapeCSV(p.remainingAmount || 0),
    escapeCSV(p.paymentStatus || 'مدفوعة بالكامل'),
    escapeCSV(p.latitude),
    escapeCSV(p.longitude),
    escapeCSV(p.dms),
    escapeCSV(p.city),
    escapeCSV(p.neighborhood),
    escapeCSV(p.street),
    escapeCSV(p.landmark || ''),
    escapeCSV(p.phone),
    escapeCSV(p.whatsapp || ''),
    escapeCSV(p.googleEmail),
    escapeCSV(p.workFrom),
    escapeCSV(p.workTo),
    escapeCSV((p.holidays || []).join(' - ')),
    escapeCSV(p.documenterName || ''),
    escapeCSV(p.notes || ''),
    escapeCSV(p.date),
    escapeCSV(p.time),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Daleelak_Field_Places_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToJSON(places: PlaceItem[]) {
  if (!places.length) return;
  const jsonStr = JSON.stringify(places, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Daleelak_Places_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSavedPlace, setLastSavedPlace] = useState<PlaceItem | null>(null);

  const [loggedInUser, setLoggedInUser] = useState<{ full_name: string; role: string; email: string } | null>(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<PlaceItem[]>([]);
  const [pasteInput, setPasteInput] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [copiedDMS, setCopiedDMS] = useState(false);
  const [copiedPlaceId, setCopiedPlaceId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('الكل');

  const [activeModalPlace, setActiveModalPlace] = useState<PlaceItem | null>(null);
  const [showStorageExplainModal, setShowStorageExplainModal] = useState(false);
  const [showPrintedInvoiceModalPlace, setShowPrintedInvoiceModalPlace] = useState<PlaceItem | null>(null);

  const [compressingFacade, setCompressingFacade] = useState(false);
  const [compressingInternal, setCompressingInternal] = useState(false);
  const [compressingAdditional, setCompressingAdditional] = useState(false);

  const [formImagePreview, setFormImagePreview] = useState<{ url: string; title: string } | null>(null);

  const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      businessName: '',
      nameEn: '',
      status: 'مفتوح (شغال)',
      category: '',
      subCategory: '',
      customCategory: '',
      latitude: '',
      longitude: '',
      city: '',
      neighborhood: '',
      street: '',
      landmark: '',
      phone: '',
      whatsapp: '',
      facebookUrl: '',
      googleEmail: '',
      workFrom: '08:00',
      workTo: '22:00',
      holidays: [],
      facadeImage: '',
      internalImage: '',
      additionalImages: [],
      documenterName: '',
      notes: '',
      totalAmount: 300,
      paidAmount: 300,
      paymentStatus: 'مدفوعة بالكامل',
    },
  });

  const selectedCategory = watch('category');
  const selectedSubCategory = watch('subCategory');
  const facadePreview = watch('facadeImage');
  const internalPreview = watch('internalImage');
  const additionalImagesPreview = watch('additionalImages') || [];

  const currentLat = watch('latitude');
  const currentLng = watch('longitude');
  const currentBusinessName = watch('businessName');

  const watchedTotalAmount = watch('totalAmount') || 300;
  const watchedPaidAmount = watch('paidAmount') ?? 300;
  const watchedPaymentStatus = watch('paymentStatus');

  const calculatedRemaining = Math.max(0, watchedTotalAmount - watchedPaidAmount);

  const availableSubCategories = selectedCategory ? CATEGORY_MAP[selectedCategory] || [] : [];

  const currentDMS = currentLat && currentLng ? toDMS(currentLat, currentLng) : '';
  const googleMapsUrl = currentDMS
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentDMS)}`
    : '';

  useEffect(() => {
    try {
      const u = localStorage.getItem('daleelak_current_user');
      if (u) {
        const parsed = JSON.parse(u);
        setLoggedInUser(parsed);
        setValue('documenterName', parsed.full_name || 'مكتب دليلك');
      }
    } catch { /* ignore */ }

    const fetchPlaces = async () => {
      try {
        const { data: sbPlaces } = await supabase.from('places').select('*');
        let list: PlaceItem[] = [];
        if (sbPlaces && sbPlaces.length > 0) {
          list = sbPlaces.map((p) => ({
            id: p.id,
            businessName: p.business_name,
            nameEn: p.name_en,
            status: p.status,
            category: p.category,
            subCategory: p.sub_category,
            customCategory: p.custom_category,
            latitude: p.latitude,
            longitude: p.longitude,
            city: p.city,
            neighborhood: p.neighborhood,
            street: p.street,
            landmark: p.landmark,
            phone: p.phone,
            whatsapp: p.whatsapp,
            googleEmail: p.google_email,
            workFrom: p.work_from,
            workTo: p.work_to,
            holidays: p.holidays || [],
            facadeImage: p.facade_image,
            internalImage: p.internal_image,
            additionalImages: p.additional_images || [],
            documenterName: p.documenter_name,
            notes: p.notes,
            date: p.date,
            time: p.time,
            dms: p.dms,
            totalAmount: p.total_amount || 300,
            paidAmount: p.paid_amount || 0,
            remainingAmount: p.remaining_amount || 0,
            paymentStatus: p.payment_status || 'مدفوعة بالكامل',
          }));
        }

        const d = localStorage.getItem('field_notified_places');
        if (d) {
          const localList = JSON.parse(d);
          localList.forEach((lp: PlaceItem) => {
            if (!list.some((x) => x.id === lp.id)) list.push(lp);
          });
        }

        setSavedPlaces(list);
      } catch {
        const d = localStorage.getItem('field_notified_places');
        if (d) setSavedPlaces(JSON.parse(d));
      }
    };

    fetchPlaces();
  }, [setValue]);

  const watchedFields = watch();
  useEffect(() => {
    try {
      if (watchedFields.businessName || watchedFields.latitude) {
        localStorage.setItem('field_form_draft', JSON.stringify(watchedFields));
      }
    } catch { /* ignore */ }
  }, [watchedFields]);

  const handleLogout = () => {
    localStorage.removeItem('daleelak_current_user');
    setLoggedInUser(null);
    showToast('تم تسجيل الخروج بنجاح.');
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...imported, ...savedPlaces];
          setSavedPlaces(merged);
          localStorage.setItem('field_notified_places', JSON.stringify(merged));
          showToast(`تم استيراد ${imported.length} مكان بنجاح وإضافتهم للجهاز!`);
        } else {
          alert('ملف JSON غير صالح.');
        }
      } catch {
        alert('تعذر تحليل ملف JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdatePaymentStatus = async (id: string, newStatus: string, newPaidAmount: number) => {
    const updated = savedPlaces.map((p) => {
      if (p.id === id) {
        const tot = p.totalAmount || 300;
        const rem = Math.max(0, tot - newPaidAmount);
        return {
          ...p,
          paymentStatus: newStatus,
          paidAmount: newPaidAmount,
          remainingAmount: rem,
        };
      }
      return p;
    });
    setSavedPlaces(updated);

    try {
      await supabase.from('places').update({
        payment_status: newStatus,
        paid_amount: newPaidAmount,
        remaining_amount: Math.max(0, 300 - newPaidAmount),
      }).eq('id', id);
    } catch { /* ignore */ }

    try {
      localStorage.setItem('field_notified_places', JSON.stringify(updated));
    } catch { /* ignore */ }

    if (activeModalPlace && activeModalPlace.id === id) {
      const p = updated.find((x) => x.id === id);
      if (p) setActiveModalPlace(p);
    }
    if (lastSavedPlace && lastSavedPlace.id === id) {
      const p = updated.find((x) => x.id === id);
      if (p) setLastSavedPlace(p);
    }
    showToast('تم تحديث حالة الفاتورة والمبلغ المدفوع بنجاح!');
  };

  const handleDownloadZipForPlace = async (place: PlaceItem) => {
    try {
      showToast(`جاري تجهيز حزمة ZIP الخاصة بـ "${place.businessName}"...`);
      await downloadSinglePlaceZip(place);
      showToast(`تم تنزيل حزمة ZIP للمكان "${place.businessName}" بنجاح!`);
    } catch {
      showToast('حدث خطأ أثناء تنزيل حزمة المكان.');
    }
  };

  const handleDownloadMasterZip = async () => {
    if (!savedPlaces.length) return;
    try {
      showToast(`جاري تجميع حزمة ZIP الشاملة لـ ${savedPlaces.length} مكان...`);
      await downloadMasterZip(savedPlaces);
      showToast('تم تنزيل الأرشيف الشامل لكافة الأماكن في ملف ZIP منظم بنجاح!');
    } catch {
      showToast('فشل إنشاء الأرشيف الشامل.');
    }
  };

  const fetchAddressFromCoords = async (latStr: string, lngStr: string) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) return;

    setReverseGeocodingLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
        {
          headers: {
            'Accept-Language': 'ar',
          },
        }
      );
      if (!res.ok) {
        setReverseGeocodingLoading(false);
        return;
      }
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const cityVal = addr.state || addr.city || addr.governorate || addr.province || addr.county || '';
        const neighborhoodVal = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.district || addr.town || '';
        const streetVal = addr.road || addr.pedestrian || addr.street || addr.path || addr.suburb || '';

        if (cityVal) setValue('city', cityVal, { shouldValidate: true });
        if (neighborhoodVal) setValue('neighborhood', neighborhoodVal, { shouldValidate: true });
        if (streetVal) setValue('street', streetVal, { shouldValidate: true });

        showToast('تم كشف وتعبئة بيانات العنوان تلقائياً من موقع الخريطة!');
      }
    } catch {
      /* ignore */
    } finally {
      setReverseGeocodingLoading(false);
    }
  };

  const fetchGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('المتصفح لا يدعم تحديد الموقع');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latS = pos.coords.latitude.toString();
        const lngS = pos.coords.longitude.toString();
        setValue('latitude', latS, { shouldValidate: true });
        setValue('longitude', lngS, { shouldValidate: true });
        setGpsLoading(false);
        showToast('تم التقاط الموقع بنجاح عبر GPS!');
        fetchAddressFromCoords(latS, lngS);
      },
      (err) => {
        setGpsLoading(false);
        const msgs: Record<number, string> = {
          1: 'تم رفض إذن الوصول إلى الموقع. فعّل الموقع في إعدادات الهاتف.',
          2: 'معلومات الموقع غير متوفرة. حاول في مكان مفتوح.',
          3: 'انتهت مهلة جلب الموقع. حاول مرة أخرى.',
        };
        setGpsError(msgs[err.code] || 'خطأ غير متوقع أثناء تحديد الموقع.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const applyPasted = () => {
    setPasteError(null);
    const parsed = parseCoords(pasteInput);
    if (parsed) {
      setValue('latitude', parsed.lat, { shouldValidate: true });
      setValue('longitude', parsed.lng, { shouldValidate: true });
      setPasteInput('');
      showToast('تم تحليل الإحداثيات وتطبيقها!');
      fetchAddressFromCoords(parsed.lat, parsed.lng);
    } else {
      setPasteError(
        "تعذّر تحليل النص. يُرجى إدخال إحداثيات صحيحة مثل:\n• 29°58'21.6\"N 31°05'47.1\"E\n• 29.9726, 31.0964\n• أو رابط مباشر من خرائط جوجل",
      );
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'facadeImage' | 'internalImage',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'facadeImage') setCompressingFacade(true);
    else setCompressingInternal(true);

    try {
      const compressed = await compressImage(file, 1000, 1000, 0.75);
      setValue(field, compressed, { shouldValidate: true });
      showToast('تمت معالجة الصورة وضغطها بنجاح!');
    } catch {
      showToast('فشل تحميل أو ضغط الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      if (field === 'facadeImage') setCompressingFacade(false);
      else setCompressingInternal(false);
    }
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressingAdditional(true);
    try {
      const newImgs: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1000, 1000, 0.75);
        newImgs.push(compressed);
      }
      const existing = watch('additionalImages') || [];
      setValue('additionalImages', [...existing, ...newImgs]);
      showToast(`تم إضافة ${newImgs.length} صورة إضافية بنجاح!`);
    } catch {
      showToast('حدث خطأ أثناء معالجة الصور الإضافية.');
    } finally {
      setCompressingAdditional(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    const existing = watch('additionalImages') || [];
    const updated = existing.filter((_, idx) => idx !== index);
    setValue('additionalImages', updated);
    showToast('تم إزالة الصورة الإضافية.');
  };

  const goNext = async () => {
    const fieldsMap: Record<number, (keyof FormValues)[]> = {
      1: ['businessName', 'category', 'subCategory', 'customCategory', 'facadeImage'],
      2: ['latitude', 'longitude', 'city', 'neighborhood', 'street'],
      3: ['phone', 'googleEmail', 'paymentStatus', 'paidAmount', 'workFrom', 'workTo'],
    };
    const valid = await trigger(fieldsMap[step]);
    if (valid) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: FormValues) => {
    const total = data.totalAmount || 300;
    const paid = data.paidAmount ?? (data.paymentStatus === 'مدفوعة بالكامل' ? total : 0);
    const rem = Math.max(0, total - paid);
    const docName = loggedInUser?.full_name || data.documenterName || 'مكتب دليلك للخدمات الرقمية';

    const place: PlaceItem = {
      id: Date.now().toString(),
      ...data,
      additionalImages: data.additionalImages || [],
      documenterName: docName,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: rem,
      date: new Date().toLocaleDateString('ar-EG'),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      dms: toDMS(data.latitude, data.longitude),
    };

    try {
      await supabase.from('places').insert([
        {
          id: place.id,
          business_name: place.businessName,
          name_en: place.nameEn,
          status: place.status,
          category: place.category,
          sub_category: place.subCategory,
          custom_category: place.customCategory,
          latitude: place.latitude,
          longitude: place.longitude,
          dms: place.dms,
          city: place.city,
          neighborhood: place.neighborhood,
          street: place.street,
          landmark: place.landmark,
          phone: place.phone,
          whatsapp: place.whatsapp,
          google_email: place.googleEmail,
          work_from: place.workFrom,
          work_to: place.workTo,
          holidays: place.holidays,
          facade_image: place.facadeImage,
          internal_image: place.internalImage,
          additional_images: place.additionalImages,
          documenter_name: place.documenterName,
          notes: place.notes,
          date: place.date,
          time: place.time,
          total_amount: place.totalAmount,
          paid_amount: place.paidAmount,
          remaining_amount: place.remainingAmount,
          payment_status: place.paymentStatus,
        },
      ]);
    } catch { /* ignore */ }

    const updated = [place, ...savedPlaces];
    setSavedPlaces(updated);
    setLastSavedPlace(place);

    try {
      localStorage.setItem('field_notified_places', JSON.stringify(updated));
      localStorage.removeItem('field_form_draft');
    } catch { /* ignore */ }

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch { /* ignore */ }

    showToast('تم حفظ التوثيق سحابياً وإصدار الفاتورة الرسمية بنجاح!');

    setIsSuccess(true);
    reset();
    setStep(1);
  };

  const deletePlace = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المكان من سجل التوثيق المحفوظ؟')) return;
    const updated = savedPlaces.filter((p) => p.id !== id);
    setSavedPlaces(updated);

    try {
      await supabase.from('places').delete().eq('id', id);
    } catch { /* ignore */ }

    try {
      localStorage.setItem('field_notified_places', JSON.stringify(updated));
    } catch { /* ignore */ }
    showToast('تم حذف المكان من السجل السحابي والمحلي.');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlaceId(id);
    showToast('تم نسخ الإحداثيات إلى الحافظة!');
    setTimeout(() => setCopiedPlaceId(null), 2000);
  };

  const filteredPlaces = savedPlaces.filter((place) => {
    const matchesCategory =
      selectedFilterCategory === 'الكل' ||
      place.category === selectedFilterCategory ||
      place.subCategory === selectedFilterCategory ||
      (selectedFilterCategory === 'أخرى' && place.customCategory);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      place.businessName.toLowerCase().includes(q) ||
      (place.nameEn && place.nameEn.toLowerCase().includes(q)) ||
      place.category.toLowerCase().includes(q) ||
      (place.subCategory && place.subCategory.toLowerCase().includes(q)) ||
      place.city.toLowerCase().includes(q) ||
      place.neighborhood.toLowerCase().includes(q) ||
      place.street.toLowerCase().includes(q) ||
      place.phone.includes(q) ||
      place.dms.includes(q) ||
      (place.paymentStatus && place.paymentStatus.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const todayDateStr = new Date().toLocaleDateString('ar-EG');
  const todayCount = savedPlaces.filter((p) => p.date === todayDateStr).length;
  const totalCollected = savedPlaces.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const categoryCounts = savedPlaces.reduce((acc, p) => {
    const c = p.subCategory && p.subCategory !== 'أخرى (إدخال مخصص)' ? p.subCategory : p.category;
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {msg}
      </p>
    ) : null;

  const darkInputCls = (hasErr: boolean) =>
    `w-full px-3.5 py-3 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
      hasErr
        ? 'border-red-500 focus:ring-red-900/50'
        : 'border-slate-800 focus:ring-indigo-500 focus:border-indigo-500'
    }`;

  // =========================================================================
  // IF USER IS NOT LOGGED IN: SHOW PUBLIC PROMOTIONAL LANDING PAGE
  // =========================================================================
  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 dir-rtl font-sans selection:bg-emerald-500 selection:text-slate-950 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Global Header matching Admin navigation styling */}
          <header className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="دليلك" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">دليلك للخدمات الرقمية</h1>
                <span className="text-xs text-emerald-400 font-bold block mt-0.5">
                  منظومة توثيق الخرائط والحلول الميدانية والحلول الرقمية للأعمال
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/login')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> دخول الحسابات / الموثقين
              </button>
            </div>
          </header>

          {/* Hero Section: Google Maps Focus */}
          <section className="relative bg-slate-900 border border-slate-800 rounded-3xl px-6 py-16 sm:py-20 text-center space-y-8 overflow-hidden shadow-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-inner relative z-10">
              <Sparkles className="w-4 h-4" /> الخدمة الرئيسية المتاحة حالياً: توثيق الخرائط والمعاينة الميدانية
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto relative z-10">
              وثّق منشأتك على <span className="text-emerald-400">خرائط جوجل (Google Maps)</span> واضمن وصول عملائك بدقة
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed relative z-10">
              منظومة رقمية معتمدة لإصدار الفواتير الرقمية وتأكيد ملكية الأنشطة التجارية وتوثيق الإحداثيات الجغرافية والصور الميدانية للمحلات والمشاريع.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
              <button
                onClick={() => router.push('/login')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" /> تسجيل الدخول لبدء التوثيق الميداني
              </button>
              <a
                href="#services"
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs px-8 py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                استكشف خدمات دليلك الشاملة ⬇
              </a>
            </div>
          </section>

          {/* FEATURE HIGHLIGHT: GOOGLE MAPS DOCUMENTATION (CURRENT ACTIVE SERVICE) */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6">
              <div className="space-y-2">
                <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-3 py-1 rounded-full">
                  الخدمة الميدانية النشطة
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                  <MapPin className="w-7 h-7 text-emerald-400" /> توثيق الخرائط والتواجد الرقمي الميداني
                </h2>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-600/30"
              >
                <LogIn className="w-4 h-4" /> دخول الموثق الميداني
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-extrabold text-white text-sm">تسجيل وضبط الإحداثيات الجغرافية</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تحديد الإحداثيات الدقيقة (DMS) وتأكيد اسم الشارع والحي ونقل ملكية بريد Gmail للعميل مباشرة.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-extrabold text-white text-sm">إصدار الفاتورة الرسمية المطبوعة</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  إصدار فاتورة ورقية ورقمية موثقة بأختام المؤسسة وإرسالها فوراً لعميلك عبر الواتساب.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-extrabold text-white text-sm">نظام السداد والحفظ السحابي</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  خيارات متعددة لسداد الرسوم (مدفوعة، عربون، مؤجلة لحين الظهور) مع التخزين الآمن في Supabase.
                </p>
              </div>
            </div>
          </section>

          {/* ALL CORPORATE SERVICES SECTION */}
          <section id="services" className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">منظومة خدمات دليلك الرقمية المتكاملة</h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
                حلول ميدانية وتقنية وقانونية شاملة للانتقال بجمهور نشاطك التجاري للريادة الرقمية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Category 1 */}
              <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl space-y-5 hover:border-emerald-500/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 block">الخدمات الميدانية (On-Site & Field)</span>
                    <h3 className="text-base font-black text-white">1. التواجد الميداني والتفاعل المباشر</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>التوثيق والتواجد على الخرائط:</strong> تسجيل الأنشطة على Google Maps وضبط بيانات التواصل والوصول المباشر.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Camera className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>التصوير الميداني والجولات الافتراضية:</strong> التقاط صور احترافية للواجهة والتفاصيل وإعداد جولات 360° تفاعلية.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>حلول التفاعل المباشر (NFC & QR Code):</strong> تجهيز حوامل (Stands) وكروت ذكية لفتح المنيو أو ترك تقييم بنقرة واحدة.</span>
                  </li>
                </ul>
              </div>

              {/* Category 2 */}
              <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl space-y-5 hover:border-indigo-500/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 block">المنصات والحوسبة (Platforms & Cloud)</span>
                    <h3 className="text-base font-black text-white">2. الخدمات الرقمية وتطوير المنصات</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>تطوير المنصات والمواقع:</strong> إنشاء مواقع عرض الخدمات (Landing Pages) والكتالوجات والمنيو الرقمي السحابي.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>إدارة وتوثيق الهوية الرقمية:</strong> إنشاء الحسابات الرسمية على شبكات التواصل الاجتماعي وتوثيقها وإدارتها.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>أنظمة التفاعل الذكي (AI Chatbots):</strong> بناء وتطوير آليات الرد التلقائي للرد الفوري عبر الواتساب والمنصات.</span>
                  </li>
                </ul>
              </div>

              {/* Category 3 */}
              <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl space-y-5 hover:border-amber-500/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/30">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 block">التسويق وتكثيف المبيعات (Digital Marketing)</span>
                    <h3 className="text-base font-black text-white">3. التسويق الرقمي وإدارة السمعة</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Search className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>تحسين الظهور المحلي (Local SEO):</strong> رفع ترتيب المكان في نتائج البحث المحلية وتنسيق منشورات البروفايل.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>الحملات الإعلانية الموجهة:</strong> إعلانات خرائط جوجل الممولة ومنصات التواصل لاستهداف الجمهور المناسب.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>إدارة السمعة والتحليلات:</strong> متابعة تقييمات العملاء والرد عليها وتقديم تقارير حركة الزوار الأسبوعية.</span>
                  </li>
                </ul>
              </div>

              {/* Category 4 */}
              <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl space-y-5 hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/30">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 block">الحماية والاستشارات (Digital Legal)</span>
                    <h3 className="text-base font-black text-white">4. الاستشارات والحماية القانونية الرقمية</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>توثيق الملكية الفكرية:</strong> تسجيل العلامة التجارية والاسم والشعار لحماية المنشأة من الانتحال أو السرقة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>صياغة وتدقيق السياسات:</strong> إعداد شروط الاستخدام (Terms) وسياسات الخصوصية وفق اللوائح القضائية.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>التدقيق العقدي وإدارة الملكيات:</strong> التأشير القانوني عند نقل ملكية الحسابات والأنشطة الرقمية بين الشركاء.</span>
                  </li>
                </ul>
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-900 rounded-3xl p-8 text-center space-y-3">
            <p className="text-xs font-bold text-slate-400">
              دليلك للخدمات الرقمية (توثيق الخرائط والمنظومة الميدانية) - جميع الحقوق محفوظة © 2026
            </p>
            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-500">
              <button onClick={() => router.push('/login')} className="hover:text-emerald-400 cursor-pointer">
                تسجيل دخول الموثقين
              </button>
              <span>•</span>
              <button onClick={() => router.push('/login')} className="hover:text-emerald-400 cursor-pointer">
                لوحة تحكم المسؤول
              </button>
            </div>
          </footer>

        </div>
      </div>
    );
  }

  // =========================================================================
  // IF USER IS LOGGED IN: SHOW FIELD DOCUMENTATION FORM AND APP
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 dir-rtl font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Navigation Header - Official Production Version */}
        <header className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="دليلك" className="w-full h-full object-cover" />
              </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">دليلك للخدمات الرقمية (توثيق الخرائط)</h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {loggedInUser.full_name} ({loggedInUser.role === 'admin' ? 'مدير مسؤول' : 'موثق ميداني'})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                المنظومة الرسمية للتوثيق الميداني وإصدار الفواتير الرقمية الموثقة للأعمال والمنشآت
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {loggedInUser.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Shield className="w-4 h-4" /> لوحة تحكم المسؤول
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowStorageExplainModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <HardDrive className="w-4 h-4 text-indigo-400" /> تنظيم حزمة ZIP
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </div>
        </header>

        {!isSuccess ? (
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden mb-10 text-slate-100">

            <div className="bg-slate-950/80 border-b border-slate-800 p-5 sm:p-7">
              <div className="relative flex justify-between items-center max-w-lg mx-auto">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center z-10">
                    <button
                      type="button"
                      disabled={step < i}
                      onClick={() => step > i && setStep(i)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        step === i
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-md shadow-indigo-600/30 scale-105'
                          : step > i
                            ? 'bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500 shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {step > i ? <CheckCircle className="w-5 h-5" /> : i}
                    </button>
                    <span className={`text-[11px] sm:text-xs font-bold mt-2 ${step === i ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {['بيانات وتصنيف المكان', 'الموقع والخريطة', 'التواصل وحالة الدفع', 'الفاتورة والحفظ'][i - 1]}
                    </span>
                  </div>
                ))}
                <div className="absolute top-5 left-6 right-6 h-1 bg-slate-800 -z-0 rounded-full">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-10">
              <AnimatePresence mode="wait">

                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="border-r-4 border-indigo-500 pr-3.5">
                      <h2 className="text-xl font-extrabold text-white">البيانات الأساسية والتصنيف الدقيق</h2>
                      <p className="text-xs text-slate-400 mt-0.5">حدد التصنيف الرئيسي والنوع الفرعي الدقيق للنشاط مع ارفاق صور المنشأة</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="businessName" className="block text-sm font-semibold text-slate-300">
                          اسم المكان التجاري بالعربي <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Store className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                          <input
                            id="businessName"
                            type="text"
                            placeholder="مثال: بقالة النور، مطعم الشرق..."
                            className={`${darkInputCls(!!errors.businessName)} pr-11`}
                            {...register('businessName')}
                          />
                        </div>
                        <FieldError msg={errors.businessName?.message} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="nameEn" className="block text-sm font-semibold text-slate-300">
                          الاسم باللغة الإنجليزية (اختياري)
                        </label>
                        <div className="relative">
                          <input
                            id="nameEn"
                            type="text"
                            placeholder="Example: Al Nour Store"
                            className={`${darkInputCls(false)} [direction:ltr] text-right`}
                            {...register('nameEn')}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="status" className="block text-sm font-semibold text-slate-300">
                        حالة النشاط التجاري الحالية <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="status"
                        className={`${darkInputCls(false)} cursor-pointer`}
                        {...register('status')}
                      >
                        {PLACE_STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-slate-950 text-white">{st}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="category" className="block text-sm font-semibold text-slate-300">
                          1. القطاع / التصنيف الرئيسي <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="category"
                          className={`${darkInputCls(!!errors.category)} appearance-none cursor-pointer`}
                          {...register('category')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue('category', val, { shouldValidate: true });
                            setValue('subCategory', '', { shouldValidate: true });
                            setValue('customCategory', '');
                          }}
                        >
                          <option value="" className="bg-slate-950 text-white">-- اختر المجال الرئيسي --</option>
                          {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>)}
                        </select>
                        <FieldError msg={errors.category?.message} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="subCategory" className="block text-sm font-semibold text-slate-300">
                          2. التصنيف الفرعي الدقيق للنشاط <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="subCategory"
                          disabled={!selectedCategory}
                          className={`${darkInputCls(!!errors.subCategory)} appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                          {...register('subCategory')}
                        >
                          <option value="" className="bg-slate-950 text-white">
                            {selectedCategory ? '-- اختر التخصص الفرعي الدقيق --' : 'اختر القطاع الرئيسي أولاً'}
                          </option>
                          {availableSubCategories.map((sub) => (
                            <option key={sub} value={sub} className="bg-slate-950 text-white">{sub}</option>
                          ))}
                        </select>
                        <FieldError msg={errors.subCategory?.message} />
                      </div>
                    </div>

                    {(selectedCategory === 'أخرى' || selectedSubCategory === 'أخرى (إدخال مخصص)') && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5 bg-indigo-950/60 p-4 rounded-2xl border border-indigo-800">
                        <label htmlFor="customCategory" className="block text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-indigo-400" />
                          أدخل اسم التصنيف المخصص بوضوح <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="customCategory"
                          type="text"
                          placeholder="مثال: مطعم مأكولات بحرية إسكندراني، كهربائي سيارات ألماني..."
                          className={darkInputCls(!!errors.customCategory)}
                          {...register('customCategory')}
                        />
                        <FieldError msg={errors.customCategory?.message} />
                      </motion.div>
                    )}

                    {/* SECTION: IMAGES UPLOAD (FACADE, INTERNAL & MULTIPLE ADDITIONAL) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Upload className="w-4 h-4 text-indigo-400" />
                            صور المنشأة واليافطة الميدانية والصور الإضافية
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            ارفع صورة واجهة المحل مع اليافطة المعلقة، والصورة الداخلية، ويمكنك رفع صور إضافية متعددة (قائمة أسعار، منتجات، شهادات)
                          </p>
                        </div>
                      </div>

                      {/* Main 2 Images: Facade + Internal */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-semibold text-slate-300">
                              صورة واجهة المحل مع اليافطة <span className="text-red-400">*</span>
                            </label>
                            {facadePreview && (
                              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-800">
                                <Check className="w-3 h-3" /> تم الرفع
                              </span>
                            )}
                          </div>
                          {!facadePreview ? (
                            <div className={`relative min-h-[150px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-slate-900 transition-all ${errors.facadeImage ? 'border-red-500 bg-red-950/20' : 'border-slate-800 bg-slate-950'}`}>
                              {compressingFacade ? (
                                <div className="flex flex-col items-center gap-2">
                                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                                  <span className="text-xs font-bold text-indigo-400">جاري ضغط ومعالجة الصورة...</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                                  <span className="text-xs font-bold text-indigo-400">اضغط لرفع أو التقاط صورة واجهة المحل</span>
                                  <span className="text-[10px] text-slate-500 mt-1">تُحفظ الصور سحابياً ومحلياً داخل جهازك</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="facade-upload-step1"
                                    onChange={(e) => handleImageUpload(e, 'facadeImage')}
                                  />
                                  <label htmlFor="facade-upload-step1" className="absolute inset-0 cursor-pointer" />
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-800 aspect-video shadow-sm group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={facadePreview} alt="Facade" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormImagePreview({ url: facadePreview, title: 'معاينة صورة واجهة المنشأة' })}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" /> معاينة مكبرة
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setValue('facadeImage', '', { shouldValidate: true })}
                                  className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-xl cursor-pointer shadow-md"
                                  title="حذف الصورة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                          <FieldError msg={errors.facadeImage?.message} />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-semibold text-slate-300">صورة داخلية للمكان (اختياري)</label>
                            {internalPreview && (
                              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-800">
                                <Check className="w-3 h-3" /> تم الرفع
                              </span>
                            )}
                          </div>
                          {!internalPreview ? (
                            <div className="relative min-h-[150px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-slate-900 transition-all bg-slate-950">
                              {compressingInternal ? (
                                <div className="flex flex-col items-center gap-2">
                                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                                  <span className="text-xs font-bold text-indigo-400">جاري ضغط ومعالجة الصورة...</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                                  <span className="text-xs font-bold text-indigo-400">اضغط لرفع صورة من داخل المحل</span>
                                  <span className="text-[10px] text-slate-500 mt-1">تُحفظ الصور سحابياً ومحلياً داخل جهازك</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="internal-upload-step1"
                                    onChange={(e) => handleImageUpload(e, 'internalImage')}
                                  />
                                  <label htmlFor="internal-upload-step1" className="absolute inset-0 cursor-pointer" />
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-800 aspect-video shadow-sm group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={internalPreview} alt="Internal" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormImagePreview({ url: internalPreview, title: 'معاينة الصورة الداخلية للمشروع' })}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" /> معاينة مكبرة
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setValue('internalImage', '')}
                                  className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-xl cursor-pointer shadow-md"
                                  title="حذف الصورة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Images Section */}
                      <div className="pt-4 border-t border-slate-800/80 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                            <Images className="w-4 h-4 text-indigo-400" />
                            إضافة المزيد من الصور للمكان (قائمة أسعار/منيو/شهادات/زوايا متعددة):
                          </label>
                          <span className="text-[11px] font-bold text-slate-400">
                            عدد الصور الإضافية: {additionalImagesPreview.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {additionalImagesPreview.map((img, idx) => (
                            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video group bg-slate-900">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt={`Extra ${idx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setFormImagePreview({ url: img, title: `صورة إضافية رقم ${idx + 1}` })}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalImage(idx)}
                                  className="bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="relative min-h-[90px] border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:bg-slate-900 transition-all bg-slate-950">
                            {compressingAdditional ? (
                              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-6 h-6 text-indigo-400 mb-1" />
                                <span className="text-[11px] font-bold text-indigo-400">إضافة صور أخرى</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  id="additional-images-upload"
                                  onChange={handleAdditionalImageUpload}
                                />
                                <label htmlFor="additional-images-upload" className="absolute inset-0 cursor-pointer" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="border-r-4 border-indigo-500 pr-3.5">
                      <h2 className="text-xl font-extrabold text-white">الموقع الجغرافي والكشف التلقائي للعنوان</h2>
                      <p className="text-xs text-slate-400 mt-0.5">اسحب الدبوس على الخريطة أو حدد موقعك عبر GPS لكشف الشارع والحي تلقائياً</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Map className="w-4 h-4 text-emerald-400" /> الخريطة الحيّة المباشرة:
                      </label>
                      <InteractiveMap
                        lat={parseFloat(currentLat) || 30.0444}
                        lng={parseFloat(currentLng) || 31.2357}
                        onChangeLocation={(newLat, newLng) => {
                          const latS = newLat.toString();
                          const lngS = newLng.toString();
                          setValue('latitude', latS, { shouldValidate: true });
                          setValue('longitude', lngS, { shouldValidate: true });
                          fetchAddressFromCoords(latS, lngS);
                        }}
                        popupTitle={currentBusinessName || 'موقع المحل التجاري'}
                      />
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clipboard className="w-4 h-4 text-indigo-400" />
                        لصق الإحداثيات أو رابط المكان من جوجل ماب
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        انسخ الإحداثيات من خرائط جوجل مثل{' '}
                        <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-emerald-400">30°2&apos;39.8&quot;N 31°14&apos;5.7&quot;E</span>{' '}
                        أو{' '}
                        <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-emerald-400">30.0444, 31.2357</span>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={pasteInput}
                          onChange={(e) => { setPasteInput(e.target.value); setPasteError(null); }}
                          onKeyDown={(e) => e.key === 'Enter' && applyPasted()}
                          placeholder="الصق الإحداثيات أو الرابط هنا..."
                          className="flex-1 px-3.5 py-2.5 border border-slate-800 bg-slate-900 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={applyPasted}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm"
                        >
                          تحليل وتطبيق
                        </button>
                      </div>
                      {pasteError && (
                        <p className="text-[11px] text-red-400 flex items-start gap-1.5 bg-red-950/60 border border-red-800 rounded-xl p-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="whitespace-pre-line leading-relaxed">{pasteError}</span>
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Navigation className="w-4 h-4 text-indigo-400 animate-pulse" />
                            تحديد الموقع عبر GPS تلقائياً
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">قف بجوار باب المحل ثم اضغط الزر لجلب الإحداثيات</p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchGPS}
                          disabled={gpsLoading}
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                          {gpsLoading ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> جاري التحديد...</>
                          ) : (
                            <><MapPin className="w-4 h-4" /> تحديد موقعي الآن</>
                          )}
                        </button>
                      </div>

                      {gpsError && (
                        <div className="bg-red-950/60 border border-red-800 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-red-300">{gpsError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">خط العرض (Latitude)</label>
                          <input
                            readOnly
                            placeholder="GPS أو الخريطة..."
                            className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-xs font-mono text-white focus:outline-none ${errors.latitude ? 'border-red-500' : 'border-slate-800'}`}
                            {...register('latitude')}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">خط الطول (Longitude)</label>
                          <input
                            readOnly
                            placeholder="GPS أو الخريطة..."
                            className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-xs font-mono text-white focus:outline-none ${errors.longitude ? 'border-red-500' : 'border-slate-800'}`}
                            {...register('longitude')}
                          />
                        </div>
                      </div>

                      {currentLat && currentLng && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 border border-slate-800 shadow-lg"
                        >
                          <div>
                            <span className="text-[11px] text-slate-400 font-bold block mb-1">
                              صيغة البحث الرسمية لجوجل ماب (DMS):
                            </span>
                            <span className="text-sm sm:text-base font-mono font-bold text-emerald-400 tracking-wide select-all dir-ltr text-right block">
                              {currentDMS}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(currentDMS);
                                setCopiedDMS(true);
                                showToast('تم نسخ الإحداثيات!');
                                setTimeout(() => setCopiedDMS(false), 2500);
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                copiedDMS
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800'
                              }`}
                            >
                              {copiedDMS ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copiedDMS ? 'تم النسخ!' : 'نسخ الإحداثيات'}
                            </button>

                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              فتح في تطبيق خرائط جوجل
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">بيانات العنوان الميدانية:</span>
                        <button
                          type="button"
                          onClick={() => fetchAddressFromCoords(currentLat, currentLng)}
                          disabled={reverseGeocodingLoading || !currentLat || !currentLng}
                          className="bg-indigo-950/80 hover:bg-indigo-900 disabled:opacity-50 text-indigo-300 border border-indigo-800 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          {reverseGeocodingLoading ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري كشف العنوان...</>
                          ) : (
                            <><MapPin className="w-3.5 h-3.5 text-indigo-400" /> كشف وتعبئة العنوان تلقائياً من الخريطة 📍</>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: 'city', label: 'المدينة / المحافظة', placeholder: 'مثال: القاهرة، الجيزة...', err: errors.city },
                          { id: 'neighborhood', label: 'الحي / المنطقة', placeholder: 'مثال: المعادي، الدقي...', err: errors.neighborhood },
                          { id: 'street', label: 'الشارع الرئيسي', placeholder: 'مثال: شارع النصر، شارع 9...', err: errors.street },
                        ].map(({ id, label, placeholder, err }) => (
                          <div key={id} className="space-y-1.5">
                            <label htmlFor={id} className="block text-sm font-semibold text-slate-300">
                              {label} <span className="text-red-400">*</span>
                            </label>
                            <input
                              id={id}
                              type="text"
                              placeholder={placeholder}
                              className={darkInputCls(!!err)}
                              {...register(id as keyof FormValues)}
                            />
                            <FieldError msg={err?.message} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="landmark" className="block text-sm font-semibold text-slate-300">علامة مميزة (اختياري)</label>
                      <input
                        id="landmark"
                        type="text"
                        placeholder="مثال: بجوار البنك الأهلي، أمام محطة الوقود..."
                        className={darkInputCls(false)}
                        {...register('landmark')}
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="border-r-4 border-indigo-500 pr-3.5">
                      <h2 className="text-xl font-extrabold text-white">بيانات التواصل والتأكيد المالي للفاتورة</h2>
                      <p className="text-xs text-slate-400 mt-0.5">حدد رقم الهاتف والإيميل مع اختيار حالة الدفع الآن أم مؤجلة لحين ظهور المحل</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label htmlFor="phone" className="block text-sm font-semibold text-slate-300">
                          رقم هاتف المنشأة (ورقم الواتساب للفاتورة) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          <input
                            id="phone"
                            type="tel"
                            placeholder="01012345678"
                            className={`${darkInputCls(!!errors.phone)} pr-10 text-right`}
                            {...register('phone')}
                          />
                        </div>
                        <FieldError msg={errors.phone?.message} />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="googleEmail" className="block text-sm font-semibold text-slate-300">
                          بريد Gmail الخاص بصاحب المحل <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          <input
                            id="googleEmail"
                            type="email"
                            placeholder="example@gmail.com"
                            className={`${darkInputCls(!!errors.googleEmail)} pr-10 text-right`}
                            {...register('googleEmail')}
                          />
                        </div>
                        <FieldError msg={errors.googleEmail?.message} />
                      </div>
                    </div>

                    <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <Receipt className="w-6 h-6 text-emerald-400" />
                          <div>
                            <h3 className="text-base font-extrabold text-white">حالة دفع الفاتورة الميدانية <span className="text-red-400">*</span></h3>
                            <p className="text-[11px] text-slate-400">حدد طريقة ودفع العميل الآن أم لاحقاً بعد ظهور المكان</p>
                          </div>
                        </div>
                        <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold px-3 py-1 rounded-full">
                          تكلفة الخدمة: {watchedTotalAmount} ج.م
                        </span>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-200">
                          متى/كيف سيدفع العميل تكلفة خدمة التوثيق؟ <span className="text-red-400">*</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div
                            onClick={() => {
                              setValue('paymentStatus', 'مدفوعة بالكامل', { shouldValidate: true });
                              setValue('paidAmount', watchedTotalAmount, { shouldValidate: true });
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                              watchedPaymentStatus === 'مدفوعة بالكامل'
                                ? 'bg-emerald-950/90 border-emerald-500 ring-2 ring-emerald-500/40'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> سيدفع الآن بالكامل
                              </span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                watchedPaymentStatus === 'مدفوعة بالكامل' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-700'
                              }`}>
                                {watchedPaymentStatus === 'مدفوعة بالكامل' && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              قام العميل بدفع المبلغ بالكامل ({watchedTotalAmount} ج.م) الآن قبل التوثيق.
                            </p>
                          </div>

                          <div
                            onClick={() => {
                              setValue('paymentStatus', 'غير مدفوعة (مؤجلة)', { shouldValidate: true });
                              setValue('paidAmount', 0, { shouldValidate: true });
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                              watchedPaymentStatus === 'غير مدفوعة (مؤجلة)'
                                ? 'bg-amber-950/90 border-amber-500 ring-2 ring-amber-500/40'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" /> سيدفع لاحقاً بعد الظهور
                              </span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                watchedPaymentStatus === 'غير مدفوعة (مؤجلة)' ? 'border-amber-400 bg-amber-500' : 'border-slate-700'
                              }`}>
                                {watchedPaymentStatus === 'غير مدفوعة (مؤجلة)' && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              لم يدفع بعد. الفاتورة مؤجلة لحين تفعيل وتأكيد ظهور المحل على جوجل ماب.
                            </p>
                          </div>

                          <div
                            onClick={() => {
                              setValue('paymentStatus', 'دفع جزء من المبلغ (عربون)', { shouldValidate: true });
                              if (!watchedPaidAmount || watchedPaidAmount === 0 || watchedPaidAmount === watchedTotalAmount) {
                                setValue('paidAmount', 100, { shouldValidate: true });
                              }
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                              watchedPaymentStatus === 'دفع جزء من المبلغ (عربون)'
                                ? 'bg-indigo-950/90 border-indigo-500 ring-2 ring-indigo-500/40'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" /> دفع عربون مقدماً
                              </span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                watchedPaymentStatus === 'دفع جزء من المبلغ (عربون)' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'
                              }`}>
                                {watchedPaymentStatus === 'دفع جزء من المبلغ (عربون)' && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              دفع جزء كعربون الآن، والباقي يُسدّد بعد ظهور المنشأة على الخريطة.
                            </p>
                          </div>
                        </div>
                      </div>

                      {watchedPaymentStatus === 'دفع جزء من المبلغ (عربون)' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-indigo-950/80 p-4 rounded-2xl border border-indigo-800 space-y-2"
                        >
                          <label className="block text-xs font-extrabold text-emerald-300 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            قيمة المبلغ المقدم (العربون) المدفوع حالياً (ج.م): <span className="text-red-400">*</span>
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="1"
                                max={watchedTotalAmount}
                                placeholder="أدخل المبلغ المقدم مثل 100 أو 150"
                                className="w-full px-4 py-2.5 bg-slate-900 border border-indigo-500 rounded-xl text-base font-extrabold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-right dir-ltr"
                                {...register('paidAmount', { valueAsNumber: true })}
                              />
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ج.م</span>
                            </div>

                            <div className="bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold shrink-0 flex items-center justify-between sm:justify-start gap-2">
                              <span className="text-slate-400">المتبقي المؤجل بعد الظهور:</span>
                              <span className="text-amber-400 text-sm font-black">{calculatedRemaining} ج.م</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="whatsapp" className="block text-xs font-semibold text-slate-400">رقم واتساب مخصص آخر (اختياري)</label>
                        <div className="relative">
                          <MessageSquare className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          <input
                            id="whatsapp"
                            type="tel"
                            placeholder="01012345678"
                            className={`${darkInputCls(false)} pr-10 text-right`}
                            {...register('whatsapp')}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="facebookUrl" className="block text-xs font-semibold text-slate-400">رابط صفحة فيسبوك / موقع (اختياري)</label>
                        <div className="relative">
                          <Share2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          <input
                            id="facebookUrl"
                            type="url"
                            placeholder="https://facebook.com/page"
                            className={`${darkInputCls(false)} pr-10 text-right`}
                            {...register('facebookUrl')}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        ساعات العمل اليومية
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: 'workFrom', label: 'وقت البدء', err: errors.workFrom },
                          { id: 'workTo', label: 'وقت الانتهاء', err: errors.workTo },
                        ].map(({ id, label }) => (
                          <div key={id}>
                            <label htmlFor={id} className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>
                            <input
                              id={id}
                              type="time"
                              className={darkInputCls(false)}
                              {...register(id as 'workFrom' | 'workTo')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        أيام العطلة الأسبوعية
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                        {DAYS.map((day) => (
                          <Controller
                            key={day.value}
                            name="holidays"
                            control={control}
                            render={({ field }) => {
                              const checked = field.value?.includes(day.value) ?? false;
                              return (
                                <button
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      checked
                                        ? field.value.filter((v: string) => v !== day.value)
                                        : [...(field.value || []), day.value],
                                    )
                                  }
                                  className={`py-2.5 px-2 border text-xs font-bold rounded-xl text-center cursor-pointer transition-all ${
                                    checked
                                      ? 'bg-red-950 border-red-800 text-red-300 shadow-sm'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                  }`}
                                >
                                  {day.label}
                                </button>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
                    <div className="border-r-4 border-indigo-500 pr-3.5">
                      <h2 className="text-xl font-extrabold text-white">مراجعة الفاتورة النهائية وحفظ التوثيق</h2>
                      <p className="text-xs text-slate-400 mt-0.5">معاينة الفاتورة الصادرة بناءً على اختيارك المالي في الخطوة السابقة قبل التوثيق</p>
                    </div>

                    <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <Receipt className="w-6 h-6 text-emerald-400" />
                          <div>
                            <h3 className="text-base font-extrabold text-white">معاينة الفاتورة المالية الصادرة للعميل</h3>
                            <p className="text-[11px] text-slate-400">ستصُدر الفاتورة بحالتها المحددة وتُرسل مباشرة عبر الواتساب شاملة الصورة المطبوعة</p>
                          </div>
                        </div>
                        <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold px-3 py-1 rounded-full">
                          حالة الفاتورة: {watchedPaymentStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                          <span className="text-[11px] text-slate-400 font-bold block mb-1">إجمالي الفاتورة</span>
                          <span className="text-lg font-black text-white">{watchedTotalAmount} ج.م</span>
                        </div>

                        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                          <span className="text-[11px] text-emerald-400 font-bold block mb-1">المبلغ المدفوع الآن</span>
                          <span className="text-lg font-black text-emerald-400">{watchedPaidAmount || 0} ج.م</span>
                        </div>

                        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                          <span className="text-[11px] text-amber-400 font-bold block mb-1">المتبقي المؤجل</span>
                          <span className="text-lg font-black text-amber-400">{calculatedRemaining} ج.م</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="documenterName" className="block text-xs font-semibold text-slate-300">اسم الموثق الميداني / المكتب</label>
                        <div className="relative">
                          <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          <input
                            id="documenterName"
                            type="text"
                            placeholder="مكتب دليلك للخدمات الرقمية"
                            className={`${darkInputCls(false)} pr-10`}
                            {...register('documenterName')}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="notes" className="block text-xs font-semibold text-slate-300">ملاحظات التوثيق الميداني</label>
                        <input
                          id="notes"
                          type="text"
                          placeholder="أي ملاحظات خاصة بالتوثيق..."
                          className={darkInputCls(false)}
                          {...register('notes')}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-10 pt-6 border-t border-slate-800 flex justify-between items-center gap-4">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-4 h-4" /> السابق
                  </button>
                ) : <div />}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    التالي <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> حفظ التوثيق وإصدار الفاتورة الرسمية
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 sm:p-12 text-center space-y-6 mb-10 text-slate-100">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">تم توثيق المكان وإصدار الفاتورة بنجاح!</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                تم تسجيل البيانات والصور سحابياً ومحلياً، ويمكنك الآن إرسال الفاتورة الرسمية إلى الواتساب
              </p>
            </div>

            {lastSavedPlace && (
              <div className="bg-slate-950 text-white p-6 rounded-3xl max-w-xl mx-auto text-right space-y-4 shadow-xl border border-slate-800">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-extrabold">الفاتورة الميدانية الرقمية الصادرة</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    {lastSavedPlace.paymentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">اسم المنشأة:</span>
                    <span className="font-bold text-white text-xs truncate block">{lastSavedPlace.businessName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">رقم الهاتف:</span>
                    <span className="font-bold text-white dir-ltr text-right block">{lastSavedPlace.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المبلغ المدفوع:</span>
                    <span className="font-extrabold text-emerald-400">{lastSavedPlace.paidAmount} ج.م</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المتبقي المؤجل:</span>
                    <span className="font-extrabold text-amber-400">{lastSavedPlace.remainingAmount} ج.م</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppInvoiceWithImage(lastSavedPlace, showToast)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                    title="إرسال الفاتورة عبر واتساب مباشرة"
                  >
                    <Send className="w-4 h-4" /> إرسال الفاتورة واتس اب
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintedInvoiceModalPlace(lastSavedPlace)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    title="معاينة ورقة الفاتورة المطبوعة"
                  >
                    <FileText className="w-4 h-4" /> معاينة 📄
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadZipForPlace(lastSavedPlace)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-800"
                    title="تنزيل حزمة ZIP للمكان"
                  >
                    <HardDrive className="w-4 h-4" /> ZIP
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSuccess(false)}
              className="bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold text-xs py-3.5 px-8 rounded-xl transition-all cursor-pointer border border-slate-800"
            >
              توثيق مكان تجاري جديد
            </button>
          </motion.div>
        )}

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-indigo-500/20 text-indigo-400 p-3.5 rounded-2xl border border-indigo-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">إجمالي الأماكن</span>
              <span className="text-2xl font-black text-white">{savedPlaces.length}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-emerald-500/20 text-emerald-400 p-3.5 rounded-2xl border border-emerald-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">المحصل المالي</span>
              <span className="text-xl font-black text-emerald-400">{totalCollected} <span className="text-xs">ج.م</span></span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-amber-500/20 text-amber-400 p-3.5 rounded-2xl border border-amber-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">توثيقات اليوم</span>
              <span className="text-2xl font-black text-white">{todayCount}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="bg-purple-500/20 text-purple-400 p-3.5 rounded-2xl border border-purple-500/30">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">التصنيف الأكثر تكراراً</span>
              <span className="text-xs font-extrabold text-white truncate block max-w-[120px]">{topCategory}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Map className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-lg font-black text-white">سجل التوثيق الميداني والفواتير المحفوظة</h3>
                <p className="text-xs text-slate-400">تصفح ومراجعة كل الأماكن الموثقة محلياً وسحابياً في قاعدة البيانات</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadMasterZip}
                disabled={!savedPlaces.length}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <HardDrive className="w-4 h-4" /> أرشيف (ZIP)
              </button>

              <button
                type="button"
                onClick={() => exportToCSV(savedPlaces)}
                disabled={!savedPlaces.length}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" /> إكسيل (CSV)
              </button>

              <button
                type="button"
                onClick={() => exportToJSON(savedPlaces)}
                disabled={!savedPlaces.length}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-4 h-4" /> نسخة احتياطية
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <Upload className="w-4 h-4" /> استيراد
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleJSONImport}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المحل، الفاتورة، المدينة، الحي، الهاتف..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="الكل">جميع التصنيفات</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlaces.map((place) => {
                const categoryBadge = place.subCategory === 'أخرى (إدخال مخصص)' && place.customCategory
                  ? place.customCategory
                  : place.subCategory || place.category;

                const payStatusColor =
                  place.paymentStatus === 'مدفوعة بالكامل'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : place.paymentStatus === 'دفع جزء من المبلغ (عربون)'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                return (
                  <div key={place.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex gap-4 items-start">
                        <div
                          onClick={() => setActiveModalPlace(place)}
                          className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-900 border border-slate-800 flex items-center justify-center cursor-pointer group relative"
                        >
                          {place.facadeImage ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={place.facadeImage} alt={place.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </>
                          ) : (
                            <Store className="w-8 h-8 text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-base text-white truncate">{place.businessName}</h4>
                              {place.nameEn && <span className="text-[11px] text-slate-400 font-mono block dir-ltr text-right truncate">{place.nameEn}</span>}
                            </div>
                            <button
                              onClick={() => deletePlace(place.id)}
                              className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition-all shrink-0"
                              title="حذف المكان"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                              {categoryBadge}
                            </span>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${payStatusColor}`}>
                              {place.paymentStatus || 'مدفوعة بالكامل'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2 text-[11px]">
                            <span className="text-slate-400 truncate">{place.city}، {place.neighborhood}</span>
                            <span className="font-extrabold text-white dir-ltr">
                              {place.paidAmount ?? 300} / {place.totalAmount || 300} ج.م
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
                        <span className="text-xs font-mono text-emerald-400 font-bold truncate flex-1 dir-ltr text-right">
                          {place.dms}
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => sendWhatsAppInvoiceWithImage(place, showToast)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                            title="إرسال الفاتورة عبر واتساب"
                          >
                            <Send className="w-3.5 h-3.5" /> إرسال الفاتورة واتس اب
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPrintedInvoiceModalPlace(place)}
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
                            title="معاينة الفاتورة المطبوعة"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadZipForPlace(place)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all border border-slate-700"
                            title="تنزيل حزمة ZIP للمكان"
                          >
                            <HardDrive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(place.dms, place.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              copiedPlaceId === place.id ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                            }`}
                            title="نسخ الإحداثيات"
                          >
                            {copiedPlaceId === place.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium px-1">
                        <span>الموثق: {place.documenterName || 'مكتب دليلك'}</span>
                        <button
                          onClick={() => setActiveModalPlace(place)}
                          className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> التفاصيل الكاملة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-950 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
              <Store className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-bold text-slate-300">لا توجد مواضع موثقة مطابقة للبحث</p>
              <p className="text-xs text-slate-500 mt-1">أكمل النموذج أعلاه لتوثيق أماكن جديدة في الميدان وإصدار الفواتير</p>
            </div>
          )}
        </div>

        {/* OFFICIAL PRINTED INVOICE VIEW MODAL */}
        <AnimatePresence>
          {showPrintedInvoiceModalPlace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowPrintedInvoiceModalPlace(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-white">
                    <FileText className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h3 className="text-lg font-black">معاينة الفاتورة المطبوعة من المؤسسة 📄</h3>
                      <p className="text-xs text-slate-400">فاتورة رسمية مصممة بأختام المؤسسة لإظهار أقصى درجات الجدية للعميل</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrintedInvoiceModalPlace(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-inner flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generateInvoiceImageDataUrl(showPrintedInvoiceModalPlace)}
                    alt="Official Invoice Paper"
                    className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xl border border-slate-800"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => sendWhatsAppInvoiceWithImage(showPrintedInvoiceModalPlace, showToast)}
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <Send className="w-4 h-4" /> إرسال الفاتورة عبر واتساب
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const imgUrl = generateInvoiceImageDataUrl(showPrintedInvoiceModalPlace);
                        const fn = `${showPrintedInvoiceModalPlace.businessName}_فاتورة_مطبوعة_رسمية.png`;
                        downloadImageFile(imgUrl, fn);
                        showToast('تم تنزيل صورة الفاتورة المطبوعة بنجاح!');
                      }}
                      className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" /> تنزيل الفاتورة كصورة (PNG)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const imgUrl = generateInvoiceImageDataUrl(showPrintedInvoiceModalPlace);
                        const win = window.open('');
                        if (win) {
                          win.document.write(`<html dir="rtl"><head><title>فاتورة رسمية - ${showPrintedInvoiceModalPlace.businessName}</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;"><img src="${imgUrl}" style="max-width:100%;height:auto;" onload="window.print();window.close();"/></body></html>`);
                          win.document.close();
                        }
                      }}
                      className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-700"
                    >
                      <Printer className="w-4 h-4" /> طباعة (PDF)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPrintedInvoiceModalPlace(null)}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-6 py-3 rounded-xl cursor-pointer border border-slate-700"
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PLACE DETAILS MODAL */}
        <AnimatePresence>
          {activeModalPlace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setActiveModalPlace(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-2.5 py-1 rounded-lg">
                        {activeModalPlace.category}
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-lg">
                        {activeModalPlace.subCategory === 'أخرى (إدخال مخصص)' && activeModalPlace.customCategory
                          ? activeModalPlace.customCategory
                          : activeModalPlace.subCategory || activeModalPlace.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mt-2">{activeModalPlace.businessName}</h3>
                    {activeModalPlace.nameEn && <p className="text-xs text-slate-400 font-mono dir-ltr text-right">{activeModalPlace.nameEn}</p>}
                  </div>
                  <button
                    onClick={() => setActiveModalPlace(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-950 text-white p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-400" /> الفاتورة والحساب المالي للخدمة
                    </span>
                    <span className="text-xs font-bold text-emerald-400">رقم: INV-{activeModalPlace.id.slice(-6)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">إجمالي التكلفة</span>
                      <span className="font-bold text-white text-sm">{activeModalPlace.totalAmount || 300} ج.م</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-emerald-400 block text-[10px]">المدفوع</span>
                      <span className="font-bold text-emerald-400 text-sm">{activeModalPlace.paidAmount ?? 300} ج.م</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-amber-400 block text-[10px]">المتبقي</span>
                      <span className="font-bold text-amber-400 text-sm">{activeModalPlace.remainingAmount ?? 0} ج.م</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-indigo-300 block flex items-center gap-1">
                      <Edit3 className="w-4 h-4 text-indigo-400" /> تغيير وتحديث حالة سداد الفاتورة:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdatePaymentStatus(activeModalPlace.id, 'مدفوعة بالكامل', activeModalPlace.totalAmount || 300)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                          activeModalPlace.paymentStatus === 'مدفوعة بالكامل'
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border-slate-800'
                        }`}
                      >
                        تم الدفع بالكامل
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePaymentStatus(activeModalPlace.id, 'غير مدفوعة (مؤجلة)', 0)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                          activeModalPlace.paymentStatus === 'غير مدفوعة (مؤجلة)'
                            ? 'bg-amber-600 text-white border-amber-400'
                            : 'bg-slate-950 hover:bg-slate-800 text-amber-400 border-slate-800'
                        }`}
                      >
                        غير مدفوعة (مؤجلة)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const val = prompt('أدخل المبلغ المقدم/العربون الذي دفعه العميل (ج.م):', activeModalPlace.paidAmount.toString());
                          if (val !== null) {
                            const num = parseFloat(val) || 100;
                            handleUpdatePaymentStatus(activeModalPlace.id, 'دفع جزء من المبلغ (عربون)', num);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                          activeModalPlace.paymentStatus === 'دفع جزء من المبلغ (عربون)'
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : 'bg-slate-950 hover:bg-slate-800 text-indigo-300 border-slate-800'
                        }`}
                      >
                        دفع جزء (عربون)
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => sendWhatsAppInvoiceWithImage(activeModalPlace, showToast)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <Send className="w-4 h-4" /> إرسال الفاتورة عبر واتساب
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPrintedInvoiceModalPlace(activeModalPlace)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <FileText className="w-4 h-4" /> معاينة 📄
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">الموقع على الخريطة التفاعلية:</span>
                  <InteractiveMap
                    lat={parseFloat(activeModalPlace.latitude) || 30.0444}
                    lng={parseFloat(activeModalPlace.longitude) || 31.2357}
                    interactive={false}
                    heightClass="h-56"
                    popupTitle={activeModalPlace.businessName}
                  />
                </div>

                {/* Display Facade, Internal and Additional Images in Modal */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">كافة الصور الموثقة للمكان:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeModalPlace.facadeImage && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block">صورة الواجهة</span>
                        <div
                          onClick={() => setFormImagePreview({ url: activeModalPlace.facadeImage, title: 'صورة الواجهة' })}
                          className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950 cursor-pointer hover:border-indigo-500 transition-all"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={activeModalPlace.facadeImage} alt="Facade" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {activeModalPlace.internalImage && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block">صورة من الداخل</span>
                        <div
                          onClick={() => setFormImagePreview({ url: activeModalPlace.internalImage!, title: 'صورة من الداخل' })}
                          className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950 cursor-pointer hover:border-indigo-500 transition-all"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={activeModalPlace.internalImage} alt="Internal" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {activeModalPlace.additionalImages && activeModalPlace.additionalImages.map((img, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-[10px] text-indigo-400 font-bold block">صورة إضافية ({idx + 1})</span>
                        <div
                          onClick={() => setFormImagePreview({ url: img, title: `صورة إضافية ${idx + 1}` })}
                          className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950 cursor-pointer hover:border-indigo-500 transition-all"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`Extra ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-950 border border-indigo-800 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
                  <div>
                    <span className="text-xs text-indigo-300 font-bold block">تنزيل حزمة هذا المكان بالكامل (ملف ZIP مضغوط):</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">يحتوي الملف على الفاتورة المطبوعة، ملحق JSON، وكافة صور المكان</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadZipForPlace(activeModalPlace)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
                  >
                    <HardDrive className="w-4 h-4" /> تنزيل حزمة ZIP
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStorageExplainModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowStorageExplainModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-white">
                    <Receipt className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-lg font-extrabold">نظام الفواتير الميدانية وحزم ZIP</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStorageExplainModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                  <div className="bg-emerald-950/80 border border-emerald-800 p-4 rounded-2xl space-y-1.5">
                    <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-400" /> 1. إرسال الفاتورة الموثقة عبر الواتساب
                    </h4>
                    <p className="text-slate-300">
                      تفتح محادثة الواتساب فوراً للرقم المسجل للعميل مع تنزيل ونسخ صورة الفاتورة المطبوعة ولصق النص بضغطة زر.
                    </p>
                  </div>

                  <div className="bg-indigo-950/80 border border-indigo-800 p-4 rounded-2xl space-y-1.5">
                    <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-indigo-400" /> 2. اختيار حالة السداد أثناء الإدخال
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 mt-2 font-medium">
                      <li><strong>سيدفع الآن بالكامل:</strong> (300 ج.م) تم الدفع مقدماً.</li>
                      <li><strong>سيدفع لاحقاً بعد الظهور:</strong> (0 مدفوع / 300 متبقي) مؤجلة لحين تفعيل الظهور على الخريطة.</li>
                      <li><strong>دفع عربون مقدماً:</strong> تسجيل المبلغ المقدم وحساب المتبقي تلقائياً.</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStorageExplainModal(false)}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer border border-slate-800 shadow-md"
                >
                  فهمت ذلك، إغلاق
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {formImagePreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setFormImagePreview(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white">{formImagePreview.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormImagePreview(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[70vh] flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formImagePreview.url}
                    alt={formImagePreview.title}
                    className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                  <span className="text-xs font-semibold text-slate-400">
                    معاينة الصورة المرفوعة قبل إتمام التوثيق والحفظ سحابياً وعلى جهازك
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormImagePreview(null)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    إغلاق المعاينة
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
