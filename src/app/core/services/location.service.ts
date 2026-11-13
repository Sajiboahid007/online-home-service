import { Injectable, signal, inject } from '@angular/core';
import { GeoPoint } from '../models/worker.model';
import { environment } from '../../../environments/environment';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private firebaseService = inject(FirebaseService);

  private userLocationSignal = signal<GeoPoint>({
    lat: environment.map.defaultCenter.lat,
    lng: environment.map.defaultCenter.lng,
    address: 'সাভার বাজার, সাভার, ঢাকা'
  });

  public userLocation = this.userLocationSignal.asReadonly();
  private watchId: number | null = null;

  // Last recorded position and timestamp for fake GPS detection & RTDB throttling
  private lastPosition: { lat: number; lng: number; time: number } | null = null;
  private lastRtdbUpdate: { lat: number; lng: number; time: number } | null = null;

  constructor() {
    this.detectCurrentPosition();
  }

  public detectCurrentPosition(): Promise<GeoPoint> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const loc: GeoPoint = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              address: 'আপনার বর্তমান অবস্থান'
            };
            this.userLocationSignal.set(loc);

            // Reverse geocode to get real Bengali address
            const addr = await this.reverseGeocode(loc.lat, loc.lng);
            if (addr) {
              loc.address = addr;
              this.userLocationSignal.set({ ...loc });
            }

            resolve(loc);
          },
          (err) => {
            console.warn('Geolocation unavailable or denied, using default:', err);
            resolve(this.userLocationSignal());
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        resolve(this.userLocationSignal());
      }
    });
  }

  public setUserLocation(loc: GeoPoint): void {
    this.userLocationSignal.set(loc);
  }

  // Fake GPS detection (Spec §5.4: jumps > 50km in 10s or accuracy > 500m)
  public checkFakeGps(newLat: number, newLng: number, accuracyMeters: number = 20): { isFake: boolean; reason?: string } {
    if (accuracyMeters > 500) {
      return { isFake: true, reason: 'লোকেশন নির্ভুলতা অত্যন্ত দুর্বল (> ৫০০ মিটার)' };
    }

    if (this.lastPosition) {
      const now = Date.now();
      const elapsedSeconds = (now - this.lastPosition.time) / 1000;
      const distKm = this.calculateDistanceKm(
        this.lastPosition.lat,
        this.lastPosition.lng,
        newLat,
        newLng
      );

      // Flag speed > 300 km/h or jump > 50km in < 10 seconds
      if (elapsedSeconds < 10 && distKm > 10) {
        return { isFake: true, reason: `অস্বাভাবিক লোকেশন জাম্প শনাক্ত হয়েছে (${distKm.toFixed(1)} কিমি / ${elapsedSeconds.toFixed(0)} সে.)` };
      }
    }

    this.lastPosition = { lat: newLat, lng: newLng, time: Date.now() };
    return { isFake: false };
  }

  // Address search with OpenStreetMap Nominatim
  public async searchAddress(queryStr: string): Promise<{ address: string; lat: number; lng: number }[]> {
    if (!queryStr || queryStr.trim().length < 2) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr + ', Bangladesh')}&format=json&addressdetails=1&limit=5&countrycodes=bd`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'bn,en' } });
      const data = await res.json();

      return data.map((item: any) => ({
        address: item.display_name.split(',').slice(0, 3).join(', '),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    } catch (e) {
      console.warn('Geocoding search failed:', e);
      return [];
    }
  }

  // Reverse Geocoding with Nominatim
  public async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'bn,en' } });
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(', ');
      }
    } catch (e) {}
    return 'সাভার, ঢাকা';
  }

  // Real-time worker tracking with RTDB throttled update (moved > 50m or 30s elapsed)
  public startTrackingWorkerLocation(workerUid: string, onUpdate: (loc: GeoPoint) => void): void {
    if (!('geolocation' in navigator)) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fakeCheck = this.checkFakeGps(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        if (fakeCheck.isFake) {
          console.warn('Fake GPS flagged:', fakeCheck.reason);
        }

        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        // Check throttling for RTDB write: moved > 50m or 30s
        const now = Date.now();
        let shouldWriteRtdb = false;
        if (!this.lastRtdbUpdate) {
          shouldWriteRtdb = true;
        } else {
          const distMeters = this.calculateDistanceKm(
            this.lastRtdbUpdate.lat,
            this.lastRtdbUpdate.lng,
            point.lat,
            point.lng
          ) * 1000;
          const timeElapsedMs = now - this.lastRtdbUpdate.time;
          if (distMeters >= 50 || timeElapsedMs >= 30000) {
            shouldWriteRtdb = true;
          }
        }

        if (shouldWriteRtdb) {
          this.lastRtdbUpdate = { lat: point.lat, lng: point.lng, time: now };
          this.firebaseService.updateWorkerLiveLocation(
            workerUid,
            point.lat,
            point.lng,
            pos.coords.heading || 0,
            true
          );
        }

        onUpdate(point);
      },
      (err) => console.error('Worker location watch error:', err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  }

  public stopTracking(workerUid?: string): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (workerUid) {
      this.firebaseService.updateWorkerLiveLocation(workerUid, 0, 0, 0, false);
    }
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
