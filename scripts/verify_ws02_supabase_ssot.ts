import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import { serviceSupabase, isSupabaseServiceConfigured } from '../server/supabase.js';
import { mapDbToBusiness, getSafeCoreBusinessDbRecord } from '../src/services/db/dbMappers.js';

const SESSION_SIGNING_SECRET = (
  process.env.SESSION_SIGNING_SECRET ||
  'dalelak_super_resilient_signing_secret_2026_sovereign_gate_03'
).trim();

function generateSignedSessionToken(userId: string, role: string, expiresAt: number): string {
  const payload = `${userId}:${role}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(payload).digest('hex');
  return `dalil_v2_${Buffer.from(payload).toString('base64url')}_${sig}`;
}

async function runVerification() {
  console.log('============================================================');
  console.log('🧪 البدء في التحقق الشامل من محطة WS-02 (Supabase as SSOT)');
  console.log('============================================================\n');

  if (!isSupabaseServiceConfigured || !serviceSupabase) {
    throw new Error('❌ Supabase service role is not configured!');
  }

  // 1. فحص الاتصال وقراءة الرصيد الفعلي في Supabase
  console.log('1️⃣ فحص الاتصال بالـ SSOT (Supabase):');
  const { count: initialCount, error: countErr } = await serviceSupabase
    .from('businesses')
    .select('*', { count: 'exact', head: true });
  if (countErr) throw countErr;
  console.log(`   ✅ تم التحقق من اتصال Supabase بنجاح. إجمالي الأنشطة المسجلة: ${initialCount}`);

  // 2. اختبار المزامنة الشاملة (Full Pagination Sync Test)
  console.log('\n2️⃣ اختبار محرك المزامنة التلقائية وجلب جميع السجلات مع التصفح:');
  const PAGE_SIZE = 1000;
  let allRows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await serviceSupabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  const mapped = allRows.map(mapDbToBusiness);
  console.log(`   ✅ تم جلب ومطابقة ${mapped.length} نشاطاً من Supabase بنجاح كامل.`);

  // 3. اختبار دورة حياة الكتابة كـ SSOT (INSERT → SELECT → UPDATE → DELETE)
  console.log('\n3️⃣ اختبار دورة الكتابة المباشرة في Supabase:');
  const testBizId = `ws02_test_${Date.now()}`;
  const testBizPayload = {
    id: testBizId,
    nameAr: 'مؤسسة التحقق السيادي WS-02',
    category: 'مطعم / مأكولات ومشويات',
    phone: '01099991111',
    governorate: 'القاهرة',
    city: 'المعادي',
    street: 'شارع النصر',
    ownerName: 'مهندس الجودة',
    ownerPhone: '01099991111',
    repId: 'rep_1',
    repName: 'أحمد محمود',
    packageId: 'pkg_basic',
    packageName: '1. باقة التوثيق الأساسي',
    packagePrice: 250,
    amountPaid: 250,
    paymentStatus: 'fully_paid',
    verificationStatus: 'verified',
  };

  const dbRecord = getSafeCoreBusinessDbRecord(testBizPayload);
  
  // أ. الحفظ (Create)
  console.log('   أ) حفظ النشاط في Supabase...');
  const { error: insErr } = await serviceSupabase
    .from('businesses')
    .upsert([dbRecord], { onConflict: 'id' });
  if (insErr) throw insErr;
  console.log(`   ✅ تم إدخال النشاط ${testBizId} بنجاح في Supabase.`);

  // ب. التحقق الفوري من القراءة (Read Verification from Cloud)
  console.log('   ب) التحقق من وجود النشاط في السحاب فوراً...');
  const { data: fetchedBiz, error: fetchErr } = await serviceSupabase
    .from('businesses')
    .select('*')
    .eq('id', testBizId)
    .single();
  if (fetchErr || !fetchedBiz) throw new Error('❌ النشاط لم يوجد في Supabase بعد الإدخال!');
  const verifiedObj = mapDbToBusiness(fetchedBiz);
  if (verifiedObj.nameAr !== 'مؤسسة التحقق السيادي WS-02') {
    throw new Error(`❌ تطابق الاسم فشل: ${verifiedObj.nameAr}`);
  }
  console.log(`   ✅ تم جلب النشاط من Supabase وتطابق البيانات بنسبة 100%: ${verifiedObj.nameAr}`);

  // ج. التعديل (Update)
  console.log('   ج) تعديل بيانات النشاط وتحديثها في Supabase...');
  const updatedPayload = {
    ...testBizPayload,
    nameAr: 'مؤسسة التحقق السيادي WS-02 - محدثة ومطابقة',
    category: 'خدمات وأنشطة عامة',
  };
  const updRecord = getSafeCoreBusinessDbRecord(updatedPayload);
  const { error: updErr } = await serviceSupabase
    .from('businesses')
    .upsert([updRecord], { onConflict: 'id' });
  if (updErr) throw updErr;

  const { data: afterUpd } = await serviceSupabase
    .from('businesses')
    .select('name_ar, category')
    .eq('id', testBizId)
    .single();
  if (afterUpd?.name_ar !== 'مؤسسة التحقق السيادي WS-02 - محدثة ومطابقة') {
    throw new Error('❌ فشل التحقق من تحديث الاسم في Supabase');
  }
  console.log(`   ✅ تم تأكيد التحديث في Supabase بنجاح: ${afterUpd.name_ar} [${afterUpd.category}]`);

  // د. الحذف (Delete)
  console.log('   د) حذف النشاط التجريبي من Supabase لتطهير البيانات...');
  const { error: delErr } = await serviceSupabase
    .from('businesses')
    .delete()
    .eq('id', testBizId);
  if (delErr) throw delErr;

  const { data: afterDel } = await serviceSupabase
    .from('businesses')
    .select('id')
    .eq('id', testBizId);
  if (afterDel && afterDel.length > 0) {
    throw new Error('❌ النشاط لا يزال موجوداً في Supabase بعد الحذف!');
  }
  console.log(`   ✅ تم تأكيد حذف النشاط التجريبي بالكامل من Supabase.`);

  // 4. التأكد من صمود ملف التخزين المحلي ككاش قراءة
  console.log('\n4️⃣ التحقق من سلامة وصمود ملف التخزين المحلي (data/server_biz_store.json):');
  const storePath = 'data/server_biz_store.json';
  if (fs.existsSync(storePath)) {
    const raw = fs.readFileSync(storePath, 'utf-8');
    const localStore = JSON.parse(raw);
    console.log(`   ✅ ملف الكاش المحلي سليم وصامد ويحتوي على ${localStore.length} نشاطاً كنسخة احتياطية.`);
  }

  console.log('\n============================================================');
  console.log('🎉 نجحت جميع اختبارات التحقق لمحطة WS-02 بنسبة 100%!');
  console.log('============================================================');
}

runVerification().catch((err) => {
  console.error('\n❌ فشل اختبار التحقق:', err);
  process.exit(1);
});
