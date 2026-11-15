import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { WorkerService } from '../../../core/services/worker.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { WorkerProfile } from '../../../core/models/worker.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-admin-worker-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, BnNumberPipe],
  templateUrl: './admin-worker-verification.component.html',
  styleUrl: './admin-worker-verification.component.scss'
})
export class AdminWorkerVerificationComponent {
  public theme = inject(ThemeService);
  private workerService = inject(WorkerService);
  private confirmation = inject(ConfirmationService);
  private toast = inject(ToastService);

  public showRejectModal = signal<boolean>(false);
  public selectedWorker = signal<WorkerProfile | null>(null);
  public rejectReason = signal<string>('NID কার্ডের তথ্য পরিষ্কার নয় বা অস্পষ্ট');
  public customRejectNote = signal<string>('');

  public pendingWorkers = computed(() => {
    return this.workerService.workers().filter(w => w.verificationStatus === 'pending');
  });

  public approve(worker: WorkerProfile): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'ওয়ার্কার ভেরিফিকেশন অনুমোদন' : 'Approve Worker Verification',
      message: isBn
        ? `আপনি কি নিশ্চিত যে "${worker.name}"-এর KYC ও NID যাচাই অনুমোদন করতে চান?`
        : `Are you sure you want to verify and approve "${worker.name}"?`,
      icon: 'pi pi-check-circle',
      acceptLabel: isBn ? 'অনুমোদন দিন' : 'Approve',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.workerService.setVerificationStatus(worker.uid, 'approved');
        this.toast.success(
          isBn
            ? `"${worker.name}" সফলভাবে অনুমোদিত হয়েছে! এখন তিনি লাইভ ম্যাপে দৃশ্যমান।`
            : `"${worker.name}" has been verified and approved successfully.`
        );
      }
    });
  }

  public openRejectModal(worker: WorkerProfile): void {
    this.selectedWorker.set(worker);
    this.rejectReason.set('NID কার্ডের তথ্য পরিষ্কার নয় বা অস্পষ্ট');
    this.customRejectNote.set('');
    this.showRejectModal.set(true);
  }

  public closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedWorker.set(null);
  }

  public confirmReject(): void {
    const worker = this.selectedWorker();
    if (!worker) return;

    const fullReason = this.customRejectNote().trim()
      ? `${this.rejectReason()} - ${this.customRejectNote().trim()}`
      : this.rejectReason();

    this.workerService.setVerificationStatus(worker.uid, 'rejected');
    const isBn = this.theme.currentLang() === 'bn';

    this.toast.warn(
      isBn
        ? `ওয়ার্কার "${worker.name}"-এর আবেদন বাতিল করা হয়েছে। কারণ: ${fullReason}`
        : `Verification for "${worker.name}" rejected. Reason: ${fullReason}`
    );

    this.closeRejectModal();
  }
}
