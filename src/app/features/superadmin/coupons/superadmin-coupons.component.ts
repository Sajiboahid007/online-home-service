import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { PricingService } from '../../../core/services/pricing.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Coupon } from '../../../core/models/coupon.model';

@Component({
  selector: 'app-superadmin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-coupons.component.html',
  styleUrls: ['./superadmin-coupons.component.scss']
})
export class SuperadminCouponsComponent {
  public theme = inject(ThemeService);
  private pricingService = inject(PricingService);
  private auditLogService = inject(AuditLogService);
  private toast = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  public coupons = this.pricingService.coupons;
  public showModal = signal<boolean>(false);
  public isEditing = signal<boolean>(false);
  public editingCouponId = signal<string | null>(null);

  // Form fields
  public formCode = '';
  public formDiscountType: 'fixed' | 'percentage' = 'fixed';
  public formAmount = 50;
  public formMinOrder = 200;
  public formMaxUsage = 100;
  public formValidUntil = '2027-12-31';
  public formDescription = '';
  public formIsActive = true;

  public openCreateModal(): void {
    this.isEditing.set(false);
    this.editingCouponId.set(null);
    this.formCode = '';
    this.formDiscountType = 'fixed';
    this.formAmount = 50;
    this.formMinOrder = 200;
    this.formMaxUsage = 100;
    this.formValidUntil = '2027-12-31';
    this.formDescription = '';
    this.formIsActive = true;
    this.showModal.set(true);
  }

  public openEditModal(coupon: Coupon): void {
    this.isEditing.set(true);
    this.editingCouponId.set(coupon.id);
    this.formCode = coupon.code || '';
    this.formDiscountType = coupon.discountType || 'fixed';
    this.formAmount = coupon.amount ?? 50;
    this.formMinOrder = coupon.minOrderAmount ?? 200;
    this.formMaxUsage = coupon.maxUsage ?? 100;
    this.formValidUntil = coupon.validUntil ? coupon.validUntil.split('T')[0] : '2027-12-31';
    this.formDescription = coupon.description || '';
    this.formIsActive = coupon.isActive !== false;
    this.showModal.set(true);
  }

  public closeModal(): void {
    this.showModal.set(false);
  }

  public saveCoupon(): void {
    if (!this.formCode.trim()) {
      alert('অনুগ্রহ করে কুপন কোড প্রদান করুন / Please provide a coupon code');
      return;
    }

    const code = this.formCode.trim().toUpperCase();

    if (this.isEditing()) {
      const id = this.editingCouponId();
      if (!id) return;
      const existing = this.coupons().find(c => c.id === id);

      const updatedCoupon: Coupon = {
        ...existing,
        id,
        code,
        discountType: this.formDiscountType,
        amount: Number(this.formAmount) || 0,
        minOrderAmount: Number(this.formMinOrder) || 0,
        validUntil: this.formValidUntil ? `${this.formValidUntil}T23:59:59Z` : (existing?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString()),
        isActive: this.formIsActive,
        usageCount: existing?.usageCount ?? 0,
        maxUsage: Number(this.formMaxUsage) || 100,
        description: this.formDescription.trim() || 'বিশেষ অফার / Special Offer'
      };

      this.pricingService.updateCoupon(updatedCoupon);
      this.auditLogService.logAction('UPDATE_COUPON', 'coupon', code, updatedCoupon);

      this.toast.success(
        `কুপন '${code}' সফলভাবে আপডেট করা হয়েছে / Coupon updated successfully`,
        'আপডেট সম্পন্ন (Updated)'
      );
    } else {
      const newCoupon: Coupon = {
        id: code,
        code,
        discountType: this.formDiscountType,
        amount: Number(this.formAmount) || 0,
        minOrderAmount: Number(this.formMinOrder) || 0,
        validUntil: this.formValidUntil ? `${this.formValidUntil}T23:59:59Z` : new Date(Date.now() + 30 * 86400000).toISOString(),
        isActive: this.formIsActive,
        usageCount: 0,
        maxUsage: Number(this.formMaxUsage) || 100,
        description: this.formDescription.trim() || 'বিশেষ অফার / Special Offer'
      };

      this.pricingService.addCoupon(newCoupon);
      this.auditLogService.logAction('CREATE_COUPON', 'coupon', code, newCoupon);

      this.toast.success(
        `নতুন কুপন '${code}' সফলভাবে তৈরি হয়েছে / Coupon created successfully`,
        'তৈরি সম্পন্ন (Created)'
      );
    }

    this.closeModal();
  }

  public toggleActive(coupon: Coupon): void {
    const updated = { ...coupon, isActive: !coupon.isActive };
    this.pricingService.updateCoupon(updated);
    this.auditLogService.logAction(
      'TOGGLE_COUPON_STATUS',
      'coupon',
      coupon.code,
      { isActive: updated.isActive }
    );

    this.toast.info(
      `কুপন '${coupon.code}' এখন ${updated.isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}`,
      'স্ট্যাটাস পরিবর্তন (Status Changed)'
    );
  }

  public deleteCoupon(coupon: Coupon): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'কুপন মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Coupon Deletion',
      message: isBn
        ? `আপনি কি নিশ্চিতভাবে '${coupon.code}' কুপনটি স্থায়ীভাবে মুছে ফেলতে চান?`
        : `Are you sure you want to permanently delete coupon '${coupon.code}'?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'মুছুন' : 'Delete',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.pricingService.deleteCoupon(coupon.id);
        this.auditLogService.logAction('DELETE_COUPON', 'coupon', coupon.id);

        this.toast.warn(
          isBn ? `কুপন '${coupon.code}' সফলভাবে মুছে ফেলা হয়েছে` : `Coupon '${coupon.code}' deleted successfully`,
          isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted'
        );
      }
    });
  }
}
