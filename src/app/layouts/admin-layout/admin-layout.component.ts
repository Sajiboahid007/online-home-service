import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WorkerService } from '../../core/services/worker.service';
import { ReportService } from '../../core/services/report.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';
import { BnNumberPipe } from '../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationCenterComponent, BnNumberPipe],
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

  public pendingVerificationCount = computed(() => {
    return this.workerService.workers().filter(w => w.verificationStatus === 'pending').length;
  });

  public activeSOSAlertsCount = computed(() => {
    return this.reportService.sosAlerts().filter(s => s.status === 'active').length;
  });

  public switchRole(role: 'customer' | 'worker'): void {
    this.authService.loginAsDemo(role);
    this.router.navigate([role === 'worker' ? '/worker/dashboard' : '/customer/home']);
  }

  public logout(): void {
    this.authService.logout();
  }
}
