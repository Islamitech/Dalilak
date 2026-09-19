import { Business, User } from '../../../../types';
import { ClassifiedEntity, EntityBucket } from '../../../../services/geo/entityClassifier';
import { HadayekSector } from '../../../../services/geo/hadayekAtlasData';

export interface CandidatePlace {
  id: string;
  displayName: string;
  category: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  phone?: string;
  rating?: number;
  userRatingCount?: number;
  workingHours?: string;
  googleMapsUri?: string;
  coverPhoto?: string;
  photosCount: number;
  isDuplicate: boolean;
  isQualityApproved: boolean;
  qualityBadgeText: string;
  isCraft: boolean;
  bucket: EntityBucket;
  bucketLabelAr: string;
  classification?: ClassifiedEntity;
}

export interface BatchSearchMetrics {
  totalFound: number;
  duplicatesCount: number;
  qualifiedCount: number;
  excludedCount: number;
  commercialCount?: number;
  residentialCount?: number;
  infrastructureCount?: number;
  civicCount?: number;
  spatialNodesCount?: number;
  estimatedCost: string;
}

export interface CategoryThreshold {
  label: string;
  keyword: string;
  type: string;
  icon: string;
  defaultMinRating: number;
  defaultMinReviews: number;
  explanation: string;
}

export interface ScanChunkStatus {
  stepText: string;
  chunkNumber: number;
  totalFoundSoFar: number;
  newFoundSoFar: number;
  duplicatesSoFar: number;
  excludedSoFar?: number;
}

export type EnginePhase = 'IDLE' | 'SCANNING' | 'DISCOVERED' | 'INGESTING' | 'DONE';

export interface AdminPlacesIngestionTabProps {
  currentUser: User;
  businesses: Business[];
  onAddBusiness?: (
    biz: Business,
    options?: {
      skipNavigation?: boolean;
      skipNotification?: boolean;
      skipInvoiceModal?: boolean;
    }
  ) => Promise<void> | void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export type { HadayekSector, EntityBucket };
