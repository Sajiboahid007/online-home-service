import { Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { FirebaseService } from '../../../core/services/firebase.service';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { User, UserRole } from '../../../core/models/user.model';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';

export interface DemoAccount {
  id: string;
  label: string;
  name: string;
  badge: string;
  icon: string;
  desc: string;
  category: 'customer' | 'worker' | 'admin';
  role: string;
  phone: string;
  area: string;
  route: string;
}

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
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  // Form states
  public phone = signal<string>('01712345678');
  public otpDigits = signal<string[]>(['', '', '', '', '', '']);
  public otpString = signal<string>('');
  public generatedOtp = signal<string>('');
  private otpExpiresAt = 0;
  public otpSent = signal<boolean>(false);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');
  public countdown = signal<number>(60);
  private timerInterval: any = null;

  public currentUser = this.authService.currentUser;

  // Tabs & directory modal
  public activeRoleTab = signal<'all' | 'customer' | 'worker' | 'admin'>('customer');
  public showDirectoryModal = signal<boolean>(false);
  public searchQuery = signal<string>('');

  // Complete List of Demo Accounts (Customers, Workers, Admins)
  public demoAccounts: DemoAccount[] = [
    // --- Customers (10 profiles across Savar, Mirpur, Ashulia, Hemayetpur) ---
    {
      id: 'user_customer_demo_1',
      label: 'তানভীর আহমেদ',
      name: 'তানভীর আহমেদ',
      badge: '👤 তানভীর (সাভার)',
      icon: '👤',
      desc: 'সাভার বাজার • রেটিং ৪.৯ • বুকিং ও সার্ভিস গ্রহীতা',
      category: 'customer',
      role: 'user_customer_demo_1',
      phone: '01712345678',
      area: 'সাভার বাজার',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_2',
      label: 'সাব্বির হোসেন',
      name: 'সাব্বির হোসেন',
      badge: '👤 সাব্বির (সাভার)',
      icon: '👤',
      desc: 'সাভার থানা রোড • রেটিং ৪.৮ • নিয়মিত গ্রাহক',
      category: 'customer',
      role: 'user_customer_demo_2',
      phone: '01819876500',
      area: 'সাভার থানা রোড',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_3',
      label: 'ফারহানা রহমান',
      name: 'ফারহানা রহমান',
      badge: '👤 ফারহানা (বাসস্ট্যান্ড)',
      icon: '👤',
      desc: 'স্বপ্ননীল টাওয়ার, সাভার • রেটিং ৫.০ • ফিক্সড জব বুকিং',
      category: 'customer',
      role: 'user_customer_demo_3',
      phone: '01912345670',
      area: 'সাভার বাসস্ট্যান্ড',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_4',
      label: 'ইকবাল মাহমুদ',
      name: 'ইকবাল মাহমুদ',
      badge: '👤 ইকবাল (শিমুলতলা)',
      icon: '👤',
      desc: 'শিমুলতলা, সাভার • রেটিং ৪.৭ • বিডিং জব পোস্টকারী',
      category: 'customer',
      role: 'user_customer_demo_4',
      phone: '01799887766',
      area: 'শিমুলতলা, সাভার',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_5',
      label: 'রোকেয়া বেগম',
      name: 'রোকেয়া বেগম',
      badge: '👤 রোকেয়া (আশুলিয়া)',
      icon: '👤',
      desc: 'পল্লী বিদ্যুৎ, আশুলিয়া • রেটিং ৪.৯ • এসি সার্ভিস গ্রাহক',
      category: 'customer',
      role: 'user_customer_demo_5',
      phone: '01822334455',
      area: 'আশুলিয়া ইপিজেড',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_6',
      label: 'আরিফুল ইসলাম',
      name: 'আরিফুল ইসলাম',
      badge: '👤 আরিফুল (হেমায়েতপুর)',
      icon: '👤',
      desc: 'হেমায়েতপুর বাসস্ট্যান্ড • রেটিং ৪.৮ • ক্লিনিং সার্ভিস গ্রহীতা',
      category: 'customer',
      role: 'user_customer_demo_6',
      phone: '01733445566',
      area: 'হেমায়েতপুর',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_7',
      label: 'মেহজাবিন চৌধুরী',
      name: 'মেহজাবিন চৌধুরী',
      badge: '👤 মেহজাবিন (মিরপুর)',
      icon: '👤',
      desc: 'মিরপুর ১০, ঢাকা • রেটিং ৫.০ • কাঠমিস্ত্রি সার্ভিস গ্রহীতা',
      category: 'customer',
      role: 'user_customer_demo_7',
      phone: '01611223344',
      area: 'মিরপুর ১০, ঢাকা',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_8',
      label: 'নাজমুল হাসান',
      name: 'নাজমুল হাসান',
      badge: '👤 নাজমুল (নামাবাজার)',
      icon: '👤',
      desc: 'নামাবাজার ঘাট রোড, সাভার • রেটিং ৪.৬ • সাধারণ গ্রাহক',
      category: 'customer',
      role: 'user_customer_demo_8',
      phone: '01555667788',
      area: 'নামাবাজার, সাভার',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_9',
      label: 'নুসরাত জাহান',
      name: 'নুসরাত জাহান',
      badge: '👤 নুসরাত (ডিইপিজেড)',
      icon: '👤',
      desc: 'ডিইপিজেড গেট #১, আশুলিয়া • রেটিং ৪.৯ • রাজমিস্ত্রি গ্রাহক',
      category: 'customer',
      role: 'user_customer_demo_9',
      phone: '01744556677',
      area: 'আশুলিয়া',
      route: '/customer'
    },
    {
      id: 'user_customer_demo_10',
      label: 'কামরুল হাসান',
      name: 'কামরুল হাসান',
      badge: '👤 কামরুল (তেঁতুলঝোড়া)',
      icon: '👤',
      desc: 'তেঁতুলঝোড়া, হেমায়েতপুর • রেটিং ৪.৮ • ইলেকট্রিশিয়ান সার্ভিস',
      category: 'customer',
      role: 'user_customer_demo_10',
      phone: '01866778899',
      area: 'হেমায়েতপুর',
      route: '/customer'
    },

    // --- Workers (8 skilled professionals) ---
    {
      id: 'worker_rahim_1',
      label: 'মো: রহিম উদ্দিন',
      name: 'মো: রহিম উদ্দিন',
      badge: '🔧 মো: রহিম উদ্দিন',
      icon: '🔧',
      desc: 'সাভার বাজার • রেটিং ৪.৮ • প্লাম্বার • ৪২টি সম্পন্ন কাজ',
      category: 'worker',
      role: 'worker_rahim_1',
      phone: '01711223344',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_korim_2',
      label: 'করিম মিয়া',
      name: 'করিম মিয়া',
      badge: '⚡ করিম মিয়া',
      icon: '⚡',
      desc: 'নামাবাজার • রেটিং ৪.৯ • ইলেকট্রিশিয়ান • ৫৮টি কাজ',
      category: 'worker',
      role: 'worker_korim_2',
      phone: '01819876543',
      area: 'নামাবাজার, সাভার',
      route: '/worker'
    },
    {
      id: 'worker_shakil_3',
      label: 'শাকিল আহমেদ',
      name: 'শাকিল আহমেদ',
      badge: '❄️ শাকিল আহমেদ',
      icon: '❄️',
      desc: 'ব্যাংক কলোনি • রেটিং ৪.৬ • এসি টেকনিশিয়ান',
      category: 'worker',
      role: 'worker_shakil_3',
      phone: '01912345678',
      area: 'ব্যাংক কলোনি',
      route: '/worker'
    },
    {
      id: 'worker_anwar_4',
      label: 'আনোয়ার হোসেন',
      name: 'আনোয়ার হোসেন',
      badge: '🧹 আনোয়ার হোসেন',
      icon: '🧹',
      desc: 'থানা রোড, সাভার • রেটিং ৪.৭ • ডিপ ক্লিনিং বিশেষজ্ঞ',
      category: 'worker',
      role: 'worker_anwar_4',
      phone: '01678123456',
      area: 'থানা রোড, সাভার',
      route: '/worker'
    },
    {
      id: 'worker_kalam_5',
      label: 'মো: কালাম হোসেন',
      name: 'মো: কালাম হোসেন',
      badge: '🔧 মো: কালাম হোসেন',
      icon: '🔧',
      desc: 'ব্যাংক টাউন • রেটিং ৪.৭ • স্যানিটারি ও পাইপলাইন',
      category: 'worker',
      role: 'worker_kalam_5',
      phone: '01755667788',
      area: 'ব্যাংক টাউন',
      route: '/worker'
    },
    {
      id: 'worker_tariq_6',
      label: 'তারিকুল ইসলাম',
      name: 'তারিকুল ইসলাম',
      badge: '🎨 তারিকুল ইসলাম',
      icon: '🎨',
      desc: 'হেমায়েতপুর • রেটিং ৪.৮ • ওয়াল পুটিং ও পেইন্টিং',
      category: 'worker',
      role: 'worker_tariq_6',
      phone: '01844556677',
      area: 'হেমায়েতপুর',
      route: '/worker'
    },
    {
      id: 'worker_salim_7',
      label: 'সেলিম রেজা',
      name: 'সেলিম রেজা',
      badge: '🪚 সেলিম রেজা',
      icon: '🪚',
      desc: 'মিরপুর ১০, ঢাকা • রেটিং ৪.৯ • ফার্নিচার ও কাঠের কাজ',
      category: 'worker',
      role: 'worker_salim_7',
      phone: '01933445566',
      area: 'মিরপুর ১০, ঢাকা',
      route: '/worker'
    },
    {
      id: 'worker_billal_8',
      label: 'বিল্লাল হোসেন',
      name: 'বিল্লাল হোসেন',
      badge: '🧱 বিল্লাল হোসেন',
      icon: '🧱',
      desc: 'আশুলিয়া ইপিজেড • রেটিং ৪.৬ • দেওয়াল ও টাইলস কাজ',
      category: 'worker',
      role: 'worker_billal_8',
      phone: '01788990011',
      area: 'আশুলিয়া ইপিজেড',
      route: '/worker'
    },
    {
      id: 'worker_sohel_9',
      label: 'মো: সোহেল রানা',
      name: 'মো: সোহেল রানা',
      badge: '❄️ মো: সোহেল রানা',
      icon: '❄️',
      desc: 'আশুলিয়া ইপিজেড • রেটিং ৪.৮ • এসি পিসিবি ও ইনভার্টার • ৩৯টি কাজ',
      category: 'worker',
      role: 'worker_sohel_9',
      phone: '01922334455',
      area: 'আশুলিয়া ইপিজেড',
      route: '/worker'
    },
    {
      id: 'worker_monir_10',
      label: 'মো: মনিরুজ্জামান',
      name: 'মো: মনিরুজ্জামান',
      badge: '❄️ মো: মনিরুজ্জামান',
      icon: '❄️',
      desc: 'মিরপুর ১০, ঢাকা • রেটিং ৪.৯ • এসি ও রেফ্রিজারেটর টেক • ৫৭টি কাজ',
      category: 'worker',
      role: 'worker_monir_10',
      phone: '01733446677',
      area: 'মিরপুর ১০, ঢাকা',
      route: '/worker'
    },
    {
      id: 'worker_zahid_11',
      label: 'জাহিদ হাসান',
      name: 'জাহিদ হাসান',
      badge: '⚡ জাহিদ হাসান',
      icon: '⚡',
      desc: 'সাভার বাজার • রেটিং ৪.৯ • ৩-ফেজ ও আইপিএস বিশেষজ্ঞ • ৬৮টি কাজ',
      category: 'worker',
      role: 'worker_zahid_11',
      phone: '01855667788',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_rashid_12',
      label: 'আবদুর রশিদ',
      name: 'আবদুর রশিদ',
      badge: '⚡ আবদুর রশিদ',
      icon: '⚡',
      desc: 'হেমায়েতপুর • রেটিং ৪.৭ • ওয়্যারিং ও ডিবি বক্স • ৩৩টি কাজ',
      category: 'worker',
      role: 'worker_rashid_12',
      phone: '01688990022',
      area: 'হেমায়েতপুর',
      route: '/worker'
    },
    {
      id: 'worker_faruk_13',
      label: 'ফারুক হোসেন',
      name: 'ফারুক হোসেন',
      badge: '🔧 ফারুক হোসেন',
      icon: '🔧',
      desc: 'আশুলিয়া ইপিজেড • রেটিং ৪.৮ • সাবমারসিবল ও স্যানিটারি • ৪১টি কাজ',
      category: 'worker',
      role: 'worker_faruk_13',
      phone: '01766778899',
      area: 'আশুলিয়া ইপিজেড',
      route: '/worker'
    },
    {
      id: 'worker_milon_14',
      label: 'মিলন মিয়া',
      name: 'মিলন মিয়া',
      badge: '🔧 মিলন মিয়া',
      icon: '🔧',
      desc: 'মিরপুর ২, ঢাকা • রেটিং ৪.৮ • গিজার ও প্রেশার পাম্প • ৪৮টি কাজ',
      category: 'worker',
      role: 'worker_milon_14',
      phone: '01944556677',
      area: 'মিরপুর, ঢাকা',
      route: '/worker'
    },
    {
      id: 'worker_sumon_15',
      label: 'সুমন কুমার',
      name: 'সুমন কুমার',
      badge: '🧹 সুমন কুমার',
      icon: '🧹',
      desc: 'সাভার বাজার • রেটিং ৪.৮ • ওয়াটার ট্যাংক ও ডিপ ওয়াশ • ৩০টি কাজ',
      category: 'worker',
      role: 'worker_sumon_15',
      phone: '01522334455',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_habib_16',
      label: 'হাবিবুর রহমান',
      name: 'হাবিবুর রহমান',
      badge: '🎨 হাবিবুর রহমান',
      icon: '🎨',
      desc: 'মিরপুর ১, ঢাকা • রেটিং ৪.৯ • লাক্সারি টেক্সচার ও ড্যাম্প কোটিং • ৬১টি কাজ',
      category: 'worker',
      role: 'worker_habib_16',
      phone: '01877889900',
      area: 'মিরপুর ১, ঢাকা',
      route: '/worker'
    },
    {
      id: 'worker_badal_17',
      label: 'বাদল চন্দ্র শীল',
      name: 'বাদল চন্দ্র শীল',
      badge: '🪚 বাদল চন্দ্র শীল',
      icon: '🪚',
      desc: 'সাভার বাজার • রেটিং ৪.৮ • মডুলার ক্যাবিনেট ও লক মেরামত • ৪৪টি কাজ',
      category: 'worker',
      role: 'worker_badal_17',
      phone: '01699001122',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_alameen_18',
      label: 'মো: আল-আমিন',
      name: 'মো: আল-আমিন',
      badge: '👷 মো: আল-আমিন',
      icon: '👷',
      desc: 'সাভার বাজার মোড় • রেটিং ৪.৭ • বাসা বদল ও মালামাল বহন • ২৪টি কাজ',
      category: 'worker',
      role: 'worker_alameen_18',
      phone: '01711002233',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_rafiq_19',
      label: 'মো: রফিকুল ইসলাম',
      name: 'মো: রফিকুল ইসলাম',
      badge: '📺 মো: রফিকুল ইসলাম',
      icon: '📺',
      desc: 'থানা রোড, সাভার • রেটিং ৪.৮ • অ্যাপ্লায়েন্স মেরামত (ফ্রিজ/টিভি) • ৩৫টি কাজ',
      category: 'worker',
      role: 'worker_rafiq_19',
      phone: '01711334455',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_nasir_20',
      label: 'নাসির উদ্দিন',
      name: 'নাসির উদ্দিন',
      badge: '🪲 নাসির উদ্দিন',
      icon: '🪲',
      desc: 'নামাবাজার, সাভার • রেটিং ৪.৭ • পেস্ট কন্ট্রোল বিশেষজ্ঞ • ২২টি কাজ',
      category: 'worker',
      role: 'worker_nasir_20',
      phone: '01812445566',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_masud_21',
      label: 'মাসুদ পারভেজ',
      name: 'মাসুদ পারভেজ',
      badge: '🚚 মাসুদ পারভেজ',
      icon: '🚚',
      desc: 'ব্যাংক কলোনি, সাভার • রেটিং ৪.৯ • বাসা বদল ও মুভিং • ৪৬টি কাজ',
      category: 'worker',
      role: 'worker_masud_21',
      phone: '01911556677',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_liton_22',
      label: 'লিটন মিয়া',
      name: 'লিটন মিয়া',
      badge: '🔑 লিটন মিয়া',
      icon: '🔑',
      desc: 'সাভার বাসস্ট্যান্ড • রেটিং ৪.৮ • তালা-চাবি ও সিকিউরিটি • ৩২টি কাজ',
      category: 'worker',
      role: 'worker_liton_22',
      phone: '01611667788',
      area: 'সাভার বাজার',
      route: '/worker'
    },
    {
      id: 'worker_jalal_23',
      label: 'জালাল উদ্দিন',
      name: 'জালাল উদ্দিন',
      badge: '🌿 জালাল উদ্দিন',
      icon: '🌿',
      desc: 'হেমায়েতপুর • রেটিং ৪.৮ • বাগান পরিচর্যা (মালী) • ১৯টি কাজ',
      category: 'worker',
      role: 'worker_jalal_23',
      phone: '01722778899',
      area: 'হেমায়েতপুর',
      route: '/worker'
    },
    {
      id: 'worker_hasan_24',
      label: 'হাসান আলী',
      name: 'হাসান আলী',
      badge: '🔥 হাসান আলী',
      icon: '🔥',
      desc: 'আশুলিয়া ইপিজেড • রেটিং ৪.৭ • ওয়েল্ডিং ও গ্রিল মিস্ত্রি • ২৮টি কাজ',
      category: 'worker',
      role: 'worker_hasan_24',
      phone: '01833889900',
      area: 'আশুলিয়া ইপিজেড',
      route: '/worker'
    },
    {
      id: 'worker_bablu_25',
      label: 'বাবলু আহমেদ',
      name: 'বাবলু আহমেদ',
      badge: '🚗 বাবলু আহমেদ',
      icon: '🚗',
      desc: 'মিরপুর ১০, ঢাকা • রেটিং ৪.৮ • গাড়ি ও বাইক ওয়াশ • ২৫টি কাজ',
      category: 'worker',
      role: 'worker_bablu_25',
      phone: '01955990011',
      area: 'মিরপুর ১০, ঢাকা',
      route: '/worker'
    },
    {
      id: 'worker_tanvir_26',
      label: 'তানভীর ইসলাম',
      name: 'তানভীর ইসলাম',
      badge: '📷 তানভীর ইসলাম',
      icon: '📷',
      desc: 'সাভার বাজার • রেটিং ৪.৯ • সিসিটিভি ও ইন্টারনেট টেকনিশিয়ান • ৩৭টি কাজ',
      category: 'worker',
      role: 'worker_tanvir_26',
      phone: '01744001122',
      area: 'সাভার বাজার',
      route: '/worker'
    },

    // --- Admins (4 Zone & Platform Admins) ---
    {
      id: 'user_superadmin_1',
      label: 'সুপার অ্যাডমিন',
      name: 'সুপার অ্যাডমিন',
      badge: '👑 সুপার অ্যাডমিন',
      icon: '👑',
      desc: 'কেন্দ্রীয় নিয়ন্ত্রণ, আয় রিপোর্ট ও গ্লোবাল পলিসি',
      category: 'admin',
      role: 'superadmin',
      phone: '01700000001',
      area: 'কেন্দ্রীয় হেডকোয়ার্টার্স',
      route: '/admin'
    },
    {
      id: 'user_admin_savar_1',
      label: 'সাভার অ্যাডমিন',
      name: 'সাভার জোন অ্যাডমিন',
      badge: '🛡️ সাভার অ্যাডমিন',
      icon: '🛡️',
      desc: 'সাভার জোন ব্যবস্থাপনা, ভেরিফিকেশন ও ডিসপ্যাচ নিয়ন্ত্রণ',
      category: 'admin',
      role: 'admin',
      phone: '01700000002',
      area: 'সাভার জোন',
      route: '/admin'
    },
    {
      id: 'user_admin_mirpur_1',
      label: 'মিরপুর অ্যাডমিন',
      name: 'মিরপুর জোন অ্যাডমিন',
      badge: '🛡️ মিরপুর অ্যাডমিন',
      icon: '🛡️',
      desc: 'মিরপুর ১০-১ জোন পর্যবেক্ষণ ও অনুমোদন',
      category: 'admin',
      role: 'user_admin_mirpur_1',
      phone: '01700000003',
      area: 'মিরপুর জোন',
      route: '/admin'
    },
    {
      id: 'user_admin_ashulia_1',
      label: 'আশুলিয়া অ্যাডমিন',
      name: 'আশুলিয়া জোন অ্যাডমিন',
      badge: '🛡️ আশুলিয়া অ্যাডমিন',
      icon: '🛡️',
      desc: 'আশুলিয়া ও ডিইপিজেড জোন কারিগর ভেরিফিকেশন',
      category: 'admin',
      role: 'user_admin_ashulia_1',
      phone: '01700000004',
      area: 'আশুলিয়া জোন',
      route: '/admin'
    }
  ];

  // Role counts for tabs
  public customerCount = computed(() => this.demoAccounts.filter(a => a.category === 'customer').length);
  public workerCount = computed(() => this.demoAccounts.filter(a => a.category === 'worker').length);
  public adminCount = computed(() => this.demoAccounts.filter(a => a.category === 'admin').length);

  // Filtered accounts for horizontal quick bar
  public filteredDemoAccounts = computed(() => {
    const tab = this.activeRoleTab();
    if (tab === 'all') return this.demoAccounts;
    return this.demoAccounts.filter(a => a.category === tab);
  });

  // Filtered accounts for directory modal
  public modalFilteredAccounts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.demoAccounts;
    return this.demoAccounts.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.phone.includes(q) ||
      a.area.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.label.toLowerCase().includes(q)
    );
  });

  public setRoleTab(tab: 'all' | 'customer' | 'worker' | 'admin'): void {
    this.activeRoleTab.set(tab);
  }

  public openDirectoryModal(): void {
    this.searchQuery.set('');
    this.showDirectoryModal.set(true);
  }

  public closeDirectoryModal(): void {
    this.showDirectoryModal.set(false);
  }

  public selectAccountPhone(phone: string): void {
    this.phone.set(phone);
    this.successMessage.set(`মোবাইল নম্বর ${phone} ফর্মটিতে বসানো হয়েছে।`);
    this.closeDirectoryModal();
  }

  public onPresetSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.phone.set(target.value);
      this.successMessage.set(`নির্বাচিত নম্বর ${target.value} ফর্মটিতে বসানো হয়েছে।`);
    }
  }

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

    // Generate 6-digit OTP locally (no external SMS API — displayed only to this user)
    setTimeout(() => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.generatedOtp.set(otp);
      this.otpExpiresAt = Date.now() + 2 * 60 * 1000;
      this.isLoading.set(false);
      this.otpSent.set(true);
      this.otpString.set('');
      this.otpDigits.set(['', '', '', '', '', '']);
      this.successMessage.set(`+৮৮০ ${cleanPhone}-এর জন্য ৬ ডিজিটের ওটিপি তৈরি হয়েছে (শুধুমাত্র আপনার জন্য দৃশ্যমান)।`);
      this.startCountdown();
    }, 300);
  }

  private rejectIfBanned(user: User): boolean {
    if (user.status === 'banned' || user.status === 'suspended') {
      this.isLoading.set(false);
      this.errorMessage.set(
        `অ্যাকাউন্ট ${user.status === 'banned' ? 'স্থায়ীভাবে নিষিদ্ধ' : 'সাময়িক বরখাস্ত'}। কারণ: ${user.banReason || 'কর্তৃপক্ষের সিদ্ধান্ত'}`
      );
      return true;
    }
    return false;
  }

  public async verifyOtp(): Promise<void> {
    this.errorMessage.set('');
    const enteredOtp = this.otpString().trim();

    if (enteredOtp.length < 6) {
      this.errorMessage.set('অনুগ্রহ করে ৬ ডিজিটের সম্পূর্ণ ওটিপি কোড লিখুন।');
      return;
    }

    if (!this.generatedOtp() || Date.now() > this.otpExpiresAt) {
      this.errorMessage.set('ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন ওটিপি পাঠান।');
      return;
    }

    if (enteredOtp !== this.generatedOtp()) {
      this.errorMessage.set('ভুল ওটিপি কোড! অনুগ্রহ করে আপনার স্ক্রিনে প্রদর্শিত সঠিক ৬-ডিজিট কোড লিখুন।');
      return;
    }

    this.isLoading.set(true);

    try {
      const cleanPhone = this.phone().replace(/[^0-9]/g, '');

      // 1. Try Firestore lookup from live Firebase database
      let firestoreUser: User | null = null;
      try {
        if (this.firebaseService?.db) {
          const q = query(
            collection(this.firebaseService.db, 'users'),
            where('phone', '==', cleanPhone)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            firestoreUser = snap.docs[0].data() as User;
          }
        }
      } catch (err) {
        console.warn('Firestore live lookup skipped or offline:', err);
      }

      // 2. Check if phone matches any registered Worker
      const matchingWorker = this.workerService.workers().find(w => w.phone === cleanPhone)
        || this.seedData.defaultWorkers.find(w => w.phone === cleanPhone);

      if (matchingWorker) {
        const workerUser: User = firestoreUser || this.seedData.defaultUsers.find(u => u.uid === matchingWorker.uid) || {
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

        if (this.rejectIfBanned(workerUser)) return;
        this.authService.setUser(workerUser, matchingWorker);
        this.isLoading.set(false);
        this.router.navigate(['/worker']);
        return;
      }

      // 3. User found in Firestore
      if (firestoreUser) {
        if (this.rejectIfBanned(firestoreUser)) return;
        if (firestoreUser.role === 'superadmin' || firestoreUser.role === 'admin') {
          this.authService.setUser(firestoreUser, null);
          this.isLoading.set(false);
          this.router.navigate(['/admin']);
          return;
        } else if (firestoreUser.role === 'worker') {
          const workerMatch = this.workerService.workers().find(w => w.uid === firestoreUser!.uid) || null;
          this.authService.setUser(firestoreUser, workerMatch);
          this.isLoading.set(false);
          this.router.navigate(['/worker']);
          return;
        } else {
          this.authService.setUser(firestoreUser, null);
          this.isLoading.set(false);
          this.router.navigate(['/customer']);
          return;
        }
      }

      // 4. User found in local SeedData defaultUsers
      const localUser = this.seedData.defaultUsers.find(u => u.phone === cleanPhone);
      if (localUser) {
        // Preserve any previously updated favorite workers or customizations
        try {
          const savedRaw = localStorage.getItem('kajkhoj_user');
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            if (parsed.uid === localUser.uid && Array.isArray(parsed.favoriteWorkers)) {
              localUser.favoriteWorkers = parsed.favoriteWorkers;
            }
          }
        } catch {}

        if (this.rejectIfBanned(localUser)) return;

        if (localUser.role === 'superadmin' || localUser.role === 'admin') {
          this.authService.setUser(localUser, null);
          this.isLoading.set(false);
          this.router.navigate(['/admin']);
          return;
        } else if (localUser.role === 'worker') {
          const workerMatch = this.seedData.defaultWorkers.find(w => w.uid === localUser.uid) || null;
          this.authService.setUser(localUser, workerMatch);
          this.isLoading.set(false);
          this.router.navigate(['/worker']);
          return;
        } else {
          this.authService.setUser(localUser, null);
          this.isLoading.set(false);
          this.router.navigate(['/customer']);
          return;
        }
      }

      // 5. Dynamic New Customer registration (persisted to Firestore)
      const newUser: User = {
        uid: 'user_cust_' + Date.now(),
        role: 'customer',
        name: 'কাস্টমার (' + cleanPhone.slice(-4) + ')',
        phone: cleanPhone,
        status: 'active',
        areaId: 'savar_bazar',
        rating: 5.0,
        ratingCount: 0,
        createdAt: new Date().toISOString()
      };

      try {
        if (this.firebaseService?.db) {
          await setDoc(doc(this.firebaseService.db, 'users', newUser.uid), newUser);
        }
      } catch (saveErr) {
        console.warn('Could not save dynamic user to Firestore:', saveErr);
      }

      this.authService.setUser(newUser, null);
      this.isLoading.set(false);
      this.router.navigate(['/customer']);
    } catch (e: any) {
      this.isLoading.set(false);
      this.errorMessage.set(e?.message || 'লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  }

  public autoFillOtp(): void {
    const code = this.generatedOtp();
    if (!code || code.length !== 6) return;
    this.otpString.set(code);
    this.otpDigits.set(code.split(''));
    this.verifyOtp();
  }

  public resendOtp(): void {
    if (this.countdown() > 0) return;
    this.sendOtp();
  }

  public changePhone(): void {
    this.otpSent.set(false);
    this.generatedOtp.set('');
    this.otpExpiresAt = 0;
    this.otpString.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.stopCountdown();
  }

  public quickLogin(account: DemoAccount): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.authService.loginAsDemo(account.id);
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
