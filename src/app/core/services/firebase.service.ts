import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc, onSnapshot, query, where, QueryConstraint } from 'firebase/firestore';
import { getDatabase, Database, ref, set, onValue, onDisconnect } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  public db: Firestore;
  public rtdb: Database;
  public storage: FirebaseStorage;
  public auth: Auth;
  public isConnected: boolean = false;

  constructor() {
    if (!getApps().length) {
      this.app = initializeApp(environment.firebase);
    } else {
      this.app = getApps()[0];
    }

    this.db = getFirestore(this.app);
    this.rtdb = getDatabase(this.app);
    this.storage = getStorage(this.app);
    this.auth = getAuth(this.app);

    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      this.isConnected = true;
    } catch (e) {
      this.isConnected = false;
      console.warn('Firebase initialized in offline/fallback mode');
    }
  }

  /**
   * Creates a configured GoogleAuthProvider instance for SSO login/signup.
   */
  public createGoogleProvider(): GoogleAuthProvider {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    return provider;
  }

  /**
   * Initiates Google Sign-In via popup window.
   */
  public signInWithGooglePopup(): Promise<UserCredential> {
    return signInWithPopup(this.auth, this.createGoogleProvider());
  }

  /**
   * Initiates Google Sign-In via full-page redirect (fallback when popups are blocked).
   */
  public signInWithGoogleRedirect(): Promise<void> {
    return signInWithRedirect(this.auth, this.createGoogleProvider());
  }

  /**
   * Resolves pending Google redirect authentication result on app load.
   */
  public getGoogleRedirectResult(): Promise<UserCredential | null> {
    return getRedirectResult(this.auth);
  }

  /**
   * Signs out of the active Firebase Auth session.
   */
  public async signOutFirebase(): Promise<void> {
    try {
      if (this.auth?.currentUser) {
        await signOut(this.auth);
      }
    } catch (err) {
      console.warn('Firebase signOut skipped:', err);
    }
  }

  /**
   * Subscribes to Firebase Auth state changes.
   */
  public onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  // Realtime Database Live Location Writer
  public updateWorkerLiveLocation(
    workerId: string,
    lat: number,
    lng: number,
    heading: number = 0,
    isOnline: boolean = true
  ): void {
    try {
      const locRef = ref(this.rtdb, `liveLocations/${workerId}`);
      if (isOnline) {
        set(locRef, {
          workerId,
          lat,
          lng,
          heading,
          timestamp: Date.now(),
          isOnline: true
        });
        // Remove location when disconnected
        onDisconnect(locRef).remove();
      } else {
        set(locRef, null);
      }
    } catch (err) {
      console.warn('RTDB live location update skipped (offline mode):', err);
    }
  }

  // Realtime Database Job Tracking Writer
  public updateJobTracking(
    jobId: string,
    workerLocation: { lat: number; lng: number },
    etaMinutes: number,
    workerId?: string | null
  ): void {
    try {
      const trackingRef = ref(this.rtdb, `jobTracking/${jobId}`);
      set(trackingRef, {
        jobId,
        workerId: workerId || null,
        workerLocation,
        etaMinutes,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.warn('RTDB job tracking update skipped (offline mode):', err);
    }
  }

  // Realtime Database Job Tracking Listener
  public listenJobTracking(jobId: string, callback: (data: any) => void): () => void {
    try {
      const trackingRef = ref(this.rtdb, `jobTracking/${jobId}`);
      return onValue(trackingRef, (snapshot) => {
        callback(snapshot.val());
      });
    } catch (err) {
      console.warn('RTDB tracking listener error:', err);
      return () => {};
    }
  }
}
