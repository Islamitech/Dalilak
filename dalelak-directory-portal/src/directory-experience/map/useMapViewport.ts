import { useCallback,useEffect,useRef,useState } from 'react';
import type React from 'react';
import { clampZoom,zoomAround,type Point } from './mapGeometry';
const initial={zoom:1,x:0,y:0};
export function useMapViewport(reservedBottom=0,reservedTop=0) {
  const container=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({width:800,height:600});
  const [view,setView]=useState(initial);
  const [moving,setMoving]=useState(false);
  const current=useRef(initial); const frame=useRef<number|null>(null);
  const pointers=useRef(new Map<number,Point>());
  const gesture=useRef<{start:Point;view:typeof initial;distance?:number;center?:Point}|null>(null);
  const dragged=useRef(false);
  const update=useCallback((next:typeof initial)=>{
    current.current={...next,x:Math.max(-1800,Math.min(1800,next.x)),y:Math.max(-1800,Math.min(1800,next.y))};
    if(frame.current===null)frame.current=requestAnimationFrame(()=>{setView(current.current);frame.current=null;});
  },[]);
  useEffect(()=>{
    const node=container.current;if(!node)return;
    const observer=new ResizeObserver(entries=>{const rect=entries[0].contentRect;if(rect.width>0&&rect.height>0)setSize({width:rect.width,height:rect.height});});observer.observe(node);
    const wheel=(event:WheelEvent)=>{
      if((event.target as Element).closest('[data-map-ui]'))return;
      if(!event.ctrlKey&&!event.metaKey)return;
      event.preventDefault();const rect=node.getBoundingClientRect();
      update(zoomAround(current.current,current.current.zoom*Math.exp(-event.deltaY*.003),{x:event.clientX-rect.left-rect.width/2,y:event.clientY-rect.top-(reservedTop+(rect.height-reservedBottom-reservedTop)/2)}));
    };
    node.addEventListener('wheel',wheel,{passive:false});
    return()=>{observer.disconnect();node.removeEventListener('wheel',wheel);if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;};
  },[update,reservedBottom,reservedTop]);
  const pointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{
    if((event.target as Element).closest('button,a,input,select,[data-map-ui]')||event.button!==0)return;
    dragged.current=false;pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});event.currentTarget.setPointerCapture(event.pointerId);
    const values=[...pointers.current.values()];
    const start=values[0];gesture.current={start,view:current.current};
    if(values.length===2){const b=values[1];gesture.current.distance=Math.hypot(start.x-b.x,start.y-b.y);gesture.current.center={x:(start.x+b.x)/2,y:(start.y+b.y)/2};}
    setMoving(true);
  };
  const pointerMove=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!pointers.current.has(event.pointerId)||!gesture.current)return;
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});const values=[...pointers.current.values()],g=gesture.current;
    if(values.length===2&&g.distance&&g.center){
      dragged.current=true;const rect=event.currentTarget.getBoundingClientRect();
      const center={x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2};
      const next=zoomAround(g.view,g.view.zoom*Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)/g.distance,{x:g.center.x-rect.left-rect.width/2,y:g.center.y-rect.top-(reservedTop+(rect.height-reservedBottom-reservedTop)/2)});
      update({...next,x:next.x+center.x-g.center.x,y:next.y+center.y-g.center.y});
    }else{const dx=event.clientX-g.start.x,dy=event.clientY-g.start.y;if(Math.hypot(dx,dy)>4)dragged.current=true;update({...g.view,x:g.view.x+dx,y:g.view.y+dy});}
  };
  const pointerEnd=(event:React.PointerEvent<HTMLDivElement>)=>{
    pointers.current.delete(event.pointerId);
    if(pointers.current.size){gesture.current={start:[...pointers.current.values()][0],view:current.current};}
    else{gesture.current=null;setMoving(false);}
  };
  const centerY=reservedTop+(size.height-reservedBottom-reservedTop)/2;
  const fitScale=Math.min(size.width,Math.max(150,size.height-reservedBottom-reservedTop))/1000;
  const toScreen=(point:Point)=>({x:(point.x-500)*fitScale*view.zoom+size.width/2+view.x,y:(point.y-500)*fitScale*view.zoom+centerY+view.y});
  const focus=(point:Point,zoom=2)=>{const clamped=clampZoom(zoom);update({zoom:clamped,x:-(point.x-500)*fitScale*clamped,y:-(point.y-500)*fitScale*clamped});};
  const zoomBy=(factor:number)=>update(zoomAround(current.current,current.current.zoom*factor,{x:0,y:0}));
  const keyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(event.target!==event.currentTarget)return;
    const offsets:Record<string,Point>={ArrowLeft:{x:50,y:0},ArrowRight:{x:-50,y:0},ArrowUp:{x:0,y:50},ArrowDown:{x:0,y:-50}};
    if(offsets[event.key]){event.preventDefault();const offset=offsets[event.key];update({...current.current,x:current.current.x+offset.x,y:current.current.y+offset.y});}
    else if(['+','=','-','Home'].includes(event.key)){event.preventDefault();event.key==='Home'?update(initial):zoomBy(event.key==='-'?.8:1.25);}
  };
  return {container,size,view,moving,fitScale,centerY,toScreen,focus,zoomBy,restore:update,reset:()=>update(initial),wasDragged:()=>dragged.current,events:{onPointerDown:pointerDown,onPointerMove:pointerMove,onPointerUp:pointerEnd,onPointerCancel:pointerEnd,onKeyDown:keyDown}};
}


