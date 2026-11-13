import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { WorkerService } from '../../../core/services/worker.service';
import { LocationService } from '../../../core/services/location.service';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-searching-worker',
  standalone: true,
  imports: [CommonModule, BnNumberPipe],
  templateUrl: './searching-worker.component.html',
  styleUrls: ['./searching-worker.component.scss']
})
export class SearchingWorkerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);
  private workerService = inject(WorkerService);
  private locationService = inject(LocationService);

  public jobId = signal<string>('');
  public countdown = signal<number>(30);
  public currentRadius = signal<number>(3);
  public isTimedOut = signal<boolean>(false);
  public progressPct = signal<number>(0);
  public nearbyCandidateCount = signal<number>(3);

  private timerInterval: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || 'job_demo_102';
    this.jobId.set(id);

    const userLoc = this.locationService.userLocation();
    const count = this.workerService.getNearbyWorkers(userLoc.lat, userLoc.lng)
      .filter(w => w.isOnline).length || 2;
    this.nearbyCandidateCount.set(count);

    this.startSearchCycle();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private startSearchCycle(): void {
    let secondsLeft = 30;
    this.timerInterval = setInterval(() => {
      secondsLeft--;
      this.countdown.set(secondsLeft);
      this.progressPct.set(((30 - secondsLeft) / 30) * 100);

      // Expand radius dynamically: 3km -> 5km -> 10km (Spec §14.2)
      if (secondsLeft === 20) {
        this.currentRadius.set(5);
      } else if (secondsLeft === 10) {
        this.currentRadius.set(10);
      }

      // Check if job got accepted by simulated worker
      const job = this.jobService.getJobById(this.jobId());
      if (job && job.status === 'accepted') {
        clearInterval(this.timerInterval);
        this.router.navigate(['/customer/tracking', this.jobId()]);
      }

      if (secondsLeft <= 0) {
        clearInterval(this.timerInterval);
        this.isTimedOut.set(true);
      }
    }, 1000);
  }

  public postToJobBoard(): void {
    this.jobService.updateJobStatus(this.jobId(), 'searching', { type: 'board_fixed' });
    this.router.navigate(['/customer/bookings']);
  }

  public scheduleInstead(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    this.jobService.updateJobStatus(this.jobId(), 'pending', {
      type: 'scheduled',
      scheduledAt: tomorrow.toISOString()
    });
    this.router.navigate(['/customer/bookings']);
  }

  public cancelSearch(): void {
    this.jobService.cancelJob(this.jobId(), 'কোনো কারিগর সাড়া না দেওয়ায় বাতিল');
    this.router.navigate(['/customer/home']);
  }
}
