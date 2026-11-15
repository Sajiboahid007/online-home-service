import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../../core/services/worker.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ReportService } from '../../../core/services/report.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { FirebaseService } from '../../../core/services/firebase.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { exportToCsv } from '../../../core/utils/csv-exporter';
import { WorkerProfile } from '../../../core/models/worker.model';
import { User } from '../../../core/models/user.model';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { collection, getDocs, query } from 'firebase/firestore';

@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TakaPipe, BnNumberPipe],
  templateUrl: './admin-users-list.component.html',
  styleUrl: './admin-users-list.component.scss'
})
export class AdminUsersListComponent implements OnInit {
  public theme = inject(ThemeService);
  public Math = Math;
  private workerService = inject(WorkerService);
  private paymentService = inject(PaymentService);
  private reportService = inject(ReportService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);
  private seedData = inject(SeedDataService);
  private firebaseService = inject(FirebaseService);
  private toast = inject(ToastService);

  public activeTab = signal<'customers' | 'workers' | 'admins'>('customers');
  public workers = this.workerService.workers;
  public customers = signal<User[]>([]);
  public admins = signal<User[]>([]);

  // Action Modals State
  public showWarnModal = signal<boolean>(false);
  public showBanModal = signal<boolean>(false);
  public showWaiveModal = signal<boolean>(false);

  public selectedUser = signal<User | null>(null);
  public selectedWorker = signal<WorkerProfile | null>(null);

  public warnMessage = signal<string>('অনুগ্রহ করে প্ল্যাটফর্মের নিয়মাবলী ও আচরণবিধি মেনে চলুন।');
  public banType = signal<'suspend' | 'permanent'>('suspend');
  public suspendDays = signal<number>(7);
  public banReason = signal<string>('নিয়ম লঙ্ঘন ও অনৈতিক আচরণ');
  public customBanNote = signal<string>('');
  public waiveAmount = signal<number>(0);

  ngOnInit(): void {
    this.loadUsers();
  }

  public async loadUsers(): Promise<void> {
    // 1. Initial local load
    this.customers.set(this.seedData.defaultUsers.filter(u => u.role === 'customer'));
    this.admins.set(this.seedData.defaultUsers.filter(u => u.role === 'admin' || u.role === 'superadmin'));

    // 2. Fetch from Firestore if live
    try {
      if (this.firebaseService?.db) {
        const snap = await getDocs(collection(this.firebaseService.db, 'users'));
        if (!snap.empty) {
          const allUsers = snap.docs.map(d => d.data() as User);
          const custs = allUsers.filter(u => u.role === 'customer');
          const adms = allUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
          if (custs.length > 0) this.customers.set(custs);
          if (adms.length > 0) this.admins.set(adms);
        }
      }
    } catch (e) {
      console.warn('Firestore live users load fallback:', e);
    }
  }

  // --- WARN MODAL ACTIONS ---
  public openWarnModal(entity: User | WorkerProfile, isWorker = false): void {
    if (isWorker) {
      this.selectedWorker.set(entity as WorkerProfile);
      this.selectedUser.set(null);
      this.warnMessage.set('আপনার কাজের রেটিং আশঙ্কাজনকভাবে কমে যাচ্ছে অথবা গ্রাহক অসন্তোষ প্রকাশ করেছেন। অনুগ্রহ করে প্ল্যাটফর্মের নির্দেশিকা মেনে সেবার মান নিশ্চিত করুন।');
    } else {
      this.selectedUser.set(entity as User);
      this.selectedWorker.set(null);
      this.warnMessage.set('অনুগ্রহ করে প্ল্যাটফর্মের ব্যবহারবিধি ও নির্দেশিকা মেনে চলুন। বারবার অনাকাঙ্ক্ষিত অর্ডার বাতিল প্ল্যাটফর্ম নিরাপত্তা নীতিমালা লঙ্ঘন করে।');
    }
    this.showWarnModal.set(true);
  }

  public closeWarnModal(): void {
    this.showWarnModal.set(false);
    this.selectedUser.set(null);
    this.selectedWorker.set(null);
  }

