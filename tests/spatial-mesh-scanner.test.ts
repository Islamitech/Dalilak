import { describe, it, expect } from 'vitest';
import { generateSectorMicroGrid, BoundingBox } from '../src/services/geo/spatialMeshScanner';

describe('Spatial Micro-Grid Mesh Generator Suite', () => {
  it('divides a sector bounding box into an exact NxM micro-grid matrix', () => {
    // Area A coordinates
    const areaABox: BoundingBox = {
      southLat: 29.9780,
      westLng: 31.1180,
      northLat: 29.9920,
      eastLng: 31.1290,
    };

    const cells = generateSectorMicroGrid(areaABox, 2, 2);
    expect(cells).toHaveLength(4);

    // Verify cell coverage
    expect(cells[0].box.southLat).toBeCloseTo(29.9780, 4);
    expect(cells[0].box.westLng).toBeCloseTo(31.1180, 4);

    // Northeast corner of last cell matches sector bounds
    expect(cells[3].box.northLat).toBeCloseTo(29.9920, 4);
    expect(cells[3].box.eastLng).toBeCloseTo(31.1290, 4);

    // Verify center points
    cells.forEach((c) => {
      expect(c.centerLat).toBeGreaterThan(c.box.southLat);
      expect(c.centerLat).toBeLessThan(c.box.northLat);
      expect(c.centerLng).toBeGreaterThan(c.box.westLng);
      expect(c.centerLng).toBeLessThan(c.box.eastLng);
    });
  });

  it('supports fine-grained 3x3 mesh for dense commercial corridors', () => {
    const box: BoundingBox = {
      southLat: 29.9750,
      westLng: 31.1150,
      northLat: 29.9900,
      eastLng: 31.1270,
    };

    const cells = generateSectorMicroGrid(box, 3, 3);
    expect(cells).toHaveLength(9);
  });

  it('provides comprehensive Google Places primary types for deep specialized scanning', async () => {
    const { CATEGORY_GOOGLE_PRIMARY_TYPES } = await import('../src/services/geo/spatialMeshScanner');
    expect(CATEGORY_GOOGLE_PRIMARY_TYPES.restaurants).toContain('restaurant');
    expect(CATEGORY_GOOGLE_PRIMARY_TYPES.restaurants).toContain('bakery');
    expect(CATEGORY_GOOGLE_PRIMARY_TYPES.craft).toContain('car_repair');
    expect(CATEGORY_GOOGLE_PRIMARY_TYPES.craft).toContain('plumber');
    expect(CATEGORY_GOOGLE_PRIMARY_TYPES.medical).toContain('pharmacy');
    expect(CATEGORY_GOOGLE_PRIMARY_TYPES.medical).toContain('doctor');
    expect(CATEGORY_GOOGLE_PRIMARY_TYPES.retail).toContain('supermarket');
  });
});
