import React,{useEffect,useMemo,useRef,useState} from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { DirectoryCatalogProvider } from './contracts/DirectoryCatalogProvider';
import type { DirectoryCatalog } from './contracts/directory';
import { PreviewControls } from './preview/PreviewControls';
import { Navigation } from './shell/Navigation';
import { usePreviewNavigation } from './state/usePreviewNavigation';
import { initialFilters, type DirectoryFilters, type DirectoryPlace, type ActionKind, type ViewState, type LocationState } from './contracts/directory';
import { HomeScreen, type DiscoveryProps } from './discovery/HomeScreen';
import { SearchScreen } from './discovery/SearchScreen';
import { SavedScreen } from './saved/SavedScreen';
import { MapScreen } from './map/MapScreen';
import { OwnerScreen } from './owners/OwnerScreen';
import { PricingScreen } from './information/PricingScreen';
import { AboutScreen } from './information/AboutScreen';
import { PlaceDetails } from './details/PlaceDetails';
import { ActionPreview } from './details/ActionPreview';
import { Dialog } from './design-system/Dialog';
import { ScreenState } from './design-system/ScreenState';
import { DirectoryBoundary } from './design-system/DirectoryBoundary';
import { DesignSystemScreen } from './design-system/DesignSystemScreen';

/** Preview composition root: replace fixture/state wiring here when integrating. */
export function DirectoryExperience({catalog}:{catalog:DirectoryCatalog}) {
  const {path,page,visited,navigate,closeDetail}=usePreviewNavigation();
  const [filters,setFilters]=useState<DirectoryFilters>(initialFilters);
  const [saved,setSaved]=useState<string[]>([]);
  const [state,setState]=useState<ViewState>('ready');
  const [controls,setControls]=useState(false);
  const [fail,setFail]=useState(false);
  const [direction,setDirection]=useState<'rtl'|'ltr'>('rtl');
  const [location,setLocation]=useState<LocationState>('idle');
  const [locationDialog,setLocationDialog]=useState(false);
  const [action,setAction]=useState<{kind:ActionKind;place?:DirectoryPlace;packageName?:string}|null>(null);
  const [toast,setToast]=useState<{text:string;undo?:()=>void}|null>(null);
  const locationTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(locationTimer.current)clearTimeout(locationTimer.current);},[]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),7000);return()=>clearTimeout(timer);},[toast]);
  const titles:Record<string,string>={'/discover':'اكتشف دليلك','/search':'الأنشطة والخدمات','/map':'خريطة حدائق الأهرام','/favorites':'المفضلة','/for-business':'أضف نشاطك','/pricing':'باقات الأعمال','/about':'عن دليلك','/system':'نظام التصميم'};
  const selected=path.startsWith('/place/')?catalog.places.find(place=>place.id===path.split('/')[2]):undefined;
  useEffect(()=>{document.title=`${selected?.name||titles[page]||'الصفحة غير موجودة'} · معاينة دليلك`;},[page,selected]);
  const showAction:DiscoveryProps['onAction']=(kind,place)=>setAction({kind,place});
  const save=(id:string)=>{
    const exists=saved.includes(id);
    setSaved(items=>exists?items.filter(item=>item!==id):[...items,id]);
    setToast({text:exists?'أُزيل النشاط من المفضلة':'أُضيف النشاط إلى المفضلة',undo:()=>{setSaved(items=>exists?[...new Set([...items,id])]:items.filter(item=>item!==id));setToast(null);}});
  };
  const reset=()=>{setState('ready');setFilters(initialFilters);};
  // Small in-memory demonstration of filtering. No production search/ranking rules.
  const results=useMemo(()=>{
    const list=catalog.places.filter(p=>(!filters.query||`${p.name} ${p.category} ${p.city} ${p.address}`.includes(filters.query.trim()))&&(filters.category==='all'||p.category===filters.category)&&(filters.city==='all'||p.city===filters.city)&&(!filters.open||p.open===true)&&(!filters.rated||!!p.rating)&&(!filters.video||!!p.hasVideo));
    if(filters.sort==='alpha')return [...list].sort((a,b)=>a.name.localeCompare(b.name,'ar'));
    if(filters.sort==='rating')return [...list].sort((a,b)=>(b.rating||0)-(a.rating||0));
    if(filters.sort==='nearest')return [...list].sort((a,b)=>Number(!!b.distance)-Number(!!a.distance));
    return list;
  },[filters,catalog.places]);
  const shared:DiscoveryProps={places:results,filters,onChange:patch=>setFilters(f=>({...f,...patch})),onNavigate:navigate,location,onLocate:()=>setLocationDialog(true),saved,onSave:save,onOpen:place=>navigate(`/place/${place.id}`),onAction:showAction,state,onReset:state === 'error' || state === 'offline' || state === 'unauthorized' ? () => setState('ready') : reset};
  const render=(route:string)=>{
    switch(route){
      case '/discover':return <HomeScreen {...shared} places={catalog.places}/>;
      case '/search':return <SearchScreen {...shared}/>;
      case '/map':return <MapScreen {...shared}/>;
      case '/favorites':return <SavedScreen {...shared} places={catalog.places}/>;
      case '/for-business':return <OwnerScreen failSubmission={fail} onNavigate={navigate}/>;
      case '/pricing':return <PricingScreen onNavigate={navigate} onRequest={packageName=>setAction({kind:'package',packageName})}/>;
      case '/about':return <AboutScreen onNavigate={navigate}/>;
      case '/system':return <DesignSystemScreen/>;
      default:return <section className="directory-empty"><h1>لم نعثر على هذه الصفحة</h1><p>قد يكون الرابط غير صحيح. يمكنك العودة إلى الاستكشاف.</p><button className="directory-button" onClick={()=>navigate('/')}>العودة للرئيسية</button></section>;
    }
  };
  return <DirectoryCatalogProvider catalog={catalog}><div className={`directory-app ${page==='/map'?'is-map-page':''}`} dir={direction}>
    <a className="directory-skip" href="#preview-main" onClick={e=>{e.preventDefault();document.getElementById('preview-main')?.focus();}}>تخطّ إلى المحتوى</a>
    <PreviewControls open={controls} setOpen={setControls} state={state} setState={setState} fail={fail} setFail={setFail} dir={direction} setDir={setDirection} onSystem={()=>navigate('/system')}/>
    <Navigation path={page} onNavigate={navigate} savedCount={saved.length}/>
    {location==='denied'&&<div className="directory-notice" role="status"><MapPin size={22}/><div><strong>لم يُسمح بتحديد الموقع في المحاكاة</strong><p>يمكنك اختيار المنطقة يدويًا ومواصلة البحث.</p></div><button className="directory-button secondary" onClick={()=>setLocationDialog(true)}>المحاولة مجددًا</button><button onClick={()=>setLocation('idle')}>إغلاق</button></div>}
    <main id="preview-main" tabIndex={-1} className="directory-main"><DirectoryBoundary>{visited.map(route=><section key={route} hidden={route!==page}>{render(route)}</section>)}</DirectoryBoundary></main>
    {page!=='/map'&&<footer className="directory-footer"><div className="directory-container directory-footer-inner"><div><strong>دليلك · كل مكان أقرب إليك</strong><p>تجربة مستقلة لواجهة الدليل العام.</p></div><nav aria-label="روابط المساعدة"><button onClick={()=>navigate('/about')}>عن دليلك والمساعدة</button><button onClick={()=>navigate('/for-business')}>أضف نشاطك</button><button onClick={()=>navigate('/pricing')}>باقات الأعمال</button></nav><p>بيانات وصور توضيحية للمراجعة</p></div></footer>}
    {selected&&<PlaceDetails key={selected.id} place={selected} saved={saved.includes(selected.id)} onSave={save} onClose={closeDetail} onAction={showAction} onClaim={()=>navigate('/for-business')}/>}
    {path.startsWith('/place/')&&!selected&&<Dialog title="النشاط غير متاح" onClose={closeDetail}><ScreenState state="empty" onReset={closeDetail}>{null}</ScreenState></Dialog>}
    {action&&<ActionPreview key={`${action.kind}-${action.place?.id||action.packageName||''}`} {...action} fail={fail} onClose={()=>setAction(null)}/>}
    {locationDialog&&<Dialog title="البحث بالقرب مني" onClose={()=>setLocationDialog(false)}><MapPin size={38} className="text-emerald-800 mb-4"/><h3 className="text-xl font-bold mb-3">جرّب حالتي السماح والرفض</h3><p className="directory-form-help">لن نطلب موقع جهازك الفعلي. هذه محاكاة لقرار المستخدم.</p><div className="flex gap-3 flex-wrap mt-5"><button className="directory-button" onClick={()=>{setLocationDialog(false);setLocation('loading');locationTimer.current=setTimeout(()=>{setLocation('allowed');setFilters(f=>({...f,sort:'nearest',city:'حدائق الأهرام'}));setToast({text:'تم تحديد موقع توضيحي في حدائق الأهرام'});},700);}}>محاكاة السماح</button><button className="directory-button secondary" onClick={()=>{setLocation('denied');setLocationDialog(false);}}>محاكاة الرفض</button></div></Dialog>}
    {toast&&<div className="directory-toast" role="status"><CheckCircle2 size={18}/><span>{toast.text}</span>{toast.undo&&<button onClick={toast.undo}>تراجع</button>}<button aria-label="إغلاق التنبيه" onClick={()=>setToast(null)}>إغلاق</button></div>}
  </div></DirectoryCatalogProvider>;
}

