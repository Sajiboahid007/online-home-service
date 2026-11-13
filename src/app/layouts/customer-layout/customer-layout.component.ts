import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LocationService } from '../../core/services/location.service';
import { ReportService } from '../../core/services/report.service';
import { JobService } from '../../core/services/job.service';
import { WorkerService } from '../../core/services/worker.service';
import { CategoryService } from '../../core/services/category.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';
import { BnNumberPipe } from '../../shared/pipes/bn-number.pipe';
import { MaskPhonePipe } from '../../shared/pipes/mask-phone.pipe';
import { TakaPipe } from '../../shared/pipes/taka.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LangToggleComponent } from '../../shared/components/lang-toggle/lang-toggle.component';
import { UserRole } from '../../core/models/user.model';
import { WorkerProfile } from '../../core/models/worker.model';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationCenterComponent, BnNumberPipe, MaskPhonePipe, TakaPipe, TranslatePipe, LangToggleComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss'
})
export class CustomerLayoutComponent {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);
  private reportService = inject(ReportService);
  private jobService = inject(JobService);
  private workerService = inject(WorkerService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  public currentUser = this.authService.currentUser;
  public isAuthenticated = this.authService.isAuthenticated;
  public userLocation = this.locationService.userLocation;

  // Favorite workers list
  public showFavoritesModal = signal<boolean>(false);
  public favoriteWorkers = computed(() => {
    const favIds = this.currentUser()?.favoriteWorkers || [];
    return this.workerService.workers().filter(w => favIds.includes(w.uid));
  });

  // Active jobs for badge counter
  public activeJobsCount = computed(() => {
    const user = this.currentUser();
    const uid = user ? user.uid : 'user_customer_demo_1';
    return this.jobService.jobs().filter(j => 
      j.customerId === uid &&
      ['pending', 'searching', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(j.status)
    ).length;
  });

  // Modal signals
  public showSOSModal = signal<boolean>(false);
  public sosSent = signal<boolean>(false);
  public showRoleSwitcher = signal<boolean>(false);
  public showProfileModal = signal<boolean>(false);
  public isRefreshingLocation = signal<boolean>(false);

  public logout(): void {
    this.authService.logout();
  }

  public openSOS(): void {
    this.sosSent.set(false);
    this.showSOSModal.set(true);
  }

  public closeSOS(): void {
    this.showSOSModal.set(false);
  }

  public triggerSOS(): void {
    const user = this.currentUser();
    const loc = this.userLocation();

    this.reportService.triggerSOS({
      uid: user?.uid || 'user_customer_demo_1',
      userName: user?.name || 'তানভীর আহমেদ',
      userPhone: user?.phone || '01712345678',
      location: {
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address || 'সাভার, ঢাকা'
      }
    });

    this.sosSent.set(true);
  }

  public refreshLocation(): void {
    this.isRefreshingLocation.set(true);
    this.locationService.detectCurrentPosition().then(() => {
      this.isRefreshingLocation.set(false);
    }).catch(() => {
      this.isRefreshingLocation.set(false);
    });
  }

  public toggleRoleSwitcher(): void {
    this.showRoleSwitcher.update(v => !v);
  }

  public closeRoleSwitcher(): void {
    this.showRoleSwitcher.set(false);
  }

  public switchRole(role: UserRole | 'worker_korim' | 'worker_kalam'): void {
    this.authService.loginAsDemo(role);
    this.showRoleSwitcher.set(false);

    if (role === 'admin' || role === 'superadmin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'worker' || role === 'worker_korim' || role === 'worker_kalam') {
      this.router.navigate(['/worker/dashboard']);
    } else {
      this.router.navigate(['/customer/home']);
    }
  }

  public toggleProfileModal(): void {
    this.showProfileModal.update(v => !v);
  }

  public closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  public openFavorites(): void {
    this.showFavoritesModal.set(true);
  }

  public closeFavorites(): void {
    this.showFavoritesModal.set(false);
  }

  public removeFavorite(workerId: string): void {
    this.authService.toggleFavoriteWorker(workerId);
  }

  public bookFavoriteWorker(worker: WorkerProfile): void {
    const user = this.currentUser();
    const loc = this.userLocation();
    const cat = this.categoryService.getCategoryById(worker.categoryIds[0]) || { nameBn: 'সার্ভিস' };

    const newJob = this.jobService.createJob({
      customerId: user?.uid || 'user_customer_demo_1',
      customerName: user?.name || 'তানভীর আহমেদ',
      customerPhone: user?.phone || '01712345678',
      workerId: worker.uid,
      workerName: worker.name,
      workerPhone: worker.phone,
      workerPhoto: worker.photoURL,
      categoryId: worker.categoryIds[0],
      categoryName: cat.nameBn,
      areaId: worker.areaId || 'savar_bazar',
      type: 'direct',
      status: 'accepted',
      description: `পুনরায় বুকিং: প্রিয় কারিগর ${worker.name}-কে সরাসরি অর্ডার করা হয়েছে`,
      estimatedPrice: worker.rate,
      location: loc,
      paymentMethod: 'cash'
    });

    this.closeFavorites();
    this.router.navigate(['/customer/tracking', newJob.id]);
  }

  public isOnTrackingPage(): boolean {
    return this.router.url.startsWith('/customer/tracking');
  }

  public navigateToTracking(): void {
    const user = this.currentUser();
    const uid = user ? user.uid : 'user_customer_demo_1';
    const activeJob = this.jobService.jobs().find(j => 
      j.customerId === uid &&
      ['pending', 'searching', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(j.status)
    );

    if (activeJob) {
      this.router.navigate(['/customer/tracking', activeJob.id]);
    } else {
      this.router.navigate(['/customer/bookings']);
    }
  }
}
