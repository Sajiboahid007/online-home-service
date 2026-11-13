import { Pipe, PipeTransform, inject } from '@angular/core';
import { Language, ThemeService } from '../../core/services/theme.service';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Render digits for a language: Bangla digits for 'bn', ASCII digits for 'en'. */
export function localizeDigits(value: number | string | null | undefined, lang: Language): string {
  if (value === null || value === undefined) return '';
  const str = value.toString();
  if (lang === 'en') {
    return str.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  }
  return str.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

@Pipe({
  name: 'bnNumber',
  standalone: true,
  pure: false
})
export class BnNumberPipe implements PipeTransform {
  private themeService = inject(ThemeService);

  transform(value: number | string | null | undefined): string {
    return localizeDigits(value, this.themeService.currentLang());
  }
}
