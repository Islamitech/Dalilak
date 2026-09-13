import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
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

  const cached = safeGetLocalStorageItem('dalelak_payment_config');
  if (cached) {
    const parsed = safeParseJson<PaymentGatewayConfig>(cached, null as any);
    if (parsed) return parsed;
  }

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

  try {
    safeSetLocalStorageItem('dalelak_payment_config', JSON.stringify(config));
  } catch {}

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
}
