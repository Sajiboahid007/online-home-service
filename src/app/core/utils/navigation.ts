import { GeoPoint } from '../models/worker.model';
import { JobStatus } from '../models/job.model';

/**
 * Google Maps turn-by-turn directions to a point.
 * Free URL scheme — no API key. On phones it opens the Google Maps app if installed.
 */
export function googleMapsDirectionsUrl(dest: Pick<GeoPoint, 'lat' | 'lng'>, origin?: Pick<GeoPoint, 'lat' | 'lng'>): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${dest.lat},${dest.lng}`,
    travelmode: 'driving',
  });
  if (origin) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Statuses while the assigned technician is actively serving the job.
 * Only then may they see the exact doorstep pin, landmark and gate photo;
 * before acceptance (and after the job ends) show an approximate location instead.
 */
export const EXACT_LOCATION_VISIBLE_STATUSES: readonly JobStatus[] = ['accepted', 'on_the_way', 'arrived', 'in_progress'];

export function canSeeExactLocation(status: JobStatus): boolean {
  return EXACT_LOCATION_VISIBLE_STATUSES.includes(status);
}
