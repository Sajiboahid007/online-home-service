import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkerService } from '../../../core/services/worker.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { JobService } from '../../../core/services/job.service';
import { WorkerProfile } from '../../../core/models/worker.model';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-worker-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, RatingStarsComponent, SkeletonLoaderComponent, BnNumberPipe, TakaPipe],
  templateUrl: './worker-profile-page.component.html',
  styleUrls: ['./worker-profile-page.component.scss']
})
export class WorkerProfilePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workerService = inject(WorkerService);
  private auth = inject(AuthService);
  private reviewService = inject(ReviewService);
  private jobService = inject(JobService);

  public worker = signal<WorkerProfile | null>(null);
  public isFav = signal<boolean>(false);
  public workerReviews = signal<any[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || 'worker_rahim_1';
    const found = this.workerService.getWorkerById(id);
    if (found) {
      this.worker.set(found);
      this.isFav.set(this.auth.isFavoriteWorker(found.uid));
      this.workerReviews.set(this.reviewService.getReviewsForUser(found.uid));
    }
  }

  public goBack(): void {
    this.router.navigate(['/customer/home']);
  }

  public toggleFavorite(): void {
    const w = this.worker();
    if (w) {
      this.auth.toggleFavoriteWorker(w.uid);
      this.isFav.set(this.auth.isFavoriteWorker(w.uid));
    }
  }

  public openDirectBooking(): void {
    const w = this.worker();
    if (!w) return;

    const user = this.auth.currentUser();
    const newJob = this.jobService.directBookWorker(w, {
      customerId: user?.uid || 'user_customer_demo_1',
      customerName: user?.name || 'তানভীর আহমেদ',
      customerPhone: user?.phone || '01712345678',
      description: `${w.name}-কে সরাসরি বুকিং প্রদান করা হয়েছে।`,
      estimatedPrice: w.rate
    });

    this.router.navigate(['/customer/tracking', newJob.id]);
  }
}
