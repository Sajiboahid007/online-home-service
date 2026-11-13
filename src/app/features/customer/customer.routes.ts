import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home-map/home-map.component').then(m => m.HomeMapComponent),
    title: 'কাজখোঁজ — লাইভ সার্ভিস ম্যাপ'
  },
  {
    path: 'create-job',
    loadComponent: () => import('./create-request/create-request.component').then(m => m.CreateRequestComponent),
    title: 'কাজখোঁজ — নতুন কাজ তৈরি'
  },
  {
    path: 'create-request',
    loadComponent: () => import('./create-request/create-request.component').then(m => m.CreateRequestComponent),
    title: 'কাজখোঁজ — কাজের চাহিদা পোস্ট করুন'
  },
  {
    path: 'searching-worker/:id',
    loadComponent: () => import('./searching-worker/searching-worker.component').then(m => m.SearchingWorkerComponent),
    title: 'কাজখোঁজ — কারিগর খোঁজা হচ্ছে...'
  },
  {
    path: 'worker-profile/:id',
    loadComponent: () => import('./worker-profile/worker-profile-page.component').then(m => m.WorkerProfilePageComponent),
    title: 'কাজখোঁজ — কারিগরের প্রোফাইল'
  },
  {
    path: 'payment/:id',
    loadComponent: () => import('./payment/payment-page.component').then(m => m.PaymentPageComponent),
    title: 'কাজখোঁজ — বিল পরিশোধ ও ইনভয়েস'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/customer-profile.component').then(m => m.CustomerProfileComponent),
    title: 'কাজখোঁজ — কাস্টমার প্রোফাইল'
  },
  {
    path: 'tracking',
    loadComponent: () => import('./job-tracking/job-tracking.component').then(m => m.JobTrackingComponent),
    title: 'কাজখোঁজ — কাজের লাইভ ট্র্যাকিং'
  },
  {
    path: 'tracking/:id',
    loadComponent: () => import('./job-tracking/job-tracking.component').then(m => m.JobTrackingComponent),
    title: 'কাজখোঁজ — কাজের লাইভ ট্র্যাকিং'
  },
  {
    path: 'bookings',
    loadComponent: () => import('./my-bookings/my-bookings.component').then(m => m.MyBookingsComponent),
    title: 'কাজখোঁজ — আমার বুকিং সমূহ'
  }
];
