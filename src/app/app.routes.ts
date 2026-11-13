import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { notBannedGuard } from './core/guards/not-banned.guard';
import { roleGuard } from './core/guards/role.guard';
import { workerOnboardingGuard } from './core/guards/worker-onboarding.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'customer/home',
    pathMatch: 'full'
  },
  // Public live trip share route (Spec §17, Item 79) - no login required
  {
    path: 'share/:jobId',
    loadComponent: () =>
      import('./features/share-trip/share-trip.component').then(m => m.ShareTripComponent),
    title: 'লাইভ ট্রিপ শেয়ার • কাজখোঁজ'
  },
  {
    path: 'customer',
    canActivate: [authGuard, notBannedGuard, roleGuard],
    data: { roles: ['customer', 'admin', 'superadmin'] },
    loadComponent: () =>
      import('./layouts/customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    loadChildren: () =>
      import('./features/customer/customer.routes').then(m => m.CUSTOMER_ROUTES)
  },
  {
    path: 'worker',
    canActivate: [authGuard, notBannedGuard, roleGuard, workerOnboardingGuard],
    data: { roles: ['worker', 'admin', 'superadmin'] },
    loadComponent: () =>
      import('./layouts/worker-layout/worker-layout.component').then(m => m.WorkerLayoutComponent),
    loadChildren: () =>
      import('./features/worker/worker.routes').then(m => m.WORKER_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, notBannedGuard, roleGuard],
    data: { roles: ['admin', 'superadmin'] },
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'superadmin',
    canActivate: [authGuard, notBannedGuard, roleGuard],
    data: { roles: ['superadmin'] },
    loadChildren: () =>
      import('./features/superadmin/superadmin.routes').then(m => m.SUPERADMIN_ROUTES)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'customer/home'
  }
];
