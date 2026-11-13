import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Job, PaymentMethod } from '../../../core/models/job.model';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, TakaPipe],
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss']
})
export class PaymentPageComponent implements OnInit {
  public route = inject(ActivatedRoute);
  public router = inject(Router);
  private jobService = inject(JobService);
  private paymentService = inject(PaymentService);

  public job = signal<Job | null>(null);
  public selectedMethod = signal<PaymentMethod>('bkash');
  public isProcessing = signal<boolean>(false);
  public invoiceNumber = signal<string>('INV-2026-8812');

  public totalBill = computed(() => {
    const j = this.job();
    if (!j) return 0;
    const labor = j.estimatedPrice || 350;
    const material = j.materialCost || 0;
    const platform = j.platformFee || 20;
    const discount = j.couponDiscount || 0;
    return Math.max(0, labor + material + platform - discount);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || 'job_demo_101';
    const found = this.jobService.getJobById(id);
    if (found) {
      this.job.set(found);
      this.selectedMethod.set(found.paymentMethod || 'bkash');
      this.invoiceNumber.set(`INV-2026-${found.id.slice(-4) || '101'}`);
    }
  }

  public goBack(): void {
    const j = this.job();
    if (j) {
      this.router.navigate(['/customer/tracking', j.id]);
    } else {
      this.router.navigate(['/customer/bookings']);
    }
  }

  public confirmPayment(): void {
    const j = this.job();
    if (!j) return;

    this.isProcessing.set(true);

    setTimeout(() => {
      const res = this.paymentService.processCustomerPayment(
        j.id,
        this.totalBill(),
        this.selectedMethod(),
        j.workerId || undefined
      );

      this.jobService.updateJobStatus(j.id, 'paid', {
        paymentStatus: 'paid',
        paymentMethod: this.selectedMethod()
      });

      this.job.set(this.jobService.getJobById(j.id) || null);
      this.isProcessing.set(false);
    }, 1200);
  }

  public printInvoice(): void {
    window.print();
  }
}
