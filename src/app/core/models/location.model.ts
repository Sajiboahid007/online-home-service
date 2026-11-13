export interface LiveLocation {
  lat: number;
  lng: number;
  geohash: string;
  heading?: number;
  accuracy?: number;
  categoryIds: string[];
  isBusy: boolean;
  updatedAt: number;
}

export interface JobTracking {
  workerLat: number;
  workerLng: number;
  etaMin: number;
  updatedAt: number;
}
