import { Pipe, PipeTransform, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { localizeDigits } from './bn-number.pipe';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false
})
export class TimeAgoPipe implements PipeTransform {
  private themeService = inject(ThemeService);

  transform(value: string | number | Date | null | undefined): string {
    if (!value) return '';
    const diffSeconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

    if (diffSeconds < 60) return this.themeService.t('এইমাত্র');
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return this.format(diffMinutes, 'মিনিট আগে');
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return this.format(diffHours, 'ঘণ্টা আগে');
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return this.format(diffDays, 'দিন আগে');
    return this.format(Math.floor(diffDays / 30), 'মাস আগে');
  }

  private format(amount: number, unit: string): string {
    return `${localizeDigits(amount, this.themeService.currentLang())} ${this.themeService.t(unit)}`;
  }
}
