import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { CategoryService } from '../../../core/services/category.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { WorkerProfile, RateUnit } from '../../../core/models/worker.model';
import { CATEGORY_DEFAULTS, getSuggestedSkillsForCategories, syncSkillsWithCategories } from '../../../core/constants/category-defaults';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-worker-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent, SkeletonLoaderComponent, BnNumberPipe, TranslatePipe],
  templateUrl: './worker-edit-profile.component.html',
  styleUrls: ['./worker-edit-profile.component.scss']
})
export class WorkerEditProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private workerService = inject(WorkerService);
  private categoryService = inject(CategoryService);
  public theme = inject(ThemeService);
  public isEn = computed(() => this.theme.currentLang() === 'en');

  public worker = this.auth.currentWorker;
  public categories = computed(() =>
    this.categoryService.categories().filter(c => c.isActive).sort((a, b) => a.order - b.order)
  );

  public selectedCategoryIds = signal<string[]>([]);
  public rate = signal<number>(350);
  public rateUnit = signal<RateUnit>('job');
  public serviceRadiusKm = signal<number>(6);
  public bio = signal<string>('');
  public skills = signal<string[]>([]);
  public newSkill = signal<string>('');
  public portfolio = signal<string[]>([]);
  public saveSuccess = signal<boolean>(false);
  private rateUnitCustomized = false;
  private bioCustomized = false;

  public suggestedSkills = computed(() =>
    getSuggestedSkillsForCategories(this.selectedCategoryIds())
  );

  // Rate reward calculation: 4.5+ rating and 50+ jobs can raise rate ceiling by 20% (Item 36)
  public canRewardRate = computed(() => {
    const w = this.worker();
    return w ? this.workerService.canClaimRateReward(w) : false;
  });

  public minRateLimit = signal<number>(200);
  public maxRateLimit = computed(() => {
    return this.canRewardRate() ? 1200 : 1000;
  });

  public hasCancellationWarning = computed(() => {
    const w = this.worker();
    return w ? (w.cancelRate || 0) > 0.15 : false;
  });

  ngOnInit(): void {
    const w = this.worker();
    if (w) {
      this.selectedCategoryIds.set(w.categoryIds || []);
      this.rate.set(w.rate || 350);
      this.rateUnit.set(w.rateUnit || 'job');
      this.serviceRadiusKm.set(w.serviceRadiusKm || 6);
      this.bio.set(w.bio || '');
      this.skills.set(w.skills || []);
      this.portfolio.set(w.portfolio || []);
    }
  }

  public isCategorySelected(catId: string): boolean {
    return this.selectedCategoryIds().includes(catId);
  }

  public toggleCategory(catId: string): void {
    const prev = [...this.selectedCategoryIds()];
    const current = [...prev];
    const idx = current.indexOf(catId);
    if (idx >= 0) {
      if (current.length > 1) {
        current.splice(idx, 1);
      }
    } else {
      current.push(catId);
    }
    if (current.length === prev.length && current.every((v, i) => v === prev[i])) {
      return;
    }

    this.selectedCategoryIds.set(current);
    this.skills.set(syncSkillsWithCategories(this.skills(), prev, current));

    const primaryCatId = current[0];
    const catModel = this.categoryService.getCategoryById(primaryCatId);
    const defaults = CATEGORY_DEFAULTS[primaryCatId];

    if (!this.rateUnitCustomized) {
      const unit = catModel?.pricingType || defaults?.rateUnit;
      if (unit) {
        this.rateUnit.set(unit);
      }
    }
    if (!this.bioCustomized && defaults && (!this.bio().trim() || Object.values(CATEGORY_DEFAULTS).some(d => d.defaultBio === this.bio().trim()))) {
      this.bio.set(defaults.defaultBio);
    }
  }

  public onRateUnitChange(unit: RateUnit): void {
    this.rateUnitCustomized = true;
    this.rateUnit.set(unit);
  }

  public onBioChange(value: string): void {
    this.bioCustomized = true;
    this.bio.set(value);
  }

  public hasSkill(skill: string): boolean {
    return this.skills().includes(skill);
  }

  public toggleSuggestedSkill(skill: string): void {
    if (this.hasSkill(skill)) {
      this.skills.update(list => list.filter(s => s !== skill));
    } else {
      this.skills.update(list => [...list, skill]);
    }
  }

  public addSkill(): void {
    const s = this.newSkill().trim();
    if (s && !this.skills().includes(s)) {
      this.skills.update(list => [...list, s]);
      this.newSkill.set('');
    }
  }

  public removeSkill(index: number): void {
    this.skills.update(list => {
      const copy = [...list];
      copy.splice(index, 1);
      return copy;
    });
  }

  public uploadPortfolioPhoto(url: string): void {
    this.portfolio.update(list => [url, ...list]);
  }

  public deletePortfolio(index: number): void {
    this.portfolio.update(list => {
      const copy = [...list];
      copy.splice(index, 1);
      return copy;
    });
  }

  public saveProfile(): void {
    const current = this.worker();
    if (!current) return;

    const updated: WorkerProfile = {
      ...current,
      categoryIds: this.selectedCategoryIds().length > 0 ? this.selectedCategoryIds() : current.categoryIds,
      rate: this.rate(),
      rateUnit: this.rateUnit(),
      serviceRadiusKm: this.serviceRadiusKm(),
      bio: this.bio(),
      skills: this.skills(),
      portfolio: this.portfolio()
    };

    this.workerService.updateWorker(updated);
    this.auth.updateWorkerProfile(updated);

    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }
}
