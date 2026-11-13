export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'job_offer' | 'job_status' | 'due_warning' | 'safety' | 'payment' | 'admin' | 'info';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
