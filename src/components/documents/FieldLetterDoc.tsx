import React from 'react';
import { Representative } from '../../types';

export interface FieldLetterDocProps {
  rep: Representative;
  repCode: string;
  nationalId: string;
}

export const FieldLetterDoc: React.FC<FieldLetterDocProps> = ({
  rep,
  repCode,
  nationalId,
}) => {
  const effectiveTitle = (rep.roleTitle || '').trim() || (
    rep.role === 'admin' ? 'مدير النظام (أدمن)' :
    rep.role === 'supervisor' ? 'مشرف إدارة منطقة ومحافظة' :
    rep.role === 'accountant' ? 'محاسب ومحصل فواتير إلكترونية' :
    'مندوب مبيعات وتوثيق ميداني'
  );

  const isExecutive = rep.role === 'admin' || effectiveTitle.includes('مدير') || effectiveTitle.includes('مديرة') || effectiveTitle.includes('تنفيذي');
  const isSupervisor = rep.role === 'supervisor' || effectiveTitle.includes('مشرف');
  const isAccountant = rep.role === 'accountant' || effectiveTitle.includes('محاسب') || effectiveTitle.includes('مالي');

  const letterTitle = isExecutive
    ? 'خطاب تكليف وتفويض قيادي وتنفيذي رسمي'
    : isSupervisor
    ? 'خطاب تكليف وتفويض إشرافي وميداني رسمي'
    : isAccountant
    ? 'خطاب تكليف وتفويض مالي وتدقيق رسمي'
    : 'خطاب تكليف وتصريح معاينة ميدانية رسمي';

  const letterSubtitle = isExecutive
    ? 'صادر إلى كافة المؤسسات والشركاء التجاريين والجهات المعنية في جمهورية مصر العربية'
    : isSupervisor
    ? `صادر إلى المؤسسات وأصحاب الأنشطة التجارية في نطاق قطاع محافظة ${rep.governorate}`
    : isAccountant
    ? 'صادر إلى أصحاب الأنشطة التجارية والمنشآت المسجلة والشركاء الماليين'
    : 'صادر إلى جميع أصحاب المحلات والمؤسسات التجارية في جمهورية مصر العربية';

  const signatoryLabel = isExecutive
    ? 'اعتماد مجلس الإدارة والمدير العام'
    : isSupervisor
    ? 'اعتماد المدير التنفيذي / المديرة العامة'
    : isAccountant
    ? 'اعتماد الإدارة المالية والتنفيذية'
    : 'اعتماد مشرف المحافظة والمدير التنفيذي';

  const signatoryName = isExecutive
    ? 'مجلس إدارة منصة دليلك'
    : isSupervisor
    ? 'أ. هند عبد الستار محمد (المديرة العامة)'
    : isAccountant
    ? 'الإدارة المالية والتنفيذية المركزية'
    : 'م. شريف الدسوقي / الإدارة التنفيذية';

  const signatorySub = isExecutive
    ? 'الاعتماد السيادي للمنظومة'
    : isSupervisor
    ? 'الإدارة المركزية العامة لمنظومة دليلك'
    : isAccountant
    ? 'الشؤون المالية والرقابة العامة'
    : `إدارة العمليات الميدانية — قطاع ${rep.governorate}`;

  return (
    <div className="space-y-4 text-xs leading-relaxed text-slate-800">
      <div className="text-center space-y-1 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
        <h3 className="font-black text-base text-slate-900">{letterTitle}</h3>
        <p className="text-[11px] text-slate-600 font-bold">{letterSubtitle}</p>
      </div>

      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
        <div><span className="font-bold text-slate-500">اسم المسؤول المعتمد:</span> <span className="font-black text-slate-900">{rep.name}</span></div>
        <div><span className="font-bold text-slate-500">المسمى الوظيفي:</span> <span className="font-black text-amber-800">{effectiveTitle}</span></div>
        <div><span className="font-bold text-slate-500">الرقم القومي:</span> <span className="font-mono font-bold text-slate-900">{nationalId}</span></div>
        <div><span className="font-bold text-slate-500">كود الحساب الرسمي:</span> <span className="font-mono font-bold text-emerald-800">{repCode}</span></div>
        <div><span className="font-bold text-slate-500">نطاق الاختصاص والمحافظة:</span> <span className="font-bold text-slate-900">محافظة {rep.governorate}</span></div>
        <div><span className="font-bold text-slate-500">رقم الهاتف المصرح:</span> <span className="font-mono font-bold text-slate-900">{rep.phone}</span></div>
      </div>

      <div className="space-y-2 text-justify text-slate-700 leading-normal">
        <p>
          تشهد <strong>منصة "دليلك للخدمات الرقمية وتوثيق الأنشطة التجارية"</strong> بأن السيد/ة: <strong>{rep.name}</strong> يشغل رسمياً وظيفة (<strong>{effectiveTitle}</strong>)، ومكلف ومفوض بمباشرة مهامه وصلاحياته القانونية والإدارية في نطاق <strong>محافظة {rep.governorate}</strong>.
        </p>
        {isExecutive ? (
          <p>
            ويفوض بموجب هذا التكليف بكافة الصلاحيات التنفيذية والقيادية لتمثيل المنظومة، واعتماد القرارات والسياسات العامة، ومتابعة نمو شبكة العمليات بالمحافظات، وتوقيع الاتفاقيات وبروتوكولات التعاون مع الهيئات والمؤسسات التجارية في جمهورية مصر العربية.
          </p>
        ) : isSupervisor ? (
          <p>
            ويصرح له بموجب هذا التفويض بالإشراف الميداني الشامل على قطاع محافظة {rep.governorate}، وقيادة وتدريب فرق المناديب، ومعاينة المنشآت الكبرى وتدقيق جودة وصحة الأنشطة الموثقة على خرائط جوجل، ومراجعة سير التغطية الجغرافية والتنسيق المباشر مع الإدارة التنفيذية.
          </p>
        ) : isAccountant ? (
          <p>
            ويصرح له بموجب هذا التكليف بمراجعة وتدقيق المستندات المالية، وإصدار الفواتير الإلكترونية الرسمية، وتحصيل وتسوية رسوم اشتراكات الأنشطة التجارية وتأكيد السداد، ومطابقة التوريدات والحسابات الرسمية لمنظومة دليلك.
          </p>
        ) : (
          <p>
            ويصرح له بموجب هذا التكليف بزيارة المحلات والمنشآت التجارية، ومعاينة الموقع الجغرافي، ورفع إحداثيات GPS الدقيقة، والتقاط صور الواجهات التجارية وتوثيق بياناتها، وتسليم الفواتير الرسمية وتحصيل الرسوم المعتمدة عبر المنظومة.
          </p>
        )}
        <p className="text-[11px] text-slate-500 font-medium">
          يرجى من كافة أصحاب المنشآت التجارية والجهات المعنية تقديم التسهيلات اللازمة لحامل هذه الوثيقة وفق مهامه وصلاحياته المبينة أعلاه.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
        <div className="space-y-1 text-center">
          <p className="text-[10px] text-slate-500 font-bold">ختم المنظومة المعتمد</p>
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600 flex items-center justify-center text-[9px] font-black text-amber-800 p-1 text-center bg-amber-50 transform rotate-12 shadow-xs">
            ختم دليلك الرسمي 2026
          </div>
        </div>

        <div className="space-y-1 text-center">
          <p className="text-[10px] text-slate-500 font-bold">{signatoryLabel}</p>
          <p className="font-black text-slate-900 text-xs mt-1.5">{signatoryName}</p>
          <p className="text-[9px] text-slate-500 font-bold">{signatorySub}</p>
        </div>
      </div>
    </div>
  );
};
