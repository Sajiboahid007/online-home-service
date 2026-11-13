export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  amount: number;
  minOrderAmount: number;
  validUntil: string;
  isActive: boolean;
  usageCount: number;
  maxUsage: number;
  description: string;
  areaId?: string;
}
