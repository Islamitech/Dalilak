import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import districts data (using relative path, assumes executed via ts-node or similar, but we'll use raw JSON/JS logic)
// Since this is a standalone JS script, we will just fetch the Overpass data and save it.
// The sorting by zone can be done by looking at the name "170 أ" or by raycasting into polygons.
// Overpass already provides the name and addr:housenumber.

const OVERPASS_API = 'https://lz4.overpass-api.de/api/interpreter';

async function buildDatabase() {
  console.log('🚀 بدء بناء قاعدة بيانات إحداثيات العمارات آلياً (Hadayek Buildings DB)...');
  
  // الباوندنج بوكس لحدائق الأهرام
  const bbox = '29.94,31.07,30.00,31.14';
  
  const query = `[out:json][timeout:90];
  (
    way["addr:housenumber"](${bbox});
    node["addr:housenumber"](${bbox});
    way["name"~"^[0-9]+"](${bbox});
    node["name"~"^[0-9]+"](${bbox});
  );
  out center;`;

  try {
    console.log('⏳ جاري جلب البيانات من OpenStreetMap (قد يستغرق بضع ثواني)...');
    
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DalelakHadayekBuilder/1.0 (info@dalelak.com)'
      },
      body: 'data=' + encodeURIComponent(query)
    });

    if (!response.ok) {
      throw new Error(`Overpass API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ تم استلام ${data.elements.length} مبنى/نقطة.`);

    const db = {};

    data.elements.forEach(el => {
      const tags = el.tags || {};
      let num = tags['addr:housenumber'] || '';
      let name = tags['name'] || '';
      
      const lat = el.lat || (el.center && el.center.lat);
      const lng = el.lon || (el.center && el.center.lon);

      if (!lat || !lng) return;

      // Extract number from addr:housenumber or name
      const numMatch = num.match(/\d+/) || name.match(/\d+/);
      if (!numMatch) return;
      
      const bNumber = numMatch[0];
      
      // Determine zone from name if possible (e.g. "170 أ" -> "أ")
      let zoneMatch = name.match(/([أ-ي])/);
      let zone = zoneMatch ? zoneMatch[1] : 'unknown';

      // We store it as: db['170'] = { lat, lng, name, zone }
      // Or a more structured way
      if (!db[bNumber]) {
        db[bNumber] = [];
      }
      db[bNumber].push({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        zoneHint: zone,
        rawName: name,
        rawHousenumber: num
      });
    });

    const outputPath = path.resolve(__dirname, '../src/data/hadayekBuildingsCoords.json');
    fs.writeFileSync(outputPath, JSON.stringify(db, null, 2), 'utf-8');
    
    console.log(`🎉 اكتمل بناء القاعدة بنجاح! تم حفظ ${Object.keys(db).length} رقم عمارة فريد في:`);
    console.log(outputPath);

  } catch (error) {
    console.error('❌ حدث خطأ أثناء بناء القاعدة:', error.message);
  }
}

buildDatabase();
