import { describe, it, expect } from 'vitest';
import { classifyEntity } from '../src/services/geo/entityClassifier';

describe('Smart Entity Classifier & Quad-Bucket Segregation Suite', () => {
  it('correctly classifies residential buildings and compounds into RESIDENTIAL bucket', () => {
    const bldg1 = classifyEntity({
      displayName: 'عمارة 145 أ حدائق الأهرام',
      formattedAddress: 'شارع الثروة المعدنية، حدائق الأهرام، الجيزة',
    });
    expect(bldg1.bucket).toBe('RESIDENTIAL');
    expect(bldg1.isCommercial).toBe(false);
    expect(bldg1.metadata.buildingNumber).toBe('145 أ');

    const compound = classifyEntity({
      displayName: 'كمبوند البستان السكني',
      primaryType: 'housing_complex',
    });
    expect(compound.bucket).toBe('RESIDENTIAL');
    expect(compound.isCommercial).toBe(false);

    const villa = classifyEntity({
      displayName: 'فيلا 32 ع',
      formattedAddress: 'المنطقة ع، حدائق الأهرام',
    });
    expect(villa.bucket).toBe('RESIDENTIAL');
  });

  it('correctly classifies roads, gates, and thoroughfares into INFRASTRUCTURE bucket', () => {
    const street = classifyEntity({
      displayName: 'شارع الثروة المعدنية',
      primaryType: 'route',
    });
    expect(street.bucket).toBe('INFRASTRUCTURE');
    expect(street.isCommercial).toBe(false);

    const gate = classifyEntity({
      displayName: 'بوابة خفرع (البوابة الأولى)',
      formattedAddress: 'حدائق الأهرام، الجيزة',
    });
    expect(gate.bucket).toBe('INFRASTRUCTURE');
    expect(gate.isCommercial).toBe(false);
  });

  it('correctly classifies mosques and civic places into CIVIC bucket', () => {
    const mosque = classifyEntity({
      displayName: 'مسجد التقوى والإيمان',
      primaryType: 'mosque',
    });
    expect(mosque.bucket).toBe('CIVIC');
    expect(mosque.isCommercial).toBe(false);

    const church = classifyEntity({
      displayName: 'كنيسة الشهيد مارجرجس',
      primaryType: 'church',
    });
    expect(church.bucket).toBe('CIVIC');
  });

  it('correctly classifies commercial businesses into COMMERCIAL bucket with accurate subcategories', () => {
    // 1. مطعم
    const restaurant = classifyEntity({
      displayName: 'مشويات وكبابجي البرنس',
      primaryType: 'restaurant',
      formattedAddress: 'شارع الثروة المعدنية، المنطقة أ',
    });
    expect(restaurant.bucket).toBe('COMMERCIAL');
    expect(restaurant.isCommercial).toBe(true);
    expect(restaurant.categoryKey).toBe('restaurants');

    // 2. كافيه
    const cafe = classifyEntity({
      displayName: 'كافيه وكوفي شوب الملوك',
      primaryType: 'cafe',
    });
    expect(cafe.bucket).toBe('COMMERCIAL');
    expect(cafe.categoryKey).toBe('cafes');

    // 3. صيدلية
    const pharmacy = classifyEntity({
      displayName: 'صيدلية د. أحمد العزبي',
      primaryType: 'pharmacy',
    });
    expect(pharmacy.bucket).toBe('COMMERCIAL');
    expect(pharmacy.categoryKey).toBe('medical');

    // 4. ورشة وحرفة
    const workshop = classifyEntity({
      displayName: 'مركز الأمانة لصيانة وميكانيكا السيارات',
      primaryType: 'car_repair',
    });
    expect(workshop.bucket).toBe('COMMERCIAL');
    expect(workshop.categoryKey).toBe('craft');
    expect(workshop.metadata.isCraft).toBe(true);

    // 5. سوبرماركت
    const market = classifyEntity({
      displayName: 'سوبرماركت أولاد رجب',
      primaryType: 'supermarket',
    });
    expect(market.bucket).toBe('COMMERCIAL');
    expect(market.categoryKey).toBe('retail');

    // 6. محل ملابس / ترزي
    const tailor = classifyEntity({
      displayName: 'ترزي وخياط الأناقة الرجالي',
    });
    expect(tailor.bucket).toBe('COMMERCIAL');
    expect(tailor.categoryKey).toBe('fashion');
  });

  it('handles edge case where commercial store includes street name in its title', () => {
    const place = classifyEntity({
      displayName: 'مطعم شارع الثروة للشاورما',
    });
    // Should be COMMERCIAL, NOT INFRASTRUCTURE!
    expect(place.bucket).toBe('COMMERCIAL');
    expect(place.categoryKey).toBe('restaurants');
  });
});
