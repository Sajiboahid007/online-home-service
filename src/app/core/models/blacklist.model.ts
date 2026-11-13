export type BlacklistType = 'phone' | 'nid' | 'device';

export interface BlacklistItem {
  id: string;
  type: BlacklistType;
  value: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
}

export interface UserAppeal {
  id: string;
  uid: string;
  userName: string;
  userPhone: string;
  userRole: string;
  reason: string;
  explanation: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
}
