import { Pipe, PipeTransform, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Translates Bangla source text (or a named key) into the current language.
 * Impure so it re-renders when the language changes.
 */
@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private themeService = inject(ThemeService);

  transform(value: string | null | undefined): string {
    if (!value) return '';
    return this.themeService.t(value);
  }
}
