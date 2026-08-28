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
    const debt = Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0));
    const mapsLink = b.lat && b.lng ? `https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}` : '';
    
    return [
      `"${(b.nameAr || '').replace(/"/g, '""')}"`,
      `"${(b.nameEn || '').replace(/"/g, '""')}"`,
      `"${(b.category || '').replace(/"/g, '""')}"`,
      `"${(b.governorate || '').replace(/"/g, '""')}"`,
      `"${(b.city || '').replace(/"/g, '""')}"`,
      `"${(b.street || b.city || '').replace(/"/g, '""')}"`,
      `"${(b.ownerName || '').replace(/"/g, '""')}"`,
      `"${(b.ownerPhone || '').replace(/"/g, '""')}"`,
      `"${(b.repName || '').replace(/"/g, '""')}"`,
      `"${(b.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${(b.createdDate || b.invoiceDate || '').replace(/"/g, '""')}"`,
      `"${(b.packageName || '').replace(/"/g, '""')}"`,
      b.packagePrice || 0,
      b.amountPaid || 0,
      debt,
      `"${b.paymentStatus === 'fully_paid' ? 'مدفوع بالكامل' : b.paymentStatus === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مسدد'}"`,
      `"${b.verificationStatus === 'verified' ? 'موثق' : b.verificationStatus === 'in_progress' ? 'قيد المراجعة' : b.verificationStatus === 'rejected' ? 'مرفوض' : 'غير مرسل'}"`,
      `"${b.googleSyncStatus === 'synced' ? 'تمت المزامنة بنجاح' : b.googleSyncStatus === 'in_progress' ? 'قيد المزامنة' : 'لم تتم'}"`,
      b.lat || '',
      b.lng || '',
      `"${mapsLink}"`,
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
    'إجمالي التحصيلات (ج.م)',
    'كود الدعوة',
    'كود الداعي',
  ];

  const rows = reps.map((r) => {
    const repBiz = businesses.filter((b) => b.repId === r.id || b.repName === r.name);
    const collected = repBiz.reduce((sum, b) => sum + (b.amountPaid || 0), 0);

    return [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.nationalId || '').replace(/"/g, '""')}"`,
      `"${(r.governorate || '').replace(/"/g, '""')}"`,
      `"${(r.roleTitle || r.role || 'مندوب').replace(/"/g, '""')}"`,
      `"${r.status === 'active' ? 'نشط' : 'معلق'}"`,
      r.commissionRate || 42.86,
      r.targetMonth || 25,
      repBiz.length,
      collected,
      `"${r.referralCode || ''}"`,
      `"${r.referredByCode || ''}"`,
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
      `"${p.id}"`,
      `"${(p.repName || '').replace(/"/g, '""')}"`,
      `"${(p.repPhone || '').replace(/"/g, '""')}"`,
      p.amount || 0,
      `"${PAYOUT_METHOD_LABELS[p.method] || p.method}"`,
      `"${(p.accountDetails || '').replace(/"/g, '""')}"`,
      `"${p.status === 'approved' ? 'تم التحويل والصرف' : p.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}"`,
      `"${p.requestDate || ''}"`,
      `"${p.processedDate || ''}"`,
      `"${(p.transactionRef || '').replace(/"/g, '""')}"`,
      `"${(p.adminNotes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  downloadCsvBlob(csv, 'تقرير_طلبات_صرف_العمولات_دليلك');
}
