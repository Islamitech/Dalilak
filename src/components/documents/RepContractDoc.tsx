import React from 'react';
import { Representative } from '../../types';
import { FileSignature } from 'lucide-react';
import { formatStandardDate } from '../../utils/dateFormatters';

export interface RepContractDocProps {
  rep: Representative;
  repCode: string;
  nationalId: string;
}

export const RepContractDoc: React.FC<RepContractDocProps> = ({
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

  // Contract Titles & Preamble
  const contractDocTitle = isExecutive
    ? `عقد تعيين وتكليف قيادي وتنفيذي — (${effectiveTitle})`
    : isSupervisor
    ? `عقد تعيين وتكليف إداري وإشرافي — (${effectiveTitle})`
    : isAccountant
    ? `عقد تعيين وتكليف مالي وتدقيق — (${effectiveTitle})`
    : `عقد تعيين وتكليف ميداني — (${effectiveTitle})`;

  const contractDocIntro = isExecutive
    ? 'تحدد هذه الوثيقة الصلاحيات والمسؤوليات القيادية العليا لإدارة المنظومة التشغيلية لـ "دليلك"، وتوجيه المشرفين وفرق العمل بموجب اعتماد مجلس الإدارة والمدير العام.'
    : isSupervisor
    ? `يحدد هذا العقد الصلاحيات والمسؤوليات الإشرافية لقيادة فريق المناديب بنطاق محافظة ${rep.governorate}، وضمان جودة التوثيق والتحصيل وتدريب الكوادر، بموجب تفويض رسمي من الإدارة التنفيذية.`
    : isAccountant
    ? 'يحدد هذا العقد الواجبات والضوابط المالية لإدارة حسابات المنصة، تدقيق الفواتير الإلكترونية، تأكيد التحصيلات، ومراجعة طلبات صرف العمولات، بموجب تفويض رسمي من الإدارة التنفيذية.'
    : `تحدد هذه الوثيقة الشروط والأحكام المنظمة لعمليات المسح الميداني وجمع وتوثيق بيانات الأنشطة التجارية بنطاق محافظة ${rep.governorate}، وتعد موافقة الطرف الثاني شرطاً أساسياً للعمل واستحقاق العمولات.`;

  const partyFirstTitle = isExecutive
    ? 'مجلس الإدارة والمدير العام لمنظومة "دليلك"'
    : isSupervisor
    ? 'المدير التنفيذي للمنظومة / المديرة العامة (المخول بالتعاقد)'
    : isAccountant
    ? 'المدير التنفيذي / الإدارة المالية والتنفيذية المركزية'
    : 'مشرف المحافظة المعتمد أو المدير التنفيذي (المخول بالتوظيف)';

  const signatoryBoxDept = isExecutive
    ? 'اعتماد مجلس الإدارة والمدير العام'
    : isSupervisor
    ? 'اعتماد المدير التنفيذي / المديرة العامة'
    : isAccountant
    ? 'اعتماد الإدارة المالية والتنفيذية المركزية'
    : 'اعتماد مشرف المحافظة والمدير التنفيذي';

  const signatoryBoxName = isExecutive
    ? 'مجلس إدارة منصة دليلك'
    : isSupervisor
    ? 'أ. هند عبد الستار محمد (المديرة العامة)'
    : isAccountant
    ? 'الإدارة المالية والتنفيذية المركزية'
    : 'م. شريف الدسوقي / الإدارة التنفيذية';

  const signatoryBoxRole = isExecutive
    ? 'الاعتماد السيادي للمنظومة'
    : isSupervisor
    ? 'الإدارة المركزية العامة لمنظومة دليلك'
    : isAccountant
    ? 'الشؤون المالية والرقابة العامة'
    : `مشرف عام قطاع المحافظات والتوظيف`;

  const clauses = isExecutive ? [
    {
      title: '📌 أولاً: نطاق الصلاحيات والمهام القيادية والتنفيذية',
      items: [
        'الإشراف العام والتوجيه الاستراتيجي لكافة فروع وقطاعات المنظومة على مستوى محافظات الجمهورية.',
        'إصدار وتوقيع قرارات التعيين والتكليف الإداري لمشرفي المحافظات والمحاسبين الماليين وفرق العمل.',
        'اعتماد السياسات التشغيلية، ومراجعة خطط التوسع الميداني، وتطوير البنية التقنية والخدمات الرقمية لمنصة دليلك.',
        'الرقابة السيادية على أمان وحوكمة المنظومة، وحفظ حقوق جميع أطراف العمل والشركاء والمستخدمين.',
      ],
    },
    {
      title: '📌 ثانياً: التمثيل المؤسسي وتوقيع الشراكات',
      items: [
        'تمثيل المنصة رسمياً أمام كافة المؤسسات والهيئات الحكومية والتجارية في جمهورية مصر العربية.',
        'اعتماد العقود والاتفاقيات وبروتوكولات التعاون والتوثيق التجاري المشترك وحل أي معوقات استراتيجية.',
      ],
    },
    {
      title: '📌 ثالثاً: الحوكمة والنزاهة المؤسسية',
      items: [
        'ضمان تطبيق أعلى معايير الشفافية والعدالة وحفظ حقوق الكوادر الميدانية والإدارية والمالية.',
        'حماية الملكية الفكرية والعلامة التجارية لمنصة دليلك والارتقاء بالقيمة السوقية والمصداقية المهنية.',
      ],
    },
    {
      title: '📌 رابعاً: الاستحقاقات والمخصصات القيادية',
      items: [
        'استحقاق المخصصات القيادية والبدلات التنفيذية المعتمدة بقرار مجلس الإدارة وخطط الحوافز العامة.',
      ],
    },
  ] : isSupervisor ? [
    {
      title: '📌 أولاً: نطاق القيادة والمسؤوليات الإشرافية بالمحافظة',
      items: [
        `قيادة وإدارة فريق المناديب الميدانيين وتوزيعهم جغرافياً على مناطق ومراكز محافظة ${rep.governorate}.`,
        'المراجعة والتدقيق اليومي لجودة وصحة الأنشطة المرفوعة من المناديب قبل اعتمادها وتوثيقها على الخرائط.',
        `متابعة تحقيق المستهدف الشهري للمحافظة المحدد بـ (${rep.targetMonth || 50} نشاط شهرياً) وتطوير معدلات التغطية.`,
        'إجراء المقابلات واختبارات القبول وتدريب المناديب الجدد داخل نطاق المحافظة وتأهيلهم للنزول الميداني.',
      ],
    },
    {
      title: '📌 ثانياً: الصلاحيات الرقابية والميدانية',
      items: [
        'متابعة ومراقبة خطوط سير المناديب عبر المنظومة والتأكد من التواجد الميداني الفعلي والالتزام بالمسار.',
        'التوصية باعتماد، أو تعليق، أو استبعاد المناديب غير الملتزمين بالمعايير المهنية للمنظومة.',
        'التنسيق المستمر مع الإدارة التنفيذية والمالية ورفع تقارير دورية شاملة عن مؤشرات الأداء والتحصيل بالمحافظة.',
      ],
    },
    {
      title: '📌 ثالثاً: سرية الخطط الإدارية وحماية البيانات',
      items: [
        'الحفاظ التام على سرية خطط الانتشار الإقليمي، قوائم العملاء، ومؤشرات الأداء للمحافظة.',
        'حظر استغلال البيانات الإشرافية أو شبكة المناديب لصالح أي أعمال منافسة أو خارج إطار المنظومة.',
      ],
    },
    {
      title: '📌 رابعاً: المكافآت والحوافز الإشرافية',
      items: [
        'استحقاق المخصصات المالية وحوافز الإشراف المعتمدة من الإدارة التنفيذية بناءً على نسبة إنجاز مستهدفات المحافظة وجودة العمل.',
      ],
    },
    {
      title: '⚠️ خامساً: ضوابط الانضباط الإداري وإنهاء التكليف',
      items: [
        'يتم سحب التكليف الإشرافي في حال التقصير في الرقابة الميدانية، أو تهاون المشرف في تدقيق صحة بيانات المناديب، أو مخالفة تعليمات الإدارة العليا.',
      ],
      isWarning: true,
    },
  ] : isAccountant ? [
    {
      title: '📌 أولاً: المهام والمسؤوليات المالية والمحاسبية',
      items: [
        'إدارة وتدقيق العمليات المالية، إصدار الفواتير الإلكترونية المعتمدة للمحلات والأنشطة التجارية.',
        'مراجعة وتأكيد سداد الاشتراكات عبر بوابات الدفع الإلكترونية، المحافظ الذكية، وحسابات إنستاباي.',
        'تدقيق ومطابقة طلبات صرف العمولات المقدمة من المناديب والمشرفين والتأكد من مطابقتها للتوريدات الفعلية المسددة.',
        'إعداد التسويات المالية الدورية، كشوف الحساب، والمطابقات الحسابية الدقيقة للإيرادات والمصروفات.',
      ],
    },
    {
      title: '📌 ثانياً: ضوابط النزاهة والتدقيق الصارم',
      items: [
        'الالتزام التام بالشفافية المطلقة والدقة الحسابية، وحظر تمرير أو اعتماد أي تسوية مالية غير مستوفاة للأدلة والمستندات.',
        'الإشراف على عمليات التوريد النقدي الميداني ومطابقة المبالغ المحصلة مع سجلات المنظومة فوراً.',
        'رفع تقارير مالية وتحليلية منتظمة للإدارة التنفيذية ومجلس الإدارة عن التدفقات النقدية والمستحقات.',
      ],
    },
    {
      title: '📌 ثالثاً: السرية المطلقة للبيانات والمعاملات المالية',
      items: [
        'تعتبر كافة السجلات الحسابية، أرصدة الحسابات البنكية، أرقام المعاملات، وقوائم التحصيل أسراراً مهنية بالغة الأهمية.',
        'يحظر كشف أو إفشاء أي معلومة مالية لأي طرف داخلي أو خارجي دون تفويض مكتوب من المدير التنفيذي.',
      ],
    },
    {
      title: '📌 رابعاً: الاستحقاقات والمخصصات المالية',
      items: [
        'استحقاق الراتب أو الحافز المالي المعتمد وفق قرار التعيين الصادر من الإدارة التنفيذية للمنظومة.',
      ],
    },
    {
      title: '⚠️ خامساً: المسؤولية القانونية والجزاءات',
      items: [
        'يتم إنهاء التكليف فوراً والمساءلة القانونية والجنائية في حال ثبوت أي تلاعب بالدفاتر أو القيود المحاسبية، أو التقصير في حماية أموال المنصة.',
      ],
      isWarning: true,
    },
  ] : [
    {
      title: '📌 أولاً: طبيعة المهام ونطاق العمل الميداني',
      items: [
        `إجراء المسح الميداني الشامل للمناطق الجغرافية المستهدفة والمحددة بنطاق محافظة ${rep.governorate}.`,
        'حصر وتسجيل بيانات الأنشطة التجارية (الاسم، العنوان التفصيلي، أرقام التواصل، طبيعة النشاط، مواعيد العمل).',
        'التقاط واجهات المتاجر واللوحات الإعلانية بوضوح وتحديد الإحداثيات الجغرافية (GPS) بدقة عبر التطبيق المخصص.',
        'تقديم وشرح باقات التوثيق الرقمي والظهور على خرائط جوجل الرسمية لأصحاب الأنشطة التجارية وحثهم على الاشتراك.',
      ],
    },
    {
      title: '📌 ثانياً: الالتزامات وضوابط الأداء والنزاهة المهنية',
      items: [
        'الأمانة والدقة: الالتزام التام بالصحة المطلقة للبيانات المرفوعة، وتجنب تسجيل بيانات مكررة أو غير مكتملة أو وهمية.',
        'التتبع الميداني: التعهد بتفعيل تتبع الموقع الجغرافي (GPS) على تطبيق العمل طوال ساعات التغطية الميدانية للتحقق من المسار المعتمد.',
        'عهد الأجهزة والمعدات: الحفاظ على سلامة أجهزة التتبع أو الهواتف المسلمة من المنصة، وتحمل تكلفة الصيانة الناتجة عن التقصير.',
        'تمثيل العلامة التجارية: الالتزام بالزي والمظهر اللائق والتعامل المهني المرموق مع أصحاب المحلات التجارية بصفة المندوب ممثلاً رسمياً للمنصة.',
      ],
    },
    {
      title: '📌 ثالثاً: الاستحقاقات والعمولات المالية',
      items: [
        `استحقاق عمولة رسمية محددة بنسبة (${rep.commissionRate || 42.86}%) من قيمة كل اشتراك مسدد بالكامل ومعتمد وموثق بنجاح.`,
        'يتم تقديم طلبات صرف العمولات دورياً عبر لوحة الحسابات الخاصة بالمندوب بعد تأكيد التحصيل ومطابقة الفواتير.',
      ],
    },
    {
      title: '⚠️ رابعاً: المحظورات والمسؤولية القانونية',
      items: [
        'يحظر تحصيل أي مبالغ نقدية من أصحاب الأنشطة دون تسليم فاتورة إلكترونية رسمية معتمدة من النظام تفيد السداد.',
        'يحظر التلاعب بإحداثيات المواقع أو استخدام صور غير حقيقية أو استغلال بيانات العملاء لأي غرض غير مصرح به.',
        'يتحمل المندوب المسؤولية القانونية الكاملة والمساءلة الجنائية في حال ثبوت أي تلاعب مالي أو انتحال صفة غير مصرح بها.',
      ],
      isWarning: true,
    },
  ];

  return (
    <div className="space-y-4 text-xs leading-relaxed text-slate-800">
      <div className="text-center space-y-1 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
        <h3 className="font-black text-base text-slate-900">{contractDocTitle}</h3>
        <p className="text-[11px] text-slate-600 font-bold">{contractDocIntro}</p>
      </div>

      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="font-bold text-slate-500">الطرف الأول:</span> <span className="font-black text-slate-900">{partyFirstTitle}</span></div>
          <div><span className="font-bold text-slate-500">الطرف الثاني:</span> <span className="font-black text-amber-800">{rep.name}</span></div>
          <div><span className="font-bold text-slate-500">المسمى المعتمد:</span> <span className="font-black text-slate-900">{effectiveTitle}</span></div>
          <div><span className="font-bold text-slate-500">كود الحساب:</span> <span className="font-mono font-bold text-emerald-800">{repCode}</span></div>
          <div><span className="font-bold text-slate-500">الرقم القومي:</span> <span className="font-mono font-bold text-slate-900">{nationalId}</span></div>
          <div><span className="font-bold text-slate-500">المحافظة:</span> <span className="font-bold text-slate-900">محافظة {rep.governorate}</span></div>
          <div>
            <span className="font-bold text-slate-500">الاستحقاق المالي:</span>{' '}
            <span className="font-bold text-slate-900">
              {isExecutive ? 'مخصصات وبدلات قيادية معتمدة' : isSupervisor ? 'حوافز وبدلات إشراف إقليمي' : isAccountant ? 'مرتب وبدلات تعيين مالي' : `${rep.commissionRate || 42.86}% عمولة معتمدة لكل اشتراك`}
            </span>
          </div>
        </div>
      </div>

      {clauses.map((clause, idx) => (
        <div
          key={idx}
          className={`space-y-1 p-3 rounded-xl border ${
            clause.isWarning
              ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <h4
            className={`font-black text-xs flex items-center gap-1 ${
              clause.isWarning ? 'text-rose-900' : 'text-amber-900'
            }`}
          >
            <span>{clause.title}</span>
          </h4>
          <ul
            className={`list-disc list-inside space-y-1 pl-2 text-[11px] ${
              clause.isWarning ? 'text-rose-900' : 'text-slate-700'
            }`}
          >
            {clause.items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      {/* SIGNATURES & AUTHORIZATION BOX */}
      <div className="bg-amber-100/70 border-2 border-amber-400 p-4 rounded-2xl space-y-3 text-xs">
        <div className="flex items-center gap-2 text-amber-900 font-black border-b border-amber-300 pb-1.5">
          <FileSignature className="w-4 h-4 text-amber-700" />
          <span>إقرار وتعهد الطرف الثاني (المتعاقد):</span>
        </div>

        <p className="text-slate-900 font-bold leading-relaxed text-[11px]">
          أقر أنا المتعاقد/ <strong className="text-amber-900 text-xs">{rep.name}</strong><br />
          بصفتي الوظيفية المعتمدة/ <strong className="text-slate-900 text-xs">({effectiveTitle})</strong> — بطاقة رقم قومي/ <strong className="font-mono text-slate-900 text-xs">{nationalId}</strong><br />
          بأنني اطلعت على كافة بنود وشروط هذا العقد، وتفهمت طبيعة اختصاصاتي ومسؤولياتي المحددة بموجبه، وأتعهد بالالتزام التام بكافة الواجبات والتعليمات الصادرة من المنظومة، وأتحمل المسؤولية الإدارية والمالية والقانونية كاملة في حال مخالفتها.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-amber-300 pt-3 text-[11px]">
          <div className="space-y-1">
            <span className="text-slate-600 font-bold block">توقيع وإقرار المتعاقد (الطرف الثاني):</span>
            <p className="font-black text-amber-950 font-mono text-xs">{rep.name} ✔</p>
            <span className="text-[10px] text-emerald-800 font-bold block">توقيع إلكتروني موثق برقم الهوية</span>
            <span className="text-[10px] text-slate-500 font-mono block">التاريخ: {formatStandardDate(new Date())}</span>
          </div>

          <div className="space-y-1 border-t sm:border-t-0 sm:border-r border-amber-300 pt-2 sm:pt-0 sm:pr-3">
            <span className="text-slate-600 font-bold block">{signatoryBoxDept}:</span>
            <p className="font-black text-slate-900 text-xs">{signatoryBoxName}</p>
            <span className="text-[10px] text-slate-600 font-bold block">{signatoryBoxRole}</span>
            <div className="inline-block mt-1 px-2 py-0.5 rounded border border-amber-500 bg-amber-50 text-[9px] font-black text-amber-900">
              معتمد ومسجل إلكترونياً بنظام دليلك 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
