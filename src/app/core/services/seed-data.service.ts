import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';
import { Area } from '../models/area.model';
import { Pricing } from '../models/pricing.model';
import { PlatformSettings } from '../models/settings.model';
import { WorkerProfile, WorkerPrivate } from '../models/worker.model';
import { User } from '../models/user.model';
import { Job } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class SeedDataService {

  public readonly defaultSettings: PlatformSettings = {
    defaultCommission: 0.15,
    dueLimit: 500,
    dispatch: {
      initialRadius: 3,
      maxRadius: 10,
      offerTimeoutSec: 30,
      batchSize: 4,
      weights: {
        distance: 0.40,
        rating: 0.25,
        acceptRate: 0.15,
        idleTime: 0.10,
        premiumBonus: 0.10
      }
    },
    ban: {
      warnRating: 3.5,
      suspendRating: 2.5,
      minJobsForRating: 10,
      maxCancelRate: 0.20
    },
    showFullPhoneBeforeBooking: false,
    supportPhone: '+8801700000000',
    maintenanceMode: false
  };

  public readonly defaultCategories: Category[] = [
    {
      id: 'plumber',
      nameBn: 'প্লাম্বার (পাইপ ফিটিং)',
      nameEn: 'Plumber',
      icon: '🔧',
      pricingType: 'job',
      isActive: true,
      order: 1
    },
    {
      id: 'electrician',
      nameBn: 'ইলেকট্রিশিয়ান',
      nameEn: 'Electrician',
      icon: '⚡',
      pricingType: 'job',
      isActive: true,
      order: 2
    },
    {
      id: 'ac_technician',
      nameBn: 'এসি টেকনিশিয়ান',
      nameEn: 'AC Technician',
      icon: '❄️',
      pricingType: 'job',
      isActive: true,
      order: 3
    },
    {
      id: 'cleaner',
      nameBn: 'ক্লিনার (বাসাবাড়ি পরিষ্কার)',
      nameEn: 'Cleaner',
      icon: '🧹',
      pricingType: 'hour',
      isActive: true,
      order: 4
    },
    {
      id: 'painter',
      nameBn: 'পেইন্টার (রং মিস্ত্রি)',
      nameEn: 'Painter',
      icon: '🎨',
      pricingType: 'day',
      isActive: true,
      order: 5
    },
    {
      id: 'day_laborer',
      nameBn: 'দিনমজুর / শ্রমিক',
      nameEn: 'Day Laborer',
      icon: '👷',
      pricingType: 'day',
      isActive: true,
      order: 6
    },
    {
      id: 'mason',
      nameBn: 'রাজমিস্ত্রি',
      nameEn: 'Mason',
      icon: '🧱',
      pricingType: 'day',
      isActive: true,
      order: 7
    },
    {
      id: 'carpenter',
      nameBn: 'কার্পেন্টার (কাঠমিস্ত্রি)',
      nameEn: 'Carpenter',
      icon: '🪚',
      pricingType: 'job',
      isActive: true,
      order: 8
    }
  ];

  public readonly defaultAreas: Area[] = [
    {
      id: 'savar_bazar',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'সাভার',
      zoneName: 'সাভার বাজার ও বাসস্ট্যান্ড',
      center: { lat: 23.8223, lng: 90.2673 },
      radiusKm: 6,
      isActive: true,
      surgeMultiplier: 1.0,
      adminIds: ['admin_savar_1']
    },
    {
      id: 'ashulia_epz',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'সাভার',
      zoneName: 'আশুলিয়া ও ডিইপিজেড এলাকা',
      center: { lat: 23.9318, lng: 90.2917 },
      radiusKm: 7,
      isActive: true,
      surgeMultiplier: 1.0,
      adminIds: ['admin_savar_1']
    },
    {
      id: 'hemayetpur',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'সাভার',
      zoneName: 'হেমায়েতপুর',
      center: { lat: 23.7915, lng: 90.2741 },
      radiusKm: 5,
      isActive: true,
      surgeMultiplier: 1.0,
      adminIds: ['admin_savar_1']
    },
    {
      id: 'dhaka_mirpur',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      zoneName: 'মিরপুর ১-১০',
      center: { lat: 23.8071, lng: 90.3686 },
      radiusKm: 6,
      isActive: true,
      surgeMultiplier: 1.0,
      adminIds: ['admin_dhaka_1']
    }
  ];

  public readonly defaultPricing: Pricing[] = [
    {
      id: 'savar_bazar_plumber',
      areaId: 'savar_bazar',
      categoryId: 'plumber',
      basePrice: 300,
      minPrice: 200,
      maxPrice: 800,
      visitCharge: 100,
      commissionRate: 0.15,
      platformFee: 20
    },
    {
      id: 'savar_bazar_electrician',
      areaId: 'savar_bazar',
      categoryId: 'electrician',
      basePrice: 350,
      minPrice: 250,
      maxPrice: 1000,
      visitCharge: 100,
      commissionRate: 0.15,
      platformFee: 20
    },
    {
      id: 'savar_bazar_ac_technician',
      areaId: 'savar_bazar',
      categoryId: 'ac_technician',
      basePrice: 800,
      minPrice: 500,
      maxPrice: 2500,
      visitCharge: 150,
      commissionRate: 0.18,
      platformFee: 30
    },
    {
      id: 'savar_bazar_cleaner',
      areaId: 'savar_bazar',
      categoryId: 'cleaner',
      basePrice: 250,
      minPrice: 150,
      maxPrice: 500,
      visitCharge: 0,
      commissionRate: 0.15,
      platformFee: 20
    },
    {
      id: 'savar_bazar_day_laborer',
      areaId: 'savar_bazar',
      categoryId: 'day_laborer',
      basePrice: 700,
      minPrice: 500,
      maxPrice: 1200,
      visitCharge: 0,
      commissionRate: 0.10,
      platformFee: 20
    }
  ];

  public readonly defaultWorkers: WorkerProfile[] = [
    {
      uid: 'worker_rahim_1',
      name: 'মো: রহিম উদ্দিন',
      photoURL: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
      phone: '01711223344',
      phoneMasked: '01711-XXX-344',
      categoryIds: ['plumber'],
      skills: ['পাইপ লিকেজ মেরামত', 'বেসিন ও কমোড ফিটিং', 'পাম্প মোটর স্থাপন'],
      experienceYears: 6,
      bio: 'সাভার বাজারের অভিজ্ঞ প্লাম্বার। দ্রুত ও বিশ্বস্ত সেবা প্রদান করি।',
      rate: 350,
      rateUnit: 'job',
      serviceRadiusKm: 6,
      homeLocation: {
        lat: 23.8245,
        lng: 90.2689,
        geohash: 'wh0r7z8',
        address: 'সাভার বাজার বাসস্ট্যান্ড রোড, সাভার'
      },
      areaId: 'savar_bazar',
      isOnline: true,
      isBusy: false,
      verificationStatus: 'approved',
      verified: true,
      trustedBadge: true,
      isPremium: true,
      rating: 4.8,
      ratingCount: 38,
      totalJobs: 42,
      completionRate: 0.98,
      acceptRate: 0.94,
      cancelRate: 0.02,
      walletBalance: 2450,
      commissionDue: 180,
      portfolio: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
        'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400'
      ],
      createdAt: '2026-01-10T10:00:00Z',
      distanceKm: 0.5
    },
    {
      uid: 'worker_korim_2',
      name: 'করিম মিয়া',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '01819876543',
      phoneMasked: '01819-XXX-543',
      categoryIds: ['electrician'],
      skills: ['শর্ট সার্কিট চেক', 'হাউজ ওয়্যারিং', 'ফ্যান ও লাইট ফিটিং'],
      experienceYears: 8,
      bio: 'সার্টিফাইড ইলেকট্রিশিয়ান। সাভার ও হেমায়েতপুর এলাকায় সেবা দেই।',
      rate: 400,
      rateUnit: 'job',
      serviceRadiusKm: 8,
      homeLocation: {
        lat: 23.8188,
        lng: 90.2642,
        geohash: 'wh0r7t2',
        address: 'নামাবাজার, সাভার'
      },
      areaId: 'savar_bazar',
      isOnline: true,
      isBusy: false,
      verificationStatus: 'approved',
      verified: true,
      trustedBadge: true,
      isPremium: false,
      rating: 4.9,
      ratingCount: 52,
      totalJobs: 58,
      completionRate: 0.96,
      acceptRate: 0.92,
      cancelRate: 0.04,
      walletBalance: 3200,
      commissionDue: 350,
      portfolio: [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400'
      ],
      createdAt: '2026-02-01T09:30:00Z',
      distanceKm: 0.8
    },
    {
      uid: 'worker_shakil_3',
      name: 'শাকিল আহমেদ',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      phone: '01912345678',
      phoneMasked: '01912-XXX-678',
      categoryIds: ['ac_technician'],
      skills: ['এসি গ্যাস চার্জ', 'এসি মাস্টার ওয়াশ', 'ইনস্টলেশন ও কম্প্রেসার মেরামত'],
      experienceYears: 5,
      bio: 'সব ব্র্যান্ডের ইনভার্টার ও নন-ইনভার্টার এসি সার্ভিসিং।',
      rate: 900,
      rateUnit: 'job',
      serviceRadiusKm: 10,
      homeLocation: {
        lat: 23.8291,
        lng: 90.2721,
        geohash: 'wh0r7yg',
        address: 'ব্যাংক কলোনি, সাভার'
      },
      areaId: 'savar_bazar',
      isOnline: false,
      isBusy: false,
      verificationStatus: 'approved',
      verified: true,
      trustedBadge: false,
      isPremium: false,
      rating: 4.6,
      ratingCount: 22,
      totalJobs: 25,
      completionRate: 0.92,
      acceptRate: 0.88,
      cancelRate: 0.05,
      walletBalance: 1800,
      commissionDue: 240,
      portfolio: [],
      createdAt: '2026-02-15T14:10:00Z',
      distanceKm: 1.4
    },
    {
      uid: 'worker_anwar_4',
      name: 'আনোয়ার হোসেন',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      phone: '01678123456',
      phoneMasked: '01678-XXX-456',
      categoryIds: ['cleaner'],
      skills: ['বাথরুম ডিপ ক্লিনিং', 'কিচেন ক্লিনিং', 'সোফা ও কার্পেট ওয়াশ'],
      experienceYears: 4,
      bio: 'পরিপাটি ও যত্নশীল ক্লিনার। সাভার এলাকায় দ্রুত সেবা।',
      rate: 250,
      rateUnit: 'hour',
      serviceRadiusKm: 5,
      homeLocation: {
        lat: 23.8210,
        lng: 90.2635,
        geohash: 'wh0r7w1',
        address: 'থানা রোড, সাভার'
      },
      areaId: 'savar_bazar',
      isOnline: true,
      isBusy: true,
      verificationStatus: 'approved',
      verified: true,
      trustedBadge: false,
      isPremium: false,
      rating: 4.7,
      ratingCount: 19,
      totalJobs: 21,
      completionRate: 0.95,
      acceptRate: 0.90,
      cancelRate: 0.02,
      walletBalance: 1200,
      commissionDue: 110,
      portfolio: [],
      createdAt: '2026-03-01T11:00:00Z',
      distanceKm: 0.9
    },
    {
      uid: 'worker_kalam_5',
      name: 'মো: কালাম হোসেন',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      phone: '01755667788',
      phoneMasked: '01755-XXX-788',
      categoryIds: ['plumber'],
      skills: ['স্যানিটারি ফিটিংস', 'পাইপলাইন লিকেজ মেরামত', 'কমোড ও সিঙ্ক স্থাপন'],
      experienceYears: 7,
      bio: 'সাভারের নির্ভরযোগ্য পেশাদার প্লাম্বার। যেকোনো জরুরি কাজের দ্রুত সমাধান করি।',
      rate: 380,
      rateUnit: 'job',
      serviceRadiusKm: 7,
      homeLocation: {
        lat: 23.8215,
        lng: 90.2655,
        geohash: 'wh0r7z1',
        address: 'ব্যাংক টাউন রোড, সাভার'
      },
      areaId: 'savar_bazar',
      isOnline: true,
      isBusy: false,
      verificationStatus: 'approved',
      verified: true,
      trustedBadge: true,
      isPremium: false,
      rating: 4.7,
      ratingCount: 31,
      totalJobs: 36,
      completionRate: 0.97,
      acceptRate: 0.91,
      cancelRate: 0.03,
      walletBalance: 1950,
      commissionDue: 120,
      portfolio: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'
      ],
      createdAt: '2026-02-10T10:00:00Z',
      distanceKm: 0.7
    }
  ];

  public readonly defaultUsers: User[] = [
    {
      uid: 'user_superadmin_1',
      role: 'superadmin',
      name: 'সুপার অ্যাডমিন',
      phone: '01700000001',
      email: 'superadmin@kajkhoj.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'active',
      areaId: 'savar_bazar',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      uid: 'user_admin_savar_1',
      role: 'admin',
      name: 'সাভার জোন অ্যাডমিন',
      phone: '01700000002',
      email: 'admin.savar@kajkhoj.com',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      status: 'active',
      areaId: 'savar_bazar',
      createdAt: '2026-01-05T00:00:00Z'
    },
    {
      uid: 'user_customer_demo_1',
      role: 'customer',
      name: 'তানভীর আহমেদ',
      phone: '01712345678',
      email: 'tanvir@gmail.com',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      status: 'active',
      areaId: 'savar_bazar',
      emergencyContact: {
        name: 'নাসরিন আক্তার',
        phone: '01799887766',
        relation: 'স্ত্রী'
      },
      rating: 4.9,
      ratingCount: 12,
      favoriteWorkers: ['worker_rahim_1'],
      createdAt: '2026-01-15T12:00:00Z'
    }
  ];

  public readonly defaultJobs: Job[] = [
    {
      id: 'job_demo_102',
      customerId: 'user_customer_demo_2',
      customerName: 'সাব্বির হোসেন',
      customerPhone: '01819876543',
      customerRating: 4.8,
      workerId: 'worker_rahim_1',
      workerName: 'মো: রহিম উদ্দিন',
      workerPhone: '01711223344',
      workerPhoto: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      areaId: 'savar_bazar',
      type: 'instant',
      description: 'বাথরুমের মেইন লাইনে পানির প্রেসার কমে গেছে এবং ফ্লাশ ট্যাংক ঠিকমত কাজ করছে না। জরুরি মেরামত দরকার।',
      photos: [
        'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500',
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500'
      ],
      location: {
        lat: 23.8245,
        lng: 90.2685,
        address: 'বাড়ি #৪৫, রোড #২, সাভার থানা রোড, সাভার বাজার'
      },
      status: 'accepted',
      estimatedPrice: 450,
      paymentMethod: 'cash',
      paymentStatus: 'unpaid',
      startOtp: '7294',
      timeline: {
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'job_board_201',
      customerId: 'user_customer_demo_3',
      customerName: 'ফারহানা রহমান',
      customerPhone: '01912345670',
      customerRating: 5.0,
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      areaId: 'savar_bazar',
      type: 'board_fixed',
      description: 'কিচেনের সিঙ্কের দুটি নতুন ট্যাব কল স্থাপন করতে হবে এবং নিচের ড্রেন পাইপ পরিবর্তন করতে হবে। নতুন কল কেনা আছে।',
      photos: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500'
      ],
      location: {
        lat: 23.8260,
        lng: 90.2640,
        address: 'ফ্ল্যাট ৪বি, স্বপ্ননীল টাওয়ার, সাভার বাসস্ট্যান্ড মোড়'
      },
      status: 'searching',
      estimatedPrice: 500,
      paymentMethod: 'bkash',
      paymentStatus: 'unpaid',
      startOtp: '3912',
      timeline: {
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'job_board_202',
      customerId: 'user_customer_demo_4',
      customerName: 'ইকবাল মাহমুদ',
      customerPhone: '01678123456',
      customerRating: 4.7,
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      areaId: 'savar_bazar',
      type: 'board_bid',
      description: 'ছাদের ১০০০ লিটার পানির ট্যাঙ্কের ওভারফ্লো সেন্সর ও আউটলেট পাইপ সংযোগের কাজ। দক্ষ অভিজ্ঞ মিস্ত্রি আবশ্যক।',
      photos: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500'
      ],
      location: {
        lat: 23.8310,
        lng: 90.2710,
        address: 'হাউজ ১৭, ব্লক সি, শিমুলতলা, সাভার'
      },
      status: 'searching',
      estimatedPrice: 650,
      paymentMethod: 'cash',
      paymentStatus: 'unpaid',
      startOtp: '5641',
      timeline: {
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'job_demo_101',
      customerId: 'user_customer_demo_1',
      customerName: 'তানভীর আহমেদ',
      customerPhone: '01712345678',
      customerRating: 4.9,
      workerId: 'worker_rahim_1',
      workerName: 'মো: রহিম উদ্দিন',
      workerPhone: '01711223344',
      workerPhoto: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      areaId: 'savar_bazar',
      type: 'instant',
      description: 'বাথরুমের সিঙ্কের নিচের পাইপ ফেটে পানি পড়ছে, দ্রুত ঠিক করতে হবে।',
      photos: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'
      ],
      location: {
        lat: 23.8230,
        lng: 90.2660,
        address: 'বাসা ১২, রোড ৩, সাভার নিউ মার্কেট এরিয়া'
      },
      status: 'completed',
      estimatedPrice: 350,
      finalPrice: 400,
      materialCost: 50,
      commission: 60,
      platformFee: 20,
      workerEarning: 340,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      startOtp: '4821',
      timeline: {
        createdAt: '2026-11-10T11:00:00Z',
        acceptedAt: '2026-11-10T11:01:15Z',
        arrivedAt: '2026-11-10T11:15:00Z',
        startedAt: '2026-11-10T11:16:30Z',
        completedAt: '2026-11-10T12:05:00Z'
      }
    }
  ];
}
