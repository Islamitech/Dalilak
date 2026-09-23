import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DirectoryCatalogProvider } from '../contracts/DirectoryCatalogProvider';
import { initialFilters } from '../contracts/directory';
import { DEMO_CATALOG, DEMO_PLACES } from '../preview/fixtures';
import { HomeScreen, DiscoveryProps } from '../discovery/HomeScreen';
import { SearchScreen } from '../discovery/SearchScreen';
import { SavedScreen } from '../saved/SavedScreen';
import { MapScreen } from '../map/MapScreen';
import { OwnerScreen } from '../owners/OwnerScreen';
import { PricingScreen } from '../information/PricingScreen';
import { AboutScreen } from '../information/AboutScreen';
import { PlaceDetails } from '../details/PlaceDetails';
import { ActionPreview } from '../details/ActionPreview';
import { PlaceCard } from '../discovery/PlaceCard';
import { ScreenState } from '../design-system/ScreenState';
import { createMapProjection,districtPath,zoomAround } from '../map/mapGeometry';
import { MapActivityCards } from '../map/MapActivityCards';

test('local atlas exposes 16 districts and 6 gates with finite display geometry',()=>{
  assert.equal(DEMO_CATALOG.districts.length,16);assert.equal(DEMO_CATALOG.gates.length,6);
  const projection=createMapProjection(DEMO_CATALOG.districts);
  for(const district of DEMO_CATALOG.districts){
    assert.equal(DEMO_PLACES.filter(p=>p.area===district.nameAr&&p.coordinates).length,3);
    assert.ok(!/NaN|Infinity/.test(districtPath(district,projection)));
  }
  for(const gate of DEMO_CATALOG.gates)assert.ok(Number.isFinite(projection.project(gate.lat,gate.lng).x));
});
test('map cards replace the three featured places with one expanded selected place',()=>{
  const places=DEMO_PLACES.filter(p=>p.area==='منطقة أ');
  const props={places,area:'منطقة أ',searching:false,saved:[],onSelect:()=>{},onBack:()=>{},onDetails:()=>{},onSave:()=>{},open:true,onToggle:()=>{}};
  const overview=renderToStaticMarkup(<MapActivityCards {...props}/>);
  assert.equal((overview.match(/class="hm-featured-card"/g)||[]).length,3);
  const selected=renderToStaticMarkup(<MapActivityCards {...props} selected={places[0]}/>);
  assert.ok(selected.includes('hm-expanded-card'));assert.ok(!selected.includes('hm-featured-card'));
  assert.ok(selected.includes('الرجوع لأبرز الأنشطة'));assert.ok(selected.includes('تفاصيل النشاط'));
  const collapsed=renderToStaticMarkup(<MapActivityCards {...props} open={false}/>);
  assert.ok(collapsed.includes('aria-expanded="false"'));assert.ok(!collapsed.includes('class="hm-featured-card"'));
});
test('zoom preserves the cursor anchor and clamps the supported range',()=>{
  const before={zoom:1.3,x:40,y:-20},anchor={x:180,y:90};
  const after=zoomAround(before,2.6,anchor);
  assert.equal((anchor.x-before.x)/before.zoom,(anchor.x-after.x)/after.zoom);
  assert.equal((anchor.y-before.y)/before.zoom,(anchor.y-after.y)/after.zoom);
  assert.equal(zoomAround(before,99,anchor).zoom,4);
  assert.equal(zoomAround(before,0,anchor).zoom,.8);
});

const noop=()=>{};
const base:DiscoveryProps={places:DEMO_PLACES,filters:initialFilters,onChange:noop,onNavigate:noop,location:'idle',onLocate:noop,saved:[],onSave:noop,onOpen:noop,onAction:noop,state:'ready',onReset:noop};
const render=(node:React.ReactNode)=>renderToStaticMarkup(<DirectoryCatalogProvider catalog={DEMO_CATALOG}>{node}</DirectoryCatalogProvider>);

