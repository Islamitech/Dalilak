import { Representative, User } from '../types';
import { safeGetLocalStorageItem, safeParseJson } from './storage';

/**
 * 🛡️ Centralized Security Helper:
 * Checks if a representative or user account has been deleted, suspended, or blacklisted.
 * Ensures that deleted accounts cannot log in, remain logged in, or register businesses.
 */
export function isRepAccountDeleted(
  target?: Representative | User | { id?: string; email?: string; phone?: string; isDeleted?: boolean; status?: string } | null
): boolean {
  if (!target) return false;

  // 1. Direct object flag check
  const anyTarget = target as any;
  if (anyTarget.isDeleted === true) return true;
  if (anyTarget.status === 'deleted') return true;

  // Check repData if target is a User
  if (anyTarget.repData) {
    if (anyTarget.repData.isDeleted === true) return true;
    if (anyTarget.repData.status === 'deleted') return true;
  }

  const idLower = (target.id || anyTarget.repData?.id || '').toLowerCase().trim();
  const emailLower = (target.email || anyTarget.repData?.email || '').toLowerCase().trim();
  const phoneTrim = (target.phone || anyTarget.repData?.phone || '').trim();

  // 2. Blacklisted ID/Email/Phone check (localStorage)
  const blacklist = new Set(
    (safeParseJson<string[]>(safeGetLocalStorageItem('dalelak_deleted_rep_ids'), []) || [])
      .filter(Boolean)
      .map((x) => String(x).toLowerCase().trim())
      .filter((x) => x.length > 0)
  );

  if (idLower && blacklist.has(idLower)) return true;
  if (emailLower && blacklist.has(emailLower)) return true;
  if (phoneTrim && blacklist.has(phoneTrim.toLowerCase())) return true;

  // 3. Soft deleted reps registry check
  const softDeletedList = safeParseJson<Representative[]>(safeGetLocalStorageItem('dalelak_soft_deleted_reps'), []) || [];
  const isMatchSoft = softDeletedList.some((r) => {
    if (!r) return false;
    const rId = (r.id || '').toLowerCase().trim();
    const rEmail = (r.email || '').toLowerCase().trim();
    const rPhone = (r.phone || '').trim();

    return (
      (idLower && rId && idLower === rId) ||
      (emailLower && rEmail && emailLower === rEmail) ||
      (phoneTrim && rPhone && phoneTrim === rPhone)
    );
  });

  return isMatchSoft;
}

/**
 * Adds an account's identifiers to the deleted blacklist in storage
 */
export function blacklistRepAccount(id: string, email?: string, phone?: string): void {
  try {
    const raw = safeParseJson<string[]>(safeGetLocalStorageItem('dalelak_deleted_rep_ids'), []) || [];
    const set = new Set(raw.map((x) => String(x).toLowerCase().trim()).filter(Boolean));

    if (id) set.add(id.toLowerCase().trim());
    if (email) set.add(email.toLowerCase().trim());
    if (phone) set.add(phone.trim().toLowerCase());

    safeGetLocalStorageItem('dalelak_deleted_rep_ids');
    localStorage.setItem('dalelak_deleted_rep_ids', JSON.stringify(Array.from(set)));
  } catch {}
}
