import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { Representative } from '../types';
import { Logo } from './Logo';
import { Printer, Download, ShieldCheck, FileSignature, Loader2 } from 'lucide-react';
import { downloadSinglePhoto } from '../utils/photoDownloader';
import { generateQrDataUrl } from '../utils/qrGenerator';

export type DocType = 'field_letter' | 'digital_badge' | 'rep_contract';

interface DocViewerModalProps {
  docType: DocType | null;
  rep: Representative;
  onClose: () => void;
}

export const DocViewerModal: React.FC<DocViewerModalProps> = ({ docType, rep, onClose }) => {
  const docRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (!docType) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [docType]);

  if (!docType) return null;

  const repCode = `REP-2026-${rep.id.replace(/\D/g, '') || '084'}`;
  const nationalId = rep.nationalId || '29805120104892';
  const qrData = `DALEELEK-OFFICIAL-CONTRACT-${rep.name}-${nationalId}-${repCode}`;
  const qrImageUrl = generateQrDataUrl(qrData, 150);

  const handleDownloadDocument = async () => {
    if (!docRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(docRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const docName =
        docType === 'field_letter'
          ? 'خطاب-تكليف-ميداني'
          : docType === 'digital_badge'
          ? 'بطاقة-هوية-رقمية'
          : 'عقد-مندوب-معتمد';
      await downloadSinglePhoto(dataUrl, `${docName}-${rep.name || 'مندوب'}-${repCode}.png`);
    } catch (err) {
      console.warn('Document capture notice, falling back to print:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative text-[var(--text-primary)] transition-colors duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-black border border-[var(--border-color)] cursor-pointer no-print z-10"
        >
          ✕
        </button>

        {/* Printable Official Document Container */}
        <div ref={docRef} className="bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-inner border border-slate-200 space-y-5">
          {/* Official Letterhead Header */}
          <div className="flex items-center justify-between border-b-2 border-amber-500 pb-4">
            <div className="flex items-center gap-3">
              <Logo size="md" showSubtitle={false} />
              <div>
                <h2 className="font-black text-base sm:text-lg text-slate-900">منصة "دليلك للخدمات الرقمية"</h2>
                <p className="text-[10px] text-slate-500 font-bold">تسجيل وتوثيق الأنشطة التجارية في جمهورية مصر العربية</p>
              </div>
            </div>

            <div className="text-left text-xs">
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 inline-block">
                وثيقة قانونية رسمية
              </span>
              <p className="font-mono font-bold text-slate-700 mt-1 text-[11px]">كود المندوب: {repCode}</p>
              <p className="text-[10px] text-slate-500">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          {/* DOCUMENT CONTENT 1: FIELD AUTHORIZATION LETTER (ROLE-SPECIFIC) */}
          {docType === 'field_letter' && (() => {
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
          })()}

          {/* DOCUMENT CONTENT 2: DIGITAL FIELD BADGE */}
          {docType === 'digital_badge' && (() => {
            const effectiveTitle = (rep.roleTitle || '').trim() || (
              rep.role === 'admin' ? 'مدير النظام (أدمن)' :
              rep.role === 'supervisor' ? 'مشرف إدارة منطقة ومحافظة' :
              rep.role === 'accountant' ? 'محاسب ومحصل فواتير إلكترونية' :
              'مندوب مبيعات وتوثيق ميداني'
            );

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
                    <img src={rep.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={rep.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shrink-0 shadow-md" />
                    <div className="space-y-0.5">
                      <h4 className="font-black text-sm text-white">{rep.name}</h4>
                      <p className="text-[11px] text-amber-300 font-black">{effectiveTitle}</p>
                      <p className="text-[10px] text-slate-300 font-bold">محافظة {rep.governorate}</p>
                      <p className="text-[10px] font-mono text-emerald-400 font-bold">ID: {repCode}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
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
          })()}

          {/* DOCUMENT CONTENT 3: OFFICIAL CONTRACT & AGREEMENT (ADAPTED BY ROLE & TITLE) */}
          {docType === 'rep_contract' && (() => {
            const effectiveTitle = (rep.roleTitle || '').trim() || (
              rep.role === 'admin' ? 'مدير النظام (أدمن)' :
              rep.role === 'supervisor' ? 'مشرف إدارة منطقة ومحافظة' :
              rep.role === 'accountant' ? 'محاسب ومحصل فواتير إلكترونية' :
              'مندوب مبيعات وتوثيق ميداني'
            );

            const isExecutive = rep.role === 'admin' || effectiveTitle.includes('مدير') || effectiveTitle.includes('مديرة') || effectiveTitle.includes('تنفيذي');
            const isSupervisor = rep.role === 'supervisor' || effectiveTitle.includes('مشرف');
            const isAccountant = rep.role === 'accountant' || effectiveTitle.includes('محاسب') || effectiveTitle.includes('مالي');

            // 1. Contract Titles & Preamble
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

            // 2. Hiring Authorities (المخول بالتوظيف)
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

            // 3. Tailored Clauses
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
                title: '📌 ثالثاً: ملكية البيانات وسريتها التامة',
                items: [
                  'تعد كافة البيانات، الصور، والإحداثيات الجغرافية المجمعة ملكية فكرية وحصرية لمنصة "دليلك".',
                  'حظر تسريب أو مشاركة البيانات أو الاحتفاظ بنسخ منها لصالح أي جهة خارجية أو استخدامها لشخص المندوب تحت طائلة القانون.',
                ],
              },
              {
                title: '📌 رابعاً: نظام التقييم والمستحقات والعمولات المالية',
                items: [
                  'ترتبط مستحقات المندوب بعدد البيانات المقبولة والمعتمدة نهائياً بعد مراجعتها من قِبل مشرف المحافظة وفريق ضبط الجودة.',
                  `يستحق الطرف الثاني عمولة معتمدة بنسبة (${rep.commissionRate || 42.86}%) عن كل اشتراك تم توثيقه وتأكيد سداده عبر المنظومة.`,
                  'تُستبعد البيانات الخاطئة، غير الواضحة، أو المصنوعة من حساب الأجر أو العمولة.',
                ],
              },
              {
                title: '⚠️ خامساً: حالات إنهاء التعاقد والجزاءات الفورية',
                items: [
                  'يتم إنهاء التكليف فوراً مع تطبيق الجزاءات المالية والقانونية في حال: استخدام برامج تزييف الموقع (Fake GPS)، أو إدخال بيانات وصور وهمية، أو تحصيل أي مبالغ مالية لحساب شخصي دون توريدها عبر المنظومة.',
                ],
                isWarning: true,
              },
            ];

            return (
              <div className="space-y-4 text-xs leading-relaxed text-slate-800 max-h-[60vh] overflow-y-auto pr-1">
                {/* Header Banner */}
                <div className="text-center space-y-1 bg-amber-50 p-3.5 rounded-2xl border border-amber-300">
                  <h3 className="font-black text-base text-slate-900">
                    {contractDocTitle}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-bold">
                    {contractDocIntro}
                  </p>
                </div>

                {/* Contracting Parties Card (بيانات أطراف التعاقد وجهة التوظيف المخولة) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="border-b border-slate-200 pb-2">
                    <p className="font-black text-slate-900">
                      🏢 <span className="text-amber-800">الطرف الأول (الجهة الموظفة والمفوضة بالتعاقد):</span> {partyFirstTitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="font-bold text-slate-500">اسم المتعاقد (الطرف الثاني):</span> <span className="font-black text-slate-900">{rep.name}</span></div>
                    <div><span className="font-bold text-slate-500">المسمى الوظيفي المعتمد:</span> <span className="font-black text-amber-800">{effectiveTitle}</span></div>
                    <div><span className="font-bold text-slate-500">الرقم القومي:</span> <span className="font-mono font-bold text-slate-900">{nationalId}</span></div>
                    <div><span className="font-bold text-slate-500">كود الحساب / العضوية:</span> <span className="font-mono font-bold text-emerald-800">{repCode}</span></div>
                    <div><span className="font-bold text-slate-500">نطاق المحافظة:</span> <span className="font-bold text-slate-900">محافظة {rep.governorate}</span></div>
                    <div>
                      <span className="font-bold text-slate-500">الاستحقاق المالي:</span>{' '}
                      <span className="font-bold text-slate-900">
                        {isExecutive ? 'مخصصات وبدلات قيادية معتمدة' : isSupervisor ? 'حوافز وبدلات إشراف إقليمي' : isAccountant ? 'مرتب وبدلات تعيين مالي' : `${rep.commissionRate || 42.86}% عمولة معتمدة لكل اشتراك`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Clauses */}
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
                      <span className="text-[10px] text-slate-500 font-mono block">التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
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
          })()}

          {/* Footer Verification Notice */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>وثيقة الكترونية رسمية مشفرة بضمان منصة دليلك 2026</span>
            </span>
            <img src={qrImageUrl} alt="QR Code" className="w-8 h-8 rounded border border-slate-300" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الوثيقة المعتمدة</span>
          </button>

          <button
            onClick={handleDownloadDocument}
            disabled={isDownloading}
            className="w-full sm:w-auto bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold text-xs py-3 px-4 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Download className="w-4 h-4" />}
            <span>{isDownloading ? 'جاري التحميل...' : 'تحميل نسخة'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
