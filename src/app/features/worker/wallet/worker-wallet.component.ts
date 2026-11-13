import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WorkerService } from '../../../core/services/worker.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { JobService } from '../../../core/services/job.service';
import { WorkerProfile } from '../../../core/models/worker.model';
import { Transaction } from '../../../core/models/transaction.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-worker-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BnNumberPipe, TakaPipe, TimeAgoPipe],
  templateUrl: './worker-wallet.component.html',
  styleUrl: './worker-wallet.component.scss'
})
export class WorkerWalletComponent {
  // Current active worker computed reactively
  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    return this.workerService.getWorkerById(uid) || authWorker || this.workerService.workers()[0] || null;
  });

  // Dialog Controls
  public showRepayModal = signal<boolean>(false);
  public showWithdrawModal = signal<boolean>(false);

  // Repayment form state
  public repayMethod = signal<'bkash' | 'nagad'>('bkash');
  public repayAmount = signal<number>(0);
  public repayPhone = signal<string>('');
  public repayPin = signal<string>('••••');
  public repaySuccessMessage = signal<string | null>(null);
  public repayErrorMessage = signal<string | null>(null);

  // Withdraw form state
  public withdrawMethod = signal<'bkash' | 'nagad'>('bkash');
  public withdrawAmount = signal<number>(500);
  public withdrawPhone = signal<string>('');
  public withdrawSuccessMessage = signal<string | null>(null);
  public withdrawErrorMessage = signal<string | null>(null);

  // Transactions filter
  public txFilter = signal<string>('all');

  // Transactions for current worker
  public transactions = computed<Transaction[]>(() => {
    const worker = this.currentWorker();
    if (!worker) return [];
    const list = this.paymentService.getWorkerTransactions(worker.uid);
    const filter = this.txFilter();
    if (filter === 'all') return list;
    return list.filter(t => t.type === filter);
  });

  // Commission due percentage towards 500 BDT limit
  public dueProgressPercent = computed<number>(() => {
    const due = this.currentWorker()?.commissionDue || 0;
    const pct = Math.min(100, Math.round((due / 500) * 100));
    return pct;
  });

  // Total Lifetime earnings computed
  public totalEarnings = computed<number>(() => {
    const worker = this.currentWorker();
    if (!worker) return 0;
    const completedJobs = this.jobService.jobs().filter(j => 
      j.workerId === worker.uid && (j.status === 'completed' || j.status === 'paid')
    );
    const sum = completedJobs.reduce((acc, j) => acc + (j.workerEarning || 0), 0);
    return sum > 0 ? sum : 4250; // demo figure if no stored jobs
  });

  constructor(
    public workerService: WorkerService,
    public paymentService: PaymentService,
    public authService: AuthService,
    public jobService: JobService
  ) {}

  // Open Repayment Modal
  public openRepayModal(): void {
    const worker = this.currentWorker();
    this.repayAmount.set(worker?.commissionDue || 0);
    this.repayPhone.set(worker?.phone || '01711223344');
    this.repaySuccessMessage.set(null);
    this.repayErrorMessage.set(null);
    this.showRepayModal.set(true);
  }

  public closeRepayModal(): void {
    this.showRepayModal.set(false);
  }

  public submitRepayment(): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const amt = this.repayAmount();
    if (amt <= 0) {
      this.repayErrorMessage.set('পরিশোধের পরিমাণ অবশ্যই ৳১ বা তার বেশি হতে হবে।');
      return;
    }

    const res = this.paymentService.payDueCommission(worker.uid, amt, this.repayMethod());
    if (res.success) {
      this.repaySuccessMessage.set(res.message);
      this.repayErrorMessage.set(null);
      setTimeout(() => {
        this.closeRepayModal();
      }, 1500);
    } else {
      this.repayErrorMessage.set(res.message);
    }
  }

  // Open Withdraw Modal
  public openWithdrawModal(): void {
    const worker = this.currentWorker();
    this.withdrawAmount.set(Math.min(worker?.walletBalance || 0, 500));
    this.withdrawPhone.set(worker?.phone || '01711223344');
    this.withdrawSuccessMessage.set(null);
    this.withdrawErrorMessage.set(null);
    this.showWithdrawModal.set(true);
  }

  public closeWithdrawModal(): void {
    this.showWithdrawModal.set(false);
  }

  public submitWithdrawal(): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const amt = this.withdrawAmount();
    if (amt < 100) {
      this.withdrawErrorMessage.set('সর্বনিম্ন উত্তোলনের পরিমাণ ৳১০০।');
      return;
    }
    if (amt > worker.walletBalance) {
      this.withdrawErrorMessage.set('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।');
      return;
    }

    const res = this.paymentService.requestWithdraw(worker.uid, amt, this.withdrawMethod());
    if (res.success) {
      this.withdrawSuccessMessage.set(res.message);
      this.withdrawErrorMessage.set(null);
      setTimeout(() => {
        this.closeWithdrawModal();
      }, 1500);
    } else {
      this.withdrawErrorMessage.set(res.message);
    }
  }
}
