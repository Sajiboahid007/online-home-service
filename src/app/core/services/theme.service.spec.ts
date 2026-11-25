import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService bilingual translation', () => {
  let theme: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    theme = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('translates seeded Bangla content to English when language is en and back to Bangla when bn', () => {
    theme.setLanguage('en');
    expect(theme.t('পাইপ লিকেজ মেরামত')).toBe('Pipe Leakage Repair');
    expect(theme.t('মো: রহিম উদ্দিন')).toBe('Md. Rahim Uddin');
    expect(theme.t('রোড ৭, ব্লক বি, ব্যাংক কলোনি, সাভার')).toBe('Road 7, Block B, Bank Colony, Savar');
    expect(theme.t('কাজের অগ্রগতি ট্র্যাকিং')).toBe('Job Progress Tracking');

    theme.setLanguage('bn');
    expect(theme.t('পাইপ লিকেজ মেরামত')).toBe('পাইপ লিকেজ মেরামত');
    expect(theme.t('Pipe Leakage Repair')).toBe('পাইপ লিকেজ মেরামত');
    expect(theme.t('Job Progress Tracking')).toBe('কাজের অগ্রগতি ট্র্যাকিং');
  });

  it('localizes partial Bangla addresses and digits cleanly in English mode', () => {
    theme.setLanguage('en');
    const translated = theme.t('বাড়ি #১২, রোড #৩, সাভার');
    expect(translated).toContain('House');
    expect(translated).toContain('Road');
    expect(translated).toContain('Savar');
    expect(translated).toContain('12');
    expect(translated).toContain('3');
  });
});
