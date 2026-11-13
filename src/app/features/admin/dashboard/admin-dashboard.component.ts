import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { WorkerService } from '../../../core/services/worker.service';
import { AreaService } from '../../../core/services/area.service';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { MaskPhonePipe } from '../../../shared/pipes/mask-phone.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BnNumberPipe, TakaPipe, MaskPhonePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  private jobService = inject(JobService);
  private workerService = inject(WorkerService);
  private areaService = inject(AreaService);

  public jobs = this.jobService.jobs;
  public areas = this.areaService.areas;

  public totalCompletedJobs = computed(() => {
    return this.jobs().filter(j => j.status === 'completed').length;
  });

  public onlineWorkersCount = computed(() => {
    return this.workerService.workers().filter(w => w.isOnline).length;
  });

  public totalPlatformRevenue = computed(() => {
    return this.jobs()
      .filter(j => j.status === 'completed')
      .reduce((acc, j) => acc + (j.commission || 0) + (j.platformFee || 0), 0);
  });

  public totalDueCommission = computed(() => {
    return this.workerService.workers()
      .reduce((acc, w) => acc + (w.commissionDue || 0), 0);
  });

  constructor() {}
}
