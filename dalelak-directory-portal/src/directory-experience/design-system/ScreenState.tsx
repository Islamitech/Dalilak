import React from 'react';
import { Search, AlertCircle, ShieldAlert, WifiOff, LoaderCircle } from 'lucide-react';
import type { ViewState } from '../contracts/directory';
export function ScreenState({state,onReset,children}:{state:ViewState;onReset:()=>void;children:React.ReactNode}) {
  if(state==='ready')return <>{children}</>;
  if(state==='offline')return <><div className="directory-notice" role="status"><WifiOff/><div><strong>أنت غير متصل بالإنترنت</strong><p>نعرض آخر بيانات العرض المتاحة. الصور والخرائط الحقيقية تحتاج اتصالًا عند الدمج.</p></div><button className="directory-button secondary" onClick={onReset}>محاكاة استعادة الاتصال</button></div>{children}</>;
  if(state==='loading')return <><p className="flex gap-2 items-center my-6" role="status"><LoaderCircle size={20}/>جارٍ تحميل الأنشطة…</p><div className="directory-grid" aria-hidden="true">{[1,2,3].map(n=><div key={n} className="directory-skeleton"/>)}</div></>;
  const content=state==='empty'?{Icon:Search,title:'لم نجد أنشطة مطابقة',text:'جرّب تصنيفًا آخر أو وسّع نطاق البحث.',action:'إعادة ضبط البحث'}:state==='unauthorized'?{Icon:ShieldAlert,title:'هذا المحتوى غير متاح لك',text:'لا تملك صلاحية عرض هذا المحتوى في سيناريو المعاينة. لا توجد مصادقة فعلية هنا.',action:'العودة للمحتوى العام'}:{Icon:AlertCircle,title:'تعذر تحميل البيانات',text:'احتفظنا باختياراتك. يمكنك المحاولة مجددًا.',action:'إعادة المحاولة'};
  return <section className="directory-empty" role={state==='empty'?'status':'alert'}><content.Icon size={34} className="mx-auto mb-4"/><h2>{content.title}</h2><p>{content.text}</p><button className="directory-button" onClick={onReset}>{content.action}</button></section>;
}
