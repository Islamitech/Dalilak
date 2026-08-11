import React from 'react';
import { Representative } from '../types';
import { Logo } from './Logo';
import { Printer, Download, ShieldCheck, CheckCircle2, FileText, MapPin, QrCode, Award, Lock, FileSignature } from 'lucide-react';

export type DocType = 'field_letter' | 'digital_badge' | 'rep_contract';

interface DocViewerModalProps {
  docType: DocType | null;
  rep: Representative;
  onClose: () => void;
}

export const DocViewerModal: React.FC<DocViewerModalProps> = ({ docType, rep, onClose }) => {
  if (!docType) return null;

  const repCode = `REP-2026-${rep.id.replace(/\D/g, '') || '084'}`;
  const nationalId = rep.nationalId || '29805120104892';
  const qrData = encodeURIComponent(`DALEELEK-OFFICIAL-CONTRACT-${rep.name}-${nationalId}-${repCode}`);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto relative text-[var(--text-primary)] transition-colors duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-black border border-[var(--border-color)] cursor-pointer no-print z-10"
        >
          ✕
        </button>

        {/* Printable Official Document Container */}
        <div className="bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-inner border border-slate-200 space-y-5">
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

          {/* DOCUMENT CONTENT 1: FIELD AUTHORIZATION LETTER */}
          {docType === 'field_letter' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="text-center space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <h3 className="font-black text-base text-slate-900">خطاب تكليف وتصريح معاينة ميدانية رسمي</h3>
                <p className="text-[11px] text-slate-600 font-bold">صادر إلى جميع أصحاب المحلات والمؤسسات التجارية في جمهورية مصر العربية</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-bold text-slate-500">اسم المندوب المعتمد:</span> <span className="font-black text-slate-900">{rep.name}</span></div>
                <div><span className="font-bold text-slate-500">الرقم القومي:</span> <span className="font-mono font-bold text-slate-900">{nationalId}</span></div>
                <div><span className="font-bold text-slate-500">المحافظة والنطاق الميداني:</span> <span className="font-bold text-amber-800">{rep.governorate}</span></div>
                <div><span className="font-bold text-slate-500">رقم الهاتف المصرح:</span> <span className="font-mono font-bold text-slate-900">{rep.phone}</span></div>
              </div>

              <div className="space-y-2 text-justify text-slate-700">
                <p>
                  تشهد **شركة دليلك لخدمات الخرائط والتأكيد الميداني** بأن السيد/ **{rep.name}** هو مندوب مسح وتوثيق ميداني معتمد ومكلف رسمياً بالعمل في نطاق **محافظة {rep.governorate}**.
                </p>
                <p>
                  ويصرح له بموجب هذا التكليف بزيارة المحلات والمنشآت التجارية، ومعاينة الموقع الجغرافي، ورفع إحداثيات GPS الدقيقة، واستلام الفواتير وإصدار إيصالات السداد المعتمدة عبر المنصة.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div className="space-y-1 text-center">
                  <p className="text-[10px] text-slate-500 font-bold">ختم المنظومة المعتمد</p>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600 flex items-center justify-center text-[9px] font-black text-amber-800 p-1 text-center bg-amber-50 transform rotate-12">
                    ختم دليلك الرسمي
                  </div>
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[10px] text-slate-500 font-bold">اعتماد الشؤون الميدانية</p>
                  <p className="font-black text-slate-900 text-xs mt-2">م. شريف الدسوقي</p>
                  <p className="text-[9px] text-slate-500">مدير القطاعات والمحافظات</p>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT CONTENT 2: DIGITAL FIELD BADGE */}
          {docType === 'digital_badge' && (
            <div className="space-y-4 text-xs">
              <div className="text-center">
                <h3 className="font-black text-base text-slate-900">بطاقة الهوية الرقمية للمندوب الميداني</h3>
                <p className="text-slate-500 text-[11px]">يمكن إبراز هذه البطاقة للعملاء والتأكد عبر الـ QR Code</p>
              </div>

              <div className="max-w-sm mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-5 rounded-3xl border-2 border-amber-500 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <Logo size="sm" showSubtitle={false} />
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                    نشط وموثق
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img src={rep.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={rep.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="font-black text-sm text-white">{rep.name}</h4>
                    <p className="text-[11px] text-amber-300 font-bold">{rep.roleTitle || 'مندوب توثيق ميداني'}</p>
                    <p className="text-[10px] text-slate-300">محافظة {rep.governorate}</p>
                    <p className="text-[10px] font-mono text-emerald-400 font-bold">ID: {repCode}</p>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-300 space-y-0.5">
                    <p><span className="text-slate-400">الرقم القومي:</span> {nationalId}</p>
                    <p><span className="text-slate-400">الهاتف:</span> {rep.phone}</p>
                    <p><span className="text-slate-400">العمولة المعتمدة:</span> {rep.commissionRate || 42.86}%</p>
                  </div>
                  <img src={qrImageUrl} alt="QR Code" className="w-14 h-14 bg-white p-0.5 rounded-lg shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT CONTENT 3: OFFICIAL REPRESENTATIVE CONTRACT & AGREEMENT (Full Legal Terms) */}
          {docType === 'rep_contract' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-800 max-h-[60vh] overflow-y-auto pr-1">
              <div className="text-center space-y-1 bg-amber-50 p-3.5 rounded-2xl border border-amber-300">
                <h3 className="font-black text-base text-slate-900">
                  وثيقة وشروط انضمام مندوب الجمع الميداني — منصة "دليلك للخدمات الرقمية"
                </h3>
                <p className="text-[11px] text-slate-600 font-bold">
                  تحدد هذه الوثيقة الشروط والأحكام المنظمة لعمل مندوبي المسح الميداني وجمع البيانات التابعين لمنصة "دليلك"، وتُعد موافقة المندوب عليها شرطاً أساسياً لبدء العمل واستحقاق التعويضات المالية.
                </p>
              </div>

              {/* Data Summary Grid */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-bold text-slate-500">اسم المندوب:</span> <span className="font-black text-slate-900">{rep.name}</span></div>
                <div><span className="font-bold text-slate-500">الرقم القومي:</span> <span className="font-mono font-bold text-slate-900">{nationalId}</span></div>
                <div><span className="font-bold text-slate-500">كود المندوب:</span> <span className="font-mono font-bold text-amber-800">{repCode}</span></div>
                <div><span className="font-bold text-slate-500">نطاق العمل:</span> <span className="font-bold text-slate-900">محافظة {rep.governorate}</span></div>
              </div>

              {/* CLAUSE 1 */}
              <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-900 text-xs text-amber-900 flex items-center gap-1">
                  <span>📌 أولاً: طبيعة المهام ونطاق العمل</span>
                </h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1 pl-2 text-[11px]">
                  <li>إجراء المسح الميداني الشامل للمناطق الجغرافية المستهدفة والمحددة من قِبل إدارة عمليات المنصة.</li>
                  <li>حصر وتسجيل بيانات الأنشطة التجارية (الاسم، العنوان التفصيلي، أرقام التواصل، طبيعة النشاط، مواعيد العمل).</li>
                  <li>التقاط واجهات المتاجر واللوحات الإعلانية بوضوح وتحديد الإحداثيات الجغرافية (GPS) بدقة عبر التطبيق المخصص.</li>
                </ul>
              </div>

              {/* CLAUSE 2 */}
              <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-900 text-xs text-amber-900 flex items-center gap-1">
                  <span>📌 ثانياً: الالتزامات وضوابط الأداء</span>
                </h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1 pl-2 text-[11px]">
                  <li><strong>الأمانة والدقة:</strong> الالتزام التام بالصحة المطلقة للبيانات المرفوعة، وتجنب تسجيل بيانات مكررة أو غير مكتملة.</li>
                  <li><strong>التتبع الميداني:</strong> التعهد بتفعيل تتبع الموقع الجغرافي (GPS) على تطبيق العمل طوال ساعات التغطية الميدانية للتحقق من الخطط التقديمية للمسار.</li>
                  <li><strong>عهد الأجهزة والمعدات:</strong> الحفاظ على سلامة أجهزة التتبع أو الهواتف الذكية المُسلمة من الشركة، وتحمل تكلفة صيانة أو استبدال الجهاز في حال التلف الناتج عن التقصير.</li>
                  <li><strong>تمثيل العلامة التجارية:</strong> الالتزام بالزي والمظهر اللائق والتعامل المهني مع أصحاب المحلات التجارية بصفة المندوب ممثلاً رسمياً للمنصة.</li>
                </ul>
              </div>

              {/* CLAUSE 3 */}
              <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-900 text-xs text-amber-900 flex items-center gap-1">
                  <span>📌 ثالثاً: ملكية البيانات وسريتها</span>
                </h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1 pl-2 text-[11px]">
                  <li>تعد كافة البيانات، الصور، والإحداثيات الجغرافية المجمعة ملكية فكرية وحصرية لمنصة "دليلك".</li>
                  <li>حظر تسريب أو مشاركة البيانات أو الاحتفاظ بنسخ منها لصالح أي جهة خارجية أو استخدامها لشخص المندوب، ويُعاقب المخالف طبقاً للقوانين المنظمة لحماية البيانات والترخيص.</li>
                </ul>
              </div>

              {/* CLAUSE 4 */}
              <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-900 text-xs text-amber-900 flex items-center gap-1">
                  <span>📌 رابعاً: نظام التقييم والمستحقات المالية</span>
                </h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1 pl-2 text-[11px]">
                  <li>ترتبط مستحقات المندوب بعدد البيانات المقبولة والمعتمدة نهائياً بعد مراجعتها من فريق ضبط الجودة (Quality Control).</li>
                  <li>تُستبعد البيانات الخاطئة، غير الواضحة، أو المصنوعة من حساب الأجر الأسبوعي/الشهري.</li>
                </ul>
              </div>

              {/* CLAUSE 5 */}
              <div className="space-y-1 bg-rose-50 p-3 rounded-xl border border-rose-200">
                <h4 className="font-black text-rose-900 text-xs flex items-center gap-1">
                  <span>⚠️ خامساً: حالات إنهاء التعاقد والجزاءات</span>
                </h4>
                <p className="text-[11px] text-rose-800 font-bold">يتم إنهاء التكليف فوراً مع تطبيق الجزاءات المالية والقانونية في الحالات التالية:</p>
                <ul className="list-disc list-inside text-rose-900 space-y-1 pl-2 text-[11px]">
                  <li>استخدام برامج تزييف الموقع الجغرافي (Fake GPS) أو رفع بيانات من خارج النطاق الميداني المخصص.</li>
                  <li>إدخال بيانات أو صور وهمية لا تطابق الواقع.</li>
                  <li>تحصيل أي مبالغ مالية أو هدايا عينياً من أصحاب الأنشطة التجارية تحت أي مسمى دون تصريح مكتوب.</li>
                </ul>
              </div>

              {/* REP ACKNOWLEDGMENT & SIGNATURE */}
              <div className="bg-amber-100/70 border-2 border-amber-400 p-4 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-black border-b border-amber-300 pb-1.5">
                  <FileSignature className="w-4 h-4 text-amber-700" />
                  <span>إقرار وتعهد المندوب الميداني:</span>
                </div>

                <p className="text-slate-900 font-bold leading-relaxed text-[11px]">
                  أقر أنا المندوب/ <strong className="text-amber-900 text-xs">{rep.name}</strong><br />
                  بطاقة رقم قومي/ <strong className="font-mono text-slate-900 text-xs">{nationalId}</strong><br />
                  بأنني اطلعت على كافة البنود والشروط الموضحة أعلاه، وأتعهد بالالتزام التام بها وبصحة كل ما أرفعه من بيانات على منصة "دليلك"، وأتحمل المسؤولية القانونية والمالية كاملة في حال مخالفتها.
                </p>

                <div className="flex items-center justify-between border-t border-amber-300 pt-2 text-[11px]">
                  <div>
                    <span className="text-slate-600 font-bold block">التوقيع والإقرار الإلكتروني:</span>
                    <span className="font-black text-amber-900 font-mono text-xs">{rep.name} ✔ (توقيع رقمي معتمد)</span>
                  </div>

                  <div>
                    <span className="text-slate-600 font-bold block">التاريخ:</span>
                    <span className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            onClick={() => alert('جاري تحميل نسخة الوثيقة الرسمية بصيغة PDF بنجاح...')}
            className="w-full sm:w-auto bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] font-bold text-xs py-3 px-4 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل نسخة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
