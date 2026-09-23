import React,{useEffect,useMemo,useRef} from 'react';
import { Plus,Minus,Maximize,DoorOpen,MapPin,Compass } from 'lucide-react';
import type { DirectoryDistrict,DirectoryGate,DirectoryPlace } from '../contracts/directory';
import { createMapProjection,districtPath } from './mapGeometry';
import { useMapViewport } from './useMapViewport';

interface Props {
  districts:readonly DirectoryDistrict[];gates:readonly DirectoryGate[];places:readonly DirectoryPlace[];
  area:string;selected:string|null;selectedGate:string|null;showGates:boolean;showNames:boolean;resetKey:number;
  onArea:(name:string)=>void;onPlace:(id:string)=>void;onGate:(id:string)=>void;
  contextKey?:string;children?:React.ReactNode;cardsOpen?:boolean;
}
export function GeographicCanvas(p:Props) {
  const viewport=useMapViewport(p.cardsOpen===false?80:250,120);
  const projection=useMemo(()=>createMapProjection(p.districts),[p.districts]);
  const paths=useMemo(()=>p.districts.map(d=>({district:d,path:districtPath(d,projection),center:projection.project(d.centerLat,d.centerLng)})),[p.districts,projection]);
  const previousFocus=useRef('');
  const previousSelection=useRef<string|null>(null);
  const overview=useRef<{key:string;view:typeof viewport.view}|null>(null);
  useEffect(()=>{
    const contextKey=`${p.contextKey||p.area}|${p.resetKey}|${viewport.size.width}|${viewport.size.height}|${p.cardsOpen}`;
    const focusKey=`${contextKey}|${p.selected}|${p.selectedGate}`;
    if(previousFocus.current===focusKey)return;previousFocus.current=focusKey;
    const place=p.places.find(item=>item.id===p.selected),gate=p.gates.find(item=>item.id===p.selectedGate),district=p.districts.find(item=>item.nameAr===p.area);
    if(place?.coordinates){
      if(!previousSelection.current||overview.current?.key!==contextKey)overview.current={key:contextKey,view:{...viewport.view}};
      viewport.focus(projection.project(place.coordinates.lat,place.coordinates.lng),3.3);
    }
    else if(gate)viewport.focus(projection.project(gate.lat,gate.lng),2);
    else if(previousSelection.current&&overview.current?.key===contextKey)viewport.restore(overview.current.view);
    else if(district)viewport.focus(projection.project(district.centerLat,district.centerLng),1.9);
    else viewport.reset();
    previousSelection.current=p.selected;
  },[p.area,p.contextKey,p.selected,p.selectedGate,p.resetKey,p.cardsOpen,viewport.size.width,viewport.size.height]);
  const gatesForArea=p.area==='all'?p.gates:p.gates.filter(g=>g.servedZones.includes(p.districts.find(d=>d.nameAr===p.area)?.letterAr||''));
  // Group nearby display markers in screen pixels; this does not alter source coordinates.
  const clusters:{items:{place:DirectoryPlace;index:number}[];x:number;y:number}[]=[];
  p.places.forEach((place,index)=>{
    if(!place.coordinates)return;
    const point=viewport.toScreen(projection.project(place.coordinates.lat,place.coordinates.lng));
    const group=viewport.view.zoom<3.9&&place.id!==p.selected?clusters.find(c=>!c.items.some(i=>i.place.id===p.selected)&&Math.hypot(c.x-point.x,c.y-point.y)<48):undefined;
    if(group)group.items.push({place,index});else clusters.push({items:[{place,index}],...point});
  });
  return <div className="hm-canvas" ref={viewport.container} {...viewport.events} data-dragging={viewport.moving} role="region" aria-label="خريطة مناطق حدائق الأهرام التفاعلية" aria-describedby="map-keyboard-help" tabIndex={0}>
    <svg className="hm-geometry" viewBox={`0 0 ${viewport.size.width} ${viewport.size.height}`} aria-hidden="true"><defs><pattern id="hm-grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#d0dcd0"/></pattern></defs><rect width="100%" height="100%" fill="url(#hm-grid)"/><g className="hm-world" style={{transform:`translate(${viewport.size.width/2+viewport.view.x}px,${viewport.centerY+viewport.view.y}px) scale(${viewport.fitScale*viewport.view.zoom}) translate(-500px,-500px)`}}>{paths.map(({district,path})=><path key={district.id} d={path} className={`hm-district ${p.area===district.nameAr?'is-active':p.area!=='all'?'is-muted':''}`} vectorEffect="non-scaling-stroke" onClick={e=>{e.stopPropagation();p.onArea(district.nameAr===p.area?'all':district.nameAr);}}><title>{`${district.nameAr} (${district.letterAr}) - انقر للتحديد`}</title></path>)}</g></svg>
    {paths.map(({district,center})=>{const point=viewport.toScreen(center);return <button key={district.id} className={`hm-zone-label ${p.area===district.nameAr?'is-active':''}`} style={{left:point.x,top:point.y-18}} aria-label={`اختيار ${district.nameAr}`} aria-pressed={p.area===district.nameAr} onClick={()=>p.onArea(district.nameAr)}>{p.showNames?district.nameAr:district.letterAr}</button>;})}
    {clusters.map(group=>{const {place,index}=group.items[0];const multiple=group.items.length>1;const isSelected=!multiple&&p.selected===place.id;return <button key={place.id} className={`hm-place-pin ${multiple?'hm-cluster':''} ${isSelected?'is-selected':''}`} style={{left:group.x,top:group.y+15}} aria-label={multiple?`تكبير مجموعة من ${group.items.length} أماكن`:`عرض ${place.name} على الخريطة`} aria-pressed={isSelected} onClick={()=>multiple?viewport.focus(projection.project(place.coordinates!.lat,place.coordinates!.lng),Math.min(4,viewport.view.zoom*1.7)):p.onPlace(place.id)} title={multiple?group.items.map(i=>i.place.name).join('، '):place.name}>{multiple?<span>{group.items.length}<small>أماكن</small></span>:<><MapPin size={17}/><span>{index+1}</span></>}{isSelected&&<span className="hm-pin-pulse" aria-hidden="true"/>}</button>;})}
    {p.showGates&&gatesForArea.map(gate=>{const point=viewport.toScreen(projection.project(gate.lat,gate.lng));return <button key={gate.id} className="hm-gate-pin" style={{left:point.x+22,top:point.y}} aria-label={`عرض ${gate.name}`} aria-pressed={p.selectedGate===gate.id} onClick={()=>p.onGate(gate.id)} title={gate.name}><DoorOpen size={19}/>{p.selectedGate===gate.id&&<span>{gate.name}</span>}</button>;})}
    <div className="hm-map-controls" aria-label="أدوات الخريطة"><button aria-label="تكبير الخريطة" onClick={()=>viewport.zoomBy(1.3)} disabled={viewport.view.zoom>=4}><Plus size={20}/></button><button aria-label="تصغير الخريطة" onClick={()=>viewport.zoomBy(1/1.3)} disabled={viewport.view.zoom<=.8}><Minus size={20}/></button><button aria-label="إظهار حدود حدائق الأهرام كاملة" onClick={viewport.reset}><Maximize size={19}/></button></div>
    <div className="hm-north" aria-label="الشمال"><Compass size={21}/><span>ش</span></div><div className="hm-map-legend"><span><i className="hm-legend-place"/>نشاط</span><span><i className="hm-legend-gate"/>بوابة</span><span><i className="hm-legend-area"/>منطقة</span></div><p id="map-keyboard-help" className="hm-map-help">اسحب للتحريك · + و − للتكبير · Ctrl + عجلة الفأرة · إصبعان على الهاتف</p>
    {p.children}
  </div>;
}
