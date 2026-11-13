export interface Pricing {
  id: string; // Typically ${areaId}_${categoryId}
  areaId: string;
  categoryId: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  visitCharge: number;
  commissionRate: number; // e.g., 0.15 for 15%
  platformFee: number;
}
