import { Injectable } from '@angular/core';
import { distanceBetween, geohashForLocation } from 'geofire-common';

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  /**
   * Calculates distance between two coordinates in kilometers using geofire-common
   */
  public getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const distInKm = distanceBetween([lat1, lng1], [lat2, lng2]);
    return Math.round(distInKm * 10) / 10;
  }

  /**
   * Generates geohash for coordinate
   */
  public getGeohash(lat: number, lng: number): string {
    return geohashForLocation([lat, lng]);
  }

  /**
   * Calculates score for dispatch based on distance, rating, accept rate
   */
  public calculateWorkerScore(
    distanceKm: number,
    rating: number,
    acceptRate: number,
    isPremium: boolean = false
  ): number {
    // Proximity score (closer = higher score, max at 0km, 0 at 10km)
    const distScore = Math.max(0, 10 - distanceKm) * 10;
    // Rating score (0 to 100 based on 5-star scale)
    const ratingScore = (rating / 5) * 100;
    // Accept rate (0 to 100)
    const acceptScore = acceptRate * 100;
    // Premium bonus
    const premiumScore = isPremium ? 100 : 0;

    return Math.round(
      (distScore * 0.40) +
      (ratingScore * 0.25) +
      (acceptScore * 0.15) +
      (premiumScore * 0.20)
    );
  }
}
