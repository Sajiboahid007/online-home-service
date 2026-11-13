import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
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
  private categoryService = inject(CategoryService);

  public categories = this.categoryService.categories;
  public showCreateModal = signal(false);

  public newIcon = '';
  public newNameBn = '';
  public newNameEn = '';
  public newPricingType: RateUnit = 'job';
  public newOrder = 1;

  public toggleActive(cat: Category): void {
    this.categoryService.updateCategory({
      ...cat,
      isActive: !cat.isActive
    });
  }

  public deleteCat(id: string): void {
    if (confirm('আপনি কি নিশ্চিতভাবে এই ক্যাটাগরিটি মুছে ফেলতে চান?')) {
      this.categoryService.deleteCategory(id);
    }
  }

  public createCategory(): void {
    if (!this.newNameBn || !this.newNameEn) {
      alert('অনুগ্রহ করে বাংলা ও ইংরেজি নাম পূরণ করুন');
      return;
    }

    const newCat: Category = {
      id: this.newNameEn.toLowerCase().replace(/\s+/g, '-'),
      nameBn: this.newNameBn,
      nameEn: this.newNameEn,
      icon: this.newIcon || '🛠️',
      pricingType: this.newPricingType,
      isActive: true,
      order: Number(this.newOrder) || 1
    };

    this.categoryService.addCategory(newCat);
    this.showCreateModal.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.newIcon = '';
    this.newNameBn = '';
    this.newNameEn = '';
    this.newPricingType = 'job';
    this.newOrder = 1;
  }
}
