import { describe, it, expect } from 'vitest';
import {
  stripBiDiControls,
  parsePhotosArray,
  parseVideosArray,
  mapDbToBusiness,
  mapBusinessToDb,
  mapDbToRep,
  mapRepToDb,
} from '../src/services/db/dbMappers';
import { Business, Representative } from '../src/types';

describe('Dalilak Database Mappers & Data Normalization Suite', () => {
  describe('stripBiDiControls', () => {
    it('removes unicode right-to-left override and bidi characters', () => {
      const tainted = '\u202Eمتجر النور\u202C \u200E(فرع 1)\uFEFF';
      const clean = stripBiDiControls(tainted);
      expect(clean).toBe('متجر النور (فرع 1)');
      expect(clean).not.toContain('\u202E');
      expect(clean).not.toContain('\u200E');
      expect(clean).not.toContain('\uFEFF');
    });

    it('handles null, undefined, or empty gracefully', () => {
      expect(stripBiDiControls(null)).toBe('');
      expect(stripBiDiControls(undefined)).toBe('');
      expect(stripBiDiControls('')).toBe('');
    });
  });

  describe('parsePhotosArray', () => {
    it('parses raw array directly', () => {
      const photos = ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'];
      expect(parsePhotosArray({ photos })).toEqual(photos);
    });

    it('parses JSON stringified arrays', () => {
      const jsonStr = JSON.stringify(['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png']);
      expect(parsePhotosArray({ photos_urls: jsonStr })).toEqual([
        'https://cdn.example.com/a.png',
        'https://cdn.example.com/b.png',
      ]);
    });

    it('parses comma-separated strings', () => {
      const csv = 'https://cdn.example.com/img1.jpg, https://cdn.example.com/img2.jpg';
      expect(parsePhotosArray({ photos: csv })).toEqual([
        'https://cdn.example.com/img1.jpg',
        'https://cdn.example.com/img2.jpg',
      ]);
    });

    it('parses PostgreSQL curly braces array syntax: {url1,url2}', () => {
      const pgArray = '{"https://cdn.example.com/pg1.jpg","https://cdn.example.com/pg2.jpg"}';
      expect(parsePhotosArray({ photos: pgArray })).toEqual([
        'https://cdn.example.com/pg1.jpg',
        'https://cdn.example.com/pg2.jpg',
      ]);
    });

    it('returns single URL in an array if just a string URL', () => {
      const singleUrl = 'https://cdn.example.com/single.jpg';
      expect(parsePhotosArray({ photos: singleUrl })).toEqual([singleUrl]);
    });

    it('returns empty array when no photo is provided', () => {
      expect(parsePhotosArray({})).toEqual([]);
      expect(parsePhotosArray({ photos: null })).toEqual([]);
    });
  });

  describe('Business Mapping: mapDbToBusiness & mapBusinessToDb', () => {
    const rawDbRow: any = {
      id: 'biz_001',
      name_ar: 'صيدلية النيل',
      category: 'صيدليات',
      governorate: 'الجيزة',
      city: 'الدقي',
      address: 'شارع التحرير',
      phone: '01112223334',
      whatsapp: '01112223334',
      verified: true,
      verification_status: 'verified',
      is_premium: true,
      package_id: 'pkg_diamond',
      rating: 4.8,
      views_count: 120,
      photos_urls: ['https://cdn.example.com/ph1.jpg'],
      created_at: '2026-01-01T12:00:00Z',
    };

    it('maps database snake_case columns to business camelCase model', () => {
      const biz: Business = mapDbToBusiness(rawDbRow);
      expect(biz.id).toBe('biz_001');
      expect(biz.nameAr).toBe('صيدلية النيل');
      expect(biz.category).toBe('صيدليات');
      expect(biz.photos).toEqual(['https://cdn.example.com/ph1.jpg']);
    });

    it('maps business camelCase model to database snake_case format', () => {
      const biz = mapDbToBusiness(rawDbRow);
      const dbPayload = mapBusinessToDb(biz);
      expect(dbPayload.id).toBe('biz_001');
      expect(dbPayload.name_ar).toBe('صيدلية النيل');
      expect(dbPayload.category).toBe('صيدليات');
    });
  });

  describe('Representative Mapping: mapDbToRep & mapRepToDb', () => {
    const rawRepRow: any = {
      id: 'rep_777',
      name: 'أحمد محمود',
      email: 'ahmed@dalelak.com',
      phone: '01099887766',
      role: 'rep',
      status: 'active',
      national_id: '29001011234567',
      commission_rate: 15,
      target_month: 20,
      created_at: '2026-02-15T10:00:00Z',
    };

    it('maps database row correctly to Representative interface', () => {
      const rep: Representative = mapDbToRep(rawRepRow);
      expect(rep.id).toBe('rep_777');
      expect(rep.name).toBe('أحمد محمود');
      expect(rep.email).toBe('ahmed@dalelak.com');
      expect(rep.phone).toBe('01099887766');
      expect(rep.role).toBe('rep');
      expect(rep.commissionRate).toBe(15);
      expect(rep.targetMonth).toBe(20);
    });

    it('maps Representative interface to DB format', () => {
      const rep = mapDbToRep(rawRepRow);
      const dbRep = mapRepToDb(rep);
      expect(dbRep.id).toBe('rep_777');
      expect(dbRep.name).toBe('أحمد محمود');
      expect(dbRep.commission_rate).toBe(15);
      expect(dbRep.target_month).toBe(20);
    });
  });
});
