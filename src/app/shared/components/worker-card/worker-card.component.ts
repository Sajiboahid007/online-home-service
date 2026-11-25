import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerProfile } from '../../../core/models/worker.model';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { BnNumberPipe } from '../../pipes/bn-number.pipe';
import { TakaPipe } from '../../pipes/taka.pipe';

@Component({
  selector: 'app-worker-card',
  standalone: true,
  imports: [CommonModule, RatingStarsComponent, BnNumberPipe, TakaPipe],
  templateUrl: './worker-card.component.html',
  styleUrls: ['./worker-card.component.scss']
})
export class WorkerCardComponent {
  private categoryService = inject(CategoryService);

  @Input({ required: true }) worker!: WorkerProfile;
  @Output() viewProfile = new EventEmitter<WorkerProfile>();
  @Output() directBook = new EventEmitter<WorkerProfile>();

  public getWorkerCategories(): Category[] {
    const ids = this.worker?.categoryIds || [];
    return this.categoryService.categories().filter(c => ids.includes(c.id));
  }
}
