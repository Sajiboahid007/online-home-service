import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobService } from '../../../core/services/job.service';
import { AuthService } from '../../../core/services/auth.service';
import { Job } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-worker-job-history',
  standalone: true,
  imports: [CommonModule, BnNumberPipe, TakaPipe],
  templateUrl: './worker-job-history.component.html',
  styleUrls: ['./worker-job-history.component.scss']
})
export class WorkerJobHistoryComponent {
  private jobService = inject(JobService);
  private auth = inject(AuthService);

  public filterStatus = signal<'all' | 'completed' | 'cancelled'>('all');

  public workerJobs = computed(() => {
    const worker = this.auth.currentWorker();
    const uid = worker ? worker.uid : 'worker_rahim_1';
    return this.jobService.getWorkerJobs(uid);
  });

  public completedJobs = computed(() => {
    return this.workerJobs().filter(j => j.status === 'completed' || j.status === 'paid');
  });

  public filteredJobs = computed(() => {
    const filter = this.filterStatus();
    if (filter === 'completed') {
      return this.completedJobs();
    }
    if (filter === 'cancelled') {
      return this.workerJobs().filter(j => j.status.includes('cancelled'));
    }
    return this.workerJobs();
  });
}
