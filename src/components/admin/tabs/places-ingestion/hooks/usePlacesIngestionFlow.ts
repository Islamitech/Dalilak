import { useState, useMemo } from 'react';
import { Business, User } from '../../../../../types';
import { saveBusinessToDb } from '../../../../../services/db';
import { getApiAuthHeaders } from '../../../../../utils/storage';
import { normalizeArabicText } from '../../../../../utils/arabicSearch';
import { classifyEntity, EntityBucket } from '../../../../../services/geo/entityClassifier';
import {
  executeSpatialMeshScan,
  generateSectorMicroGrid,
  GridCell,
  SpatialPlaceCandidate,
} from '../../../../../services/geo/spatialMeshScanner';
import { getCategoryFallbackCover } from '../../../../../utils/categoryPhotos';
import { HadayekSector } from '../../../../../services/geo/hadayekAtlasData';
import {
  CandidatePlace,
  BatchSearchMetrics,
  ScanChunkStatus,
  EnginePhase,
} from '../types';
import {
  GOOGLE_API_KEY,
  HADAYEK_SECTORS,
  FUTURE_EXPANSION_HUBS,
  CATEGORY_PRESETS,
  getIngestionSeenRecords,
  saveIngestionSeenRecords,
  clearIngestionSeenRecords,
  isCraftActivity,
} from '../constants';

interface UsePlacesIngestionFlowProps {
  currentUser: User;
  businesses: Business[];
  onAddBusiness?: (
    biz: Business,
    options?: {
      skipNavigation?: boolean;
      skipNotification?: boolean;
      skipInvoiceModal?: boolean;
    }
  ) => Promise<void> | void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const usePlacesIngestionFlow = ({
  currentUser,
  businesses,
  onAddBusiness,
  onShowNotification,
}: UsePlacesIngestionFlowProps) => {
  // 🏛️ State Management: Focused on Hadayek Al-Ahram Atlas Architecture
  const [selectedSectorIndex, setSelectedSectorIndex] = useState<number>(0);
  const [showExpansionHubs, setShowExpansionHubs] = useState<boolean>(false);
  const [selectedExpansionHubIndex, setSelectedExpansionHubIndex] = useState<number>(0);
  const [isExpansionHubActive, setIsExpansionHubActive] = useState<boolean>(false);
  const [isCustomHub, setIsCustomHub] = useState<boolean>(false);
  const [customHubName] = useState<string>('');

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('المنطقة أ حدائق الأهرام');

  // 🔢 نمط السحب: مسح شامل للقطاع (بدون حد أقصى) أو تحديد عدد معين
  const [isExhaustiveAtlasMode, setIsExhaustiveAtlasMode] = useState<boolean>(true);
  const [pullCount, setPullCount] = useState<number>(100);
  const [customScanRadius, setCustomScanRadius] = useState<number>(300);
  const [gridDensity, setGridDensity] = useState<'standard' | 'deep'>('deep');
  const [autoExcludePreviousScans, setAutoExcludePreviousScans] = useState<boolean>(true);
  const [enableDeepStratumScan, setEnableDeepStratumScan] = useState<boolean>(true);
  const [seenHistoryCount, setSeenHistoryCount] = useState<number>(
    () => getIngestionSeenRecords().seenIds.size
  );

  // ⭐ معايير الجودة الطبيعية
  const [minRating, setMinRating] = useState<number>(0.0);
  const [minReviews, setMinReviews] = useState<number>(0);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanChunkStatus, setScanChunkStatus] = useState<ScanChunkStatus | null>(null);

