import React from 'react';
import { Heart } from 'lucide-react';
import { DiscoveryProps } from '../discovery/HomeScreen';
import { PlaceCard } from '../discovery/PlaceCard';
import { ScreenState } from '../design-system/ScreenState';
export function SavedScreen(p:DiscoveryProps) {
  const places=p.places.filter(place=>p.saved.includes(place.id));
  return <div className="directory-container directory-section"><header className="directory-page-heading"><div className="directory-kicker"><Heart size={18}/>اختياراتك في مكان واحد</div><h1 className="directory-heading">أماكن تستحق العودة</h1><p className="directory-description">احفظ ما يعجبك أثناء الاستكشاف. الحفظ هنا محلي داخل جلسة المعاينة.</p></header><ScreenState state={p.state} onReset={p.onReset}>{places.length?<div className="directory-grid">{places.map(place=><PlaceCard key={place.id} place={place} saved onSave={p.onSave} onOpen={p.onOpen} onAction={p.onAction}/>)}</div>:<section className="directory-empty"><Heart size={38} className="mx-auto mb-5"/><h2>قائمتك تنتظر أول اكتشاف</h2><p>اضغط على القلب بجوار أي نشاط، وستجده هنا.</p><button className="directory-button" onClick={()=>p.onNavigate('/search')}>اكتشف الأنشطة</button></section>}</ScreenState></div>;
}
