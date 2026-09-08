import { useState, useEffect } from 'react';
import { safeGetLocalStorageItem, safeSetLocalStorageItem, safeRemoveLocalStorageItem } from '../../../utils/storage';

interface DraftFields {
  nameAr: string;
  nameEn: string;
  category: string;
  selectedGroup: string;
  governorate: string;
  city: string;
  street: string;
  landmark: string;
  phone: string;
  secondaryPhone: string;
  workingHours: string;
  description: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  nationalId: string;
  notes: string;
  lat: number;
  lng: number;
}

interface UseBusinessFormDraftProps {
  initialLead?: any;
  submittedBusiness: any;
  fields: DraftFields;
  setters: {
    setNameAr: (val: string) => void;
    setNameEn: (val: string) => void;
    setCategory: (val: string) => void;
    setSelectedGroup: (val: string) => void;
    setGovernorate: (val: string) => void;
    setCity: (val: string) => void;
    setStreet: (val: string) => void;
    setLandmark: (val: string) => void;
    setPhone: (val: string) => void;
    setSecondaryPhone: (val: string) => void;
    setWorkingHours: (val: string) => void;
    setDescription: (val: string) => void;
    setOwnerName: (val: string) => void;
    setOwnerPhone: (val: string) => void;
    setOwnerEmail: (val: string) => void;
    setNationalId: (val: string) => void;
    setNotes: (val: string) => void;
    setLat: (val: number) => void;
    setLng: (val: number) => void;
  };
}

export const useBusinessFormDraft = ({
  initialLead,
  submittedBusiness,
  fields,
  setters,
}: UseBusinessFormDraftProps) => {
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  // 1. Restore draft on initial mount if not provided initialLead
  useEffect(() => {
    if (initialLead) return;
    try {
      const savedDraftStr = safeGetLocalStorageItem('dalelak_business_form_draft');
      if (savedDraftStr) {
        const d = JSON.parse(savedDraftStr);
        if (d && (d.nameAr || d.phone || d.street)) {
          if (d.nameAr) setters.setNameAr(d.nameAr);
          if (d.nameEn) setters.setNameEn(d.nameEn);
          if (d.category) setters.setCategory(d.category);
          if (d.selectedGroup) setters.setSelectedGroup(d.selectedGroup);
          if (d.governorate) setters.setGovernorate(d.governorate);
          if (d.city) setters.setCity(d.city);
          if (d.street) setters.setStreet(d.street);
          if (d.landmark) setters.setLandmark(d.landmark);
          if (d.phone) setters.setPhone(d.phone);
          if (d.secondaryPhone) setters.setSecondaryPhone(d.secondaryPhone);
          if (d.workingHours) setters.setWorkingHours(d.workingHours);
          if (d.description) setters.setDescription(d.description);
          if (d.ownerName) setters.setOwnerName(d.ownerName);
          if (d.ownerPhone) setters.setOwnerPhone(d.ownerPhone);
          if (d.ownerEmail) setters.setOwnerEmail(d.ownerEmail);
          if (d.nationalId) setters.setNationalId(d.nationalId);
          if (d.notes) setters.setNotes(d.notes);
          if (d.lat && d.lng) {
            setters.setLat(d.lat);
            setters.setLng(d.lng);
          }
          setDraftRestored(true);
        }
      }
    } catch (e) {}
  }, []);

  // 2. Auto-save draft on any field change
  useEffect(() => {
    if (submittedBusiness) return;
    if (!fields.nameAr && !fields.phone && !fields.street && !fields.ownerName) return;

    const draft = {
      ...fields,
      updatedAt: Date.now(),
    };
    safeSetLocalStorageItem('dalelak_business_form_draft', JSON.stringify(draft));
  }, [
    fields.nameAr,
    fields.nameEn,
    fields.category,
    fields.selectedGroup,
    fields.governorate,
    fields.city,
    fields.street,
    fields.landmark,
    fields.phone,
    fields.secondaryPhone,
    fields.workingHours,
    fields.description,
    fields.ownerName,
    fields.ownerPhone,
    fields.ownerEmail,
    fields.nationalId,
    fields.notes,
    fields.lat,
    fields.lng,
    submittedBusiness,
  ]);

  const clearDraft = () => {
    safeRemoveLocalStorageItem('dalelak_business_form_draft');
    setDraftRestored(false);
  };

  return {
    draftRestored,
    setDraftRestored,
    clearDraft,
  };
};
