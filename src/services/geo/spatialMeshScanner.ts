/**
 * ===============================================================================
 * 🌐 محرك التمشيط الشبكي الجغرافي واستيعاب القطاعات (Spatial Micro-Grid Mesh Scanner)
 * ===============================================================================
 * يقسم المستطيل الجغرافي للقطاع إلى مصفوفة خلايا مكانية مجهرية (Micro-Grid Cells)
 * ويستخرج كافة المنشآت بدقة إحداثيات خالصة دون التقيد بأي أسماء أو كلمات مفتاحية
 * مع دعم نمط المسح المتعدد (Popularity + Distance) وتتبع الجلسات لمنع التكرار نهائياً.
 * ===============================================================================
 */

import { classifyEntity, ClassifiedEntity, EntityBucket } from './entityClassifier';

export interface BoundingBox {
  southLat: number;
  westLng: number;
  northLat: number;
  eastLng: number;
}

export interface GridCell {
  id: string;
  name: string;
  box: BoundingBox;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface SpatialPlaceCandidate {
  id: string;
  displayName: string;
  category: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  phone?: string;
  rating?: number;
  userRatingCount?: number;
  workingHours?: string;
  googleMapsUri?: string;
  coverPhoto?: string;
  photosCount: number;
  isDuplicate: boolean;
  isQualityApproved: boolean;
  qualityBadgeText: string;
  isCraft: boolean;
  // التصنيف الرباعي المعتمد
  bucket: EntityBucket;
  bucketLabelAr: string;
  classification: ClassifiedEntity;
}

export interface QuadBucketScanResult {
  commercial: SpatialPlaceCandidate[];
  residential: SpatialPlaceCandidate[];
  infrastructure: SpatialPlaceCandidate[];
  civic: SpatialPlaceCandidate[];
  allRaw: SpatialPlaceCandidate[];
  metrics: {
    totalRawFound: number;
    commercialCount: number;
    residentialCount: number;
    infrastructureCount: number;
    civicCount: number;
    duplicatesCount: number;
    cellsScanned: number;
    apiCallsCount: number;
    estimatedCost: string;
  };
}

/**
 * حساب المسافة التقريبية بالأمتار بين نقطتين جغرافيين (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * تقسيم النطاق الجغرافي للقطاع إلى شبكة خلايا متوازنة مع حساب نصف قطر التغطية لكل خلية
 */
export function generateSectorMicroGrid(box: BoundingBox, rows: number = 2, cols: number = 2): GridCell[] {
  const cells: GridCell[] = [];
  const latStep = (box.northLat - box.southLat) / rows;
  const lngStep = (box.eastLng - box.westLng) / cols;

  let cellCounter = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellSouth = box.southLat + r * latStep;
      const cellNorth = cellSouth + latStep;
      const cellWest = box.westLng + c * lngStep;
      const cellEast = cellWest + lngStep;

      const centerLat = (cellSouth + cellNorth) / 2;
      const centerLng = (cellWest + cellEast) / 2;

      // نصف قطر دائرة الخلية يشمل زوايا الخلية بالكامل مع هامش تداخل 15% لمنع الفجوات
      const cornerDistance = calculateDistanceMeters(centerLat, centerLng, cellNorth, cellEast);
      const radiusMeters = Math.min(Math.max(Math.round(cornerDistance * 1.15), 150), 1000);

      cells.push({
        id: `cell_${r}_${c}`,
        name: `الخلية الميدانية (${cellCounter}/${rows * cols})`,
        box: {
          southLat: cellSouth,
          westLng: cellWest,
          northLat: cellNorth,
          eastLng: cellEast,
        },
        centerLat,
        centerLng,
        radiusMeters,
      });
      cellCounter++;
    }
  }

  return cells;
}

/**
 * الحقول المطلوبة من واجهة خرائط Google Places API v1
 */
export const PLACES_API_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.types',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.internationalPhoneNumber',
  'places.nationalPhoneNumber',
  'places.regularOpeningHours',
  'places.photos',
  'places.googleMapsUri',
].join(',');

