import { Component, computed, signal, OnInit, OnDestroy, ElementRef, effect, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { WorkerService } from '../../../core/services/worker.service';
import { AuthService } from '../../../core/services/auth.service';
import { JobChatComponent } from '../../../shared/components/job-chat/job-chat.component';
import { Job, JobStatus } from '../../../core/models/job.model';
import { WorkerProfile } from '../../../core/models/worker.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { MapService } from '../../../core/services/map.service';
import { canSeeExactLocation, googleMapsDirectionsUrl } from '../../../core/utils/navigation';
import { Map as MapLibreMap, Marker } from 'maplibre-gl';

@Component({
  selector: 'app-worker-active-job',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BnNumberPipe, TakaPipe, TimeAgoPipe, TranslatePipe, JobChatComponent],
  templateUrl: './worker-active-job.component.html',
  styleUrl: './worker-active-job.component.scss'
})
export class WorkerActiveJobComponent implements OnInit, OnDestroy {
  public jobId = signal<string>('');
  public showChatModal = signal<boolean>(false);
  
  // OTP state
  public otpDigit1 = signal<string>('');
  public otpDigit2 = signal<string>('');
  public otpDigit3 = signal<string>('');
  public otpDigit4 = signal<string>('');
  public otpError = signal<string | null>(null);
  public otpSuccess = signal<string | null>(null);

  // Completion Form state
  public laborCost = signal<number>(400);
  public materialCost = signal<number>(0);
  public afterWorkPhoto = signal<string>('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600');
  public isCompletedCelebration = signal<boolean>(false);
  public showCancelModal = signal<boolean>(false);
  public cancelReason = signal<string>('');

  // Sample photos to pick for after-work completion
  public sampleAfterPhotos = [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600'
  ];

  // Current Job
  public job = computed<Job | null>(() => {
    const id = this.jobId();
    if (!id) return null;
    return this.jobService.jobs().find(j => j.id === id) || null;
  });

