import { Component, computed, signal, effect, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { JobService } from '../../../core/services/job.service';
import { DispatchService } from '../../../core/services/dispatch.service';
import { CategoryService } from '../../../core/services/category.service';
import { AreaService } from '../../../core/services/area.service';
import { ThemeService } from '../../../core/services/theme.service';
import { WorkerProfile } from '../../../core/models/worker.model';
import { Category } from '../../../core/models/category.model';
import { Job } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { CategoryIconComponent } from '../../../shared/components/category-icon/category-icon.component';

export interface ProfessionalJobScenario {
  id: string;
  label: string;
  categoryName: string;
  categoryId: string;
  icon: string;
  customerName: string;
  customerPhone: string;
  customerRating: number;
  description: string;
  estimatedPrice: number;
  address: string;
  landmark: string;
  lat: number;
  lng: number;
  photoURL?: string;
}

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Select, BnNumberPipe, TakaPipe, TimeAgoPipe, TranslatePipe, CategoryIconComponent],
  templateUrl: './worker-dashboard.component.html',
  styleUrl: './worker-dashboard.component.scss'
})
export class WorkerDashboardComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  public workerService = inject(WorkerService);
  public jobService = inject(JobService);
  private dispatchService = inject(DispatchService);
  private categoryService = inject(CategoryService);
  private areaService = inject(AreaService);
  public theme = inject(ThemeService);
  public isEn = computed(() => this.theme.currentLang() === 'en');
  private router = inject(Router);

  // Professional Job Request Scenarios (realistic, technical & non-funny)
  public readonly professionalScenarios: ProfessionalJobScenario[] = [
    {
      id: 'sc_plumb_1',
      label: 'বাথরুম কনসিল্ড পাইপলাইন প্রেশার টেস্ট ও মেরামত',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      categoryId: 'plumber',
      icon: 'pi pi-wrench',
      customerName: 'প্রকৌশলী জাহিদুল ইসলাম',
      customerPhone: '01712345678',
      customerRating: 4.9,
      description: 'মাস্টার বাথরুমের ফলস সিলিং সংলগ্ন পিভিসি মেইন লাইনের প্রেশার জয়েন্টে লিকেজ হচ্ছে। কনসিল্ড ভালভ ও পাইপ ফিটিংস মেরামত সহ জরুরি টেকনিক্যাল পরিদর্শন প্রয়োজন।',
      estimatedPrice: 450,
      address: 'বাড়ি #২৮, রোড #৩, সাভার থানা রোড, সাভার বাজার',
      landmark: 'সাভার থানা ভবনের বিপরীতে, সবুজ গেট',
      lat: 23.8245,
      lng: 90.2685,
      photoURL: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500'
    },
    {
      id: 'sc_plumb_2',
      label: 'কিচেন আন্ডার-কাউন্টার ড্রেন পাইপ ও মিক্সার ট্যাপ ফিটিং',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      categoryId: 'plumber',
      icon: 'pi pi-wrench',
      customerName: 'ড. শায়লা নাজনীন',
      customerPhone: '01819876543',
      customerRating: 5.0,
      description: 'কিচেন সিঙ্কের নিচের ইউ-ট্র্যাপ সংযোগে লিকেজ দেখা দিয়েছে এবং গরম-ঠান্ডা পানির নতুন মিক্সার ট্যাপ ইনস্টল করতে হবে। প্রয়োজনীয় ফিটিংস ক্রয় করা আছে।',
      estimatedPrice: 500,
      address: 'ফ্ল্যাট ৫বি, স্বপ্নডাঙ্গা টাওয়ার, নামাবাজার, সাভার',
      landmark: 'নামাবাজার ব্রিজ সংলগ্ন',
      lat: 23.8188,
      lng: 90.2642,
      photoURL: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500'
    },
    {
      id: 'sc_plumb_3',
      label: '১০০০ লিটার পানির ট্যাংক সেন্সর ও অটোমেশন লাইন চেক',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      categoryId: 'plumber',
      icon: 'pi pi-cog',
      customerName: 'মো: তানভীর আহমেদ',
      customerPhone: '01912345678',
      customerRating: 4.8,
      description: 'ছাদের ১০০০ লিটার ওভারহেড রিজার্ভার ট্যাংকের অটো-কাট সেন্সর কাজ করছে না এবং আউটলেট বাল্ব পরিবর্তন করতে হবে। অভিজ্ঞ স্যানিটারি টেকনিশিয়ান কাম্য।',
      estimatedPrice: 650,
      address: 'বাড়ি #১২, লেন #২, ব্যাংক কলোনি, সাভার',
      landmark: 'সোনালী ব্যাংকের দক্ষিণ পাশের গলি',
      lat: 23.8260,
      lng: 90.2640,
      photoURL: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500'
    },
    {
      id: 'sc_elec_1',
      label: 'মেইন ডিবি বক্স সার্কিট ব্রেকার ট্রিপিং ও আর্থিং সমাধান',
      categoryName: 'ইলেকট্রিশিয়ান',
      categoryId: 'electrician',
      icon: 'pi pi-bolt',
      customerName: 'ব্যবসায়ী কামরুল হাসান',
      customerPhone: '01866778899',
      customerRating: 4.9,
      description: 'বাসার মেইন ডিস্ট্রিবিউশন বোর্ডে ৪০ অ্যাম্পিয়ার আরসিডি ব্রেকার ঘন ঘন ট্রিপ করছে। শর্ট সার্কিট ও প্রোপার আর্থিং রেজিস্ট্যান্স পরীক্ষা আবশ্যক।',
      estimatedPrice: 550,
      address: 'বাড়ি #৯, রোড #৪, ব্যাংক টাউন, সাভার',
      landmark: 'ব্যাংক টাউন জামে মসজিদ সংলগ্ন',
      lat: 23.8245,
      lng: 90.2689,
      photoURL: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500'
    },
    {
      id: 'sc_ac_1',
      label: 'ইনভার্টার এসি নাইট্রোজেন প্রেশার টেস্ট ও গ্যাস চার্জ',
      categoryName: 'এসি টেকনিশিয়ান',
      categoryId: 'ac_technician',
      icon: 'pi pi-asterisk',
      customerName: 'মেজর (অব:) আহসান উল্লাহ',
      customerPhone: '01733446677',
      customerRating: 5.0,
      description: '১.৫ টন ইনভার্টার স্প্লিট এসির আউটডোর ইউনিটে কুলিং বন্ধ হয়ে গেছে। ফ্লেয়ার নাট সংযোগে গ্যাস লিকেজ টেস্ট করে গ্যাস চার্জ ও ইনডোর ইউনিট ক্লিনিং প্রয়োজন।',
      estimatedPrice: 1200,
      address: 'বাড়ি #১৫, রোড #৮, ডিইপিজেড এলাকা, আশুলিয়া',
      landmark: 'ডিইপিজেড ১ নং গেটের ৫০০ মিটার উত্তরে',
      lat: 23.9318,
      lng: 90.2917,
      photoURL: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500'
    },
    {
      id: 'sc_clean_1',
      label: 'ওভারহেড ওয়াটার রিজার্ভার ট্যাংক ডিপ স্যানিটাইজেশন',
      categoryName: 'ক্লিনার (পরিচ্ছন্নতাকর্মী)',
      categoryId: 'cleaner',
      icon: 'pi pi-sparkles',
      customerName: 'রোকেয়া বেগম',
      customerPhone: '01522334455',
      customerRating: 4.8,
      description: '১০০০ লিটার ওভারহেড পানির ট্যাংক রাসায়নিক ডিপ স্যানিটাইজেশন ও কিচেন চিমনি ডিপ ক্লিনিং সার্ভিস প্রয়োজন। পেশাদার ক্লিনিং ইকুইপমেন্ট আবশ্যক।',
      estimatedPrice: 600,
      address: 'বাড়ি #৭, থানা রোড, সাভার বাজার',
      landmark: 'সাভার মডেল থানার পূর্ব পাশে',
      lat: 23.8223,
      lng: 90.2673,
      photoURL: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'
    },
    {
      id: 'sc_paint_1',
      label: 'ইন্টেরিয়র ওয়াল ড্যাম্প কোটিং ও লাক্সারি টেক্সচার পেইন্ট',
      categoryName: 'পেইন্টার (রংমিস্ত্রি)',
      categoryId: 'painter',
      icon: 'pi pi-palette',
      customerName: 'মো: রফিকুল ইসলাম',
      customerPhone: '01877889900',
      customerRating: 4.9,
      description: 'ড্রয়িং রুমের দেয়ালে ড্যাম্প সলিউশন কোটিং, পুটিং এবং এশিয়ান পেইন্টস রয়েল লাক্সারি ইমালশন প্রয়োগের জন্য দক্ষ কারিগর আবশ্যক।',
      estimatedPrice: 950,
      address: 'হাউজ ৪২, লেন #৬, হেমায়েতপুর, সাভার',
      landmark: 'হেমায়েতপুর বাসস্ট্যান্ড মোড়',
      lat: 23.7915,
      lng: 90.2741,
      photoURL: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500'
    },
    {
      id: 'sc_carp_1',
      label: 'মডুলার কেবিনেট কবজা ও সিকিউরিটি ডোর লক ফিটিং',
      categoryName: 'কার্পেন্টার (কাঠমিস্ত্রি)',
      categoryId: 'carpenter',
      icon: 'pi pi-hammer',
      customerName: 'তাহমিনা আক্তার',
      customerPhone: '01699001122',
      customerRating: 4.8,
      description: 'মাস্টার বেডরুমের স্লাইডিং ওয়ারড্রব ট্র‍্যাক জ্যাম হয়েছে এবং প্রধান প্রবেশ দরজার সিলিন্ডার লক মেরামত করতে হবে। নিখুঁত মাপজোখের কাজ।',
      estimatedPrice: 500,
      address: 'ব্লক ডি, রোড #২, মিরপুর ১০, ঢাকা',
      landmark: 'মিরপুর আদর্শ উচ্চ বিদ্যালয়ের পাশে',
      lat: 23.8071,
      lng: 90.3686,
      photoURL: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500'
    },
    {
      id: 'sc_labor_1',
      label: 'বাসা শিফটিং ও ভারী মালামাল লোডিং-আনলোডিং',
      categoryName: 'দিনমজুর / শ্রমিক',
      categoryId: 'day_laborer',
      icon: 'pi pi-users',
      customerName: 'আবদুল্লাহ আল মামুন',
      customerPhone: '01711002233',
      customerRating: 4.7,
      description: 'বাসা পরিবর্তনের জন্য রেফ্রিজারেটর, খাট ও ওয়ারড্রব নিচতলা থেকে তৃতীয় তলায় যত্নসহকারে স্থানান্তর ও লোডিং-আনলোডিংয়ের দক্ষ কর্মী প্রয়োজন।',
      estimatedPrice: 850,
      address: 'বাড়ি #৭, রোড #১, সাভার বাজার, সাভার',
      landmark: 'সাভার বাজার সরকারি বালিকা বিদ্যালয়ের নিকট',
      lat: 23.8235,
      lng: 90.2675,
      photoURL: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500'
    },
    {
      id: 'sc_mason_1',
      label: 'বাথরুম টাইলস ফিটিং ও প্লাস্টার মেরামত',
      categoryName: 'রাজমিস্ত্রি',
      categoryId: 'mason',
      icon: 'pi pi-building',
      customerName: 'নুসরাত জাহান',
      customerPhone: '01744556677',
      customerRating: 4.9,
      description: 'বাথরুমের ফাঁপা টাইলস খুলে নতুন টাইলস বসানো ও দেয়ালের প্লাস্টার মেরামতের জন্য দক্ষ রাজমিস্ত্রি প্রয়োজন।',
      estimatedPrice: 850,
      address: 'ডিইপিজেড গেট #১ সংলগ্ন, আশুলিয়া',
      landmark: 'ডিইপিজেড ১ নং গেটের পূর্ব পাশে',
      lat: 23.9318,
      lng: 90.2917
    },
    {
      id: 'sc_app_1',
      label: 'ইনভার্টার ফ্রিজ কুলিং সমস্যা ও থার্মোস্ট্যাট চেক',
      categoryName: 'অ্যাপ্লায়েন্স মেরামত (ফ্রিজ/টিভি)',
      categoryId: 'appliance_repair',
      icon: 'pi pi-desktop',
      customerName: 'তানভীর আহমেদ',
      customerPhone: '01712345678',
      customerRating: 4.9,
      description: 'রেফ্রিজারেটরের নিচের চেম্বারে ঠান্ডা হচ্ছে না এবং কম্প্রেসার অস্বাভাবিক শব্দ করছে। জরুরি চেকআপ প্রয়োজন।',
      estimatedPrice: 550,
      address: 'বাড়ি #১২, রোড #৩, সাভার বাজার',
      landmark: 'নিউ মার্কেট রোড সংলগ্ন',
      lat: 23.8230,
      lng: 90.2660
    },
    {
      id: 'sc_pest_1',
      label: '৩ রুমের ফ্ল্যাটে তেলাপোকা ও ছারপোকা দমন সার্ভিস',
      categoryName: 'পেস্ট কন্ট্রোল (পোকামাকড় দমন)',
      categoryId: 'pest_control',
      icon: 'pi pi-shield',
      customerName: 'সাব্বির হোসেন',
      customerPhone: '01819876500',
      customerRating: 4.8,
      description: 'রান্নাঘর ও বেডরুমে জেল ও গন্ধহীন স্প্রে ট্রিটমেন্টের মাধ্যমে নিরাপদ পেস্ট কন্ট্রোল সার্ভিস প্রয়োজন।',
      estimatedPrice: 1100,
      address: 'বাড়ি #৪৫, রোড #২, সাভার থানা রোড',
      landmark: 'সাভার মডেল থানার পাশে',
      lat: 23.8245,
      lng: 90.2685
    },
    {
      id: 'sc_shift_1',
      label: '২ বেডরুম ফ্ল্যাটের বাসা বদল প্যাকিং ও শিফটিং',
      categoryName: 'বাসা বদল ও মুভিং',
      categoryId: 'shifting_moving',
      icon: 'pi pi-truck',
      customerName: 'ফারহানা রহমান',
      customerPhone: '01912345670',
      customerRating: 5.0,
      description: 'খাটের ডিসঅ্যাসেম্বল, ফ্রিজ ও আসবাবপত্র নিরাপদ প্যাকিং করে নতুন ফ্ল্যাটে সেটআপ করতে হবে।',
      estimatedPrice: 1500,
      address: 'স্বপ্ননীল টাওয়ার, সাভার বাসস্ট্যান্ড',
      landmark: 'সাভার বাসস্ট্যান্ড ওভারব্রিজ সংলগ্ন',
      lat: 23.8260,
      lng: 90.2640
    },
    {
      id: 'sc_lock_1',
      label: 'মেইন ডোর সিলিন্ডার লক পরিবর্তন ও ডুপ্লিকেট চাবি',
      categoryName: 'তালা-চাবি ও সিকিউরিটি',
      categoryId: 'locksmith',
      icon: 'pi pi-key',
      customerName: 'ইকবাল মাহমুদ',
      customerPhone: '01799887766',
      customerRating: 4.7,
      description: 'মেইন দরজার তালা জ্যাম হয়ে চাবি ভেঙে গেছে। জরুরিভাবে তালা খুলে নতুন সিকিউরিটি লক বসাতে হবে।',
      estimatedPrice: 400,
      address: 'হাউজ ১৭, ব্লক সি, শিমুলতলা, সাভার',
      landmark: 'শিমুলতলা জামে মসজিদের পাশে',
      lat: 23.8310,
      lng: 90.2710
    },
    {
      id: 'sc_garden_1',
      label: 'ছাদ বাগান পরিষ্কার, গাছ ছাঁটাই ও মাটি সার প্রস্তুত',
      categoryName: 'বাগান পরিচর্যা (মালী)',
      categoryId: 'gardener',
      icon: 'pi pi-sun',
      customerName: 'আরিফুল ইসলাম',
      customerPhone: '01733445566',
      customerRating: 4.8,
      description: 'বাসার ছাদ বাগানের ফলের গাছ ছাঁটাই, আগাছা পরিষ্কার ও নতুন টবে জৈব সারসহ মাটি প্রস্তুত করতে হবে।',
      estimatedPrice: 450,
      address: 'হেমায়েতপুর বাসস্ট্যান্ড, সাভার',
      landmark: 'হেমায়েতপুর বাজার মোড়',
      lat: 23.7915,
      lng: 90.2741
    },
    {
      id: 'sc_weld_1',
      label: 'ব্যালকনি গ্রিল ও মেইন গেটের হিঞ্জ ওয়েল্ডিং মেরামত',
      categoryName: 'ওয়েল্ডিং ও গ্রিল মিস্ত্রি',
      categoryId: 'welder',
      icon: 'pi pi-cog',
      customerName: 'রোকেয়া বেগম',
      customerPhone: '01822334455',
      customerRating: 4.9,
      description: 'লোহার মেইন গেটের নিচের কব্জা ভেঙে গেছে এবং ব্যালকনির গ্রিলে স্পট ওয়েল্ডিং করা প্রয়োজন।',
      estimatedPrice: 600,
      address: 'পল্লী বিদ্যুৎ রোড, আশুলিয়া, সাভার',
      landmark: 'পল্লী বিদ্যুৎ সাবস্টেশনের সামনে',
      lat: 23.9318,
      lng: 90.2917
    },
    {
      id: 'sc_wash_1',
      label: 'সেডান কার ফুল বডি প্রেশার ওয়াশ ও ইন্টেরিয়র ক্লিন',
      categoryName: 'গাড়ি ও বাইক ওয়াশ',
      categoryId: 'car_wash',
      icon: 'pi pi-car',
      customerName: 'মেহজাবিন চৌধুরী',
      customerPhone: '01611223344',
      customerRating: 5.0,
      description: 'বাসার গ্যারেজে গাড়ির এক্সটেরিয়র ফোম ওয়াশ, ড্যাশবোর্ড পলিশ ও সিট ভ্যাকুয়াম ক্লিনিং প্রয়োজন।',
      estimatedPrice: 500,
      address: 'রোড #৬, ব্লক #ডি, মিরপুর ১০, ঢাকা',
      landmark: 'মিরপুর গার্লস আইডিয়াল স্কুল সংলগ্ন',
      lat: 23.8071,
      lng: 90.3686
    },
    {
      id: 'sc_cctv_1',
      label: '৪টি সিসিটিভি ক্যামেরা সেটআপ ও ওয়াইফাই রাউটার কনফিগ',
      categoryName: 'সিসিটিভি ও ইন্টারনেট টেকনিশিয়ান',
      categoryId: 'cctv_it',
      icon: 'pi pi-video',
      customerName: 'নাজমুল হাসান',
      customerPhone: '01555667788',
      customerRating: 4.6,
      description: 'বাসার প্রবেশপথ ও গ্যারেজে ৪টি আইপি ক্যামেরা, এনভিআর ও মোবাইল ভিউ কনফিগারেশন করাতে হবে।',
      estimatedPrice: 900,
      address: 'নামাবাজার ঘাট রোড, সাভার',
      landmark: 'নামাবাজার ব্রিজের পশ্চিম পাশে',
      lat: 23.8188,
      lng: 90.2642
    }
  ];

  public selectedScenario: ProfessionalJobScenario = this.professionalScenarios[0];

  // Current active worker computed reactively
  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    return this.workerService.getWorkerById(uid) || authWorker || this.workerService.workers()[0] || null;
  });

  // Only the service categories this worker chose when creating/updating their account
  public workerCategories = computed<Category[]>(() => {
    const ids = this.currentWorker()?.categoryIds || [];
    const allCats = this.categoryService.categories();
    return allCats.filter(c => ids.includes(c.id));
  });

  // Scenarios filtered to the worker's chosen categories (fallback to all if none match)
  public availableScenarios = computed<ProfessionalJobScenario[]>(() => {
    const ids = this.currentWorker()?.categoryIds || [];
    if (ids.length === 0) return this.professionalScenarios;
    const filtered = this.professionalScenarios.filter(s => ids.includes(s.categoryId));
    return filtered.length > 0 ? filtered : this.professionalScenarios;
  });

  // Resolve worker's area zone name dynamically
  public workerAreaName = computed<string>(() => {
    const w = this.currentWorker();
    if (!w) return 'সাভার জোন';
    const area = this.areaService.getAreaById(w.areaId);
    return area?.zoneName || w.homeLocation?.address || 'সাভার জোন';
  });

  // Incoming offer signal from JobService
  public incomingOffer = this.jobService.incomingJobOfferSignal;
  public remainingSeconds = signal<number>(30);
  private countdownTimer: any = null;

  // Open Work Requests matching worker's category that need to be grabbed
  public openWorkRequests = computed<Job[]>(() => {
    const worker = this.currentWorker();
    if (!worker) return [];
    const cats = worker.categoryIds || ['plumber'];
    return this.jobService.jobs().filter((j: Job) => 
      !j.workerId && 
      (j.status === 'searching' || j.status === 'pending') && 
      cats.includes(j.categoryId)
    );
  });

  // Active job in progress/accepted
  public activeJob = computed<Job | null>(() => {
    const worker = this.currentWorker();
    if (!worker) return null;
    const activeStatuses = ['accepted', 'on_the_way', 'arrived', 'in_progress'];
    return this.jobService.jobs().find((j: Job) => j.workerId === worker.uid && activeStatuses.includes(j.status)) || null;
  });

  // Recent completed jobs
  public recentJobs = computed<Job[]>(() => {
    const worker = this.currentWorker();
    if (!worker) return [];
    return this.jobService.jobs()
      .filter((j: Job) => j.workerId === worker.uid && (j.status === 'completed' || j.status === 'paid'))
      .sort((a: Job, b: Job) => new Date(b.timeline.createdAt).getTime() - new Date(a.timeline.createdAt).getTime())
      .slice(0, 5);
  });

  // KPI calculations
  public todayCompletedJobsCount = computed<number>(() => {
    const worker = this.currentWorker();
    if (!worker) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    return this.jobService.jobs().filter((j: Job) => 
      j.workerId === worker.uid && 
      (j.status === 'completed' || j.status === 'paid') &&
      (j.timeline.completedAt?.startsWith(todayStr) || j.timeline.createdAt.startsWith(todayStr))
    ).length || 2; // fallback realistic number for demo
  });

  public todayEarnings = computed<number>(() => {
    const worker = this.currentWorker();
    if (!worker) return 0;
    const completed = this.jobService.jobs().filter((j: Job) => 
      j.workerId === worker.uid && (j.status === 'completed' || j.status === 'paid')
    );
    const sum = completed.reduce((acc: number, j: Job) => acc + (j.workerEarning || (j.finalPrice ? j.finalPrice - (j.commission || 0) : 0)), 0);
    return sum > 0 ? sum : 750; // demo figure if no jobs today
  });

  constructor() {
    effect(() => {
      const list = this.availableScenarios();
      if (list.length > 0 && !list.some(s => s.id === this.selectedScenario?.id)) {
        this.selectedScenario = list[0];
      }
    });
  }

  ngOnInit(): void {
    this.startCountdownWatcher();
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  private startCountdownWatcher(): void {
    this.countdownTimer = setInterval(() => {
      const offer = this.incomingOffer();
      if (offer) {
        const diff = Math.max(0, Math.ceil((offer.expiresAt - Date.now()) / 1000));
        this.remainingSeconds.set(diff);
        if (diff <= 0) {
          // Auto expired
          this.rejectOffer();
        }
      }
    }, 500);
  }

  public toggleOnline(): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const newOnline = !worker.isOnline;
    this.workerService.toggleOnlineStatus(worker.uid, newOnline);

    const updated = this.workerService.getWorkerById(worker.uid);
    if (updated) {
      this.authService.updateWorkerProfile(updated);
    }
  }

  public acceptOffer(): void {
    const offer = this.incomingOffer();
    const worker = this.currentWorker();
    if (!offer || !worker) return;

    this.jobService.acceptJob(
      offer.job.id,
      worker.uid,
      worker.name,
      worker.phone,
      worker.photoURL
    );

    // Mark worker busy
    this.workerService.setBusyStatus(worker.uid, true);

    // Clear incoming offer
    this.jobService.incomingJobOfferSignal.set(null);

    // Route to active job workflow
    this.router.navigate(['/worker/active', offer.job.id]);
  }

  // Quick Grab for Open Work Requests (First-come first-served)
  public quickGrab(job: Job): void {
    const worker = this.currentWorker();
    if (!worker) return;

    const result = this.jobService.grabJob(job.id, {
      uid: worker.uid,
      name: worker.name,
      phone: worker.phone,
      photoURL: worker.photoURL
    });

    if (!result.success) {
      alert(result.message);
      return;
    }

    this.workerService.setBusyStatus(worker.uid, true);
    this.router.navigate(['/worker/active', job.id]);
  }

  public rejectOffer(): void {
    this.jobService.incomingJobOfferSignal.set(null);
  }

  // Professional instant job request trigger using the selected scenario
  public triggerSelectedJobOffer(): void {
    const worker = this.currentWorker();
    const scenario = this.selectedScenario || this.professionalScenarios[0];

    const testJob: Job = {
      id: `job_instant_${Date.now()}`,
      customerId: `user_customer_${scenario.id}`,
      customerName: scenario.customerName,
      customerPhone: scenario.customerPhone,
      customerRating: scenario.customerRating,
      categoryId: scenario.categoryId,
      categoryName: scenario.categoryName,
      areaId: worker?.areaId || 'savar_bazar',
      type: 'instant',
      description: scenario.description,
      photos: scenario.photoURL ? [scenario.photoURL] : [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500'
      ],
      location: {
        lat: scenario.lat,
        lng: scenario.lng,
        address: scenario.address
      },
      locationPinned: true,
      landmark: scenario.landmark,
      status: 'searching',
      estimatedPrice: scenario.estimatedPrice,
      paymentMethod: 'cash',
      paymentStatus: 'unpaid',
      startOtp: `${Math.floor(1000 + Math.random() * 9000)}`,
      timeline: {
        createdAt: new Date().toISOString()
      }
    };

    // Save job into JobService
    this.jobService.createJob(testJob);

    // Set incoming offer with 30s expiry
    this.jobService.incomingJobOfferSignal.set({
      job: testJob,
      expiresAt: Date.now() + 30000
    });
    this.remainingSeconds.set(30);
  }

  public simulateIncomingOffer(): void {
    this.triggerSelectedJobOffer();
  }

  public calculateProgressDash(): number {
    const totalDash = 283; // 2 * PI * 45
    const sec = this.remainingSeconds();
    return totalDash - (totalDash * sec / 30);
  }
}
