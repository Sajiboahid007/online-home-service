import { Component, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { JobService } from '../../../core/services/job.service';
import { DispatchService } from '../../../core/services/dispatch.service';
import { WorkerProfile } from '../../../core/models/worker.model';
import { Job } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

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
  imports: [CommonModule, RouterModule, FormsModule, Select, BnNumberPipe, TakaPipe, TimeAgoPipe, TranslatePipe],
  templateUrl: './worker-dashboard.component.html',
  styleUrl: './worker-dashboard.component.scss'
})
export class WorkerDashboardComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  public workerService = inject(WorkerService);
  public jobService = inject(JobService);
  private dispatchService = inject(DispatchService);
  private router = inject(Router);

  // Professional Job Request Scenarios (realistic, technical & non-funny)
  public readonly professionalScenarios: ProfessionalJobScenario[] = [
    {
      id: 'sc_plumb_1',
      label: 'বাথরুম কনসিল্ড পাইপলাইন প্রেশার টেস্ট ও মেরামত',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      categoryId: 'plumber',
      icon: '🔧',
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
      icon: '🚰',
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
      icon: '⚙️',
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
      icon: '⚡',
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
      icon: '❄️',
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
      icon: '🧹',
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
      icon: '🎨',
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
      icon: '🪚',
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
      icon: '👷',
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
    }
  ];

  public selectedScenario: ProfessionalJobScenario = this.professionalScenarios[0];

  // Current active worker computed reactively
  public currentWorker = computed<WorkerProfile | null>(() => {
    const authWorker = this.authService.currentWorker();
    const uid = authWorker?.uid || 'worker_rahim_1';
    return this.workerService.getWorkerById(uid) || authWorker || this.workerService.workers()[0] || null;
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

  constructor() {}

  ngOnInit(): void {
    this.startCountdownWatcher();
    const currentWorker = this.currentWorker();
    if (currentWorker?.categoryIds?.length) {
      const match = this.professionalScenarios.find(s => currentWorker.categoryIds.includes(s.categoryId));
      if (match) {
        this.selectedScenario = match;
      }
    }
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
