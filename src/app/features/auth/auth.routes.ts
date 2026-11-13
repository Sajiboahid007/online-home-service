import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterCustomerComponent } from './register-customer/register-customer.component';
import { RegisterWorkerComponent } from './register-worker/register-worker.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'লগইন • কাজখোঁজ'
  },
  {
    path: 'register-customer',
    component: RegisterCustomerComponent,
    title: 'কাস্টমার রেজিস্ট্রেশন • কাজখোঁজ'
  },
  {
    path: 'register-worker',
    component: RegisterWorkerComponent,
    title: 'ওয়ার্কার রেজিস্ট্রেশন • কাজখোঁজ'
  }
];

export default AUTH_ROUTES;
