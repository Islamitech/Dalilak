import React,{useState} from 'react';
import { ArrowLeft,ArrowRight,MapPin,Star,Heart,ShieldCheck,ChevronDown,ChevronUp,Phone,MessageCircle,Navigation } from 'lucide-react';
import type { DirectoryPlace } from '../contracts/directory';
import { CategoryIcon } from '../discovery/CategoryIcon';

interface Props {
  places:readonly DirectoryPlace[]; selected?:DirectoryPlace; area:string; searching:boolean;
  saved:readonly string[];onSelect:(id:string)=>void;onBack:()=>void;
  onDetails:(place:DirectoryPlace)=>void;onSave:(id:string)=>void;
  open?:boolean;onToggle?:()=>void;
  onAction?:(type:string)=>void;
}
function Thumbnail({place}:{place:DirectoryPlace}) {
  const [failed,setFailed]=useState(false);
  return <div className="hm-card-media">{place.photos[0]&&!failed?<img src={place.photos[0]} alt="صورة توضيحية للنشاط" onError={()=>setFailed(true)}/>:<CategoryIcon category={place.category} size={28}/>}</div>;
}
export function MapActivityCards(p:Props) {
  if(!p.places.length&&!p.selected)return null;
  return <section className={`hm-activity-overlay ${p.selected?'is-detail':''}`} data-map-ui="true" aria-label="كروت الأنشطة على الخريطة" onPointerDown={e=>e.stopPropagation()}>
    {p.selected?<article className="hm-expanded-card" key={p.selected.id}>
      <div className="hm-cards-heading"><button className="hm-cards-back" onClick={p.onBack}><ArrowRight size={17}/>الرجوع لأبرز الأنشطة</button><span>النشاط المحدد</span></div>
      <div className="hm-expanded-body"><Thumbnail place={p.selected}/><div><span className="hm-card-category">{p.selected.category}</span><h2>{p.selected.name}</h2><p><MapPin size={14}/>{p.selected.address}</p><p>{p.selected.open===null?'مواعيد العمل غير متاحة':p.selected.open?'مفتوح الآن':'مغلق حاليًا'}{p.selected.rating&&<> · <Star size={12}/><bdi>{p.selected.rating}</bdi></>}</p></div></div>
      <p className="hm-expanded-description">{p.selected.description}</p>
      {p.onAction&&<div className="hm-expanded-quick-actions">
        <button type="button" className="hm-quick-action-btn" onClick={()=>p.onAction?.('call')}><Phone size={13}/>اتصال</button>
        <button type="button" className="hm-quick-action-btn" onClick={()=>p.onAction?.('whatsapp')}><MessageCircle size={13}/>واتساب</button>
        <button type="button" className="hm-quick-action-btn" onClick={()=>p.onAction?.('directions')}><Navigation size={13}/>الاتجاهات</button>
      </div>}
      <div className="hm-expanded-actions"><button className="directory-button" onClick={()=>p.onDetails(p.selected!)}>تفاصيل النشاط<ArrowLeft size={16}/></button><button className="hm-card-save" aria-label={p.saved.includes(p.selected.id)?'إزالة النشاط المحدد من المفضلة':'حفظ النشاط المحدد'} aria-pressed={p.saved.includes(p.selected.id)} onClick={()=>p.onSave(p.selected!.id)}><Heart size={19} fill={p.saved.includes(p.selected.id)?'currentColor':'none'}/></button></div>
    </article>:<>
      <button className="hm-cards-heading hm-cards-toggle" onClick={p.onToggle} aria-expanded={p.open!==false}><span className="hm-tray-title">{p.searching?'أبرز نتائج البحث':p.area==='all'?'أماكن تستحق الاكتشاف':`أبرز الأنشطة في ${p.area}`}</span><span>{p.places.length} أماكن</span>{p.open===false?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>
      {p.open!==false&&<div className="hm-featured-cards">{p.places.map(place=><button className="hm-featured-card" key={place.id} onClick={()=>p.onSelect(place.id)} aria-label={`استكشف ${place.name} على الخريطة`}><Thumbnail place={place}/><div className="hm-featured-content"><span className="hm-card-category">{place.category}{place.verified&&<ShieldCheck size={12}/>}</span><h3>{place.name}</h3><div className="hm-card-meta"><span>{place.area}</span>{place.rating?<span><Star size={12}/><bdi>{place.rating}</bdi></span>:<ArrowLeft size={15}/>}</div></div></button>)}</div>}
      {p.open!==false&&p.places.length>1&&<div className="hm-cards-dots" aria-hidden="true">{p.places.map((_,i)=><span key={i} className={`hm-dot ${i===0?'is-active':''}`}/>)}</div>}
    </>}
  </section>;
}

