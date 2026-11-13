import { Injectable, signal, inject } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { WorkerService } from './worker.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private workerService = inject(WorkerService);
  private notificationService = inject(NotificationService);

  private defaultTransactions: Transaction[] = [
    {
      id: 'tx_101',
      jobId: 'job_demo_101',
      workerId: 'worker_rahim_1',
      customerId: 'user_customer_demo_1',
      type: 'job_payment',
      amount: 400,
      method: 'cash',
      status: 'success',
      description: 'বাথরুমের সিঙ্ক পাইপ মেরামত',
      createdAt: '2026-11-10T12:05:00Z'
    },
    {
      id: 'tx_102',
      jobId: 'job_demo_101',
      workerId: 'worker_rahim_1',
      type: 'commission',
      amount: 60,
      method: 'cash',
      status: 'success',
      description: 'প্ল্যাটফর্ম কমিশন বকেয়া',
      createdAt: '2026-11-10T12:05:00Z'
    },
    {
      id: 'tx_wd_demo',
      workerId: 'worker_korim_2',
      type: 'withdraw',
      amount: 1500,
      method: 'bkash',
      status: 'pending',
      description: 'bKash নম্বরে (01819876543) টাকা উত্তোলন',
      createdAt: '2026-11-12T16:00:00Z'
    }
  ];

  private transactionsSignal = signal<Transaction[]>([]);
  public transactions = this.transactionsSignal.asReadonly();

  constructor() {
    this.loadTransactions();
  }

  private loadTransactions(): void {
    const saved = localStorage.getItem('kajkhoj_transactions');
    if (saved) {
      try {
        this.transactionsSignal.set(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    this.transactionsSignal.set(this.defaultTransactions);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem('kajkhoj_transactions', JSON.stringify(this.transactionsSignal()));
  }

  public getWorkerTransactions(workerId: string): Transaction[] {
    return this.transactionsSignal().filter(t => t.workerId === workerId);
  }

  public payDueCommission(workerId: string, amount: number, method: 'bkash' | 'nagad'): { success: boolean; message: string } {
    const worker = this.workerService.getWorkerById(workerId);
    if (!worker) return { success: false, message: 'ওয়ার্কার পাওয়া যায়নি' };

    const newDue = Math.max(0, worker.commissionDue - amount);
    this.workerService.updateWorker({
      ...worker,
      commissionDue: newDue
    });

    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      workerId,
      type: 'due_payment',
      amount,
      method,
      status: 'success',
      description: `${method.toUpperCase()} মাধ্যমে বকেয়া কমিশন পরিশোধ`,
      gatewayRef: `BKASH_${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString()
    };

    this.transactionsSignal.update(list => [tx, ...list]);
    this.saveToStorage();
    return { success: true, message: `৳${amount} বকেয়া কমিশন সফলভাবে পরিশোধ করা হয়েছে!` };
  }

  public requestWithdraw(workerId: string, amount: number, method: 'bkash' | 'nagad', accountPhone?: string): { success: boolean; message: string } {
    const worker = this.workerService.getWorkerById(workerId);
    if (!worker) return { success: false, message: 'ওয়ার্কার পাওয়া যায়নি' };
    if (worker.walletBalance < amount) return { success: false, message: 'ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।' };

    this.workerService.updateWorker({
      ...worker,
      walletBalance: worker.walletBalance - amount
    });

    const tx: Transaction = {
      id: `tx_wd_${Date.now()}`,
      workerId,
      type: 'withdraw',
      amount,
      method,
      status: 'pending',
      description: `${method.toUpperCase()} (${accountPhone || worker.phone}) নম্বরে টাকা উত্তোলনের অনুরোধ`,
      createdAt: new Date().toISOString()
    };

    this.transactionsSignal.update(list => [tx, ...list]);
    this.saveToStorage();

    this.notificationService.addNotification({
      userId: 'admin',
      title: 'নতুন টাকা উত্তোলনের অনুরোধ 💸',
      body: `${worker.name} ৳${amount} উত্তোলনের অনুরোধ পাঠিয়েছেন (${method.toUpperCase()})।`,
      type: 'payment',
      link: '/admin/transactions'
    });

    return { success: true, message: `৳${amount} টাকা উত্তোলনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন রিভিউ করে টাকা পাঠাবে।` };
  }

  // Admin approves withdrawal (Item 67)
  public approveWithdrawal(txId: string): boolean {
    let approved = false;
    this.transactionsSignal.update(list => list.map(t => {
      if (t.id === txId) {
        approved = true;
        return {
          ...t,
          status: 'success',
          gatewayRef: `TRX_${Math.floor(10000000 + Math.random() * 90000000)}`
        };
      }
      return t;
    }));
    if (approved) {
      this.saveToStorage();
      const tx = this.transactionsSignal().find(t => t.id === txId);
      if (tx?.workerId) {
        this.notificationService.addNotification({
          userId: tx.workerId,
          title: 'উত্তোলন অনুমোদিত হয়েছে! 💰',
          body: `আপনার ৳${tx.amount} টাকার উত্তোলন সম্পন্ন হয়েছে।`,
          type: 'payment',
          link: '/worker/wallet'
        });
      }
    }
    return approved;
  }

  // Admin rejects withdrawal and refunds to worker wallet
  public rejectWithdrawal(txId: string, reason: string): boolean {
    let tx: Transaction | undefined;
    this.transactionsSignal.update(list => list.map(t => {
      if (t.id === txId) {
        tx = t;
        return {
          ...t,
          status: 'failed',
          description: `${t.description} (প্রত্যাখ্যাত: ${reason})`
        };
      }
      return t;
    }));

    if (tx && tx.workerId) {
      // Refund balance to worker wallet
      const worker = this.workerService.getWorkerById(tx.workerId);
      if (worker) {
        this.workerService.updateWorker({
          ...worker,
          walletBalance: worker.walletBalance + tx.amount
        });
      }
      this.saveToStorage();

      this.notificationService.addNotification({
        userId: tx.workerId,
        title: 'উত্তোলন অনুরোধ প্রত্যাখ্যাত ⚠️',
        body: `৳${tx.amount} উত্তোলন প্রত্যাখ্যাত হয়েছে। কারণ: ${reason}। টাকা ওয়ালেটে ফেরত দেওয়া হয়েছে।`,
        type: 'payment',
        link: '/worker/wallet'
      });
      return true;
    }
    return false;
  }

  // Customer online payment processing (Item 65)
  public processCustomerPayment(jobId: string, amount: number, method: 'cash' | 'bkash' | 'nagad' | 'card', workerId?: string): { success: boolean; trxId: string; invoiceId: string } {
    const trxId = `PAY_${method.toUpperCase()}_${Date.now()}`;
    const invoiceId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const tx: Transaction = {
      id: trxId,
      jobId,
      workerId,
      type: 'job_payment',
      amount,
      method,
      status: 'success',
      gatewayRef: trxId,
      description: `কাজের বিল পরিশোধ (${method.toUpperCase()}) - ${invoiceId}`,
      createdAt: new Date().toISOString()
    };

    this.transactionsSignal.update(list => [tx, ...list]);
    this.saveToStorage();

    return {
      success: true,
      trxId,
      invoiceId
    };
  }

  // Admin waives worker commission due (Item 91)
  public waiveWorkerCommissionDue(workerId: string, amount?: number): void {
    const worker = this.workerService.getWorkerById(workerId);
    if (!worker) return;

    const waivedAmount = amount !== undefined ? Math.min(worker.commissionDue, amount) : worker.commissionDue;
    const newDue = Math.max(0, worker.commissionDue - waivedAmount);

    this.workerService.updateWorker({
      ...worker,
      commissionDue: newDue
    });

    const tx: Transaction = {
      id: `tx_waive_${Date.now()}`,
      workerId,
      type: 'due_payment',
      amount: waivedAmount,
      method: 'cash',
      status: 'success',
      description: `অ্যাডমিন কর্তৃক ৳${waivedAmount} বকেয়া কমিশন মওকুফ`,
      createdAt: new Date().toISOString()
    };

    this.transactionsSignal.update(list => [tx, ...list]);
    this.saveToStorage();

    this.notificationService.addNotification({
      userId: workerId,
      title: 'কমিশন মওকুফ করা হয়েছে! 🎉',
      body: `কর্তৃপক্ষ আপনার ৳${waivedAmount} বকেয়া কমিশন মওকুফ করেছেন।`,
      type: 'info',
      link: '/worker/wallet'
    });
  }

  // Premium worker subscription (Item 62, 32)
  public subscribePremium(workerId: string, months: number = 1): { success: boolean; message: string } {
    const worker = this.workerService.getWorkerById(workerId);
    if (!worker) return { success: false, message: 'কারিগর পাওয়া যায়নি' };

    const cost = 299 * months;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    this.workerService.updateWorker({
      ...worker,
      isPremium: true,
      premiumUntil: expiry.toISOString()
    });

    const tx: Transaction = {
      id: `tx_prem_${Date.now()}`,
      workerId,
      type: 'job_payment',
      amount: cost,
      method: 'bkash',
      status: 'success',
      description: `প্রিমিয়াম সাবস্ক্রিপশন ফি (${months} মাস)`,
      createdAt: new Date().toISOString()
    };

    this.transactionsSignal.update(list => [tx, ...list]);
    this.saveToStorage();

    this.notificationService.addNotification({
      userId: workerId,
      title: 'প্রিমিয়াম সদস্যপদ সক্রিয় হয়েছে! ⭐',
      body: `অভিনন্দন! আপনার প্রিমিয়াম প্যাকেজ সক্রিয় হয়েছে। এখন পাবেন ১০% কমিশন ও গোল্ড ব্যাজ।`,
      type: 'info',
      link: '/worker/dashboard'
    });

    return { success: true, message: `অভিনন্দন! প্রিমিয়াম সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।` };
  }
}
