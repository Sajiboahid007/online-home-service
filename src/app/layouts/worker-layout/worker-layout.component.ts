import { Component, computed, signal, inject, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WorkerService } from '../../core/services/worker.service';
import { JobService } from '../../core/services/job.service';
import { ThemeService } from '../../core/services/theme.service';
import { WorkerProfile } from '../../core/models/worker.model';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';
import { BnNumberPipe } from '../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../shared/pipes/taka.pipe';
import { LangToggleComponent } from '../../shared/components/lang-toggle/lang-toggle.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationCenterComponent, BnNumberPipe, TakaPipe, LangToggleComponent, TranslatePipe],
  templateUrl: './worker-layout.component.html',
  styleUrl: './worker-layout.component.scss'
})
export class WorkerLayoutComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  public workerService = inject(WorkerService);
  public jobService = inject(JobService);
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  public mobileMenuOpen = signal<boolean>(false);
  public showProfileDropdown = signal<boolean>(false);
  public workerAvatarError = signal<boolean>(false);

  public onWorkerAvatarError(): void {
    this.workerAvatarError.set(true);
  }

  // Fallback to first default worker if session hasn't explicitly selected one
  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    const found = this.workerService.getWorkerById(uid);
    if (found) return found;
    if (authWorker) return authWorker;
    const defaultFirst = this.workerService.workers()[0];
    return defaultFirst || null;
  });

  public currentUser = this.authService.currentUser;

  public workerInitials = computed(() => {
    const name = this.currentWorker()?.name || this.currentUser()?.name;
    if (!name) return '🔧';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  });

  // Active jobs for current worker (accepted, on_the_way, arrived, in_progress)
  public activeJob = computed(() => {
    const worker = this.currentWorker();
    if (!worker) return null;
    const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
    return this.jobService.jobs().find(j => j.workerId === worker.uid && activeStatuses.includes(j.status)) || null;
  });

  // Count open jobs on board across all of worker's chosen categories
  public openJobsCount = computed(() => {
    const worker = this.currentWorker();
    const catIds = worker?.categoryIds;
    if (!catIds || catIds.length === 0) {
      return this.jobService.getOpenBoardJobs().length;
    }
    return this.jobService.getOpenBoardJobs().filter(j => catIds.includes(j.categoryId)).length;
  });

  // Global Incoming Job Offer for Worker
  public incomingOffer = this.jobService.incomingJobOfferSignal;
  public remainingSeconds = signal<number>(45);
  private countdownTimer: any = null;
  private soundInterval: any = null;
  private lastOfferId: string | null = null;

  public shouldShowOffer = computed(() => {
    const offer = this.incomingOffer();
    if (!offer) return false;
    const worker = this.currentWorker();
    if (!worker) return true;

    if (offer.targetWorkerId) {
      return offer.targetWorkerId === worker.uid;
    }

    if (offer.job?.categoryId && worker.categoryIds?.length) {
      if (worker.categoryIds.includes(offer.job.categoryId)) return true;
    }

    return worker.isOnline !== false;
  });

  constructor() {}

  ngOnInit(): void {
    this.startCountdownWatcher();
  }

  ngOnDestroy(): void {
    this.stopOfferSound();
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  private startCountdownWatcher(): void {
    this.countdownTimer = setInterval(() => {
      const offer = this.incomingOffer();
      const shouldShow = this.shouldShowOffer();

      if (offer && shouldShow) {
        if (this.lastOfferId !== offer.job.id) {
          this.lastOfferId = offer.job.id;
          this.startOfferSound();
        }

        const diff = Math.max(0, Math.ceil((offer.expiresAt - Date.now()) / 1000));
        this.remainingSeconds.set(diff);

        if (diff <= 0) {
          this.rejectOffer();
        }
      } else {
        if (this.lastOfferId !== null) {
          this.lastOfferId = null;
          this.stopOfferSound();
        }
      }
    }, 500);
  }

  private startOfferSound(): void {
    this.stopOfferSound();
    this.playOfferChime();
    this.soundInterval = setInterval(() => {
      if (this.shouldShowOffer()) {
        this.playOfferChime();
      } else {
        this.stopOfferSound();
      }
    }, 4000);
  }

  private stopOfferSound(): void {
    if (this.soundInterval) {
      clearInterval(this.soundInterval);
      this.soundInterval = null;
    }
  }

  private playOfferChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(1046.50, 0, 0.12);
      playTone(1318.51, 0.12, 0.12);
      playTone(1567.98, 0.24, 0.15);
      playTone(2093.00, 0.38, 0.3);
    } catch (e) {}
  }

  public calculateProgressDash(): number {
    const total = 45;
    const rem = this.remainingSeconds();
    return Math.max(0, 283 - ((rem / total) * 283));
  }

  public acceptOffer(): void {
    const offer = this.incomingOffer();
    const worker = this.currentWorker();
    if (!offer || !worker) return;

    this.stopOfferSound();

    this.jobService.acceptJob(
      offer.job.id,
      worker.uid,
      worker.name,
      worker.phone,
      worker.photoURL
    );

    this.workerService.setBusyStatus(worker.uid, true);
    this.jobService.clearIncomingOffer();

    this.router.navigate(['/worker/active', offer.job.id]);
  }

  public rejectOffer(): void {
    this.stopOfferSound();
    this.jobService.clearIncomingOffer();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showProfileDropdown()) {
      const target = event.target as HTMLElement;
      const dropdownEl = this.elementRef.nativeElement.querySelector('.worker-profile-dropdown');
      if (dropdownEl && !dropdownEl.contains(target)) {
        this.showProfileDropdown.set(false);
      }
    }
  }

  public toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  public closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  public toggleProfileDropdown(): void {
    this.showProfileDropdown.update(v => !v);
  }

  public closeProfileDropdown(): void {
    this.showProfileDropdown.set(false);
  }

  public toggleOnline(): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const newOnline = !worker.isOnline;
    this.workerService.toggleOnlineStatus(worker.uid, newOnline);
  }

  public logout(): void {
    this.showProfileDropdown.set(false);
    this.authService.logout();
  }
}
