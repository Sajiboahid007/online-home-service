import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { CategoryService } from '../../../core/services/category.service';
import { AreaService } from '../../../core/services/area.service';
import { LocationService } from '../../../core/services/location.service';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { MaskPhonePipe } from '../../../shared/pipes/mask-phone.pipe';
import { WorkerProfile, WorkerPrivate, RateUnit, GeoPoint } from '../../../core/models/worker.model';
import { User } from '../../../core/models/user.model';
import { FirebaseService } from '../../../core/services/firebase.service';
import { doc, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-register-worker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BnNumberPipe, TakaPipe, MaskPhonePipe],
  templateUrl: './register-worker.component.html',
  styleUrl: './register-worker.component.scss'
})
export class RegisterWorkerComponent {
  private authService = inject(AuthService);
  private workerService = inject(WorkerService);
  private categoryService = inject(CategoryService);
  private areaService = inject(AreaService);
  private locationService = inject(LocationService);
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  public categories = this.categoryService.categories;
  public areas = this.areaService.areas;

  // Stepper State (1 to 5, and 6 = Completed)
  public currentStep = signal<number>(1);
  public maxStepReached = signal<number>(1);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');

  // Step 1: Basic Info
  public name = signal<string>('মো: সালাম হোসেন');
  public phone = signal<string>('01755667788');
  public experienceYears = signal<number>(5);
  public bio = signal<string>('সাভার এলাকার অভিজ্ঞ টেকনিশিয়ান। বাসা-বাড়ির সব ধরনের মেরামত যত্নসহকারে সম্পন্ন করি।');
  public photoURL = signal<string>('https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150');

  // Step 2: Categories & Skills
  public selectedCategoryIds = signal<string[]>(['electrician']);
  public skills = signal<string[]>(['হাউজ ওয়্যারিং', 'শর্ট সার্কিট চেক', 'সুইচ ও সকেট ফিটিং']);
  public customSkillInput = signal<string>('');

  public suggestedSkillsMap: Record<string, string[]> = {
    plumber: ['পাইপ লিকেজ মেরামত', 'বেসিন ও কমোড ফিটিং', 'পাম্প মোটর স্থাপন', 'ট্যাপ ও শাওয়ার মেরামত', 'গিজার লাইন কানেকশন'],
    electrician: ['হাউজ ওয়্যারিং', 'শর্ট সার্কিট চেক', 'সুইচ ও সকেট ফিটিং', 'সিলিং ফ্যান স্থাপন', 'সার্কিট ব্রেকার মেরামত'],
    ac_technician: ['এসি গ্যাস চার্জ', 'মাস্টার ওয়াশ', 'ইনস্টলেশন ও রি-ইনস্টলেশন', 'কম্প্রেসার চেক', 'লিকেজ রিপেয়ার'],
    cleaner: ['বাথরুম ডিপ ক্লিনিং', 'কিচেন ডিপ ক্লিনিং', 'ফ্লোর পলিশ', 'সোফা ও কার্পেট ওয়াশ', 'পানি ট্যাংক পরিষ্কার'],
    painter: ['ওয়াল পুটিং ও পেইন্টিং', 'ড্যাম্প প্রটেকশন', 'রং ডিজাইন ও টেক্সচার', 'দরজা-জানালা বার্নিশ'],
    day_laborer: ['ভারী মালামাল বহন', 'বাসা বদল সহায়তা', 'লোডিং-আনলোডিং', 'নির্মাণ সহায়তা'],
    mason: ['দেওয়াল গাঁথুনি', 'প্লাস্টার কাজ', 'টাইলস ফিটিং', 'ঢালাই ও মেরামত']
  };

  // Step 3: Mandatory Home Location
  public homeAddress = signal<string>('সাভার বাজার বাসস্ট্যান্ড রোড, সাভার, ঢাকা');
  public lat = signal<number>(23.8245);
  public lng = signal<number>(90.2689);
  public areaId = signal<string>('savar_bazar');
  public isDetectingLocation = signal<boolean>(false);

