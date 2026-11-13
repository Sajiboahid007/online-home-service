export interface DispatchSettings {
  initialRadius: number; // in km (default 3)
  maxRadius: number;     // in km (default 10)
  offerTimeoutSec: number; // default 30s
  batchSize: number;       // default 3-5
  weights: {
    distance: number;   // 0.40
    rating: number;     // 0.25
    acceptRate: number; // 0.15
    idleTime: number;   // 0.10
    premiumBonus: number; // 0.10
  };
}

export interface BanSettings {
  warnRating: number;      // < 3.5
  suspendRating: number;   // < 2.5
  minJobsForRating: number; // 10
  maxCancelRate: number;   // 20%
}

export interface PlatformSettings {
  defaultCommission: number; // 0.15
  dueLimit: number;          // ৳500
  dispatch: DispatchSettings;
  ban: BanSettings;
  showFullPhoneBeforeBooking: boolean;
  supportPhone: string;
  maintenanceMode: boolean;
}
