import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerService } from '../../../core/services/worker.service';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-admin-worker-verification',
  standalone: true,
  imports: [CommonModule, BnNumberPipe],
  templateUrl: './admin-worker-verification.component.html',
  styleUrl: './admin-worker-verification.component.scss'
})
export class AdminWorkerVerificationComponent {
  public pendingWorkers = computed(() => {
    return this.workerService.workers().filter(w => w.verificationStatus === 'pending');
  });

  constructor(private workerService: WorkerService) {}

  public approve(uid: string): void {
    this.workerService.setVerificationStatus(uid, 'approved');
    alert('ওয়ার্কার সফলভাবে অনুমোদিত (Verified) হয়েছে! এখন তিনি লাইভ ম্যাপে দৃশ্যমান হবেন এবং কাজ গ্রহণ করতে পারবেন।');
  }

  public reject(uid: string): void {
    const reason = prompt('বাতিলের কারণ লিখুন (যেমন: NID ছবি অস্পষ্ট, ঠিকানা অসম্পূর্ণ):', 'NID কার্ডের তথ্য পরিষ্কার নয়');
    if (reason) {
      this.workerService.setVerificationStatus(uid, 'rejected');
      alert(`ওয়ার্কার আবেদন বাতিল করা হয়েছে। কারণ: ${reason}`);
    }
  }
}
