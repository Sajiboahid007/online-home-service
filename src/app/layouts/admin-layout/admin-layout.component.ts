import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WorkerService } from '../../core/services/worker.service';
import { ReportService } from '../../core/services/report.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';
import { BnNumberPipe } from '../../shared/pipes/bn-number.pipe';
import { LangToggleComponent } from '../../shared/components/lang-toggle/lang-toggle.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationCenterComponent, BnNumberPipe, LangToggleComponent, TranslatePipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private workerService = inject(WorkerService);
  private reportService = inject(ReportService);
  private router = inject(Router);

  public currentUser = this.authService.currentUser;
  public isSuperAdmin = this.authService.isSuperAdmin;

  public adminAvatarError = signal<boolean>(false);

  public onAdminAvatarError(): void {
    this.adminAvatarError.set(true);
  }

  public adminInitials = computed(() => {
    const user = this.currentUser();
    const name = user?.name;
    if (!name) return '🛡️';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  });

  public pendingVerificationCount = computed(() => {
    return this.workerService.workers().filter(w => w.verificationStatus === 'pending').length;
  });

  public activeSOSAlertsCount = computed(() => {
    return this.reportService.sosAlerts().filter(s => s.status === 'active').length;
  });

  public logout(): void {
    this.authService.logout();
  }
}
