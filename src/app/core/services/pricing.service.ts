import { Injectable, signal } from '@angular/core';
import { Pricing } from '../models/pricing.model';
import { Coupon } from '../models/coupon.model';
import { SeedDataService } from './seed-data.service';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private pricingListSignal = signal<Pricing[]>([]);
  public pricingList = this.pricingListSignal.asReadonly();

  private couponsSignal = signal<Coupon[]>([]);
  public coupons = this.couponsSignal.asReadonly();

  constructor(private seedData: SeedDataService) {
    this.loadPricing();
    this.loadCoupons();
  }

  private loadPricing(): void {
    const saved = localStorage.getItem('kajkhoj_pricing');
    if (saved) {
      try {
        this.pricingListSignal.set(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    this.pricingListSignal.set(this.seedData.defaultPricing);
    this.savePricingToStorage();
  }

  private savePricingToStorage(): void {
    localStorage.setItem('kajkhoj_pricing', JSON.stringify(this.pricingListSignal()));
  }

  private loadCoupons(): void {
    const defaultCoupons: Coupon[] = [
      {
        id: 'KAJKHOJ50',
        code: 'KAJKHOJ50',
        discountType: 'fixed',
        amount: 50,
        minOrderAmount: 300,
        validUntil: '2027-12-31T23:59:59Z',
        isActive: true,
        usageCount: 42,
        maxUsage: 500,
        description: 'নতুন গ্রাহকদের জন্য ৫০ টাকা বিশেষ ছাড়'
      },
      {
        id: 'SAVARFREE',
        code: 'SAVARFREE',
        discountType: 'percentage',
        amount: 10,
        minOrderAmount: 200,
        validUntil: '2027-12-31T23:59:59Z',
        isActive: true,
        usageCount: 18,
        maxUsage: 200,
        description: 'সাভার এলাকার প্রথম অর্ডারে ১০% ছাড়'
      }
    ];

    const saved = localStorage.getItem('kajkhoj_coupons');
    if (saved) {
      try {
        this.couponsSignal.set(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    this.couponsSignal.set(defaultCoupons);
    this.saveCouponsToStorage();
  }

  private saveCouponsToStorage(): void {
    localStorage.setItem('kajkhoj_coupons', JSON.stringify(this.couponsSignal()));
  }

  public getPricingFor(areaId: string, categoryId: string): Pricing {
    const found = this.pricingListSignal().find(p => p.areaId === areaId && p.categoryId === categoryId);
    if (found) return found;

    return {
      id: `${areaId}_${categoryId}`,
      areaId,
      categoryId,
      basePrice: 350,
      minPrice: 200,
      maxPrice: 1000,
      visitCharge: 100,
      commissionRate: 0.15,
      platformFee: 20
    };
  }

  public updatePricing(pricing: Pricing): void {
    this.pricingListSignal.update(list => {
      const idx = list.findIndex(p => p.id === pricing.id);
      if (idx >= 0) {
        list[idx] = pricing;
        return [...list];
      }
      return [...list, pricing];
    });
    this.savePricingToStorage();
  }

  // Coupon validation
  public validateCoupon(code: string, orderAmount: number, areaId?: string): { valid: boolean; discount: number; message: string; coupon?: Coupon } {
    const coupon = this.couponsSignal().find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!coupon) {
      return { valid: false, discount: 0, message: 'কুপন কোডটি সঠিক নয়।' };
    }
    if (!coupon.isActive) {
      return { valid: false, discount: 0, message: 'এই কুপনটি বর্তমানে নিষ্ক্রিয়।' };
    }
    if (new Date(coupon.validUntil).getTime() < Date.now()) {
      return { valid: false, discount: 0, message: 'কুপনের মেয়াদ শেষ হয়ে গেছে।' };
    }
    if (coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, discount: 0, message: 'কুপনের সর্বোচ্চ ব্যবহারের সীমা শেষ।' };
    }
    if (orderAmount < coupon.minOrderAmount) {
      return { valid: false, discount: 0, message: `ন্যূনতম ৳${coupon.minOrderAmount} টাকার অর্ডারে এই কুপন প্রযোজ্য।` };
    }
    if (coupon.areaId && areaId && coupon.areaId !== areaId) {
      return { valid: false, discount: 0, message: 'এই কুপনটি আপনার এলাকায় প্রযোজ্য নয়।' };
    }

    let discount = 0;
    if (coupon.discountType === 'fixed') {
      discount = coupon.amount;
    } else {
      discount = Math.round((orderAmount * coupon.amount) / 100);
    }

    return {
      valid: true,
      discount: Math.min(discount, orderAmount),
      message: `কুপন সফলভাবে প্রয়োগ হয়েছে! ৳${discount} ছাড়।`,
      coupon
    };
  }

  public addCoupon(coupon: Coupon): void {
    this.couponsSignal.update(list => [coupon, ...list]);
    this.saveCouponsToStorage();
  }

  public updateCoupon(coupon: Coupon): void {
    this.couponsSignal.update(list => list.map(c => c.id === coupon.id ? coupon : c));
    this.saveCouponsToStorage();
  }

  public deleteCoupon(id: string): void {
    this.couponsSignal.update(list => list.filter(c => c.id !== id));
    this.saveCouponsToStorage();
  }

  // Spec §14.5 Full bill calculation formula on server / client
  public calculateFullBill(params: {
    baseRate: number;
    units?: number; // hours or days or 1 for job
    visitCharge: number;
    materialCost: number;
    surgeMultiplier: number;
    platformFee: number;
    couponDiscount: number;
    commissionRate: number;
  }): {
    laborCost: number;
    surgeAmount: number;
    subtotal: number;
    total: number;
    platformCommission: number;
    workerPayout: number;
  } {
    const units = params.units || 1;
    const laborCost = params.baseRate * units;
    const baseSubtotal = laborCost + params.visitCharge;
    const surgeMultiplier = Math.max(1.0, params.surgeMultiplier || 1.0);
    const surgeAmount = Math.round(baseSubtotal * (surgeMultiplier - 1.0));
    const subtotal = baseSubtotal + surgeAmount + (params.materialCost || 0) + (params.platformFee || 20);
    const total = Math.max(0, subtotal - (params.couponDiscount || 0));

    const commissionBase = laborCost + surgeAmount;
    const platformCommission = Math.round(commissionBase * (params.commissionRate || 0.15)) + (params.platformFee || 20);
    const workerPayout = total - platformCommission;

    return {
      laborCost,
      surgeAmount,
      subtotal,
      total,
      platformCommission,
      workerPayout
    };
  }
}
