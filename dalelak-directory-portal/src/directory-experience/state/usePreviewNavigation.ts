import { useEffect, useRef, useState } from 'react';

const readPath=()=>{const path=window.location.hash.slice(1)||'/map';return path==='/'?'/map':path;};
/** Hash navigation is confined to the preview entry; production routes stay untouched. */
export function usePreviewNavigation() {
  const [path,setPath]=useState(readPath);
  const [page,setPage]=useState(()=>readPath().startsWith('/place/')?'/map':readPath());
  const [visited,setVisited]=useState<string[]>(()=>[readPath().startsWith('/place/')?'/map':readPath()]);
  const previousPage=useRef(page); const scrolls=useRef<Record<string,number>>({}); const openedDetail=useRef(false);
  useEffect(()=>{
    const handle=()=>{
      const next=readPath();setPath(next);
      if(!next.startsWith('/place/')){
        setPage(next);setVisited(items=>items.includes(next)?items:[...items,next]);
        requestAnimationFrame(()=>{
          if(previousPage.current!==next)document.getElementById('preview-main')?.focus({preventScroll:true});
          window.scrollTo(0,scrolls.current[next]||0);previousPage.current=next;
        });
      }
    };
    window.addEventListener('hashchange',handle);return()=>window.removeEventListener('hashchange',handle);
  },[]);
  const navigate=(next:string)=>{
    scrolls.current[page]=window.scrollY;
    if(next.startsWith('/place/'))openedDetail.current=true;
    window.location.hash=next;
  };
  const closeDetail=()=>{if(openedDetail.current){openedDetail.current=false;window.history.back();}else{window.location.replace(`${window.location.pathname}${window.location.search}#${page}`);}};
  return {path,page,visited,navigate,closeDetail};
}

