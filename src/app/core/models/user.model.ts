export type UserRole = 'superadmin' | 'admin' | 'worker' | 'customer';
export type UserStatus = 'active' | 'warned' | 'suspended' | 'banned';
export type AuthProviderType = 'phone' | 'google' | 'demo';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface User {
  uid: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  authProvider?: AuthProviderType;
  googleLinked?: boolean;
  status: UserStatus;
  suspendedUntil?: string;
  banReason?: string;
  areaId?: string;
  fcmTokens?: string[];
  emergencyContact?: EmergencyContact;
  rating?: number;
  ratingCount?: number;
  favoriteWorkers?: string[];
  savedAddresses?: { id: string; label: string; address: string; lat: number; lng: number }[];
  createdAt: string;
  lastLoginAt?: string;
}
