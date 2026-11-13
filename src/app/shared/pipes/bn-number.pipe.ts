import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bnNumber',
  standalone: true
})
export class BnNumberPipe implements PipeTransform {
  private bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = value.toString();
    return str.replace(/[0-9]/g, (digit) => this.bnDigits[parseInt(digit, 10)]);
  }
}
