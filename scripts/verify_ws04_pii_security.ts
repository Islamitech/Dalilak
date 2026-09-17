import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SAFE_REP_SELECT } from '../src/services/db/repDb.js';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`, detail || '');
    failCount++;
  }
}

async function runVerification() {
  console.log('\n============================================================');
  console.log('🛡️ Daleelek Verification Engine — WS-04 PII & RLS Security');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: التحقق من تطهير ثابت SAFE_REP_SELECT في كود العميل
  // --------------------------------------------------------------------------
  console.log('🔹 Test 1: Verification of SAFE_REP_SELECT column sanitization...');
  const forbiddenFields = [
    'password',
    'national_id',
    'activation_face_photo',
    'national_id_card_photo',
    'national_id_card_back_photo',
    'active_session_id',
  ];
  const fieldsArray = SAFE_REP_SELECT.split(',').map((f) => f.trim());
  const leakedFields = forbiddenFields.filter((f) => fieldsArray.includes(f));

  assert(
    leakedFields.length === 0,
    'SAFE_REP_SELECT does NOT contain any sensitive PII or credentials',
    { leakedFields }
  );

  const requiredSafeFields = ['id', 'name', 'email', 'phone', 'role', 'status'];
  const hasRequired = requiredSafeFields.every((f) => fieldsArray.includes(f));
  assert(hasRequired, 'SAFE_REP_SELECT preserves required public business fields');

  // --------------------------------------------------------------------------
  // TEST 2: التحقق من استعلام العميل عبر Supabase Anon Key
  // --------------------------------------------------------------------------
  console.log('\n🔹 Test 2: Client-side Anon query test with SAFE_REP_SELECT...');
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    try {
      const { data, error } = await anonClient
        .from('representatives')
        .select(SAFE_REP_SELECT)
        .limit(5);

      assert(error === null, 'Query with SAFE_REP_SELECT succeeds without error', error);
      if (data && data.length > 0) {
        const sample = data[0] as Record<string, unknown>;
        const keys = Object.keys(sample);
        const hasLeakedData = forbiddenFields.some((f) => keys.includes(f) && sample[f] !== undefined);
        assert(
          !hasLeakedData,
          'Returned representative records do NOT contain sensitive PII',
          { sampleKeys: keys }
        );
      } else {
        console.log('  ℹ️ [INFO] No rows returned (table empty or filtered), but query syntax was valid.');
      }
    } catch (e) {
      assert(false, 'Anon client query exception', e);
    }
  } else {
    console.log('  ⚠️ [SKIP] Supabase URL or Anon key missing in environment.');
  }

  // --------------------------------------------------------------------------
  // TEST 3: فحص مسار /api/auth/check-national-id الآمن
  // --------------------------------------------------------------------------
  console.log('\n🔹 Test 3: Testing Zero-Knowledge National ID Check endpoint...');
  const serverPort = 3099;
  process.env.NODE_ENV = 'test';
  process.env.PORT = String(serverPort);
  process.env.SESSION_SIGNING_SECRET = process.env.SESSION_SIGNING_SECRET || 'test-secret-key-12345678901234567890';

  // Import server dynamically
  const serverModule = await import('../server.ts');
  const app = serverModule.app || serverModule.default;

  await new Promise<void>((resolve) => {
    // Start temporary test server
    const srv = app.listen(serverPort, () => {
      console.log(`  ℹ️ Test server listening on port ${serverPort}`);
      resolve();
    });

    // Run HTTP tests
    setTimeout(async () => {
      try {
        // 3.1 Invalid format check
        const invalidRes = await fetch(`http://127.0.0.1:${serverPort}/api/auth/check-national-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nationalId: '123' }),
        });
        assert(invalidRes.status === 400, 'Invalid short national ID returns 400 Bad Request');

        // 3.2 Non-existent national ID check
        const nonExistRes = await fetch(`http://127.0.0.1:${serverPort}/api/auth/check-national-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nationalId: '99999999999999' }),
        });
        const nonExistData: any = await nonExistRes.json();
        assert(
          nonExistRes.status === 200 && nonExistData.exists === false,
          'Non-existent national ID returns exists: false'
        );

        // ----------------------------------------------------------------------
        // TEST 4: فحص مسار /api/representatives ومنع التسريب لغير المصادقين
        // ----------------------------------------------------------------------
        console.log('\n🔹 Test 4: Testing /api/representatives authorization and sanitization...');
        const unauthRes = await fetch(`http://127.0.0.1:${serverPort}/api/representatives`);
        assert(unauthRes.status === 401, 'Unauthenticated request to /api/representatives returns 401');

        // ----------------------------------------------------------------------
        // TEST 5: فحص تطهير /api/businesses وإخفاء إيصالات السداد عن العامة
        // ----------------------------------------------------------------------
        console.log('\n🔹 Test 5: Testing /api/businesses sanitization for public callers...');
        const bizRes = await fetch(`http://127.0.0.1:${serverPort}/api/businesses`);
        if (bizRes.status === 200) {
          const bizList: any = await bizRes.json();
          assert(Array.isArray(bizList), '/api/businesses returns array of businesses');
          if (bizList.length > 0) {
            const hasReceipt = bizList.some((b: any) => b.paymentReceiptPhoto || b.paymentDetails);
            assert(!hasReceipt, 'Public /api/businesses response does NOT leak payment receipts');
          }
        } else {
          assert(false, '/api/businesses returned unexpected status: ' + bizRes.status);
        }

      } catch (err) {
        assert(false, 'HTTP test execution exception', err);
      } finally {
        srv.close();
        finishReport();
      }
    }, 1000);
  });
}

function finishReport() {
  console.log('\n============================================================');
  console.log(`📊 WS-04 Verification Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log('============================================================\n');

  if (failCount > 0) {
    console.error('❌ WS-04 Verification FAILED.');
    process.exit(1);
  } else {
    console.log('✅ WS-04 Verification PASSED 100%!');
    process.exit(0);
  }
}

runVerification().catch((e) => {
  console.error('Verification script unhandled error:', e);
  process.exit(1);
});
