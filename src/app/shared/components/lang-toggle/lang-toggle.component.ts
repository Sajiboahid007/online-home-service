import { Component, inject } from '@angular/core';
import { ThemeService, Language } from '../../../core/services/theme.service';

/** Segmented control header component that lets users switch between Bangla and English with dedicated buttons. */
@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  template: `
    <div class="lang-toggle-group" role="group" [attr.aria-label]="themeService.t('ভাষা পরিবর্তন করুন')">
      <button
        type="button"
        class="opt-btn"
        [class.active]="themeService.currentLang() === 'bn'"
        (click)="selectLanguage('bn')"
        title="বাংলা ভাষা নির্বাচন করুন"
        aria-label="Bangla"
      >
        বাং
      </button>
      <button
        type="button"
        class="opt-btn"
        [class.active]="themeService.currentLang() === 'en'"
        (click)="selectLanguage('en')"
        title="Select English Language"
        aria-label="English"
      >
        EN
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
    .lang-toggle-group {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      border: 1px solid rgba(15, 118, 110, 0.4);
      border-radius: 999px;
      background: var(--bg-surface, #ffffff);
      color: inherit;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .opt-btn {
      border: none;
      background: transparent;
      color: var(--text-secondary, #64748b);
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      padding: 5px 10px;
      border-radius: 999px;
      transition: all 0.15s ease-in-out;
      user-select: none;

      &:hover {
        color: var(--text-primary, #0f172a);
        background: rgba(15, 118, 110, 0.08);
      }

      &.active {
        background: #0f766e;
        color: #ffffff;
        box-shadow: 0 1px 4px rgba(15, 118, 110, 0.35);
      }

      &:focus-visible {
        outline: 2px solid #0f766e;
        outline-offset: 1px;
      }
    }
  `]
})
export class LangToggleComponent {
  public themeService = inject(ThemeService);

  public selectLanguage(lang: Language): void {
    this.themeService.setLanguage(lang);
  }
}
