import { Injectable, signal, inject } from '@angular/core';
import { WorkerProfile, WorkerPrivate, VerificationStatus } from '../models/worker.model';
import { SeedDataService } from './seed-data.service';
import { GeoService } from './geo.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private seedData = inject(SeedDataService);
  private geoService = inject(GeoService);
  private notificationService = inject(NotificationService);

  private workersSignal = signal<WorkerProfile[]>([]);
  public workers = this.workersSignal.asReadonly();

  constructor() {
    this.loadWorkers();
  }

  private loadWorkers(): void {
    const saved = localStorage.getItem('kajkhoj_workers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(w => w.uid === 'worker_kalam_5')) {
          const rahim = parsed.find((w: any) => w.uid === 'worker_rahim_1');
          if (rahim && !rahim.photoURL) {
            rahim.photoURL = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150';
            localStorage.setItem('kajkhoj_workers', JSON.stringify(parsed));
          }
          this.workersSignal.set(parsed);
          return;
        }
      } catch (e) {}
    }
    this.workersSignal.set(this.seedData.defaultWorkers);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem('kajkhoj_workers', JSON.stringify(this.workersSignal()));
  }

  public getWorkerById(uid: string): WorkerProfile | undefined {
    return this.workersSignal().find(w => w.uid === uid);
  }

  /**
   * Workers sorted by distance from the user, optionally limited to a category
   * and to those within `maxDistanceKm` of the user's location.
   */
  public getNearbyWorkers(userLat: number, userLng: number, categoryId?: string, maxDistanceKm?: number): WorkerProfile[] {
    return this.workersSignal()
      .filter(w => !categoryId || w.categoryIds.includes(categoryId))
      .map(w => {
        const dist = this.geoService.getDistanceKm(userLat, userLng, w.homeLocation.lat, w.homeLocation.lng);
        return {
          ...w,
          distanceKm: dist
        };
      })
      .filter(w => maxDistanceKm === undefined || (w.distanceKm ?? Infinity) <= maxDistanceKm)
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  public updateWorker(worker: WorkerProfile): void {
    this.workersSignal.update(list => {
      const idx = list.findIndex(w => w.uid === worker.uid);
      if (idx >= 0) {
        list[idx] = worker;
        return [...list];
      }
      return [...list, worker];
    });
    this.saveToStorage();
  }

  public toggleOnlineStatus(uid: string, isOnline: boolean): void {
    this.workersSignal.update(list => list.map(w => {
      if (w.uid === uid) {
        return { ...w, isOnline, isBusy: isOnline ? w.isBusy : false };
      }
      return w;
    }));
    this.saveToStorage();
  }

  public setBusyStatus(uid: string, isBusy: boolean): void {
    this.workersSignal.update(list => list.map(w => {
      if (w.uid === uid) {
        return { ...w, isBusy };
      }
      return w;
    }));
    this.saveToStorage();
  }

  public setVerificationStatus(uid: string, status: VerificationStatus): void {
    this.workersSignal.update(list => list.map(w => {
      if (w.uid === uid) {
        return {
          ...w,
          verificationStatus: status,
          verified: status === 'approved'
        };
      }
      return w;
    }));
    this.saveToStorage();

    this.notificationService.addNotification({
      userId: uid,
      title: status === 'approved' ? 'কেওয়াইসি ভেরিফিকেশন সম্পন্ন! ✅' : 'কেওয়াইসি প্রত্যাখ্যাত হয়েছে ❌',
      body: status === 'approved' ? 'আপনার প্রোফাইল অনুমোদিত হয়েছে। এখন থেকে নিয়মিত কাজের রিকোয়েস্ট পাবেন।' : 'জাতীয় পরিচয়পত্রের তথ্য পুনরায় যাচাই করে আবার আবেদন করুন।',
      type: 'admin',
      link: '/worker/dashboard'
    });
  }

  // Award badges (Item 90)
  public awardBadges(uid: string, badges: { verified?: boolean; trustedBadge?: boolean; isPremium?: boolean }): void {
    this.workersSignal.update(list => list.map(w => {
      if (w.uid === uid) {
        return {
          ...w,
          ...badges
        };
      }
      return w;
    }));
    this.saveToStorage();
  }

  // Due Limit enforcement (Item 35: commissionDue >= 500)
  public hasDueExceeded(worker: WorkerProfile): boolean {
    return (worker.commissionDue || 0) >= 500;
  }

  // Rate reward logic (Item 36: rating >= 4.5 && totalJobs >= 50 => up to 20% bonus rate)
  public canClaimRateReward(worker: WorkerProfile): boolean {
    return (worker.rating || 0) >= 4.5 && (worker.totalJobs || 0) >= 50;
  }

  // Portfolio image upload (Item 34)
  public addPortfolioImage(uid: string, imageUrl: string): void {
    this.workersSignal.update(list => list.map(w => {
      if (w.uid === uid) {
        const currentPortfolio = w.portfolio || [];
        return {
          ...w,
          portfolio: [imageUrl, ...currentPortfolio]
        };
      }
      return w;
    }));
    this.saveToStorage();
  }

  public deletePortfolioImage(uid: string, index: number): void {
    this.workersSignal.update(list => list.map(w => {
      if (w.uid === uid) {
        const portfolio = [...(w.portfolio || [])];
        portfolio.splice(index, 1);
        return { ...w, portfolio };
      }
      return w;
    }));
    this.saveToStorage();
  }

  public saveWorkerPrivate(privateData: WorkerPrivate): void {
    const key = `kajkhoj_worker_private_${privateData.uid}`;
    localStorage.setItem(key, JSON.stringify(privateData));
  }

  public getWorkerPrivate(uid: string): WorkerPrivate | null {
    const key = `kajkhoj_worker_private_${uid}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}