  const [candidatePlaces, setCandidatePlaces] = useState<CandidatePlace[]>([]);
  const [activeBucketTab, setActiveBucketTab] = useState<EntityBucket | 'ALL'>('COMMERCIAL');
  const [metrics, setMetrics] = useState<BatchSearchMetrics | null>(null);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());
  const [filterOnlyQualified, setFilterOnlyQualified] = useState<boolean>(false);
  const [showDuplicates, setShowDuplicates] = useState<boolean>(false);
  const [enginePhase, setEnginePhase] = useState<EnginePhase>('IDLE');

  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestProgress, setIngestProgress] = useState<{ current: number; total: number } | null>(null);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);
  const [pulledPhotosPreview, setPulledPhotosPreview] = useState<Array<{ id: string; name: string; photo: string }>>([]);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  // Current active Sector / Hub resolution
  const currentSector: HadayekSector = HADAYEK_SECTORS[selectedSectorIndex] || HADAYEK_SECTORS[0];
  const currentCat = CATEGORY_PRESETS[selectedCategoryIndex];

  // Auto-compose search query upon Sector or Category change
  const handleSectorChange = (idx: number) => {
    setSelectedSectorIndex(idx);
    setIsExpansionHubActive(false);
    setIsCustomHub(false);
    const sector = HADAYEK_SECTORS[idx];
    const cat = CATEGORY_PRESETS[selectedCategoryIndex];
    if (sector) {
      if (selectedCategoryIndex === 0) {
        setSearchQuery(sector.query);
      } else if (cat) {
        setSearchQuery(`${cat.keyword} في ${sector.subZone} حدائق الأهرام`);
      }
    }
  };

  const handleExpansionHubChange = (idx: number) => {
    setSelectedExpansionHubIndex(idx);
    setIsExpansionHubActive(true);
    setIsCustomHub(false);
    const h = FUTURE_EXPANSION_HUBS[idx];
    const cat = CATEGORY_PRESETS[selectedCategoryIndex];
    if (h && cat) {
      setSearchQuery(`${cat.keyword} في ${h.query}`);
    }
  };

  const handleCategoryChange = (catIdx: number) => {
    setSelectedCategoryIndex(catIdx);
    const cat = CATEGORY_PRESETS[catIdx];
    if (isExpansionHubActive) {
      const h = FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex];
      if (cat && h) setSearchQuery(`${cat.keyword} في ${h.query}`);
    } else if (isCustomHub) {
      if (cat && customHubName) setSearchQuery(`${cat.keyword} في ${customHubName}`);
    } else {
      if (catIdx === 0) {
        setSearchQuery(currentSector.query);
      } else if (cat) {
        setSearchQuery(`${cat.keyword} في ${currentSector.subZone} حدائق الأهرام`);
      }
    }
    if (cat) {
      setMinRating(cat.defaultMinRating);
      setMinReviews(cat.defaultMinReviews);
    }
  };

  // 🎯 تدقيق منشآت القطاع المسجلة مسبقاً في قاعدة البيانات
  const existingSectorBusinessesCount = useMemo(() => {
    const sub = (currentSector?.subZone || '').toLowerCase();
    return businesses.filter((b) => {
      const text = `${b.street || ''} ${b.landmark || ''} ${b.description || ''} ${b.nameAr || ''}`.toLowerCase();
      return text.includes(sub) || (sub === 'المنطقة أ' && text.includes('منطقة أ'));
    }).length;
  }, [businesses, currentSector]);

  // ⚡ DIRECT RESILIENT ATLAS CHUNK ENGINE WITH SPATIAL GRID & ENTITY FILTERING
  const executeAtlasChunkSearch = async (
    targetSector: HadayekSector,
    catIndex: number,
    isExhaustive: boolean,
    limitCount: number,
    thresholdRating: number,
    thresholdReviews: number
  ): Promise<{ places: CandidatePlace[]; metrics: BatchSearchMetrics }> => {
    const isAtlasAllMode = catIndex === 0;

    // 🗺️ توليد بؤر الشبكة المكانية الدقيقة (Spatial Micro-Grid) في وضع أطلس لتغطية كافة الأزقة والشوارع الداخلية
    const gridNodes: GridCell[] = (!isCustomHub && !isExpansionHubActive && targetSector.southLat && targetSector.northLat)
      ? generateSectorMicroGrid({
          southLat: targetSector.southLat,
          westLng: targetSector.westLng,
          northLat: targetSector.northLat,
          eastLng: targetSector.eastLng,
        }, 2, 2)
      : [];

    let searchPasses: Array<{
      query: string;
      center?: { latitude: number; longitude: number };
      radius?: number;
      label: string;
    }> = [];

    if (isAtlasAllMode) {
      if (gridNodes.length > 0) {
        searchPasses = gridNodes.map((node: GridCell, nIdx: number) => ({
          query: `محلات وأنشطة وخدمات في ${targetSector.subZone} حدائق الأهرام`,
          center: { latitude: node.centerLat, longitude: node.centerLng },
          radius: 300,
          label: `بؤرة شبكية #${nIdx + 1}/${gridNodes.length}`,
        }));

        searchPasses.unshift({
          query: targetSector.query,
          label: `المسح الشامل لقطاع ${targetSector.subZone}`,
        });
      } else {
        searchPasses = [
          { query: targetSector.query, label: 'الاستعلام العام للقطاع' },
          { query: `محلات وسوبرماركت وأسواق في ${targetSector.subZone} حدائق الأهرام`, label: 'محور الأسواق والتجزئة' },
          { query: `مطاعم وكافيهات ومخابز في ${targetSector.subZone} حدائق الأهرام`, label: 'محور الأغذية والمشروبات' },
          { query: `صيدليات وعيادات ومراكز طبية في ${targetSector.subZone} حدائق الأهرام`, label: 'محور الصحة والعيادات' },
          { query: `خدمات وصيانة وورش وحرفيين في ${targetSector.subZone} حدائق الأهرام`, label: 'محور الصيانة والورش' },
        ];
      }
    } else {
      searchPasses = [{ query: searchQuery.trim(), label: currentCat?.label || 'الفئة المحددة' }];
    }

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

    const existingIds = new Set<string>();
    businesses.forEach((b) => {
      if (b.googlePlaceId) existingIds.add(b.googlePlaceId);
      if (b.googleMapsUrl) {
        const m = b.googleMapsUrl.match(/place_id:([A-Za-z0-9_-]+)/);
        if (m) existingIds.add(m[1]);
      }
    });
    const existingNames = new Set(businesses.map((b) => normalizeArabicText(b.nameAr || b.name || '')));

    if (autoExcludePreviousScans) {
      const history = getIngestionSeenRecords();
      history.seenIds.forEach((id) => existingIds.add(id));
      history.seenNames.forEach((n) => existingNames.add(normalizeArabicText(n)));
    }

    // 🌐 النمط السيادي: التمشيط الشبكي الجغرافي الخالص (Pure Spatial Micro-Grid Mesh) دون نصوص أو مسميات
    if (!isCustomHub && !isExpansionHubActive && targetSector.southLat && targetSector.northLat) {
      const meshResult = await executeSpatialMeshScan(
        {
          southLat: targetSector.southLat,
          westLng: targetSector.westLng,
          northLat: targetSector.northLat,
          eastLng: targetSector.eastLng,
        },
        `${targetSector.subZone} حدائق الأهرام`,
        GOOGLE_API_KEY,
        existingIds,
        existingNames,
        {
          gridRows: gridDensity === 'deep' ? 3 : 2,
          gridCols: gridDensity === 'deep' ? 3 : 2,
          customRadiusMeters: customScanRadius,
          categoryType: currentCat.type,
          enableDeepStratumScan: enableDeepStratumScan,
          onProgress: (stepText: string, currentFound: number) => {
            setScanChunkStatus({
              stepText,
              chunkNumber: 1,
              totalFoundSoFar: currentFound,
              newFoundSoFar: currentFound,
              duplicatesSoFar: 0,
            });
          },
        }
      );

      const mappedPlaces: CandidatePlace[] = meshResult.allRaw.map((p: SpatialPlaceCandidate) => ({
        id: p.id,
        displayName: p.displayName,
        category: p.category,
        primaryType: p.primaryType,
        primaryTypeDisplayName: p.primaryTypeDisplayName,
        formattedAddress: p.formattedAddress,
        lat: p.lat,
        lng: p.lng,
        phone: p.phone,
        rating: p.rating,
        userRatingCount: p.userRatingCount,
        workingHours: p.workingHours,
        googleMapsUri: p.googleMapsUri,
        coverPhoto: p.coverPhoto,
        photosCount: p.photosCount,
        isDuplicate: p.isDuplicate,
        isQualityApproved: false,
        qualityBadgeText: p.qualityBadgeText,
        isCraft: p.isCraft,
        bucket: p.bucket,
        bucketLabelAr: p.bucketLabelAr,
        classification: p.classification,
      }));

      return {
        places: mappedPlaces,
        metrics: {
          totalFound: meshResult.metrics.totalRawFound,
          duplicatesCount: meshResult.metrics.duplicatesCount,
          qualifiedCount: meshResult.metrics.commercialCount,
          excludedCount: meshResult.metrics.residentialCount + meshResult.metrics.infrastructureCount + meshResult.metrics.civicCount,
          commercialCount: meshResult.metrics.commercialCount,
          residentialCount: meshResult.metrics.residentialCount,
          infrastructureCount: meshResult.metrics.infrastructureCount,
          civicCount: meshResult.metrics.civicCount,
          spatialNodesCount: meshResult.metrics.cellsScanned,
          estimatedCost: meshResult.metrics.estimatedCost,
        },
      };
    }

    const seenIdsInScan = new Set<string>();
    const seenNamesInScan = new Set<string>();

    const accumulatedPlaces: CandidatePlace[] = [];
    let duplicatesCount = 0;
    let qualifiedCount = 0;
    let excludedEntitiesCount = 0;
    let commercialCount = 0;
    let residentialCount = 0;
    let infrastructureCount = 0;
    let civicCount = 0;
    let totalRawFound = 0;
    let totalApiCalls = 0;
    let chunkCounter = 0;

    for (let passIdx = 0; passIdx < searchPasses.length; passIdx++) {
      const pass = searchPasses[passIdx];
      let nextPageToken: string | undefined = undefined;
      let pageNum = 1;
      const maxPages = isAtlasAllMode && gridNodes.length > 0 ? 1 : (isExhaustive ? 3 : Math.ceil(limitCount / 20));

      while (pageNum <= maxPages) {
        chunkCounter++;
        setScanChunkStatus({
          stepText: `مسح (${passIdx + 1}/${searchPasses.length}) - ${pass.label}: استدعاء الجزء ${chunkCounter}...`,
          chunkNumber: chunkCounter,
          totalFoundSoFar: totalRawFound,
          newFoundSoFar: accumulatedPlaces.length,
          duplicatesSoFar: duplicatesCount,
          excludedSoFar: excludedEntitiesCount,
        });

        const searchBody: Record<string, unknown> = {
          textQuery: pass.query,
          languageCode: 'ar',
          maxResultCount: 20,
        };

        if (nextPageToken) {
          searchBody.pageToken = nextPageToken;
        }

        if (pass.center && pass.radius) {
          searchBody.locationBias = {
            circle: {
              center: pass.center,
              radius: pass.radius,
            },
          };
        } else if (!isCustomHub && !isExpansionHubActive) {
          searchBody.locationRestriction = {
            rectangle: {
              low: { latitude: targetSector.southLat, longitude: targetSector.westLng },
              high: { latitude: targetSector.northLat, longitude: targetSector.eastLng },
            },
          };
        } else if (isExpansionHubActive) {
          const h = FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex];
          if (h?.lat && h?.lng) {
            searchBody.locationBias = {
              circle: {
                center: { latitude: h.lat, longitude: h.lng },
                radius: 6000.0,
              },
            };
          }
        }

        try {
          const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify(searchBody),
          });

          totalApiCalls++;

          if (!googleRes.ok) {
            console.warn(`Places API Chunk call returned ${googleRes.status}`);
            break;
          }

          const googleData = await googleRes.json();
          const rawPlaces = Array.isArray(googleData.places) ? googleData.places : [];
          totalRawFound += rawPlaces.length;

          for (const p of rawPlaces) {
            const placeId = p.id || '';
            const name = (p.displayName?.text || '').trim();
            const normName = normalizeArabicText(name);

            const classification = classifyEntity({
              id: placeId,
              displayName: name,
              primaryType: p.primaryType,
              primaryTypeDisplayName: p.primaryTypeDisplayName?.text,
              types: Array.isArray(p.types) ? p.types : [],
              formattedAddress: p.formattedAddress,
              lat: p.location?.latitude,
              lng: p.location?.longitude,
            });

            if (classification.bucket === 'COMMERCIAL') {
              commercialCount++;
            } else if (classification.bucket === 'RESIDENTIAL') {
              residentialCount++;
              excludedEntitiesCount++;
            } else if (classification.bucket === 'INFRASTRUCTURE') {
              infrastructureCount++;
              excludedEntitiesCount++;
            } else if (classification.bucket === 'CIVIC') {
              civicCount++;
              excludedEntitiesCount++;
            }

            const isDupInDb = existingIds.has(placeId) || (normName.length > 2 && existingNames.has(normName));
            const isDupInScan = seenIdsInScan.has(placeId) || (normName.length > 2 && seenNamesInScan.has(normName));

            if (isDupInScan) {
              continue;
            }

            seenIdsInScan.add(placeId);
            if (normName.length > 2) seenNamesInScan.add(normName);

            const isDuplicate = isDupInDb;
            if (isDuplicate) {
              duplicatesCount++;
            }

            const primaryType = p.primaryType || '';
            const primaryTypeDisplayName = p.primaryTypeDisplayName?.text || '';
            const rating = typeof p.rating === 'number' ? p.rating : 0;
            const userRatingCount = typeof p.userRatingCount === 'number' ? p.userRatingCount : 0;
            const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || '';
            const formattedAddress = p.formattedAddress || '';
            const lat = p.location?.latitude;
            const lng = p.location?.longitude;
            const googleMapsUri = p.googleMapsUri || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : '');

            const isCraft = isCraftActivity(primaryType, primaryTypeDisplayName, name) || currentCat.type === 'craft' || !!classification.metadata.isCraft;
            const isQualityApproved = classification.bucket === 'COMMERCIAL'
              ? (catIndex === 0 ? true : (rating >= thresholdRating && userRatingCount >= thresholdReviews))
              : false;

            let qualityBadgeText = '';
            if (classification.bucket === 'COMMERCIAL') {
              if (catIndex === 0) {
                qualityBadgeText = `منشأة موثقة في أطلس ${targetSector.subZone} ⭐ ${rating > 0 ? rating : 'جديد'}`;
                if (!isDuplicate) qualifiedCount++;
              } else if (isQualityApproved) {
                qualityBadgeText = `${isCraft ? 'حرفي معتمد' : 'رائج معتمد'} ⭐ ${rating} (${userRatingCount} مقيّم)`;
                if (!isDuplicate) qualifiedCount++;
              } else {
                qualityBadgeText = `دون المعايير الطبيعية (${rating}★ و ${userRatingCount} مقيّم)`;
              }
            } else {
              qualityBadgeText = `${classification.bucketLabelAr} (مستبعد من الدليل التجاري)`;
            }

            let coverPhoto: string | undefined = undefined;
            if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
              const photoName = p.photos[0].name;
              if (photoName) {
                coverPhoto = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_API_KEY}`;
              }
            }

            let workingHours: string | undefined = undefined;
            if (p.regularOpeningHours?.weekdayDescriptions && Array.isArray(p.regularOpeningHours.weekdayDescriptions)) {
              const todayDesc = p.regularOpeningHours.weekdayDescriptions[0];
              if (todayDesc) {
                workingHours = todayDesc.replace(/^[A-Za-z]+:\s*/, '').replace(/^[^\s:]+:\s*/, '');
              }
            }

            accumulatedPlaces.push({
              id: placeId,
              displayName: name,
              category: classification.categoryLabelAr || primaryTypeDisplayName || (catIndex === 0 ? 'نشاط تجاري وخدمي' : currentCat.label),
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
              isQualityApproved,
              qualityBadgeText,
              isCraft,
              bucket: classification.bucket,
              bucketLabelAr: classification.bucketLabelAr,
              classification,
            });

            if (!isExhaustive && accumulatedPlaces.length >= limitCount) {
              break;
            }
          }

          if (!isExhaustive && accumulatedPlaces.length >= limitCount) {
            break;
          }

          nextPageToken = googleData.nextPageToken;
          if (!nextPageToken) {
            break;
          }

          pageNum++;
          await new Promise((r) => setTimeout(r, 600));
        } catch (callErr) {
          console.warn('Chunk search error:', callErr);
          break;
        }
      }

      if (!isExhaustive && accumulatedPlaces.length >= limitCount) {
        break;
      }
    }

    const estimatedCost = (totalApiCalls * 0.032).toFixed(3);

    return {
      places: accumulatedPlaces,
      metrics: {
        totalFound: totalRawFound,
        duplicatesCount,
        qualifiedCount,
        excludedCount: excludedEntitiesCount,
        commercialCount,
        residentialCount,
        infrastructureCount,
        civicCount,
        spatialNodesCount: gridNodes.length,
        estimatedCost: `$${estimatedCost}`,
      },
    };
  };

  // 🚀 تشغيل المسح المباشر بنمط أطلس حدائق الأهرام
  const handleExecuteScan = async () => {
    setIsScanning(true);
    setEnginePhase('SCANNING');
    setMetrics(null);
    setCandidatePlaces([]);
    setSelectedPlaceIds(new Set());
    setIngestionMessage(null);

    try {
      const data = await executeAtlasChunkSearch(
        currentSector,
        selectedCategoryIndex,
        isExhaustiveAtlasMode,
        pullCount,
        minRating,
        minReviews
      );

      if (data && Array.isArray(data.places)) {
        setCandidatePlaces(data.places);
        setMetrics(data.metrics);
        setSeenHistoryCount(getIngestionSeenRecords().seenIds.size);
        setSelectedPlaceIds(new Set());
        setEnginePhase('DISCOVERED');

        const newCount = data.places.filter((p) => !p.isDuplicate).length;
        const dupCount = data.places.filter((p) => p.isDuplicate).length;
        const msg = `🏛️ تم استكشاف ${data.places.length} كياناً في ${currentSector.subZone} (${newCount} منشأة جديدة بالكامل، و ${dupCount} مكرر تم استبعاده وحمايته من الهدر).`;
        if (onShowNotification) onShowNotification(msg, 'success');
      } else {
        throw new Error('لم يتم استلام أي نتائج من محرك خرائط Google');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'فشل الاتصال بمحرك البحث لخرائط Google';
      if (onShowNotification) onShowNotification(errMsg, 'error');
      setEnginePhase('IDLE');
    } finally {
      setIsScanning(false);
      setScanChunkStatus(null);
    }
  };

  // Filtered displayed places with Quad-Bucket segregation and strict duplicate suppression
  const displayedPlaces = useMemo(() => {
    let list = candidatePlaces;
    if (activeBucketTab !== 'ALL') {
      list = list.filter((p) => p.bucket === activeBucketTab);
    }
    if (!showDuplicates) {
      list = list.filter((p) => !p.isDuplicate);
    }
    if (!filterOnlyQualified) return list;
    return list.filter((p) => (p.bucket === 'COMMERCIAL' ? p.isQualityApproved : true));
  }, [candidatePlaces, activeBucketTab, filterOnlyQualified, showDuplicates]);

  // Selection toggles
  const handleToggleSelectAll = () => {
    if (selectedPlaceIds.size === displayedPlaces.length) {
      setSelectedPlaceIds(new Set());
    } else {
      setSelectedPlaceIds(new Set(displayedPlaces.map((p) => p.id)));
    }
  };

  const handleTogglePlace = (id: string) => {
    setSelectedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectTop100Commercial = () => {
    const commercialOnly = candidatePlaces.filter(
      (p) => p.bucket === 'COMMERCIAL' && (!showDuplicates ? !p.isDuplicate : true)
    );
    const top100 = commercialOnly.slice(0, 100).map((p) => p.id);
    setSelectedPlaceIds(new Set(top100));
    setActiveBucketTab('COMMERCIAL');
    if (onShowNotification) {
      onShowNotification(
        `تم تحديد دفعة الـ ${top100.length} منشأة الأولى — اضغط زر السحب لحقنها بالصور!`,
        'info'
      );
    }
  };

  // 📷 فحص ومعاينة صورة Google لمكان محدد عند الطلب
  const handlePreviewPhoto = async (id: string, name: string, category: string) => {
    setLoadingPreviewId(id);
    try {
      let photoUri = '';
      try {
        const vRes = await fetch('/api/places-enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googlePlaceId: id, placeName: name }),
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData?.photo) photoUri = vData.photo;
        }
      } catch {}

      if (!photoUri) {
        try {
          const directRes = await fetch(
            `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
            {
              headers: {
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'id,photos',
              },
            }
          );
          if (directRes.ok) {
            const dData = await directRes.json();
            if (dData.photos?.[0]?.name) {
              const mRes = await fetch(
                `https://places.googleapis.com/v1/${dData.photos[0].name}/media?maxHeightPx=800&maxWidthPx=800&key=${GOOGLE_API_KEY}&skipHttpRedirect=true`
              );
              if (mRes.ok) {
                const mData = await mRes.json();
                if (mData?.photoUri) photoUri = mData.photoUri;
              }
            }
          }
        } catch {}
      }

      if (!photoUri && name) {
        try {
          const sRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': 'places.photos',
            },
            body: JSON.stringify({
              textQuery: `${name} حدائق الاهرام`,
              languageCode: 'ar',
            }),
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            const firstFound = sData.places?.[0]?.photos?.[0];
            if (firstFound?.name) {
              const mRes = await fetch(
                `https://places.googleapis.com/v1/${firstFound.name}/media?maxHeightPx=800&maxWidthPx=800&key=${GOOGLE_API_KEY}&skipHttpRedirect=true`
              );
              if (mRes.ok) {
                const mData = await mRes.json();
                if (mData?.photoUri) photoUri = mData.photoUri;
              }
            }
          }
        } catch {}
      }

      const finalPhoto = photoUri || getCategoryFallbackCover(category);
      setCandidatePlaces((prev) =>
        prev.map((c) => (c.id === id ? { ...c, coverPhoto: finalPhoto } : c))
      );

      if (photoUri) {
        if (onShowNotification) onShowNotification(`تم سحب ومعاينة صورة Google الرسمية لـ "${name}" بنجاح!`, 'success');
      } else {
        if (onShowNotification) onShowNotification(`لا تتوفر صورة لهذا النشاط في Google Maps — تم تطبيق صورة الغلاف المعتمدة للتصنيف`, 'info');
      }
    } catch (err: any) {
      if (onShowNotification) onShowNotification('تعذر جلب صورة النشاط حالياً', 'warning');
    } finally {
      setLoadingPreviewId(null);
    }
  };

  // 🚀 استيراد وحقن المنشآت التجارية المختارة بنمط أطلس حدائق الأهرام
  const handleIngestSelected = async () => {
    if (selectedPlaceIds.size === 0) {
      if (onShowNotification) onShowNotification('يرجى تحديد منشأة تجارية واحدة على الأقل للاستيراد', 'warning');
      return;
    }

    const placesToIngest = candidatePlaces
      .filter((p) => selectedPlaceIds.has(p.id))
      .filter((p) => p.bucket === 'COMMERCIAL');

    if (placesToIngest.length === 0) {
      if (onShowNotification) {
        onShowNotification('تنبيه أمان: تم حجب الاستيراد لأن العناصر المحددة ليست أنشطة تجارية (عقارات سكنية أو شوارع ومرافق)', 'warning');
      }
      return;
    }
    setIsIngesting(true);
    setEnginePhase('INGESTING');
    setIngestProgress({ current: 0, total: placesToIngest.length });

    let successCount = 0;
    const ingestedPlaces: typeof placesToIngest = [];
    const pulledShowcase: Array<{ id: string; name: string; photo: string }> = [];

    try {
      for (let i = 0; i < placesToIngest.length; i++) {
        const p = placesToIngest[i];
        setIngestProgress({ current: i + 1, total: placesToIngest.length });

        let enrichedPhoto = p.coverPhoto;
        let enrichedPhone = p.phone || '';
        let enrichedRating = p.rating || 0;
        let enrichedRatingCount = p.userRatingCount || 0;
        let enrichedHours = p.workingHours;

        try {
          let enrichData: any = null;
          try {
            const enrichRes = await fetch('/api/admin/places-enrich', {
              method: 'POST',
              headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ googlePlaceId: p.id, placeName: p.displayName }),
            });
            if (enrichRes.ok) {
              const resJson = await enrichRes.json();
              if (resJson && resJson.success) enrichData = resJson;
            }
          } catch {}

          if (!enrichData || !enrichData.photo) {
            try {
              const vRes = await fetch('/api/places-enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googlePlaceId: p.id, placeName: p.displayName }),
              });
              if (vRes.ok) {
                const vJson = await vRes.json();
                if (vJson && vJson.success) enrichData = vJson;
              }
            } catch {}
          }

          if (enrichData && enrichData.success) {
            enrichedPhoto = enrichData.photo || enrichedPhoto;
            enrichedPhone = enrichData.phone || enrichedPhone;
            enrichedRating = enrichData.rating || enrichedRating;
            enrichedRatingCount = enrichData.ratingCount || enrichedRatingCount;
            enrichedHours = enrichData.workingHours || enrichedHours;
          }

          if (!enrichedPhoto && p.id) {
            try {
              const directRes = await fetch(
                `https://places.googleapis.com/v1/places/${encodeURIComponent(p.id)}`,
                {
                  headers: {
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'id,photos,internationalPhoneNumber,nationalPhoneNumber,rating,userRatingCount,regularOpeningHours',
                  },
                }
              );
              if (directRes.ok) {
                const dData = await directRes.json();
                if (dData.photos && Array.isArray(dData.photos) && dData.photos.length > 0) {
                  const firstPhotoName = dData.photos[0].name;
                  if (firstPhotoName) {
                    try {
                      const mRes = await fetch(
                        `https://places.googleapis.com/v1/${firstPhotoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_API_KEY}&skipHttpRedirect=true`
                      );
                      if (mRes.ok) {
                        const mData = await mRes.json();
                        if (mData?.photoUri) enrichedPhoto = mData.photoUri;
                      }
                    } catch {}
                    if (!enrichedPhoto) {
                      enrichedPhoto = `https://places.googleapis.com/v1/${firstPhotoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_API_KEY}`;
                    }
                  }
                }
                enrichedPhone = dData.internationalPhoneNumber || dData.nationalPhoneNumber || enrichedPhone;
                enrichedRating = dData.rating || enrichedRating;
                enrichedRatingCount = dData.userRatingCount || enrichedRatingCount;
                if (dData.regularOpeningHours?.weekdayDescriptions?.[0]) {
                  enrichedHours = dData.regularOpeningHours.weekdayDescriptions[0].replace(/^[A-Za-z]+:\s*/, '').replace(/^[^\s:]+:\s*/, '');
                }
              }
            } catch (directErr) {
              console.warn('⚠️ Direct Places Details fallback warning:', directErr);
            }
          }

          if (!enrichedPhoto && p.displayName) {
            try {
              const sRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': GOOGLE_API_KEY,
                  'X-Goog-FieldMask': 'places.photos',
                },
                body: JSON.stringify({
                  textQuery: `${p.displayName} حدائق الاهرام`,
                  languageCode: 'ar',
                }),
              });
              if (sRes.ok) {
                const sData = await sRes.json();
                const firstFound = sData.places?.[0]?.photos?.[0];
                if (firstFound?.name) {
                  const mRes = await fetch(
                    `https://places.googleapis.com/v1/${firstFound.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_API_KEY}&skipHttpRedirect=true`
                  );
                  if (mRes.ok) {
                    const mData = await mRes.json();
                    if (mData?.photoUri) enrichedPhoto = mData.photoUri;
                  }
                  if (!enrichedPhoto) {
                    enrichedPhoto = `https://places.googleapis.com/v1/${firstFound.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_API_KEY}`;
                  }
                }
              }
            } catch {}
          }
        } catch (enrichErr) {
          console.warn('⚠️ فشل إثراء بيانات المنشأة:', p.id, enrichErr);
        }

        const finalCoverPhoto = enrichedPhoto || getCategoryFallbackCover(p.category || (selectedCategoryIndex === 0 ? 'نشاط تجاري وخدمي' : currentCat.label));

        const resolvedGov = isExpansionHubActive ? FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex]?.gov || 'الجيزة' : 'الجيزة';
        const resolvedCity = isExpansionHubActive ? FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex]?.city || 'حدائق الأهرام' : 'حدائق الأهرام';
        const resolvedStreet = isExpansionHubActive 
          ? (p.formattedAddress || resolvedCity) 
          : `${currentSector.subZone} - حدائق الأهرام`;
        const resolvedLandmark = isExpansionHubActive
          ? 'منشأة معتمدة بالمنطقة'
          : (currentSector.gate ? `${currentSector.gate} - ${currentSector.subZone}` : `حدائق الأهرام - ${currentSector.subZone}`);

        const newBiz: Business = {
          id: `biz_atlas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          nameAr: p.displayName,
          category: p.category || (selectedCategoryIndex === 0 ? 'نشاط تجاري وخدمي' : currentCat.label),
          governorate: resolvedGov,
          city: resolvedCity,
          street: resolvedStreet,
          landmark: resolvedLandmark,
          phone: enrichedPhone,
          workingHours: enrichedHours || 'يومياً: 09:00 ص - 11:00 م',
          description: `${p.displayName} - منشأة موثقة في دليل وأطلس حدائق الأهرام (${currentSector.subZone})`,
          lat: p.lat || currentSector.lat,
          lng: p.lng || currentSector.lng,
          ownerName: `إدارة ${p.displayName}`,
          ownerPhone: enrichedPhone,
          photos: [finalCoverPhoto],
          coverPhoto: finalCoverPhoto,
          repId: currentUser.id || 'admin_platform',
          repName: 'إدارة أطلس دليلك',
          packageId: 'pkg_exempt',
          packageName: 'باقة أطلس الشرفية (إدراج معتمد)',
          packagePrice: 0,
          amountPaid: 0,
          paymentStatus: 'fully_paid',
          verificationStatus: 'verified',
          publishedStatus: 'published',
          isFeeExempt: true,
          feeExemptionReason: `إدراج شرفي معتمد وموثق في أطلس ${currentSector.subZone}`,
          isAlreadyOnGoogle: true,
          googlePlaceId: p.id,
          googleMapsUrl: p.googleMapsUri || (p.id ? `https://www.google.com/maps/place/?q=place_id:${p.id}` : ''),
          googleRatingEnabled: enrichedRating > 0,
          googleRating: enrichedRating,
          googleReviewsCount: enrichedRatingCount,
          invoiceNumber: `ATL-${Date.now().toString().slice(-6)}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          createdDate: new Date().toISOString(),
        };

        if (onAddBusiness) {
          await onAddBusiness(newBiz, {
            skipNavigation: true,
            skipNotification: true,
            skipInvoiceModal: true,
          });
        } else {
          await saveBusinessToDb(newBiz);
        }
        successCount++;
        ingestedPlaces.push(p);
        pulledShowcase.push({ id: p.id, name: p.displayName, photo: finalCoverPhoto });

        setCandidatePlaces((prev) =>
          prev.map((c) =>
            c.id === p.id
              ? {
                  ...c,
                  coverPhoto: finalCoverPhoto,
                  phone: enrichedPhone || c.phone,
                  rating: enrichedRating || c.rating,
                  userRatingCount: enrichedRatingCount || c.userRatingCount,
                  workingHours: enrichedHours || c.workingHours,
                  isDuplicate: true,
                }
              : c
          )
        );
      }

      const finishMsg = `🎉 تم بنجاح سحب وتوثيق وحقن ${successCount} منشأة مع صورها وتفاصيلها الكاملة في أطلس ${currentSector.subZone}!`;
      setIngestionMessage(finishMsg);
      setPulledPhotosPreview(pulledShowcase);
      if (onShowNotification) onShowNotification(finishMsg, 'success');

      if (ingestedPlaces.length > 0) {
        saveIngestionSeenRecords(ingestedPlaces);
        setSeenHistoryCount(getIngestionSeenRecords().seenIds.size);
      }

      setSelectedPlaceIds(new Set());
      setEnginePhase('DONE');
    } catch (err: any) {
      const errMsg = `حدث خطأ أثناء الاستيراد: ${err?.message || 'تعذر استكمال حفظ المنشآت'}`;
      if (onShowNotification) onShowNotification(errMsg, 'error');
      setEnginePhase('DISCOVERED');
    } finally {
      setIsIngesting(false);
      setIngestProgress(null);
    }
  };

  const handleClearHistoryCache = () => {
    if (window.confirm('هل تريد تصفير ذاكرة التكرار المؤقتة وإعادة إتاحة سحب كافة الأماكن من البداية؟')) {
      clearIngestionSeenRecords();
      setSeenHistoryCount(0);
      if (onShowNotification) onShowNotification('تم تصفير ذاكرة السحوبات السابقة بنجاح', 'info');
    }
  };

  return {
    selectedSectorIndex,
    showExpansionHubs,
    setShowExpansionHubs,
    selectedExpansionHubIndex,
    isExpansionHubActive,
    isCustomHub,
    customHubName,
    selectedCategoryIndex,
    searchQuery,
    setSearchQuery,
    isExhaustiveAtlasMode,
    setIsExhaustiveAtlasMode,
    pullCount,
    setPullCount,
    customScanRadius,
    setCustomScanRadius,
    gridDensity,
    setGridDensity,
    autoExcludePreviousScans,
    setAutoExcludePreviousScans,
    enableDeepStratumScan,
    setEnableDeepStratumScan,
    seenHistoryCount,
    minRating,
    setMinRating,
    minReviews,
    setMinReviews,
    isScanning,
    scanChunkStatus,
    candidatePlaces,
    activeBucketTab,
    setActiveBucketTab,
    metrics,
    selectedPlaceIds,
    filterOnlyQualified,
    setFilterOnlyQualified,
    showDuplicates,
    setShowDuplicates,
    enginePhase,
    isIngesting,
    ingestProgress,
    ingestionMessage,
    pulledPhotosPreview,
    loadingPreviewId,
    currentSector,
    currentCat,
    existingSectorBusinessesCount,
    displayedPlaces,
    handleSectorChange,
    handleExpansionHubChange,
    handleCategoryChange,
    handleExecuteScan,
    handleToggleSelectAll,
    handleTogglePlace,
    handleSelectTop100Commercial,
    handlePreviewPhoto,
    handleIngestSelected,
    handleClearHistoryCache,
  };
};

export type PlacesIngestionFlowReturn = ReturnType<typeof usePlacesIngestionFlow>;
