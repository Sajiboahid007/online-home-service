import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AreaService } from '../../../core/services/area.service';
import { FirebaseService } from '../../../core/services/firebase.service';
import { User } from '../../../core/models/user.model';
import { doc, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-register-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register-customer.component.html',
  styleUrl: './register-customer.component.scss'
})
export class RegisterCustomerComponent {
  private authService = inject(AuthService);
  private areaService = inject(AreaService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  public areas = this.areaService.areas;

  // Form Fields
  public name = signal<string>('');
  public phone = signal<string>('');
  public email = signal<string>('');
  public areaId = signal<string>('savar_bazar');
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
      const newUser: User = {
        uid: 'user_cust_' + Date.now(),
        role: 'customer',
        name: trimmedName,
        phone: cleanPhone,
        email: this.email().trim() || undefined,
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
        createdAt: new Date().toISOString()
      };

      try {
        if (this.firebaseService?.db) {
          await setDoc(doc(this.firebaseService.db, 'users', newUser.uid), newUser);
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
