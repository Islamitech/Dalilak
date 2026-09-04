import { User, Representative } from '../types';

/**
 * Safe JSON parser with type fallback that will never throw an uncaught error.
 */
export function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const val = JSON.parse(raw);
    return val !== undefined && val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

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
 * Strips heavy base64 documents from representative lists before persisting to localStorage.
 */
export function getSafeRepsForStorage(reps: Representative[]): Representative[] {
  if (!Array.isArray(reps)) return [];
  return reps.map((r) => ({
    ...r,
    nationalIdCardPhoto: undefined,
    nationalIdCardBackPhoto: undefined,
    activationFacePhoto: undefined,
    avatar: r.avatar && r.avatar.length > 120000 ? '' : r.avatar,
  }));
}

export function getSafeBusinessesForStorage(businesses: any[]): any[] {
  if (!Array.isArray(businesses)) return [];
  return businesses.map((b) => {
    const cleanPhotos = Array.isArray(b.photos)
      ? b.photos
          .map((p: string) => {
            if (typeof p !== 'string') return '';
            // Always keep hosted web URLs (clean, lightweight ~80 bytes)
            if (p.startsWith('http://') || p.startsWith('https://')) return p;
            // For data/blob URLs in local cache, only keep if small (< 35KB)
            if ((p.startsWith('data:') || p.startsWith('blob:')) && p.length < 35000) return p;
            return '';
          })
          .filter(Boolean)
          .slice(0, 4)
      : [];

    return {
      ...b,
      photos: cleanPhotos,
      videos: Array.isArray(b.videos) 
        ? b.videos.filter((v: string) => typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'))).slice(0, 5) 
        : [],
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

/**
 * Generates API authentication and session headers for local server requests.
 */
export function getApiAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = safeGetSessionItem('dalelak_auth_token') || safeGetLocalStorageItem('dalelak_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const userStr = safeGetSessionItem('dalelak_active_user') || safeGetLocalStorageItem('dalelak_logged_user');
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.activeSessionId) {
        headers['x-session-id'] = u.activeSessionId;
      }
      if (u.id) {
        headers['x-user-id'] = u.id;
      }
    } catch {}
  }
  return headers;
}