  // Current active worker computed reactively
  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    return this.workerService.getWorkerById(uid) || authWorker || this.workerService.workers()[0] || null;
  });

  // Exact doorstep pin: only shown while the technician is actively serving the job
  public showDoorstep = computed<boolean>(() => {
    const j = this.job();
    return !!j && !!j.location && canSeeExactLocation(j.status);
  });

  public directionsUrl = computed<string>(() => {
    const j = this.job();
    return j?.location ? googleMapsDirectionsUrl(j.location) : '';
  });

  public showDoorPhotoViewer = signal<boolean>(false);

  // In-App Navigation State (Navigates directly on THIS map, not Google Maps)
  public isNavigating = signal<boolean>(false);
  public isMapExpanded = signal<boolean>(false);
  public navDistance = signal<string>('১.২ কিমি');
  public navDuration = signal<string>('৭ মিনিট');
  public navStepIndex = signal<number>(0);
  public navInstructions = signal<string[]>([
    'সাভার বাজার মেইন রোড ধরে উত্তর দিকে ২৫০ মিটার এগিয়ে যান।',
    'থানা মোড়ে ডানদিকে ঘুরে সাভার থানা রোডে প্রবেশ করুন।',
    'সোজা ৫০০ মিটার গিয়ে বামদিকের লেনে প্রবেশ করুন।',
    'গন্তব্য ডানপাশে: কাস্টমারের দরজার সঠিক পিন।'
  ]);

  private mapService = inject(MapService);
  private doorstepMapEl = viewChild<ElementRef<HTMLElement>>('doorstepMap');
  private doorstepMap: MapLibreMap | null = null;
  private doorstepMarker: Marker | null = null;
  private workerNavMarker: Marker | null = null;

  // Progressive Step number (1: accepted, 2: on_the_way, 3: arrived, 4: in_progress, 5: completed)
  public currentStep = computed<number>(() => {
    const j = this.job();
    if (!j) return 1;
    switch (j.status) {
      case 'accepted': return 1;
      case 'on_the_way': return 2;
      case 'arrived': return 3;
      case 'in_progress': return 4;
      case 'completed':
      case 'paid':
        return 5;
      default: return 1;
    }
  });

  // Commission & Net Earning calculations
  public commissionAmount = computed<number>(() => {
    return Math.round(this.laborCost() * 0.15);
  });

  public totalCustomerBill = computed<number>(() => {
    return this.laborCost() + this.materialCost();
  });

  public netWorkerEarning = computed<number>(() => {
    return this.totalCustomerBill() - this.commissionAmount();
  });

  constructor(
    private route: ActivatedRoute,
    public jobService: JobService,
    public workerService: WorkerService,
    public authService: AuthService,
    private router: Router
  ) {
    // Create/refresh the doorstep map when its container appears or the job location changes
    effect(() => {
      const el = this.doorstepMapEl()?.nativeElement;
      const j = this.job();
      if (!el || !j?.location || !this.showDoorstep()) {
        this.destroyDoorstepMap();
        return;
      }
      const lngLat: [number, number] = [j.location.lng, j.location.lat];
      if (!this.doorstepMap || this.doorstepMap.getContainer() !== el) {
        this.destroyDoorstepMap();
        this.doorstepMap = this.mapService.createMap(el, j.location, 17);
        this.doorstepMarker = new Marker({ color: '#dc2626' }).setLngLat(lngLat).addTo(this.doorstepMap);
      } else if (this.doorstepMarker) {
        const cur = this.doorstepMarker.getLngLat();
        if (cur.lng === lngLat[0] && cur.lat === lngLat[1]) return;
        this.doorstepMarker.setLngLat(lngLat);
        this.doorstepMap.setCenter(lngLat);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyDoorstepMap();
  }

  private destroyDoorstepMap(): void {
    this.workerNavMarker?.remove();
    this.workerNavMarker = null;
    this.doorstepMarker?.remove();
    this.doorstepMarker = null;
    this.doorstepMap?.remove();
    this.doorstepMap = null;
  }

  // --- In-App Navigation (Navigates directly on THIS map) ---
  public async startInAppNavigation(): Promise<void> {
    const j = this.job();
    if (!j?.location || !this.doorstepMap) return;

    this.isNavigating.set(true);

    const worker = this.currentWorker();
    const destLoc = j.location;
    // Determine worker origin coordinates
    const workerLoc = worker?.homeLocation ? {
      lat: worker.homeLocation.lat,
      lng: worker.homeLocation.lng
    } : {
      lat: destLoc.lat - 0.006,
      lng: destLoc.lng - 0.005
    };

    // Add or update worker vehicle marker on THIS map
    if (!this.workerNavMarker) {
      const el = document.createElement('div');
      el.className = 'worker-vehicle-marker';
      el.innerHTML = `
        <div class="vehicle-pulse-ring"></div>
        <div class="vehicle-pin-box">🛵</div>
      `;
      this.workerNavMarker = new Marker({ element: el })
        .setLngLat([workerLoc.lng, workerLoc.lat])
        .addTo(this.doorstepMap);
    } else {
      this.workerNavMarker.setLngLat([workerLoc.lng, workerLoc.lat]);
    }

    // Draw route line on THIS map
    try {
      const routeInfo = await this.mapService.drawRouteLine(
        this.doorstepMap,
        workerLoc,
        destLoc,
        'doorstep-live-nav-route'
      );
      if (routeInfo) {
        this.navDistance.set(`${routeInfo.distanceKm} কিমি`);
        this.navDuration.set(`${routeInfo.durationMin} মিনিট`);
      }
    } catch (err) {
      console.warn('In-app routing error:', err);
    }

    // Set practical turn guidance with real address
    this.navInstructions.set([
      `সাভার বাজার রোড ধরে গন্তব্যের দিকে রওনা দিন (দূরত্ব ${this.navDistance()})`,
      'সাভার থানা মোড়ে সাবধানে ডানদিকে টার্ন নিন',
      `গন্তব্যে পৌঁছান: ${destLoc.address || 'কাস্টমারের বাসা'}${j.landmark ? ' (' + j.landmark + ')' : ''}`
    ]);
    this.navStepIndex.set(0);

    // Smoothly fit bounds to show both worker and customer on this map
    const minLng = Math.min(workerLoc.lng, destLoc.lng);
    const maxLng = Math.max(workerLoc.lng, destLoc.lng);
    const minLat = Math.min(workerLoc.lat, destLoc.lat);
    const maxLat = Math.max(workerLoc.lat, destLoc.lat);
    this.doorstepMap.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 60, maxZoom: 17, duration: 1500 }
    );
  }

  public zoomToDoorstep(): void {
    const j = this.job();
    if (this.doorstepMap && j?.location) {
      this.doorstepMap.flyTo({
        center: [j.location.lng, j.location.lat],
        zoom: 18,
        duration: 1000
      });
    }
  }

  public zoomToRoute(): void {
    const j = this.job();
    const worker = this.currentWorker();
    if (!this.doorstepMap || !j?.location) return;

    const destLoc = j.location;
    const workerLoc = worker?.homeLocation || {
      lat: destLoc.lat - 0.006,
      lng: destLoc.lng - 0.005
    };
    const minLng = Math.min(workerLoc.lng, destLoc.lng);
    const maxLng = Math.max(workerLoc.lng, destLoc.lng);
    const minLat = Math.min(workerLoc.lat, destLoc.lat);
    const maxLat = Math.max(workerLoc.lat, destLoc.lat);
    this.doorstepMap.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 60, maxZoom: 17, duration: 1200 }
    );
  }

  public toggleMapExpanded(): void {
    this.isMapExpanded.update(v => !v);
    setTimeout(() => {
      this.doorstepMap?.resize();
    }, 250);
  }

  public nextNavStep(): void {
    const next = (this.navStepIndex() + 1) % this.navInstructions().length;
    this.navStepIndex.set(next);
  }

  public stopInAppNavigation(): void {
    this.isNavigating.set(false);
    const j = this.job();
    if (this.doorstepMap && j?.location) {
      this.doorstepMap.flyTo({
        center: [j.location.lng, j.location.lat],
        zoom: 17,
        duration: 1000
      });
    }
  }

  public openDoorPhoto(): void {
    this.showDoorPhotoViewer.set(true);
  }

  public closeDoorPhoto(): void {
    this.showDoorPhotoViewer.set(false);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.jobId.set(id);
        const j = this.jobService.getJobById(id);
        if (j) {
          this.laborCost.set(j.estimatedPrice || 400);
          if (j.status === 'completed' || j.status === 'paid') {
            this.isCompletedCelebration.set(true);
          }
        }
      } else {
        // Fallback: load first active job if exists
        const firstActive = this.jobService.jobs().find(j => 
          ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(j.status)
        );
        if (firstActive) {
          this.jobId.set(firstActive.id);
          this.laborCost.set(firstActive.estimatedPrice || 400);
        }
      }
    });
  }

  public openChat(): void {
    this.showChatModal.set(true);
  }

  public closeChat(): void {
    this.showChatModal.set(false);
  }

  // STEP 1: রওনা দিয়েছি
  public startTrip(): void {
    const j = this.job();
    if (!j) return;
    this.jobService.updateJobStatus(j.id, 'on_the_way');
  }

  // STEP 2: কাস্টমারের ঠিকানায় পৌঁছেছি
  public markArrived(): void {
    const j = this.job();
    if (!j) return;
    this.jobService.updateJobStatus(j.id, 'arrived');
  }

  // STEP 3: OTP ইনপুট ও যাচাই
  public onOtpInput(index: number, event: any): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (val && val.length > 1) {
      input.value = val.slice(0, 1);
    }
    
    // Auto advance to next input
    if (val && index < 4) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  public fillDemoOtp(): void {
    const j = this.job();
    if (!j) return;
    const otp = j.startOtp;
    if (otp && otp.length === 4) {
      this.otpDigit1.set(otp[0]);
      this.otpDigit2.set(otp[1]);
      this.otpDigit3.set(otp[2]);
      this.otpDigit4.set(otp[3]);
    }
  }

  public verifyOtpAndStart(): void {
    const j = this.job();
    if (!j) return;

    this.otpError.set(null);
    this.otpSuccess.set(null);

    const enteredOtp = `${this.otpDigit1()}${this.otpDigit2()}${this.otpDigit3()}${this.otpDigit4()}`;
    if (enteredOtp.length < 4) {
      this.otpError.set('অনুগ্রহ করে ৪ সংখ্যার সম্পূর্ণ OTP কোড লিখুন।');
      return;
    }

    const result = this.jobService.verifyAndStartJob(j.id, enteredOtp);
    if (result.success) {
      this.otpSuccess.set(result.message);
    } else {
      this.otpError.set(result.message);
    }
  }

  // STEP 4: কাজ সম্পন্ন ও বিলিং
  public completeActiveJob(): void {
    const j = this.job();
    if (!j) return;

    const finalLabor = this.laborCost();
    const finalMaterial = this.materialCost();
    const photo = this.afterWorkPhoto();

    this.jobService.completeJob(j.id, finalLabor, finalMaterial, photo);

    // Update worker stats (increase commission due if cash payment, mark not busy)
    const workerUid = j.workerId || this.authService.currentWorker()?.uid || 'worker_rahim_1';
    const worker = this.workerService.getWorkerById(workerUid);
    if (worker) {
      const comm = this.commissionAmount();
      const newCommissionDue = j.paymentMethod === 'cash' ? worker.commissionDue + comm : worker.commissionDue;
      const newWallet = j.paymentMethod !== 'cash' ? worker.walletBalance + this.netWorkerEarning() : worker.walletBalance;

      this.workerService.updateWorker({
        ...worker,
        isBusy: false,
        totalJobs: worker.totalJobs + 1,
        commissionDue: newCommissionDue,
        walletBalance: newWallet
      });

      this.authService.updateWorkerProfile({
        ...worker,
        isBusy: false,
        totalJobs: worker.totalJobs + 1,
        commissionDue: newCommissionDue,
        walletBalance: newWallet
      });
    }

    this.isCompletedCelebration.set(true);
  }

  public openCancelDialog(): void {
    this.showCancelModal.set(true);
  }

  public closeCancelDialog(): void {
    this.showCancelModal.set(false);
  }

  public confirmCancelJob(): void {
    const j = this.job();
    if (!j) return;

    this.jobService.cancelJob(j.id, 'worker', this.cancelReason() || 'ওয়ার্কার কর্তৃক কাজ বাতিল করা হয়েছে');
    
    // Free worker busy status
    const workerUid = j.workerId || 'worker_rahim_1';
    this.workerService.setBusyStatus(workerUid, false);

    this.showCancelModal.set(false);
    this.router.navigate(['/worker/dashboard']);
  }

  public triggerSosAlert(): void {
    alert('🚨 জরুরি এসওএস সিগন্যাল কাজখোঁজ কন্ট্রোল রুম ও পুলিশ কন্ট্রোল রুমে পাঠানো হয়েছে! আপনার বর্তমান জিপিএস লোকেশন শেয়ার করা হচ্ছে।');
  }

  public selectAfterPhoto(url: string): void {
    this.afterWorkPhoto.set(url);
  }
}
