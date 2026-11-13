import { Injectable, signal } from '@angular/core';
import { Review } from '../models/review.model';
import { WorkerService } from './worker.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private reviewsSignal = signal<Review[]>([
    {
      id: 'rev_1',
      jobId: 'job_demo_101',
      fromUid: 'user_customer_demo_1',
      fromName: 'তানভীর আহমেদ',
      toUid: 'worker_rahim_1',
      toRole: 'worker',
      stars: 5,
      comment: 'খুব দ্রুত এসেছেন এবং নিখুঁতভাবে বাথরুমের পাইপ ঠিক করেছেন। ব্যবহারে সন্তুষ্ট!',
      tags: ['সময়মতো এসেছে', 'ভদ্র আচরণ', 'কাজ নিখুঁত'],
      isHidden: false,
      createdAt: '2026-11-10T12:10:00Z'
    }
  ]);

  public reviews = this.reviewsSignal.asReadonly();

  constructor(private workerService: WorkerService) {}

  public getReviewsForUser(uid: string): Review[] {
    return this.reviewsSignal().filter(r => r.toUid === uid && !r.isHidden);
  }

  public addReview(review: Review): void {
    this.reviewsSignal.update(list => [review, ...list]);

    // Recalculate worker rating
    if (review.toRole === 'worker') {
      const workerReviews = this.reviewsSignal().filter(r => r.toUid === review.toUid && !r.isHidden);
      const totalStars = workerReviews.reduce((sum, r) => sum + r.stars, 0);
      const avg = totalStars / workerReviews.length;

      const worker = this.workerService.getWorkerById(review.toUid);
      if (worker) {
        this.workerService.updateWorker({
          ...worker,
          rating: Math.round(avg * 10) / 10,
          ratingCount: workerReviews.length
        });
      }
    }
  }

  public toggleHideReview(reviewId: string): void {
    this.reviewsSignal.update(list => list.map(r => r.id === reviewId ? { ...r, isHidden: !r.isHidden } : r));
  }
}
