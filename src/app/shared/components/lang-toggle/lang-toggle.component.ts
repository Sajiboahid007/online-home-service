import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

/** Header button that switches the UI between Bangla and English. */
@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="lang-toggle"
      (click)="themeService.toggleLanguage()"
      [title]="themeService.t('ভাষা পরিবর্তন করুন')"
      [attr.aria-label]="themeService.t('ভাষা পরিবর্তন করুন')"
    >
      <span class="opt" [class.active]="themeService.currentLang() === 'bn'">বাং</span>
      <span class="opt" [class.active]="themeService.currentLang() === 'en'">EN</span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .lang-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      border: 1px solid rgba(15, 118, 110, 0.35);
      border-radius: 999px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
    }
    .opt {
      padding: 5px 9px;
      border-radius: 999px;
      opacity: 0.65;
      transition: background 0.15s, color 0.15s, opacity 0.15s;
    }
    .opt.active {
      background: #0f766e;
      color: #fff;
      opacity: 1;
    }
    .lang-toggle:focus-visible {
      outline: 2px solid #0f766e;
      outline-offset: 2px;
    }
  `]
})
export class LangToggleComponent {
  public themeService = inject(ThemeService);
}