  // Quick preset locations in Savar / Dhaka
  public presetLocations = [
    { label: 'সাভার বাজার', lat: 23.8245, lng: 90.2689, address: 'সাভার বাজার বাসস্ট্যান্ড রোড, সাভার', areaId: 'savar_bazar' },
    { label: 'সাভার থানা রোড', lat: 23.8210, lng: 90.2635, address: 'থানা রোড, সাভার, ঢাকা', areaId: 'savar_thana' },
    { label: 'হেমায়েতপুর', lat: 23.7932, lng: 90.2691, address: 'হেমায়েতপুর বাসস্ট্যান্ড, সাভার', areaId: 'hemayetpur' },
    { label: 'আশুলিয়া', lat: 23.8902, lng: 90.3204, address: 'আশুলিয়া বাজার রোড, ঢাকা', areaId: 'ashulia' },
    { label: 'মিরপুর ১০', lat: 23.8071, lng: 90.3686, address: 'মিরপুর ১০ গোলচত্বর, ঢাকা', areaId: 'dhaka_mirpur' }
  ];

  // Step 4: KYC Documents
  public nidNumber = signal<string>('19902691234567890');
  public nidFrontURL = signal<string>('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400');
  public nidBackURL = signal<string>('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400');
  public selfieURL = signal<string>('https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400');
  public policeClearanceURL = signal<string>('');

  // Step 5: Rates & Service Area
  public rate = signal<number>(350);
  public rateUnit = signal<RateUnit>('job');
  public serviceRadiusKm = signal<number>(6);
  public bkashNumber = signal<string>('01755667788');
  public nagadNumber = signal<string>('');

  // Rate Unit Options
  public rateUnits: { id: RateUnit; label: string; desc: string }[] = [
    { id: 'job', label: 'প্রতি কাজ (জব)', desc: 'নির্দিষ্ট কাজের ভিত্তিতে চুক্তি' },
    { id: 'hour', label: 'প্রতি ঘণ্টা', desc: 'ঘণ্টা হিসেবে কাজের পারিশ্রমিক' },
    { id: 'day', label: 'প্রতি দিন', desc: 'দৈনিক হাজিরা / পূর্ণ দিনের কাজ' }
  ];

  public radiusOptions = [3, 5, 6, 8, 10, 15];

  // Stepper Progress calculation
  public progressPercent = computed(() => {
    const step = this.currentStep();
    if (step >= 6) return 100;
    return Math.round(((step - 1) / 5) * 100);
  });

  // Step Navigation
  public goToStep(step: number): void {
    if (step <= this.maxStepReached() && step < 6) {
      this.errorMessage.set('');
      this.currentStep.set(step);
    }
  }

