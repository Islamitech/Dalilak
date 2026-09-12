import { Business } from '../types';
import { getDisplayDirectoryUrl } from './directoryUrl';

export interface VcfExportOptions {
  /**
   * Name formatting style:
   * - 'name_dalilak': "اسم المنشأة - دليلك" (Recommended to distinguish on WhatsApp)
   * - 'name_category_dalilak': "اسم المنشأة | التصنيف - دليلك"
   * - 'name_only': "اسم المنشأة"
   */
  nameFormat?: 'name_dalilak' | 'name_category_dalilak' | 'name_only';

  /**
   * Google Contacts Label / Category tag (defaults to "دليلك")
   */
  groupLabel?: string;

  /**
   * Whether to include owner phone if different from primary phone
   */
  includeOwnerPhone?: boolean;

  /**
   * Whether to include landlines / hotlines as WORK phones
   */
  includeLandlines?: boolean;

  /**
   * Whether to attach canonical public directory URL
   */
  includeDirectoryUrl?: boolean;
}

/**
 * Normalizes an Egyptian or international phone number into standard E.164 (+20...) format.
 */
export function normalizeEgyptianPhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('0020')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('20') && digits.length >= 12) {
    // Already 201...
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  }

  if (!digits.startsWith('+')) {
    digits = '+' + digits;
  }
  return digits;
}

/**
 * Identifies Egyptian Landline Area Codes and Short Hotlines
 */
export function isLandlineOrHotline(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return false;

  // Short hotlines (5 to 8 digits not starting with 01)
  if (digits.length <= 8 && !digits.startsWith('01')) return true;

  // Egyptian landlines starting with 02, 03, 013, 040-097
  if (
    /^(?:0020|20)?(?:02|03|013|040|045|047|048|050|055|062|064|065|066|068|069|082|084|086|088|092|093|095|096|097)\d{5,8}$/.test(
      digits
    )
  ) {
    return true;
  }

  // Cairo/Giza & Alexandria landlines with 7 or 8 local digits
  if (/^(?:02|03)\d{7,8}$/.test(digits)) return true;

  return false;
}

/**
 * Checks if phone is a valid target mobile (not dummy, not landline)
 */
export function isValidCellPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return false;

  // Reject dummy placeholder numbers
  if (
    /^0+$/.test(digits) ||
    digits === '01000000000' ||
    digits === '01100000000' ||
    digits === '01200000000' ||
    digits === '01500000000' ||
    digits === '0000000000'
  ) {
    return false;
  }

  if (isLandlineOrHotline(digits)) {
    return false;
  }

  // Egyptian mobile: 010, 011, 012, 015 (with or without 20 / 0020)
  if (/^(?:0020|20)?(?:0)?1[0125]\d{8}$/.test(digits)) return true;
  if (digits.length >= 11 && !digits.startsWith('0')) return true;

  return false;
}

/**
 * Sanitizes and cleans text strings for vCard 3.0 formatting.
 * Replaces newlines and semicolons with clean spaces to avoid parser breakage.
 */
