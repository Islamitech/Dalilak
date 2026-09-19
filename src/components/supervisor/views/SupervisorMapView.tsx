import React from 'react';
import { Business } from '../../../types';
import { InteractiveMap } from '../../InteractiveMap';
import { SupervisorSubViewHeader } from '../components/SupervisorSubViewHeader';

export interface SupervisorMapViewProps {
  selectedGov: string;
  scopedBusinesses: Business[];
  onBack: () => void;
  onSelectDrawerBiz: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
}

export const SupervisorMapView: React.FC<SupervisorMapViewProps> = ({
  selectedGov,
  scopedBusinesses,
  onBack,
  onSelectDrawerBiz,
  onEditBusiness,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <SupervisorSubViewHeader
        title={`خريطة تغطية ${selectedGov}`}
        count={scopedBusinesses.length}
        selectedGov={selectedGov}
        onBack={onBack}
      />
      <div className="rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-md">
        <InteractiveMap
          mode="view"
          businesses={scopedBusinesses}
          onSelectBusiness={onSelectDrawerBiz}
          onEditBusiness={onEditBusiness}
          heightClass="h-[520px]"
        />
      </div>
    </div>
  );
};
