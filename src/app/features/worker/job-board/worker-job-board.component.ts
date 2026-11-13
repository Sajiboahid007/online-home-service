import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { WorkerService } from '../../../core/services/worker.service';
import { AuthService } from '../../../core/services/auth.service';
import { GeoService } from '../../../core/services/geo.service';
import { Job } from '../../../core/models/job.model';
import { WorkerProfile } from '../../../core/models/worker.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

interface EnrichedBoardJob extends Job {
  distanceKm: number;
}

@Component({
  selector: 'app-worker-job-board',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BnNumberPipe, TakaPipe, TimeAgoPipe],
  templateUrl: './worker-job-board.component.html',
  styleUrl: './worker-job-board.component.scss'
})
export class WorkerJobBoardComponent {
  public filterType = signal<'all' | 'board_fixed' | 'board_bid' | 'instant'>('all');
  public sortBy = signal<'distance' | 'price' | 'newest'>('distance');
  public searchQuery = signal<string>('');
  public selectedJobForGrab = signal<EnrichedBoardJob | null>(null);

  // Bidding state (Item 33)
  public showBidModal = signal<boolean>(false);
  public bidJob = signal<EnrichedBoardJob | null>(null);
  public bidAmount = signal<number>(500);
  public bidMessage = signal<string>('আমি ২ ঘণ্টার মধ্যে কাজ শেষ করতে পারব।');

  public openBidModal(job: EnrichedBoardJob): void {
    this.bidJob.set(job);
    this.bidAmount.set(job.estimatedPrice || 500);
    this.showBidModal.set(true);
  }

  public submitBid(): void {
    const job = this.bidJob();
    const worker = this.currentWorker();
    if (!job || !worker) return;

    this.jobService.submitBid(job.id, {
      workerId: worker.uid,
      workerName: worker.name,
      workerPhoto: worker.photoURL,
      workerRating: worker.rating,
      amount: this.bidAmount(),
      message: this.bidMessage()
    });

    this.showBidModal.set(false);
    alert('আপনার কোটেশন / বিড সফলভাবে গ্রাহকের কাছে পাঠানো হয়েছে!');
  }

  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    return this.workerService.getWorkerById(uid) || authWorker || this.workerService.workers()[0] || null;
  });

  // Open Board jobs enriched with real computed distance
  public availableJobs = computed<EnrichedBoardJob[]>(() => {
    const worker = this.currentWorker();
    const workerLat = worker?.homeLocation?.lat || 23.8223;
    const workerLng = worker?.homeLocation?.lng || 90.2673;
    const workerCats = worker?.categoryIds || ['plumber'];

    // All searching or board jobs without worker assigned
    const rawJobs = this.jobService.jobs().filter(j => {
      const isBoardType = j.type === 'board_fixed' || j.type === 'board_bid' || j.type === 'instant';
      const isOpenStatus = j.status === 'searching' || j.status === 'pending';
      const noWorker = !j.workerId;
      const matchesCategory = workerCats.includes(j.categoryId);
      return isBoardType && isOpenStatus && noWorker && matchesCategory;
    });

    let enriched: EnrichedBoardJob[] = rawJobs.map(j => {
      const dist = this.geoService.getDistanceKm(
        workerLat,
        workerLng,
        j.location?.lat || workerLat,
        j.location?.lng || workerLng
      );
      return {
        ...j,
        distanceKm: Math.round(dist * 10) / 10
      };
    });

    // Filter by type
    const typeFilter = this.filterType();
    if (typeFilter !== 'all') {
      enriched = enriched.filter(j => j.type === typeFilter);
    }

    // Filter by search query
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      enriched = enriched.filter(j => 
        j.description.toLowerCase().includes(q) ||
        (j.location.address && j.location.address.toLowerCase().includes(q)) ||
        j.categoryName.toLowerCase().includes(q)
      );
    }

    // Sort
    const sort = this.sortBy();
    if (sort === 'distance') {
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sort === 'price') {
      enriched.sort((a, b) => (b.estimatedPrice || 0) - (a.estimatedPrice || 0));
    } else {
      enriched.sort((a, b) => new Date(b.timeline.createdAt).getTime() - new Date(a.timeline.createdAt).getTime());
    }

    return enriched;
  });

  constructor(
    public jobService: JobService,
    public workerService: WorkerService,
    public authService: AuthService,
    private geoService: GeoService,
    private router: Router
  ) {}

  public promptGrab(job: EnrichedBoardJob): void {
    this.selectedJobForGrab.set(job);
  }

  public cancelGrab(): void {
    this.selectedJobForGrab.set(null);
  }

  public confirmGrab(): void {
    const job = this.selectedJobForGrab();
    const worker = this.currentWorker();
    if (!job || !worker) return;

    const result = this.jobService.grabJob(job.id, {
      uid: worker.uid,
      name: worker.name,
      phone: worker.phone,
      photoURL: worker.photoURL
    });

    if (!result.success) {
      alert(result.message);
      this.selectedJobForGrab.set(null);
      return;
    }

    this.workerService.setBusyStatus(worker.uid, true);
    this.selectedJobForGrab.set(null);
    this.router.navigate(['/worker/active', job.id]);
  }

  public quickGrab(job: EnrichedBoardJob): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const result = this.jobService.grabJob(job.id, {
      uid: worker.uid,
      name: worker.name,
      phone: worker.phone,
      photoURL: worker.photoURL
    });

    if (!result.success) {
      alert(result.message);
      return;
    }

    this.workerService.setBusyStatus(worker.uid, true);
    this.router.navigate(['/worker/active', job.id]);
  }

  public seedDemoJob(): void {
    const worker = this.currentWorker();
    const sampleDescriptions = [
      'কিচেনের বেসিনের পাইপ লিক করছে এবং দ্রুত বদলানো প্রয়োজন।',
      'টয়লেটের কমোড ফ্লাশ ট্যাংক ঠিকভাবে কাজ করছে না, নতুন হ্যান্ডল লাগানো দরকার।',
      'পানির মোটর পাম্পে বিদ্যুৎ সংযোগ আছে কিন্তু পানি তুলছে না, পরীক্ষা করুন।'
    ];
    const randomIndex = Math.floor(Math.random() * sampleDescriptions.length);

    this.jobService.createJob({
      categoryId: worker?.categoryIds?.[0] || 'plumber',
      categoryName: worker?.skills?.[0] || 'প্লাম্বার সার্ভিস',
      areaId: worker?.areaId || 'savar_bazar',
      type: 'board_fixed',
      customerName: 'নাজমুল আলম',
      customerPhone: '01811223399',
      customerRating: 4.8,
      description: sampleDescriptions[randomIndex],
      photos: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500'
      ],
      location: {
        lat: (worker?.homeLocation?.lat || 23.8223) + (Math.random() * 0.01 - 0.005),
        lng: (worker?.homeLocation?.lng || 90.2673) + (Math.random() * 0.01 - 0.005),
        address: 'রোড ৭, ব্লক বি, ব্যাংক কলোনি, সাভার'
      },
      status: 'searching',
      estimatedPrice: 350 + Math.floor(Math.random() * 5) * 50
    });
  }
}
