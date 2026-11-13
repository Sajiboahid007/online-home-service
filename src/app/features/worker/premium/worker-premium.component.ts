import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-worker-premium',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worker-premium.component.html',
  styleUrls: ['./worker-premium.component.scss']
})
export class WorkerPremiumComponent {
  private auth = inject(AuthService);
  private paymentService = inject(PaymentService);

  public worker = this.auth.currentWorker;
  public isCurrentPremium = computed(() => !!this.worker()?.isPremium);
  public subscribeSuccess = signal<string | null>(null);

  public subscribe(): void {
    const w = this.worker();
    if (!w) return;

    const res = this.paymentService.subscribePremium(w.uid, 1);
    if (res.success) {
      this.subscribeSuccess.set(res.message);
    }
  }

  public renewSubscription(): void {
    this.subscribe();
  }
}
