/** Presentation contracts only. No database rows or administrative fields. */
export interface DirectoryPlace {
  id: string; name: string; category: string; city: string; area: string; address: string;
  description: string; hours: string; open: boolean | null; phone?: string;
  verified: boolean; rating?: number; reviewCount?: number; distance?: string;
  photos: string[]; hasVideo?: boolean; mapPoint?: { x: number; y: number };
  coordinates?: {lat:number;lng:number};
}
export type ViewState = 'ready' | 'loading' | 'empty' | 'error' | 'offline' | 'unauthorized';
export type LocationState = 'idle' | 'loading' | 'allowed' | 'denied';
export type ActionKind = 'call' | 'whatsapp' | 'directions' | 'share' | 'contact' | 'report' | 'package';
export interface DirectoryActions { onAction: (kind: ActionKind, place?: DirectoryPlace) => void; }
export interface DirectoryDataPort {
  places: readonly DirectoryPlace[];
  state: ViewState;
  onRetry: () => void;
}
export interface DirectoryPackage {
  id:string;track:string;name:string;price:string;unit:string;description:string;
  features:string[];duration:string;popular?:boolean;
}
export interface DirectoryCatalog {
  places:readonly DirectoryPlace[];
  categories:readonly string[];
  cities:readonly string[];
  areas:readonly string[];
  gates:readonly DirectoryGate[];
  districts:readonly DirectoryDistrict[];
  packages:readonly DirectoryPackage[];
}
export interface DirectoryGate {id:string;name:string;road:string;areas:string;servedZones:readonly string[];lat:number;lng:number;}
export interface DirectoryDistrict {id:number;letterAr:string;nameAr:string;centerLat:number;centerLng:number;polygons:[number,number][][];}
export interface DirectoryFilters { query: string; category: string; city: string; open: boolean; rated: boolean; video: boolean; sort: string; }
export const initialFilters: DirectoryFilters = { query: '', category: 'all', city: 'all', open: false, rated: false, video: false, sort: 'recommended' };
