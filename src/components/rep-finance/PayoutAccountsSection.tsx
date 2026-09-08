import React, { useState } from 'react';
import { safeGetLocalStorageItem, safeSetLocalStorageItem } from '../../utils/storage';
import { CheckCircle2, Save } from 'lucide-react';

export interface PayoutAccountsSectionProps {
  repId: string;
  defaultPhone: string;
}

export const PayoutAccountsSection: React.FC<PayoutAccountsSectionProps> = ({
  repId,
  defaultPhone,
}) => {
  const [payoutVoda, setPayoutVoda] = useState(
    safeGetLocalStorageItem(`dalelak_payout_voda_${repId}`) || defaultPhone
  );
  const [payoutInsta, setPayoutInsta] = useState(
    safeGetLocalStorageItem(`dalelak_payout_insta_${repId}`) || ''
  );
  const [savedPayoutNotice, setSavedPayoutNotice] = useState(false);

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    safeSetLocalStorageItem(`dalelak_payout_voda_${repId}`, payoutVoda);
    safeSetLocalStorageItem(`dalelak_payout_insta_${repId}`, payoutInsta);
    setSavedPayoutNotice(true);
    setTimeout(() => setSavedPayoutNotice(false), 3000);
  };

  return (
    <div className="pt-2 border-t border-[var(--border-color)]">
      <form onSubmit={handleSavePayout} className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-xs text-[var(--text-primary)]">
            وسائل استلام العمولات والأرباح
          </h4>
          {savedPayoutNotice && (
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>تم حفظ الوسائل بنجاح!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">
              رقم فودافون كاش لتحويل العمولات:
            </label>
            <input
              type="text"
              placeholder="01012345678"
              value={payoutVoda}
              onChange={(e) => setPayoutVoda(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-500 font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">
              معرف إنستاباي (InstaPay Handle):
            </label>
            <input
              type="text"
              placeholder="@username"
              value={payoutInsta}
              onChange={(e) => setPayoutInsta(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-purple-500 font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-purple-500 shadow-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ وسائل التحويل</span>
          </button>
        </div>
      </form>
    </div>
  );
};
