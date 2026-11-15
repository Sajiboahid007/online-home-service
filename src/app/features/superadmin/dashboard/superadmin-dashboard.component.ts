import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, TakaPipe, BnNumberPipe],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.scss']
})
export class SuperadminDashboardComponent {
  public theme = inject(ThemeService);

  public gmv = 182450;
  public commission = 27367;
  public completedJobs = 512;
  public activeWorkers = 68;

  public areaRevenue = signal([
    { nameBn: 'সাভার বাজার ও বাসস্ট্যান্ড', nameEn: 'Savar Bazar & Bus Stand', revenue: 98400, percentage: 54 },
    { nameBn: 'আশুলিয়া ও ডিইপিজেড', nameEn: 'Ashulia & DEPZ', revenue: 45200, percentage: 25 },
    { nameBn: 'হেমায়েতপুর', nameEn: 'Hemayetpur', revenue: 24350, percentage: 13 },
    { nameBn: 'মিরপুর ঢাকা', nameEn: 'Mirpur Dhaka', revenue: 14500, percentage: 8 }
  ]);

  public categoryRevenue = signal([
    { nameBn: 'প্লাম্বার সার্ভিস', nameEn: 'Plumbing Service', revenue: 76500, percentage: 42 },
    { nameBn: 'ইলেকট্রিশিয়ান', nameEn: 'Electrician', revenue: 48900, percentage: 27 },
    { nameBn: 'এসি টেকনিশিয়ান', nameEn: 'AC Technician', revenue: 38200, percentage: 21 },
    { nameBn: 'ক্লিনার ও অন্যান্য', nameEn: 'Cleaner & Others', revenue: 18850, percentage: 10 }
  ]);
}
