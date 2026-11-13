import { Component, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { JobService } from '../../../core/services/job.service';
import { DispatchService } from '../../../core/services/dispatch.service';
import { WorkerProfile } from '../../../core/models/worker.model';
import { Job } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BnNumberPipe, TakaPipe, TimeAgoPipe],
  templateUrl: './worker-dashboard.component.html',
  styleUrl: './worker-dashboard.component.scss'
})
export class WorkerDashboardComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  public workerService = inject(WorkerService);
  public jobService = inject(JobService);
  private dispatchService = inject(DispatchService);
  private router = inject(Router);

  // Current active worker computed reactively
  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    return this.workerService.getWorkerById(uid) || authWorker || this.workerService.workers()[0] || null;
  });

  // Incoming offer signal from JobService
  public incomingOffer = this.jobService.incomingJobOfferSignal;
  public remainingSeconds = signal<number>(30);
  private countdownTimer: any = null;

  // Open Work Requests matching worker's category that need to be grabbed
  public openWorkRequests = computed<Job[]>(() => {
    const worker = this.currentWorker();
    if (!worker) return [];
    const cats = worker.categoryIds || ['plumber'];
    return this.jobService.jobs().filter((j: Job) => 
      !j.workerId && 
      (j.status === 'searching' || j.status === 'pending') && 
      cats.includes(j.categoryId)
    );
  });

  // Active job in progress/accepted
  public activeJob = computed<Job | null>(() => {
    const worker = this.currentWorker();
    if (!worker) return null;
    const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
    return this.jobService.jobs().find((j: Job) => j.workerId === worker.uid && activeStatuses.includes(j.status)) || null;
  });

  // Recent completed jobs
  public recentJobs = computed<Job[]>(() => {
    const worker = this.currentWorker();
    if (!worker) return [];
    return this.jobService.jobs()
      .filter((j: Job) => j.workerId === worker.uid && (j.status === 'completed' || j.status === 'paid'))
      .sort((a: Job, b: Job) => new Date(b.timeline.createdAt).getTime() - new Date(a.timeline.createdAt).getTime())
      .slice(0, 5);
  });

  // KPI calculations
  public todayCompletedJobsCount = computed<number>(() => {
    const worker = this.currentWorker();
    if (!worker) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    return this.jobService.jobs().filter((j: Job) => 
      j.workerId === worker.uid && 
      (j.status === 'completed' || j.status === 'paid') &&
      (j.timeline.completedAt?.startsWith(todayStr) || j.timeline.createdAt.startsWith(todayStr))
    ).length || 2; // fallback realistic number for demo
  });

  public todayEarnings = computed<number>(() => {
    const worker = this.currentWorker();
    if (!worker) return 0;
    const completed = this.jobService.jobs().filter((j: Job) => 
      j.workerId === worker.uid && (j.status === 'completed' || j.status === 'paid')
    );
    const sum = completed.reduce((acc: number, j: Job) => acc + (j.workerEarning || (j.finalPrice ? j.finalPrice - (j.commission || 0) : 0)), 0);
    return sum > 0 ? sum : 750; // demo figure if no jobs today
  });

  constructor() {}

  ngOnInit(): void {
    this.startCountdownWatcher();
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  private startCountdownWatcher(): void {
    this.countdownTimer = setInterval(() => {
      const offer = this.incomingOffer();
      if (offer) {
        const diff = Math.max(0, Math.ceil((offer.expiresAt - Date.now()) / 1000));
        this.remainingSeconds.set(diff);
        if (diff <= 0) {
          // Auto expired
          this.rejectOffer();
        }
      }
    }, 500);
  }

  public toggleOnline(): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const newOnline = !worker.isOnline;
    this.workerService.toggleOnlineStatus(worker.uid, newOnline);

    const updated = this.workerService.getWorkerById(worker.uid);
    if (updated) {
      this.authService.updateWorkerProfile(updated);
    }
  }

  public acceptOffer(): void {
    const offer = this.incomingOffer();
    const worker = this.currentWorker();
    if (!offer || !worker) return;

    this.jobService.acceptJob(
      offer.job.id,
      worker.uid,
      worker.name,
      worker.phone,
      worker.photoURL
    );

    // Mark worker busy
    this.workerService.setBusyStatus(worker.uid, true);

    // Clear incoming offer
    this.jobService.incomingJobOfferSignal.set(null);

    // Route to active job workflow
    this.router.navigate(['/worker/active', offer.job.id]);
  }

  // Quick Grab for Open Work Requests (First-come first-served)
  public quickGrab(job: Job): void {
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

  public rejectOffer(): void {
    this.jobService.incomingJobOfferSignal.set(null);
  }

  // Developer/Tester action to simulate a live 30-sec instant job request
  public simulateIncomingOffer(): void {
    const worker = this.currentWorker();
    const catId = worker?.categoryIds?.[0] || 'plumber';

    const testJob: Job = {
      id: `job_instant_${Date.now()}`,
      customerId: 'user_customer_demo_instant',
      customerName: 'নাসরিন সুলতানা',
      customerPhone: '01823456789',
      customerRating: 4.9,
      categoryId: catId,
      categoryName: worker?.skills?.[0] || 'প্লাম্বার সার্ভিস',
      areaId: worker?.areaId || 'savar_bazar',
      type: 'instant',
      description: 'জরুরি মেরামত: কিচেনের পানির পাইপ ফেটে মেঝে ভেসে যাচ্ছে! দ্রুত চলে আসুন প্লিজ।',
      photos: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500'
      ],
      location: {
        lat: (worker?.homeLocation?.lat || 23.8223) + 0.003,
        lng: (worker?.homeLocation?.lng || 90.2673) + 0.002,
        address: 'রোড ৪, বাসা ১২/এ, সাভার থানা সংলগ্ন'
      },
      status: 'searching',
      estimatedPrice: 420,
      paymentMethod: 'cash',
      paymentStatus: 'unpaid',
      startOtp: `${Math.floor(1000 + Math.random() * 9000)}`,
      timeline: {
        createdAt: new Date().toISOString()
      }
    };

    // Save job into JobService
    this.jobService.createJob(testJob);

    // Set incoming offer with 30s expiry
    this.jobService.incomingJobOfferSignal.set({
      job: testJob,
      expiresAt: Date.now() + 30000
    });
    this.remainingSeconds.set(30);
  }

  public calculateProgressDash(): number {
    const totalDash = 283; // 2 * PI * 45
    const sec = this.remainingSeconds();
    return totalDash - (totalDash * sec / 30);
  }
}
