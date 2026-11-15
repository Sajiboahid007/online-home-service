import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { exportToCsv } from '../../../core/utils/csv-exporter';
import { Transaction } from '../../../core/models/transaction.model';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, TakaPipe, BnNumberPipe],
  templateUrl: './admin-transactions.component.html',
  styleUrls: ['./admin-transactions.component.scss']
})
export class AdminTransactionsComponent {
  public theme = inject(ThemeService);
  private paymentService = inject(PaymentService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);
  private workerService = inject(WorkerService);
  private toast = inject(ToastService);

  public transactions = this.paymentService.transactions;

  // Modal States
  public showApproveModal = signal<boolean>(false);
  public showRejectModal = signal<boolean>(false);
  public selectedTx = signal<Transaction | null>(null);
  public trxRef = signal<string>('');
  public rejectReason = signal<string>('অ্যাকাউন্ট নম্বরে অমিল বা ভুল নম্বর');
  public customRejectNote = signal<string>('');

  public pendingWithdrawals = computed(() => {
    return this.transactions().filter(t => t.type === 'withdraw' && t.status === 'pending');
  });

  public getWorkerName(workerId?: string): string {
    if (!workerId) return 'অজ্ঞাত কারিগর';
    const worker = this.workerService.getWorkerById(workerId);
    return worker ? worker.name : workerId;
  }

  public getWorkerPhone(workerId?: string): string {
    if (!workerId) return '';
    const worker = this.workerService.getWorkerById(workerId);
    return worker ? worker.phone : '';
  }

  public openApproveModal(tx: Transaction): void {
    this.selectedTx.set(tx);
    const randomRef = 'TRX' + Math.floor(10000000 + Math.random() * 90000000);
    this.trxRef.set(randomRef);
    this.showApproveModal.set(true);
  }

  public closeApproveModal(): void {
    this.showApproveModal.set(false);
    this.selectedTx.set(null);
  }

  public confirmApprove(): void {
    const tx = this.selectedTx();
    if (!tx) return;

    this.paymentService.approveWithdrawal(tx.id);

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'admin',
      actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
      actorRole: 'admin',
      action: 'withdrawal_approved',
      targetId: tx.id,
      targetType: 'user',
      reason: `টাকা উত্তোলনের ব্যাংক/MFS লেনদেন সফল। রেফারেন্স: ${this.trxRef()}`
    });

    const isBn = this.theme.currentLang() === 'bn';
    this.toast.success(
      isBn
        ? `অনুরোধ #${tx.id} সফলভাবে অনুমোদিত হয়েছে (৳${tx.amount})!`
        : `Withdrawal request #${tx.id} approved successfully (৳${tx.amount})!`
    );

    this.closeApproveModal();
  }

  public openRejectModal(tx: Transaction): void {
    this.selectedTx.set(tx);
    this.rejectReason.set('অ্যাকাউন্ট নম্বরে অমিল বা ভুল নম্বর');
    this.customRejectNote.set('');
    this.showRejectModal.set(true);
  }

  public closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedTx.set(null);
  }

  public confirmReject(): void {
    const tx = this.selectedTx();
    if (!tx) return;

    const fullReason = this.customRejectNote().trim()
      ? `${this.rejectReason()} - ${this.customRejectNote().trim()}`
      : this.rejectReason();

    this.paymentService.rejectWithdrawal(tx.id, fullReason);

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'admin',
      actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
      actorRole: 'admin',
      action: 'withdrawal_rejected',
      targetId: tx.id,
      targetType: 'user',
      reason: `উত্তোলন বাতিল: ${fullReason}`
    });

    const isBn = this.theme.currentLang() === 'bn';
    this.toast.warn(
      isBn
        ? `অনুরোধ #${tx.id} বাতিল করা হয়েছে এবং ৳${tx.amount} কারিগরের ওয়ালেটে ফেরত গেছে।`
        : `Withdrawal #${tx.id} rejected. ৳${tx.amount} refunded to worker's wallet.`
    );

    this.closeRejectModal();
  }

  public exportCsv(): void {
    const rows = this.transactions().map(t => ({
      'Transaction ID': t.id,
      'Type': t.type,
      'Worker ID': t.workerId || '',
      'Amount': t.amount,
      'Method': t.method,
      'Status': t.status,
      'Description': t.description,
      'Created At': t.createdAt
    }));
    exportToCsv('KajKhoj_Transactions', rows);
  }
}
