import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { WorkerProfile } from '../models/worker.model';
import { SeedDataService } from './seed-data.service';
import { FirebaseService } from './firebase.service';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

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
    private seedData: SeedDataService,
    private firebaseService: FirebaseService
  ) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const savedUser = localStorage.getItem('kajkhoj_user');
    const savedWorker = localStorage.getItem('kajkhoj_worker');

    if (savedUser) {
      try {
        const user: User = JSON.parse(savedUser);
        // Strip out any base64 image string so database/storage remains clean
        if (user.photoURL && user.photoURL.startsWith('data:image')) {
          delete user.photoURL;
          localStorage.setItem('kajkhoj_user', JSON.stringify(user));
        }
        this.currentUserSignal.set(user);
        this.syncLiveUserFromFirestore(user.uid);
        if (savedWorker) {
          const worker: WorkerProfile = JSON.parse(savedWorker);
          if (worker.photoURL && worker.photoURL.startsWith('data:image')) {
            delete (worker as any).photoURL;
            localStorage.setItem('kajkhoj_worker', JSON.stringify(worker));
          }
          this.currentWorkerSignal.set(worker);
        }
      } catch (e) {
        localStorage.removeItem('kajkhoj_user');
        localStorage.removeItem('kajkhoj_worker');
      }
    }
  }

  public loginAsDemo(identifier: string): void {
    // 1. Check if identifier is an exact UID in defaultUsers
    const userByUid = this.seedData.defaultUsers.find(u => u.uid === identifier);
    if (userByUid) {
      if (userByUid.role === 'worker') {
        const workerProfile = this.seedData.defaultWorkers.find(w => w.uid === userByUid.uid) || this.seedData.defaultWorkers[0];
        this.setUser(userByUid, workerProfile);
      } else {
        this.setUser(userByUid, null);
      }
      return;
    }

    // 2. Specific Worker aliases
    if (identifier.startsWith('worker_') || identifier === 'worker') {
      const workerProfile = this.seedData.defaultWorkers.find(w => w.uid === identifier)
        || this.seedData.defaultWorkers.find(w => w.uid.startsWith(identifier))
        || this.seedData.defaultWorkers[0];
      const workerUser: User = this.seedData.defaultUsers.find(u => u.uid === workerProfile.uid) || {
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
      return;
    }

    // 3. Specific Customer aliases
    if (identifier.startsWith('customer_')) {
      const targetSuffix = identifier.replace('customer_', '');
      const foundCustomer = this.seedData.defaultUsers.find(u => 
        u.role === 'customer' && (u.uid === 'user_customer_' + targetSuffix || u.uid.includes(targetSuffix) || u.name.toLowerCase().includes(targetSuffix))
      );
      if (foundCustomer) {
        this.setUser(foundCustomer, null);
        return;
      }
    }

    // 4. Role-based fallback
    if (identifier === 'superadmin') {
      const superAdmin = this.seedData.defaultUsers.find(u => u.role === 'superadmin')!;
      this.setUser(superAdmin, null);
    } else if (identifier === 'admin') {
      const admin = this.seedData.defaultUsers.find(u => u.role === 'admin')!;
      this.setUser(admin, null);
    } else {
      const customer = this.seedData.defaultUsers.find(u => u.role === 'customer')!;
      this.setUser(customer, null);
    }
  }

  public loginAsUser(user: User, worker: WorkerProfile | null = null): void {
    this.setUser(user, worker);
  }

  public setUser(user: User, worker: WorkerProfile | null = null): void {
    const cleanUser = { ...user };
    if (cleanUser.photoURL && cleanUser.photoURL.startsWith('data:image')) {
      delete cleanUser.photoURL;
    }

    let cleanWorker = worker ? { ...worker } : null;
    if (cleanWorker?.photoURL && cleanWorker.photoURL.startsWith('data:image')) {
      cleanWorker.photoURL = '';
    }

    this.currentUserSignal.set(cleanUser);
    this.currentWorkerSignal.set(cleanWorker);

    localStorage.setItem('kajkhoj_user', JSON.stringify(cleanUser));
    if (cleanWorker) {
      localStorage.setItem('kajkhoj_worker', JSON.stringify(cleanWorker));
    } else {
      localStorage.removeItem('kajkhoj_worker');
    }
  }

  public updateWorkerProfile(worker: WorkerProfile): void {
    const cleanWorker = { ...worker };
    if (cleanWorker.photoURL && cleanWorker.photoURL.startsWith('data:image')) {
      cleanWorker.photoURL = '';
    }
    this.currentWorkerSignal.set(cleanWorker);
    localStorage.setItem('kajkhoj_worker', JSON.stringify(cleanWorker));
  }

  public getGuestFavorites(): string[] {
    try {
      const saved = localStorage.getItem('kajkhoj_guest_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private setGuestFavorites(favs: string[]): void {
    try {
      localStorage.setItem('kajkhoj_guest_favorites', JSON.stringify(favs));
    } catch {}
  }

  public isFavoriteWorker(workerId: string): boolean {
    const user = this.currentUserSignal();
    if (user) {
      return !!(user.favoriteWorkers && user.favoriteWorkers.includes(workerId));
    }
    // Fallback: check guest favorites or default demo customer
    const guestFavs = this.getGuestFavorites();
    if (guestFavs.includes(workerId)) return true;
    const defaultCust = this.seedData.defaultUsers.find(u => u.uid === 'user_customer_demo_1');
    return !!(defaultCust?.favoriteWorkers && defaultCust.favoriteWorkers.includes(workerId));
  }

  /**
   * Explicitly and idempotently removes a worker from the favorite list.
   * Never toggles it back on even if pressed repeatedly.
   */
  public async removeFavoriteWorker(workerId: string): Promise<boolean> {
    let user = this.currentUserSignal();

    // 1. Remove from guest favorites in localStorage
    const currentGuest = this.getGuestFavorites().filter(id => id !== workerId);
    this.setGuestFavorites(currentGuest);

    // 2. Remove from ALL default demo users in seedData so demo switches never resurrect it
    this.seedData.defaultUsers.forEach(u => {
      if (u.favoriteWorkers && u.favoriteWorkers.includes(workerId)) {
        u.favoriteWorkers = u.favoriteWorkers.filter(id => id !== workerId);
      }
    });

    if (user) {
      const currentFavs = user.favoriteWorkers || [];
      const updatedFavs = currentFavs.filter(id => id !== workerId);
      const updatedUser: User = {
        ...user,
        favoriteWorkers: updatedFavs
      };

      // 3. Save to signal and localStorage ('kajkhoj_user')
      this.setUser(updatedUser, this.currentWorkerSignal());

      // 4. Synchronize to Firestore live document in database permanently
      await this.syncFavoritesToFirestore(user.uid, updatedFavs);
    } else {
      // Guest mode: ALSO sync guest favorites to default customer in Firestore if applicable!
      const defaultCust = this.seedData.defaultUsers.find(u => u.uid === 'user_customer_demo_1');
      if (defaultCust) {
        await this.syncFavoritesToFirestore(defaultCust.uid, defaultCust.favoriteWorkers || []);
      }
    }

    return true;
  }

  public async toggleFavoriteWorker(workerId: string): Promise<boolean> {
    let user = this.currentUserSignal();

    if (!user) {
      // If no active user session, initialize with demo customer so favorites can be saved
      const defaultCust = this.seedData.defaultUsers.find(u => u.uid === 'user_customer_demo_1');
      if (defaultCust) {
        user = { ...defaultCust };
        this.currentUserSignal.set(user);
        this.syncLiveUserFromFirestore(user.uid);
        localStorage.setItem('kajkhoj_user', JSON.stringify(user));
      } else {
        const guest = this.getGuestFavorites();
        const isFav = guest.includes(workerId);
        const updated = isFav ? guest.filter(id => id !== workerId) : [...guest, workerId];
        this.setGuestFavorites(updated);
        return !isFav;
      }
    }

    const currentFavs = user.favoriteWorkers || [];
    const isFav = currentFavs.includes(workerId);
    const updatedFavs = isFav 
      ? currentFavs.filter(id => id !== workerId)
      : [...currentFavs, workerId];

    const updatedUser: User = {
      ...user,
      favoriteWorkers: updatedFavs
    };

    // 1. Update in-memory seedData so demo switches don't revert
    const seedUser = this.seedData.defaultUsers.find(u => u.uid === user!.uid || u.phone === user!.phone);
    if (seedUser) {
      seedUser.favoriteWorkers = [...updatedFavs];
    }

    // 2. Save session & localStorage
    this.setUser(updatedUser, this.currentWorkerSignal());

    // 3. Keep guest favorites aligned
    this.setGuestFavorites(updatedFavs);

    // 4. Synchronize to Firestore
    await this.syncFavoritesToFirestore(user.uid, updatedFavs);

    return !isFav;
  }

  public async syncFavoritesToFirestore(uid: string, favs: string[]): Promise<boolean> {
    try {
      if (this.firebaseService?.db) {
        const userRef = doc(this.firebaseService.db, 'users', uid);
        try {
          await updateDoc(userRef, { favoriteWorkers: favs });
          return true;
        } catch {
          await setDoc(userRef, { favoriteWorkers: favs }, { merge: true });
          return true;
        }
      }
    } catch (err) {
      console.warn('Firestore live favorite sync failed:', err);
    }
    return false;
  }

  private async syncLiveUserFromFirestore(uid: string): Promise<void> {
    try {
      if (this.firebaseService?.db) {
        const userRef = doc(this.firebaseService.db, 'users', uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const remoteData = snap.data() as Partial<User>;
          const current = this.currentUserSignal();
          if (current && current.uid === uid) {
            const merged: User = {
              ...current,
              ...remoteData,
              favoriteWorkers: Array.isArray(remoteData.favoriteWorkers)
                ? remoteData.favoriteWorkers
                : (current.favoriteWorkers || [])
            };
            this.currentUserSignal.set(merged);
            localStorage.setItem('kajkhoj_user', JSON.stringify(merged));
          }
        }
      }
    } catch (e) {
      console.warn('Live user sync from Firestore skipped:', e);
    }
  }

  public logout(): void {
    this.currentUserSignal.set(null);
    this.currentWorkerSignal.set(null);
    localStorage.removeItem('kajkhoj_user');
    localStorage.removeItem('kajkhoj_worker');
    this.router.navigate(['/login']);
  }
}
