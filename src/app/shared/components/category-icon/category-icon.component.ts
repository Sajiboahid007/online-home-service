import { Component, computed, input } from '@angular/core';

/**
 * Renders a category or task icon consistently as a crisp PrimeIcon (`pi pi-*`),
 * while falling back gracefully if a legacy or custom text/emoji icon is passed.
 */
@Component({
  selector: 'app-cat-icon',
  standalone: true,
  template: `
    @if (isPrimeIcon()) {
      <i [class]="normalizedClass()" aria-hidden="true"></i>
    } @else {
      <span aria-hidden="true">{{ icon() }}</span>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    i {
      font-size: inherit;
      line-height: 1;
    }
  `]
})
export class CategoryIconComponent {
  public icon = input<string>('pi pi-wrench');

  public isPrimeIcon = computed(() => {
    const val = (this.icon() || '').trim();
    return val.startsWith('pi ') || val.startsWith('pi-');
  });

  public normalizedClass = computed(() => {
    const val = (this.icon() || '').trim();
    if (!val) return 'pi pi-wrench';
    return val.startsWith('pi ') ? val : `pi ${val}`;
  });
}
