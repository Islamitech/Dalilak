import React from 'react';
import { Representative } from '../../types';
import { Logo } from '../Logo';

export interface DigitalBadgeDocProps {
  rep: Representative;
  repCode: string;
  nationalId: string;
  qrImageUrl: string;
}

export const DigitalBadgeDoc: React.FC<DigitalBadgeDocProps> = ({
  rep,
  repCode,
  nationalId,
  qrImageUrl,
}) => {
  const effectiveTitle = (rep.roleTitle || '').trim() || (
    rep.role === 'admin' ? 'مدير النظام (أدمن)' :
    rep.role === 'supervisor' ? 'مشرف إدارة منطقة ومحافظة' :
    rep.role === 'accountant' ? 'محاسب ومحصل فواتير إلكترونية' :
    'مندوب مبيعات وتوثيق ميداني'
  );

  const isAvatarApproved = rep.role === 'admin' || rep.avatarStatus === 'approved';
  const badgeAvatarSrc = (isAvatarApproved && rep.avatar) ? rep.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';

  return (
    <div className="space-y-4 text-xs">
      <div className="text-center">
        <h3 className="font-black text-base text-slate-900">بطاقة الهوية الرقمية المعتمدة</h3>
        <p className="text-slate-500 text-[11px]">يمكن إبراز هذه البطاقة للعملاء والجهات الرسمية والتأكد عبر الـ QR Code</p>
      </div>

      <div className="max-w-sm mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-5 rounded-3xl border-2 border-amber-500 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <Logo size="sm" showSubtitle={false} />
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
            حساب موثق ونشط ✔
          </span>
        </div>

        <div className="flex items-center gap-3">
          <img src={badgeAvatarSrc} alt={rep.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shrink-0 shadow-md" />
          <div className="space-y-0.5">
            <h4 className="font-black text-sm text-white">{rep.name}</h4>
            <p className="text-[11px] text-amber-300 font-black">{effectiveTitle}</p>
            <p className="text-[10px] text-slate-300 font-bold">محافظة {rep.governorate}</p>
            <p className="text-[10px] font-mono text-emerald-400 font-bold">ID: {repCode}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-300 space-y-0.5">
            <p><span className="text-slate-400">الرقم القومي:</span> <span className="font-mono font-bold text-white">{nationalId}</span></p>
            <p><span className="text-slate-400">الهاتف:</span> <span className="font-mono font-bold text-white">{rep.phone}</span></p>
            <p><span className="text-slate-400">الصفة:</span> <span className="font-bold text-amber-400">{effectiveTitle}</span></p>
          </div>
          <img src={qrImageUrl} alt="QR Code" className="w-14 h-14 bg-white p-0.5 rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  );
};
