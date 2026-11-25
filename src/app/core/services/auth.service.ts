import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';
import { WorkerProfile } from '../models/worker.model';
import { SeedDataService } from './seed-data.service';
import { FirebaseService } from './firebase.service';
import { ThemeService } from './theme.service';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { User as FirebaseUser, UserCredential } from 'firebase/auth';

export type SsoIntent = 'login' | 'register_customer' | 'register_worker';

export interface SsoSignInOptions {
  intent?: SsoIntent;
  autoCreateCustomer?: boolean;
  returnUrl?: string;
}

export interface PendingGoogleProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  phone: string;
}

export interface SsoResult {
  status: 'signed_in' | 'needs_registration' | 'redirecting' | 'cancelled' | 'error';
  user?: User;
  worker?: WorkerProfile | null;
  firebaseUser?: FirebaseUser;
  route?: string;
  isNewUser?: boolean;
  error?: string;
}

const SSO_INTENT_STORAGE_KEY = 'kajkhoj_sso_intent';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Reactive signals for current user & worker
  private currentUserSignal = signal<User | null>(null);
  private currentWorkerSignal = signal<WorkerProfile | null>(null);
  private loadingSignal = signal<boolean>(false);
  private ssoLoadingSignal = signal<boolean>(false);
  private firebaseUserSignal = signal<FirebaseUser | null>(null);
  private pendingGoogleProfileSignal = signal<PendingGoogleProfile | null>(null);

  // Readonly computed signals
  public currentUser = this.currentUserSignal.asReadonly();
  public currentWorker = this.currentWorkerSignal.asReadonly();
  public isLoading = this.loadingSignal.asReadonly();
  public isSsoLoading = this.ssoLoadingSignal.asReadonly();
  public firebaseUser = this.firebaseUserSignal.asReadonly();
  public pendingGoogleProfile = this.pendingGoogleProfileSignal.asReadonly();

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
    private firebaseService: FirebaseService,
    private themeService: ThemeService
  ) {
    this.restoreSession();
    this.initFirebaseAuthListener();
    void this.handlePendingGoogleRedirect();
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
    this.pendingGoogleProfileSignal.set(null);
    localStorage.removeItem('kajkhoj_user');
    localStorage.removeItem('kajkhoj_worker');
    void this.firebaseService.signOutFirebase();
    this.router.navigate(['/login']);
  }

  public clearPendingGoogleProfile(): void {
    this.pendingGoogleProfileSignal.set(null);
  }

  public getDefaultRouteForRole(role?: UserRole | null): string {
    if (role === 'superadmin' || role === 'admin') return '/admin';
    if (role === 'worker') return '/worker';
    return '/customer';
  }

  /**
   * Signs in or signs up using Google SSO via Firebase Authentication.
   * Falls back to redirect flow automatically if browser blocks popups.
   */
  public async signInWithGoogleSSO(options: SsoSignInOptions = {}): Promise<SsoResult> {
    const intent: SsoIntent = options.intent || 'login';
    const autoCreateCustomer = options.autoCreateCustomer ?? (intent === 'login');

    this.ssoLoadingSignal.set(true);
    try {
      const credential = await this.firebaseService.signInWithGooglePopup();
      const result = await this.resolveFirebaseUserSession(credential.user, {
        intent,
        autoCreateCustomer,
        returnUrl: options.returnUrl
      });
      this.ssoLoadingSignal.set(false);
      return result;
    } catch (error: any) {
      const code = error?.code || '';

      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-browser') {
        try {
          sessionStorage.setItem(
            SSO_INTENT_STORAGE_KEY,
            JSON.stringify({ intent, autoCreateCustomer, returnUrl: options.returnUrl || '' })
          );
          await this.firebaseService.signInWithGoogleRedirect();
          return { status: 'redirecting' };
        } catch (redirectErr: any) {
          this.ssoLoadingSignal.set(false);
          return {
            status: 'error',
            error: this.formatAuthError(redirectErr)
          };
        }
      }

      this.ssoLoadingSignal.set(false);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return {
          status: 'cancelled',
          error: this.formatAuthError(error)
        };
      }

      return {
        status: 'error',
        error: this.formatAuthError(error)
      };
    }
  }

  /**
   * Persists a newly registered or updated user document to Firestore under their Firebase UID.
   */
  public async syncGoogleUserToFirestore(user: User): Promise<boolean> {
    try {
      const db = this.firebaseService?.db;
      const activeUid = this.firebaseService?.auth?.currentUser?.uid;
      if (!db || !activeUid || activeUid !== user.uid) {
        return false;
      }
      const userRef = doc(db, 'users', user.uid);
      const existing = await getDoc(userRef);
      if (existing.exists()) {
        const safeUpdate = this.stripUndefined({
          name: user.name,
          phone: user.phone,
          email: user.email,
          photoURL: user.photoURL,
          areaId: user.areaId,
          emergencyContact: user.emergencyContact,
          savedAddresses: user.savedAddresses,
          authProvider: user.authProvider,
          googleLinked: user.googleLinked,
          lastLoginAt: new Date().toISOString()
        });
        await updateDoc(userRef, safeUpdate);
      } else {
        // Firestore rules allow client user doc creation when role == 'customer'
        const payload = this.stripUndefined({
          ...user,
          role: 'customer' as const
        });
        await setDoc(userRef, payload);
      }
      return true;
    } catch (err) {
      console.warn('Firestore user sync skipped:', err);
      return false;
    }
  }

  public formatAuthError(error: any, isEn: boolean = this.themeService.currentLang() === 'en'): string {
    const code = error?.code || '';
    switch (code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return isEn
          ? 'Google sign-in popup was closed before completing.'
          : 'Google সাইন-ইন পপআপ সম্পন্ন হওয়ার আগেই বন্ধ করা হয়েছে।';
      case 'auth/popup-blocked':
        return isEn
          ? 'Browser blocked the Google sign-in popup. Redirecting...'
          : 'ব্রাউজার পপআপ ব্লক করেছে। রিডাইরেক্ট করা হচ্ছে...';
      case 'auth/network-request-failed':
        return isEn
          ? 'Network error while connecting to Google Firebase. Please check your internet connection.'
          : 'নেটওয়ার্ক সমস্যার কারণে Google Firebase-এ সংযোগ করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
      case 'auth/unauthorized-domain':
        return isEn
          ? 'This domain is not authorized in Firebase Auth settings. Add it under Firebase Console → Authentication → Settings → Authorized domains.'
          : 'এই ডোমেইনটি Firebase Auth-এ অনুমোদিত নয়। Firebase Console → Authentication → Settings → Authorized domains-এ ডোমেইনটি যোগ করুন।';
      case 'auth/operation-not-allowed':
        return isEn
          ? 'Google Sign-In provider is not enabled yet in Firebase Console → Authentication → Sign-in method.'
          : 'Firebase Console → Authentication → Sign-in method-এ Google প্রদানকারী এখনো সক্রিয় করা হয়নি।';
      case 'auth/account-exists-with-different-credential':
        return isEn
          ? 'An account already exists with the same email using a different sign-in method.'
          : 'এই ইমেইল দিয়ে ইতিমধ্যে অন্য লগইন মাধ্যমে একটি অ্যাকাউন্ট রয়েছে।';
      default:
        return error?.message || (isEn
          ? 'Google authentication failed. Please try again.'
          : 'Google অথেন্টিকেশন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  }

  private initFirebaseAuthListener(): void {
    try {
      this.firebaseService.onAuthStateChange((fbUser) => {
        this.firebaseUserSignal.set(fbUser);
      });
    } catch (err) {
      console.warn('Firebase Auth listener setup skipped:', err);
    }
  }

  private async handlePendingGoogleRedirect(): Promise<void> {
    try {
      const credential: UserCredential | null = await this.firebaseService.getGoogleRedirectResult();
      if (!credential?.user) return;

      let stored: { intent?: SsoIntent; autoCreateCustomer?: boolean; returnUrl?: string } = {};
      try {
        const raw = sessionStorage.getItem(SSO_INTENT_STORAGE_KEY);
        if (raw) {
          stored = JSON.parse(raw);
          sessionStorage.removeItem(SSO_INTENT_STORAGE_KEY);
        }
      } catch {}

      const intent: SsoIntent = stored.intent || 'login';
      const autoCreateCustomer = stored.autoCreateCustomer ?? (intent === 'login');

      const result = await this.resolveFirebaseUserSession(credential.user, {
        intent,
        autoCreateCustomer,
        returnUrl: stored.returnUrl
      });

      if (result.status === 'signed_in' && result.route) {
        const target = stored.returnUrl && stored.returnUrl.startsWith('/') && !stored.returnUrl.startsWith('/auth') && !stored.returnUrl.startsWith('/login')
          ? stored.returnUrl
          : result.route;
        await this.router.navigateByUrl(target);
      } else if (result.status === 'needs_registration') {
        const regRoute = intent === 'register_worker' ? '/auth/register-worker' : '/auth/register-customer';
        await this.router.navigate([regRoute]);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/operation-not-supported-in-this-environment') {
        console.warn('Google redirect result handling skipped:', err);
      }
    }
  }

  private async resolveFirebaseUserSession(
    fbUser: FirebaseUser,
    options: { intent: SsoIntent; autoCreateCustomer: boolean; returnUrl?: string }
  ): Promise<SsoResult> {
    const db = this.firebaseService?.db;
    const uid = fbUser.uid;
    const nowIso = new Date().toISOString();
    const isEn = this.themeService.currentLang() === 'en';

    let userDoc: User | null = null;
    let workerDoc: WorkerProfile | null = null;

    if (db) {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          userDoc = userSnap.data() as User;
        }
      } catch (err) {
        console.warn('Firestore user lookup skipped:', err);
      }

      try {
        const workerSnap = await getDoc(doc(db, 'workers', uid));
        if (workerSnap.exists()) {
          workerDoc = workerSnap.data() as WorkerProfile;
        }
      } catch (err) {
        console.warn('Firestore worker lookup skipped:', err);
      }
    }

    // Fallback check in local workers storage / seed data
    if (!workerDoc) {
      workerDoc = this.findLocalWorkerByUid(uid);
    }

    const activeStatus = userDoc?.status;
    if (activeStatus === 'banned' || activeStatus === 'suspended') {
      await this.firebaseService.signOutFirebase();
      const statusText = isEn
        ? (activeStatus === 'banned' ? 'permanently banned' : 'temporarily suspended')
        : (activeStatus === 'banned' ? 'স্থায়ীভাবে নিষিদ্ধ' : 'সাময়িক বরখাস্ত');
      return {
        status: 'error',
        error: isEn
          ? `Account ${statusText}. Reason: ${userDoc?.banReason || 'Admin decision'}`
          : `অ্যাকাউন্ট ${statusText}। কারণ: ${userDoc?.banReason || 'কর্তৃপক্ষের সিদ্ধান্ত'}`
      };
    }

    // 1. Existing Admin / Superadmin
    if (userDoc && (userDoc.role === 'admin' || userDoc.role === 'superadmin')) {
      const mergedAdmin: User = {
        ...userDoc,
        email: userDoc.email || fbUser.email || undefined,
        photoURL: userDoc.photoURL || fbUser.photoURL || undefined,
        googleLinked: true,
        lastLoginAt: nowIso
      };
      await this.updateLastLoginSafe(uid, mergedAdmin);
      this.setUser(mergedAdmin, null);
      return {
        status: 'signed_in',
        user: mergedAdmin,
        worker: null,
        firebaseUser: fbUser,
        route: '/admin'
      };
    }

    // 2. Existing Worker (registered via workers/{uid} or users/{uid}.role === 'worker')
    if (workerDoc || userDoc?.role === 'worker') {
      const workerUser: User = {
        uid,
        role: 'worker',
        name: userDoc?.name || workerDoc?.name || fbUser.displayName || 'ওয়ার্কার',
        phone: userDoc?.phone || workerDoc?.phone || this.normalizeBdPhone(fbUser.phoneNumber),
        email: userDoc?.email || fbUser.email || undefined,
        photoURL: userDoc?.photoURL || workerDoc?.photoURL || fbUser.photoURL || undefined,
        authProvider: userDoc?.authProvider || 'google',
        googleLinked: true,
        status: userDoc?.status || 'active',
        areaId: userDoc?.areaId || workerDoc?.areaId,
        rating: workerDoc?.rating ?? userDoc?.rating ?? 5.0,
        ratingCount: workerDoc?.ratingCount ?? userDoc?.ratingCount ?? 0,
        favoriteWorkers: userDoc?.favoriteWorkers || [],
        createdAt: userDoc?.createdAt || workerDoc?.createdAt || nowIso,
        lastLoginAt: nowIso
      };

      if (userDoc) {
        await this.updateLastLoginSafe(uid, workerUser);
      }
      this.setUser(workerUser, workerDoc);
      return {
        status: 'signed_in',
        user: workerUser,
        worker: workerDoc,
        firebaseUser: fbUser,
        route: '/worker'
      };
    }

    // 3. Existing Customer upgrading to Worker via Register Worker flow
    if (userDoc && options.intent === 'register_worker' && !options.autoCreateCustomer) {
      this.pendingGoogleProfileSignal.set({
        uid,
        name: userDoc.name || fbUser.displayName || '',
        email: userDoc.email || fbUser.email || '',
        photoURL: userDoc.photoURL || fbUser.photoURL || '',
        phone: userDoc.phone || this.normalizeBdPhone(fbUser.phoneNumber)
      });
      return {
        status: 'needs_registration',
        firebaseUser: fbUser
      };
    }

    // 4. Existing Customer
    if (userDoc) {
      const mergedCustomer: User = {
        ...userDoc,
        name: userDoc.name || fbUser.displayName || 'কাস্টমার',
        email: userDoc.email || fbUser.email || undefined,
        photoURL: userDoc.photoURL || fbUser.photoURL || undefined,
        authProvider: userDoc.authProvider || 'google',
        googleLinked: true,
        lastLoginAt: nowIso
      };
      await this.updateLastLoginSafe(uid, mergedCustomer);
      this.setUser(mergedCustomer, null);
      return {
        status: 'signed_in',
        user: mergedCustomer,
        worker: null,
        firebaseUser: fbUser,
        route: '/customer'
      };
    }

    // 5. Brand-new Google User
    if (!options.autoCreateCustomer) {
      this.pendingGoogleProfileSignal.set({
        uid,
        name: fbUser.displayName || '',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || '',
        phone: this.normalizeBdPhone(fbUser.phoneNumber)
      });
      return {
        status: 'needs_registration',
        firebaseUser: fbUser
      };
    }

    const fallbackName = fbUser.displayName?.trim()
      || fbUser.email?.split('@')[0]
      || (isEn ? 'Google User' : 'Google ব্যবহারকারী');

    const newCustomer: User = {
      uid,
      role: 'customer',
      name: fallbackName,
      phone: this.normalizeBdPhone(fbUser.phoneNumber),
      email: fbUser.email || undefined,
      photoURL: fbUser.photoURL || undefined,
      authProvider: 'google',
      googleLinked: true,
      status: 'active',
      rating: 5.0,
      ratingCount: 0,
      favoriteWorkers: [],
      createdAt: nowIso,
      lastLoginAt: nowIso
    };

    try {
      if (db) {
        await setDoc(doc(db, 'users', uid), this.stripUndefined(newCustomer));
      }
    } catch (err) {
      console.warn('Could not persist new Google customer to Firestore:', err);
    }

    this.setUser(newCustomer, null);
    return {
      status: 'signed_in',
      user: newCustomer,
      worker: null,
      firebaseUser: fbUser,
      route: '/customer',
      isNewUser: true
    };
  }

  private async updateLastLoginSafe(uid: string, user: User): Promise<void> {
    try {
      const db = this.firebaseService?.db;
      if (!db) return;
      const payload = this.stripUndefined({
        lastLoginAt: user.lastLoginAt || new Date().toISOString(),
        email: user.email,
        photoURL: user.photoURL,
        googleLinked: user.googleLinked
      });
      await updateDoc(doc(db, 'users', uid), payload);
    } catch (err) {
      console.warn('Firestore lastLoginAt update skipped:', err);
    }
  }

  private findLocalWorkerByUid(uid: string): WorkerProfile | null {
    try {
      const saved = localStorage.getItem('kajkhoj_workers');
      if (saved) {
        const list: WorkerProfile[] = JSON.parse(saved);
        const found = list.find(w => w.uid === uid);
        if (found) return found;
      }
    } catch {}
    return this.seedData.defaultWorkers.find(w => w.uid === uid) || null;
  }

  private normalizeBdPhone(rawPhone?: string | null): string {
    if (!rawPhone) return '';
    const digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.startsWith('880') && digits.length === 13) {
      return '0' + digits.slice(3);
    }
    if (digits.length === 11 && digits.startsWith('01')) {
      return digits;
    }
    return '';
  }

  private stripUndefined<T extends Record<string, any>>(obj: T): T {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = v;
      }
    }
    return clean as T;
  }
}
