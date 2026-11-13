import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, TakaPipe],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.scss']
})
export class SuperadminDashboardComponent {
  public areaRevenue = signal([
    { name: 'সাভার বাজার ও বাসস্ট্যান্ড', revenue: 98400, percentage: 54 },
    { name: 'আশুলিয়া ও ডিইপিজেড', revenue: 45200, percentage: 25 },
    { name: 'হেমায়েতপুর', revenue: 24350, percentage: 13 },
    { name: 'মিরপুর ঢাকা', revenue: 14500, percentage: 8 }
  ]);

  public categoryRevenue = signal([
    { name: 'প্লাম্বার সার্ভিস', revenue: 76500, percentage: 42 },
    { name: 'ইলেকট্রিশিয়ান', revenue: 48900, percentage: 27 },
    { name: 'এসি টেকনিশিয়ান', revenue: 38200, percentage: 21 },
    { name: 'ক্লিনার ও অন্যান্য', revenue: 18850, percentage: 10 }
  ]);
}
