/**
 * ===============================================================================
 * 🌐 محرك التمشيط الشبكي الجغرافي واستيعاب القطاعات (Spatial Micro-Grid Mesh Scanner)
 * ===============================================================================
 * يقسم المستطيل الجغرافي للقطاع إلى مصفوفة خلايا مكانية مجهرية (Micro-Grid Cells)
 * ومحاور شوارع رئيسية لتجاوز سقف النتائج (60 نتيجة) وضمان استخراج 100% من الأنشطة
 * مع تمريرها على محرك الفرز الرباعي (classifyEntity).
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
 * تقسيم النطاق الجغرافي للقطاع إلى شبكة خلايا متوازنة
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

      cells.push({
        id: `cell_${r}_${c}`,
        name: `الخلية الميدانية (${cellCounter}/${rows * cols})`,
        box: {
          southLat: cellSouth,
          westLng: cellWest,
          northLat: cellNorth,
          eastLng: cellEast,
        },
        centerLat: (cellSouth + cellNorth) / 2,
        centerLng: (cellWest + cellEast) / 2,
      });
      cellCounter++;
    }
  }

  return cells;
}

/**
 * محرك تنفيذ المسح الشبكي واستيعاب كافة المنشآت مع الفرز الرباعي
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
    exhaustiveQueries?: string[];
    onProgress?: (progressText: string, currentFound: number) => void;
  }
): Promise<QuadBucketScanResult> {
  const rows = options?.gridRows || 2;
  const cols = options?.gridCols || 2;
  const cells = generateSectorMicroGrid(sectorBox, rows, cols);

  // استعلامات الاستيعاب الشامل المتنوعة داخل كل خلية
  const queriesToScan = options?.exhaustiveQueries && options.exhaustiveQueries.length > 0
    ? options.exhaustiveQueries
    : [
        `أنشطة ومحلات ومطاعم وخدمات في ${sectorName}`,
        `سوبرماركت وصيدليات وعيادات في ${sectorName}`,
        `ورش وصيانة وحرف ومكاتب في ${sectorName}`,
        `عمارات ومجمعات سكنية في ${sectorName}`,
      ];

  const fieldMask = [
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
    'nextPageToken',
  ].join(',');

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

  for (let cIdx = 0; cIdx < cells.length; cIdx++) {
    const cell = cells[cIdx];

    for (let qIdx = 0; qIdx < queriesToScan.length; qIdx++) {
      const q = queriesToScan[qIdx];
      let nextPageToken: string | undefined = undefined;
      let pageNum = 1;

      if (options?.onProgress) {
        options.onProgress(`مسح الخلية (${cIdx + 1}/${cells.length}) - المحور (${qIdx + 1}/${queriesToScan.length})...`, allRaw.length);
      }

      while (pageNum <= 2) {
        const searchBody: Record<string, unknown> = {
          textQuery: q,
          languageCode: 'ar',
          maxResultCount: 20,
          locationRestriction: {
            rectangle: {
              low: { latitude: cell.box.southLat, longitude: cell.box.westLng },
              high: { latitude: cell.box.northLat, longitude: cell.box.eastLng },
            },
          },
        };

        if (nextPageToken) {
          searchBody.pageToken = nextPageToken;
        }

        try {
          const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify(searchBody),
          });

          apiCallsCount++;

          if (!res.ok) {
            break;
          }

          const data = await res.json();
          const rawPlaces = Array.isArray(data.places) ? data.places : [];
          totalRawFound += rawPlaces.length;

          for (const p of rawPlaces) {
            const placeId = p.id || '';
            const name = (p.displayName?.text || '').trim();
            const lowerName = name.toLowerCase();

            // فحص التكرار الداخلي لمنع التكرار بين الخلايا والمحاور
            if (seenIds.has(placeId) || (name.length > 3 && seenNames.has(lowerName))) {
              continue;
            }

            seenIds.add(placeId);
            if (name.length > 3) seenNames.add(lowerName);

            // فحص التكرار مع قاعدة البيانات المسبقة
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
              isQualityApproved: true,
              qualityBadgeText: `${classification.bucketLabelAr} ⭐ ${rating > 0 ? rating : 'جديد'}`,
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

          nextPageToken = data.nextPageToken;
          if (!nextPageToken) break;

          pageNum++;
          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          console.warn('Micro-cell scan error:', err);
          break;
        }
      }
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
