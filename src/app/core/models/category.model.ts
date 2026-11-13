import { RateUnit } from './worker.model';

export interface Category {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  imageURL?: string;
  pricingType: RateUnit;
  isActive: boolean;
  order: number;
}
