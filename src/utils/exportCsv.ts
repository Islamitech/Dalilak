import { Business, Representative, PayoutRequest } from '../types';
import { PAYOUT_METHOD_LABELS } from './commission';

/**
 * Utility to export data arrays to CSV with UTF-8 BOM encoding for Microsoft Excel support in Arabic.
 */

function downloadCsvBlob(csvContent: string, fileName: string) {
  // UTF-8 BOM (\uFEFF) ensures Excel opens Arabic characters correctly without weird symbols
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitizes CSV cell values to prevent Formula Injection (CSV Injection).
 * Any cell starting with =, +, -, @, \t, or \r is prefixed with a single quote.
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const trimmed = str.trimStart();
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  const safeStr = dangerousChars.some((c) => trimmed.startsWith(c)) ? `'${str}` : str;
  return `"${safeStr.replace(/"/g, '""')}"`;
}

export function exportBusinessesToCsv(businesses: Business[]) {
  const headers = [
    'اسم النشاط بالعربية',
    'اسم النشاط بالإنجليزية',
    'التصنيف',
    'المحافظة',
    'المدينة / المنطقة',
    'العنوان التفصيلي',
    'اسم صاحب النشاط',
    'رقم هاتف المالك',
    'اسم المندوب',
    'رقم الفاتورة',
    'تاريخ التسجيل',
    'الباقة',
    'سعر الباقة (ج.م)',
    'المبلغ المدفوع (ج.م)',
    'المبلغ المتبقي (ج.م)',
    'حالة الدفع',
    'حالة التوثيق',
    'حالة مزامنة خرائط جوجل',
    'خط العرض (Latitude)',
    'خط الطول (Longitude)',
    'رابط الخريطة',
  ];

  const rows = businesses.map((b) => {
    const isExempt = Boolean(b.isFeeExempt || b.packagePrice === 0);
    const debt = isExempt ? 0 : Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0));
    const mapsLink = b.lat && b.lng ? `https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}` : '';
    
    return [
      sanitizeCsvCell(b.nameAr || ''),
      sanitizeCsvCell(b.nameEn || ''),
      sanitizeCsvCell(b.category || ''),
      sanitizeCsvCell(b.governorate || ''),
      sanitizeCsvCell(b.city || ''),
      sanitizeCsvCell(b.street || b.city || ''),
      sanitizeCsvCell(b.ownerName || ''),
      sanitizeCsvCell(b.ownerPhone || ''),
      sanitizeCsvCell(b.repName || ''),
      sanitizeCsvCell(b.invoiceNumber || ''),
      sanitizeCsvCell(b.createdDate || b.invoiceDate || ''),
      sanitizeCsvCell(b.packageName || (isExempt ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)' : '')),
      isExempt ? 0 : (b.packagePrice || 0),
      isExempt ? 0 : (b.amountPaid || 0),
      debt,
      sanitizeCsvCell(isExempt ? 'معفى من الرسوم (مجاني)' : b.paymentStatus === 'fully_paid' ? 'مدفوع بالكامل' : b.paymentStatus === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مسدد'),
      sanitizeCsvCell(b.verificationStatus === 'verified' ? 'موثق' : b.verificationStatus === 'in_progress' ? 'قيد المراجعة' : b.verificationStatus === 'rejected' ? 'مرفوض' : 'غير مرسل'),
      sanitizeCsvCell(b.googleSyncStatus === 'synced' ? 'تمت المزامنة بنجاح' : b.googleSyncStatus === 'in_progress' ? 'قيد المزامنة' : 'لم تتم'),
      b.lat || '',
      b.lng || '',
      sanitizeCsvCell(mapsLink),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  downloadCsvBlob(csv, 'تقرير_الأنشطة_التجارية_دليلك');
}

export function exportRepsToCsv(reps: Representative[], businesses: Business[]) {
  const headers = [
    'اسم العضو / المندوب',
    'البريد الإلكتروني',
    'رقم الهاتف',
    'الرقم القومي',
    'المحافظة',
    'الصلاحية / المسمى',
    'حالة الحساب',
    'نسبة العمولة (%)',
    'المستهدف الشهري',
    'عدد الأنشطة المسجلة',
    'إجمالي المبالغ المحصلة (ج.م)',
    'كود الإحالة الخاص به',
    'مسجل بواسطة كود إحالة',
  ];

  const rows = reps.map((r) => {
    const repBiz = businesses.filter((b) => b.repId === r.id || b.repName === r.name);
    const collected = repBiz.reduce((sum, b) => (b.isFeeExempt || b.packagePrice === 0) ? sum : sum + (b.amountPaid || 0), 0);

    return [
      sanitizeCsvCell(r.name || ''),
      sanitizeCsvCell(r.email || ''),
      sanitizeCsvCell(r.phone || ''),
      sanitizeCsvCell(r.nationalId || ''),
      sanitizeCsvCell(r.governorate || ''),
      sanitizeCsvCell(r.roleTitle || r.role || 'مندوب'),
      sanitizeCsvCell(r.status === 'active' ? 'نشط' : 'معلق'),
      r.commissionRate || 42.86,
      r.targetMonth || 25,
      repBiz.length,
      collected,
      sanitizeCsvCell(r.referralCode || ''),
      sanitizeCsvCell(r.referredByCode || ''),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  downloadCsvBlob(csv, 'تقرير_فريق_العمل_والمناديب_دليلك');
}

export function exportPayoutsToCsv(payouts: PayoutRequest[]) {
  const headers = [
    'كود الطلب',
    'اسم المندوب',
    'رقم الهاتف',
    'المبلغ المطلوب (ج.م)',
    'وسيلة التحويل',
    'رقم المحفظة / الحساب',
    'حالة الطلب',
    'تاريخ الطلب',
    'تاريخ الصرف',
    'رقم الحوالة المرجعي',
    'ملاحظات الإدارة',
  ];

  const rows = payouts.map((p) => {
    return [
      sanitizeCsvCell(p.id),
      sanitizeCsvCell(p.repName || ''),
      sanitizeCsvCell(p.repPhone || ''),
      p.amount || 0,
      sanitizeCsvCell(PAYOUT_METHOD_LABELS[p.method] || p.method),
      sanitizeCsvCell(p.accountDetails || ''),
      sanitizeCsvCell(p.status === 'approved' ? 'تم التحويل والصرف' : p.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'),
      sanitizeCsvCell(p.requestDate || ''),
      sanitizeCsvCell(p.processedDate || ''),
      sanitizeCsvCell(p.transactionRef || ''),
      sanitizeCsvCell(p.adminNotes || ''),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  downloadCsvBlob(csv, 'تقرير_طلبات_صرف_العمولات_دليلك');
}
