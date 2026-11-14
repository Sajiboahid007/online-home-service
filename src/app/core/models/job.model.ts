import { GeoPoint } from './worker.model';

export type JobType = 'instant' | 'direct' | 'scheduled' | 'board_fixed' | 'board_bid';

export type JobStatus = 
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'reviewed'
  | 'cancelled_by_customer'
  | 'cancelled_by_worker'
  | 'disputed'
  | 'no_worker_found';

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'card';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface JobTimeline {
  createdAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface JobOffer {
  workerId: string;
  sentAt: string;
  expiresAt: string;
  status: 'sent' | 'accepted' | 'rejected' | 'expired';
  distanceKm: number;
  score: number;
}

export interface JobBid {
  id: string;
  workerId: string;
  workerName: string;
  workerPhoto?: string;
  workerRating: number;
  amount: number;
  message?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: 'customer' | 'worker';
  text: string;
  imageURL?: string;
  voiceNoteURL?: string;
  voiceDurationSec?: number;
  createdAt: string;
}

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerRating?: number;
  workerId?: string | null;
  workerName?: string;
  workerPhone?: string;
  workerPhoto?: string;
  categoryId: string;
  categoryName: string;
  areaId: string;
  type: JobType;
  description: string;
  photos: string[];
  /** Service location. When `locationPinned` is true this is the customer's exact doorstep pin. */
  location: GeoPoint;
  /** Customer dragged the pin onto their exact building/gate. */
  locationPinned?: boolean;
  /** Short directions for the technician, e.g. "blue gate beside Rahim Pharmacy, 3rd floor". */
  landmark?: string;
  /** Optional small photo of the gate/building entrance (JPEG data URL). */
  doorPhotoURL?: string;
  scheduledAt?: string;
  status: JobStatus;
  estimatedPrice: number;
  finalPrice?: number;
  materialCost?: number;
  commission?: number;
  platformFee?: number;
  workerEarning?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  startOtp: string; // 4-digit code shown to customer
  searchRadiusKm?: number;
  dispatchRound?: number;
  timeline: JobTimeline;
  cancelledBy?: string;
  cancelReason?: string;
  cancellationFee?: number;
  beforeWorkPhoto?: string;
  afterWorkPhoto?: string;
  materialReceiptPhoto?: string;
  renegotiatedPrice?: number;
  renegotiationStatus?: 'pending' | 'accepted' | 'rejected';
  materialApprovalStatus?: 'pending' | 'accepted' | 'rejected';
  couponCode?: string;
  couponDiscount?: number;
  bids?: JobBid[];
}
