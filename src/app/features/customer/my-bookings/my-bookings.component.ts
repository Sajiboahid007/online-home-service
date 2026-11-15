import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { JobService } from '../../../core/services/job.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { CategoryService } from '../../../core/services/category.service';
import { ThemeService } from '../../../core/services/theme.service';
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
export class MyBookingsComponent implements OnInit, OnDestroy {
  public theme = inject(ThemeService);
  private jobService = inject(JobService);
  private authService = inject(AuthService);
  private reviewService = inject(ReviewService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmation = inject(ConfirmationService);

  public activeTab = signal<FilterTab>('all');
  public currentUser = this.authService.currentUser;

  // Review Modal state
  public showReviewModal = signal<boolean>(false);
  public reviewingJob = signal<Job | null>(null);
  public reviewStars = signal<number>(5);
  public reviewComment = signal<string>('খুব সুন্দরভাবে কাজটি সম্পন্ন করেছেন, ব্যবহারে আমি সন্তুষ্ট।');
  public reviewTags = signal<string[]>(['সময়মতো এসেছে', 'কাজ নিখুঁত']);
  
  public availableTags = computed(() => {
    return this.theme.currentLang() === 'bn'
      ? ['সময়মতো এসেছে', 'ভদ্র আচরণ', 'কাজ নিখুঁত', 'ন্যায্য মূল্য', 'দক্ষ কারিগর', 'পরিষ্কার-পরিচ্ছন্ন']
      : ['Arrived on time', 'Polite behavior', 'The work is perfect', 'Fair price', 'Skilled craftsman', 'Clean and tidy'];
  });

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
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'বুকিং মুছুন' : 'Delete Booking',
      message: isBn
        ? 'আপনি কি এই বুকিংটি মুছে ফেলতে চান?'
        : 'Are you sure you want to delete this booking?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'মুছুন' : 'Delete',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.jobService.deleteJob(job.id);
      }
    });
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
    const isBn = this.theme.currentLang() === 'bn';
    switch (status) {
      case 'searching': return isBn ? '🔍 কর্মী খোঁজা হচ্ছে' : '🔍 Searching for worker';
      case 'pending': return isBn ? 'অপেক্ষমাণ' : 'Pending';
      case 'accepted': return isBn ? 'অর্ডার গৃহীত' : 'Order accepted';
      case 'on_the_way': return isBn ? 'কর্মী পথে রয়েছেন' : 'Worker on the way';
      case 'arrived': return isBn ? 'উপস্থিত হয়েছেন' : 'Arrived at location';
      case 'in_progress': return isBn ? 'কাজ চলছে' : 'Work in progress';
      case 'completed': return isBn ? 'কাজ সম্পন্ন' : 'Work completed';
      case 'paid': return isBn ? 'পরিশোধিত' : 'Paid';
      case 'reviewed': return isBn ? 'রিভিউ সম্পন্ন' : 'Reviewed';
      case 'cancelled_by_customer': return isBn ? 'বাতিল (কাস্টমার)' : 'Cancelled (Customer)';
      case 'cancelled_by_worker': return isBn ? 'বাতিল (কর্মী)' : 'Cancelled (Worker)';
      default: return isBn ? 'প্রক্রিয়াধীন' : 'Processing';
    }
  }

  public openReview(job: Job): void {
    this.reviewingJob.set(job);
    this.reviewStars.set(5);
    const isBn = this.theme.currentLang() === 'bn';
    this.reviewComment.set(isBn 
      ? 'খুব সুন্দরভাবে কাজটি সম্পন্ন করেছেন, ব্যবহারে আমি সন্তুষ্ট।' 
      : 'The work was completed wonderfully, and I am satisfied with the service.');
    this.reviewTags.set(isBn ? ['সময়মতো এসেছে', 'কাজ নিখুঁত'] : ['Arrived on time', 'The work is perfect']);
    this.showReviewModal.set(true);
    document.body.classList.add('modal-open');
  }

  public closeReview(): void {
    this.showReviewModal.set(false);
    this.reviewingJob.set(null);
    document.body.classList.remove('modal-open');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
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
