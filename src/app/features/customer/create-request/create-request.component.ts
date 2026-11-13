import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { CategoryService } from '../../../core/services/category.service';
import { LocationService } from '../../../core/services/location.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { PaymentMethod } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

interface ServicePreset {
  label: string;
  category: string;
  title: string;
  description: string;
  suggestedPrice: number;
  icon: string;
}

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BnNumberPipe, TakaPipe],
  templateUrl: './create-request.component.html',
  styleUrl: './create-request.component.scss'
})
export class CreateRequestComponent {
  private jobService = inject(JobService);
  private categoryService = inject(CategoryService);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);
  private workerService = inject(WorkerService);
  private router = inject(Router);

  public currentUser = this.authService.currentUser;
  public userLocation = this.locationService.userLocation;
  public categories = this.categoryService.categories;

  // Form State
  public selectedCategoryId = signal<string>('plumber');
  public requestTitle = signal<string>('জরুরি প্লাম্বার প্রয়োজন — বাথরুমে পানির পাইপ লিকেজ');
  public requestDescription = signal<string>(
    'বাথরুমের মেইন সাপ্লাই পাইপ থেকে পানি লিক করছে এবং মেঝেতে পানি জমছে। জরুরি ভিত্তিতে একজন অভিজ্ঞ প্লাম্বার প্রয়োজন যিনি দ্রুত এসে পাইপ মেরামত করবেন।'
  );
  public estimatedBudget = signal<number>(400);
  public urgencyLevel = signal<'instant_grab' | 'scheduled'>('instant_grab');
  public paymentMethod = signal<PaymentMethod>('cash');
  public customAddress = signal<string>('সাভার বাজার বাসস্ট্যান্ড সংলগ্ন রোড, সাভার, ঢাকা');
  public isSubmitting = signal<boolean>(false);
  public selectedPhoto = signal<string>(
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600'
  );

  // Common quick problem presets for fast 1-click filing
  public readonly presets: ServicePreset[] = [
    {
      label: 'পানির পাইপ লিকেজ',
      category: 'plumber',
      title: 'বাথরুমের পানির পাইপ লিক করছে (প্লাম্বার প্রয়োজন)',
      description: 'বাথরুমের মেইন লাইনে পানির পাইপ ফেটে মেঝে ভিজে যাচ্ছে। দ্রুত এসে মেরামত করে দিতে হবে।',
      suggestedPrice: 380,
      icon: '💧'
    },
    {
      label: 'বেসিন / সিঙ্কের কল নষ্ট',
      category: 'plumber',
      title: 'কিচেনের সিঙ্কের কল ও ড্রেন পাইপ বদলানো',
      description: 'কিচেনের পানির কল বন্ধ হচ্ছে না এবং ড্রেন পাইপ দিয়ে পানি চুইয়ে পড়ছে। নতুন পাইপ লাগাতে হবে।',
      suggestedPrice: 400,
      icon: '🚰'
    },
    {
      label: 'কমোড বা ফ্লাশ ট্যাংক নষ্ট',
      category: 'plumber',
      title: 'কমোড ফ্লাশ ট্যাংক মেরামত ও হ্যান্ডল ফিটিং',
      description: 'টয়লেটের ফ্লাশ ট্যাঙ্ক স্বয়ংক্রিয়ভাবে পানি ছাড়ছে না এবং হ্যান্ডল আলগা হয়ে গেছে। মেরামত দরকার।',
      suggestedPrice: 450,
      icon: '🚽'
    },
    {
      label: 'পানির মোটর পাম্প চলছে না',
      category: 'plumber',
      title: 'পানির মোটর পাম্প চেক ও মেরামত সার্ভিস',
      description: 'মোটরে সুইচ দিলে বিদ্যুৎ পায় কিন্তু পানি উঠছে না। প্লাম্বার ও মোটর টেকনিশিয়ান প্রয়োজন।',
      suggestedPrice: 500,
      icon: '⚙️'
    },
    {
      label: 'গিজার / হিটার লাইন ফিটিং',
      category: 'plumber',
      title: 'গিজার সংযোগ ও গরম পানির লাইন ফিটিং',
      description: 'বাথরুমে নতুন গিজার স্থাপন ও গরম পানির পাইপ কানেকশন চেক করতে হবে।',
      suggestedPrice: 650,
      icon: '♨️'
    },
    {
      label: 'শর্ট সার্কিট / ফিউজ কাটা',
      category: 'electrician',
      title: 'জরুরি ইলেকট্রিশিয়ান — বাসার মেইন সুইচ ট্রিপ করছে',
      description: 'বাসার কয়েকটি রুমে হঠাৎ বিদ্যুৎ নেই এবং মেইন সার্কিট ব্রেকার ট্রিপ করছে। চেক করা দরকার।',
      suggestedPrice: 350,
      icon: '⚡'
    }
  ];

  public availablePhotos = [
    {
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
      label: 'পাইপ লিকেজ'
    },
    {
      url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600',
      label: 'সিঙ্ক ও কল'
    },
    {
      url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600',
      label: 'স্যানিটারি ফিটিংস'
    },
    {
      url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600',
      label: 'ইলেকট্রিক ওয়্যারিং'
    }
  ];

  // Active plumbers count nearby
  public nearbyPlumbersCount = computed(() => {
    const loc = this.userLocation();
    const cat = this.selectedCategoryId();
    return this.workerService.getNearbyWorkers(loc.lat, loc.lng, cat)
      .filter(w => w.isOnline).length || 2;
  });

  public selectCategory(catId: string): void {
    this.selectedCategoryId.set(catId);
    if (catId === 'plumber') {
      this.requestTitle.set('জরুরি প্লাম্বার প্রয়োজন — বাথরুমে পানির পাইপ লিকেজ');
      this.requestDescription.set('বাথরুমের মেইন সাপ্লাই পাইপ থেকে পানি লিক করছে। দ্রুত মেরামত করতে অভিজ্ঞ প্লাম্বার প্রয়োজন।');
      this.estimatedBudget.set(400);
    } else if (catId === 'electrician') {
      this.requestTitle.set('জরুরি ইলেকট্রিশিয়ান প্রয়োজন — ওয়্যারিং ও সুইচ মেরামত');
      this.requestDescription.set('বাসার রুমের লাইট ও ফ্যানের সুইচ কাজ করছে না। দ্রুত একজন ইলেকট্রিশিয়ান প্রয়োজন।');
      this.estimatedBudget.set(350);
    } else if (catId === 'ac_technician') {
      this.requestTitle.set('এসি সার্ভিসিং ও গ্যাস চার্জিং প্রয়োজন');
      this.requestDescription.set('এসি চলছে কিন্তু পর্যাপ্ত ঠান্ডা হচ্ছে না। ফিল্টার ক্লিনিং ও গ্যাস প্রেসার চেক করতে হবে।');
      this.estimatedBudget.set(800);
    }
  }

  public applyPreset(preset: ServicePreset): void {
    this.selectedCategoryId.set(preset.category);
    this.requestTitle.set(preset.title);
    this.requestDescription.set(preset.description);
    this.estimatedBudget.set(preset.suggestedPrice);
  }

  public setBudget(amount: number): void {
    this.estimatedBudget.set(amount);
  }

  public submitRequest(): void {
    if (!this.requestDescription().trim()) {
      alert('অনুগ্রহ করে কাজের বিবরণ লিখুন।');
      return;
    }

    this.isSubmitting.set(true);

    const user = this.currentUser();
    const loc = this.userLocation();
    const catId = this.selectedCategoryId();
    const cat = this.categoryService.getCategoryById(catId);
    const categoryName = cat ? cat.nameBn : 'প্লাম্বার (পাইপ ফিটিং)';

    const address = this.customAddress().trim() || loc.address || 'সাভার বাজার, সাভার, ঢাকা';

    const newJob = this.jobService.createJob({
      customerId: user?.uid || 'user_customer_demo_1',
      customerName: user?.name || 'তানভীর আহমেদ',
      customerPhone: user?.phone || '01712345678',
      categoryId: catId,
      categoryName: categoryName,
      areaId: 'savar_bazar',
      type: 'board_fixed',
      status: 'searching',
      workerId: null, // Unassigned! Waiting for first plumber to grab!
      description: `${this.requestTitle()}: ${this.requestDescription()}`,
      estimatedPrice: this.estimatedBudget(),
      location: {
        lat: loc.lat,
        lng: loc.lng,
        address: address
      },
      photos: this.selectedPhoto() ? [this.selectedPhoto()] : [],
      paymentMethod: this.paymentMethod()
    });

    this.isSubmitting.set(false);

    // Direct user to live tracking/status screen
    this.router.navigate(['/customer/tracking', newJob.id]);
  }
}
