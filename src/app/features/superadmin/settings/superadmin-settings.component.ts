import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PlatformSettings } from '../../../core/models/settings.model';

@Component({
  selector: 'app-superadmin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-settings.component.html',
  styleUrls: ['./superadmin-settings.component.scss']
})
export class SuperadminSettingsComponent {
  public theme = inject(ThemeService);
  private settingsService = inject(SettingsService);
  private auditLogService = inject(AuditLogService);
  private notificationService = inject(NotificationService);

  public maintenanceMode = false;
  public showFullPhoneBeforeBooking = false;
  public supportPhone = '01700-000000';

  constructor() {
    const s = this.settingsService.settings();
    if (s) {
      this.maintenanceMode = !!s.maintenanceMode;
      this.showFullPhoneBeforeBooking = !!s.showFullPhoneBeforeBooking;
      this.supportPhone = s.supportPhone || '01700-000000';
    }
  }

  public saveSettings(): void {
    const current = this.settingsService.settings();
    const updated: PlatformSettings = {
      ...current,
      maintenanceMode: this.maintenanceMode,
      showFullPhoneBeforeBooking: this.showFullPhoneBeforeBooking,
      supportPhone: this.supportPhone.trim()
    };

    this.settingsService.updateSettings(updated);

    this.auditLogService.logAction(
      'UPDATE_GLOBAL_SETTINGS',
      'settings',
      'global',
      {
        maintenanceMode: this.maintenanceMode,
        showFullPhoneBeforeBooking: this.showFullPhoneBeforeBooking,
        supportPhone: this.supportPhone
      }
    );

    this.notificationService.notify('গ্লোবাল প্ল্যাটফর্ম সেটিংস সফলভাবে সংরক্ষিত হয়েছে', 'success');
  }
}
