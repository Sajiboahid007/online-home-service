import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { exportToCsv } from '../../../core/utils/csv-exporter';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, TakaPipe, BnNumberPipe],
  templateUrl: './admin-transactions.component.html',
  styleUrls: ['./admin-transactions.component.scss']
})
export class AdminTransactionsComponent {
  private paymentService = inject(PaymentService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);

  public transactions = this.paymentService.transactions;

  public pendingWithdrawals = computed(() => {
    return this.transactions().filter(t => t.type === 'withdraw' && t.status === 'pending');
  });

  public approve(txId: string): void {
    if (confirm('আপনি কি এই উত্তোলন অনুরোধ অনুমোদন করতে চান?')) {
      this.paymentService.approveWithdrawal(txId);

      this.auditLog.logAction({
        actorId: this.auth.currentUser()?.uid || 'admin',
        actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
        actorRole: 'admin',
        action: 'withdrawal_approved',
        targetId: txId,
        targetType: 'user',
        reason: 'টাকা উত্তোলনের ব্যাংক/মোবাইল ব্যাংকিং লেনদেন সফল'
      });
    }
  }

  public reject(txId: string): void {
    const reason = prompt('প্রত্যাখ্যানের কারণ লিখুন:', 'অ্যাকাউন্ট নম্বরে অমিল বা অপর্যাপ্ত ব্যালেন্স');
    if (reason) {
      this.paymentService.rejectWithdrawal(txId, reason);

      this.auditLog.logAction({
        actorId: this.auth.currentUser()?.uid || 'admin',
        actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
        actorRole: 'admin',
        action: 'withdrawal_rejected',
        targetId: txId,
        targetType: 'user',
        reason: `উত্তোলন বাতিল: ${reason}`
      });
    }
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
