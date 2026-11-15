import { Injectable, signal, effect } from '@angular/core';
import { EN_DICTIONARY } from '../i18n';

export type Language = 'bn' | 'en';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public isDarkMode = signal<boolean>(false);
  public currentLang = signal<Language>('bn');

  private translations: Record<string, { bn: string; en: string }> = {
    'app_name': { bn: 'কাজখোঁজ', en: 'KajKhoj' },
    'home': { bn: 'হোম', en: 'Home' },
    'bookings': { bn: 'বুকিংস', en: 'Bookings' },
    'profile': { bn: 'প্রোফাইল', en: 'Profile' },
    'dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
    'wallet': { bn: 'ওয়ালেট', en: 'Wallet' },
    'job_board': { bn: 'জব বোর্ড', en: 'Job Board' },
    'active_job': { bn: 'চলমান কাজ', en: 'Active Job' },
    'history': { bn: 'কাজের ইতিহাস', en: 'Job History' },
    'earnings': { bn: 'উপার্জন', en: 'Earnings' },
    'reviews': { bn: 'রিভিউ', en: 'Reviews' },
    'sos': { bn: 'জরুরি SOS', en: 'Emergency SOS' },
    'dark_mode': { bn: 'ডার্ক মোড', en: 'Dark Mode' },
    'light_mode': { bn: 'লাইট মোড', en: 'Light Mode' },
    'search': { bn: 'অনুসন্ধান করুন...', en: 'Search...' },
    'book_now': { bn: 'বুক করুন', en: 'Book Now' },
    'create_job': { bn: 'নতুন কাজ তৈরি', en: 'Create Job' },
    'payment': { bn: 'পেমেন্ট ও ইনভয়েস', en: 'Payment & Invoice' },
    'logout': { bn: 'লগআউট', en: 'Logout' }
  };

  constructor() {
    const savedTheme = localStorage.getItem('kajkhoj_theme');
    if (savedTheme === 'dark') {
      this.isDarkMode.set(true);
      document.body.classList.add('dark-mode');
    }

    try {
      const savedLang = localStorage.getItem('kajkhoj_lang');
      if (savedLang === 'en' || savedLang === 'bn') {
        this.currentLang.set(savedLang);
      } else {
        this.currentLang.set('bn');
      }
    } catch {
      this.currentLang.set('bn');
    }

    effect(() => {
      const lang = this.currentLang();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    });

    effect(() => {
      const dark = this.isDarkMode();
      if (dark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('kajkhoj_theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('kajkhoj_theme', 'light');
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === 'kajkhoj_lang' && (event.newValue === 'en' || event.newValue === 'bn')) {
          if (this.currentLang() !== event.newValue) {
            this.currentLang.set(event.newValue);
          }
        }
      });
    }
  }

  public toggleDarkMode(): void {
    this.isDarkMode.update(v => !v);
  }

  public setLanguage(lang: Language): void {
    if (this.currentLang() !== lang) {
      this.currentLang.set(lang);
    }
    try {
      localStorage.setItem('kajkhoj_lang', lang);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kajkhoj_lang_changed', { detail: lang }));
    }
  }

  public toggleLanguage(): void {
    this.setLanguage(this.currentLang() === 'bn' ? 'en' : 'bn');
  }

  /**
   * Translate a named key (e.g. 'home') or a Bangla source string.
   * Bangla source strings are looked up in EN_DICTIONARY; anything missing stays in Bangla.
   */
  public t(key: string): string {
    const lang = this.currentLang();
    const item = this.translations[key];
    if (item) return item[lang] || item.bn;
    if (lang === 'en') return EN_DICTIONARY[key] ?? key;
    return key;
  }
}
