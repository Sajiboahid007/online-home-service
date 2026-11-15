import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService } from '../../../core/services/pricing.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Pricing } from '../../../core/models/pricing.model';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-admin-pricing-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule, TakaPipe],
  templateUrl: './admin-pricing-matrix.component.html',
  styleUrl: './admin-pricing-matrix.component.scss'
})
export class AdminPricingMatrixComponent {
  public theme = inject(ThemeService);
  private pricingService = inject(PricingService);
  private toast = inject(ToastService);

  public pricingList = this.pricingService.pricingList;

  // Edit Pricing Modal State
  public showEditModal = signal<boolean>(false);
  public selectedPricing = signal<Pricing | null>(null);
  public editCommissionRate = signal<number>(15);
  public editBasePrice = signal<number>(300);
  public editMinPrice = signal<number>(200);
  public editMaxPrice = signal<number>(1500);
  public editVisitCharge = signal<number>(100);

  public openEditPricing(pricing: Pricing): void {
    this.selectedPricing.set(pricing);
    this.editCommissionRate.set(Math.round(pricing.commissionRate * 100));
    this.editBasePrice.set(pricing.basePrice);
    this.editMinPrice.set(pricing.minPrice);
    this.editMaxPrice.set(pricing.maxPrice);
    this.editVisitCharge.set(pricing.visitCharge);
    this.showEditModal.set(true);
  }

  public closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedPricing.set(null);
  }

  public confirmPricingUpdate(): void {
    const pricing = this.selectedPricing();
    if (!pricing) return;

    const commVal = Number(this.editCommissionRate());
    if (isNaN(commVal) || commVal < 0 || commVal > 50) {
      this.toast.warn(this.theme.currentLang() === 'bn' ? 'কমিশন রেট ০% থেকে ৫০%-এর মধ্যে হতে হবে।' : 'Commission rate must be between 0% and 50%.');
      return;
    }

    const updated: Pricing = {
      ...pricing,
      commissionRate: commVal / 100,
      basePrice: Number(this.editBasePrice()) || pricing.basePrice,
      minPrice: Number(this.editMinPrice()) || pricing.minPrice,
      maxPrice: Number(this.editMaxPrice()) || pricing.maxPrice,
      visitCharge: Number(this.editVisitCharge()) || pricing.visitCharge
    };

    this.pricingService.updatePricing(updated);

    const isBn = this.theme.currentLang() === 'bn';
    this.toast.success(
      isBn 
        ? `"${pricing.categoryId}"-এর প্রাইসিং ও কমিশন (${commVal}%) সফলভাবে আপডেট হয়েছে!` 
        : `Pricing & commission (${commVal}%) for "${pricing.categoryId}" updated successfully!`
    );

    this.closeEditModal();
  }
}
