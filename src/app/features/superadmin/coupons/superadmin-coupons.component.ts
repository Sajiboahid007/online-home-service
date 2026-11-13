import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService } from '../../../core/services/pricing.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Coupon } from '../../../core/models/coupon.model';

@Component({
  selector: 'app-superadmin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-coupons.component.html',
  styleUrls: ['./superadmin-coupons.component.scss']
})
export class SuperadminCouponsComponent {
  private pricingService = inject(PricingService);
  private auditLogService = inject(AuditLogService);
  private notificationService = inject(NotificationService);

  public coupons = this.pricingService.coupons;
  public showCreateModal = signal(false);

  public newCode = '';
  public newDiscountType: 'fixed' | 'percentage' = 'fixed';
  public newAmount = 50;
  public newMinOrder = 200;
  public newMaxUsage = 100;
  public newValidUntil = '2027-12-31';
  public newDescription = '';

  public toggleActive(coupon: Coupon): void {
    const updated = { ...coupon, isActive: !coupon.isActive };
    this.pricingService.updateCoupon(updated);
    this.auditLogService.logAction(
      'TOGGLE_COUPON_STATUS',
      'coupon',
      coupon.code,
      { isActive: updated.isActive }
    );
  }

  public deleteCoupon(id: string): void {
    if (confirm('আপনি কি এই কুপনটি মুছে ফেলতে চান?')) {
      this.pricingService.deleteCoupon(id);
      this.auditLogService.logAction('DELETE_COUPON', 'coupon', id);
      this.notificationService.notify('কুপন সফলভাবে মুছে ফেলা হয়েছে', 'info');
    }
  }

  public createCoupon(): void {
    if (!this.newCode.trim()) {
      alert('অনুগ্রহ করে কুপন কোড প্রদান করুন');
      return;
    }

    const code = this.newCode.trim().toUpperCase();
    const newCoupon: Coupon = {
      id: code,
      code,
      discountType: this.newDiscountType,
      amount: Number(this.newAmount) || 0,
      minOrderAmount: Number(this.newMinOrder) || 0,
      validUntil: this.newValidUntil ? `${this.newValidUntil}T23:59:59Z` : new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
      usageCount: 0,
      maxUsage: Number(this.newMaxUsage) || 100,
      description: this.newDescription.trim() || 'বিশেষ অফার'
    };

    this.pricingService.addCoupon(newCoupon);
    this.auditLogService.logAction('CREATE_COUPON', 'coupon', code, newCoupon);

    this.showCreateModal.set(false);
    this.resetForm();
    this.notificationService.notify(`কুপন '${code}' সফলভাবে তৈরি হয়েছে`, 'success');
  }

  private resetForm(): void {
    this.newCode = '';
    this.newDiscountType = 'fixed';
    this.newAmount = 50;
    this.newMinOrder = 200;
    this.newMaxUsage = 100;
    this.newValidUntil = '2027-12-31';
    this.newDescription = '';
  }
}
