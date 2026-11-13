import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-worker-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingStarsComponent, BnNumberPipe, TimeAgoPipe],
  templateUrl: './worker-reviews.component.html',
  styleUrls: ['./worker-reviews.component.scss']
})
export class WorkerReviewsComponent implements OnInit {
  private auth = inject(AuthService);
  private reviewService = inject(ReviewService);

  public worker = this.auth.currentWorker;
  public activeTab = signal<'received' | 'rate_customer'>('received');

  public receivedReviews = signal<any[]>([]);

  // Two-way rating form state
  public selectedCustomerJobId = signal<string>('job_demo_101');
  public customerRating = signal<number>(5);
  public customerReviewComment = signal<string>('সময়মত বিল পরিশোধ করেছেন এবং ভদ্র ব্যবহার করেছেন।');
  public selectedCustomerTags = signal<string[]>(['সময়মত পেমেন্ট', 'ভদ্র আচরণ']);
  public reviewSuccessMsg = signal<string | null>(null);

  public readonly presetCustomerTags = [
    'সময়মত পেমেন্ট',
    'ভদ্র আচরণ',
    'সঠিক নির্দেশনা',
    'সহযোগিতাপূর্ণ মনোভাব',
    'চা-নাস্তা আপ্যায়ন'
  ];

  ngOnInit(): void {
    const w = this.worker();
    const uid = w ? w.uid : 'worker_rahim_1';
    this.receivedReviews.set(this.reviewService.getReviewsForUser(uid));
  }

  public toggleCustomerTag(tag: string): void {
    this.selectedCustomerTags.update(tags => {
      if (tags.includes(tag)) {
        return tags.filter(t => t !== tag);
      } else {
        return [...tags, tag];
      }
    });
  }

  public submitCustomerReview(): void {
    const w = this.worker();
    this.reviewService.addReview({
      id: `rev_cust_${Date.now()}`,
      jobId: this.selectedCustomerJobId(),
      fromUid: w?.uid || 'worker_rahim_1',
      fromName: w?.name || 'মো: রহিম উদ্দিন',
      toUid: 'user_customer_demo_1',
      toRole: 'customer',
      stars: this.customerRating(),
      comment: this.customerReviewComment(),
      tags: this.selectedCustomerTags(),
      isHidden: false,
      createdAt: new Date().toISOString()
    });

    this.reviewSuccessMsg.set('গ্রাহকের রিভিউ সফলভাবে জমা হয়েছে! ধন্যবাদ।');
    setTimeout(() => this.reviewSuccessMsg.set(null), 3000);
  }
}
