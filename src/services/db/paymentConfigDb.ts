import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PaymentGatewayConfig } from '../../types';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, safeParseJson, getApiAuthHeaders } from '../../utils/storage';


export async function fetchPaymentConfigFromDb(): Promise<PaymentGatewayConfig | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('payment_config').select('*').limit(1).maybeSingle();
      if (!error && data) {
        return {
          vodafoneCashNumber: data.vodafone_cash_number || data.voda_number || '01143888355',
          vodafoneCashNumber2: data.vodafone_cash_number_2 || data.voda_number_2 || undefined,
          fawryMerchantCode: data.fawry_merchant_code || undefined,
          instaPayHandle: data.insta_pay_handle || '@daz31181',
          cardGatewayActive: data.card_gateway_active ?? true,
        };
      }
    } catch (err) {
      console.error('Supabase fetch payment config error:', err);
    }
  }

  try {
    const localRes = await fetch('/api/payment-config');
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && typeof localData === 'object') {
        return localData;
      }
    }
  } catch {}

  return null;
}

export async function savePaymentConfigToDb(config: PaymentGatewayConfig): Promise<void> {
  const dbRecord = {
    id: 'default',
    vodafone_cash_number: config.vodafoneCashNumber,
    vodafone_cash_number_2: config.vodafoneCashNumber2 || null,
    fawry_merchant_code: config.fawryMerchantCode || null,
    insta_pay_handle: config.instaPayHandle || '@daz31181',
    card_gateway_active: config.cardGatewayActive ?? true,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('payment_config').upsert([dbRecord]);
      if (error) {
        await supabaseRestFetch('payment_config', {
          method: 'POST',
          body: JSON.stringify(dbRecord),
        });
      }
    } catch (err) {
      console.error('Supabase save payment config error:', err);
    }
  }

  try {
    await fetch('/api/payment-config', {
      method: 'POST',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  } catch {}
}
