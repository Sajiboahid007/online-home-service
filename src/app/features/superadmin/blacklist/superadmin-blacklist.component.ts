import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { SettingsService } from '../../../core/services/settings.service';
import { ReportService } from '../../../core/services/report.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { BlacklistType } from '../../../core/models/blacklist.model';

@Component({
  selector: 'app-superadmin-blacklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-blacklist.component.html',
  styleUrls: ['./superadmin-blacklist.component.scss']
})
export class SuperadminBlacklistComponent {
  public theme = inject(ThemeService);
  private settingsService = inject(SettingsService);
  private reportService = inject(ReportService);
  private auditLogService = inject(AuditLogService);
  private notificationService = inject(NotificationService);
  private confirmation = inject(ConfirmationService);

  public activeTab = signal<'rules' | 'blacklist' | 'appeals'>('rules');

  // Ban rules
  public warnRating = 3.5;
  public suspendRating = 2.5;
  public minJobsForRating = 10;
  public maxCancelRate = 20;

  // Blacklist
  public blacklist = this.reportService.blacklist;
  public appeals = this.reportService.appeals;

  public pendingAppealsCount = computed(() =>
    this.appeals().filter(a => a.status === 'pending').length
  );

  // Modal
  public showAddModal = signal(false);
  public newType: BlacklistType = 'phone';
  public newValue = '';
  public newReason = '';

  constructor() {
    const s = this.settingsService.settings();
    if (s && s.ban) {
      this.warnRating = s.ban.warnRating ?? 3.5;
      this.suspendRating = s.ban.suspendRating ?? 2.5;
      this.minJobsForRating = s.ban.minJobsForRating ?? 10;
      this.maxCancelRate = s.ban.maxCancelRate ?? 20;
    }
  }

  public saveBanRules(): void {
    const current = this.settingsService.settings();
    const updated = {
      ...current,
      ban: {
        warnRating: Number(this.warnRating),
        suspendRating: Number(this.suspendRating),
        minJobsForRating: Number(this.minJobsForRating),
        maxCancelRate: Number(this.maxCancelRate)
      }
    };
    this.settingsService.updateSettings(updated);

    this.auditLogService.logAction(
      'UPDATE_BAN_RULES',
      'ban_settings',
      'system',
      { ban: updated.ban }
    );

    this.notificationService.notify(
      'অটো-ব্যান শর্তাবলী সফলভাবে আপডেট করা হয়েছে',
      'success',
      'রুলস আপডেট'
    );
  }

  public addBlacklist(): void {
    if (!this.newValue.trim()) {
      alert('অনুগ্রহ করে মান প্রদান করুন');
      return;
    }

    this.reportService.addToBlacklist({
      type: this.newType,
      value: this.newValue.trim(),
      reason: this.newReason.trim() || 'কর্তৃপক্ষের সিদ্ধান্তে ব্ল্যাকলিস্ট করা হয়েছে',
      bannedBy: 'সুপার অ্যাডমিন'
    });

    this.auditLogService.logAction(
      'ADD_BLACKLIST',
      'blacklist',
      this.newValue,
      { type: this.newType, reason: this.newReason }
    );

    this.showAddModal.set(false);
    this.newValue = '';
    this.newReason = '';
    this.notificationService.notify('ব্ল্যাকলিস্টে নতুন এন্ট্রি সংরক্ষণ করা হয়েছে', 'success');
  }

  public removeBlacklist(id: string): void {
    this.confirmation.confirm({
      header: 'ব্ল্যাকলিস্ট অপসারণের নিশ্চিতকরণ (Confirm Removal)',
      message: 'আপনি কি নিশ্চিতভাবে এই এন্ট্রিটি ব্ল্যাকলিস্ট থেকে অপসারণ করতে চান?\nAre you sure you want to remove this entry from blacklist?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'অপসারণ / Remove',
      rejectLabel: 'বাতিল / Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.reportService.removeFromBlacklist(id);
        this.auditLogService.logAction('REMOVE_BLACKLIST', 'blacklist', id);
        this.notificationService.notify('ব্ল্যাকলিস্ট থেকে অপসারণ সম্পন্ন', 'info');
      }
    });
  }

  public handleAppeal(appealId: string, approved: boolean): void {
    const note = prompt(approved ? 'অনুমোদনের নোট (ঐচ্ছিক):' : 'প্রত্যাখ্যানের কারণ লিখুন:');
    if (note === null) return;

    this.reportService.reviewAppeal(appealId, approved, note || (approved ? 'আবেদন অনুমোদিত' : 'প্রত্যাখ্যাত'), 'সুপার অ্যাডমিন');

    this.auditLogService.logAction(
      approved ? 'APPROVE_APPEAL' : 'REJECT_APPEAL',
      'user_appeal',
      appealId,
      { approved, note }
    );

    this.notificationService.notify(
      approved ? 'আপিল অনুমোদন করা হয়েছে এবং ইউজারকে আনব্যান করা হয়েছে' : 'আপিল প্রত্যাখ্যাত হয়েছে',
      approved ? 'success' : 'warn'
    );
  }
}
