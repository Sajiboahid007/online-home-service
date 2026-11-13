import { Pipe, PipeTransform, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { localizeDigits } from './bn-number.pipe';

@Pipe({
  name: 'taka',
  standalone: true,
  pure: false
})
export class TakaPipe implements PipeTransform {
  private themeService = inject(ThemeService);

  transform(value: number | string | null | undefined): string {
    const num = Number(value ?? 0) || 0;
    const formatted = num.toLocaleString('en-US');
    return `৳${localizeDigits(formatted, this.themeService.currentLang())}`;
  }
}