  public nextStep(): void {
    this.errorMessage.set('');

    const step = this.currentStep();

    // Validation for Step 1
    if (step === 1) {
      if (!this.name().trim()) {
        this.errorMessage.set('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
        return;
      }
      const cleanPhone = this.phone().replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
        this.errorMessage.set('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
        return;
      }
      if (this.experienceYears() < 0) {
        this.errorMessage.set('কাজের অভিজ্ঞতা সঠিকভাবে উল্লেখ করুন।');
        return;
      }
    }

    // Validation for Step 2
    if (step === 2) {
      if (this.selectedCategoryIds().length === 0) {
        this.errorMessage.set('কমপক্ষে একটি কাজের ক্যাটাগরি নির্বাচন করুন।');
        return;
      }
      if (this.skills().length === 0) {
        this.errorMessage.set('কমপক্ষে একটি কাজের স্কিল বা কাজের ধরন সিলেক্ট করুন।');
        return;
      }
    }

    // Validation for Step 3: MANDATORY HOME LOCATION
    if (step === 3) {
      if (!this.homeAddress().trim()) {
        this.errorMessage.set('বাসার সঠিক ও পূর্ণ ঠিকানা নির্ধারণ করা বাধ্যতামূলক।');
        return;
      }
      if (!this.lat() || !this.lng()) {
        this.errorMessage.set('ম্যাপে বাসার স্থানাঙ্ক (Latitude / Longitude) পিন করা বাধ্যতামূলক।');
        return;
      }
    }

    // Validation for Step 4: KYC
    if (step === 4) {
      const cleanNid = this.nidNumber().trim().replace(/[^0-9]/g, '');
      if (cleanNid.length < 10) {
        this.errorMessage.set('সঠিক জাতীয় পরিচয়পত্র (NID) নম্বর লিখুন (১০ বা ১৭ ডিজিট)।');
        return;
      }
      if (!this.nidFrontURL() || !this.nidBackURL() || !this.selfieURL()) {
        this.errorMessage.set('NID এর সামনের ও পেছনের ছবি এবং লাইভ সেলফি প্রিভিউ প্রদান আবশ্যক।');
        return;
      }
    }

    // Advance to next step
    const next = step + 1;
    this.currentStep.set(next);
    if (next > this.maxStepReached()) {
      this.maxStepReached.set(next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public prevStep(): void {
    if (this.currentStep() > 1) {
      this.errorMessage.set('');
      this.currentStep.update(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Step 2 Category Toggle
  public toggleCategory(catId: string): void {
    const list = [...this.selectedCategoryIds()];
    const idx = list.indexOf(catId);
    if (idx >= 0) {
      if (list.length > 1) {
        list.splice(idx, 1);
      }
    } else {
      list.push(catId);
    }
    this.selectedCategoryIds.set(list);
  }

  public isCategorySelected(catId: string): boolean {
    return this.selectedCategoryIds().includes(catId);
  }

  // Step 2 Skills
  public toggleSkill(skill: string): void {
    const current = [...this.skills()];
    const idx = current.indexOf(skill);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(skill);
    }
    this.skills.set(current);
  }

  public hasSkill(skill: string): boolean {
    return this.skills().includes(skill);
  }

  public addCustomSkill(): void {
    const val = this.customSkillInput().trim();
    if (val && !this.skills().includes(val)) {
      this.skills.update(list => [...list, val]);
      this.customSkillInput.set('');
    }
  }

  public removeSkill(skill: string): void {
    this.skills.update(list => list.filter(s => s !== skill));
  }

  // Step 3 Location GPS & Presets
  public detectCurrentLocation(): void {
    this.isDetectingLocation.set(true);
    this.locationService.detectCurrentPosition().then(point => {
      this.isDetectingLocation.set(false);
      this.lat.set(Number(point.lat.toFixed(6)));
      this.lng.set(Number(point.lng.toFixed(6)));
      if (point.address) {
        this.homeAddress.set(point.address);
      }
      this.successMessage.set('আপনার বর্তমান অবস্থান সফলভাবে চিহ্নিত করা হয়েছে!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }).catch(() => {
      this.isDetectingLocation.set(false);
      this.errorMessage.set('লোকেশন ডিটেক্ট করা সম্ভব হয়নি, ড্রপডাউন থেকে নির্বাচন করুন।');
    });
  }

  public selectPresetLocation(preset: any): void {
    this.lat.set(preset.lat);
    this.lng.set(preset.lng);
    this.homeAddress.set(preset.address);
    this.areaId.set(preset.areaId);
    this.successMessage.set(`"${preset.label}" লোকেশন সফলভাবে সেট করা হয়েছে।`);
    setTimeout(() => this.successMessage.set(''), 2500);
  }

  // Step 4 KYC Photo Simulation
  public setSampleKYC(): void {
    this.nidNumber.set('19892691234567890');
    this.nidFrontURL.set('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400');
    this.nidBackURL.set('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400');
    this.selfieURL.set('https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400');
    this.successMessage.set('নমুনা KYC ডকুমেন্টের ছবি লোড করা হয়েছে।');
    setTimeout(() => this.successMessage.set(''), 2500);
  }

  public onFileUpload(event: any, field: 'nidFront' | 'nidBack' | 'selfie' | 'photo'): void {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const url = e.target.result;
        if (field === 'nidFront') this.nidFrontURL.set(url);
        if (field === 'nidBack') this.nidBackURL.set(url);
        if (field === 'selfie') this.selfieURL.set(url);
        if (field === 'photo') this.photoURL.set(url);
      };
      reader.readAsDataURL(file);
    }
  }

  // Final Step 5 Submission
  public submitOnboarding(): void {
    this.errorMessage.set('');

    if (this.rate() <= 0) {
      this.errorMessage.set('কাজের সঠিক রেট প্রদান করুন।');
      return;
    }

    this.isLoading.set(true);

    setTimeout(async () => {
      const uid = 'worker_onboard_' + Date.now();
      const cleanPhone = this.phone().replace(/[^0-9]/g, '');

      // Create Public Worker Profile
      const workerProfile: WorkerProfile = {
        uid,
        name: this.name().trim(),
        photoURL: this.photoURL(),
        phone: cleanPhone,
        phoneMasked: `${cleanPhone.substring(0, 5)}-XXX-${cleanPhone.substring(cleanPhone.length - 3)}`,
        categoryIds: this.selectedCategoryIds(),
        skills: this.skills(),
        experienceYears: this.experienceYears(),
        bio: this.bio().trim(),
        rate: this.rate(),
        rateUnit: this.rateUnit(),
        serviceRadiusKm: this.serviceRadiusKm(),
        homeLocation: {
          lat: this.lat(),
          lng: this.lng(),
          address: this.homeAddress().trim()
        },
        areaId: this.areaId(),
        isOnline: true,
        isBusy: false,
        verificationStatus: 'pending', // Pending Admin verification
        verified: false,
        trustedBadge: false,
        isPremium: false,
        rating: 5.0,
        ratingCount: 0,
        totalJobs: 0,
        completionRate: 1.0,
        acceptRate: 1.0,
        cancelRate: 0.0,
        walletBalance: 0,
        commissionDue: 0,
        portfolio: [this.photoURL()],
        createdAt: new Date().toISOString()
      };

      // Create Private KYC data
      const workerPrivate: WorkerPrivate = {
        uid,
        nidNumber: this.nidNumber().trim(),
        nidFrontURL: this.nidFrontURL(),
        nidBackURL: this.nidBackURL(),
        selfieURL: this.selfieURL(),
        fullAddress: this.homeAddress().trim(),
        policeClearanceURL: this.policeClearanceURL() || undefined,
        bankInfo: {
          bkash: this.bkashNumber().trim() || undefined,
          nagad: this.nagadNumber().trim() || undefined
        }
      };

      // Save to worker service & localStorage
      this.workerService.updateWorker(workerProfile);
      this.workerService.saveWorkerPrivate(workerPrivate);

      // Create User account & log in
      const workerUser: User = {
        uid,
        role: 'worker',
        name: workerProfile.name,
        phone: workerProfile.phone,
        photoURL: workerProfile.photoURL,
        status: 'active',
        areaId: workerProfile.areaId,
        rating: 5.0,
        ratingCount: 0,
        createdAt: workerProfile.createdAt
      };

      // Persist to Firebase Firestore if connected
      try {
        if (this.firebaseService?.db) {
          await setDoc(doc(this.firebaseService.db, 'users', uid), workerUser);
          await setDoc(doc(this.firebaseService.db, 'workers', uid), workerProfile);
          await setDoc(doc(this.firebaseService.db, 'workerPrivate', uid), workerPrivate);
        }
      } catch (err) {
        console.warn('Failed to persist registered worker to Firestore:', err);
      }

      this.authService.setUser(workerUser, workerProfile);

      this.isLoading.set(false);
      this.currentStep.set(6); // Step 6 = Success Screen
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 900);
  }

  public navigateToWorkerDashboard(): void {
    this.router.navigate(['/worker']);
  }

  public navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
