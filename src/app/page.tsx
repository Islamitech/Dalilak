'use client';
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Building2, Camera, MapPin, CheckCircle, XCircle, ChevronRight, ChevronLeft,
  User as UserIcon, Plus, Minus, FileText, Send, DollarSign, PieChart, Users,
  Check, X, Eye, EyeOff, ShieldCheck, RefreshCw, Smartphone, Award, ArrowRight,
  TrendingUp, Activity, Lock, AlertCircle, Share2, Printer, Download, Sparkles, Filter, Search, Bell, Clock
} from 'lucide-react';
import Navbar from './components/Navbar';
import {
  User, PlaceItem, ServiceOffer, RejectionDetails, AppStoreData,
  AVAILABLE_SERVICES, getStoredData, saveStoredData
} from './components/store';

export type { PlaceItem };

// ============================================================
// CACHED ASSETS FOR CANVAS INVOICE GENERATION
// ============================================================
let CACHED_LOGO_IMG: HTMLImageElement | null = null;
let CACHED_STAMP_TEXT_SVG: HTMLImageElement | null = null;

if (typeof window !== 'undefined') {
  const logo = new Image();
  logo.src = '/logo.png';
  logo.onload = () => { CACHED_LOGO_IMG = logo; };

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <path id="curveTop" fill="none" d="M 22,100 A 78,78 0 1,1 178,100" />
    <path id="curveBottom" fill="none" d="M 178,100 A 78,78 0 1,1 22,100" />
    <text fill="#0c43a4" font-size="14.5" font-family="Tahoma, Arial, sans-serif" font-weight="bold" letter-spacing="1">
      <textPath href="#curveTop" startOffset="50%" text-anchor="middle">★ دليلك للخدمات الرقمية ★</textPath>
    </text>
    <text fill="#0c43a4" font-size="14" font-family="Tahoma, Arial, sans-serif" font-weight="bold" letter-spacing="1">
      <textPath href="#curveBottom" startOffset="50%" text-anchor="middle">★ توثيق الكتروني معتمد ★</textPath>
    </text>
    <text x="32" y="104" fill="#0c43a4" font-size="16" font-family="Tahoma, Arial, sans-serif" font-weight="bold" text-anchor="middle">✴</text>
    <text x="168" y="104" fill="#0c43a4" font-size="16" font-family="Tahoma, Arial, sans-serif" font-weight="bold" text-anchor="middle">✴</text>
  </svg>`;
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const stampSvg = new Image();
  stampSvg.src = svgUrl;
  stampSvg.onload = () => { CACHED_STAMP_TEXT_SVG = stampSvg; };
}

function generateQRCodeCanvas(text: string, size: number = 300): HTMLCanvasElement {
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = size;
  qrCanvas.height = size;
  try {
    QRCode.toCanvas(qrCanvas, text || 'https://www.google.com/maps', {
      width: size,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (e) {
    console.error(e);
  }
  return qrCanvas;
}

// ============================================================
// OFFICIAL CANVAS INVOICE GENERATOR (WITH REALISTIC MPT TILT STAMP)
// ============================================================
function generateInvoiceImageDataUrl(place: PlaceItem): string {
  const W = 850;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const COL = {
    bg: '#FFFFFF',
    headerBg: '#1E4A3A',
    headerAccent: '#F4A261',
    primary: '#1E202A',
    secondary: '#1e293b',
    muted: '#334155',
    lightMuted: '#64748b',
    border: '#cbd5e1',
    lightBg: '#f8fafc',
    tableBg: '#f1f5f9',
    emerald: '#10b981',
    emeraldDark: '#047857',
    amber: '#b45309',
    stampBlue: '#0c43a4',
    white: '#FFFFFF',
  };

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // 1. Background + Watermark
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = 'bold 17px Tahoma, Arial, sans-serif';
  ctx.fillStyle = 'rgba(12, 67, 164, 0.06)';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  for (let y = -650; y <= 650; y += 100) {
    ctx.fillText('DALEELAK DIGITAL SERVICES  ★  توثيق معتمد رسمياً  ★  دليلك للخدمات الرقمية', 0, y);
  }
  ctx.restore();

  // Borders
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(16, 16, W - 32, H - 32);

  // 2. Header
  ctx.fillStyle = COL.headerBg;
  ctx.fillRect(18, 18, W - 36, 130);
  ctx.fillStyle = COL.headerAccent;
  ctx.fillRect(18, 148, W - 36, 4);

  const logoImg = CACHED_LOGO_IMG || new Image();
  if (!logoImg.src) logoImg.src = '/logo.png';

  if (logoImg.complete && logoImg.width > 0) {
    ctx.drawImage(logoImg, 24, 23, 120, 120);
  }

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = COL.white;
  ctx.font = 'bold 26px Tahoma, Arial, sans-serif';
  ctx.fillText('دليلك للخدمات الرقمية (توثيق الخرائط)', W - 35, 58);

  ctx.font = 'bold 13px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText('المنظومة الرقمية الشاملة لتوثيق وإدارة المنشآت على خرائط جوجل الرسمية', W - 35, 85);
  ctx.font = '12px Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('سجل تجاري وترخيص ميداني معتمد — القاهرة، مصر', W - 35, 110);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  const invId = `INV-${(place.id || '909500').slice(-6).toUpperCase()}`;
  ctx.fillText(`INVOICE #${invId}`, 100, 105);

  // 3. Document Title
  const titleY = 180;
  ctx.fillStyle = COL.headerBg;
  ctx.fillRect(18, titleY, W - 36, 40);
  ctx.fillStyle = COL.white;
  ctx.font = 'bold 18px Tahoma, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('فاتورة توثيق ميداني رسمية — إلكترونية معتمدة', W / 2, titleY + 26);

  // 4. Place Details Table
  const sec1Y = titleY + 54;
  ctx.fillStyle = COL.headerBg;
  ctx.fillRect(18, sec1Y, W - 36, 30);
  ctx.fillStyle = COL.white;
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('بيانات المنشأة التجارية والعنوان الميداني الموثق', W - 30, sec1Y + 20);

  const rowH = 34;
  const rows = [
    { label: 'اسم المنشأة التجارية', val: place.businessName || '—' },
    { label: 'النشاط والتصنيف', val: `${place.mainCategory || 'أنشطة تجارية'} — ${place.subCategory || 'عام'}` },
    { label: 'العنوان التفصيلي', val: place.address || `${place.city || 'القاهرة'} — ${place.neighborhood || 'ميداني'} — ${place.street || 'الرئيسي'}` },
    { label: 'الإحداثيات الجغرافية', val: place.dms || 'N 30°02\'12" E 31°14\'05"' },
    { label: 'رقم التواصل / البريد', val: `${place.phone || '01143888355'}   |   البريد: غير مسجل` }
  ];

  rows.forEach((r, idx) => {
    const ry = sec1Y + 30 + idx * rowH;
    ctx.fillStyle = idx % 2 === 0 ? COL.lightBg : COL.white;
    ctx.fillRect(18, ry, W - 36, rowH);
    ctx.strokeStyle = COL.border;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(18, ry, W - 36, rowH);

    ctx.textAlign = 'right';
    ctx.fillStyle = COL.muted;
    ctx.font = 'bold 13px Tahoma, Arial, sans-serif';
    ctx.fillText(r.label, W - 35, ry + 22);

    ctx.textAlign = 'right';
    ctx.fillStyle = COL.primary;
    ctx.font = 'bold 13.5px Tahoma, Arial, sans-serif';
    ctx.fillText(r.val, W - 220, ry + 22);
  });

  // 5. Service Description
  const sec2Y = sec1Y + 30 + rows.length * rowH + 14;
  ctx.fillStyle = COL.headerBg;
  ctx.fillRect(18, sec2Y, W - 36, 30);
  ctx.fillStyle = COL.white;
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  ctx.fillText('وصف الخدمة الميدانية', W - 30, sec2Y + 20);

  ctx.textAlign = 'left';
  ctx.fillText('القيمة (ج.م)', 35, sec2Y + 20);

  const servY = sec2Y + 30;
  ctx.fillStyle = COL.white;
  ctx.fillRect(18, servY, W - 36, 60);
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(18, servY, W - 36, 60);

  ctx.textAlign = 'right';
  ctx.fillStyle = COL.primary;
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  ctx.fillText('خدمة إضافة وتوثيق المنشأة التجارية ونقل الملكية على خرائط جوجل الرسمية', W - 35, servY + 26);

  ctx.font = '12px Tahoma, Arial, sans-serif';
  ctx.fillStyle = COL.lightMuted;
  ctx.fillText('تشمل: المعاينة الميدانية، التقاط الصور، تسجيل الإحداثيات، وإصدار التقرير الرقمي', W - 35, servY + 46);

  const tot = place.totalAmount || 300;
  const paid = place.paidAmount ?? tot;
  const rem = place.remainingAmount ?? Math.max(0, tot - paid);

  ctx.textAlign = 'left';
  ctx.fillStyle = COL.emeraldDark;
  ctx.font = 'bold 18px Tahoma, Arial, sans-serif';
  ctx.fillText(`${tot} ج.م`, 35, servY + 36);

  // 6. Financial Summary Box
  const boxY = servY + 74;
  const boxW = (W - 36 - 24) / 3;
  const boxH = 75;

  ctx.fillStyle = COL.lightBg;
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 1;
  roundRect(18, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = COL.muted;
  ctx.font = 'bold 13.5px Tahoma, Arial, sans-serif';
  ctx.fillText('إجمالي الفاتورة', 18 + boxW / 2, boxY + 26);
  ctx.font = 'bold 25px Tahoma, Arial, sans-serif';
  ctx.fillStyle = COL.primary;
  ctx.fillText(`${tot} ج.م`, 18 + boxW / 2, boxY + 60);

  ctx.fillStyle = '#ecfdf5';
  ctx.strokeStyle = '#a7f3d0';
  roundRect(18 + boxW + 12, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COL.emeraldDark;
  ctx.font = 'bold 13.5px Tahoma, Arial, sans-serif';
  ctx.fillText('المبلغ المدفوع', 18 + boxW + 12 + boxW / 2, boxY + 26);
  ctx.font = 'bold 25px Tahoma, Arial, sans-serif';
  ctx.fillText(`${paid} ج.م`, 18 + boxW + 12 + boxW / 2, boxY + 60);

  ctx.fillStyle = rem > 0 ? '#fffbeb' : '#ecfdf5';
  ctx.strokeStyle = rem > 0 ? '#fde68a' : '#a7f3d0';
  roundRect(18 + (boxW + 12) * 2, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = rem > 0 ? COL.amber : COL.emeraldDark;
  ctx.font = 'bold 13.5px Tahoma, Arial, sans-serif';
  ctx.fillText('المتبقي المستحق', 18 + (boxW + 12) * 2 + boxW / 2, boxY + 26);
  ctx.font = 'bold 25px Tahoma, Arial, sans-serif';
  ctx.fillText(`${rem} ج.م`, 18 + (boxW + 12) * 2 + boxW / 2, boxY + 60);

  // Status row
  const statusY = boxY + boxH + 14;
  ctx.fillStyle = COL.tableBg;
  ctx.fillRect(18, statusY, W - 36, 38);
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(18, statusY, W - 36, 38);

  ctx.textAlign = 'right';
  ctx.fillStyle = COL.primary;
  ctx.font = 'bold 16px Tahoma, Arial, sans-serif';
  ctx.fillText('حالة الفاتورة:', W - 35, statusY + 25);

  ctx.textAlign = 'left';
  ctx.fillStyle = place.paymentStatus === 'مدفوعة بالكامل' ? COL.emeraldDark : COL.amber;
  ctx.font = 'bold 16px Tahoma, Arial, sans-serif';
  ctx.fillText(`[ ${place.paymentStatus || 'مدفوعة بالكامل'} ]`, 35, statusY + 25);

  const noteY = statusY + 48;
  ctx.textAlign = 'right';
  ctx.font = 'bold 13px Tahoma, Arial, sans-serif';
  ctx.fillStyle = COL.muted;
  let noteLine = '';
  if (place.paymentStatus === 'مدفوعة بالكامل') {
    noteLine = 'ملاحظة: تم سداد كامل مبلغ الفاتورة بنجاح وجاري متابعة ظهور المنشأة على الخريطة.';
  } else if (place.paymentStatus === 'دفع جزء من المبلغ (عربون)') {
    noteLine = `ملاحظة: تم استلام عربون (${paid} ج.م)، وسيتم سداد المتبقي (${rem} ج.م) فور التفعيل.`;
  } else {
    noteLine = `ملاحظة: الفاتورة مؤجلة بالكامل (${rem} ج.م)، ويتم السداد فور ظهور المنشأة على الخريطة.`;
  }
  ctx.fillText(noteLine, W - 35, noteY);

  // 7. STAMP & QR SECTION (RIGHT ALIGNED DEPARTMENT & TILTED STAMP)
  const stampSectionY = noteY + 30;
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, stampSectionY);
  ctx.lineTo(W - 30, stampSectionY);
  ctx.stroke();

  const stampAreaY = stampSectionY + 16;

  // Documenter Info Right Side
  ctx.textAlign = 'right';
  ctx.fillStyle = COL.primary;
  ctx.font = 'bold 15px Tahoma, Arial, sans-serif';
  ctx.fillText('الموثق الميداني المسؤول:', W - 35, stampAreaY + 20);

  ctx.fillStyle = COL.secondary;
  ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
  ctx.fillText(place.documenterName || 'أحمد عزالدين', W - 35, stampAreaY + 44);

  ctx.font = 'bold 12px Tahoma, Arial, sans-serif';
  ctx.fillStyle = COL.muted;
  ctx.fillText('قسم التوقيع والاعتماد — دليلك للخدمات الرقمية', W - 35, stampAreaY + 68);

  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W - 270, stampAreaY + 95);
  ctx.lineTo(W - 35, stampAreaY + 95);
  ctx.stroke();

  // Simulated signature stroke
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W - 240, stampAreaY + 90);
  ctx.bezierCurveTo(W - 200, stampAreaY + 70, W - 160, stampAreaY + 110, W - 110, stampAreaY + 85);
  ctx.bezierCurveTo(W - 80, stampAreaY + 70, W - 60, stampAreaY + 100, W - 45, stampAreaY + 90);
  ctx.stroke();

  ctx.font = 'bold 12px Tahoma, Arial, sans-serif';
  ctx.fillStyle = COL.lightMuted;
  ctx.fillText('التوقيع المعتمد', W - 45, stampAreaY + 115);

  // REALISTIC HUMAN-LIKE TILTED STAMP (Bottom-Right Overlapping)
  const stX = W - 150;
  const stY = stampAreaY + 88;

  ctx.save();
  ctx.translate(stX, stY);
  ctx.rotate(-0.22); // ~12.6 deg human stamp tilt
  ctx.globalAlpha = 0.88;

  const stampBlue = '#0c43a4';

  ctx.strokeStyle = stampBlue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 84, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 77, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();

  if (logoImg.complete && logoImg.width > 0) {
    ctx.save();
    if (typeof document !== 'undefined') {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 86;
      offCanvas.height = 86;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(logoImg, 0, 0, 86, 86);
        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = stampBlue;
        offCtx.fillRect(0, 0, 86, 86);
        ctx.drawImage(offCanvas, -43, -43, 86, 86);
      } else {
        ctx.drawImage(logoImg, -40, -40, 80, 80);
      }
    } else {
      ctx.drawImage(logoImg, -40, -40, 80, 80);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = stampBlue;
    ctx.font = 'bold 20px Tahoma, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('دليلك', 0, 6);
  }

  const stampTextSvg = CACHED_STAMP_TEXT_SVG || new Image();
  if (stampTextSvg.complete && stampTextSvg.width > 0) {
    ctx.drawImage(stampTextSvg, -88, -88, 176, 176);
  } else {
    ctx.fillStyle = stampBlue;
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.font = 'bold 14px Tahoma, Arial, sans-serif';
    ctx.fillText('★ دليلك للخدمات الرقمية ★', 0, -62);
    ctx.fillText('★ توثيق الكتروني ★', 0, 66);
  }

  ctx.restore();

  // LEFT SIDE: HUGE SCANNABLE QR CODE (210px x 210px)
  const siteOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  let qrData = '';
  if (place.dms) {
    qrData = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.dms)}`;
  } else if (place.latitude && place.longitude) {
    qrData = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  } else {
    qrData = `${siteOrigin}/?placeId=${encodeURIComponent(place.id)}`;
  }

  const qrSize = 210;
  const qrCanvas = generateQRCodeCanvas(qrData, 550);
  const qrX = 35;
  const qrY = stampAreaY + 5;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);

  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.fillStyle = COL.primary;
  ctx.font = 'bold 12.5px Tahoma, Arial, sans-serif';
  ctx.fillText('امسح الكود للتحقق من صحة الفاتورة 📱', qrX + qrSize / 2, qrY + qrSize + 22);

  // FOOTER BAR
  const footerY = H - 65;
  ctx.fillStyle = COL.headerBg;
  ctx.fillRect(18, footerY, W - 36, 48);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL.lightMuted;
  ctx.font = 'bold 12px Tahoma, Arial, sans-serif';
  ctx.fillText('دليلك للخدمات الرقمية — إدارة توثيق خرائط جوجل الرسمية — جميع الحقوق محفوظة © 2026', W / 2, footerY + 18);
  ctx.fillText('فاتورة إلكترونية رسمية محمية بختم المؤسسة وباركود التحقق التفاعلي', W / 2, footerY + 35);

  ctx.fillStyle = COL.headerAccent;
  ctx.fillRect(18, footerY, W - 36, 2);

  return canvas.toDataURL('image/png');
}

// Helper: Haptic feedback vibration
function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(25);
    } catch (e) { }
  }
}

export default function FieldDocumentationApp() {
  const [store, setStore] = useState<AppStoreData>(() => getStoredData());
  const [activeTab, setActiveTab] = useState<
    'login' | 'admin-dash' | 'emp-dash' | 'step1-identity' | 'step2-geo' |
    'step3-class' | 'step4-sales' | 'step5-acceptance' | 'step5-rejection' |
    'invoices' | 'transition'
  >('login');

  // Form states for login
  const [emailInput, setEmailInput] = useState('ahmed@daleelak.com');
  const [passwordInput, setPasswordInput] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Modals
  const [showInvoicePlace, setShowInvoicePlace] = useState<PlaceItem | null>(null);
  const [showPaymentPlace, setShowPaymentPlace] = useState<PlaceItem | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPass, setNewEmpPass] = useState('');
  const [showTodayReport, setShowTodayReport] = useState(false);

  // Admin Dashboard Advanced Modals & Filters State
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<User | null>(null);
  const [selectedPlaceAudit, setSelectedPlaceAudit] = useState<PlaceItem | null>(null);
  const [adminNoteText, setAdminNoteText] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminFilterStatus, setAdminFilterStatus] = useState('الكل');
  const [adminCityFilter, setAdminCityFilter] = useState('الكل');
  const [showWarningModalUser, setShowWarningModalUser] = useState<User | null>(null);
  const [warningReasonInput, setWarningReasonInput] = useState('');

  // Field Employee Features & Reminders State
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showEmployeePlaceModal, setShowEmployeePlaceModal] = useState<PlaceItem | null>(null);
  const [showAddReminderModal, setShowAddReminderModal] = useState<PlaceItem | null>(null);
  const [reminderNoteInput, setReminderNoteInput] = useState('');
  const [reminderDateTimeInput, setReminderDateTimeInput] = useState('');
  const [empFilterStatus, setEmpFilterStatus] = useState('الكل');

  // Strict Authorization Guard: Admin Dashboard is EXCLUSIVE to Admin role only
  useEffect(() => {
    if (activeTab === 'admin-dash' && store.currentUser?.role !== 'admin') {
      setActiveTab('emp-dash');
    }
  }, [activeTab, store.currentUser]);

  const handleToggleReminderCompleted = (placeId: string) => {
    triggerHaptic();
    setStore(prev => ({
      ...prev,
      places: prev.places.map(p => p.id === placeId ? { ...p, reminderCompleted: !p.reminderCompleted } : p)
    }));
  };

  const handleSaveReminder = (placeId: string, dt: string, note: string) => {
    if (!note.trim()) return;
    triggerHaptic();
    const formattedDt = dt || new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    setStore(prev => ({
      ...prev,
      places: prev.places.map(p => {
        if (p.id === placeId) {
          return {
            ...p,
            reminderDateTime: formattedDt,
            reminderNote: note.trim(),
            reminderCompleted: false
          };
        }
        return p;
      }),
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'تم جدولـة تذكير تجاري جديد ⏰',
          message: `تذكير لمنشأة: ${note.trim()}`,
          type: 'reminder',
          targetPlaceId: placeId,
          read: false,
          createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        },
        ...(prev.notifications || [])
      ]
    }));
    setShowAddReminderModal(null);
    setReminderNoteInput('');
    setReminderDateTimeInput('');
  };

  const handleMarkNotificationRead = (notifId: string) => {
    triggerHaptic();
    setStore(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => n.id === notifId ? { ...n, read: true } : n)
    }));
  };

  const handleToggleAdminStatus = (empId: string, targetStatus?: 'authorized' | 'suspended' | 'under_review') => {
    triggerHaptic();
    setStore(prev => ({
      ...prev,
      employees: prev.employees.map(e => {
        if (e.id === empId) {
          const nextStatus = targetStatus || (e.adminStatus === 'suspended' ? 'authorized' : 'suspended');
          return {
            ...e,
            adminStatus: nextStatus,
            activityStatus: nextStatus === 'suspended' ? 'offline' : (e.activityStatus || 'active')
          };
        }
        return e;
      })
    }));
  };

  const handleIssueWarning = (empId: string, reason: string) => {
    if (!reason.trim()) return;
    triggerHaptic();
    const newWarn = {
      id: `warn-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG'),
      reason: reason.trim(),
      issuedBy: store.currentUser?.name || 'إشراف المنظومة'
    };
    setStore(prev => ({
      ...prev,
      employees: prev.employees.map(e => {
        if (e.id === empId) {
          return {
            ...e,
            adminStatus: 'under_review',
            warnings: [...(e.warnings || []), newWarn]
          };
        }
        return e;
      })
    }));
    setShowWarningModalUser(null);
    setWarningReasonInput('');
  };

  const handleSaveAdminPlaceNote = (placeId: string, note: string) => {
    triggerHaptic();
    setStore(prev => ({
      ...prev,
      places: prev.places.map(p => p.id === placeId ? { ...p, adminRequest: note, notes: note } : p)
    }));
    setSelectedPlaceAudit(null);
    setAdminNoteText('');
  };

  // Workflow Documentation Draft State (Steps 1 to 5)
  const [draft, setDraft] = useState<Partial<PlaceItem>>({
    businessName: '',
    exteriorPhoto: '',
    dms: `N 30°03'${Math.floor(10 + Math.random() * 40)}.${Math.floor(10 + Math.random() * 89)}" E 31°14'${Math.floor(10 + Math.random() * 40)}"`,
    latitude: 30.0444,
    longitude: 31.2357,
    city: 'الجيزة',
    neighborhood: 'حدائق الأهرام',
    address: 'الجيزة — حدائق الأهرام — الشارع الرئيسي',
    isActiveStreet: true,
    hasCompetitor: false,
    similarStoresCount: 2,
    operatingStatus: 'مفتوح (يعمل حالياً)',
    mainCategory: 'مطاعم',
    subCategory: 'مأكولات سريعة',
    currentCustomers: 4,
    interiorPhotos: [],
    offeredServices: [],
    acceptedServices: [],
    merchantName: '',
    phone: '',
    notes: '',
    rejectionDetails: {
      metOwner: true,
      ownerReaction: 'استمع لي واهتم',
      customerVolume: 'يوجد زبائن كثر',
      notes: ''
    }
  });

  const [ocrSuggestedName, setOcrSuggestedName] = useState('مطعم وقهوة السعادة');
  const [isEditingNameManually, setIsEditingNameManually] = useState(false);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  // Save changes to local storage automatically
  useEffect(() => {
    saveStoredData(store);
  }, [store]);

  // Handle Login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic();
    setLoginError('');

    const matched = store.employees.find(
      emp => emp.email.toLowerCase() === emailInput.trim().toLowerCase()
    );

    if (emailInput.includes('admin') || emailInput === 'admin@daleelak.com') {
      const adminUser: User = {
        id: 'admin-1',
        name: 'المدير العام',
        email: 'admin@daleelak.com',
        role: 'admin',
        status: 'active',
        adminStatus: 'authorized',
        todayCount: 15
      };
      setStore(prev => ({ ...prev, currentUser: adminUser }));
      setActiveTab('admin-dash');
      return;
    }

    if (matched) {
      if (matched.adminStatus === 'suspended') {
        setLoginError('عفواً، تم إيقاف هذا الحساب إدارياً بواسطة إشراف المنظومة. يرجى التواصل مع المدير المسؤول.');
        return;
      }
      const updatedUser: User = {
        ...matched,
        activityStatus: 'active',
        lastActiveTime: 'الآن (متصل ومباشر)'
      };
      setStore(prev => ({
        ...prev,
        currentUser: updatedUser,
        employees: prev.employees.map(e => e.id === matched.id ? updatedUser : e)
      }));
      setActiveTab('emp-dash');
    } else {
      // Default to employeeAhmed if any credential
      const empAhmed: User = store.employees[0] || {
        id: 'emp-1',
        name: 'أحمد عزالدين',
        email: emailInput,
        role: 'employee',
        status: 'active',
        adminStatus: 'authorized',
        todayCount: 6
      };
      setStore(prev => ({ ...prev, currentUser: empAhmed }));
      setActiveTab('emp-dash');
    }
  };

  // Quick Biometric Login
  const handleBiometricLogin = () => {
    triggerHaptic();
    handleLogin();
  };

  // Start new documentation flow
  const startNewDocumentation = () => {
    triggerHaptic();
    setDraft({
      id: `PLACE-${Math.floor(100000 + Math.random() * 900000)}`,
      businessName: '',
      exteriorPhoto: '/logo.png',
      dms: `N 30°03'${Math.floor(10 + Math.random() * 40)}.${Math.floor(10 + Math.random() * 89)}" E 31°14'${Math.floor(10 + Math.random() * 40)}"`,
      latitude: 30.0444 + (Math.random() * 0.02 - 0.01),
      longitude: 31.2357 + (Math.random() * 0.02 - 0.01),
      address: 'القاهرة — الشارع الرئيسي',
      isActiveStreet: true,
      hasCompetitor: false,
      similarStoresCount: 2,
      operatingStatus: 'مفتوح (يعمل حالياً)',
      mainCategory: 'مطاعم',
      subCategory: 'مأكولات سريعة',
      currentCustomers: 4,
      interiorPhotos: [],
      offeredServices: [],
      acceptedServices: [],
      merchantName: '',
      phone: '',
      notes: '',
      documenterName: store.currentUser?.name || 'أحمد عزالدين',
      documenterId: store.currentUser?.id || 'emp-1',
      createdAt: new Date().toISOString()
    });
    setOcrSuggestedName('مؤسسة البركة التجارية');
    setIsEditingNameManually(false);
    setCurrentOfferIndex(0);
    setActiveTab('step1-identity');
  };

  // Complete Acceptance Flow (Page 8)
  const handleCompleteAcceptance = () => {
    triggerHaptic();
    const newPlace: PlaceItem = {
      ...(draft as PlaceItem),
      id: draft.id || `PLACE-${Math.floor(100000 + Math.random() * 900000)}`,
      businessName: draft.businessName || 'منشأة ميدانية معتمدة',
      visitResult: 'accepted',
      totalAmount: 300,
      paidAmount: 150,
      remainingAmount: 150,
      paymentStatus: 'دفع جزء من المبلغ (عربون)',
      documenterName: store.currentUser?.name || 'أحمد عزالدين',
      documenterId: store.currentUser?.id || 'emp-1',
      createdAt: new Date().toISOString()
    };

    setStore(prev => {
      const updatedPlaces = [newPlace, ...prev.places];
      const updatedEmployees = prev.employees.map(emp =>
        emp.id === prev.currentUser?.id
          ? { ...emp, todayCount: emp.todayCount + 1 }
          : emp
      );
      const updatedCurrentUser = prev.currentUser
        ? { ...prev.currentUser, todayCount: prev.currentUser.todayCount + 1 }
        : null;

      return {
        ...prev,
        places: updatedPlaces,
        employees: updatedEmployees,
        currentUser: updatedCurrentUser,
        lastCompletedVisit: newPlace,
        lastActivityNote: `${newPlace.businessName} — قبول التوثيق`
      };
    });

    setActiveTab('transition');
  };

  // Complete Rejection Flow (Page 9)
  const handleCompleteRejection = () => {
    triggerHaptic();
    const newPlace: PlaceItem = {
      ...(draft as PlaceItem),
      id: draft.id || `PLACE-${Math.floor(100000 + Math.random() * 900000)}`,
      businessName: draft.businessName || 'منشأة تجارية',
      visitResult: 'rejected',
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: 'غير مدفوعة',
      documenterName: store.currentUser?.name || 'أحمد عزالدين',
      documenterId: store.currentUser?.id || 'emp-1',
      createdAt: new Date().toISOString()
    };

    setStore(prev => {
      const updatedPlaces = [newPlace, ...prev.places];
      const updatedEmployees = prev.employees.map(emp =>
        emp.id === prev.currentUser?.id
          ? { ...emp, todayCount: emp.todayCount + 1 }
          : emp
      );
      const updatedCurrentUser = prev.currentUser
        ? { ...prev.currentUser, todayCount: prev.currentUser.todayCount + 1 }
        : null;

      return {
        ...prev,
        places: updatedPlaces,
        employees: updatedEmployees,
        currentUser: updatedCurrentUser,
        lastCompletedVisit: newPlace,
        lastActivityNote: `${newPlace.businessName} — تم تسجيل الرفض`
      };
    });

    setActiveTab('transition');
  };

  // Add new employee (Page 2 Admin)
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    triggerHaptic();
    const newEmp: User = {
      id: `emp-${Date.now()}`,
      name: newEmpName,
      email: newEmpEmail || `${newEmpName.split(' ')[0]}@daleelak.com`,
      role: 'employee',
      status: 'active',
      adminStatus: 'authorized',
      activityStatus: 'offline',
      todayCount: 0
    };

    setStore(prev => ({
      ...prev,
      employees: [...prev.employees, newEmp]
    }));

    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPass('');
    setShowAddEmpModal(false);
  };

  // Add Payment Modal submission
  const handleRecordPayment = (place: PlaceItem) => {
    triggerHaptic();
    const amt = parseFloat(paymentAmountInput) || 0;
    if (amt <= 0) return;

    setStore(prev => {
      const updatedPlaces = prev.places.map(p => {
        if (p.id === place.id) {
          const newPaid = (p.paidAmount || 0) + amt;
          const newRem = Math.max(0, (p.totalAmount || 300) - newPaid);
          const newStatus: 'مدفوعة بالكامل' | 'دفع جزء من المبلغ (عربون)' | 'غير مدفوعة' =
            newRem === 0 ? 'مدفوعة بالكامل' : 'دفع جزء من المبلغ (عربون)';
          return {
            ...p,
            paidAmount: newPaid,
            remainingAmount: newRem,
            paymentStatus: newStatus
          };
        }
        return p;
      });
      return { ...prev, places: updatedPlaces };
    });

    setShowPaymentPlace(null);
    setPaymentAmountInput('');
  };

  // WhatsApp send handler
  const handleSendWhatsApp = (place: PlaceItem) => {
    triggerHaptic();
    const invNum = `INV-${place.id.slice(-6).toUpperCase()}`;
    const text = encodeURIComponent(
      `أهلاً بك عميلنا العزيز 🌹\nالفاتورة الرسمية المعتمدة لتوثيق منشأتكم (*${place.businessName}*):\n• رقم الفاتورة: #${invNum}\n• الموثق: ${place.documenterName}\n• إجمالي الفاتورة: ${place.totalAmount} ج.م\n• المبلغ المدفوع: ${place.paidAmount} ج.م\n• المتبقي: ${place.remainingAmount} ج.م\n• الحالة: [ ${place.paymentStatus} ]`
    );
    const phone = place.phone ? place.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // CSV Audit Report Export Handler
  const handleExportCSV = () => {
    triggerHaptic();
    const headers = ['رقم المنشأة', 'اسم المنشأة', 'الموثق', 'حالة الزيارة', 'المدينة', 'الحي', 'المبلغ المدفوع', 'المبلغ المتبقي', 'التاريخ'];
    const rows = store.places.map(p => [
      p.id,
      `"${p.businessName.replace(/"/g, '""')}"`,
      `"${(p.documenterName || '').replace(/"/g, '""')}"`,
      p.visitResult === 'accepted' ? 'مقبول' : 'مرفوض',
      `"${p.city || ''}"`,
      `"${p.neighborhood || ''}"`,
      p.paidAmount || 0,
      p.remainingAmount || 0,
      `"${new Date(p.createdAt || Date.now()).toLocaleDateString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `daleelak_field_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics for dashboards
  const todayVerifiedCount = store.places.length;
  const acceptedCount = store.places.filter(p => p.visitResult === 'accepted').length;
  const acceptanceRate = todayVerifiedCount > 0 ? Math.round((acceptedCount / todayVerifiedCount) * 100) : 100;
  const totalCollectedToday = store.places.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const unpaidInvoicesCount = store.places.filter(p => (p.remainingAmount || 0) > 0).length;

  return (
    <div className="min-h-screen bg-[#F5F2E6] text-[#1E202A] flex flex-col font-sans dir-rtl select-none">
      {/* Global Top Fixed Navbar (Appears on all screens except Login) */}
      {activeTab !== 'login' && (
        <Navbar
          currentUser={store.currentUser}
          unreadNotificationsCount={(store.notifications || []).filter(n => !n.read).length}
          onToggleNotifications={() => {
            triggerHaptic();
            setShowNotificationsModal(true);
          }}
          onLogout={() => {
            triggerHaptic();
            setActiveTab('login');
          }}
        />
      )}

      {/* Main Screen Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24">
        {/* ============================================================ */}
        {/* PAGE 1: LOGIN PAGE (تسجيل الدخول)                           */}
        {/* ============================================================ */}
        {activeTab === 'login' && (
          <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 animate-fade-in">
            <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
              {/* Logo & Header */}
              <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto shadow-lg border-2 border-[#1E4A3A] bg-slate-950 flex items-center justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="دليلك" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#1E4A3A] mb-1">دليلك للخدمات الرقمية</h1>
              <p className="text-base font-bold text-emerald-800 bg-emerald-50 py-1 px-3 rounded-full inline-block mb-6 border border-emerald-200">
                منظومة التوثيق الميداني
              </p>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 text-right dir-rtl">
                <div>
                  <label className="block text-sm font-bold text-[#1E202A] mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني"
                    className="w-full text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1E202A] mb-1.5">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="w-full text-right pl-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <p className="text-red-700 bg-red-50 text-sm font-bold p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full btn-primary-action mt-2 text-xl py-3.5"
                >
                  تسجيل الدخول
                </button>

                {/* Biometric Login */}
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-[#1E202A] font-bold py-3 px-4 rounded-xl border border-slate-300 flex items-center justify-center gap-2 mt-3 transition-all"
                >
                  <Smartphone className="w-5 h-5 text-[#1E4A3A]" />
                  <span>دخول آمن بالبصمة الحيوية أو الوجه (Biometric Passkey)</span>
                </button>
              </form>

              {/* Footer Note */}
              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>آخر نشاط تم تسجيله:</span>
                <span className="text-[#1E4A3A] font-extrabold">{store.lastActivityNote}</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 2: ADMIN DASHBOARD (لوحة تحكم المدير التفاعلية الشاملة)  */}
        {/* ============================================================ */}
        {activeTab === 'admin-dash' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Bar Header */}
            <div className="bg-[#1E4A3A] text-white p-5 rounded-3xl shadow-lg border border-[#143529] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-7 h-7" />
                  <span>لوحة تحكم المدير (Admin Command Center)</span>
                </h2>
                <p className="text-emerald-100 text-sm mt-1">متابعة أداء الموظفين وإدارة عمليات التوثيق الميداني والتحصيل المالي بطلاقة ورؤية شاملة</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { triggerHaptic(); setActiveTab('invoices'); }}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md text-sm"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>سجل الفواتير والتحصيل ({unpaidInvoicesCount})</span>
                </button>
                <button
                  onClick={() => alert(`تصدير تقرير شامل (CSV / PDF):\n• الأنشطة التوثيقية: ${store.places.length}\n• إجمالي التحصيل: ${totalCollectedToday} ج.م`)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-2.5 rounded-xl border border-emerald-600 flex items-center gap-1.5 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير البيانات</span>
                </button>
              </div>
            </div>

            {/* A. Executive Key Financial & Operational Metric Cards (4 Cards Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-800/30 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-600">إجمالي الموظفين</span>
                  <Users className="w-5 h-5 text-[#1E4A3A]" />
                </div>
                <div className="text-2xl font-black text-[#1E4A3A]">{store.employees.length} موظف</div>
                <p className="text-xs text-slate-500 mt-1 font-bold">
                  {store.employees.filter(e => e.status === 'active').length} نشط حالياً | {store.employees.filter(e => e.status === 'break').length} استراحة
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-800/30 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-600">إجمالي التحصيل اليوم</span>
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-800">{totalCollectedToday} ج.م</div>
                <p className="text-xs text-slate-500 mt-1 font-bold">متبقي غير محصل: {store.places.reduce((acc, p) => acc + (p.remainingAmount || 0), 0)} ج.م</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-800/30 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-600">التوثيقات المسجلة</span>
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700">{todayVerifiedCount} منشأة</div>
                <p className="text-xs text-slate-500 mt-1 font-bold">مقبولة: {acceptedCount} | مرفوضة: {todayVerifiedCount - acceptedCount}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-800/30 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-600">نسبة القبول الكلية</span>
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-800">{acceptanceRate}%</div>
                <p className="text-xs text-slate-500 mt-1 font-bold">معدل تحويل الزيارات الميدانية</p>
              </div>
            </div>

            {/* B. Employee Management & Administrative Authorization Control Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-300 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-black text-[#1E4A3A] flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-700" />
                    <span>إدارة الموظفين الميدانيين والتحكم الإداري للحسابات</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-bold">
                    متابعة حالة النشاط التلقائية للموظف، والتحكم الفوري بفك إيقاف أو حظر الحسابات والجزاءات
                  </p>
                </div>
                <button
                  onClick={() => setShowAddEmpModal(true)}
                  className="btn-brand text-sm min-h-[42px] px-4 py-2 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  <span>إضافة موظف جديد</span>
                </button>
              </div>

              {/* Enterprise Clean Employee Control Table */}
              <div className="table-scroll-container">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#1E4A3A] text-white text-xs font-black uppercase tracking-wider">
                      <th className="p-3.5 rounded-r-2xl">الموظف والبريد</th>
                      <th className="p-3.5 text-center">التوثيقات اليوم</th>
                      <th className="p-3.5 text-center">حالة النشاط الميداني</th>
                      <th className="p-3.5 text-center">حالة ترخيص الحساب</th>
                      <th className="p-3.5 rounded-l-2xl text-left">إجراءات التحكم الإداري</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {store.employees.map(emp => {
                      const empPlaces = store.places.filter(p => p.documenterName === emp.name);
                      const empCollected = empPlaces.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 text-sm font-bold transition-all">
                          {/* Column 1: Employee Name & Email */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#1E4A3A]/10 text-[#1E4A3A] font-black flex items-center justify-center text-sm border border-[#1E4A3A]/20">
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <span className="block font-black text-[#1E202A] text-base">{emp.name}</span>
                                <span className="text-xs text-slate-500 font-semibold dir-ltr block">{emp.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Today's Visits & Revenue */}
                          <td className="p-3.5 text-center">
                            <span className="text-amber-800 font-black text-base block">{emp.todayCount} زيارات</span>
                            <span className="text-[11px] text-slate-500 font-extrabold block">محصل: {empCollected} ج.م</span>
                          </td>

                          {/* Column 3: Read-Only Automatic Live Activity Status (Circular Color Dot) */}
                          <td className="p-3.5 text-center">
                            {emp.adminStatus === 'suspended' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-black">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                                <span>غير متصل (حظر)</span>
                              </span>
                            ) : emp.activityStatus === 'active' || emp.status === 'active' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black shadow-sm">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span>نشط في الميدان</span>
                              </span>
                            ) : emp.activityStatus === 'break' || emp.status === 'break' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <span>في استراحة</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-black">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                                <span>متوقف حالياً</span>
                              </span>
                            )}
                          </td>

                          {/* Column 4: Admin Account Status Badge (Read-Only Badge) */}
                          <td className="p-3.5 text-center">
                            {emp.adminStatus === 'suspended' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-xs font-black">
                                🛑 موقوف إدارياً
                              </span>
                            ) : emp.adminStatus === 'under_review' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black">
                                ⚠️ تحت المراجعة
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black">
                                🟢 مفعل ومصرح له
                              </span>
                            )}
                          </td>

                          {/* Column 5: Single Clean Enterprise Action Button */}
                          <td className="p-3.5 text-left">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => {
                                  triggerHaptic();
                                  setSelectedEmployeeDetail(emp);
                                }}
                                className="bg-[#1E4A3A] hover:bg-[#143529] text-white text-xs px-4 py-2 rounded-xl font-black shadow-md transition-all flex items-center gap-1.5 active:scale-95 border border-[#143529]"
                              >
                                <ShieldCheck className="w-4 h-4 text-amber-300" />
                                <span>الملف الشامل والإدارة</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* C. Live Filter & Detailed Places Audit Section */}
            <div className="bg-white p-5 rounded-3xl border border-slate-300 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-[#1E4A3A] flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    <span>سجل ومعاينة التوثيقات الميدانية (Place Audit & Review)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-bold">معاينة تفاصيل المنشآت الموثقة وإرسال طلبات التعديل والاعتماد للموثق</p>
                </div>

                {/* Filter Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminSearchQuery}
                      onChange={e => setAdminSearchQuery(e.target.value)}
                      placeholder="بحث بالمكان أو الموثق أو المدينة أو الحي..."
                      className="text-xs min-h-[38px] pr-9 pl-3 rounded-xl border-slate-300 w-56"
                    />
                  </div>

                  {/* Filter by City */}
                  <select
                    value={adminCityFilter}
                    onChange={e => setAdminCityFilter(e.target.value)}
                    className="text-xs min-h-[38px] font-bold rounded-xl border-slate-300 bg-white"
                  >
                    <option value="الكل">كل المدن</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="القاهرة">القاهرة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                  </select>

                  <select
                    value={adminFilterStatus}
                    onChange={e => setAdminFilterStatus(e.target.value)}
                    className="text-xs min-h-[38px] font-bold rounded-xl border-slate-300 bg-white"
                  >
                    <option value="الكل">كل الحالات</option>
                    <option value="accepted">المقبولة</option>
                    <option value="rejected">المرفوضة</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-2 rounded-xl border border-emerald-900 flex items-center gap-1.5 transition-all shadow-sm"
                    title="تصدير السجل الكامل بتنسيق CSV"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>تصدير السجل (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Filtered Places Table */}
              <div className="space-y-2.5">
                {store.places
                  .filter(p => {
                    const q = adminSearchQuery.trim().toLowerCase();
                    const matchesQ = !q || (
                      p.businessName.toLowerCase().includes(q) ||
                      (p.documenterName && p.documenterName.toLowerCase().includes(q)) ||
                      (p.city && p.city.toLowerCase().includes(q)) ||
                      (p.neighborhood && p.neighborhood.toLowerCase().includes(q)) ||
                      (p.address && p.address.toLowerCase().includes(q))
                    );
                    const matchesStatus = adminFilterStatus === 'الكل' || p.visitResult === adminFilterStatus;
                    const matchesCity = adminCityFilter === 'الكل' || p.city === adminCityFilter;
                    return matchesQ && matchesStatus && matchesCity;
                  })
                  .map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        triggerHaptic();
                        setSelectedPlaceAudit(p);
                        setAdminNoteText(p.adminRequest || p.notes || '');
                      }}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-300">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.exteriorPhoto || '/logo.png'} alt="مكان" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[#1E202A] text-base">{p.businessName}</h4>
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>الموثق: {p.documenterName}</span>
                            <span className="text-slate-300">•</span>
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-black">
                              🏙️ {p.city || 'الجيزة'} — {p.neighborhood || 'حدائق الأهرام'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>{new Date(p.createdAt || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                          {p.adminRequest && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                              ملاحظة الإدارة: {p.adminRequest}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-slate-800 hidden sm:inline">{p.totalAmount || 300} ج.م</span>
                        {p.visitResult === 'accepted' ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">قبول</span>
                        ) : (
                          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-300">رفض</span>
                        )}
                        <Eye className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* D. Heatmap Visual Representation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-md space-y-3">
              <h3 className="text-lg font-bold text-[#1E4A3A] flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>الخريطة الحرارية لأداء التوثيق الميداني خلال اليوم (Heatmap)</span>
              </h3>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
                {Array.from({ length: 24 }).map((_, i) => {
                  const intensity = (i >= 9 && i <= 17) ? 'bg-emerald-600 text-white' : (i >= 18 && i <= 21) ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-400';
                  return (
                    <div key={i} className={`p-2 rounded-lg text-center text-xs font-bold ${intensity}`}>
                      {i}:00
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 3: FIELD EMPLOYEE DASHBOARD (لوحة الموظف الميداني)     */}
        {/* ============================================================ */}
        {activeTab === 'emp-dash' && (
          <div className="space-y-6 animate-fade-in">
            {/* Daily Counter Banner */}
            <div className="bg-white p-5 rounded-3xl border-2 border-emerald-800/30 shadow-md text-center">
              <span className="text-sm font-bold text-slate-600 block mb-1">التقدم الميداني اليومي</span>
              <div className="text-2xl font-black text-[#1E4A3A] mb-2">
                أنت في النشاط رقم <span className="text-amber-600 text-3xl">{(store.currentUser?.todayCount || 0) + 1}</span> من أصل <span className="text-slate-800">{store.dailyTarget}</span> اليوم
              </div>
              <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden border border-slate-300">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-amber-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (((store.currentUser?.todayCount || 0) + 1) / store.dailyTarget) * 100)}%` }}
                />
              </div>
            </div>

            {/* SINGLE PROMINENT MAIN BUTTON IN CENTER */}
            <div className="py-6 text-center">
              <button
                onClick={startNewDocumentation}
                className="btn-primary-action text-2xl py-5 px-8 w-full max-w-lg mx-auto shadow-2xl flex items-center justify-center gap-3 border-2 border-amber-500 active:scale-95"
              >
                <Camera className="w-8 h-8 text-[#1E202A]" />
                <span>ابدأ توثيق نشاط جديد</span>
              </button>
            </div>

            {/* Quick Actions & Invoices button */}
            <div className="flex gap-3">
              <button
                onClick={() => { triggerHaptic(); setActiveTab('invoices'); }}
                className="flex-1 bg-[#1E4A3A] hover:bg-[#143529] text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 border border-[#143529] shadow-md"
              >
                <FileText className="w-5 h-5 text-amber-300" />
                <span>قائمة الفواتير والتحصيل ({unpaidInvoicesCount})</span>
              </button>
            </div>

            {/* Recent 5 Visits List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <h3 className="text-lg font-bold text-[#1E4A3A]">
                  أنشطة اليوم والتذكيرات الميدانية
                </h3>
                {/* Employee Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
                  <button
                    onClick={() => setEmpFilterStatus('الكل')}
                    className={`px-3 py-1 rounded-xl transition-all ${empFilterStatus === 'الكل' ? 'bg-[#1E4A3A] text-white shadow-sm' : 'bg-slate-100 text-slate-700'}`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setEmpFilterStatus('accepted')}
                    className={`px-3 py-1 rounded-xl transition-all ${empFilterStatus === 'accepted' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'}`}
                  >
                    🟢 المقبولة
                  </button>
                  <button
                    onClick={() => setEmpFilterStatus('rejected')}
                    className={`px-3 py-1 rounded-xl transition-all ${empFilterStatus === 'rejected' ? 'bg-rose-700 text-white shadow-sm' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}
                  >
                    🔴 المرفوضة
                  </button>
                  <button
                    onClick={() => setEmpFilterStatus('reminders')}
                    className={`px-3 py-1 rounded-xl transition-all ${empFilterStatus === 'reminders' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}
                  >
                    ⏰ التذكيرات
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {store.places
                  .filter(p => {
                    if (empFilterStatus === 'accepted') return p.visitResult === 'accepted';
                    if (empFilterStatus === 'rejected') return p.visitResult === 'rejected';
                    if (empFilterStatus === 'reminders') return !!p.reminderNote;
                    if (empFilterStatus === 'admin_notes') return !!p.adminRequest;
                    return true;
                  })
                  .slice(0, 6)
                  .map(p => {
                    const isOverdue = p.reminderDateTime && new Date(p.reminderDateTime).getTime() < Date.now();
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-right space-y-2 transition-all hover:bg-slate-100/80"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-[#1E202A] text-base">{p.businessName}</h4>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                              <span>🏙️ {p.city || 'الجيزة'} — {p.neighborhood || 'حدائق الأهرام'}</span>
                              <span className="mx-1">•</span>
                              <span>{new Date(p.createdAt || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                            </p>
                          </div>
                          {p.visitResult === 'accepted' ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black border border-emerald-300 shrink-0">🟢 قبول</span>
                          ) : (
                            <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-black border border-rose-300 shrink-0">🔴 رفض</span>
                          )}
                        </div>

                        {/* Admin Directive Badge */}
                        {p.adminRequest && (
                          <div className="p-2 bg-amber-50 rounded-xl border border-amber-300 text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <span>📩 ملاحظة وتوجيه الإدارة:</span>
                            <span className="font-extrabold">{p.adminRequest}</span>
                          </div>
                        )}

                        {/* Reminder Badge / Overdue Notice */}
                        {p.reminderNote && (
                          <div className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 ${
                            p.reminderCompleted
                              ? 'bg-slate-100 border-slate-300 text-slate-500 line-through'
                              : isOverdue
                              ? 'bg-rose-100 border-rose-400 text-rose-950 animate-pulse'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span>⏰ {p.reminderCompleted ? 'تم إنجاز التذكير:' : isOverdue ? '⚠️ تنبيه: الموعد المحدد قد مر!' : 'تذكير تجاري محدد:'}</span>
                              <span className="font-black">{p.reminderNote}</span>
                            </div>
                            <button
                              onClick={() => handleToggleReminderCompleted(p.id)}
                              className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all ${
                                p.reminderCompleted
                                  ? 'bg-slate-300 text-slate-800'
                                  : 'bg-[#1E4A3A] text-white hover:bg-[#143529]'
                              }`}
                            >
                              {p.reminderCompleted ? 'تم' : 'تعليم كـ منجز ✓'}
                            </button>
                          </div>
                        )}

                      {/* Action Buttons for Employee */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            triggerHaptic();
                            setShowEmployeePlaceModal(p);
                          }}
                          className="flex-1 bg-[#1E4A3A] hover:bg-[#143529] text-white text-xs font-bold py-2 rounded-xl border border-[#143529] flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>عرض تفاصيل وملاحظات المنشأة</span>
                        </button>
                        <button
                          onClick={() => {
                            triggerHaptic();
                            setShowAddReminderModal(p);
                            setReminderNoteInput(p.reminderNote || '');
                            setReminderDateTimeInput(p.reminderDateTime || '');
                          }}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold px-3 py-2 rounded-xl border border-amber-300 flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-800" />
                          <span>{p.reminderNote ? 'تعديل التذكير' : 'إضافة تذكير'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Report Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowTodayReport(true)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-[#1E202A] font-bold py-3.5 rounded-2xl border border-slate-400 text-lg flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5 text-[#1E4A3A]" />
                <span>عرض تقرير اليوم المفصل</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 4: STEP 1 - VISUAL IDENTITY (الهوية البصرية)             */}
        {/* ============================================================ */}
        {activeTab === 'step1-identity' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header step counter */}
            <div className="bg-[#1E4A3A] text-white p-3.5 rounded-2xl flex items-center justify-between font-bold">
              <span>خطوة 1 من 5: الهوية البصرية للنشاط</span>
              <span className="text-amber-300 text-sm">التقاط اللافتة</span>
            </div>

            {/* Camera Viewport Simulator (70% viewport style) */}
            <div className="relative w-full h-[55vh] bg-slate-950 rounded-3xl border-4 border-[#1E4A3A] overflow-hidden flex flex-col items-center justify-center text-white shadow-2xl">
              {draft.exteriorPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={draft.exteriorPhoto} alt="اللافتة" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Camera className="w-16 h-16 text-emerald-400 mx-auto opacity-80" />
                  <p className="text-lg font-bold text-slate-200">وجه الكاميرا نحو اللافتة الخارجية للنشاط التجاري</p>
                </div>
              )}

              {/* Framing Box Guide */}
              <div className="absolute inset-8 border-2 border-dashed border-amber-400/80 rounded-2xl pointer-events-none flex items-start justify-end p-3">
                <span className="bg-slate-900/80 text-amber-300 text-xs px-2 py-1 rounded font-bold">إطار اللافتة</span>
              </div>
            </div>

            {/* Capture Action Button */}
            <button
              onClick={() => {
                triggerHaptic();
                setDraft(prev => ({ ...prev, exteriorPhoto: '/logo.png' }));
              }}
              className="w-full btn-primary-action text-xl py-4 flex items-center justify-center gap-2"
            >
              <Camera className="w-6 h-6" />
              <span>{draft.exteriorPhoto ? 'إعادة التقاط الصورة' : 'التقاط الصورة الآن'}</span>
            </button>

            {/* Post Capture OCR Result Section */}
            {draft.exteriorPhoto && (
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-700/30 space-y-4">
                <h4 className="font-extrabold text-[#1E4A3A] text-lg">اسم النشاط استناداً للصورة (OCR):</h4>

                {!isEditingNameManually ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 text-[#1E4A3A] font-black text-xl text-center">
                      "{draft.businessName || ocrSuggestedName}"
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          triggerHaptic();
                          setDraft(prev => ({ ...prev, businessName: draft.businessName || ocrSuggestedName }));
                        }}
                        className="btn-accept w-full py-3"
                      >
                        اعتماد الاسم
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic();
                          setIsEditingNameManually(true);
                        }}
                        className="btn-reject w-full py-3"
                      >
                        تعديل يدوي
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={draft.businessName || ''}
                      onChange={e => setDraft(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="أدخل اسم النشاط التجاري يدوياً"
                      className="w-full text-xl font-bold"
                    />
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setIsEditingNameManually(false);
                      }}
                      className="btn-accept w-full py-3"
                    >
                      حفظ الاسم المعدل
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Next Button */}
            <div className="pt-2">
              <button
                disabled={!draft.exteriorPhoto || !draft.businessName}
                onClick={() => {
                  triggerHaptic();
                  setActiveTab('step2-geo');
                }}
                className={`w-full py-4 text-xl font-black rounded-2xl transition-all ${
                  draft.exteriorPhoto && draft.businessName
                    ? 'bg-[#1E4A3A] text-white shadow-lg border border-[#143529]'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                التالي (التقييم الجغرافي)
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 5: STEP 2 - GEOGRAPHIC & ENV ASSESSMENT                 */}
        {/* ============================================================ */}
        {activeTab === 'step2-geo' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header step counter */}
            <div className="bg-[#1E4A3A] text-white p-3.5 rounded-2xl flex items-center justify-between font-bold">
              <span>خطوة 2 من 5: التقييم الجغرافي والبيئي</span>
              <span className="text-amber-300 text-sm">الموقع والشارع</span>
            </div>

            {/* Interactive Simplified Map Box */}
            <div className="w-full h-52 bg-emerald-900/10 rounded-3xl border-2 border-[#1E4A3A] p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg animate-bounce mb-2">
                <MapPin className="w-7 h-7" />
              </div>
              <span className="font-extrabold text-[#1E4A3A] text-lg">الموقع الجغرافي للموظف الميداني</span>
              <p className="text-xs font-bold text-slate-600 mt-1">{draft.dms}</p>
              <p className="text-xs text-slate-500">{draft.address}</p>
            </div>

            {/* Capture Location Button */}
            <button
              onClick={() => {
                triggerHaptic();
                setDraft(prev => ({
                  ...prev,
                  dms: `N 30°03'${Math.floor(10 + Math.random() * 40)}.${Math.floor(10 + Math.random() * 89)}" E 31°14'${Math.floor(10 + Math.random() * 40)}"`,
                  city: 'الجيزة',
                  neighborhood: 'حدائق الأهرام',
                  address: 'الجيزة — حدائق الأهرام — الشارع الرئيسي'
                }));
              }}
              className="w-full btn-primary-action text-xl py-3.5 flex items-center justify-center gap-2"
            >
              <MapPin className="w-6 h-6" />
              <span>تسجيل الموقع الجغرافي والمنطقة تلقائياً (GPS)</span>
            </button>

            {/* Auto GPS Resolved City & Neighborhood Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 space-y-3 dir-rtl text-right">
              <h4 className="font-extrabold text-[#1E4A3A] text-base flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <span>البيانات الجغرافية (تُسجل تلقائياً عن طريق خدمة المواقع):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">المدينة (تسجيل تلقائي GPS)</label>
                  <input
                    type="text"
                    value={draft.city || ''}
                    onChange={e => setDraft(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="مثال: الجيزة"
                    className="w-full text-sm font-extrabold rounded-xl border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">الحي / المنطقة (تسجيل تلقائي GPS)</label>
                  <input
                    type="text"
                    value={draft.neighborhood || ''}
                    onChange={e => setDraft(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="مثال: حدائق الأهرام"
                    className="w-full text-sm font-extrabold rounded-xl border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Environmental Evaluation Questions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-5">
              <h4 className="font-extrabold text-[#1E4A3A] text-lg border-b border-slate-200 pb-2">
                التقييم البيئي والتجاري للشارع:
              </h4>

              {/* Question 1 Toggle */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-[#1E202A] text-lg">س1: الشارع نشط وتجاري؟</span>
                <div className="flex bg-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setDraft(prev => ({ ...prev, isActiveStreet: true })); }}
                    className={`px-5 py-2 rounded-lg font-black text-lg transition-all ${draft.isActiveStreet ? 'bg-[#1E4A3A] text-white shadow' : 'text-slate-700'}`}
                  >
                    نعم
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setDraft(prev => ({ ...prev, isActiveStreet: false })); }}
                    className={`px-5 py-2 rounded-lg font-black text-lg transition-all ${!draft.isActiveStreet ? 'bg-rose-700 text-white shadow' : 'text-slate-700'}`}
                  >
                    لا
                  </button>
                </div>
              </div>

              {/* Question 2 Toggle */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-[#1E202A] text-lg">س2: يوجد نشاط منافس بالمنطقة؟</span>
                <div className="flex bg-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setDraft(prev => ({ ...prev, hasCompetitor: true })); }}
                    className={`px-5 py-2 rounded-lg font-black text-lg transition-all ${draft.hasCompetitor ? 'bg-[#1E4A3A] text-white shadow' : 'text-slate-700'}`}
                  >
                    نعم
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setDraft(prev => ({ ...prev, hasCompetitor: false })); }}
                    className={`px-5 py-2 rounded-lg font-black text-lg transition-all ${!draft.hasCompetitor ? 'bg-rose-700 text-white shadow' : 'text-slate-700'}`}
                  >
                    لا
                  </button>
                </div>
              </div>

              {/* Optional Similar Stores Count */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">عدد المنشآت المماثلة في الشارع (اختياري)</label>
                <input
                  type="number"
                  value={draft.similarStoresCount || 0}
                  onChange={e => setDraft(prev => ({ ...prev, similarStoresCount: parseInt(e.target.value) || 0 }))}
                  className="w-full text-center text-xl font-bold"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('step1-identity')}
                className="btn-reject py-3.5 text-lg"
              >
                السابق
              </button>
              <button
                onClick={() => { triggerHaptic(); setActiveTab('step3-class'); }}
                className="btn-brand py-3.5 text-lg"
              >
                التالي (التصنيف)
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 6: STEP 3 - CLASSIFICATION & BASE DATA                  */}
        {/* ============================================================ */}
        {activeTab === 'step3-class' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header step counter */}
            <div className="bg-[#1E4A3A] text-white p-3.5 rounded-2xl flex items-center justify-between font-bold">
              <span>خطوة 3 من 5: التصنيف والبيانات الأساسية</span>
              <span className="text-amber-300 text-sm">تفاصيل النشاط</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-4">
              {/* Operating Status */}
              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1.5">حالة النشاط التجاري</label>
                <select
                  value={draft.operatingStatus}
                  onChange={e => setDraft(prev => ({ ...prev, operatingStatus: e.target.value as any }))}
                  className="w-full font-bold"
                >
                  <option value="مفتوح (يعمل حالياً)">مفتوح (يعمل حالياً)</option>
                  <option value="مغلق مؤقتاً">مغلق مؤقتاً</option>
                  <option value="مغلق نهائياً">مغلق نهائياً</option>
                </select>
              </div>

              {/* Main Category */}
              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1.5">التصنيف الرئيسي</label>
                <select
                  value={draft.mainCategory}
                  onChange={e => setDraft(prev => ({ ...prev, mainCategory: e.target.value }))}
                  className="w-full font-bold"
                >
                  <option value="مطاعم">مطاعم</option>
                  <option value="بقالة">بقالة</option>
                  <option value="صيدلية">صيدلية</option>
                  <option value="جيم">جيم / نادي رياضي</option>
                  <option value="عيادة">عيادة / مركز طبي</option>
                  <option value="محل هدايا">محل هدايا / إكسسوارات</option>
                  <option value="ورشة تصليح">ورشة تصليح / صيانة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              {/* Sub Category */}
              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1.5">التصنيف الفرعي</label>
                <select
                  value={draft.subCategory}
                  onChange={e => setDraft(prev => ({ ...prev, subCategory: e.target.value }))}
                  className="w-full font-bold"
                >
                  {draft.mainCategory === 'مطاعم' && (
                    <>
                      <option value="مأكولات سريعة">مأكولات سريعة</option>
                      <option value="حلويات ومخبوزات">حلويات ومخبوزات</option>
                      <option value="قهوة وكافيه">قهوة وكافيه</option>
                      <option value="مأكولات شعبية وعربية">مأكولات شعبية وعربية</option>
                    </>
                  )}
                  {draft.mainCategory === 'بقالة' && (
                    <>
                      <option value="سوبرماركت متكامل">سوبرماركت متكامل</option>
                      <option value="بقالة صغيرة">بقالة صغيرة</option>
                    </>
                  )}
                  {draft.mainCategory !== 'مطاعم' && draft.mainCategory !== 'بقالة' && (
                    <>
                      <option value="تخصص عام">تخصص عام</option>
                      <option value="خدمات تخصصية">خدمات تخصصية</option>
                    </>
                  )}
                </select>
              </div>

              {/* Customer Count Counter */}
              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1.5">عدد الزبائن الموجودين الآن</label>
                <div className="flex items-center justify-center gap-4 bg-slate-100 p-2 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setDraft(prev => ({ ...prev, currentCustomers: Math.max(0, (prev.currentCustomers || 0) - 1) })); }}
                    className="w-12 h-12 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-xl font-black text-2xl flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-3xl font-black text-[#1E4A3A] min-w-[50px] text-center">
                    {draft.currentCustomers || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(); setDraft(prev => ({ ...prev, currentCustomers: (prev.currentCustomers || 0) + 1 })); }}
                    className="w-12 h-12 bg-[#1E4A3A] hover:bg-[#143529] text-white rounded-xl font-black text-2xl flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Interior Photos */}
              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1.5">الصور الداخلية (اختياري)</label>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setDraft(prev => ({
                      ...prev,
                      interiorPhotos: [...(prev.interiorPhotos || []), '/logo.png']
                    }));
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-[#1E4A3A] font-bold py-3 rounded-xl border-2 border-dashed border-[#1E4A3A] flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>إضافة صورة داخلية جديدة</span>
                </button>

                {draft.interiorPhotos && draft.interiorPhotos.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {draft.interiorPhotos.map((photo, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt="داخلي" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            setDraft(prev => ({
                              ...prev,
                              interiorPhotos: prev.interiorPhotos?.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('step2-geo')}
                className="btn-reject py-3.5 text-lg"
              >
                السابق
              </button>
              <button
                onClick={() => { triggerHaptic(); setActiveTab('step4-sales'); }}
                className="btn-brand py-3.5 text-lg"
              >
                التالي (عرض الخدمات)
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 7: SALES PRESENTATION / OFFERS (عرض الخدمات)            */}
        {/* ============================================================ */}
        {activeTab === 'step4-sales' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header step counter */}
            <div className="bg-[#1E4A3A] text-white p-3.5 rounded-2xl flex items-center justify-between font-bold">
              <span>خطوة 4 من 5: عرض الخدمات على التاجر</span>
              <span className="text-amber-300 text-sm">مرحلة البيع</span>
            </div>

            {/* Top Place Banner */}
            <div className="bg-white p-4 rounded-2xl border border-slate-300 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.exteriorPhoto || '/logo.png'} alt="المنشأة" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#1E202A] text-lg">{draft.businessName}</h3>
                <p className="text-xs font-bold text-slate-500">{draft.mainCategory} — {draft.subCategory}</p>
              </div>
            </div>

            {/* Service Offer Card */}
            {AVAILABLE_SERVICES[currentOfferIndex] && (
              <div className="bg-white p-6 rounded-3xl border-2 border-amber-500/40 shadow-xl space-y-4 text-center relative overflow-hidden">
                <div className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full inline-block">
                  عرض مميز للتاجر
                </div>

                <h3 className="text-2xl font-black text-[#1E4A3A]">
                  {AVAILABLE_SERVICES[currentOfferIndex].title}
                </h3>
                <p className="text-base font-bold text-slate-700 leading-relaxed">
                  {AVAILABLE_SERVICES[currentOfferIndex].description}
                </p>
                <div className="text-3xl font-black text-emerald-800">
                  {AVAILABLE_SERVICES[currentOfferIndex].price} جنيه مصري
                </div>

                {/* Offer Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setDraft(prev => ({
                        ...prev,
                        acceptedServices: [AVAILABLE_SERVICES[currentOfferIndex].title]
                      }));
                      setActiveTab('step5-acceptance');
                    }}
                    className="btn-accept text-xl py-3.5"
                  >
                    قبول هذه الخدمة
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic();
                      if (currentOfferIndex < AVAILABLE_SERVICES.length - 1) {
                        setCurrentOfferIndex(currentOfferIndex + 1);
                      } else {
                        setActiveTab('step5-rejection');
                      }
                    }}
                    className="btn-reject text-xl py-3.5"
                  >
                    تخطي العرض
                  </button>
                </div>

                {/* Counter */}
                <div className="text-xs font-bold text-slate-500 pt-2">
                  الخدمة {currentOfferIndex + 1} من أصل {AVAILABLE_SERVICES.length}
                </div>
              </div>
            )}

            {/* If all offers reviewed */}
            <button
              onClick={() => { triggerHaptic(); setActiveTab('step5-rejection'); }}
              className="w-full bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold py-3.5 rounded-2xl border border-rose-300 text-base"
            >
              لم يقبل التاجر أي خدمة (تسجيل الرفض)
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 8: ACCEPTANCE REGISTRATION (تسجيل قبول الخدمة)           */}
        {/* ============================================================ */}
        {activeTab === 'step5-acceptance' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-emerald-800 text-white p-4 rounded-2xl text-center font-bold text-xl shadow-lg">
              🎉 تم قبول الخدمة بنجاح — إتمام بيانات العقد
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-4">
              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1">اسم المسؤول / التاجر</label>
                <input
                  type="text"
                  required
                  value={draft.merchantName || ''}
                  onChange={e => setDraft(prev => ({ ...prev, merchantName: e.target.value }))}
                  placeholder="أدخل اسم صاحب النشاط أو المسؤول"
                  className="w-full text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1">رقم الجوال للتواصل</label>
                <input
                  type="tel"
                  required
                  value={draft.phone || ''}
                  onChange={e => setDraft(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="01xxxxxxxxxx"
                  className="w-full text-lg font-bold text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={draft.notes || ''}
                  onChange={e => setDraft(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي اتفاقات خاصة أو مواعيد متابعة"
                  className="w-full min-h-[90px] font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleCompleteAcceptance}
              className="w-full btn-brand text-2xl py-4 bg-[#1E4A3A] shadow-xl"
            >
              إتمام العقد وحفظ البيانات
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 9: REJECTION REGISTRATION (تسجيل رفض الخدمات)           */}
        {/* ============================================================ */}
        {activeTab === 'step5-rejection' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-slate-800 text-white p-4 rounded-2xl text-center font-bold text-xl shadow-lg">
              تسجيل أسباب الرفض وإنهاء الزيارة الميدانية
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-5">
              {/* Question 1 */}
              <div>
                <span className="block font-bold text-[#1E202A] text-lg mb-2">س1: هل التقيت بالمسؤول الأساسي للنشاط؟</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setDraft(prev => ({
                        ...prev,
                        rejectionDetails: { ...prev.rejectionDetails!, metOwner: true }
                      }));
                    }}
                    className={`py-3 rounded-xl font-black text-lg transition-all ${
                      draft.rejectionDetails?.metOwner ? 'bg-[#1E4A3A] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    نعم
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setDraft(prev => ({
                        ...prev,
                        rejectionDetails: { ...prev.rejectionDetails!, metOwner: false }
                      }));
                    }}
                    className={`py-3 rounded-xl font-black text-lg transition-all ${
                      !draft.rejectionDetails?.metOwner ? 'bg-[#1E4A3A] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    لا
                  </button>
                </div>
              </div>

              {/* Question 2 */}
              <div>
                <span className="block font-bold text-[#1E202A] text-lg mb-2">س2: ما هي ردة فعل المسؤول؟</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setDraft(prev => ({
                        ...prev,
                        rejectionDetails: { ...prev.rejectionDetails!, ownerReaction: 'استمع لي واهتم' }
                      }));
                    }}
                    className={`py-3 rounded-xl font-black text-base transition-all ${
                      draft.rejectionDetails?.ownerReaction === 'استمع لي واهتم' ? 'bg-[#1E4A3A] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    استمع لي واهتم
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setDraft(prev => ({
                        ...prev,
                        rejectionDetails: { ...prev.rejectionDetails!, ownerReaction: 'رفض الإنصات نهائياً' }
                      }));
                    }}
                    className={`py-3 rounded-xl font-black text-base transition-all ${
                      draft.rejectionDetails?.ownerReaction === 'رفض الإنصات نهائياً' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    رفض الإنصات نهائياً
                  </button>
                </div>
              </div>

              {/* Question 3 */}
              <div>
                <span className="block font-bold text-[#1E202A] text-lg mb-2">س3: عدد الزبائن داخل النشاط أثناء المقابلة؟</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setDraft(prev => ({
                        ...prev,
                        rejectionDetails: { ...prev.rejectionDetails!, customerVolume: 'يوجد زبائن كثر' }
                      }));
                    }}
                    className={`py-3 rounded-xl font-black text-base transition-all ${
                      draft.rejectionDetails?.customerVolume === 'يوجد زبائن كثر' ? 'bg-[#1E4A3A] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    يوجد زبائن كثر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic();
                      setDraft(prev => ({
                        ...prev,
                        rejectionDetails: { ...prev.rejectionDetails!, customerVolume: 'المحل شبه فارغ' }
                      }));
                    }}
                    className={`py-3 rounded-xl font-black text-base transition-all ${
                      draft.rejectionDetails?.customerVolume === 'المحل شبه فارغ' ? 'bg-[#1E4A3A] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    المحل شبه فارغ
                  </button>
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block text-base font-bold text-[#1E202A] mb-1">ملاحظات إضافية حول الرفض (اختياري)</label>
                <textarea
                  value={draft.rejectionDetails?.notes || ''}
                  onChange={e => setDraft(prev => ({
                    ...prev,
                    rejectionDetails: { ...prev.rejectionDetails!, notes: e.target.value }
                  }))}
                  placeholder="سبب الرفض المباشر أو انشغال التاجر"
                  className="w-full min-h-[80px] font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleCompleteRejection}
              className="w-full btn-reject text-2xl py-4 bg-[#6B6B6B] shadow-xl"
            >
              تسجيل الرفض وإنهاء الزيارة
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 10: INVOICES & FINANCIAL COLLECTIONS (الفواتير والتحصيل)  */}
        {/* ============================================================ */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-700/40 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-600 block">إجمالي المبلغ المحصل اليوم</span>
                  <div className="text-3xl font-black text-emerald-800">{totalCollectedToday} ج.م</div>
                </div>
                <DollarSign className="w-10 h-10 text-emerald-600" />
              </div>

              <div className="bg-white p-5 rounded-2xl border-2 border-amber-600/40 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-600 block">عدد الفواتير غير المدفوعة / المتبقية</span>
                  <div className="text-3xl font-black text-amber-700">{unpaidInvoicesCount} فاتورة</div>
                </div>
                <FileText className="w-10 h-10 text-amber-600" />
              </div>
            </div>

            {/* Invoiced Places Cards */}
            <div className="bg-white p-5 rounded-3xl border border-slate-300 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-xl font-bold text-[#1E4A3A] flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  <span>قائمة الأماكن المفوترة وعمليات التحصيل</span>
                </h3>
                <button
                  onClick={() => alert(`تقرير مالي مفصل:\n• إجمالي المحصل: ${totalCollectedToday} ج.م\n• فواتير متبقية: ${unpaidInvoicesCount}`)}
                  className="btn-brand text-sm py-2 px-3 min-h-[38px]"
                >
                  تقرير مالي PDF
                </button>
              </div>

              <div className="space-y-3">
                {store.places.filter(p => p.visitResult === 'accepted').map(p => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-300 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <h4 className="font-black text-[#1E202A] text-lg">{p.businessName}</h4>
                        <p className="text-xs font-bold text-slate-600">
                          الموثق: {p.documenterName} — الفاتورة: INV-{(p.id || '').slice(-6).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right sm:text-left">
                        <span className="text-xs font-bold text-slate-500 block">قيمة الفاتورة</span>
                        <span className="text-xl font-black text-emerald-800">{p.totalAmount || 300} ج.م</span>
                      </div>
                    </div>

                    {/* Status & Amounts */}
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-slate-700">
                        المدفوع: <strong className="text-emerald-800">{p.paidAmount || 0} ج.م</strong> | المتبقي: <strong className="text-amber-700">{p.remainingAmount || 0} ج.م</strong>
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.paymentStatus === 'مدفوعة بالكامل' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {p.paymentStatus || 'مدفوعة'}
                      </span>
                    </div>

                    {/* Actions per card */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => {
                          triggerHaptic();
                          setShowPaymentPlace(p);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>تسجيل دفعة</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsApp(p)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <Send className="w-4 h-4" />
                        <span>واتساب</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic();
                          setShowInvoicePlace(p);
                        }}
                        className="bg-[#1E4A3A] hover:bg-[#143529] text-white font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>الفاتورة والختم</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => setActiveTab(store.currentUser?.role === 'admin' ? 'admin-dash' : 'emp-dash')}
              className="w-full btn-reject py-3.5 text-lg"
            >
              العودة للوحة التحكم
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PAGE 11: TRANSITION SCREEN (بين الزيارات)                   */}
        {/* ============================================================ */}
        {activeTab === 'transition' && (
          <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 animate-fade-in text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 border-4 border-emerald-500 flex items-center justify-center mx-auto shadow-xl animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-700/40 shadow-xl max-w-md w-full space-y-3">
              <h2 className="text-2xl font-black text-[#1E4A3A]">تم إنهاء الزيارة وتسجيلها بنجاح!</h2>
              {store.lastCompletedVisit && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right space-y-1 font-bold">
                  <p className="text-lg text-[#1E202A]">{store.lastCompletedVisit.businessName}</p>
                  <p className="text-xs text-slate-500">
                    النتيجة: {store.lastCompletedVisit.visitResult === 'accepted' ? 'قبول الخدمة' : 'رفض العرض'} — {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              <div className="text-xl font-bold text-amber-700">
                أنجزت {store.currentUser?.todayCount} زيارة من أصل {store.dailyTarget} اليوم
              </div>
            </div>

            <button
              onClick={startNewDocumentation}
              className="btn-primary-action text-2xl py-4 px-8 w-full max-w-md shadow-2xl"
            >
              انتقل إلى النشاط التالي
            </button>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL 1: OFFICIAL CANVAS INVOICE PREVIEW WITH STAMP          */}
      {/* ============================================================ */}
      {showInvoicePlace && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xl font-extrabold text-[#1E4A3A]">
                معاينة الفاتورة الرسمية بختم المؤسسة المعتمد
              </h3>
              <button
                onClick={() => setShowInvoicePlace(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Canvas Rendered Image */}
            <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-slate-100 flex justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generateInvoiceImageDataUrl(showInvoicePlace)}
                alt="فاتورة رسمية"
                className="max-w-full height-auto rounded-lg shadow-md"
              />
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => handleSendWhatsApp(showInvoicePlace)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-base"
              >
                <Send className="w-5 h-5" />
                <span>إرسال عبر واتساب</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-[#1E4A3A] hover:bg-[#143529] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-base"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة الفاتورة</span>
              </button>
              <button
                onClick={() => setShowInvoicePlace(null)}
                className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-3 px-4 rounded-xl col-span-2 sm:col-span-1 text-base"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADD PAYMENT MODAL                                   */}
      {/* ============================================================ */}
      {showPaymentPlace && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right dir-rtl">
            <h3 className="text-xl font-extrabold text-[#1E4A3A]">
              تسجيل دفعة مالية — {showPaymentPlace.businessName}
            </h3>
            <p className="text-sm font-bold text-slate-600">
              المبلغ المتبقي المستحق: <strong className="text-amber-700">{showPaymentPlace.remainingAmount} ج.م</strong>
            </p>

            <div>
              <label className="block text-sm font-bold text-[#1E202A] mb-1">المبلغ المحصل الآن (ج.م)</label>
              <input
                type="number"
                value={paymentAmountInput}
                onChange={e => setPaymentAmountInput(e.target.value)}
                placeholder="أدخل قيمة الدفعة"
                className="w-full text-xl font-bold text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRecordPayment(showPaymentPlace)}
                className="btn-brand py-3 text-lg"
              >
                تأكيد الدفع
              </button>
              <button
                onClick={() => setShowPaymentPlace(null)}
                className="btn-reject py-3 text-lg"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ADD EMPLOYEE MODAL (ADMIN)                          */}
      {/* ============================================================ */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateEmployee} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right dir-rtl">
            <h3 className="text-xl font-extrabold text-[#1E4A3A]">إضافة موظف ميداني جديد</h3>

            <div>
              <label className="block text-sm font-bold text-[#1E202A] mb-1">اسم الموظف</label>
              <input
                type="text"
                required
                value={newEmpName}
                onChange={e => setNewEmpName(e.target.value)}
                placeholder="مثال: خالد محمود"
                className="w-full font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1E202A] mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={newEmpEmail}
                onChange={e => setNewEmpEmail(e.target.value)}
                placeholder="khaled@daleelak.com"
                className="w-full font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1E202A] mb-1">كلمة المرور المؤقتة</label>
              <input
                type="password"
                required
                value={newEmpPass}
                onChange={e => setNewEmpPass(e.target.value)}
                placeholder="******"
                className="w-full font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="submit" className="btn-brand py-3 text-lg">
                إنشاء حساب
              </button>
              <button type="button" onClick={() => setShowAddEmpModal(false)} className="btn-reject py-3 text-lg">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: TODAY REPORT MODAL                                  */}
      {/* ============================================================ */}
      {showTodayReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right dir-rtl max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-[#1E4A3A] border-b border-slate-200 pb-2">
              ملخص زيارات اليوم — {store.currentUser?.name}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-slate-600 block">إجمالي المقبولة</span>
                <span className="text-2xl font-black text-emerald-800">{acceptedCount}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-xs font-bold text-slate-600 block">إجمالي المرفوضة</span>
                <span className="text-2xl font-black text-rose-800">{todayVerifiedCount - acceptedCount}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {store.places.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#1E202A]">{p.businessName}</h4>
                    <span className="text-xs text-slate-500">{new Date(p.createdAt || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.visitResult === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {p.visitResult === 'accepted' ? 'قبول' : 'رفض'}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowTodayReport(false)} className="w-full btn-reject py-3 text-lg mt-3">
              إغلاق التقرير
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: EMPLOYEE DEEP DIVE & ADMIN CONTROL DOSSIER          */}
      {/* ============================================================ */}
      {selectedEmployeeDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-right dir-rtl max-h-[88vh] overflow-y-auto border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xl font-black text-[#1E4A3A]">
                  الملف الإداري للموظف: {selectedEmployeeDetail.name}
                </h3>
                <p className="text-xs text-slate-500 font-extrabold">{selectedEmployeeDetail.email}</p>
              </div>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-xs text-slate-600 font-bold block">التوثيقات اليوم</span>
                <span className="text-2xl font-black text-[#1E4A3A]">{selectedEmployeeDetail.todayCount}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-xs text-slate-600 font-bold block">إجمالي التحصيل</span>
                <span className="text-2xl font-black text-amber-800">
                  {store.places.filter(p => p.documenterName === selectedEmployeeDetail.name).reduce((acc, p) => acc + (p.paidAmount || 0), 0)} ج.م
                </span>
              </div>
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-300">
                <span className="text-xs text-slate-600 font-bold block">النشاط التلقائي</span>
                <span className="text-sm font-black text-emerald-800">
                  {selectedEmployeeDetail.activityStatus === 'active' ? '🟢 نشط' : selectedEmployeeDetail.activityStatus === 'break' ? '🟡 استراحة' : '⚪ غير متصل'}
                </span>
              </div>
            </div>

            {/* Administrative Account Control Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-sm text-[#1E4A3A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>التحكم الإداري وصلاحيات الوصول للمنظومة</span>
              </h4>

              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-300">
                <span className="text-xs font-black text-slate-700">حالة الترخيص والدخول:</span>
                <select
                  value={selectedEmployeeDetail.adminStatus || 'authorized'}
                  onChange={e => {
                    const nextSt = e.target.value as any;
                    handleToggleAdminStatus(selectedEmployeeDetail.id, nextSt);
                    setSelectedEmployeeDetail(prev => prev ? ({ ...prev, adminStatus: nextSt }) : null);
                  }}
                  className={`text-xs font-black py-1.5 px-3 rounded-xl border ${
                    selectedEmployeeDetail.adminStatus === 'suspended'
                      ? 'bg-rose-100 text-rose-900 border-rose-400'
                      : selectedEmployeeDetail.adminStatus === 'under_review'
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}
                >
                  <option value="authorized">🟢 مفعل ومصرح له بالتوثيق</option>
                  <option value="under_review">⚠️ تحت المراجعة والإنذار</option>
                  <option value="suspended">🛑 موقوف إدارياً (حظر الدخول)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    triggerHaptic();
                    setShowWarningModalUser(selectedEmployeeDetail);
                  }}
                  className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-2 px-3 rounded-xl text-xs border border-amber-300"
                >
                  ⚠️ إضافة إنذار إداري جديد
                </button>
                <button
                  onClick={() => alert(`تم إرسال رابط إعادة ضبط كلمة المرور إلى البريد: ${selectedEmployeeDetail.email}`)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-3 rounded-xl text-xs border border-slate-400"
                >
                  🔑 إعادة ضبط كلمة المرور
                </button>
              </div>
            </div>

            {/* Warnings History if any */}
            {(selectedEmployeeDetail.warnings || []).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-amber-900">سجل الإنذارات والمخالفات الإدارية المسجلة:</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedEmployeeDetail.warnings?.map(w => (
                    <div key={w.id} className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                      <div className="flex justify-between text-amber-950 font-bold">
                        <span>{w.reason}</span>
                        <span className="text-[10px] text-slate-500">{w.date}</span>
                      </div>
                      <span className="text-[10px] text-amber-700 block mt-0.5">صادر بواسطة: {w.issuedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Places Documented by this Employee */}
            <div className="space-y-2 pt-1">
              <h4 className="font-extrabold text-sm text-[#1E4A3A]">سجل المنشآت المسجلة بواسطة الموظف اليوم:</h4>
              {store.places.filter(p => p.documenterName === selectedEmployeeDetail.name).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3 bg-slate-50 rounded-xl border border-slate-200">لم يتم تسجيل منشآت لهذا الموظف بعد اليوم.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {store.places.filter(p => p.documenterName === selectedEmployeeDetail.name).map(p => (
                    <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
                      <div>
                        <span className="block text-[#1E202A]">{p.businessName}</span>
                        <span className="text-[10px] text-slate-500">تحصيل: {p.paidAmount || 0} ج.م</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full ${p.visitResult === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {p.visitResult === 'accepted' ? 'قبول' : 'رفض'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setSelectedEmployeeDetail(null)} className="w-full btn-reject py-3 text-base mt-2">
              إغلاق الملف الإداري
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: PLACE AUDIT & REVIEW MODAL (مقبولة / مرفوضة)        */}
      {/* ============================================================ */}
      {selectedPlaceAudit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-right dir-rtl max-h-[90vh] overflow-y-auto border border-slate-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[#1E4A3A]">
                    تدقيق وتعليمات الإدارة: {selectedPlaceAudit.businessName}
                  </h3>
                  {selectedPlaceAudit.visitResult === 'accepted' ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black border border-emerald-300">
                      🟢 توثيق مقبول (تعاقد)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-black border border-rose-300">
                      🔴 توثيق مرفوض (عدم تعاقد)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-extrabold mt-1">
                  الموثق المسؤول: {selectedPlaceAudit.documenterName} — {new Date(selectedPlaceAudit.createdAt || Date.now()).toLocaleString('ar-EG')}
                </p>
              </div>
              <button onClick={() => setSelectedPlaceAudit(null)} className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: BASE DATA (البيانات الأساسية العامة - تظهر في كِلا الحالتين) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="font-extrabold text-xs text-[#1E4A3A] border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>البيانات والمحددات الأساسية للنشاط الميداني:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                <div><span className="text-slate-500">التصنيف الرئيسي والفرعي:</span> {selectedPlaceAudit.mainCategory || 'مطاعم'} ({selectedPlaceAudit.subCategory || 'عام'})</div>
                <div><span className="text-slate-500">حالة التشغيل:</span> {selectedPlaceAudit.operatingStatus || 'مفتوح (يعمل حالياً)'}</div>
                <div><span className="text-slate-500">الشارع وحركة المرور:</span> {selectedPlaceAudit.isActiveStreet ? 'شارع تجاري نشط' : 'شارع فرعي'}</div>
                <div><span className="text-slate-500">عدد الزبائن عند التوثيق:</span> {selectedPlaceAudit.currentCustomers || 3} زبائن</div>
                <div className="sm:col-span-2"><span className="text-slate-500">العنوان والإحداثيات:</span> {selectedPlaceAudit.dms} ({selectedPlaceAudit.address})</div>
              </div>
            </div>

            {/* SECTION 2: CONDITION SPECIFIC DATA (بيانات الحالتين) */}
            {selectedPlaceAudit.visitResult === 'accepted' ? (
              /* ACCEPTED CASE: CONTRACT & FINANCIAL DETAILS */
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
                <h4 className="font-black text-xs text-emerald-900 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <span>بيانات التعاقد والخدمات المتفق عليها والتحصيل المالي:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-extrabold text-slate-900">
                  <div><span className="text-slate-600">اسم صاحب النشاط/التاجر:</span> {selectedPlaceAudit.merchantName || 'م. أحمد محمود'}</div>
                  <div><span className="text-slate-600">رقم الهاتف والتواصل:</span> {selectedPlaceAudit.phone || '01099887766'}</div>
                  <div><span className="text-slate-600">المبلغ المدفوع (محصل):</span> <strong className="text-emerald-800 text-sm">{selectedPlaceAudit.paidAmount || 300} ج.م</strong></div>
                  <div><span className="text-slate-600">المبلغ المتبقي المستحق:</span> <strong className="text-amber-800 text-sm">{selectedPlaceAudit.remainingAmount || 0} ج.م</strong></div>
                  <div className="sm:col-span-2"><span className="text-slate-600">حالة الدفع:</span> <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">{selectedPlaceAudit.paymentStatus || 'مدفوعة بالكامل'}</span></div>
                </div>

                {/* Accepted Services */}
                {(selectedPlaceAudit.acceptedServices || []).length > 0 && (
                  <div className="pt-1">
                    <span className="text-xs font-bold text-slate-600 block mb-1">الخدمات الرقمية المطلوبة:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlaceAudit.acceptedServices?.map((srv, idx) => (
                        <span key={idx} className="bg-white border border-emerald-300 text-emerald-950 px-2.5 py-1 rounded-lg text-xs font-bold">
                          ✓ {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* REJECTED CASE: REJECTION SURVEY & QUESTIONNAIRE DETAILS */
              <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 space-y-3">
                <h4 className="font-black text-xs text-rose-950 border-b border-rose-200 pb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                  <span>سجل استبيان الرفض الميداني (إجابات الموثق):</span>
                </h4>

                <div className="space-y-2 text-xs font-extrabold text-slate-900">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200">
                    <span className="text-slate-700">1. هل تم التواصل المباشر مع صاحب المنشأة؟</span>
                    <span className={`px-2.5 py-0.5 rounded-md font-black ${selectedPlaceAudit.rejectionDetails?.metOwner !== false ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                      {selectedPlaceAudit.rejectionDetails?.metOwner !== false ? 'نعم، تم التواصل مع المسؤول' : 'لا، تم التواصل مع عامل'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200">
                    <span className="text-slate-700">2. ردة فعل المسؤول عند عرض الخدمة:</span>
                    <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md font-black">
                      {selectedPlaceAudit.rejectionDetails?.ownerReaction || 'استمع لي واهتم لكن اعتذر عن الخدمة'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200">
                    <span className="text-slate-700">3. حركـة وحجم الزبائن وقت الزيارة:</span>
                    <span className="bg-slate-100 text-slate-900 px-2.5 py-0.5 rounded-md font-black">
                      {selectedPlaceAudit.rejectionDetails?.customerVolume || 'يوجد زبائن كثر وقت الزيارة'}
                    </span>
                  </div>

                  {/* Direct Rejection Notes */}
                  <div className="bg-white p-2.5 rounded-xl border border-rose-200 space-y-1">
                    <span className="text-slate-700 block font-black">4. ملاحظة وتفسير الموثق الميداني لسبب الرفض:</span>
                    <p className="text-rose-950 font-bold bg-rose-50/50 p-2 rounded-lg border border-rose-100 text-xs">
                      {selectedPlaceAudit.rejectionDetails?.notes || selectedPlaceAudit.notes || 'النشاط غير مهتم بإضافة الموقع على الخرائط الرسمية حالياً ويكتفي بالعملاء المحليين.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: ADMIN DIRECTIVES & MODIFICATION REQUEST FORM */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <label className="block text-xs font-black text-[#1E4A3A]">
                إرسال ملاحظة / طلب تعديل سحابي للموظف الميداني:
              </label>
              <textarea
                value={adminNoteText}
                onChange={e => setAdminNoteText(e.target.value)}
                placeholder="أدخل توجيهات الإدارة للموظف (مثال: يرجى إعادة التقاط صورة اللافتة بوضوح أعلى)"
                className="w-full min-h-[80px] text-xs font-bold rounded-xl"
              />
              <button
                onClick={() => handleSaveAdminPlaceNote(selectedPlaceAudit.id, adminNoteText)}
                className="w-full btn-brand py-2.5 text-sm"
              >
                حفظ وإرسال التوجيه للموظف
              </button>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {selectedPlaceAudit.visitResult === 'accepted' ? (
                <button
                  onClick={() => {
                    setShowInvoicePlace(selectedPlaceAudit);
                    setSelectedPlaceAudit(null);
                  }}
                  className="bg-[#1E4A3A] hover:bg-[#143529] text-white font-black py-3 rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-amber-300" />
                  <span>معاينة الفاتورة والختم الرسمي</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold text-center flex items-center justify-center">
                  لا توجد فاتورة للزيارات المرفوضة
                </div>
              )}
              <button
                onClick={() => setSelectedPlaceAudit(null)}
                className="btn-reject py-3 text-sm"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 7: ISSUE ADMINISTRATIVE WARNING MODAL                  */}
      {/* ============================================================ */}
      {showWarningModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xl font-extrabold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <span>إصدار إنذار إداري — {showWarningModalUser.name}</span>
              </h3>
              <button onClick={() => setShowWarningModalUser(null)} className="p-1 rounded-xl bg-slate-100 text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-600">
              سيتم تسجيل الإنذار الإداري رسمياً في الملف الوظيفي وتحويل حالة الحساب إلى "تحت المراجعة والإنذار".
            </p>

            <div>
              <label className="block text-sm font-bold text-[#1E202A] mb-1">سبب الإنذار / المخالفة الميدانية</label>
              <textarea
                value={warningReasonInput}
                onChange={e => setWarningReasonInput(e.target.value)}
                placeholder="أدخل سبب الإنذار الإداري والتنبيه المطلوب"
                className="w-full min-h-[90px] text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleIssueWarning(showWarningModalUser.id, warningReasonInput)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-base"
              >
                تأكيد الإنذار
              </button>
              <button
                onClick={() => setShowWarningModalUser(null)}
                className="btn-reject py-3 text-base"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 8: NOTIFICATIONS BELL HUB & ADMIN DIRECTIVES           */}
      {/* ============================================================ */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right max-h-[85vh] overflow-y-auto border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-black text-[#1E4A3A]">
                  جرس التنبيهات والتوجيهات الإدارية
                </h3>
              </div>
              <button onClick={() => setShowNotificationsModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {(store.notifications || []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">لا توجد تنبيهات أو توجيهات جديدة حالياً.</p>
              ) : (
                (store.notifications || []).map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkNotificationRead(n.id)}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all cursor-pointer ${
                      n.read
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black">
                      <span className="text-sm">{n.title}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{n.createdAt}</span>
                    </div>
                    <p className="font-bold leading-relaxed">{n.message}</p>
                    {!n.read && (
                      <span className="inline-block mt-1 text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
                        غير مقروء
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                triggerHaptic();
                setStore(prev => ({
                  ...prev,
                  notifications: (prev.notifications || []).map(n => ({ ...n, read: true }))
                }));
                setShowNotificationsModal(false);
              }}
              className="w-full bg-[#1E4A3A] hover:bg-[#143529] text-white font-black py-3 rounded-xl text-sm"
            >
              تحديد الكل كـ مقروء وإغلاق
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 9: EMPLOYEE PLACE INSPECTION MODAL (تفاصيل وملاحظات)   */}
      {/* ============================================================ */}
      {showEmployeePlaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-right max-h-[88vh] overflow-y-auto border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xl font-black text-[#1E4A3A]">
                  تفاصيل وملاحظات: {showEmployeePlaceModal.businessName}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  تاريخ التوثيق: {new Date(showEmployeePlaceModal.createdAt || Date.now()).toLocaleString('ar-EG')}
                </p>
              </div>
              <button onClick={() => setShowEmployeePlaceModal(null)} className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Base Details Card */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-bold space-y-2">
              <div><span className="text-slate-500">🏙️ المدينة والحي:</span> <strong className="text-[#1E4A3A]">{showEmployeePlaceModal.city || 'الجيزة'} — {showEmployeePlaceModal.neighborhood || 'حدائق الأهرام'}</strong></div>
              <div><span className="text-slate-500">التصنيف:</span> {showEmployeePlaceModal.mainCategory} ({showEmployeePlaceModal.subCategory})</div>
              <div><span className="text-slate-500">العنوان الإحداثي:</span> {showEmployeePlaceModal.dms}</div>

              {/* GPS Navigation & Quick Contact Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-200">
                <button
                  onClick={() => {
                    const lat = showEmployeePlaceModal.latitude || 30.0444;
                    const lng = showEmployeePlaceModal.longitude || 31.2357;
                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                  }}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>فتح الموقع في الخريطة والملاحة (GPS)</span>
                </button>
                {showEmployeePlaceModal.phone && (
                  <button
                    onClick={() => handleSendWhatsApp(showEmployeePlaceModal)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مراسلة واتساب</span>
                  </button>
                )}
              </div>
            </div>

            {/* Admin Directive if present */}
            {showEmployeePlaceModal.adminRequest && (
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300 text-xs font-bold text-amber-950 space-y-1">
                <span className="block font-black text-amber-900 text-sm">📩 توجيه وملاحظة الإدارة الخاصة بهذا النشاط:</span>
                <p className="bg-white p-2.5 rounded-xl border border-amber-200 text-amber-950 font-bold">{showEmployeePlaceModal.adminRequest}</p>
              </div>
            )}

            {/* Custom Scheduled Reminder if present */}
            {showEmployeePlaceModal.reminderNote && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold space-y-1 ${
                showEmployeePlaceModal.reminderDateTime && new Date(showEmployeePlaceModal.reminderDateTime).getTime() < Date.now()
                  ? 'bg-rose-100 border-rose-400 text-rose-950 animate-pulse'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between font-black text-sm">
                  <span>⏰ التذكير التجاري الخاص بالموظف:</span>
                  {showEmployeePlaceModal.reminderDateTime && new Date(showEmployeePlaceModal.reminderDateTime).getTime() < Date.now() && (
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      ⚠️ الموعد المحدد قد مر!
                    </span>
                  )}
                </div>
                <p className="font-extrabold text-sm">{showEmployeePlaceModal.reminderNote}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  triggerHaptic();
                  setShowAddReminderModal(showEmployeePlaceModal);
                  setReminderNoteInput(showEmployeePlaceModal.reminderNote || '');
                  setReminderDateTimeInput(showEmployeePlaceModal.reminderDateTime || '');
                  setShowEmployeePlaceModal(null);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-slate-950" />
                <span>إضافة / تعديل تذكير للمنشأة</span>
              </button>

              <button
                onClick={() => setShowEmployeePlaceModal(null)}
                className="btn-reject py-3 text-xs"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 10: ADD / EDIT PLACE REMINDER MODAL                    */}
      {/* ============================================================ */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xl font-black text-[#1E4A3A] flex items-center gap-2">
                <Clock className="w-6 h-6 text-amber-600" />
                <span>إضافة تذكير ومؤقت مستقبلي</span>
              </h3>
              <button onClick={() => setShowAddReminderModal(null)} className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold">
              نشاط: <strong className="text-[#1E4A3A] text-sm">{showAddReminderModal.businessName}</strong>
            </p>

            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 block">اختيارات سريعة للتوقيت:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
                    setReminderDateTimeInput(d);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold border border-slate-300"
                >
                  بعد ساعة ⏱️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
                    setReminderDateTimeInput(d);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold border border-slate-300"
                >
                  غداً 10 ص 🌅
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16);
                    setReminderDateTimeInput(d);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold border border-slate-300"
                >
                  بعد 3 أيام 📅
                </button>
              </div>
            </div>

            {/* Custom Date Time */}
            <div>
              <label className="block text-xs font-bold text-[#1E202A] mb-1">وقت وتاريخ التذكير المحدد</label>
              <input
                type="datetime-local"
                value={reminderDateTimeInput}
                onChange={e => setReminderDateTimeInput(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border-slate-300"
              />
            </div>

            {/* Reminder Note */}
            <div>
              <label className="block text-xs font-bold text-[#1E202A] mb-1">نص وملاحظة التذكير المخصصة للموظف</label>
              <textarea
                value={reminderNoteInput}
                onChange={e => setReminderNoteInput(e.target.value)}
                placeholder="أدخل نص التذكير (مثال: زيارة متابعة ثانية لتحصيل المبلغ المتبقي أو مراسلة التاجر عبر واتساب)"
                className="w-full min-h-[85px] text-xs font-bold rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSaveReminder(showAddReminderModal.id, reminderDateTimeInput, reminderNoteInput)}
                className="bg-[#1E4A3A] hover:bg-[#143529] text-white font-black py-3 rounded-xl text-xs shadow-md"
              >
                حفظ وجدولة التذكير
              </button>
              <button
                onClick={() => setShowAddReminderModal(null)}
                className="btn-reject py-3 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}