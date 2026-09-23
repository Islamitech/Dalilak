import React,{useId} from 'react';
import { Search, MapPin, LocateFixed } from 'lucide-react';
import { useDirectoryCatalog } from '../contracts/DirectoryCatalogProvider';
import type { DirectoryFilters, LocationState } from '../contracts/directory';
export function SearchForm({filters,onChange,onSubmit,location,onLocate}:{filters:DirectoryFilters;onChange:(patch:Partial<DirectoryFilters>)=>void;onSubmit:()=>void;location:LocationState;onLocate:()=>void}) {
  const catalog=useDirectoryCatalog();
  const id=useId();
  return <form role="search" className="directory-search-form flex flex-col md:flex-row items-stretch gap-3 bg-white" onSubmit={e=>{e.preventDefault();onSubmit();}}><label htmlFor={id} className="flex items-center gap-3 flex-1 min-w-0 px-3"><Search size={21} className="text-emerald-800"/><span className="sr-only">اسم النشاط أو الخدمة</span><input id={id} type="search" className="min-w-0 w-full bg-transparent outline-none" placeholder="مطعم، طبيب، خدمة… ماذا تحتاج؟" value={filters.query} onChange={e=>onChange({query:e.target.value})}/></label><label className="flex gap-2 items-center px-3"><MapPin size={19}/><span className="sr-only">المدينة</span><select className="min-h-11 bg-transparent max-w-full" value={filters.city} onChange={e=>onChange({city:e.target.value})}><option value="all">كل المناطق</option>{catalog.cities.map(city=><option key={city}>{city}</option>)}</select></label><button type="button" className="directory-button secondary" onClick={onLocate} disabled={location==='loading'} aria-label="محاكاة البحث بالقرب مني"><LocateFixed size={18}/>{location==='loading'?'جارٍ التحديد…':location==='allowed'?'موقعي محدد':'بالقرب مني'}</button><button className="directory-button" type="submit"><Search size={18}/>بحث</button></form>;
}
