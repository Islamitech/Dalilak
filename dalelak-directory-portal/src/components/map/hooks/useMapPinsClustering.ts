import { useEffect } from 'react';
import { Business } from '../../../types';
import { HADAYEK_OFFICIAL_DISTRICTS, HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import { escapeHtml } from '../constants/mapConstants';
import { createLightweightBadgeHtml, createLightweightClusterHtml } from '../badgeMarkers';
import { useMapInstance } from './useMapInstance';
import { useMapState } from './useMapState';

export interface UseMapPinsClusteringProps {
  mapInstance: ReturnType<typeof useMapInstance>;
  state: ReturnType<typeof useMapState>;
  mode?: 'picker' | 'view';
  businesses: Business[];
  showHadayekGates?: boolean;
  targetBuilding?: {
    zoneLetter?: string;
    buildingNumber?: string;
    lat?: number;
    lng?: number;
  } | null;
  onSelectBusiness?: (biz: Business) => void;
  onSelectZone?: (zoneLetter: string) => void;
}

export const useMapPinsClustering = ({
  mapInstance,
  state,
  mode = 'view',
  businesses,
  showHadayekGates = true,
  targetBuilding,
  onSelectBusiness,
  onSelectZone,
}: UseMapPinsClusteringProps) => {
  const {
    leafletMapRef,
    markersGroupRef,
    pickerMarkerRef,
    accuracyCircleRef,
    currentLat,
    currentLng,
    zoomLevel,
    gpsAccuracy,
    updateSelectedPosition,
  } = mapInstance;

  const {
    showBusinesses,
    selectedGovFilter,
    mapCategoryFilter,
    onlyVerifiedFilter,
    selectedBiz,
    setSelectedBiz,
    showDistrictsOverlay,
    showGatesLayer,
    showTargetPin,
  } = state;

  useEffect(() => {
    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup || !window.L) return;

    markersGroup.clearLayers();

    if (mode === 'picker') {
      // 🌟 Precision Needle Pin (Direct Anchor at the tip of the needle: [18, 68])
      const pickerIcon = window.L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-weight: 900; font-size: 11px; padding: 3px 10px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); white-space: nowrap; border: 1.5px solid #fef08a; margin-bottom: 2px; display: inline-flex; align-items: center; gap: 4px; font-family: Cairo, sans-serif;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#020617" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              <span>موقع المنشأة المحدد</span>
            </div>
            <div style="position: relative; width: 36px; height: 46px; display: flex; justify-content: center;">
              <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
                <path d="M18 0C8.05887 0 0 8.05887 0 18C0 30.5 18 46 18 46C18 46 36 30.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="#F59E0B"/>
                <path d="M18 2C9.16344 2 2 9.16344 2 18C2 29.2 18 43.5 18 43.5C18 43.5 34 29.2 34 18C34 9.16344 26.8366 2 18 2Z" stroke="#FEF08A" stroke-width="1.5"/>
                <circle cx="18" cy="18" r="8" fill="#0F172A"/>
                <circle cx="18" cy="18" r="4" fill="#F59E0B"/>
                <circle cx="18" cy="18" r="1.5" fill="#FFFFFF"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 68],
        iconAnchor: [18, 68],
      });

      const marker = window.L.marker([currentLat, currentLng], {
        icon: pickerIcon,
        draggable: true,
        autoPan: true,
      });

      marker.on('dragend', (e: any) => {
        const ll = e.target.getLatLng();
        updateSelectedPosition(ll.lat, ll.lng, false);
      });

      markersGroup.addLayer(marker);
      pickerMarkerRef.current = marker;

      // Draw live GPS Accuracy Circle if GPS was used
      if (gpsAccuracy && gpsAccuracy < 500) {
        if (accuracyCircleRef.current) {
          markersGroup.removeLayer(accuracyCircleRef.current);
        }
        const circle = window.L.circle([currentLat, currentLng], {
          radius: gpsAccuracy,
          color: '#38bdf8',
          fillColor: '#38bdf8',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4',
        });
        markersGroup.addLayer(circle);
        accuracyCircleRef.current = circle;
      }
    } else {
      // View Mode: Render Businesses with Smart Screen-Space Marker Clustering
      // Only render if showBusinesses is enabled OR if a category filter is active!
      const shouldRenderBusinesses = showBusinesses || mapCategoryFilter !== 'all';
      const filteredBusinesses = !shouldRenderBusinesses
        ? []
        : businesses.filter((b) => {
            if (selectedGovFilter !== 'all' && !b.governorate.includes(selectedGovFilter)) {
              return false;
            }
            if (mapCategoryFilter !== 'all') {
              const catLower = (b.category || '').toLowerCase();
              const filterLower = mapCategoryFilter.toLowerCase();
              if (!catLower.includes(filterLower)) return false;
            }
            if (onlyVerifiedFilter && b.verificationStatus !== 'verified') {
              return false;
            }
            return true;
          });

      // Cluster pins within ~50 screen pixels of each other to avoid overlap
      const clusterRadiusPx = 52;
      const clusters: Array<{
        centerLat: number;
        centerLng: number;
        items: Business[];
      }> = [];

      filteredBusinesses.forEach((biz) => {
        if (typeof biz.lat !== 'number' || typeof biz.lng !== 'number' || isNaN(biz.lat) || isNaN(biz.lng)) return;
        const pt = map.latLngToLayerPoint([biz.lat, biz.lng]);

        let placed = false;
        for (const cl of clusters) {
          const clPt = map.latLngToLayerPoint([cl.centerLat, cl.centerLng]);
          const dist = Math.hypot(pt.x - clPt.x, pt.y - clPt.y);
          if (dist < clusterRadiusPx) {
            cl.items.push(biz);
            cl.centerLat = (cl.centerLat * (cl.items.length - 1) + biz.lat) / cl.items.length;
            cl.centerLng = (cl.centerLng * (cl.items.length - 1) + biz.lng) / cl.items.length;
            placed = true;
            break;
          }
        }

        if (!placed) {
          clusters.push({
            centerLat: biz.lat,
            centerLng: biz.lng,
            items: [biz],
          });
        }
      });

      clusters.forEach((cluster) => {
        if (cluster.items.length === 1) {
          const biz = cluster.items[0];
          const isSelected = selectedBiz?.id === biz.id;
          const showFullPill = zoomLevel >= 16;
          const { html, iconSize, iconAnchor } = createLightweightBadgeHtml(biz, isSelected, showFullPill);

          const bizIcon = window.L.divIcon({
            className: 'custom-biz-pin',
            html,
            iconSize,
            iconAnchor,
          });

          const marker = window.L.marker([biz.lat, biz.lng], { icon: bizIcon });

          marker.on('click', () => {
            setSelectedBiz(biz);
            map.flyTo([biz.lat, biz.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
            if (onSelectBusiness) onSelectBusiness(biz);
          });

          markersGroup.addLayer(marker);
        } else {
          // Cluster pin
          const { html, iconSize, iconAnchor } = createLightweightClusterHtml(cluster.items.length);

          const clusterIcon = window.L.divIcon({
            className: 'custom-cluster-pin',
            html,
            iconSize,
            iconAnchor,
          });

          const clusterMarker = window.L.marker([cluster.centerLat, cluster.centerLng], { icon: clusterIcon });

          clusterMarker.on('click', () => {
            const currentZoom = map.getZoom();
            if (currentZoom < 18) {
              const bounds = window.L.latLngBounds(cluster.items.map((b) => [b.lat, b.lng]));
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
            } else {
              setSelectedBiz(cluster.items[0]);
              if (onSelectBusiness) onSelectBusiness(cluster.items[0]);
            }
          });

          markersGroup.addLayer(clusterMarker);
        }
      });

      // 🗺️ Render Hadayek Official District Polygons
      if (showDistrictsOverlay && window.L) {
        HADAYEK_OFFICIAL_DISTRICTS.forEach((district) => {
          district.polygons.forEach((polyCoords) => {
            const polygon = window.L.polygon(polyCoords, {
              color: district.color,
              weight: 1.5,
              opacity: 0.85,
              fillColor: district.color,
              fillOpacity: 0.10,
              className: 'hadayek-district-polygon',
            });

            polygon.on('click', () => {
              if (onSelectZone) onSelectZone(district.letterAr);
            });

            polygon.bindTooltip(`
              <div dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; font-weight: 800; font-size: 12px; color: ${district.color}; padding: 3px 6px;">
                ${escapeHtml(district.nameAr)} (${escapeHtml(district.nameEn)})
              </div>
            `, { sticky: true, direction: 'top' });

            markersGroup.addLayer(polygon);
          });

          // Native cartographic map typography for district labels (merged into the map layer, not floating buttons)
          const labelHtml = `
            <div style="transform: translate(-50%, -50%); pointer-events: auto; cursor: pointer; user-select: none;">
              <div style="
                font-family: 'Cairo', system-ui, -apple-system, sans-serif;
                font-weight: 900;
                font-size: ${zoomLevel >= 16 ? '16px' : '13px'};
                color: ${district.color || '#334155'};
                text-shadow:
                  0 0 3px #ffffff,
                  0 0 6px #ffffff,
                  0 0 10px #ffffff,
                  -1px -1px 0 #ffffff,
                  1px -1px 0 #ffffff,
                  -1px 1px 0 #ffffff,
                  1px 1px 0 #ffffff;
                letter-spacing: 0.5px;
                white-space: nowrap;
                opacity: 0.95;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 4px;
              ">
                <span>${escapeHtml(district.nameAr)}</span>
              </div>
            </div>
          `;

          const labelIcon = window.L.divIcon({
            className: 'custom-district-label',
            html: labelHtml,
            iconSize: [90, 24],
            iconAnchor: [45, 12],
          });

          const labelMarker = window.L.marker([district.centerLat, district.centerLng], {
            icon: labelIcon,
            zIndexOffset: 150,
          });

          labelMarker.on('click', () => {
            if (onSelectZone) onSelectZone(district.letterAr);
          });

          markersGroup.addLayer(labelMarker);
        });
      }

      // 🚪 Render Hadayek Official Gates as Modern Landmark Pins
      if (showHadayekGates && showGatesLayer && window.L) {
        HADAYEK_OFFICIAL_GATES.forEach((gate) => {
          const gateHtml = `
            <div style="position: relative; transform: translate(-50%, -100%); cursor: pointer; user-select: none; display: flex; flex-direction: column; align-items: center;">
              <div style="
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                border: 1.5px solid #818cf8;
                color: #ffffff;
                padding: 3.5px 9px 3.5px 6px;
                border-radius: 9999px;
                font-family: 'Cairo', system-ui, -apple-system, sans-serif;
                font-weight: 800;
                font-size: 11px;
                line-height: 1;
                box-shadow: 0 4px 16px rgba(15, 23, 42, 0.6), 0 0 12px rgba(129, 140, 248, 0.35);
                display: inline-flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
              ">
                <span style="
                  background: #4f46e5;
                  color: #ffffff;
                  border: 1px solid #a5b4fc;
                  width: 17px;
                  height: 17px;
                  border-radius: 50%;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  font-weight: 900;
                  flex-shrink: 0;
                ">${gate.number || '🚪'}</span>
                <span style="color: #f8fafc; font-weight: 800; letter-spacing: -0.2px;">${escapeHtml(gate.popularNameAr || gate.shortNameAr)}</span>
              </div>
              <div style="
                width: 0;
                height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-top: 5px solid #818cf8;
                margin-top: -1px;
              "></div>
            </div>
          `;

          const gateIcon = window.L.divIcon({
            className: 'custom-gate-pin',
            html: gateHtml,
            iconSize: [110, 32],
            iconAnchor: [55, 32],
          });

          const gateMarker = window.L.marker([gate.lat, gate.lng], { icon: gateIcon, zIndexOffset: 400 });
          gateMarker.bindPopup(`
            <div dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; text-align: right; min-width: 220px; padding: 4px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                <span style="background: #4f46e5; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">${gate.number || '🚪'}</span>
                <b style="color: #1e1b4b; font-size: 13px;">${escapeHtml(gate.nameAr)}</b>
              </div>
              <p style="margin: 4px 0; font-size: 11px; color: #475569; line-height: 1.4;"><b>🛣️ الطريق:</b> ${escapeHtml(gate.accessRoadAr)}</p>
              <p style="margin: 4px 0; font-size: 11px; color: #047857; line-height: 1.4;"><b>🎯 تخدم مناطق:</b> ${escapeHtml(gate.servedZones.join('، '))}</p>
              <div style="margin-top: 8px;">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #4f46e5; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-decoration: none;">
                  <span>📍 الاتجاهات عبر Google Maps</span>
                </a>
              </div>
            </div>
          `);
          markersGroup.addLayer(gateMarker);
        });
      }

      // 📍 Render Target Building Glowing Pin
      if (targetBuilding && showTargetPin && typeof targetBuilding.lat === 'number' && typeof targetBuilding.lng === 'number' && window.L) {
        const bldgLabel = targetBuilding.buildingNumber
          ? `عمارة ${targetBuilding.buildingNumber} منطقة ${targetBuilding.zoneLetter || ''}`
          : `منطقة ${targetBuilding.zoneLetter || 'الحدائق'}`;

        const bldgHtml = `
          <div style="position: relative; transform: translate(-50%, -100%); cursor: pointer; user-select: none; display: flex; flex-direction: column; align-items: center;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); border: 2.5px solid #ffffff; color: #020617; padding: 6px 14px; border-radius: 9999px; font-family: Cairo, sans-serif; font-weight: 900; font-size: 12px; box-shadow: 0 0 25px rgba(245, 158, 11, 0.9), 0 4px 16px rgba(0,0,0,0.4); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
              <span style="font-size: 15px;">📍</span>
              <span>${escapeHtml(bldgLabel)}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #f59e0b; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));"></div>
          </div>
        `;

        const bldgIcon = window.L.divIcon({
          className: 'custom-target-building-pin',
          html: bldgHtml,
          iconSize: [200, 42],
          iconAnchor: [100, 42],
        });

        const bldgMarker = window.L.marker([targetBuilding.lat, targetBuilding.lng], { icon: bldgIcon, zIndexOffset: 1000 });
        markersGroup.addLayer(bldgMarker);

        // Soft Golden Radius Circle (200m)
        const bldgCircle = window.L.circle([targetBuilding.lat, targetBuilding.lng], {
          radius: 200,
          color: '#f59e0b',
          weight: 2,
          opacity: 0.8,
          fillColor: '#f59e0b',
          fillOpacity: 0.12,
          dashArray: '5, 5',
        });
        markersGroup.addLayer(bldgCircle);

        // Fly smoothly to target
        map.flyTo([targetBuilding.lat, targetBuilding.lng], 17, { duration: 1.2 });
      }
    }
  }, [
    mode,
    businesses,
    showBusinesses,
    mapCategoryFilter,
    onlyVerifiedFilter,
    showGatesLayer,
    showDistrictsOverlay,
    showTargetPin,
    selectedGovFilter,
    currentLat,
    currentLng,
    gpsAccuracy,
    zoomLevel,
    selectedBiz,
    targetBuilding,
    showHadayekGates,
    leafletMapRef,
    markersGroupRef,
    pickerMarkerRef,
    accuracyCircleRef,
    updateSelectedPosition,
    onSelectBusiness,
    onSelectZone,
    setSelectedBiz,
  ]);
};
