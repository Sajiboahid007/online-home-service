export type TransactionType = 
  | 'job_payment' 
  | 'commission' 
  | 'withdraw' 
  | 'due_payment' 
  | 'subscription' 
  | 'refund' 
  | 'featured';

export interface Transaction {
  id: string;
  jobId?: string;
  workerId?: string;
  customerId?: string;
  type: TransactionType;
  amount: number;
  method: 'cash' | 'bkash' | 'nagad' | 'card';
  status: 'pending' | 'success' | 'failed';
  gatewayRef?: string;
  description?: string;
  createdAt: string;
}
