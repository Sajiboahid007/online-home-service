import { Routes } from '@angular/router';
import { WorkerDashboardComponent } from './dashboard/worker-dashboard.component';
import { WorkerActiveJobComponent } from './active-job/worker-active-job.component';
import { WorkerJobBoardComponent } from './job-board/worker-job-board.component';
import { WorkerWalletComponent } from './wallet/worker-wallet.component';
import { WorkerJobHistoryComponent } from './job-history/worker-job-history.component';
import { WorkerEarningsComponent } from './earnings/worker-earnings.component';
import { WorkerReviewsComponent } from './reviews/worker-reviews.component';
import { WorkerEditProfileComponent } from './edit-profile/worker-edit-profile.component';
import { WorkerPremiumComponent } from './premium/worker-premium.component';

export const WORKER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: WorkerDashboardComponent,
    title: 'কাজখোঁজ - ওয়ার্কার ড্যাশবোর্ড'
  },
  {
    path: 'active',
    component: WorkerActiveJobComponent,
    title: 'কাজখোঁজ - সক্রিয় কাজ'
  },
  {
    path: 'active/:id',
    component: WorkerActiveJobComponent,
    title: 'কাজখোঁজ - কাজের অগ্রগতি'
  },
  {
    path: 'job-board',
    component: WorkerJobBoardComponent,
    title: 'কাজখোঁজ - খোলা কাজের বোর্ড'
  },
  {
    path: 'wallet',
    component: WorkerWalletComponent,
    title: 'কাজখোঁজ - ওয়ালেট ও হিসাব'
  },
  {
    path: 'job-history',
    component: WorkerJobHistoryComponent,
    title: 'কাজখোঁজ - কাজের ইতিহাস'
  },
  {
    path: 'earnings',
    component: WorkerEarningsComponent,
    title: 'কাজখোঁজ - উপার্জন ও বিশ্লেষণ'
  },
  {
    path: 'reviews',
    component: WorkerReviewsComponent,
    title: 'কাজখোঁজ - রিভিউ ও রেটিং'
  },
  {
    path: 'edit-profile',
    component: WorkerEditProfileComponent,
    title: 'কাজখোঁজ - প্রোফাইল ও স্কিল এডিট'
  },
  {
    path: 'premium',
    component: WorkerPremiumComponent,
    title: 'কাজখোঁজ - প্রিমিয়াম সাবস্ক্রিপশন'
  }
];

export const workerRoutes = WORKER_ROUTES;
