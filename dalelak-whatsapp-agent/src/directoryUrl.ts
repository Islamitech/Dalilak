/**
 * Official Public Directory URL Utility for Dalelak WhatsApp Agent
 */

export const PUBLIC_DIRECTORY_DOMAIN = 'https://www.dalilaak.com';

export function getDisplayDirectoryUrl(business?: {
  id?: string;
  customDirectoryUrl?: string;
  nameAr?: string;
  nameEn?: string;
  city?: string;
}): string {
  if (!business) return PUBLIC_DIRECTORY_DOMAIN;
  if (business.customDirectoryUrl && business.customDirectoryUrl.trim()) {
    return business.customDirectoryUrl.trim();
  }
  return business.id ? `${PUBLIC_DIRECTORY_DOMAIN}/biz/${business.id}` : PUBLIC_DIRECTORY_DOMAIN;
}

export function getPublicDirectoryUrl(business?: {
  id?: string;
  customDirectoryUrl?: string;
  nameAr?: string;
  nameEn?: string;
  city?: string;
}): string {
  return getDisplayDirectoryUrl(business);
}
