import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { CategoryService } from '../../../core/services/category.service';
import { Job, JobStatus } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { MaskPhonePipe } from '../../../shared/pipes/mask-phone.pipe';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BnNumberPipe, TakaPipe, TimeAgoPipe, MaskPhonePipe],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss'
})
export class MyBookingsComponent implements OnInit {
  private jobService = inject(JobService);
  private authService = inject(AuthService);
  private reviewService = inject(ReviewService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public activeTab = signal<FilterTab>('all');
  public currentUser = this.authService.currentUser;

  // Review Modal state
  public showReviewModal = signal<boolean>(false);
  public reviewingJob = signal<Job | null>(null);
  public reviewStars = signal<number>(5);
  public reviewComment = signal<string>('খুব ভালো সার্ভিস পেয়েছি। সময়মতো এসেছেন এবং কাজ নিখুঁত হয়েছে।');
  public reviewTags = signal<string[]>(['সময়মতো এসেছে', 'কাজ নিখুঁত']);
  public availableTags = ['সময়মতো এসেছে', 'ভদ্র আচরণ', 'কাজ নিখুঁত', 'ন্যায্য মূল্য', 'দক্ষ কারিগর', 'পরিষ্কার-পরিচ্ছন্ন'];
  public isSubmittingReview = signal<boolean>(false);

  // Customer's job list (inclusive for active customer, demo customer, and test jobs)
  public customerJobs = computed(() => {
    const user = this.currentUser();
    const uid = user ? user.uid : 'user_customer_demo_1';
    return this.jobService.jobs().filter(j => 
      j.customerId === uid || 
      j.customerId === 'user_customer_demo_1' ||
      j.id === 'job_demo_103' ||
      j.id === 'job_demo_102'
    );
  });

  ngOnInit(): void {
    const tabParam = this.route.snapshot.queryParamMap.get('tab') as FilterTab;
    if (tabParam && ['all', 'active', 'completed', 'cancelled'].includes(tabParam)) {
      this.activeTab.set(tabParam);
    }
  }

  public reactivateJob(job: Job): void {
    const newPrice = (job.estimatedPrice || 400) + 50;
    this.jobService.updateJobStatus(job.id, 'searching', {
      cancelReason: undefined,
      cancelledBy: undefined,
      estimatedPrice: newPrice,
      workerId: undefined,
      workerName: undefined,
      workerPhone: undefined,
      workerPhoto: undefined
    });
    this.jobService.updateJobBudget(job.id, newPrice);
    this.router.navigate(['/customer/tracking', job.id]);
  }

  public deleteJob(job: Job, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (confirm(`আপনি কি নিশ্চিত যে "${job.categoryName}" এর এই রিকোয়েস্টটি (#${job.id}) স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      this.jobService.deleteJob(job.id);
    }
  }

  // Filtered jobs
  public filteredJobs = computed(() => {
    const jobs = this.customerJobs();
    const tab = this.activeTab();

    if (tab === 'active') {
      return jobs.filter(j => ['pending', 'searching', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(j.status));
    }
    if (tab === 'completed') {
      return jobs.filter(j => ['completed', 'paid', 'reviewed'].includes(j.status));
    }
    if (tab === 'cancelled') {
      return jobs.filter(j => j.status.includes('cancelled') || j.status === 'disputed');
    }
    return jobs;
  });

  public getCategoryIcon(catId: string): string {
    const cat = this.categoryService.getCategoryById(catId);
    return cat ? cat.icon : '🔨';
  }

  public getStatusBadgeClass(status: JobStatus): string {
    switch (status) {
      case 'completed':
      case 'paid':
      case 'reviewed':
        return 'badge-success';
      case 'accepted':
      case 'on_the_way':
      case 'arrived':
      case 'in_progress':
        return 'badge-info';
      case 'searching':
      case 'pending':
        return 'badge-warning';
      case 'cancelled_by_customer':
      case 'cancelled_by_worker':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  }

  public getStatusText(status: JobStatus): string {
    switch (status) {
      case 'searching': return '🔍 কর্মী খোঁজা হচ্ছে';
      case 'pending': return 'অপেক্ষমাণ';
      case 'accepted': return 'অর্ডার গৃহীত';
      case 'on_the_way': return 'কর্মী পথে রয়েছেন';
      case 'arrived': return 'উপস্থিত হয়েছেন';
      case 'in_progress': return 'কাজ চলছে';
      case 'completed': return 'কাজ সম্পন্ন';
      case 'paid': return 'পরিশোধিত';
      case 'reviewed': return 'রিভিউ সম্পন্ন';
      case 'cancelled_by_customer': return 'বাতিল (কাস্টমার)';
      case 'cancelled_by_worker': return 'বাতিল (কর্মী)';
      default: return 'প্রক্রিয়াধীন';
    }
  }

  public openReview(job: Job): void {
    this.reviewingJob.set(job);
    this.reviewStars.set(5);
    this.reviewComment.set('খুব সুন্দরভাবে কাজটি সম্পন্ন করেছেন, ব্যবহারে আমি সন্তুষ্ট।');
    this.reviewTags.set(['সময়মতো এসেছে', 'কাজ নিখুঁত']);
    this.showReviewModal.set(true);
  }

  public closeReview(): void {
    this.showReviewModal.set(false);
    this.reviewingJob.set(null);
  }

  public toggleTag(tag: string): void {
    const current = this.reviewTags();
    if (current.includes(tag)) {
      this.reviewTags.set(current.filter(t => t !== tag));
    } else {
      this.reviewTags.set([...current, tag]);
    }
  }

  public submitReview(): void {
    const job = this.reviewingJob();
    if (!job || !job.workerId) return;

    this.isSubmittingReview.set(true);

    const user = this.currentUser();
    this.reviewService.addReview({
      id: `rev_${Date.now()}`,
      jobId: job.id,
      fromUid: user?.uid || 'user_customer_demo_1',
      fromName: user?.name || 'তানভীর আহমেদ',
      fromPhoto: user?.photoURL,
      toUid: job.workerId,
      toRole: 'worker',
      stars: this.reviewStars(),
      comment: this.reviewComment(),
      tags: this.reviewTags(),
      isHidden: false,
      createdAt: new Date().toISOString()
    });

    this.jobService.updateJobStatus(job.id, 'reviewed');

    this.isSubmittingReview.set(false);
    this.closeReview();
  }

  public isJobActive(job: Job): boolean {
    if (!job) return false;
    return ['pending', 'searching', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(job.status);
  }

  public viewTracking(job: Job): void {
    if (!this.isJobActive(job)) {
      return;
    }
    this.router.navigate(['/customer/tracking', job.id]);
  }
}
