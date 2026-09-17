import { describe, it, expect } from 'vitest';
import {
  shuffleBusinessesWithSeed,
  getVerificationBadge,
  getBusinessMapDetails,
} from '../src/components/directory/types';
import { Business } from '../src/types';

describe('Directory Views & Component Helpers', () => {
  const mockBusinesses: Business[] = [
    {
      id: 'biz_01',
      nameAr: 'مطعم الأهرام',
      category: 'مطاعم',
      governorate: 'الجيزة',
      city: 'الدقي',
      verificationStatus: 'verified',
      packagePrice: 500,
      amountPaid: 500,
      googleMapsUrl: 'https://maps.google.com/?cid=12345678',
    } as Business,
    {
      id: 'biz_02',
      nameAr: 'صيدلية النور',
      category: 'صيدليات',
      governorate: 'القاهرة',
      city: 'المعادي',
      verificationStatus: 'rejected',
      packagePrice: 300,
      amountPaid: 0,
      lat: 29.96,
      lng: 31.25,
    } as Business,
    {
      id: 'biz_03',
      nameAr: 'مكتبة الزهور',
      category: 'مكتبات',
      governorate: 'الإسكندرية',
      city: 'سموحة',
      verificationStatus: 'needs_action',
      packagePrice: 250,
      amountPaid: 100,
    } as Business,
    {
      id: 'biz_04',
      nameAr: 'ورشة الوفاء',
      category: 'ورش',
      governorate: 'الجيزة',
      city: 'الهرم',
      verificationStatus: 'pending',
    } as Business,
  ];

  describe('shuffleBusinessesWithSeed (Mulberry32 PRNG)', () => {
    it('should deterministically produce identical order for the same seed', () => {
      const run1 = shuffleBusinessesWithSeed(mockBusinesses, 42);
      const run2 = shuffleBusinessesWithSeed(mockBusinesses, 42);

      expect(run1.map((b) => b.id)).toEqual(run2.map((b) => b.id));
    });

    it('should maintain all items without loss or duplicates', () => {
      const shuffled = shuffleBusinessesWithSeed(mockBusinesses, 9999);
      expect(shuffled.length).toBe(mockBusinesses.length);

      const ids = new Set(shuffled.map((b) => b.id));
      expect(ids.size).toBe(mockBusinesses.length);
    });

    it('should produce different order when given different seeds with sufficient items', () => {
      const extendedList: Business[] = Array.from({ length: 20 }, (_, i) => ({
        id: `biz_${i}`,
        nameAr: `نشاط ${i}`,
      } as Business));

      const runA = shuffleBusinessesWithSeed(extendedList, 12345);
      const runB = shuffleBusinessesWithSeed(extendedList, 67890);

      const idsA = runA.map((b) => b.id);
      const idsB = runB.map((b) => b.id);
      expect(idsA).not.toEqual(idsB);
    });
  });

  describe('getVerificationBadge', () => {
    it('should return correct badge for verified status', () => {
      const badge = getVerificationBadge('verified');
      expect(badge.text).toContain('معتمد');
      expect(badge.badgeClass).toContain('emerald');
    });

    it('should return correct badge for rejected status', () => {
      const badge = getVerificationBadge('rejected');
      expect(badge.text).toContain('مرفوض');
      expect(badge.badgeClass).toContain('rose');
    });

    it('should return correct badge for needs_action status', () => {
      const badge = getVerificationBadge('needs_action');
      expect(badge.text).toContain('يتطلب إجراء');
      expect(badge.badgeClass).toContain('orange');
    });

    it('should return pending badge for undefined or other status', () => {
      const badge = getVerificationBadge(undefined);
      expect(badge.text).toContain('قيد المراجعة');
      expect(badge.badgeClass).toContain('amber');
    });
  });

  describe('getBusinessMapDetails', () => {
    it('should recognize official googleMapsUrl if present and valid', () => {
      const details = getBusinessMapDetails(mockBusinesses[0]);
      expect(details.hasLocation).toBe(true);
      expect(details.isOfficial).toBe(true);
      expect(details.effectiveUrl).toBe('https://maps.google.com/?cid=12345678');
    });

    it('should fallback to lat/lng coordinates if official URL is missing', () => {
      const details = getBusinessMapDetails(mockBusinesses[1]);
      expect(details.hasLocation).toBe(true);
      expect(details.isOfficial).toBe(false);
      expect(details.effectiveUrl).toBe('https://www.google.com/maps?q=29.96,31.25');
    });

    it('should return null URL if no map or coordinates are present', () => {
      const details = getBusinessMapDetails(mockBusinesses[2]);
      expect(details.hasLocation).toBe(false);
      expect(details.isOfficial).toBe(false);
      expect(details.effectiveUrl).toBeNull();
    });
  });
});
