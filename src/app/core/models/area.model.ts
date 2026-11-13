export interface AreaCoordinate {
  lat: number;
  lng: number;
}

export interface Area {
  id: string;
  division: string;
  district: string;
  upazila: string;
  zoneName: string;
  center: AreaCoordinate;
  radiusKm: number;
  polygon?: AreaCoordinate[];
  isActive: boolean;
  surgeMultiplier: number;
  adminIds: string[];
}
