/**
 * Official Representative & Documentation Authority Formatter
 * Protocol: Strict prohibition of internal programming/system jargon
 * (e.g. السوبر أدمن, استيراد آلي, rep_super_admin) in user-facing views or client invoices.
 */

export interface RepDisplayInfo {
  isPlatformOfficial: boolean;
  roleLabel: string;
  displayName: string;
  badgeText: string;
}

/**
 * Sanitizes any internal system or developer tags from representative names.
 */
export function sanitizeRepName(rawName?: string | null): string {
  if (!rawName || typeof rawName !== 'string') return 'مندوب معتمد';
  const trimmed = rawName.trim();
  if (
    trimmed.includes('استيراد') ||
    trimmed.includes('آلي') ||
    trimmed.includes('سوبر') ||
    trimmed.includes('admin') ||
    trimmed.includes('Admin') ||
    trimmed === 'rep_super_admin' ||
    trimmed === 'مدير النظام دليلك'
  ) {
    return 'إدارة منصة دليلك';
  }
  return trimmed;
}

/**
 * Returns clean commercial presentation labels for invoices, directories, and receipts.
 */
export function getRepDisplayInfo(
  repName?: string | null,
  options?: {
    repId?: string | null;
    isFeeExempt?: boolean;
    packageId?: string | null;
  }
): RepDisplayInfo {
  const cleanName = (repName || '').trim();
  const cleanId = (options?.repId || '').trim().toLowerCase();

  const isPlatformOfficial =
    options?.isFeeExempt === true ||
    options?.packageId === 'pkg_already_on_google' ||
    options?.packageId === 'pkg_exempt' ||
    cleanId === 'admin_platform' ||
    cleanId === 'rep_super_admin' ||
    cleanId.startsWith('admin_') ||
    !cleanName ||
    cleanName === 'إدارة منصة دليلك' ||
    cleanName.includes('استيراد') ||
    cleanName.includes('آلي') ||
    cleanName.includes('سوبر') ||
    cleanName.includes('admin') ||
    cleanName.includes('Admin') ||
    cleanName === 'مدير النظام دليلك';

  if (isPlatformOfficial) {
    return {
      isPlatformOfficial: true,
      roleLabel: 'جهة التوثيق:',
      displayName: 'إدارة منصة دليلك',
      badgeText: 'توثيق إدارة المنصة',
    };
  }

  const safeName = sanitizeRepName(cleanName);
  return {
    isPlatformOfficial: false,
    roleLabel: 'المندوب المعتمد:',
    displayName: safeName,
    badgeText: 'المندوب: ' + safeName,
  };
}
