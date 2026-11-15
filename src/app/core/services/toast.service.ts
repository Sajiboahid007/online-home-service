import { Injectable, signal, inject } from '@angular/core';
import { NotificationService } from './notification.service';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warn' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private notificationService = inject(NotificationService);

  private toastsSignal = signal<ToastMessage[]>([]);
  public toasts = this.toastsSignal.asReadonly();

  public show(
    message: string,
    type: 'success' | 'info' | 'warn' | 'error' = 'info',
    title?: string,
    duration: number = 3500
  ): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const toast: ToastMessage = { id, type, title, message, duration };

    this.toastsSignal.update(list => [...list, toast]);

    try {
      this.notificationService.notify(message, type, title || 'সিস্টেম বার্তা');
    } catch {}

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  public success(message: string, title: string = 'সফল (Success)'): void {
    this.show(message, 'success', title);
  }

  public info(message: string, title: string = 'তথ্য (Info)'): void {
    this.show(message, 'info', title);
  }

  public warn(message: string, title: string = 'সতর্কতা (Warning)'): void {
    this.show(message, 'warn', title);
  }

  public error(message: string, title: string = 'ত্রুটি (Error)'): void {
    this.show(message, 'error', title);
  }

  public remove(id: string): void {
    this.toastsSignal.update(list => list.filter(t => t.id !== id));
  }
}
