import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { ReportService } from '../../../core/services/report.service';
import { CategoryService } from '../../../core/services/category.service';
import { ThemeService } from '../../../core/services/theme.service';
import { JobChatComponent } from '../../../shared/components/job-chat/job-chat.component';
import { ChatService } from '../../../core/services/chat.service';
import { Job, JobStatus } from '../../../core/models/job.model';
import { WorkerProfile } from '../../../core/models/worker.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { MaskPhonePipe } from '../../../shared/pipes/mask-phone.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface TimelineStep {
  key: JobStatus;
  titleBn: string;
  descBn: string;
  icon: string;
}

@Component({
  selector: 'app-job-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BnNumberPipe, TakaPipe, MaskPhonePipe, TimeAgoPipe, TranslatePipe, JobChatComponent],
  templateUrl: './job-tracking.component.html',
  styleUrl: './job-tracking.component.scss'
})
export class JobTrackingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);
  private authService = inject(AuthService);
  private workerService = inject(WorkerService);
  private reportService = inject(ReportService);
  private categoryService = inject(CategoryService);
  public theme = inject(ThemeService);
  public isEn = computed(() => this.theme.currentLang() === 'en');

  public currentUser = this.authService.currentUser;
  public isAdmin = this.authService.isAdmin;
  public isWorker = this.authService.isWorker;
  public jobId = signal<string>('');
  public showCancelModal = signal<boolean>(false);
  public cancelReason = signal<string>('দেরি হচ্ছে');
  public isSimulating = signal<boolean>(false);
  public copySuccess = signal<boolean>(false);

  // New features: Chat, Share trip, Dispute Report
  public showChatModal = signal<boolean>(false);
  public showShareModal = signal<boolean>(false);
  public showReportModal = signal<boolean>(false);
  public shareCopied = signal<boolean>(false);

  public chatService = inject(ChatService);
  public unreadChatCount = computed(() => this.chatService.getUnreadCount(this.jobId()));

  // Dispute form state
  public reportType = signal<string>('overcharge');
  public reportSeverity = signal<'low' | 'medium' | 'high'>('medium');
  public reportDescription = signal<string>('');
  public reportSubmitted = signal<boolean>(false);

  // Current active job
  public currentJob = computed<Job | null>(() => {
    const id = this.jobId();
    if (id) {
      const match = this.jobService.jobs().find(j => j.id === id);
      if (match) return match;
    }
    // Fallback: Find latest job for current customer
    const user = this.authService.currentUser();
    const uid = user ? user.uid : 'user_customer_demo_1';
    const userJobs = this.jobService.jobs().filter(j => j.customerId === uid);
    return userJobs.length > 0 ? userJobs[0] : (this.jobService.jobs()[0] || null);
  });

  // Dynamic category info for the current job (never hardcode "plumber")
  public jobCategory = computed(() => {
    const catId = this.currentJob()?.categoryId;
    return catId ? this.categoryService.getCategoryById(catId) : undefined;
  });

  public categoryLabel = computed<string>(() => {
    const cat = this.jobCategory();
    const raw = this.currentJob()?.categoryName;
    if (this.isEn()) {
      return cat?.nameEn || (raw ? this.theme.t(raw) : 'Worker');
    }
    return cat?.nameBn || (raw ? this.theme.t(raw) : 'কারিগর');
  });

  public categoryIcon = computed<string>(() => {
    return this.jobCategory()?.icon || '🔧';
  });

  public matchingDemoWorkers = computed<WorkerProfile[]>(() => {
    const catId = this.currentJob()?.categoryId;
    const all = this.workerService.workers();
    if (!catId) return all.slice(0, 2);
    const matched = all.filter(w => w.categoryIds.includes(catId));
    return (matched.length > 0 ? matched : all).slice(0, 2);
  });

  // Dynamic Timeline configuration matching the job's category and current language
  public timelineSteps = computed<TimelineStep[]>(() => {
    const cat = this.categoryLabel();
    const icon = this.categoryIcon();
    if (this.isEn()) {
      return [
        { key: 'searching', titleBn: 'Job Request Posted', descBn: `Open request — waiting for ${cat}`, icon: '📢' },
        { key: 'accepted', titleBn: `${cat} Accepted`, descBn: `First ${cat} grabbed the job`, icon },
        { key: 'on_the_way', titleBn: 'On the Way', descBn: `${cat} is heading to your address`, icon: '🛵' },
        { key: 'arrived', titleBn: 'Arrived', descBn: `${cat} has arrived at your location`, icon: '📍' },
        { key: 'in_progress', titleBn: 'Work in Progress', descBn: 'OTP verified and work has started', icon: '⚡' },
        { key: 'completed', titleBn: 'Completed', descBn: 'Work finished and bill is ready', icon: '✅' }
      ];
    }
    return [
      { key: 'searching', titleBn: 'কাজের চাহিদা পোস্ট', descBn: `উন্মুক্ত রিকোয়েস্ট — ${cat} এর অপেক্ষায়`, icon: '📢' },
      { key: 'accepted', titleBn: `${cat} গ্রহণ করেছেন`, descBn: `প্রথম ${cat} কাজটি গ্রহণ (Grab) করেছেন`, icon },
      { key: 'on_the_way', titleBn: 'রওনা দিয়েছেন', descBn: `${cat} আপনার ঠিকানার পথে রয়েছেন`, icon: '🛵' },
      { key: 'arrived', titleBn: 'পৌঁছে গেছেন', descBn: `${cat} আপনার বাড়িতে উপস্থিত হয়েছেন`, icon: '📍' },
      { key: 'in_progress', titleBn: 'কাজ চলছে', descBn: 'ওটিপি যাচাই শেষে কাজ শুরু হয়েছে', icon: '⚡' },
      { key: 'completed', titleBn: 'সম্পন্ন', descBn: 'কাজ সফলভাবে শেষ হয়েছে ও বিল প্রস্তুত', icon: '✅' }
    ];
  });

  // Assigned worker profile
  public worker = computed<WorkerProfile | null>(() => {
    const job = this.currentJob();
    if (!job || !job.workerId) return null;
    return this.workerService.getWorkerById(job.workerId) || null;
  });

  // Only the customer who booked the job can view the OTP (never exposed to workers)
  public canViewJobOtp = computed<boolean>(() => {
    const job = this.currentJob();
    if (!job || this.isWorker()) return false;
    const user = this.currentUser();
    return !user || user.uid === job.customerId;
  });

  // Status index for timeline progression
  public currentStepIndex = computed<number>(() => {
    const job = this.currentJob();
    if (!job) return 0;
    const status = job.status;
    if (status === 'searching' || status === 'pending') return 0;
    if (status === 'accepted') return 1;
    if (status === 'on_the_way') return 2;
    if (status === 'arrived') return 3;
    if (status === 'in_progress') return 4;
    if (status === 'completed' || status === 'paid' || status === 'reviewed') return 5;
    return 0;
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.jobId.set(idParam);
    }
  }

  ngOnDestroy(): void {}

  public copyOtp(otp: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(otp);
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    }
  }

  // In-App Chat
  public openChat(): void {
    this.showChatModal.set(true);
    this.chatService.markAsRead(this.jobId());
  }

  public closeChat(): void {
    this.showChatModal.set(false);
  }

  // Live Trip Sharing
  public openShare(): void {
    this.shareCopied.set(false);
    this.showShareModal.set(true);
  }

  public closeShare(): void {
    this.showShareModal.set(false);
  }

  public getTrackingUrl(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kajkhoj.web.app';
    const job = this.currentJob();
    return `${origin}/customer/tracking/${job?.id || ''}`;
  }

  public copyShareUrl(): void {
    const url = this.getTrackingUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2500);
    }
  }

  public shareWhatsApp(): void {
    const job = this.currentJob();
    const url = this.getTrackingUrl();
    const text = encodeURIComponent(`কাজখোঁজ লাইভ সার্ভিস ট্র্যাকিং:\nআমার বাসায় ${job?.workerName || 'কর্মী'} আসছেন (${job?.categoryName})।\nলাইভ অবস্থান দেখতে লিংকে চাপুন: ${url}`);
    if (typeof window !== 'undefined') {
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  }

  // Dispute Report
  public openReport(): void {
    this.reportSubmitted.set(false);
    this.reportDescription.set('');
    this.showReportModal.set(true);
  }

  public closeReport(): void {
    this.showReportModal.set(false);
  }

  public submitReport(): void {
    const job = this.currentJob();
    const user = this.currentUser();
    if (!job) return;

    this.reportService.createReport({
      jobId: job.id,
      reporterId: user?.uid || 'user_customer_demo_1',
      reporterName: user?.name || 'তানভীর আহমেদ',
      againstId: job.workerId || 'worker_rahim_1',
      againstName: job.workerName || 'মোঃ রহিম উদ্দিন',
      type: this.reportType() as any,
      severity: this.reportSeverity(),
      description: this.reportDescription().trim() || 'কাজের ক্ষেত্রে সমস্যা তৈরি হয়েছে'
    });

    this.reportSubmitted.set(true);
    setTimeout(() => {
      this.showReportModal.set(false);
    }, 2000);
  }

  // Safety check state
  public showSafetyModal = signal<boolean>(false);

  public respondRenegotiation(accept: boolean): void {
    const job = this.currentJob();
    if (job) {
      this.jobService.respondToRenegotiation(job.id, accept);
    }
  }

  public respondMaterialCost(accept: boolean): void {
    const job = this.currentJob();
    if (job) {
      this.jobService.respondToMaterialCost(job.id, accept);
    }
  }

  public openSafetyModal(): void {
    this.showSafetyModal.set(true);
  }

  public dismissSafetyModal(): void {
    this.showSafetyModal.set(false);
  }

  public triggerSafetySos(): void {
    const job = this.currentJob();
    const user = this.currentUser();
    this.reportService.triggerSOS({
      uid: user?.uid || 'user_customer_demo_1',
      userName: user?.name || 'তানভীর আহমেদ',
      userPhone: user?.phone || '01712345678',
      jobId: job?.id,
      location: {
        lat: job?.location?.lat || 23.8223,
        lng: job?.location?.lng || 90.2673,
        address: job?.location?.address || 'সাভার, ঢাকা'
      }
    });
    this.showSafetyModal.set(false);
    alert('জরুরি SOS সতর্কতা পাঠানো হয়েছে!');
  }

  public openCancelModal(): void {
    this.showCancelModal.set(true);
  }

  public closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  public confirmCancel(): void {
    const job = this.currentJob();
    if (job) {
      if (job.workerId) {
        this.workerService.setBusyStatus(job.workerId, false);
      }
      this.jobService.cancelJob(job.id, 'customer', this.cancelReason());
      this.showCancelModal.set(false);
    }
  }

  public reopenJob(job: Job): void {
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
  }

  // Fast simulation for first-come first-served grab
  public simulateGrab(workerUid: string): void {
    const job = this.currentJob();
    if (!job) return;

    const res = this.jobService.simulateWorkerGrab(job.id, workerUid);
    if (!res.success) {
      alert(res.message);
    }
  }

  // Demo simulator helper to advance through stages
  public advanceSimulationStep(): void {
    const job = this.currentJob();
    if (!job) return;

    const currentStatus = job.status;
    let nextStatus: JobStatus = 'accepted';

    if (currentStatus === 'searching' || currentStatus === 'pending') {
      // Auto assign Rahim if none
      const rahim = this.workerService.workers()[0];
      this.jobService.acceptJob(job.id, rahim.uid, rahim.name, rahim.phone, rahim.photoURL);
      return;
    } else if (currentStatus === 'accepted') {
      nextStatus = 'on_the_way';
    } else if (currentStatus === 'on_the_way') {
      nextStatus = 'arrived';
    } else if (currentStatus === 'arrived') {
      nextStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      this.jobService.completeJob(job.id, job.estimatedPrice || 450, 0);
      return;
    }

    this.jobService.updateJobStatus(job.id, nextStatus);
  }

  public getStatusText(status?: JobStatus): string {
    const cat = this.categoryLabel();
    if (this.isEn()) {
      switch (status) {
        case 'searching': return `📢 Open Request — Waiting for ${cat}`;
        case 'pending': return 'Pending';
        case 'accepted': return `${cat} Accepted (Grabbed)`;
        case 'on_the_way': return `${cat} On the Way`;
        case 'arrived': return `${cat} Arrived`;
        case 'in_progress': return 'Work in Progress';
        case 'completed': return 'Work Completed';
        case 'cancelled_by_customer': return 'Cancelled by Customer';
        case 'cancelled_by_worker': return 'Cancelled by Worker';
        default: return 'Processing';
      }
    }
    switch (status) {
      case 'searching': return `📢 উন্মুক্ত রিকোয়েস্ট — ${cat} এর অপেক্ষায়`;
      case 'pending': return 'অপেক্ষমাণ';
      case 'accepted': return `${cat} গ্রহণ করেছেন (Grabbed)`;
      case 'on_the_way': return `${cat} রওনা দিয়েছেন`;
      case 'arrived': return `${cat} পৌঁছে গেছেন`;
      case 'in_progress': return 'কাজ চলছে';
      case 'completed': return 'কাজ সম্পন্ন';
      case 'cancelled_by_customer': return 'কাস্টমার কর্তৃক বাতিল';
      case 'cancelled_by_worker': return 'ওয়ার্কার কর্তৃক বাতিল';
      default: return 'প্রক্রিয়াধীন';
    }
  }
}
