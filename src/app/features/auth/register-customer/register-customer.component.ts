import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, PendingGoogleProfile } from '../../../core/services/auth.service';
import { AreaService } from '../../../core/services/area.service';
import { FirebaseService } from '../../../core/services/firebase.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LangToggleComponent } from '../../../shared/components/lang-toggle/lang-toggle.component';
import { User } from '../../../core/models/user.model';
import { doc, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-register-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LangToggleComponent],
  templateUrl: './register-customer.component.html',
  styleUrl: './register-customer.component.scss'
})
export class RegisterCustomerComponent implements OnInit {
  private authService = inject(AuthService);
  private areaService = inject(AreaService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);
  public theme = inject(ThemeService);
  public isEn = computed(() => this.theme.currentLang() === 'en');

  public areas = this.areaService.areas;
  public isSsoLoading = this.authService.isSsoLoading;
  public googleAccount = signal<PendingGoogleProfile | null>(null);

  // Form Fields
  public name = signal<string>('');
  public phone = signal<string>('');
  public email = signal<string>('');
  public areaId = signal<string>('');
  public address = signal<string>('');

  // Emergency Contact
  public emergencyName = signal<string>('');
  public emergencyPhone = signal<string>('');
  public emergencyRelation = signal<string>('স্ত্রী');

  // Terms and conditions
  public agreeTerms = signal<boolean>(true);

  // States
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');

  // Available relations
  public relationOptions = [
    'স্ত্রী', 'স্বামী', 'পিতা', 'মাতা', 'ভাই', 'বোন', 'সন্তান', 'বন্ধু', 'আত্মীয়'
  ];

  ngOnInit(): void {
    const pending = this.authService.pendingGoogleProfile();
    if (pending) {
      this.applyGoogleProfile(pending);
      this.authService.clearPendingGoogleProfile();
    }
  }

  private applyGoogleProfile(profile: PendingGoogleProfile): void {
    this.googleAccount.set(profile);
    if (profile.name && !this.name().trim()) {
      this.name.set(profile.name);
    }
    if (profile.email) {
      this.email.set(profile.email);
    }
    if (profile.phone && !this.phone().trim()) {
      this.phone.set(profile.phone);
    }
  }

  public async signUpWithGoogle(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    const result = await this.authService.signInWithGoogleSSO({
      intent: 'register_customer',
      autoCreateCustomer: false
    });

    if (result.status === 'redirecting') {
      this.successMessage.set(
        this.isEn()
          ? 'Redirecting to Google Sign-In...'
          : 'Google সাইন-ইনে রিডাইরেক্ট করা হচ্ছে...'
      );
      return;
    }

    if (result.status === 'cancelled' || result.status === 'error') {
      if (result.error) this.errorMessage.set(result.error);
      return;
    }

    if (result.status === 'signed_in') {
      this.successMessage.set(
        this.isEn()
          ? 'Existing Google account found! Signing you in...'
          : 'এই Google অ্যাকাউন্টটি ইতিমধ্যে নিবন্ধিত! লগইন করা হচ্ছে...'
      );
      setTimeout(() => {
        this.router.navigateByUrl(result.route || '/customer');
      }, 500);
      return;
    }

    if (result.status === 'needs_registration' && result.firebaseUser) {
      const fb = result.firebaseUser;
      const pending = this.authService.pendingGoogleProfile() || {
        uid: fb.uid,
        name: fb.displayName || '',
        email: fb.email || '',
        photoURL: fb.photoURL || '',
        phone: ''
      };
      this.applyGoogleProfile(pending);
      this.authService.clearPendingGoogleProfile();
      this.successMessage.set(
        this.isEn()
          ? 'Google account connected! Fill in your phone & address or continue in 1-click.'
          : 'Google অ্যাকাউন্ট সংযুক্ত হয়েছে! নিচের তথ্য পূরণ করুন অথবা ১-ক্লিকে সরাসরি প্রবেশ করুন।'
      );
    }
  }

  public async unlinkGoogleAccount(): Promise<void> {
    this.googleAccount.set(null);
    this.authService.clearPendingGoogleProfile();
    await this.firebaseService.signOutFirebase();
    this.successMessage.set('');
  }

