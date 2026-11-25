import { Injectable, signal } from '@angular/core';
import { Category } from '../models/category.model';
import { SeedDataService } from './seed-data.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categoriesSignal = signal<Category[]>([]);
  public categories = this.categoriesSignal.asReadonly();

  constructor(private seedData: SeedDataService) {
    this.loadCategories();
  }

  private loadCategories(): void {
    const saved = localStorage.getItem('kajkhoj_categories');
    if (saved) {
      try {
        const parsed: Category[] = JSON.parse(saved);
        const defaultMap = new Map(this.seedData.defaultCategories.map(d => [d.id, d]));
        let migrated = false;
        const upgraded = parsed.map(c => {
          const def = defaultMap.get(c.id);
          const trimmedIcon = (c.icon || '').trim();
          // Upgrade legacy emoji seed icons in localStorage to PrimeIcons automatically
          if (def && !trimmedIcon.startsWith('pi ') && !trimmedIcon.startsWith('pi-')) {
            migrated = true;
            return { ...c, icon: def.icon };
          }
          return c;
        });

        const existingIds = new Set(upgraded.map(c => c.id));
        const missingDefaults = this.seedData.defaultCategories.filter(d => !existingIds.has(d.id));
        const merged = [...upgraded, ...missingDefaults].sort((a, b) => a.order - b.order);
        this.categoriesSignal.set(merged);
        if (missingDefaults.length > 0 || migrated) {
          this.saveToStorage();
        }
        return;
      } catch (e) {}
    }
    this.categoriesSignal.set(this.seedData.defaultCategories);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem('kajkhoj_categories', JSON.stringify(this.categoriesSignal()));
  }

  public getCategoryById(id: string): Category | undefined {
    return this.categoriesSignal().find(c => c.id === id);
  }

  public addCategory(cat: Category): void {
    this.categoriesSignal.update(list => [...list, cat]);
    this.saveToStorage();
  }

  public updateCategory(cat: Category): void {
    this.categoriesSignal.update(list => list.map(c => c.id === cat.id ? cat : c));
    this.saveToStorage();
  }

  public deleteCategory(id: string): void {
    this.categoriesSignal.update(list => list.filter(c => c.id !== id));
    this.saveToStorage();
  }
}
