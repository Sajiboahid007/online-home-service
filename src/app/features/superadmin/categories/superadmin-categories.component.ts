import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Category } from '../../../core/models/category.model';
import { RateUnit } from '../../../core/models/worker.model';

@Component({
  selector: 'app-superadmin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-categories.component.html',
  styleUrls: ['./superadmin-categories.component.scss']
})
export class SuperadminCategoriesComponent {
  public theme = inject(ThemeService);
  private categoryService = inject(CategoryService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  public categories = this.categoryService.categories;
  public showModal = signal(false);
  public isEditing = signal(false);
  public editingCategoryId = signal<string | null>(null);

  // Form fields
  public formIcon = '🛠️';
  public formNameBn = '';
  public formNameEn = '';
  public formPricingType: RateUnit = 'job';
  public formOrder = 1;
  public formIsActive = true;

  public openCreateModal(): void {
    this.isEditing.set(false);
    this.editingCategoryId.set(null);
    this.resetForm();
    this.formOrder = this.categories().length + 1;
    this.showModal.set(true);
  }

  public openEditModal(cat: Category): void {
    this.isEditing.set(true);
    this.editingCategoryId.set(cat.id);
    this.formIcon = cat.icon || '🛠️';
    this.formNameBn = cat.nameBn || '';
    this.formNameEn = cat.nameEn || '';
    this.formPricingType = cat.pricingType || 'job';
    this.formOrder = cat.order ?? 1;
    this.formIsActive = cat.isActive !== false;
    this.showModal.set(true);
  }

  public closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  public saveCategory(): void {
    if (!this.formNameBn.trim() || !this.formNameEn.trim()) {
      alert('অনুগ্রহ করে বাংলা ও ইংরেজি নাম উভয়ই পূরণ করুন');
      return;
    }

    if (this.isEditing()) {
      const id = this.editingCategoryId();
      if (!id) return;
      const existing = this.categoryService.getCategoryById(id);

      const updatedCat: Category = {
        ...existing,
        id,
        nameBn: this.formNameBn.trim(),
        nameEn: this.formNameEn.trim(),
        icon: this.formIcon.trim() || '🛠️',
        pricingType: this.formPricingType,
        order: Number(this.formOrder) || 1,
        isActive: this.formIsActive
      };

      this.categoryService.updateCategory(updatedCat);
      this.toast.success(
        `"${updatedCat.nameBn}" (${updatedCat.nameEn}) ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে`,
        'আপডেট সম্পন্ন (Updated)'
      );
    } else {
      const generatedId = this.formNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;

      const newCat: Category = {
        id: generatedId,
        nameBn: this.formNameBn.trim(),
        nameEn: this.formNameEn.trim(),
        icon: this.formIcon.trim() || '🛠️',
        pricingType: this.formPricingType,
        isActive: this.formIsActive,
        order: Number(this.formOrder) || 1
      };

      this.categoryService.addCategory(newCat);
      this.toast.success(
        `নতুন ক্যাটাগরি "${newCat.nameBn}" (${newCat.nameEn}) সফলভাবে তৈরি হয়েছে`,
        'তৈরি সম্পন্ন (Created)'
      );
    }

    this.closeModal();
  }

  public toggleActive(cat: Category): void {
    const updated = {
      ...cat,
      isActive: !cat.isActive
    };
    this.categoryService.updateCategory(updated);
    this.toast.info(
      `"${cat.nameBn}" এখন ${updated.isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}`,
      'স্ট্যাটাস পরিবর্তন (Status Changed)'
    );
  }

  public deleteCat(cat: Category): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'ক্যাটাগরি মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Category Deletion',
      message: isBn
        ? `আপনি কি নিশ্চিতভাবে "${cat.nameBn}" (${cat.nameEn}) ক্যাটাগরিটি মুছে ফেলতে চান?`
        : `Are you sure you want to permanently delete category "${cat.nameEn}" (${cat.nameBn})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'মুছুন' : 'Delete',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.categoryService.deleteCategory(cat.id);
        this.toast.warn(
          isBn ? `"${cat.nameBn}" ক্যাটাগরি মুছে ফেলা হয়েছে` : `Category "${cat.nameEn}" deleted successfully`,
          isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted'
        );
      }
    });
  }

  private resetForm(): void {
    this.formIcon = '🛠️';
    this.formNameBn = '';
    this.formNameEn = '';
    this.formPricingType = 'job';
    this.formOrder = 1;
    this.formIsActive = true;
  }
}