/**
 * 🛰️ محرك السحب المكاني الخالص المتعدد الطبقات (Multi-Stratum Pure Spatial Nearby Mesh Engine)
 * يعتمد على إحداثيات الخريطة بدقة 100% بدون أي استعلام نصي أو مسميات (Zero Text Bias)
 * يدعم التمشيط المتعدد (Popularity + Distance) لكشف كافة الأنشطة الدفينة مع استبعاد ما تم سحبه سابقاً.
 */
export async function executeSpatialMeshScan(
  sectorBox: BoundingBox,
  sectorName: string,
  apiKey: string,
  existingPlaceIds: Set<string>,
  existingNames: Set<string>,
  options?: {
    gridRows?: number;
    gridCols?: number;
    customRadiusMeters?: number;
    enableDeepStratumScan?: boolean; // تفعيل السحب المزدوج (شهرة + مسافة)
    onProgress?: (progressText: string, currentFound: number) => void;
  }
): Promise<QuadBucketScanResult> {
  const rows = options?.gridRows || 2;
  const cols = options?.gridCols || 2;
  const cells = generateSectorMicroGrid(sectorBox, rows, cols);

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  const commercial: SpatialPlaceCandidate[] = [];
  const residential: SpatialPlaceCandidate[] = [];
  const infrastructure: SpatialPlaceCandidate[] = [];
  const civic: SpatialPlaceCandidate[] = [];
  const allRaw: SpatialPlaceCandidate[] = [];

  let duplicatesCount = 0;
  let apiCallsCount = 0;
  let totalRawFound = 0;

  // نمطا الترتيب لجوجل لتغطية 100% من المنشآت: الافتراضي (الشهرة) + المسافة الجغرافية
  const rankingPasses = options?.enableDeepStratumScan ? [undefined, 'DISTANCE'] : [undefined];

  for (let cIdx = 0; cIdx < cells.length; cIdx++) {
    const cell = cells[cIdx];
    const scanRadius = options?.customRadiusMeters || cell.radiusMeters;

    for (let rIdx = 0; rIdx < rankingPasses.length; rIdx++) {
      const rankPref = rankingPasses[rIdx];
      const passName = rankPref === 'DISTANCE' ? 'المسافة الجغرافية' : 'المعيار القياسي';

      if (options?.onProgress) {
        options.onProgress(
          `مسح الخلية (${cIdx + 1}/${cells.length}) - طبقة ${passName} [${cell.centerLat.toFixed(4)}, ${cell.centerLng.toFixed(4)}] بنطاق ${scanRadius}م...`,
          allRaw.length
        );
      }

      // استدعاء places:searchNearby بنمط الإحداثيات الصرفة دون أي نصوص
      const nearbyBody: Record<string, unknown> = {
        maxResultCount: 20,
        languageCode: 'ar',
        locationRestriction: {
          circle: {
            center: {
              latitude: cell.centerLat,
              longitude: cell.centerLng,
            },
            radius: scanRadius,
          },
        },
      };

      if (rankPref) {
        nearbyBody.rankPreference = rankPref;
      }

      try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': PLACES_API_FIELD_MASK,
          },
          body: JSON.stringify(nearbyBody),
        });

        apiCallsCount++;

        if (res.ok) {
          const data = await res.json();
          const rawPlaces = Array.isArray(data.places) ? data.places : [];
          totalRawFound += rawPlaces.length;

          for (const p of rawPlaces) {
            const placeId = p.id || '';
            const name = (p.displayName?.text || '').trim();
            const lowerName = name.toLowerCase();

            // فحص التكرار الداخلي بين خلايا وطبقات الشبكة المكانية
            if (seenIds.has(placeId) || (name.length > 3 && seenNames.has(lowerName))) {
              continue;
            }

            seenIds.add(placeId);
            if (name.length > 3) seenNames.add(lowerName);

            // فحص التكرار مع قاعدة البيانات المسبقة ومع أرشيف ما تم سحبه
            const isDuplicate = existingPlaceIds.has(placeId) || (name.length > 3 && existingNames.has(lowerName));
            if (isDuplicate) {
              duplicatesCount++;
            }

            const primaryType = p.primaryType || '';
            const primaryTypeDisplayName = p.primaryTypeDisplayName?.text || '';
            const rating = typeof p.rating === 'number' ? p.rating : 0;
            const userRatingCount = typeof p.userRatingCount === 'number' ? p.userRatingCount : 0;
            const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || '';
            const formattedAddress = p.formattedAddress || '';
            const lat = p.location?.latitude || cell.centerLat;
            const lng = p.location?.longitude || cell.centerLng;
            const googleMapsUri = p.googleMapsUri || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : '');

            // 🎯 التصنيف والفرز الرباعي التلقائي
            const classification = classifyEntity({
              id: placeId,
              displayName: name,
              formattedAddress,
              primaryType,
              primaryTypeDisplayName,
              types: Array.isArray(p.types) ? p.types : [],
              lat,
              lng,
            });

            let coverPhoto: string | undefined = undefined;
            if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
              const photoName = p.photos[0].name;
              if (photoName) {
                coverPhoto = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${apiKey}`;
              }
            }

            let workingHours: string | undefined = undefined;
            if (p.regularOpeningHours?.weekdayDescriptions && Array.isArray(p.regularOpeningHours.weekdayDescriptions)) {
              const todayDesc = p.regularOpeningHours.weekdayDescriptions[0];
              if (todayDesc) {
                workingHours = todayDesc.replace(/^[A-Za-z]+:\s*/, '').replace(/^[^\s:]+:\s*/, '');
              }
            }

            // الكيانات تسحب كبيانات خام غير معتمدة تلقائياً لفرزها يدوياً
            const candidate: SpatialPlaceCandidate = {
              id: placeId,
              displayName: name,
              category: classification.categoryLabelAr,
              primaryType,
              primaryTypeDisplayName,
              formattedAddress,
              lat,
              lng,
              phone,
              rating,
              userRatingCount,
              workingHours,
              googleMapsUri,
              coverPhoto,
              photosCount: Array.isArray(p.photos) ? p.photos.length : 0,
              isDuplicate,
              isQualityApproved: false, // سحب خام لفرزه يدوياً
              qualityBadgeText: isDuplicate 
                ? 'مسجل مسبقاً (مكرر محفوظ)' 
                : `${classification.bucketLabelAr} ⭐ ${rating > 0 ? rating : 'جديد'}`,
              isCraft: !!classification.metadata.isCraft,
              bucket: classification.bucket,
              bucketLabelAr: classification.bucketLabelAr,
              classification,
            };

            allRaw.push(candidate);

            // الفرز إلى الأوعية الأربعة
            switch (classification.bucket) {
              case 'COMMERCIAL':
                commercial.push(candidate);
                break;
              case 'RESIDENTIAL':
                residential.push(candidate);
                break;
              case 'INFRASTRUCTURE':
                infrastructure.push(candidate);
                break;
              case 'CIVIC':
                civic.push(candidate);
                break;
            }
          }
        }
      } catch (err) {
        console.warn('Pure spatial cell scan error:', err);
      }

      // مهلة قصيرة بين استدعاءات الخلايا لضمان استقرار الشبكة
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  const estimatedCost = (apiCallsCount * 0.032).toFixed(3);

  return {
    commercial,
    residential,
    infrastructure,
    civic,
    allRaw,
    metrics: {
      totalRawFound,
      commercialCount: commercial.length,
      residentialCount: residential.length,
      infrastructureCount: infrastructure.length,
      civicCount: civic.length,
      duplicatesCount,
      cellsScanned: cells.length,
      apiCallsCount,
      estimatedCost: `$${estimatedCost}`,
    },
  };
}
