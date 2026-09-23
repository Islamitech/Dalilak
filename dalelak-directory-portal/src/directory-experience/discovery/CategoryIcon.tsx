import React from 'react';
import { Coffee, Utensils, Stethoscope, ShoppingBasket, Wrench, Car, Store } from 'lucide-react';
export function CategoryIcon({category,size=24}:{category:string;size?:number}) {
  const icons={ 'كافيهات':Coffee,'مطاعم ومأكولات':Utensils,'صحة ورعاية':Stethoscope,'تسوق وبقالة':ShoppingBasket,'خدمات منزلية':Wrench,'خدمات سيارات':Car };
  const Icon=icons[category as keyof typeof icons]||Store;
  return <Icon size={size} aria-hidden="true"/>;
}
