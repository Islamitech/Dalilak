import type { DirectoryDistrict } from '../contracts/directory';
export const MAP_SIZE=1000;
export interface Point {x:number;y:number;}
export interface MapProjection {project:(lat:number,lng:number)=>Point;}
/** Local equirectangular projection for the small Hadayek extent; UI geometry only. */
export function createMapProjection(districts:readonly DirectoryDistrict[]):MapProjection {
  const points=districts.flatMap(d=>d.polygons.flat());
  if(!points.length)return {project:()=>({x:500,y:500})};
  const north=Math.max(...points.map(p=>p[0])),south=Math.min(...points.map(p=>p[0]));
  const east=Math.max(...points.map(p=>p[1])),west=Math.min(...points.map(p=>p[1]));
  const longitudeScale=Math.cos(((north+south)/2)*Math.PI/180);
  const width=(east-west)*longitudeScale,height=north-south;
  const scale=800/Math.max(width,height,.00001);
  return {project:(lat,lng)=>({x:500+(lng-(east+west)/2)*longitudeScale*scale,y:500- (lat-(north+south)/2)*scale})};
}
export function districtPath(district:DirectoryDistrict,projection:MapProjection) {
  return district.polygons.map(ring=>ring.map((p,i)=>{const point=projection.project(p[0],p[1]);return `${i?'L':'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;}).join(' ')+' Z').join(' ');
}
export function clampZoom(value:number){return Math.min(4,Math.max(.8,value));}
export function zoomAround(view:{zoom:number;x:number;y:number},nextZoom:number,anchor:Point) {
  const zoom=clampZoom(nextZoom),ratio=zoom/view.zoom;
  return {zoom,x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio};
}
