import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xdqpbajymacpdccorjcj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

console.log('Testing Supabase with URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('\n--- 1. Testing SELECT on businesses ---');
  const { data: bData, error: bErr } = await supabase.from('businesses').select('id, name_ar').limit(2);
  if (bErr) {
    console.error('SELECT businesses error:', bErr);
  } else {
    console.log('SELECT businesses success, count:', bData?.length, bData);
  }

  console.log('\n--- 2. Testing SELECT on representatives ---');
  const { data: rData, error: rErr } = await supabase.from('representatives').select('id, name, email').limit(2);
  if (rErr) {
    console.error('SELECT representatives error:', rErr);
  } else {
    console.log('SELECT representatives success, count:', rData?.length, rData);
  }

  console.log('\n--- 3. Testing INSERT on businesses ---');
  const testBizId = `test_biz_${Date.now()}`;
  const testBiz = {
    id: testBizId,
    name_ar: 'منشأة اختبار تجريبية',
    category: 'مطعم / مأكولات ومشويات',
    governorate: 'القاهرة',
    city: 'المعادي',
    street: 'شارع 9',
    phone: '01011112222',
    working_hours: '9 ص - 10 م',
    description: 'وصف اختباري',
    lat: 30.0444,
    lng: 31.2357,
    owner_name: 'صاحب اختبار',
    owner_phone: '01011112222',
    package_id: 'pkg_basic',
    package_name: '1. باقة التوثيق الأساسي',
    package_price: 250,
    amount_paid: 250,
    payment_status: 'fully_paid',
    verification_status: 'pending',
    rep_id: 'rep_1',
    rep_name: 'مندوب تجريبي',
    invoice_number: `INV-TEST-${Date.now()}`,
    invoice_date: new Date().toISOString().split('T')[0],
  };

  const { data: insData, error: insErr } = await supabase.from('businesses').insert(testBiz).select();
  if (insErr) {
    console.error('INSERT businesses error:', insErr);
  } else {
    console.log('INSERT businesses success:', insData);
  }

  console.log('\n--- 4. Testing UPDATE on businesses ---');
  if (!insErr && insData) {
    const { data: updData, error: updErr } = await supabase
      .from('businesses')
      .update({ description: 'وصف تم تحديثه بنجاح' })
      .eq('id', testBizId)
      .select();
    if (updErr) {
      console.error('UPDATE businesses error:', updErr);
    } else {
      console.log('UPDATE businesses success:', updData);
    }

    console.log('\n--- 5. Testing DELETE on businesses ---');
    const { data: delData, error: delErr } = await supabase
      .from('businesses')
      .delete()
      .eq('id', testBizId)
      .select();
    if (delErr) {
      console.error('DELETE businesses error:', delErr);
    } else {
      console.log('DELETE businesses success:', delData);
    }
  }

  console.log('\n--- 6. Testing INSERT on representatives ---');
  const testRepId = `test_rep_${Date.now()}`;
  const testRep = {
    id: testRepId,
    name: 'مندوب اختبار',
    email: `test_${Date.now()}@dalilak.com`,
    phone: '01099998888',
    governorate: 'القاهرة',
    target_month: 20,
    commission_rate: 42.86,
    status: 'active',
  };
  const { data: insRepData, error: insRepErr } = await supabase.from('representatives').insert(testRep).select();
  if (insRepErr) {
    console.error('INSERT representatives error:', insRepErr);
  } else {
    console.log('INSERT representatives success:', insRepData);
  }

  console.log('\n--- 7. Testing UPDATE on representatives ---');
  const { data: updRepData, error: updRepErr } = await supabase
    .from('representatives')
    .update({ target_month: 30 })
    .eq('id', 'rep_1788529754300')
    .select();
  console.log('UPDATE representatives result:', { data: updRepData, error: updRepErr });

  console.log('\n--- 8. Testing leads table ---');
  const { data: leadData, error: leadErr } = await supabase.from('leads').select('id').limit(1);
  console.log('SELECT leads result:', { count: leadData?.length, error: leadErr });
  const testLeadId = `lead_test_${Date.now()}`;
  const { data: leadIns, error: leadInsErr } = await supabase.from('leads').insert({ id: testLeadId, client_name: 'عميل اختبار', phone: '01011113333' }).select();
  console.log('INSERT leads result:', { count: leadIns?.length, error: leadInsErr });
  const { data: leadUpd, error: leadUpdErr } = await supabase.from('leads').update({ client_name: 'تحديث عميل' }).eq('id', testLeadId).select();
  console.log('UPDATE leads result:', { count: leadUpd?.length, error: leadUpdErr });
  const { data: leadDel, error: leadDelErr } = await supabase.from('leads').delete().eq('id', testLeadId).select();
  console.log('DELETE leads result:', { count: leadDel?.length, error: leadDelErr });

  console.log('\n--- 9. Testing payout_requests table ---');
  const { data: payData, error: payErr } = await supabase.from('payout_requests').select('id').limit(1);
  console.log('SELECT payout_requests result:', { count: payData?.length, error: payErr });
  const testPayId = `pay_test_${Date.now()}`;
  const { data: payIns, error: payInsErr } = await supabase.from('payout_requests').insert({ id: testPayId, rep_id: 'rep_1', amount: 100, method: 'instapay', account_details: '01000' }).select();
  console.log('INSERT payout_requests result:', { count: payIns?.length, error: payInsErr });
  const { data: payUpd, error: payUpdErr } = await supabase.from('payout_requests').update({ amount: 150 }).eq('id', testPayId).select();
  console.log('UPDATE payout_requests result:', { count: payUpd?.length, error: payUpdErr });
  const { data: payDel, error: payDelErr } = await supabase.from('payout_requests').delete().eq('id', testPayId).select();
  console.log('DELETE payout_requests result:', { count: payDel?.length, error: payDelErr });
}

test();
