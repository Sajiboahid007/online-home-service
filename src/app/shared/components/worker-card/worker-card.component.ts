import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerProfile } from '../../../core/models/worker.model';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { ThemeService } from '../../../core/services/theme.service';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { BnNumberPipe } from '../../pipes/bn-number.pipe';
import { TakaPipe } from '../../pipes/taka.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

@Component({
  selector: 'app-worker-card',
  standalone: true,
  imports: [CommonModule, RatingStarsComponent, BnNumberPipe, TakaPipe, TranslatePipe, CategoryIconComponent],
  templateUrl: './worker-card.component.html',
  styleUrls: ['./worker-card.component.scss']
})
export class WorkerCardComponent {
  private categoryService = inject(CategoryService);
  public theme = inject(ThemeService);
  public isEn = computed(() => this.theme.currentLang() === 'en');

  @Input({ required: true }) worker!: WorkerProfile;
  @Output() viewProfile = new EventEmitter<WorkerProfile>();
  @Output() directBook = new EventEmitter<WorkerProfile>();

  public getWorkerCategories(): Category[] {
    const ids = this.worker?.categoryIds || [];
    return this.categoryService.categories().filter(c => ids.includes(c.id));
  }
}
