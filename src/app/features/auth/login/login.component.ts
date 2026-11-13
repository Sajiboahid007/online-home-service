import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BnNumberPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  public authService = inject(AuthService);
  private workerService = inject(WorkerService);
  private seedData = inject(SeedDataService);
  private router = inject(Router);

  // Form states
  public phone = signal<string>('01712345678');
  public otpDigits = signal<string[]>(['', '', '', '', '', '']);
  public otpString = signal<string>('');
  public otpSent = signal<boolean>(false);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');
  public countdown = signal<number>(60);
  private timerInterval: any = null;

  public currentUser = this.authService.currentUser;

  // 1-Click Demo accounts configuration
  public demoAccounts = [
    {
      id: 'superadmin',
      label: 'সুপার অ্যাডমিন',
      badge: '👑 সুপার অ্যাডমিন',
      icon: '👑',
      desc: 'কেন্দ্রীয় নিয়ন্ত্রণ ও আয় রিপোর্ট',
      role: 'superadmin' as UserRole,
      route: '/admin'
    },
    {
      id: 'admin',
      label: 'সাভার অ্যাডমিন',
      badge: '🛡️ সাভার অ্যাডমিন',
      icon: '🛡️',
      desc: 'সাভার জোন ব্যবস্থাপনা ও ভেরিফিকেশন',
      role: 'admin' as UserRole,
      route: '/admin'
    },
    {
      id: 'worker_rahim',
      label: 'প্লাম্বার রহিম',
      badge: '🔧 প্লাম্বার রহিম',
      icon: '🔧',
      desc: 'সাভার বাজার • রেটিং ৪.৮',
      role: 'worker' as const,
      route: '/worker'
    },
    {
      id: 'worker_korim',
      label: 'ইলেকট্রিশিয়ান করিম',
      badge: '⚡ ইলেকট্রিশিয়ান করিম',
      icon: '⚡',
      desc: 'নামাবাজার • রেটিং ৪.৯',
      role: 'worker_korim' as const,
      route: '/worker'
    },
    {
      id: 'customer',
      label: 'কাস্টমার তানভীর',
      badge: '👤 কাস্টমার তানভীর',
      icon: '👤',
      desc: 'সাভার বাজার • বুকিং ও সার্ভিস গ্রহীতা',
      role: 'customer' as UserRole,
      route: '/customer'
    }
  ];

  public sendOtp(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const rawPhone = this.phone().trim();
    if (!rawPhone) {
      this.errorMessage.set('অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।');
      return;
    }

    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      this.errorMessage.set('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।');
      return;
    }

    this.isLoading.set(true);

    // Simulate SMS gateway OTP dispatch
    setTimeout(() => {
      this.isLoading.set(false);
      this.otpSent.set(true);
      this.otpString.set('');
      this.otpDigits.set(['', '', '', '', '', '']);
      this.successMessage.set(`+৮৮০ ${cleanPhone}-এ ৬ ডিজিটের ওটিপি পাঠানো হয়েছে।`);
      this.startCountdown();
    }, 700);
  }

  public verifyOtp(): void {
    this.errorMessage.set('');
    const enteredOtp = this.otpString().trim();

    if (enteredOtp.length < 6) {
      this.errorMessage.set('অনুগ্রহ করে ৬ ডিজিটের সম্পূর্ণ ওটিপি কোড লিখুন।');
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      const cleanPhone = this.phone().replace(/[^0-9]/g, '');

      // Check if user matches worker
      const matchingWorker = this.workerService.workers().find(w => w.phone === cleanPhone);
      if (matchingWorker) {
        const workerUser: User = {
          uid: matchingWorker.uid,
          role: 'worker',
          name: matchingWorker.name,
          phone: matchingWorker.phone,
          photoURL: matchingWorker.photoURL,
          status: 'active',
          areaId: matchingWorker.areaId,
          rating: matchingWorker.rating,
          ratingCount: matchingWorker.ratingCount,
          createdAt: matchingWorker.createdAt
        };
        this.authService.setUser(workerUser, matchingWorker);
        this.router.navigate(['/worker']);
        return;
      }

      // Check if matches admin
      if (cleanPhone === '01700000001') {
        this.authService.loginAsDemo('superadmin');
        this.router.navigate(['/admin']);
        return;
      }
      if (cleanPhone === '01700000002') {
        this.authService.loginAsDemo('admin');
        this.router.navigate(['/admin']);
        return;
      }

      // Default or customer
      const existingUser = this.seedData.defaultUsers.find(u => u.phone === cleanPhone);
      if (existingUser) {
        this.authService.setUser(existingUser, null);
      } else {
        const newUser: User = {
          uid: 'user_' + Date.now(),
          role: 'customer',
          name: 'কাস্টমার (' + cleanPhone.slice(-4) + ')',
          phone: cleanPhone,
          status: 'active',
          areaId: 'savar_bazar',
          createdAt: new Date().toISOString()
        };
        this.authService.setUser(newUser, null);
      }

      this.router.navigate(['/customer']);
    }, 600);
  }

  public autoFillOtp(): void {
    this.otpString.set('123456');
    this.otpDigits.set(['1', '2', '3', '4', '5', '6']);
    this.verifyOtp();
  }

  public resendOtp(): void {
    if (this.countdown() > 0) return;
    this.sendOtp();
  }

  public changePhone(): void {
    this.otpSent.set(false);
    this.otpString.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.stopCountdown();
  }

  public quickLogin(account: any): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.authService.loginAsDemo(account.role);
      this.router.navigate([account.route]);
    }, 200);
  }

  public onOtpInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');

    const currentDigits = [...this.otpDigits()];
    currentDigits[index] = val ? val[val.length - 1] : '';
    this.otpDigits.set(currentDigits);
    this.otpString.set(currentDigits.join(''));

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById('otp-box-' + (index + 1)) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  public onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      const prevInput = document.getElementById('otp-box-' + (index - 1)) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  public onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';
    const cleanDigits = pasteData.replace(/[^0-9]/g, '').slice(0, 6);
    if (!cleanDigits) return;

    const digits = ['', '', '', '', '', ''];
    for (let i = 0; i < cleanDigits.length; i++) {
      digits[i] = cleanDigits[i];
    }
    this.otpDigits.set(digits);
    this.otpString.set(digits.join(''));

    if (cleanDigits.length === 6) {
      this.verifyOtp();
    }
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.countdown.set(60);
    this.timerInterval = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        this.stopCountdown();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }
}