function cleanText(str?: string | null): string {
  if (!str) return '';
  return str.replace(/[\r\n;,]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generates an RFC 2426 compliant vCard 3.0 text block for a single Business.
 */
export function generateSingleVCard(biz: Business, options: VcfExportOptions = {}): string | null {
  const {
    nameFormat = 'name_dalilak',
    groupLabel = 'دليلك',
    includeOwnerPhone = true,
    includeLandlines = false,
    includeDirectoryUrl = true,
  } = options;

  const rawName = cleanText(biz.nameAr || biz.name || 'منشأة معتمدة');
  const rawCategory = cleanText(biz.category || 'نشاط تجاري');
  const rawGov = cleanText(biz.governorate || '');
  const rawCity = cleanText(biz.city || '');
  const rawStreet = cleanText(biz.street || '');
  const rawOwner = cleanText(biz.ownerName || '');

  // Determine Formatted Name (FN)
  let formattedName = rawName;
  if (nameFormat === 'name_dalilak') {
    formattedName = `${rawName} - دليلك`;
  } else if (nameFormat === 'name_category_dalilak') {
    formattedName = `${rawName} | ${rawCategory} - دليلك`;
  }

  // Phone processing
  const primaryRaw = biz.phone || biz.ownerPhone;
  const secondaryRaw = biz.secondaryPhone;
  const ownerRaw = biz.ownerPhone;

  const phonesToAdd: Array<{ number: string; type: string }> = [];
  const addedNumbers = new Set<string>();

  // Helper to add phone
  const maybeAddPhone = (raw: string | undefined | null, defaultType: 'CELL' | 'WORK') => {
    if (!raw) return;
    const isLand = isLandlineOrHotline(raw);
    if (isLand && !includeLandlines) return;
    if (!isLand && !isValidCellPhone(raw)) return;

    const normalized = normalizeEgyptianPhone(raw);
    if (!normalized || addedNumbers.has(normalized)) return;

    addedNumbers.add(normalized);
    phonesToAdd.push({
      number: normalized,
      type: isLand ? 'WORK,VOICE' : defaultType === 'CELL' ? 'CELL,VOICE,PREF' : 'WORK,VOICE',
    });
  };

  // 1. Primary phone
  maybeAddPhone(primaryRaw, 'CELL');

  // 2. Secondary phone
  if (secondaryRaw) {
    maybeAddPhone(secondaryRaw, 'WORK');
  }

  // 3. Owner phone
  if (includeOwnerPhone && ownerRaw && ownerRaw !== primaryRaw) {
    maybeAddPhone(ownerRaw, 'WORK');
  }

  // If no valid phones found, skip exporting this contact
  if (phonesToAdd.length === 0) {
    return null;
  }

  // Build canonical public URL
  let profileUrl = '';
  if (includeDirectoryUrl) {
    try {
      profileUrl = getDisplayDirectoryUrl(biz);
    } catch {
      profileUrl = `https://www.dalilaak.com/biz/${biz.id}`;
    }
  }

  // Construct vCard 3.0 lines
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'PRODID:-//Dalilak Directory//Google Contacts Exporter 1.0//AR',
    `FN:${formattedName}`,
    `N:;${formattedName};;;`, // Google Contacts interprets empty Last Name & First Name = formattedName
    `ORG:منظومة دليلك المعتمدة;${rawCategory}`,
    `TITLE:${rawCategory}`,
  ];

  // Add phones
  phonesToAdd.forEach((p, idx) => {
    const isFirstCell = idx === 0 && p.type.includes('CELL');
    const typeStr = isFirstCell ? 'TYPE=CELL,VOICE,PREF' : `TYPE=${p.type}`;
    lines.push(`TEL;${typeStr}:${p.number}`);
  });

  // Address
  if (rawStreet || rawCity || rawGov) {
    lines.push(`ADR;TYPE=WORK:;;${rawStreet};${rawCity};${rawGov};;مصر`);
  }

  // Contact Category / Label (Google Contacts uses CATEGORIES to create groups)
  if (groupLabel) {
    lines.push(`CATEGORIES:${groupLabel},منظومة دليلك`);
  }

  // Notes & Info
  const noteParts: string[] = [
    `منشأة مسجلة في منظومة دليلك المعتمدة`,
    rawCategory ? `التصنيف: ${rawCategory}` : '',
    rawGov || rawCity ? `الموقع: ${[rawCity, rawGov].filter(Boolean).join(' - ')}` : '',
    rawOwner ? `المسؤول: ${rawOwner}` : '',
    phonesToAdd[0]?.number ? `الهاتف الأساسي: ${phonesToAdd[0].number}` : '',
  ].filter(Boolean);

  lines.push(`NOTE:${noteParts.join(' | ')}`);

  // Profile URL
  if (profileUrl) {
    lines.push(`URL:${profileUrl}`);
  }

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * Compiles a batch of businesses into a single combined .vcf file string.
 */
export function generateBatchVcf(
  businesses: Business[],
  options: VcfExportOptions = {}
): { vcfString: string; totalContacts: number; validCount: number; skippedCount: number } {
  const cards: string[] = [];
  let skipped = 0;

  for (const biz of businesses) {
    if ((biz as any).isDeleted) {
      skipped++;
      continue;
    }
    const card = generateSingleVCard(biz, options);
    if (card) {
      cards.push(card);
    } else {
      skipped++;
    }
  }

  const vcfString = cards.join('\r\n\r\n');

  return {
    vcfString,
    totalContacts: businesses.length,
    validCount: cards.length,
    skippedCount: skipped,
  };
}

/**
 * Triggers a native browser file download of the generated .vcf file with UTF-8 BOM.
 */
export function downloadVcfFile(
  businesses: Business[],
  customFilename?: string,
  options: VcfExportOptions = {}
): { totalContacts: number; validCount: number; filename: string } {
  const { vcfString, totalContacts, validCount } = generateBatchVcf(businesses, options);

  if (validCount === 0) {
    throw new Error('لا توجد أي أرقام هواتف صالحة للتصدير ضمن المنشآت المحددة.');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const defaultFilename = `Dalilak_Contacts_${dateStr}.vcf`;
  const filename = customFilename || defaultFilename;

  // Prepend UTF-8 BOM (\uFEFF) so Excel, Google, Windows, iOS all decode Arabic characters correctly
  const blob = new Blob(['\uFEFF' + vcfString], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  return {
    totalContacts,
    validCount,
    filename,
  };
}