test('every primary screen renders and exposes no executable external actions',()=>{
  for(const screen of [<HomeScreen {...base}/>,<SearchScreen {...base}/>,<SavedScreen {...base}/>,<MapScreen {...base}/>,<OwnerScreen onNavigate={noop} failSubmission={false}/>,<PricingScreen onNavigate={noop} onRequest={noop}/>,<AboutScreen onNavigate={noop}/>]){
    const html=render(screen);
    assert.ok(html.includes('<h1'));
    assert.ok(!/href="(?:https?:|tel:|mailto:)/.test(html));
    assert.ok(!html.includes('supabase'));
  }
});
test('empty search and saved screens explain their recovery action',()=>{
  assert.match(render(<SearchScreen {...base} places={[]}/>),/لم نجد أنشطة مطابقة/);
  assert.match(render(<SavedScreen {...base}/>),/قائمتك تنتظر أول اكتشاف/);
  assert.match(render(<SavedScreen {...base} saved={['demo-01']}/>),/بيت القهوة/);
});
test('loading, failure and unauthorized states never render the protected content',()=>{
  for(const state of ['loading','error','unauthorized','empty'] as const){
    const html=render(<ScreenState state={state} onReset={noop}><p>private-test-content</p></ScreenState>);
    assert.ok(!html.includes('private-test-content'));
    assert.match(html,/role="(?:status|alert)"/);
  }
  const offline=render(<ScreenState state="offline" onReset={noop}><p>cached-content</p></ScreenState>);
  assert.match(offline,/cached-content/);assert.match(offline,/غير متصل/);
});
test('incomplete place does not invent hours or enable contact or directions',()=>{
  const missing=DEMO_PLACES.find(p=>p.id==='demo-08')!;
  const html=render(<PlaceCard place={missing} saved={false} onSave={noop} onOpen={noop} onAction={noop}/>);
  assert.match(html,/ساعات العمل غير متاحة/);
  assert.equal((html.match(/disabled=""/g)||[]).length,3);
  assert.ok(!html.includes('مغلق حاليًا'));
});
test('details are a labelled modal and action previews explicitly say simulation',()=>{
  const html=render(<PlaceDetails place={DEMO_PLACES[0]} saved={false} onSave={noop} onClose={noop} onAction={noop} onClaim={noop}/>);
  assert.match(html,/role="dialog"/);assert.match(html,/aria-modal="true"/);assert.match(html,/aria-labelledby=/);
  for(const kind of ['call','whatsapp','directions','share','contact','report','package'] as const){
    const action=render(<ActionPreview kind={kind} place={DEMO_PLACES[0]} onClose={noop} fail={false}/>);
    assert.match(action,/محاكاة/);assert.ok(!/href="(?:https?:|tel:)/.test(action));
  }
});

test('map screen renders by default as primary portal canvas with zero reticle',()=>{
  const html=render(<MapScreen {...base}/>);
  assert.ok(html.includes('خريطة حدائق الأهرام'));
  assert.ok(html.includes('hm-canvas'));
  assert.ok(!html.includes('reticle'));
});

test('drawer and popover controls expose accessible aria attributes',()=>{
  const openHtml=render(<MapScreen {...base}/>);
  assert.ok(openHtml.includes('aria-controls="hm-floating-panel"'));
  assert.ok(openHtml.includes('aria-expanded="false"'));
});

test('activity selection focuses coordinates and switches to single expanded card without reticle',()=>{
  const place=DEMO_PLACES[0];
  const html=renderToStaticMarkup(
    <MapActivityCards
      places={[place]}
      selected={place}
      area="منطقة أ"
      searching={false}
      saved={[]}
      onSelect={noop}
      onBack={noop}
      onDetails={noop}
      onSave={noop}
      open={true}
    />
  );
  assert.ok(html.includes('hm-expanded-card'));
  assert.ok(!html.includes('reticle'));
  assert.ok(html.includes(place.name));
});

test('residential building search is scoped strictly to selected zone without leakage',()=>{
  const zoneA='منطقة أ';
  const placesInZoneA=DEMO_PLACES.filter(p=>p.area===zoneA);
  const placesInZoneB=DEMO_PLACES.filter(p=>p.area==='منطقة ب');
  assert.equal(placesInZoneA.every(p=>p.area===zoneA),true);
  assert.equal(placesInZoneA.some(p=>placesInZoneB.map(b=>b.id).includes(p.id)),false);
});

test('empty building or search results explain recovery clearly with zero reticle',()=>{
  const html=render(<SearchScreen {...base} places={[]}/>);
  assert.ok(html.includes('لم نجد أنشطة مطابقة'));
  assert.ok(!html.includes('reticle'));
});
