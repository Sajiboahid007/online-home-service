import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { JobService } from '../../../core/services/job.service';
import { PaymentService } from '../../../core/services/payment.service';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-worker-earnings',
  standalone: true,
  imports: [CommonModule, TakaPipe],
  templateUrl: './worker-earnings.component.html',
  styleUrls: ['./worker-earnings.component.scss']
})
export class WorkerEarningsComponent {
  private auth = inject(AuthService);
  private jobService = inject(JobService);
  private paymentService = inject(PaymentService);

  public worker = this.auth.currentWorker;

  public walletBalance = computed(() => this.worker()?.walletBalance || 2450);
  public todayEarnings = signal<number>(850);
  public weeklyEarnings = signal<number>(5460);
  public monthlyEarnings = signal<number>(22300);
  public totalCommissionPaid = signal<number>(3345);

  public weeklyTrend = signal([
    { day: 'শনি', amount: 650, pct: 55 },
    { day: 'রবি', amount: 900, pct: 75 },
    { day: 'সোম', amount: 450, pct: 38 },
    { day: 'মঙ্গল', amount: 1200, pct: 100 },
    { day: 'বুধ', amount: 800, pct: 67 },
    { day: 'বৃহঃ', amount: 600, pct: 50 },
    { day: 'শুক্র', amount: 860, pct: 72 }
  ]);

  public recentEarnings = signal([
    {
      id: 'e_1',
      date: new Date(Date.now() - 3600000 * 3).toISOString(),
      description: 'বাথরুমের সিঙ্ক পাইপ মেরামত',
      totalBill: 400,
      commission: 60,
      netEarning: 340
    },
    {
      id: 'e_2',
      date: new Date(Date.now() - 3600000 * 26).toISOString(),
      description: 'কিচেনের কল ও ড্রেন পাইপ ফিটিং',
      totalBill: 500,
      commission: 75,
      netEarning: 425
    },
    {
      id: 'e_3',
      date: new Date(Date.now() - 3600000 * 52).toISOString(),
      description: 'পানির মোটর পাম্প চেক ও মেরামত',
      totalBill: 650,
      commission: 98,
      netEarning: 552
    }
  ]);
}
