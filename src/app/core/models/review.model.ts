export interface Review {
  id: string;
  jobId: string;
  fromUid: string;
  fromName: string;
  fromPhoto?: string;
  toUid: string;
  toRole: 'worker' | 'customer';
  stars: number;
  comment: string;
  tags: string[];
  isHidden: boolean;
  createdAt: string;
}
