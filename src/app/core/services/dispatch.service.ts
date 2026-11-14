import { Injectable } from '@angular/core';
import { WorkerService } from './worker.service';
import { JobService } from './job.service';
import { GeoService } from './geo.service';
import { Job } from '../models/job.model';
import { WorkerProfile } from '../models/worker.model';

@Injectable({
  providedIn: 'root'
})
export class DispatchService {

  constructor(
    private workerService: WorkerService,
    private jobService: JobService,
    private geoService: GeoService
  ) {}

  public dispatchInstantJob(job: Job): Promise<WorkerProfile | null> {
    return new Promise((resolve) => {
      // Find candidate workers matching category
      const workers = this.workerService.workers()
        .filter(w => w.categoryIds.includes(job.categoryId) && w.isOnline && !w.isBusy && w.verified);

      if (workers.length === 0) {
        // Fallback: look for any online or verified worker in same category
        const allInCat = this.workerService.workers().filter(w => w.categoryIds.includes(job.categoryId));
        if (allInCat.length > 0) {
          const chosen = allInCat[0];
          this.triggerJobOffer(job, chosen);
          resolve(chosen);
          return;
        }
        resolve(null);
        return;
      }

      // Score workers
      const scoredWorkers = workers.map(w => {
        const dist = this.geoService.getDistanceKm(job.location.lat, job.location.lng, w.homeLocation.lat, w.homeLocation.lng);
        const score = this.geoService.calculateWorkerScore(dist, w.rating, w.acceptRate, w.isPremium);
        return { worker: w, dist, score };
      }).sort((a, b) => b.score - a.score);

      const topWorker = scoredWorkers[0].worker;
      this.triggerJobOffer(job, topWorker);
      resolve(topWorker);
    });
  }

  private triggerJobOffer(job: Job, worker: WorkerProfile): void {
    this.jobService.dispatchJobOffer({
      ...job,
      workerId: worker.uid
    });
  }
}
