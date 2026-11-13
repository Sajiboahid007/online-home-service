import { Component, computed, signal, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WorkerService } from '../../core/services/worker.service';
import { JobService } from '../../core/services/job.service';
import { ThemeService } from '../../core/services/theme.service';
import { WorkerProfile } from '../../core/models/worker.model';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';
import { BnNumberPipe } from '../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../shared/pipes/taka.pipe';
import { LangToggleComponent } from '../../shared/components/lang-toggle/lang-toggle.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationCenterComponent, BnNumberPipe, TakaPipe, LangToggleComponent, TranslatePipe],
  templateUrl: './worker-layout.component.html',
  styleUrl: './worker-layout.component.scss'
})
export class WorkerLayoutComponent {
  public authService = inject(AuthService);
  public workerService = inject(WorkerService);
  public jobService = inject(JobService);
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  public mobileMenuOpen = signal<boolean>(false);
  public showRoleSwitcher = signal<boolean>(false);
  public showProfileDropdown = signal<boolean>(false);

  // Fallback to first default worker if session hasn't explicitly selected one
  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    const found = this.workerService.getWorkerById(uid);
    if (found) return found;
    if (authWorker) return authWorker;
    const defaultFirst = this.workerService.workers()[0];
    return defaultFirst || null;
  });

  public currentUser = this.authService.currentUser;

  // Active jobs for current worker (accepted, on_the_way, arrived, in_progress)
  public activeJob = computed(() => {
    const worker = this.currentWorker();
    if (!worker) return null;
    const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
    return this.jobService.jobs().find(j => j.workerId === worker.uid && activeStatuses.includes(j.status)) || null;
  });

  // Count open jobs on board in worker's category
  public openJobsCount = computed(() => {
    const worker = this.currentWorker();
    const catId = worker?.categoryIds?.[0];
    return this.jobService.getOpenBoardJobs(catId).length;
  });

  constructor() {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showProfileDropdown()) {
      const target = event.target as HTMLElement;
      const dropdownEl = this.elementRef.nativeElement.querySelector('.worker-profile-dropdown');
      if (dropdownEl && !dropdownEl.contains(target)) {
        this.showProfileDropdown.set(false);
      }
    }
  }

  public toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  public closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  public toggleRoleSwitcher(): void {
    this.showRoleSwitcher.update(v => !v);
    if (this.showRoleSwitcher()) {
      this.showProfileDropdown.set(false);
    }
  }

  public closeRoleSwitcher(): void {
    this.showRoleSwitcher.set(false);
  }

  public toggleProfileDropdown(): void {
    this.showProfileDropdown.update(v => !v);
  }

  public closeProfileDropdown(): void {
    this.showProfileDropdown.set(false);
  }

  public toggleOnline(): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const newOnline = !worker.isOnline;
    this.workerService.toggleOnlineStatus(worker.uid, newOnline);
  }

  public switchRole(role: string): void {
    this.authService.loginAsDemo(role);
    this.showRoleSwitcher.set(false);
    this.showProfileDropdown.set(false);
    if (role === 'admin' || role === 'superadmin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role.startsWith('worker')) {
      this.router.navigate(['/worker/dashboard']);
    } else {
      this.router.navigate(['/customer/home']);
    }
  }

  public switchWorker(workerKey: 'worker' | 'worker_kalam'): void {
    this.authService.loginAsDemo(workerKey);
    this.showProfileDropdown.set(false);
    this.showRoleSwitcher.set(false);
    this.router.navigate(['/worker/dashboard']);
  }

  public logout(): void {
    this.showProfileDropdown.set(false);
    this.authService.logout();
  }
}
