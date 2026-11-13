import { Pipe, PipeTransform } from '@angular/core';
import { BnNumberPipe } from './bn-number.pipe';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  private bnNumber = new BnNumberPipe();

  transform(value: string | number | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) {
      return 'এইমাত্র';
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${this.bnNumber.transform(diffMinutes)} মিনিট আগে`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${this.bnNumber.transform(diffHours)} ঘণ্টা আগে`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${this.bnNumber.transform(diffDays)} দিন আগে`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    return `${this.bnNumber.transform(diffMonths)} মাস আগে`;
  }
}
