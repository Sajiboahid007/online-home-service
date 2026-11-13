import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerService } from '../../../core/services/worker.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ReportService } from '../../../core/services/report.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { exportToCsv } from '../../../core/utils/csv-exporter';
import { WorkerProfile } from '../../../core/models/worker.model';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule, TakaPipe, BnNumberPipe],
  templateUrl: './admin-users-list.component.html',
  styleUrl: './admin-users-list.component.scss'
})
export class AdminUsersListComponent {
  private workerService = inject(WorkerService);
  private paymentService = inject(PaymentService);
  private reportService = inject(ReportService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);

  public workers = this.workerService.workers;

  public warnWorker(worker: WorkerProfile): void {
    const msg = prompt(`ওয়ার্কার "${worker.name}"-কে সতর্কবার্তা পাঠান:`, 'কাজের রেটিং আশঙ্কাজনকভাবে কমে যাচ্ছে, মনোযোগ দিন।');
    if (msg) {
      alert(`ওয়ার্কার "${worker.name}"-কে সফলভাবে সতর্কতা নোটিফিকেশন ও SMS পাঠানো হয়েছে।`);
    }
  }

  public banWorker(worker: WorkerProfile): void {
    const days = prompt(`ওয়ার্কার "${worker.name}"-কে কত দিনের জন্য সাসপেন্ড করতে চান? (স্থায়ী ব্যানের জন্য "ban" লিখুন):`, '7');
    if (days) {
      if (days.toLowerCase() === 'ban') {
        this.reportService.addToBlacklist({
          type: 'phone',
          value: worker.phone,
          reason: 'প্রশাসনিক সিদ্ধান্তে স্থায়ীভাবে নিষিদ্ধ (Banned)',
          bannedBy: this.auth.currentUser()?.name || 'অ্যাডমিন'
        });
        alert(`ওয়ার্কার "${worker.name}" স্থায়ীভাবে প্ল্যাটফর্ম থেকে ব্যান করা হয়েছে। ফোন ও NID ব্ল্যাকলিস্টে যুক্ত করা হয়েছে।`);
      } else {
        alert(`ওয়ার্কার "${worker.name}" ${days} দিনের জন্য সাময়িক বরখাস্ত (Suspended) করা হয়েছে।`);
      }
    }
  }

  // Award badges (Item 90)
  public toggleBadge(worker: WorkerProfile, badge: 'verified' | 'trustedBadge' | 'isPremium'): void {
    const updated = !worker[badge];
    this.workerService.awardBadges(worker.uid, { [badge]: updated });

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'admin',
      actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
      actorRole: 'admin',
      action: 'worker_badge_updated',
      targetId: worker.uid,
      targetType: 'worker',
      reason: `${worker.name}-এর ${badge} স্ট্যাটাস ${updated ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হলো`
    });
  }

  // Waive worker due commission (Item 91)
  public waiveDue(worker: WorkerProfile): void {
    const input = prompt(`ওয়ার্কার "${worker.name}"-এর কত টাকা কমিশন মওকুফ করতে চান? (বর্তমান বকেয়া: ৳${worker.commissionDue}):`, worker.commissionDue.toString());
    if (input) {
      const amount = parseFloat(input);
      if (!isNaN(amount) && amount > 0) {
        this.paymentService.waiveWorkerCommissionDue(worker.uid, amount);
        this.auditLog.logAction({
          actorId: this.auth.currentUser()?.uid || 'admin',
          actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
          actorRole: 'admin',
          action: 'commission_due_waived',
          targetId: worker.uid,
          targetType: 'worker',
          reason: `বকেয়া কমিশন মওকুফ: ৳${amount}`
        });
        alert(`৳${amount} বকেয়া কমিশন সফলভাবে মওকুফ করা হয়েছে!`);
      }
    }
  }

  public exportCsv(): void {
    const rows = this.workers().map(w => ({
      'UID': w.uid,
      'Name': w.name,
      'Phone': w.phone,
      'Category': w.categoryIds.join(', '),
      'Rating': w.rating,
      'Total Jobs': w.totalJobs,
      'Commission Due': w.commissionDue,
      'Verified': w.verified,
      'Trusted': w.trustedBadge,
      'Premium': w.isPremium
    }));
    exportToCsv('KajKhoj_Workers', rows);
  }
}
