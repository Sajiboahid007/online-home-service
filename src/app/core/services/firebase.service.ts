import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc, onSnapshot, query, where, QueryConstraint } from 'firebase/firestore';
import { getDatabase, Database, ref, set, onValue, onDisconnect } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
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
  public updateJobTracking(jobId: string, workerLocation: { lat: number; lng: number }, etaMinutes: number): void {
    try {
      const trackingRef = ref(this.rtdb, `jobTracking/${jobId}`);
      set(trackingRef, {
        jobId,
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
