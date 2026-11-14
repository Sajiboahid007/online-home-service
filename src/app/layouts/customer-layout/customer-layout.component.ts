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
  public currentWorker = this.authService.currentWorker;
  public isAuthenticated = this.authService.isAuthenticated;
  public isWorker = this.authService.isWorker;
  public isAdmin = this.authService.isAdmin;
  public currentRole = this.authService.currentRole;
  public userLocation = this.locationService.userLocation;

  public currentRoleLabel = computed(() => {
    if (!this.isAuthenticated()) return 'অতিথি (লগইন করুন)';
    if (this.isWorker()) return 'কারিগর';
    if (this.isAdmin()) return 'অ্যাডমিন';
    return 'কাস্টমার';
  });

  // Favorite workers list
  public showFavoritesModal = signal<boolean>(false);
  public favoriteWorkers = computed(() => {
    const favIds = this.currentUser()?.favoriteWorkers || [];
    return this.workerService.workers().filter(w => favIds.includes(w.uid));
  });

  // Active jobs for badge counter
  public activeJobsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.jobService.jobs().filter(j => 
      j.customerId === user.uid &&
      ['pending', 'searching', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(j.status)
    ).length;
  });

  // Modal signals
  public showSOSModal = signal<boolean>(false);
  public sosSent = signal<boolean>(false);
  public showProfileModal = signal<boolean>(false);
  public isRefreshingLocation = signal<boolean>(false);
  public avatarImgError = signal<boolean>(false);

  public onAvatarError(): void {
    this.avatarImgError.set(true);
  }

  public userInitials = computed(() => {
    const user = this.currentUser();
    const name = user?.name;
    if (!name) return '👤';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  });

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

  public toggleProfileModal(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
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
      status: 'pending',
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
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }
    const activeJob = this.jobService.jobs().find(j => 
      j.customerId === user.uid &&
      ['pending', 'searching', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(j.status)
    );

    if (activeJob) {
      this.router.navigate(['/customer/tracking', activeJob.id]);
    } else {
      this.router.navigate(['/customer/bookings']);
    }
  }
}
