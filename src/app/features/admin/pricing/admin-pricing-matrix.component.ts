import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingService } from '../../../core/services/pricing.service';
import { Pricing } from '../../../core/models/pricing.model';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-admin-pricing-matrix',
  standalone: true,
  imports: [CommonModule, TakaPipe],
  templateUrl: './admin-pricing-matrix.component.html',
  styleUrl: './admin-pricing-matrix.component.scss'
})
export class AdminPricingMatrixComponent {
  private pricingService = inject(PricingService);
  public pricingList = this.pricingService.pricingList;

  constructor() {}

  public editPricing(pricing: Pricing): void {
    const newCommission = prompt(`"${pricing.categoryId}" এর নতুন কমিশন রেট শতকরা কত হবে? (বর্তমান: ${(pricing.commissionRate * 100).toFixed(0)}%):`, `${pricing.commissionRate * 100}`);
    if (newCommission) {
      const rateNum = parseFloat(newCommission) / 100;
      this.pricingService.updatePricing({
        ...pricing,
        commissionRate: rateNum
      });
      alert(`কমিশন রেট পরিবর্তন করে ${newCommission}% করা হয়েছে!`);
    }
  }
}
