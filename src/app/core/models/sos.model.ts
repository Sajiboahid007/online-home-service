export interface SOSAlert {
  id: string;
  uid: string;
  jobId?: string;
  userName: string;
  userPhone: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'active' | 'resolved' | 'false_alarm';
  handledBy?: string;
  resolutionNote?: string;
  createdAt: string;
}
