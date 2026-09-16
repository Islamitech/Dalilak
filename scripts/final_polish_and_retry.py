import os
import sys
import json
import time
import io
import re
import urllib.request
import urllib.parse
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://xdqpbajymacpdccorjcj.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x'
BUCKET_NAME = 'business-media'
RAW_BACKUP_DIR = os.path.join('backups', 'activity_images_raw_backup')
os.makedirs(RAW_BACKUP_DIR, exist_ok=True)

# Import generator from audit engine
from audit_and_enhance_engine import generate_original_description, process_and_enhance_image

def upload_webp_with_retry(webp_bytes, filename, max_retries=5):
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/photos/{filename}"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'image/webp',
        'x-upsert': 'true'
    }
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, data=webp_bytes, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=20) as resp:
                if resp.status in [200, 201]:
                    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/photos/{filename}"
        except Exception as e:
            if '429' in str(e):
                wait = (attempt + 1) * 3
                print(f"      ⏳ Rate limited (429), waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"      ⚠️ Upload error: {e}")
                time.sleep(2)
    return None

def patch_supabase(biz_id, payload):
    url = f"{SUPABASE_URL}/rest/v1/businesses?id=eq.{urllib.parse.quote(biz_id)}"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status in [200, 204]
    except Exception as e:
        print(f"      ⚠️ Patch error: {e}")
        return False

def main():
    local_store_file = 'data/server_biz_store.json'
    registry_file = 'data/full_audit_registry.json'

    with open(local_store_file, 'r', encoding='utf-8') as f:
        businesses = json.load(f)

    biz_map = {b['id']: b for b in businesses}
    registry = {}
    if os.path.exists(registry_file):
        with open(registry_file, 'r', encoding='utf-8') as rf:
            registry = json.load(rf)

    print("--- 1. Retrying remaining non-Supabase photos ---")
    retried_photos_count = 0

    for b in businesses:
        biz_id = b['id']
        name = b.get('name_ar') or b.get('name_en') or ''
        photos = b.get('photos') or []
        updated_photos = []
        changed = False

        for p_idx, p in enumerate(photos):
            if isinstance(p, str) and not p.includes('supabase.co/storage') if hasattr(p, 'includes') else ('supabase.co/storage' not in str(p)):
                p_url = str(p)
                if p_url.startswith('//'):
                    p_url = 'https:' + p_url

                print(f"  📸 Retrying photo for {name} ({biz_id})...")
                try:
                    raw_bytes = None
                    file_ext = 'jpg'
                    if p_url.startswith('data:'):
                        import base64
                        header, b64_data = p_url.split(';base64,')
                        raw_bytes = base64.b64decode(b64_data)
                        file_ext = 'png' if 'png' in header else 'jpg'
                    elif p_url.startswith('http'):
                        req = urllib.request.Request(p_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(req, timeout=15) as resp:
                            raw_bytes = resp.read()

                    if raw_bytes and len(raw_bytes) > 100:
                        raw_filename = f"{biz_id}_{p_idx}.{file_ext}"
                        raw_backup_path = os.path.join(RAW_BACKUP_DIR, raw_filename)
                        with open(raw_backup_path, 'wb') as bf:
                            bf.write(raw_bytes)

                        webp_bytes, orig_dim, new_dim, reduction = process_and_enhance_image(raw_bytes)
                        webp_filename = f"enhanced_{biz_id}_{p_idx}.webp"
                        cdn_url = upload_webp_with_retry(webp_bytes, webp_filename)

                        if cdn_url:
                            updated_photos.append(cdn_url)
                            changed = True
                            retried_photos_count += 1
                            print(f"    ✅ Uploaded: {orig_dim} -> {new_dim} ({reduction}% WebP)")
                            registry['enhanced_photos'].append({
                                'biz_id': biz_id,
                                'name': name,
                                'orig_dim': orig_dim,
                                'enhanced_dim': new_dim,
                                'orig_bytes': len(raw_bytes),
                                'webp_bytes': len(webp_bytes),
                                'reduction_pct': reduction,
                                'cdn_url': cdn_url,
                                'backup_file': raw_backup_path
                            })
                        else:
                            updated_photos.append(p)
                    else:
                        updated_photos.append(p)
                except Exception as ex:
                    print(f"    ❌ Error processing {p_url[:40]}: {ex}")
                    updated_photos.append(p)
            else:
                updated_photos.append(p)

        if changed:
            b['photos'] = updated_photos
            patch_supabase(biz_id, {'photos': updated_photos})

    print(f"✅ Retried and uploaded {retried_photos_count} remaining photos.")

    print("\n--- 2. Applying precision category corrections ---")
    precision_rules = [
        (r'كشري.*رسلان', 'مطعم / مأكولات ومشويات', 'مطعم مأكولات شعبية وكشري مصري'),
        (r'صحتي.*جيم', 'جيم وصالة لياقة بدنية (Fitness)', 'جيم وصالة تدريب لياقة بدنية للسيدات والأطفال'),
        (r'مكتبة.*القاسم.*طباعة|مكتبة.*القاسم.*تصوير', 'مكتبة تصوير مستندات وطباعة وخدمات كمبيوتر', 'مكتبة تصوير مستندات وطباعة وخدمات طلابية'),
        (r'مكتبة.*الرساله|مكتبة.*زمزم', 'مكتبة كتب وروايات وأدوات هندسية ورسم', 'مكتبة بيع كتب وروايات وأدوات مدرسية'),
        (r'دراي.*كلين.*ابن.*سينا|مغسلة.*الهضبه|مغسلة.*مستركلين|مغسلة.*سلطان|مغسلة.*رغوة|مغسلة.*دريم', 'مغسلة ملابس ودراي كلين ومكوجي', 'مغسلة ملابس وخدمات دراي كلين وكي'),
        (r'صالون.*حلاق.*رجالى.*barbrshopwaelnegm|صالون.*محمد.*السوري', 'صالون حلاقة رجالي وعناية', 'صالون حلاقة وعناية رجالية متميزة'),
        (r'plush.*hair.*beauty.*salon', 'بيوتي سنتر وكوافير حريمي', 'صالون تجميل وعناية نسائية'),
        (r'ket.*tires.*shop', 'كاوتش وبطاريات وضبط زوايا', 'خدمات كاوتش وإطارات وضبط زوايا'),
        (r'المركز.*الفني.*لتكييف.*السيارات|مركز.*الرفاعي.*للتكيف', 'فني صيانة تكييف وتبريد وأجهزة', 'صيانة وتجهيز أجهزة وتكييفات السيارات'),
        (r'صيدلية.*المكاوي', 'صيدلية وخدمات دوائية', 'صيدلية وصرف أدوية ومستلزمات طبية'),
        (r'إكزوتيك.*العبد.*للرخام', 'أدوات صحية وسيراميك ورخام', 'صناعة وتوريد وتجارة الرخام والجرانيت'),
        (r'الإخلاص.*لتوزيع.*وتجارة.*الأدوات.*الصحية', 'أدوات صحية وسيراميك ورخام', 'تجارة وتوزيع الأدوات الصحية والسباكة'),
        (r'سوبرماركت.*سعودي|بيت.*الخير.*ماركت|أسواق.*الفيروز|سوبر.*ماركت.*أسواق.*مهران|دكان.*البنا', 'سوبر ماركت / هايبر وبقالة', 'سوبر ماركت وهايبر لتوفير السلع الغذائية'),
        (r'مكتبة.*سطور|مكتبة.*السعادة|مكتبة.*العربي.*سمارت|بيت.*اللغات.*للكتب', 'مكتبة وأدوات مدرسية وقرطاسية', 'مكتبة وقرطاسية وأدوات مدرسية وكتب'),
    ]

    corrected_count = 0
    for b in businesses:
        name = b.get('name_ar') or b.get('name_en') or ''
        cur_cat = b.get('category')
        for pat, correct_cat, reason in precision_rules:
            if re.search(pat, name, re.IGNORECASE) and cur_cat != correct_cat:
                print(f"  🏷️ تصحيح نشاط: {name} من [{cur_cat}] إلى [{correct_cat}]")
                b['category'] = correct_cat
                # Regenerate description to match corrected category perfectly
                new_desc = generate_original_description(b, correct_cat)
                b['description'] = new_desc
                patch_supabase(b['id'], {'category': correct_cat, 'description': new_desc})
                corrected_count += 1
                registry['corrected_categories'].append({
                    'id': b['id'],
                    'name': name,
                    'old_category': cur_cat,
                    'new_category': correct_cat,
                    'reason': reason,
                    'confidence': 'high'
                })
                break

    print(f"✅ Applied precision corrections to {corrected_count} businesses.")

    # Save final stores
    with open(local_store_file, 'w', encoding='utf-8') as lf:
        json.dump(businesses, lf, ensure_ascii=False, indent=2)
    with open(registry_file, 'w', encoding='utf-8') as rf:
        json.dump(registry, rf, ensure_ascii=False, indent=2)

    print("🎉 All stores and registries successfully polished and persisted!")

if __name__ == '__main__':
    main()
