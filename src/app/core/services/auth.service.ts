import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { WorkerProfile } from '../models/worker.model';
import { SeedDataService } from './seed-data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Reactive signals for current user & worker
  private currentUserSignal = signal<User | null>(null);
  private currentWorkerSignal = signal<WorkerProfile | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Readonly computed signals
  public currentUser = this.currentUserSignal.asReadonly();
  public currentWorker = this.currentWorkerSignal.asReadonly();
  public isLoading = this.loadingSignal.asReadonly();

  public isAuthenticated = computed(() => !!this.currentUserSignal());
  public currentRole = computed(() => this.currentUserSignal()?.role || null);
  public isSuperAdmin = computed(() => this.currentUserSignal()?.role === 'superadmin');
  public isAdmin = computed(() => ['admin', 'superadmin'].includes(this.currentUserSignal()?.role || ''));
  public isWorker = computed(() => this.currentUserSignal()?.role === 'worker');
  public isCustomer = computed(() => this.currentUserSignal()?.role === 'customer');
  public isBanned = computed(() => ['banned', 'suspended'].includes(this.currentUserSignal()?.status || ''));

  constructor(
    private router: Router,
    private seedData: SeedDataService
  ) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const savedUser = localStorage.getItem('kajkhoj_user');
    const savedWorker = localStorage.getItem('kajkhoj_worker');

    if (savedUser) {
      try {
        const user: User = JSON.parse(savedUser);
        this.currentUserSignal.set(user);
        if (savedWorker) {
          this.currentWorkerSignal.set(JSON.parse(savedWorker));
        }
      } catch (e) {
        localStorage.removeItem('kajkhoj_user');
        localStorage.removeItem('kajkhoj_worker');
      }
    } else {
      // Default to customer demo for smooth immediate UX
      this.loginAsDemo('customer');
    }
  }

  public loginAsDemo(role: UserRole | 'worker_korim' | 'worker_kalam'): void {
    if (role === 'superadmin') {
      const superAdmin = this.seedData.defaultUsers.find(u => u.role === 'superadmin')!;
      this.setUser(superAdmin, null);
    } else if (role === 'admin') {
      const admin = this.seedData.defaultUsers.find(u => u.role === 'admin')!;
      this.setUser(admin, null);
    } else if (role === 'worker') {
      const workerProfile = this.seedData.defaultWorkers[0]; // Rahim Plumber
      const workerUser: User = {
        uid: workerProfile.uid,
        role: 'worker',
        name: workerProfile.name,
        phone: workerProfile.phone,
        photoURL: workerProfile.photoURL,
        status: 'active',
        areaId: workerProfile.areaId,
        rating: workerProfile.rating,
        ratingCount: workerProfile.ratingCount,
        createdAt: workerProfile.createdAt
      };
      this.setUser(workerUser, workerProfile);
    } else if (role === 'worker_kalam') {
      const workerProfile = this.seedData.defaultWorkers.find(w => w.uid === 'worker_kalam_5') || this.seedData.defaultWorkers[0]; // Kalam Plumber
      const workerUser: User = {
        uid: workerProfile.uid,
        role: 'worker',
        name: workerProfile.name,
        phone: workerProfile.phone,
        photoURL: workerProfile.photoURL,
        status: 'active',
        areaId: workerProfile.areaId,
        rating: workerProfile.rating,
        ratingCount: workerProfile.ratingCount,
        createdAt: workerProfile.createdAt
      };
      this.setUser(workerUser, workerProfile);
    } else if (role === 'worker_korim') {
      const workerProfile = this.seedData.defaultWorkers[1]; // Korim Electrician
      const workerUser: User = {
        uid: workerProfile.uid,
        role: 'worker',
        name: workerProfile.name,
        phone: workerProfile.phone,
        photoURL: workerProfile.photoURL,
        status: 'active',
        areaId: workerProfile.areaId,
        rating: workerProfile.rating,
        ratingCount: workerProfile.ratingCount,
        createdAt: workerProfile.createdAt
      };
      this.setUser(workerUser, workerProfile);
    } else {
      const customer = this.seedData.defaultUsers.find(u => u.role === 'customer')!;
      this.setUser(customer, null);
    }
  }

  public setUser(user: User, worker: WorkerProfile | null = null): void {
    this.currentUserSignal.set(user);
    this.currentWorkerSignal.set(worker);

    localStorage.setItem('kajkhoj_user', JSON.stringify(user));
    if (worker) {
      localStorage.setItem('kajkhoj_worker', JSON.stringify(worker));
    } else {
      localStorage.removeItem('kajkhoj_worker');
    }
  }

  public updateWorkerProfile(worker: WorkerProfile): void {
    this.currentWorkerSignal.set(worker);
    localStorage.setItem('kajkhoj_worker', JSON.stringify(worker));
  }

  public isFavoriteWorker(workerId: string): boolean {
    const user = this.currentUserSignal();
    return !!(user?.favoriteWorkers && user.favoriteWorkers.includes(workerId));
  }

  public toggleFavoriteWorker(workerId: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;

    const currentFavs = user.favoriteWorkers || [];
    const isFav = currentFavs.includes(workerId);
    const updatedFavs = isFav 
      ? currentFavs.filter(id => id !== workerId)
      : [...currentFavs, workerId];

    const updatedUser: User = {
      ...user,
      favoriteWorkers: updatedFavs
    };

    this.setUser(updatedUser, this.currentWorkerSignal());
    return !isFav;
  }

  public logout(): void {
    this.currentUserSignal.set(null);
    this.currentWorkerSignal.set(null);
    localStorage.removeItem('kajkhoj_user');
    localStorage.removeItem('kajkhoj_worker');
    this.router.navigate(['/login']);
  }
}
