export type JobStatus =
  | 'draft'
  | 'requested'
  | 'offered'
  | 'broadcast'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'payment_pending'
  | 'completed'
  | 'cancelled';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface DispatchSettings {
  initialRadius: number;
  maxRadius: number;
  offerTimeoutSec: number;
  batchSize: number;
  weights: {
    distance: number;
    rating: number;
    acceptRate: number;
    idleTime: number;
    premiumBonus: number;
  };
}

export interface JobOffer {
  workerId: string;
  jobId: string;
  score: number;
  distanceKm: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface JobBid {
  id: string;
  workerId: string;
  workerName: string;
  workerAvatar?: string;
  workerRating: number;
  amount: number;
  estimatedTime?: string;
  message?: string;
  createdAt: string;
}
