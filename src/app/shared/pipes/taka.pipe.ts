import { Pipe, PipeTransform } from '@angular/core';
import { BnNumberPipe } from './bn-number.pipe';

@Pipe({
  name: 'taka',
  standalone: true
})
export class TakaPipe implements PipeTransform {
  private bnNumber = new BnNumberPipe();

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return '৳০';
    const num = Number(value) || 0;
    const formatted = num.toLocaleString('en-US');
    return `৳${this.bnNumber.transform(formatted)}`;
  }
}
