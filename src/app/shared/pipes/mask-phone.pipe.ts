import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskPhone',
  standalone: true
})
export class MaskPhonePipe implements PipeTransform {
  transform(phone: string | null | undefined): string {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 11) return phone;
    // Format: 01711-XXX-344
    return `${clean.substring(0, 5)}-XXX-${clean.substring(clean.length - 3)}`;
  }
}
