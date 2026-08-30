import { User, Representative } from '../types';

/**
 * Strips heavy base64 documents (national ID cards, face verification photos)
 * before persisting to localStorage to avoid exceeding the browser 5MB quota.
 */
export function getSafeUserForStorage(user: User | null): User | null {
  if (!user) return null;

  let safeRepData: Representative | undefined = undefined;
  if (user.repData) {
    safeRepData = {
      ...user.repData,
      // Strip large base64 documents from session storage
      nationalIdCardPhoto: undefined,
      nationalIdCardBackPhoto: undefined,
      activationFacePhoto: undefined,
      // If avatar is abnormally large (> 100KB), truncate or keep clean
      avatar: user.repData.avatar && user.repData.avatar.length > 150000 ? '' : user.repData.avatar,
    };
  }

  return {
    ...user,
    avatar: user.avatar && user.avatar.length > 150000 ? '' : user.avatar,
    repData: safeRepData,
  };
}

/**
 * Strips bulky Base64 image payloads (>100KB) from businesses before saving to cache
 * to ensure offline cache remains under 50KB and never triggers QuotaExceededError.
 */
export function getSafeBusinessesForStorage(businesses: any[]): any[] {
  if (!Array.isArray(businesses)) return [];
  return businesses.map((b) => {
    const cleanPhotos = Array.isArray(b.photos)
      ? b.photos.map((p: string) => (typeof p === 'string' && p.startsWith('data:') && p.length > 80000 ? '' : p)).filter(Boolean)
      : [];
    return {
      ...b,
      photos: cleanPhotos,
      videos: Array.isArray(b.videos) ? b.videos.slice(0, 2) : [],
    };
  });
}

/**
 * Safely sets an item in localStorage with quota overflow handling.
 * Automatically evicts non-critical caches if quota is exceeded.
 */
export function safeSetLocalStorageItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`localStorage.setItem failed for key "${key}", attempting non-critical cache eviction...`, err);

    // Evict non-essential bulky caches to free space
    try {
      localStorage.removeItem('dalelak_server_sync_cache');
      localStorage.removeItem('dalelak_system_notifications');
      localStorage.removeItem('dalelak_cached_reps');
      localStorage.removeItem('dalelak_custom_reps');
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.warn(`localStorage retry failed for key "${key}", falling back to sessionStorage`, retryErr);
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch (sessionErr) {
        console.error('Both localStorage and sessionStorage failed:', sessionErr);
        return false;
      }
    }
  }
}

/**
 * Safely retrieves an item from localStorage or fallback sessionStorage.
 */
export function safeGetLocalStorageItem(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch {}

  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely removes an item from both localStorage and sessionStorage.
 */
export function safeRemoveLocalStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

/**
 * Safely sets an item in sessionStorage (per-tab/browser lifetime, automatically wiped on close)
 */
export function safeSetSessionItem(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`sessionStorage.setItem failed for key "${key}"`, err);
    return false;
  }
}

/**
 * Safely gets an item from sessionStorage
 */
export function safeGetSessionItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely removes an item from sessionStorage
 */
export function safeRemoveSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}
