import React,{useMemo,useState} from 'react';
import { MapPin,DoorOpen,Search,RotateCcw,X,ArrowLeft,SlidersHorizontal,List,Info } from 'lucide-react';
import { DiscoveryProps } from '../discovery/HomeScreen';
import { useDirectoryCatalog } from '../contracts/DirectoryCatalogProvider';
import { Dialog } from '../design-system/Dialog';
import { ScreenState } from '../design-system/ScreenState';
import { CategoryIcon } from '../discovery/CategoryIcon';
import { GeographicCanvas } from './GeographicCanvas';
import { MapActivityCards } from './MapActivityCards';
import './map.css';

export function MapScreen(p:DiscoveryProps) {
  const catalog=useDirectoryCatalog();
  const [area,setArea]=useState('all'),[category,setCategory]=useState('all'),[query,setQuery]=useState('');
  const [selected,setSelected]=useState<string|null>(null),[selectedGate,setSelectedGate]=useState<string|null>(null);
  const [panel,setPanel]=useState<'filters'|'results'|null>(null),[gatesOpen,setGatesOpen]=useState(false),[infoOpen,setInfoOpen]=useState(false);
  const [showGates,setShowGates]=useState(false),[showNames,setShowNames]=useState(false),[cardsOpen,setCardsOpen]=useState(true);
  const [resetKey,setResetKey]=useState(0);
  const places=useMemo(()=>catalog.places.filter(place=>place.coordinates&&place.city==='حدائق الأهرام'&&(area==='all'||place.area===area)&&(category==='all'||place.category===category)&&(!query.trim()||`${place.name} ${place.address} ${place.category}`.includes(query.trim()))),[catalog.places,area,category,query]);
  const chosen=places.find(place=>place.id===selected),gate=catalog.gates.find(item=>item.id===selectedGate);
  const activeCount=Number(area!=='all')+Number(category!=='all')+Number(!!query.trim());
  const clearSelection=()=>{setSelected(null);setSelectedGate(null);};
  const changeArea=(value:string)=>{setArea(value);clearSelection();setCardsOpen(true);};
  const reset=()=>{setArea('all');setCategory('all');setQuery('');clearSelection();setResetKey(key=>key+1);};
  const selectPlace=(id:string)=>{setSelected(id);setSelectedGate(null);setPanel(null);setCardsOpen(true);};
  const selectGate=(id:string)=>{setSelectedGate(id);setSelected(null);setShowGates(true);setPanel(null);setCardsOpen(false);};
  return <div className="hm-full-page">
    <h1 className="sr-only">خريطة حدائق الأهرام — اكتشف الأماكن والأنشطة</h1>
    <ScreenState state={p.state} onReset={p.onReset}>
      <GeographicCanvas districts={catalog.districts} gates={catalog.gates} places={places} area={area} selected={selected} selectedGate={selectedGate} showGates={showGates} showNames={showNames} resetKey={resetKey} onArea={changeArea} onPlace={selectPlace} onGate={selectGate} contextKey={`${area}|${category}|${query}`} cardsOpen={cardsOpen||!!gate}>
        <div className="hm-floating-tools" data-map-ui="true" onPointerDown={e=>e.stopPropagation()}>
          <form className="hm-map-search" role="search" onSubmit={e=>{e.preventDefault();if(places[0])selectPlace(places[0].id);else setPanel('results');}}>
            <MapPin size={22}/>
            <label><span className="sr-only">ابحث في أنشطة الخريطة</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);clearSelection();setPanel(e.target.value?'results':null);}} placeholder={area==='all'?'ابحث في حدائق الأهرام…':`ابحث في ${area}…`}/></label>
            {query.trim()&&<button type="button" className="hm-search-clear" aria-label="مسح البحث" onClick={()=>{setQuery('');clearSelection();}}><X size={16}/></button>}
            <button type="submit" aria-label="عرض نتيجة البحث على الخريطة"><Search size={21}/></button>
          </form>
          <div className="hm-quick-categories" role="toolbar" aria-label="تصنيفات سريعة">
            {catalog.categories.slice(0,6).map(cat=><button key={cat} type="button" className={`hm-category-chip ${category===cat?'is-active':''}`} onClick={()=>{setCategory(prev=>prev===cat?'all':cat);clearSelection();}} aria-pressed={category===cat}><CategoryIcon category={cat} size={14}/><span>{cat}</span></button>)}
          </div>
          <div className="hm-floating-buttons"><button aria-expanded={panel==='filters'} aria-controls="hm-floating-panel" onClick={()=>setPanel(panel==='filters'?null:'filters')}><SlidersHorizontal size={18}/>{area==='all'?'المناطق والفلاتر':area}{activeCount>0&&<span className="hm-count">{activeCount}</span>}</button><button onClick={()=>setGatesOpen(true)}><DoorOpen size={18}/>البوابات</button><button aria-expanded={panel==='results'} aria-controls="hm-floating-panel" onClick={()=>setPanel(panel==='results'?null:'results')}><List size={18}/>النتائج <span className="hm-count">{places.length}</span></button></div>
          {panel&&<section className="hm-floating-panel" id="hm-floating-panel" aria-label={panel==='filters'?'فلاتر الخريطة':'نتائج الخريطة'}><div className="hm-panel-title"><h2>{panel==='filters'?'خصص استكشافك':`${places.length} نتيجة على الخريطة`}</h2><button aria-label="إغلاق لوحة الخريطة" onClick={()=>setPanel(null)}><X size={19}/></button></div>
            {panel==='filters'?<><div id="hadayek-map-filters" className="hm-floating-fields"><label>المنطقة<select value={area} onChange={e=>changeArea(e.target.value)}><option value="all">كل مناطق الحدائق</option>{catalog.districts.map(d=><option key={d.id} value={d.nameAr}>{d.nameAr}</option>)}</select></label><label>نوع النشاط<select value={category} onChange={e=>{setCategory(e.target.value);clearSelection();}}><option value="all">كل الأنشطة</option>{catalog.categories.map(c=><option key={c}>{c}</option>)}</select></label></div><div className="hm-panel-layers"><label><input type="checkbox" checked={showGates} onChange={e=>{setShowGates(e.target.checked);if(!e.target.checked)setSelectedGate(null);}}/>إظهار البوابات</label><label><input type="checkbox" checked={showNames} onChange={e=>setShowNames(e.target.checked)}/>أسماء المناطق</label></div><div className="hm-panel-actions"><button className="directory-button" onClick={()=>setPanel(null)}>عرض {places.length} نتيجة</button><button className="hm-reset" onClick={reset}><RotateCcw size={15}/>إعادة ضبط</button></div></>:<div className="hm-floating-results">{places.length?places.map(place=><button key={place.id} className="hm-result-item" onClick={()=>selectPlace(place.id)} aria-pressed={selected===place.id}><CategoryIcon category={place.category} size={22}/><span className="hm-result-text"><strong>{place.name}</strong><small>{place.category} · {place.area}</small></span><ArrowLeft size={16}/></button>):<div className="hm-no-results"><Search size={28}/><h3>لا توجد نتائج بهذه الخيارات</h3><p>جرّب اسمًا آخر أو وسّع نطاق البحث.</p><button className="directory-button secondary" onClick={reset}>مسح الفلاتر</button></div>}</div>}
          </section>}
        </div>
        {!gate&&<MapActivityCards places={places.slice(0,3)} selected={chosen} area={area} searching={!!query.trim()} saved={p.saved} onSelect={selectPlace} onBack={clearSelection} onDetails={p.onOpen} onSave={p.onSave} open={cardsOpen} onToggle={()=>setCardsOpen(!cardsOpen)} onAction={p.onAction}/>}
        {gate&&<section className="hm-gate-overlay" data-map-ui="true" onPointerDown={e=>e.stopPropagation()}><button className="hm-cards-back" onClick={()=>{clearSelection();setCardsOpen(true);}}>الرجوع للأنشطة<ArrowLeft size={16}/></button><h2><DoorOpen size={22}/>{gate.name}</h2><p>{gate.road}</p><p>المناطق المرتبطة: {gate.areas}</p><button className="directory-button" onClick={()=>p.onAction('directions')}>معاينة الاتجاهات</button></section>}
        <button className="hm-map-info" data-map-ui="true" aria-label="معلومات الخريطة ومصدر البيانات" onClick={()=>setInfoOpen(true)}><Info size={17}/></button>
      </GeographicCanvas>
    </ScreenState>
    {gatesOpen&&<Dialog title="بوابات حدائق الأهرام" onClose={()=>setGatesOpen(false)}><p className="directory-form-help">اختر بوابة لتقريب الخريطة وإظهار معلوماتها.</p><div className="hm-gates-grid">{catalog.gates.map(item=><article className="hm-gate-card" key={item.id}><DoorOpen size={25}/><h3>{item.name}</h3><p>{item.road}</p><small>المناطق: {item.areas}</small><button className="directory-button secondary" onClick={()=>{setArea('all');selectGate(item.id);setGatesOpen(false);}}>عرض على الخريطة<ArrowLeft size={16}/></button></article>)}</div></Dialog>}
    {infoOpen&&<Dialog title="عن هذه الخريطة" onClose={()=>setInfoOpen(false)}><p>١٦ منطقة و٦ بوابات من بيانات المشروع المحلية. الحدود إرشادية وليست مساحية معتمدة. أسماء الأنشطة ومواقعها بيانات عرض افتراضية.</p><p className="mt-4">اسحب للتحريك، واستخدم أزرار التكبير أو Ctrl مع عجلة الفأرة، أو إصبعين على الهاتف. لوحة المفاتيح: الأسهم و+ و− وHome.</p><p className="mt-4">أبرز الأنشطة مرتبة في بيانات العرض، وليست توصيات أو ترتيبًا تجاريًا حقيقيًا. ربط أرقام العمارات الدقيقة متروك لمصدر بيانات معتمد عند الدمج.</p></Dialog>}
  </div>;
}