  public async quickCompleteGoogleCustomer(): Promise<void> {
    const google = this.googleAccount();
    if (!google) return;

    this.errorMessage.set('');
    this.isLoading.set(true);

    const nowIso = new Date().toISOString();
    const cleanPhone = this.phone().replace(/[^0-9]/g, '');
    const trimmedAddress = this.address().trim();

    const newUser: User = {
      uid: google.uid,
      role: 'customer',
      name: this.name().trim() || google.name || google.email.split('@')[0] || 'Google Customer',
      phone: cleanPhone.length === 11 && cleanPhone.startsWith('01') ? cleanPhone : google.phone || '',
      email: this.email().trim() || google.email || undefined,
      photoURL: google.photoURL || undefined,
      authProvider: 'google',
      googleLinked: true,
      status: 'active',
      areaId: this.areaId() || undefined,
      savedAddresses: trimmedAddress
        ? [{ id: 'addr_home', label: 'বাসা', address: trimmedAddress, lat: 23.8245, lng: 90.2689 }]
        : undefined,
      rating: 5.0,
      ratingCount: 0,
      favoriteWorkers: [],
      createdAt: nowIso,
      lastLoginAt: nowIso
    };

    await this.authService.syncGoogleUserToFirestore(newUser);
    this.authService.setUser(newUser, null);
    this.isLoading.set(false);
    this.successMessage.set(
      this.isEn()
        ? 'Account created with Google! Redirecting to Customer Portal...'
        : 'Google দিয়ে রেজিস্ট্রেশন সফল হয়েছে! কাস্টমার পোর্টালে নিয়ে যাওয়া হচ্ছে...'
    );

    setTimeout(() => {
      this.router.navigate(['/customer']);
    }, 600);
  }

  public fillDemoData(): void {
    this.name.set('হাসান মাহমুদ');
    this.phone.set('01799887766');
    this.email.set('hasan.savar@gmail.com');
    this.areaId.set('savar_bazar');
    this.address.set('বাড়ি নং ১৮, ব্যাংক কলোনি রোড, সাভার, ঢাকা');
    this.emergencyName.set('ফারহানা ইয়াসমিন');
    this.emergencyPhone.set('01811223344');
    this.emergencyRelation.set('স্ত্রী');
    this.agreeTerms.set(true);
    this.errorMessage.set('');
  }

  public register(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const trimmedName = this.name().trim();
    const cleanPhone = this.phone().replace(/[^0-9]/g, '');
    const cleanEmergencyPhone = this.emergencyPhone().replace(/[^0-9]/g, '');
    const trimmedAddress = this.address().trim();
    const trimmedEmergencyName = this.emergencyName().trim();

    if (!trimmedName) {
      this.errorMessage.set('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
      return;
    }

    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      this.errorMessage.set('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (!this.areaId()) {
      this.errorMessage.set('অনুগ্রহ করে আপনার সার্ভিস জোন / এলাকা নির্বাচন করুন।');
      return;
    }

    if (!trimmedAddress) {
      this.errorMessage.set('অনুগ্রহ করে আপনার বাসার বিস্তারিত ঠিকানা লিখুন।');
      return;
    }

    if (!trimmedEmergencyName) {
      this.errorMessage.set('জরুরি যোগাযোগের ব্যক্তির নাম লিখুন।');
      return;
    }

    if (cleanEmergencyPhone.length !== 11 || !cleanEmergencyPhone.startsWith('01')) {
      this.errorMessage.set('সঠিক ১১ ডিজিটের জরুরি ফোন নম্বর লিখুন।');
      return;
    }

    if (cleanPhone === cleanEmergencyPhone) {
      this.errorMessage.set('জরুরি নম্বর আপনার নিজস্ব নম্বর থেকে ভিন্ন হতে হবে।');
      return;
    }

    if (!this.agreeTerms()) {
      this.errorMessage.set('রেজিস্ট্রেশন সম্পন্ন করতে শর্তাবলী সম্মতি দিন।');
      return;
    }

    this.isLoading.set(true);

    setTimeout(async () => {
      const google = this.googleAccount();
      const firebaseUid = google?.uid || this.firebaseService?.auth?.currentUser?.uid;
      const nowIso = new Date().toISOString();

      const newUser: User = {
        uid: firebaseUid || ('user_cust_' + Date.now()),
        role: 'customer',
        name: trimmedName,
        phone: cleanPhone,
        email: this.email().trim() || google?.email || undefined,
        photoURL: google?.photoURL || undefined,
        authProvider: google ? 'google' : 'phone',
        googleLinked: !!google,
        status: 'active',
        areaId: this.areaId(),
        emergencyContact: {
          name: trimmedEmergencyName,
          phone: cleanEmergencyPhone,
          relation: this.emergencyRelation()
        },
        savedAddresses: [
          { id: 'addr_home', label: 'বাসা', address: trimmedAddress, lat: 23.8245, lng: 90.2689 }
        ],
        rating: 5.0,
        ratingCount: 0,
        favoriteWorkers: [],
        createdAt: nowIso,
        lastLoginAt: nowIso
      };

      try {
        if (this.firebaseService?.db) {
          const cleanPayload = Object.fromEntries(
            Object.entries(newUser).filter(([, value]) => value !== undefined)
          );
          await setDoc(doc(this.firebaseService.db, 'users', newUser.uid), cleanPayload);
        }
      } catch (err) {
        console.warn('Could not persist customer to Firestore:', err);
      }

      this.authService.setUser(newUser, null);
      this.isLoading.set(false);
      this.successMessage.set('রেজিস্ট্রেশন সফল হয়েছে! আপনাকে কাস্টমার পোর্টালে নিয়ে যাওয়া হচ্ছে...');

      setTimeout(() => {
        this.router.navigate(['/customer']);
      }, 800);
    }, 600);
  }
}