  public confirmSendWarning(): void {
    const user = this.selectedUser();
    const worker = this.selectedWorker();
    const name = user?.name || worker?.name || 'ব্যবহারকারী';
    const msg = this.warnMessage().trim();

    if (!msg) {
      this.toast.warn(this.theme.currentLang() === 'bn' ? 'সতর্কবার্তার বিবরণ লিখুন।' : 'Please enter warning message.');
      return;
    }

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'admin',
      actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
      actorRole: 'admin',
      action: 'warning_sent',
      targetId: user?.uid || worker?.uid || '',
      targetType: user ? 'user' : 'worker',
      reason: `সতর্কবার্তা প্রেরণ: ${msg}`
    });

    const isBn = this.theme.currentLang() === 'bn';
    this.toast.success(
      isBn 
        ? `"${name}"-কে সফলভাবে সতর্কতা নোটিফিকেশন ও SMS পাঠানো হয়েছে।` 
        : `Warning notice sent successfully to "${name}".`
    );

    this.closeWarnModal();
  }

  // --- BAN / SUSPEND MODAL ACTIONS ---
  public openBanModal(entity: User | WorkerProfile, isWorker = false): void {
    if (isWorker) {
      this.selectedWorker.set(entity as WorkerProfile);
      this.selectedUser.set(null);
      this.banType.set('suspend');
      this.suspendDays.set(7);
    } else {
      this.selectedUser.set(entity as User);
      this.selectedWorker.set(null);
      this.banType.set('permanent');
    }
    this.banReason.set('নিয়ম লঙ্ঘন ও অনৈতিক আচরণ');
    this.customBanNote.set('');
    this.showBanModal.set(true);
  }

  public closeBanModal(): void {
    this.showBanModal.set(false);
    this.selectedUser.set(null);
    this.selectedWorker.set(null);
  }

  public confirmBanAction(): void {
    const user = this.selectedUser();
    const worker = this.selectedWorker();
    const name = user?.name || worker?.name || 'ব্যবহারকারী';
    const phone = user?.phone || worker?.phone || '';
    const uid = user?.uid || worker?.uid || '';
    const fullReason = this.customBanNote().trim()
      ? `${this.banReason()} (${this.customBanNote().trim()})`
      : this.banReason();

    const isBn = this.theme.currentLang() === 'bn';

    if (this.banType() === 'permanent' || user) {
      this.reportService.addToBlacklist({
        type: 'phone',
        value: phone,
        reason: fullReason,
        bannedBy: this.auth.currentUser()?.name || 'অ্যাডমিন'
      });

      this.auditLog.logAction({
        actorId: this.auth.currentUser()?.uid || 'admin',
        actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
        actorRole: 'admin',
        action: 'user_banned',
        targetId: uid,
        targetType: user ? 'user' : 'worker',
        reason: `স্থায়ী ব্ল্যাকলিস্ট ব্যান: ${fullReason}`
      });

      this.toast.warn(
        isBn
          ? `"${name}" (${phone})-কে স্থায়ীভাবে প্ল্যাটফর্ম থেকে নিষিদ্ধ (Banned) করা হয়েছে।`
          : `"${name}" (${phone}) has been permanently banned & blacklisted.`
      );
    } else {
      const days = this.suspendDays() || 7;
      this.auditLog.logAction({
        actorId: this.auth.currentUser()?.uid || 'admin',
        actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
        actorRole: 'admin',
        action: 'worker_suspended',
        targetId: uid,
        targetType: 'worker',
        reason: `${days} দিনের জন্য সাময়িক বরখাস্ত: ${fullReason}`
      });

      this.toast.warn(
        isBn
          ? `ওয়ার্কার "${name}"-কে ${days} দিনের জন্য সাময়িক বরখাস্ত (Suspended) করা হয়েছে।`
          : `Worker "${name}" has been suspended for ${days} days.`
      );
    }

    this.closeBanModal();
  }

  // --- WAIVE COMMISSION MODAL ACTIONS ---
  public openWaiveModal(worker: WorkerProfile): void {
    this.selectedWorker.set(worker);
    this.waiveAmount.set(worker.commissionDue || 0);
    this.showWaiveModal.set(true);
  }

  public closeWaiveModal(): void {
    this.showWaiveModal.set(false);
    this.selectedWorker.set(null);
  }

  public confirmWaive(): void {
    const worker = this.selectedWorker();
    if (!worker) return;

    const amount = Number(this.waiveAmount());
    if (isNaN(amount) || amount <= 0) {
      this.toast.warn(this.theme.currentLang() === 'bn' ? 'সঠিক পরিমাণ উল্লেখ করুন।' : 'Please enter a valid amount.');
      return;
    }

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

    const isBn = this.theme.currentLang() === 'bn';
    this.toast.success(
      isBn 
        ? `ওয়ার্কার "${worker.name}"-এর ৳${amount} বকেয়া কমিশন সফলভাবে মওকুফ করা হয়েছে!` 
        : `৳${amount} due commission waived for "${worker.name}"!`
    );

    this.closeWaiveModal();
  }

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
