import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../core/services/job.service';
import { WorkerService } from '../../../core/services/worker.service';
import { AuthService } from '../../../core/services/auth.service';
import { JobChatComponent } from '../../../shared/components/job-chat/job-chat.component';
import { Job, JobStatus } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-worker-active-job',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BnNumberPipe, TakaPipe, TimeAgoPipe, JobChatComponent],
  templateUrl: './worker-active-job.component.html',
  styleUrl: './worker-active-job.component.scss'
})
export class WorkerActiveJobComponent implements OnInit {
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
  ) {}

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
