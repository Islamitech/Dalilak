import { Business } from '../../types';
import { LocationAddressData } from '../../utils/geocoding';

export interface InteractiveMapProps {
  mode?: 'picker' | 'view';
  lat?: number;
  lng?: number;
  onLocationSelect?: (lat: number, lng: number, addressDetails?: LocationAddressData) => void;
  businesses?: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  selectedBusiness?: Business | null;
  heightClass?: string;
  targetBuilding?: {
    zoneLetter?: string;
    buildingNumber?: string;
    lat?: number;
    lng?: number;
  } | null;
  showHadayekGates?: boolean;
  selectedZone?: string;
  onSelectZone?: (zoneLetter: string) => void;
  initialShowBusinesses?: boolean;
  onToggleBusinessesVisibility?: (visible: boolean) => void;
  defaultExpanded?: boolean;
  onExploreDirectory?: () => void;
}
