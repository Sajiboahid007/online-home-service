import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Select } from 'primeng/select';
import { JobService } from '../../../core/services/job.service';
import { CategoryService } from '../../../core/services/category.service';
import { LocationService } from '../../../core/services/location.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PaymentMethod } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DoorstepPin, DoorstepPinPickerComponent } from '../../../shared/components/doorstep-pin-picker/doorstep-pin-picker.component';
import { CategoryIconComponent } from '../../../shared/components/category-icon/category-icon.component';

export interface CategoryOption {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
}

export interface ServicePreset {
  id: string;
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
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Select,
    BnNumberPipe,
    TakaPipe,
    TranslatePipe,
    DoorstepPinPickerComponent,
    CategoryIconComponent
  ],
  templateUrl: './create-request.component.html',
  styleUrl: './create-request.component.scss'
})
export class CreateRequestComponent implements OnInit {
  private jobService = inject(JobService);
  private categoryService = inject(CategoryService);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);
  private workerService = inject(WorkerService);
  private router = inject(Router);
  public theme = inject(ThemeService);
  public isEn = computed(() => this.theme.currentLang() === 'en');

  public currentUser = this.authService.currentUser;
  public userLocation = this.locationService.userLocation;
  public categories = this.categoryService.categories;

  // Category Options for p-select
  public categoryOptions: CategoryOption[] = [];
  public selectedCategory: CategoryOption | null = null;
  public selectedCategoryId = signal<string>('plumber');

  // Common quick problem presets for all categories
  public readonly presets: ServicePreset[] = [
    // Plumber
    {
      id: 'p1',
      label: 'পানির পাইপ লিকেজ',
      category: 'plumber',
      title: 'বাথরুমের পানির পাইপ লিক করছে (প্লাম্বার প্রয়োজন)',
      description: 'বাথরুমের মেইন সাপ্লাই পাইপ ফেটে মেঝে ভিজে যাচ্ছে। দ্রুত মেরামত করতে অভিজ্ঞ প্লাম্বার প্রয়োজন।',
      suggestedPrice: 380,
      icon: 'pi pi-wrench'
    },
    {
      id: 'p2',
      label: 'বেসিন / সিঙ্কের কল নষ্ট',
      category: 'plumber',
      title: 'কিচেনের সিঙ্কের কল ও ড্রেন পাইপ বদলানো',
      description: 'কিচেনের পানির কল বন্ধ হচ্ছে না এবং ড্রেন পাইপ দিয়ে পানি চুইয়ে পড়ছে। নতুন পাইপ ও কল ফিটিং করতে হবে।',
      suggestedPrice: 400,
      icon: 'pi pi-wrench'
    },
    {
      id: 'p3',
      label: 'কমোড বা ফ্লাশ ট্যাংক নষ্ট',
      category: 'plumber',
      title: 'কমোড ফ্লাশ ট্যাংক মেরামত ও হ্যান্ডল ফিটিং',
      description: 'টয়লেটের ফ্লাশ ট্যাঙ্ক স্বয়ংক্রিয়ভাবে পানি ছাড়ছে না এবং হ্যান্ডল আলগা হয়ে গেছে। জরুরি মেরামত দরকার।',
      suggestedPrice: 450,
      icon: 'pi pi-cog'
    },
    {
      id: 'p4',
      label: 'পানির মোটর পাম্প চলছে না',
      category: 'plumber',
      title: 'পানির মোটর পাম্প চেক ও মেরামত সার্ভিস',
      description: 'মোটরে সুইচ দিলে বিদ্যুৎ পায় কিন্তু পানি উঠছে না। প্লাম্বার ও মোটর টেকনিশিয়ান প্রয়োজন।',
      suggestedPrice: 500,
      icon: 'pi pi-cog'
    },
    {
      id: 'p5',
      label: 'গিজার / হিটার লাইন ফিটিং',
      category: 'plumber',
      title: 'গিজার সংযোগ ও গরম পানির লাইন ফিটিং',
      description: 'বাথরুমে নতুন গিজার স্থাপন ও গরম পানির পাইপ কানেকশন চেক করতে হবে।',
      suggestedPrice: 650,
      icon: 'pi pi-sliders-h'
    },

    // Electrician
    {
      id: 'e1',
      label: 'শর্ট সার্কিট / ফিউজ কাটা',
      category: 'electrician',
      title: 'জরুরি ইলেকট্রিশিয়ান — বাসার মেইন সুইচ ট্রিপ করছে',
      description: 'বাসার কয়েকটি রুমে হঠাৎ বিদ্যুৎ নেই এবং মেইন সার্কিট ব্রেকার ট্রিপ করছে। জরুরি চেক করা দরকার।',
      suggestedPrice: 350,
      icon: 'pi pi-bolt'
    },
    {
      id: 'e2',
      label: 'ফ্যান ও লাইট ওয়্যারিং মেরামত',
      category: 'electrician',
      title: 'সিলিং ফ্যান রেগুলেটর ও লাইট পয়েন্ট মেরামত',
      description: 'সিলিং ফ্যানের স্পিড কন্ট্রোল হচ্ছে না এবং দুটি এলইডি লাইট পয়েন্ট হঠাৎ বন্ধ হয়ে গেছে। মেরামত প্রয়োজন।',
      suggestedPrice: 400,
      icon: 'pi pi-lightbulb'
    },
    {
      id: 'e3',
      label: 'সুইচ বোর্ড ও সকেট পরিবর্তন',
      category: 'electrician',
      title: 'মাল্টিপ্লাগ ও দেয়াল সুইচ বোর্ড নতুন ফিটিং',
      description: 'পুরাতন পোড়া সুইচবোর্ড খুলে নতুন গ্যাং সুইচ ও ৩-পিন পাওয়ার সকেট ফিটিং করতে হবে।',
      suggestedPrice: 300,
      icon: 'pi pi-power-off'
    },
    {
      id: 'e4',
      label: 'সার্কিট ব্রেকার ও ডিবি বক্স চেক',
      category: 'electrician',
      title: 'মেইন ডিস্ট্রিবিউশন বক্স ও সার্কিট ব্রেকার ইন্সটলেশন',
      description: 'মেইন ডিবি বক্সে স্পার্ক করছে। প্রফেশনাল ইলেকট্রিশিয়ান দিয়ে সম্পূর্ণ বক্স চেক ও নতুন ব্রেকার বসাতে হবে।',
      suggestedPrice: 550,
      icon: 'pi pi-shield'
    },

    // AC Technician
    {
      id: 'ac1',
      label: 'এসি সার্ভিসিং ও ওয়াশ (জেট ওয়াশ)',
      category: 'ac_technician',
      title: 'স্প্লিট এসি মাস্টার সার্ভিসিং ও কেমিক্যাল ওয়াশ',
      description: 'ইনডোর ও আউটডোর ইউনিটের এয়ার ফিল্টার ও কুলিং কয়েল প্রেসার জেট দিয়ে গভীর পরিষ্কার করতে হবে।',
      suggestedPrice: 600,
      icon: 'pi pi-asterisk'
    },
    {
      id: 'ac2',
      label: 'এসি গ্যাস রিফিলিং ও প্রেসার চেক',
      category: 'ac_technician',
      title: 'এসি কম্প্রেসার গ্যাস চার্জিং ও লিকেজ টেস্ট',
      description: 'এসি চলছে কিন্তু কোনো ঠান্ডা বাতাস দিচ্ছে না। আর-৩২ / আর-৪১০এ গ্যাস রিচার্জ ও কপার পাইপ টেস্ট প্রয়োজন।',
      suggestedPrice: 1200,
      icon: 'pi pi-gauge'
    },
    {
      id: 'ac3',
      label: 'ইনডোর ইউনিট থেকে পানি পড়া',
      category: 'ac_technician',
      title: 'এসির ড্রেন পাইপ ব্লকেজ ক্লিয়ারিং ও মেরামত',
      description: 'এসি চালু করলে রুমের ভেতরে ইনডোর থেকে পানি ঝরছে। ড্রেন পাইপের জট ছাড়াতে হবে।',
      suggestedPrice: 500,
      icon: 'pi pi-wrench'
    },

    // Cleaner
    {
      id: 'c1',
      label: 'বাথরুম ডিপ ক্লিনিং',
      category: 'cleaner',
      title: 'বাথরুম টাইলস, কমোড ও বেসিন কেমিক্যাল ওয়াশ',
      description: 'বাথরুমের ফ্লোর টাইলসের দাগ, গ্রাউটিং ও বেসিন সম্পূর্ণ জীবাণুমুক্ত ডিপ ক্লিন করতে হবে।',
      suggestedPrice: 500,
      icon: 'pi pi-sparkles'
    },
    {
      id: 'c2',
      label: 'কিচেন ডিপ ক্লিনিং ও তেলচিটচিটে দূর',
      category: 'cleaner',
      title: 'রান্নাঘরের চুলার স্ল্যাব, হুড ও কিচেন ক্যাবিনেট ডিপ ক্লিন',
      description: 'রান্নাঘরের গ্রিজ ও তেলচিটচিটে ময়লা বিশেষ ফোম দিয়ে সম্পূর্ণ ক্লিন করে চকচকে করতে হবে।',
      suggestedPrice: 700,
      icon: 'pi pi-sparkles'
    },
    {
      id: 'c3',
      label: 'পুরো বাসা ফুল ডিপ ক্লিনিং',
      category: 'cleaner',
      title: 'সম্পূর্ণ ফ্ল্যাট/বাসার মেঝে, কাচ ও আসবাবপত্র ক্লিনিং',
      description: 'বাসা বদলের পর বা উৎসবের আগে সম্পূর্ণ ফ্ল্যাট পরিষ্কার ও স্যানিটাইজেশন সার্ভিস।',
      suggestedPrice: 1500,
      icon: 'pi pi-home'
    },

    // Painter
    {
      id: 'pt1',
      label: 'দেওয়াল পেইন্ট ও পুটিং টাচআপ',
      category: 'painter',
      title: 'রুমের অভ্যন্তরীণ দেয়াল প্লাস্টিক পেইন্ট ও টাচআপ',
      description: 'বেডরুমের দেয়ালে প্লাস্টিক পেইন্ট ও ক্র্যাক পুটিং মেরামত করে ফ্রেশ লুক দিতে হবে।',
      suggestedPrice: 1200,
      icon: 'pi pi-palette'
    },
    {
      id: 'pt2',
      label: 'ড্যাম্প কোটিং ও ওয়াটারপ্রুফিং',
      category: 'painter',
      title: 'দেওয়ালের নোনা ও ড্যাম্প প্রতিরোধক কোটিং',
      description: 'বর্ষায় দেয়ালে নোনা ধরে রং খসে পড়ছে। বিশেষ ড্যাম্প সিল কোটিং প্রয়োগ করতে হবে।',
      suggestedPrice: 1500,
      icon: 'pi pi-shield'
    },

    // Labor
    {
      id: 'l1',
      label: 'বাসা বদল ও মালামাল বহন (২ জন শ্রমিক)',
      category: 'day_laborer',
      title: 'বাসা বদলের আসবাবপত্র ও কার্টুন পরিবহন শ্রমিক',
      description: 'ফ্ল্যাট শিফটিংয়ের জন্য খাট, আলমারি, সোফা ও বক্স বহন করতে দক্ষ ২ জন দিনমজুর প্রয়োজন।',
      suggestedPrice: 1200,
      icon: 'pi pi-box'
    },
    {
      id: 'l2',
      label: 'ভারী আসবাবপত্র ও মালামাল ওঠানামা',
      category: 'day_laborer',
      title: 'সিঁড়ি দিয়ে ভারী আসবাব বা পণ্য ওঠানামার শ্রমিক',
      description: 'বিল্ডিংয়ের নিচতলা থেকে তিনতলায় ভারী ফার্নিচার ওঠানোর জন্য শ্রমিক প্রয়োজন।',
      suggestedPrice: 600,
      icon: 'pi pi-users'
    },

    // Mason
    {
      id: 'm1',
      label: 'টাইলস মেরামত ও নতুন বসানো',
      category: 'mason',
      title: 'ভেঙে যাওয়া টাইলস খুলে নতুন টাইলস ফিটিং',
      description: 'ফ্লোর ও বাথরুমের ফাঁপা টাইলস সিমেন্ট গ্রাউট দিয়ে মজবুতভাবে বসাতে হবে।',
      suggestedPrice: 700,
      icon: 'pi pi-th-large'
    },
    {
      id: 'm2',
      label: 'দেওয়ালের ফাটল ও প্লাস্টার মেরামত',
      category: 'mason',
      title: 'ইটের গাঁথুনি ও প্লাস্টার মেরামত কাজ',
      description: 'ভেঙে যাওয়া প্লাস্টার নতুন করে বালু-সিমেন্ট দিয়ে মসৃণ করে দিতে হবে।',
      suggestedPrice: 800,
      icon: 'pi pi-building'
    },

    // Carpenter
    {
      id: 'cp1',
      label: 'দরজার লক ও হ্যান্ডেল মেরামত',
      category: 'carpenter',
      title: 'মেইন দরজার সিলিন্ডার লক ও হ্যান্ডল পরিবর্তন',
      description: 'মেইন দরজার চাবি আটকে গেছে ও লক ঠিকমতো ঘুরছে না। লকসেট মেরামত বা পরিবর্তন দরকার।',
      suggestedPrice: 350,
      icon: 'pi pi-lock'
    },
    {
      id: 'cp2',
      label: 'ড্রয়ার, কব্জা ও ফার্নিচার মেরামত',
      category: 'carpenter',
      title: 'ওয়ারড্রব পাল্লা ও ড্রয়ারের হাইড্রলিক চ্যানেল মেরামত',
      description: 'ওয়ারড্রবের পাল্লা বাঁকা হয়ে আটকে যাচ্ছে এবং ড্রয়ারের চ্যানেল আলগা হয়ে গেছে। কাঠমিস্ত্রি প্রয়োজন।',
      suggestedPrice: 600,
      icon: 'pi pi-hammer'
    },

    // Appliance Repair
    {
      id: 'ar1',
      label: 'ফ্রিজ ঠান্ডা হচ্ছে না / মেরামত',
      category: 'appliance_repair',
      title: 'রেফ্রিজারেটর কুলিং সমস্যা ও কম্প্রেসার চেক',
      description: 'ফ্রিজের নিচের অংশ ঠান্ডা হচ্ছে না এবং অস্বাভাবিক শব্দ হচ্ছে। অভিজ্ঞ অ্যাপ্লায়েন্স টেকনিশিয়ান প্রয়োজন।',
      suggestedPrice: 550,
      icon: 'pi pi-desktop'
    },

    // Pest Control
    {
      id: 'pc1',
      label: 'তেলাপোকা ও ছারপোকা দমন',
      category: 'pest_control',
      title: 'বাসার তেলাপোকা ও ছারপোকা দমনে নিরাপদ পেস্ট কন্ট্রোল',
      description: 'রান্নাঘর ও বেডরুমে গন্ধহীন জেল ও স্প্রে ট্রিটমেন্ট করতে অভিজ্ঞ পেস্ট কন্ট্রোল টিম প্রয়োজন।',
      suggestedPrice: 1000,
      icon: 'pi pi-shield'
    },

    // Shifting & Moving
    {
      id: 'sm1',
      label: 'বাসা বদল প্যাকিং ও ফার্নিচার শিফটিং',
      category: 'shifting_moving',
      title: 'বাসা বদলের জন্য আসবাবপত্র প্যাকিং ও স্থানান্তর',
      description: 'খাট, ফ্রিজ, ওয়ারড্রব ও অন্যান্য আসবাবপত্র যত্নসহকারে প্যাকিং ও শিফটিং করার জন্য দক্ষ টিম প্রয়োজন।',
      suggestedPrice: 1200,
      icon: 'pi pi-truck'
    },

    // Locksmith
    {
      id: 'lk1',
      label: 'দরজার তালা খোলা ও লক পরিবর্তন',
      category: 'locksmith',
      title: 'মেইন দরজার সিলিন্ডার লক মেরামত বা পরিবর্তন',
      description: 'দরজার তালা জ্যাম হয়ে আটকে গেছে। জরুরিভাবে লক খুলে নতুন সিকিউরিটি লক বসাতে হবে।',
      suggestedPrice: 350,
      icon: 'pi pi-key'
    },

    // Gardener
    {
      id: 'gd1',
      label: 'ছাদ বাগান ও গাছ পরিচর্যা',
      category: 'gardener',
      title: 'ছাদ বাগান পরিষ্কার, গাছ ছাঁটাই ও মাটি প্রস্তুত',
      description: 'ছাদ বাগানের গাছ ছাঁটাই, আগাছা পরিষ্কার ও নতুন টবে সার-মাটি প্রস্তুত করতে অভিজ্ঞ মালী প্রয়োজন।',
      suggestedPrice: 350,
      icon: 'pi pi-sun'
    },

    // Welder
    {
      id: 'wd1',
      label: 'গ্রিল ও লোহার গেট ওয়েল্ডিং',
      category: 'welder',
      title: 'মেইন গেট বা ব্যালকনির গ্রিল ওয়েল্ডিং মেরামত',
      description: 'লোহার গেটের কব্জা ভেঙে গেছে এবং ব্যালকনির গ্রিলে স্পট ওয়েল্ডিং করাতে হবে।',
      suggestedPrice: 550,
      icon: 'pi pi-cog'
    },

    // Car Wash
    {
      id: 'cw1',
      label: 'ডোরস্টেপ কার / বাইক ওয়াশ',
      category: 'car_wash',
      title: 'বাসার সামনে গাড়ি ফুল বডি ফোম ওয়াশ ও ক্লিনিং',
      description: 'গাড়ির বাইরের ফোম ওয়াশ ও ভেতরের ভ্যাকুয়াম ক্লিনিং করাতে হবে।',
      suggestedPrice: 400,
      icon: 'pi pi-car'
    },

    // CCTV & IT
    {
      id: 'ct1',
      label: 'সিসিটিভি ও ওয়াইফাই সেটআপ',
      category: 'cctv_it',
      title: 'বাসা-অফিসে সিসিটিভি ক্যামেরা ও রাউটার কনফিগারেশন',
      description: 'নতুন সিসিটিভি ক্যামেরা ইনস্টলেশন ও ওয়াইফাই রাউটার কনফিগার করতে দক্ষ টেকনিশিয়ান প্রয়োজন।',
      suggestedPrice: 600,
      icon: 'pi pi-video'
    }
  ];

  // Available Presets for selected category
  public availablePresets: ServicePreset[] = [];
  public selectedPreset: ServicePreset | null = null;
  public selectedPresetId = signal<string>('p1');

  // Form State
  public requestTitle = signal<string>('জরুরি প্লাম্বার প্রয়োজন — বাথরুমে পানির পাইপ লিকেজ');
  public requestDescription = signal<string>(
    'বাথরুমের মেইন সাপ্লাই পাইপ থেকে পানি লিক করছে এবং মেঝেতে পানি জমছে। জরুরি ভিত্তিতে একজন অভিজ্ঞ প্লাম্বার প্রয়োজন যিনি দ্রুত এসে পাইপ মেরামত করবেন।'
  );
  public estimatedBudget = signal<number>(400);
  public urgencyLevel = signal<'instant_grab' | 'scheduled'>('instant_grab');
  public paymentMethod = signal<PaymentMethod>('cash');
  public doorstepPin = signal<DoorstepPin | null>(null);
  public isSubmitting = signal<boolean>(false);

  // Active technicians count nearby
  public nearbyPlumbersCount = computed(() => {
    const loc = this.userLocation();
    const cat = this.selectedCategoryId();
    return this.workerService.getNearbyWorkers(loc.lat, loc.lng, cat)
      .filter(w => w.isOnline).length || 2;
  });

  ngOnInit(): void {
    const cats = this.categories();
    this.categoryOptions = cats.map(c => ({
      id: c.id,
      nameBn: c.nameBn,
      nameEn: c.nameEn,
      icon: c.icon
    }));

    const defaultCat = this.categoryOptions.find(c => c.id === 'plumber') || this.categoryOptions[0] || null;
    this.selectedCategory = defaultCat;
    if (defaultCat) {
      this.selectedCategoryId.set(defaultCat.id);
    }

    this.updatePresetsForCategory(defaultCat ? defaultCat.id : 'plumber');
  }

  public updatePresetsForCategory(catId: string): void {
    this.availablePresets = this.presets.filter(p => p.category === catId);
    if (this.availablePresets.length > 0) {
      const defaultPreset = this.availablePresets[0];
      this.selectedPreset = defaultPreset;
      this.selectedPresetId.set(defaultPreset.id);
      this.requestTitle.set(defaultPreset.title);
      this.requestDescription.set(defaultPreset.description);
      this.estimatedBudget.set(defaultPreset.suggestedPrice);
    } else {
      this.selectedPreset = null;
      this.selectedPresetId.set('');
      const cat = this.categoryService.getCategoryById(catId);
      const name = cat ? cat.nameBn : 'সার্ভিস';
      this.requestTitle.set(`জরুরি ${name} প্রয়োজন`);
      this.requestDescription.set(`${name} সংক্রান্ত জরুরি কাজের জন্য অভিজ্ঞ কারিগর প্রয়োজন।`);
      this.estimatedBudget.set(400);
    }
  }

  public onCategoryChange(catOrId: any): void {
    const cat = typeof catOrId === 'object' && catOrId ? catOrId : this.categoryOptions.find(c => c.id === catOrId);
    if (!cat) return;
    this.selectedCategory = cat;
    this.selectedCategoryId.set(cat.id);
    this.updatePresetsForCategory(cat.id);
  }

  public onPresetChange(presetOrId: any): void {
    const preset = typeof presetOrId === 'object' && presetOrId ? presetOrId : this.presets.find(p => p.id === presetOrId);
    if (!preset) return;
    this.selectedPreset = preset;
    this.selectedPresetId.set(preset.id);
    this.selectedCategoryId.set(preset.category);

    if (!this.selectedCategory || this.selectedCategory.id !== preset.category) {
      const cat = this.categoryOptions.find(c => c.id === preset.category);
      if (cat) {
        this.selectedCategory = cat;
      }
    }

    this.requestTitle.set(preset.title);
    this.requestDescription.set(preset.description);
    this.estimatedBudget.set(preset.suggestedPrice);
  }

  public setBudget(amount: number): void {
    this.estimatedBudget.set(amount);
  }

  // Submit new request
  public submitRequest(): void {
    if (!this.requestDescription().trim()) {
      alert('অনুগ্রহ করে কাজের বিবরণ লিখুন।');
      return;
    }

    this.isSubmitting.set(true);

    const user = this.currentUser();
    const loc = this.userLocation();
    const catId = this.selectedCategory?.id || this.selectedCategoryId();
    const cat = this.categoryService.getCategoryById(catId);
    const categoryName = this.selectedCategory?.nameBn || cat?.nameBn || 'প্লাম্বার (পাইপ ফিটিং)';

    const pin = this.doorstepPin();
    const pinLoc = pin?.location ?? loc;

    const newJob = this.jobService.createJob({
      customerId: user?.uid || 'user_customer_demo_1',
      customerName: user?.name || 'তানভীর আহমেদ',
      customerPhone: user?.phone || '01712345678',
      categoryId: catId,
      categoryName: categoryName,
      areaId: 'savar_bazar',
      type: 'board_fixed',
      status: 'searching',
      workerId: null, // Open request waiting for first technician to grab!
      description: `${this.requestTitle()}: ${this.requestDescription()}`,
      estimatedPrice: this.estimatedBudget(),
      location: {
        lat: pinLoc.lat,
        lng: pinLoc.lng,
        address: pinLoc.address || 'সাভার বাজার, সাভার, ঢাকা'
      },
      locationPinned: pin?.pinned ?? false,
      landmark: pin?.landmark || undefined,
      doorPhotoURL: pin?.doorPhotoURL,
      photos: [], // Sample photos removed per user requirement
      paymentMethod: this.paymentMethod()
    });

    this.isSubmitting.set(false);

    // Direct user to live tracking/status screen
    this.router.navigate(['/customer/tracking', newJob.id]);
  }
}
