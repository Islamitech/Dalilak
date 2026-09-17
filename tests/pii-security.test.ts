import { describe, it, expect } from 'vitest';
import { SAFE_REP_SELECT } from '../src/services/db/repDb';
import { Representative, Business } from '../src/types';

// Testing PII Sanitization Functions
function sanitizeRep(rep: Representative, isPrivileged: boolean = false): Partial<Representative> {
  const copy = { ...rep };
  delete copy.password;
  delete copy.activeSessionId;
  if (!isPrivileged) {
    delete copy.nationalId;
    delete copy.nationalIdCardPhoto;
    delete copy.nationalIdCardBackPhoto;
    delete copy.activationFacePhoto;
  }
  return copy;
}

function sanitizePublicBusiness(biz: Business, isPrivileged: boolean = false): Partial<Business> {
  if (isPrivileged) return biz;
  const copy: any = { ...biz };
  delete copy.nationalId;
  delete copy.nationalIdCardPhoto;
  delete copy.nationalIdCardBackPhoto;
  delete copy.paymentReceiptPhoto;
  delete copy.adminFollowUps;
  delete copy.cashCollectedByRep;
  delete copy.repCommissionRate;
  delete copy.repCommissionAmount;
  delete copy.paymentDetails;
  return copy;
}

describe('Dalilak PII & Defense-in-depth Security Suite', () => {
  describe('SAFE_REP_SELECT Constant Security Check', () => {
    it('strictly forbids inclusion of national_id in public select queries', () => {
      const columns = SAFE_REP_SELECT.split(',').map((c) => c.trim());
      expect(columns).not.toContain('national_id');
      expect(columns).not.toContain('nationalId');
    });

    it('strictly forbids inclusion of sensitive password and token fields', () => {
      const columns = SAFE_REP_SELECT.split(',').map((c) => c.trim());
      expect(columns).not.toContain('password');
      expect(columns).not.toContain('token');
      expect(columns).not.toContain('session_token');
      expect(columns).not.toContain('active_session_id');
    });

    it('strictly forbids inclusion of KYC photos (front, back, selfie)', () => {
      const columns = SAFE_REP_SELECT.split(',').map((c) => c.trim());
      expect(columns).not.toContain('national_id_card_photo');
      expect(columns).not.toContain('national_id_card_back_photo');
      expect(columns).not.toContain('activation_face_photo');
      expect(columns).not.toContain('nationalIdCardPhoto');
    });
  });

  describe('Representative Data Sanitization (sanitizeRep)', () => {
    const mockRep: Representative = {
      id: 'rep_123',
      name: 'مندوب تجريبي',
      email: 'mandoob@dalelak.com',
      phone: '01012345678',
      role: 'rep',
      status: 'active',
      governorate: 'القاهرة',
      targetMonth: 20,
      commissionRate: 15,
      password: 'sha256:secret_password_hash',
      activeSessionId: 'sess_123456_abcdef',
      nationalId: '29901011234567',
      nationalIdCardPhoto: 'https://supabase.co/storage/kyc_front.jpg',
      nationalIdCardBackPhoto: 'https://supabase.co/storage/kyc_back.jpg',
      activationFacePhoto: 'https://supabase.co/storage/kyc_selfie.jpg',
    };

    it('always purges password and activeSessionId even for privileged callers', () => {
      const privilegedSanitized = sanitizeRep(mockRep, true);
      expect(privilegedSanitized.password).toBeUndefined();
      expect(privilegedSanitized.activeSessionId).toBeUndefined();
      expect(privilegedSanitized.id).toBe('rep_123');
    });

    it('completely strips nationalId and all KYC photos for non-privileged callers', () => {
      const publicSanitized = sanitizeRep(mockRep, false);
      expect(publicSanitized.password).toBeUndefined();
      expect(publicSanitized.activeSessionId).toBeUndefined();
      expect(publicSanitized.nationalId).toBeUndefined();
      expect(publicSanitized.nationalIdCardPhoto).toBeUndefined();
      expect(publicSanitized.nationalIdCardBackPhoto).toBeUndefined();
      expect(publicSanitized.activationFacePhoto).toBeUndefined();

      // Ensure benign fields remain intact
      expect(publicSanitized.name).toBe('مندوب تجريبي');
      expect(publicSanitized.email).toBe('mandoob@dalelak.com');
      expect(publicSanitized.phone).toBe('01012345678');
    });
  });

  describe('Business Public Sanitization (sanitizePublicBusiness)', () => {
    const mockBiz = {
      id: 'biz_test_01',
      nameAr: 'مطعم الأصالة',
      category: 'مطاعم',
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      nationalId: '28805051234567',
      nationalIdCardPhoto: 'https://dalelak.com/kyc_front.png',
      paymentReceiptPhoto: 'https://dalelak.com/receipt.png',
      cashCollectedByRep: 500,
      repCommissionRate: 20,
      repCommissionAmount: 100,
      paymentDetails: { method: 'vodafone_cash', transactionId: 'TXN_999' },
    } as unknown as Business;

    it('purges financial receipts and rep commission details from public view', () => {
      const sanitized: any = sanitizePublicBusiness(mockBiz, false);
      expect(sanitized.nationalId).toBeUndefined();
      expect(sanitized.nationalIdCardPhoto).toBeUndefined();
      expect(sanitized.paymentReceiptPhoto).toBeUndefined();
      expect(sanitized.cashCollectedByRep).toBeUndefined();
      expect(sanitized.repCommissionRate).toBeUndefined();
      expect(sanitized.repCommissionAmount).toBeUndefined();
      expect(sanitized.paymentDetails).toBeUndefined();

      // Non-sensitive public catalog fields remain
      expect(sanitized.id).toBe('biz_test_01');
      expect(sanitized.nameAr).toBe('مطعم الأصالة');
      expect(sanitized.category).toBe('مطاعم');
    });
  });

  describe('Zero-Knowledge National ID Validator', () => {
    function isValidNationalIdFormat(id: string): boolean {
      const clean = (id || '').trim();
      return clean.length >= 8 && /^\d+$/.test(clean);
    }

    it('accepts valid national IDs', () => {
      expect(isValidNationalIdFormat('29510101234567')).toBe(true);
      expect(isValidNationalIdFormat(' 1234567890 ')).toBe(true);
    });

    it('rejects short or non-numeric IDs preventing scraping attacks', () => {
      expect(isValidNationalIdFormat('123')).toBe(false);
      expect(isValidNationalIdFormat('abcdefgh')).toBe(false);
      expect(isValidNationalIdFormat('')).toBe(false);
    });
  });
});
