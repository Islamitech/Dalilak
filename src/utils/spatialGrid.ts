/**
 * 🗺️ مولد الشبكة المكانية الدقيقة (Spatial Micro-Grid Generator)
 * يولد شبكة بؤر متداخلة بمسافات بينية ~150م لتغطية كافة الشوارع الداخلية والأزقة بنسبة 100%
 */

export interface GridPoint {
  id: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface BoundingBox {
  southLat: number;
  westLng: number;
  northLat: number;
  eastLng: number;
}

/**
 * توليد نقاط مسح شبكية مصغرة تغطي كامل النطاق الجغرافي للقطاع
 * @param bounds حدود القطاع الجغرافي المستطيلة
 * @param stepMeters المسافة البينية بين النقاط (افتراضياً 160 متراً)
 * @param radiusMeters نصف قطر دائرة البحث لكل نقطة (افتراضياً 140 متراً لضمان التداخل)
 */
export function generateSectorMicroGrid(
  bounds: BoundingBox,
  stepMeters = 160,
  radiusMeters = 140
): GridPoint[] {
  const { southLat, westLng, northLat, eastLng } = bounds;

  // تحويل الأمتار إلى درجات إحداثية عند خط عرض 30 (مصر/الجيزة)
  const latStep = stepMeters / 111000;
  const lngStep = stepMeters / (111000 * Math.cos((southLat * Math.PI) / 180));

  const points: GridPoint[] = [];
  let colIndex = 0;

  for (let lat = southLat + latStep / 2; lat <= northLat; lat += latStep) {
    // إزاحة خفيفة متناوبة (Hexagonal-like staggered grid) لتقليل الثغرات
    const offset = (colIndex % 2) * (lngStep / 2);
    for (let lng = westLng + lngStep / 2 + offset; lng <= eastLng; lng += lngStep) {
      points.push({
        id: `grid_${points.length + 1}`,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        radiusMeters,
      });
    }
    colIndex++;
  }

  // إذا كانت المساحة صغيرة وعدد النقاط صفر، ننشئ نقطة المركز
  if (points.length === 0) {
    points.push({
      id: 'grid_center',
      lat: Number(((southLat + northLat) / 2).toFixed(6)),
      lng: Number(((westLng + eastLng) / 2).toFixed(6)),
      radiusMeters: 250,
    });
  }

  return points;
}
