import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    title: 'কাজখোঁজ — অ্যাডমিন ড্যাশবোর্ড'
  },
  {
    path: 'jobs',
    loadComponent: () => import('./jobs/admin-jobs.component').then(m => m.AdminJobsComponent),
    title: 'কাজখোঁজ — জবস ও অর্ডার ব্যবস্থাপনা'
  },
  {
    path: 'verification',
    loadComponent: () => import('./workers/admin-worker-verification.component').then(m => m.AdminWorkerVerificationComponent),
    title: 'কাজখোঁজ — কর্মী কেওয়াইসি ভেরিফিকেশন'
  },
  {
    path: 'users',
    loadComponent: () => import('./users/admin-users-list.component').then(m => m.AdminUsersListComponent),
    title: 'কাজখোঁজ — ব্যবহারকারী ও কারিগর তালিকা'
  },
  {
    path: 'reviews',
    loadComponent: () => import('./reviews/admin-reviews.component').then(m => m.AdminReviewsComponent),
    title: 'কাজখোঁজ — রিভিউ মডারেশন'
  },
  {
    path: 'transactions',
    loadComponent: () => import('./transactions/admin-transactions.component').then(m => m.AdminTransactionsComponent),
    title: 'কাজখোঁজ — লেনদেন ও উত্তোলন'
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pricing/admin-pricing-matrix.component').then(m => m.AdminPricingMatrixComponent),
    title: 'কাজখোঁজ — প্রাইসিং ও কমিশন মেট্রিক্স'
  },
  {
    path: 'areas',
    loadComponent: () => import('./areas/admin-areas.component').then(m => m.AdminAreasComponent),
    title: 'কাজখোঁজ — এরিয়া ও জোন ব্যবস্থাপনা'
  },
  {
    path: 'live-map',
    loadComponent: () => import('./live-map/admin-live-map.component').then(m => m.AdminLiveMapComponent),
    title: 'কাজখোঁজ — লাইভ অপারেশন ম্যাপ'
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent),
    title: 'কাজখোঁজ — বিরোধ ও SOS কন্ট্রোল রুম'
  }
];
