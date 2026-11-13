export type RateUnit = 'hour' | 'day' | 'job';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface GeoPoint {
  lat: number;
  lng: number;
  geohash?: string;
  address?: string;
}

export interface WorkerProfile {
  uid: string;
  name: string;
  photoURL: string;
  phone: string;
  phoneMasked: string;
  categoryIds: string[];
  skills: string[];
  experienceYears: number;
  bio?: string;
  rate: number;
  rateUnit: RateUnit;
  serviceRadiusKm: number;
  homeLocation: GeoPoint; // Mandatory during onboarding
  areaId: string;
  isOnline: boolean;
  isBusy: boolean;
  verificationStatus: VerificationStatus;
  verified: boolean;
  trustedBadge: boolean;
  isPremium: boolean;
  premiumUntil?: string;
  rating: number;
  ratingCount: number;
  totalJobs: number;
  completionRate: number;
  acceptRate: number;
  cancelRate: number;
  walletBalance: number;
  commissionDue: number;
  portfolio: string[];
  lastJobAt?: string;
  createdAt: string;
  distanceKm?: number; // Runtime computed property for map/lists
}

export interface WorkerPrivate {
  uid: string;
  nidNumber: string;
  nidFrontURL: string;
  nidBackURL: string;
  selfieURL: string;
  fullAddress: string;
  policeClearanceURL?: string;
  bankInfo?: {
    bkash?: string;
    nagad?: string;
    bankName?: string;
    accountNo?: string;
  };
}
