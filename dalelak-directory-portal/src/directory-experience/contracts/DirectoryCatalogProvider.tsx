import React,{createContext,useContext} from 'react';
import type { DirectoryCatalog } from './directory';
const CatalogContext=createContext<DirectoryCatalog|null>(null);
export function DirectoryCatalogProvider({catalog,children}:{catalog:DirectoryCatalog;children:React.ReactNode}) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}
export function useDirectoryCatalog() {
  const catalog=useContext(CatalogContext);
  if(!catalog)throw new Error('DirectoryCatalogProvider is required.');
  return catalog;
}
