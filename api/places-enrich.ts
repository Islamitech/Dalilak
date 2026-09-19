const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.VITE_GOOGLE_PLACES_API_KEY ||
  'AIzaSyD3eyrkvcPrYKgGFqUf2p3OrzKgMep_7c4';

export default async function handler(req: any, res: any) {
  // Allow CORS for Vercel deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-override, x-super-admin-override');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { googlePlaceId, placeName } = req.body || {};
    if (!googlePlaceId) {
      return res.status(400).json({ success: false, error: 'يرجى تقديم معرف المكان googlePlaceId' });
    }

    const detailsUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(googlePlaceId)}`;
    const dRes = await fetch(detailsUrl, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,photos,internationalPhoneNumber,nationalPhoneNumber,rating,userRatingCount,regularOpeningHours',
      },
    });

    if (!dRes.ok) {
      throw new Error(`Google API responded with status ${dRes.status}`);
    }

    const pData = await dRes.json();

    // 1. استخراج الصورة الأولى (إن وجدت) باستخدام skipHttpRedirect
    let photo = '';
    if (pData.photos && Array.isArray(pData.photos) && pData.photos.length > 0) {
      const photoItem = pData.photos[0];
      if (photoItem && photoItem.name) {
        const mediaUrl = `https://places.googleapis.com/v1/${photoItem.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
        const mRes = await fetch(mediaUrl);
        if (mRes.ok) {
          const mData = await mRes.json();
          if (mData?.photoUri && typeof mData.photoUri === 'string') {
            photo = mData.photoUri;
          }
        }
        if (!photo) {
          photo = `https://places.googleapis.com/v1/${photoItem.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_PLACES_API_KEY}`;
        }
      }
    }

    // 2. استخراج رقم الهاتف
    const phone = pData.internationalPhoneNumber || pData.nationalPhoneNumber || '';

    // 3. التقييم وعدد التقييمات
    const rating = pData.rating || 0;
    const ratingCount = pData.userRatingCount || 0;

    // 4. استخراج أوقات العمل
    let workingHours = '';
    if (pData.regularOpeningHours?.weekdayDescriptions && Array.isArray(pData.regularOpeningHours.weekdayDescriptions)) {
      workingHours = pData.regularOpeningHours.weekdayDescriptions.join('\n');
    }

    return res.status(200).json({
      success: true,
      photo,
      phone,
      rating,
      ratingCount,
      workingHours,
    });
  } catch (err: any) {
    console.error('Vercel places enrich error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ أثناء عملية إثراء المكان',
    });
  }
}
