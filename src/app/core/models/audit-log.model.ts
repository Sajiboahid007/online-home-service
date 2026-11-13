export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetId: string;
  targetType: 'user' | 'worker' | 'job' | 'pricing' | 'area' | 'category' | 'settings';
  before?: any;
  after?: any;
  reason?: string;
  createdAt: string;
}
