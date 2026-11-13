export type ReportType = 
  | 'behavior' 
  | 'theft' 
  | 'harassment' 
  | 'overcharge' 
  | 'no_show' 
  | 'quality' 
  | 'other';

export type ReportSeverity = 'low' | 'medium' | 'high';
export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'rejected';

export interface Report {
  id: string;
  jobId?: string;
  reporterId: string;
  reporterName: string;
  againstId: string;
  againstName: string;
  type: ReportType;
  severity: ReportSeverity;
  description: string;
  evidence: string[];
  status: ReportStatus;
  assignedAdmin?: string;
  resolution?: string;
  createdAt: string;
}
