import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PlatformSettings } from '../../../core/models/settings.model';

@Component({
  selector: 'app-superadmin-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-dispatch.component.html',
  styleUrls: ['./superadmin-dispatch.component.scss']
})
export class SuperadminDispatchComponent {
  public theme = inject(ThemeService);
  private settingsService = inject(SettingsService);
  private auditLogService = inject(AuditLogService);
  private notificationService = inject(NotificationService);

  public commissionPercent = 15;
  public dueLimit = 500;

  public initialRadius = 3;
  public maxRadius = 10;
  public offerTimeoutSec = 30;
  public batchSize = 3;

  public weightDistance = 0.40;
  public weightRating = 0.25;
  public weightAcceptRate = 0.15;
  public weightIdleTime = 0.10;
  public weightPremiumBonus = 0.10;

  constructor() {
    this.loadCurrentSettings();
  }

  public get totalWeight(): number {
    return (
      Number(this.weightDistance) +
      Number(this.weightRating) +
      Number(this.weightAcceptRate) +
      Number(this.weightIdleTime) +
      Number(this.weightPremiumBonus)
    );
  }

  private loadCurrentSettings(): void {
    const s = this.settingsService.settings();
    if (s) {
      this.commissionPercent = Math.round((s.defaultCommission || 0.15) * 100);
      this.dueLimit = s.dueLimit || 500;
      if (s.dispatch) {
        this.initialRadius = s.dispatch.initialRadius || 3;
        this.maxRadius = s.dispatch.maxRadius || 10;
        this.offerTimeoutSec = s.dispatch.offerTimeoutSec || 30;
        this.batchSize = s.dispatch.batchSize || 3;
        if (s.dispatch.weights) {
          this.weightDistance = s.dispatch.weights.distance ?? 0.40;
          this.weightRating = s.dispatch.weights.rating ?? 0.25;
          this.weightAcceptRate = s.dispatch.weights.acceptRate ?? 0.15;
          this.weightIdleTime = s.dispatch.weights.idleTime ?? 0.10;
          this.weightPremiumBonus = s.dispatch.weights.premiumBonus ?? 0.10;
        }
      }
    }
  }

  public saveSettings(): void {
    const current = this.settingsService.settings();
    const updated: PlatformSettings = {
      ...current,
      defaultCommission: Number(this.commissionPercent) / 100,
      dueLimit: Number(this.dueLimit),
      dispatch: {
        initialRadius: Number(this.initialRadius),
        maxRadius: Number(this.maxRadius),
        offerTimeoutSec: Number(this.offerTimeoutSec),
        batchSize: Number(this.batchSize),
        weights: {
          distance: Number(this.weightDistance),
          rating: Number(this.weightRating),
          acceptRate: Number(this.weightAcceptRate),
          idleTime: Number(this.weightIdleTime),
          premiumBonus: Number(this.weightPremiumBonus)
        }
      }
    };

    this.settingsService.updateSettings(updated);

    this.auditLogService.logAction(
      'UPDATE_DISPATCH_SETTINGS',
      'platform_settings',
      'system',
      { commission: this.commissionPercent, dueLimit: this.dueLimit, dispatch: updated.dispatch }
    );

    this.notificationService.notify(
      'কমিশন ও ডিসপ্যাচ সেটিংস সফলভাবে আপডেট হয়েছে',
      'success',
      'সেটিংস সেভড'
    );
  }
}
