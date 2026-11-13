import { Routes } from '@angular/router';
import { SuperadminLayoutComponent } from './superadmin-layout/superadmin-layout.component';

export const SUPERADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SuperadminLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/superadmin-dashboard.component').then(m => m.SuperadminDashboardComponent)
      },
      {
        path: 'admins',
        loadComponent: () =>
          import('./admins/superadmin-admins.component').then(m => m.SuperadminAdminsComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/superadmin-categories.component').then(m => m.SuperadminCategoriesComponent)
      },
      {
        path: 'dispatch',
        loadComponent: () =>
          import('./dispatch/superadmin-dispatch.component').then(m => m.SuperadminDispatchComponent)
      },
      {
        path: 'blacklist',
        loadComponent: () =>
          import('./blacklist/superadmin-blacklist.component').then(m => m.SuperadminBlacklistComponent)
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./coupons/superadmin-coupons.component').then(m => m.SuperadminCouponsComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./audit-logs/superadmin-audit-logs.component').then(m => m.SuperadminAuditLogsComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/superadmin-settings.component').then(m => m.SuperadminSettingsComponent)
      }
    ]
  }
];
