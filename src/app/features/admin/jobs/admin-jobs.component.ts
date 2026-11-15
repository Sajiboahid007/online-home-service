import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { JobService } from '../../../core/services/job.service';
import { WorkerService } from '../../../core/services/worker.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { exportToCsv } from '../../../core/utils/csv-exporter';
import { Job, JobStatus } from '../../../core/models/job.model';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, TakaPipe],
  templateUrl: './admin-jobs.component.html',
  styleUrls: ['./admin-jobs.component.scss']
})
export class AdminJobsComponent {
  public theme = inject(ThemeService);
  private jobService = inject(JobService);
  private workerService = inject(WorkerService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);
  private confirmation = inject(ConfirmationService);
  private toast = inject(ToastService);

  public searchQuery = signal<string>('');
  public statusFilter = signal<string>('all');

  public showAssignModal = signal<boolean>(false);
  public selectedJob = signal<Job | null>(null);
  public assignedWorkerId = signal<string>('worker_rahim_1');

  public availableWorkers = this.workerService.workers;

  public filteredJobs = computed(() => {
    let list = this.jobService.jobs();
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    if (q) {
      list = list.filter(j => 
        j.id.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        (j.workerName && j.workerName.toLowerCase().includes(q)) ||
        j.description.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      if (status === 'cancelled') {
        list = list.filter(j => j.status.includes('cancelled'));
      } else {
        list = list.filter(j => j.status === status);
      }
    }

    return list;
  });

  public getStatusBadge(status: JobStatus): string {
    if (status === 'completed' || status === 'paid') return 'badge-success';
    if (status.includes('cancelled')) return 'badge-danger';
    if (status === 'in_progress') return 'badge-info';
    return 'badge-warning';
  }

  public openAssignModal(job: Job): void {
    this.selectedJob.set(job);
    this.showAssignModal.set(true);
  }

  public confirmAssign(): void {
    const job = this.selectedJob();
    if (!job) return;

    const worker = this.workerService.getWorkerById(this.assignedWorkerId());
    if (worker) {
      this.jobService.updateJobStatus(job.id, 'accepted', {
        workerId: worker.uid,
        workerName: worker.name,
        workerPhone: worker.phone,
        workerPhoto: worker.photoURL
      });

      this.auditLog.logAction({
        actorId: this.auth.currentUser()?.uid || 'admin',
        actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
        actorRole: 'admin',
        action: 'job_manual_assigned',
        targetId: job.id,
        targetType: 'job',
        reason: `ম্যানুয়ালি ${worker.name}-কে নিয়োগ দেওয়া হয়েছে।`
      });

      this.showAssignModal.set(false);
      this.toast.success(
        this.theme.currentLang() === 'bn' ? 'কারিগর সফলভাবে নিয়োগ করা হয়েছে!' : 'Worker assigned successfully!'
      );
    }
  }

  public cancelJob(job: Job): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'অর্ডার বাতিল করুন' : 'Cancel Job Order',
      message: isBn
        ? `আপনি কি নিশ্চিত যে অর্ডার #${job.id} (${job.categoryName}) বাতিল করতে চান?`
        : `Are you sure you want to cancel order #${job.id} (${job.categoryName})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'বাতিল করুন' : 'Cancel Job',
      rejectLabel: isBn ? 'ফিরে যান' : 'Go Back',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.jobService.cancelJob(job.id, 'অ্যাডমিন কর্তৃক বাতিল করা হয়েছে', false);

        this.auditLog.logAction({
          actorId: this.auth.currentUser()?.uid || 'admin',
          actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
          actorRole: 'admin',
          action: 'job_cancelled_by_admin',
          targetId: job.id,
          targetType: 'job',
          reason: 'প্রশাসনিক সিদ্ধান্তে অর্ডার বাতিল'
        });

        this.toast.warn(
          isBn ? `অর্ডার #${job.id} সফলভাবে বাতিল করা হয়েছে।` : `Order #${job.id} has been cancelled.`
        );
      }
    });
  }

  public refundJob(job: Job): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'বিল রিফান্ড অনুমোদন' : 'Approve Refund',
      message: isBn
        ? `অর্ডার #${job.id}-এর জন্য সম্পূর্ণ মূল্য রিফান্ড প্রদান করবেন?`
        : `Issue a full refund for order #${job.id}?`,
      icon: 'pi pi-money-bill',
      acceptLabel: isBn ? 'রিফান্ড দিন' : 'Refund',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.jobService.updateJobStatus(job.id, job.status, { paymentStatus: 'refunded' });

        this.auditLog.logAction({
          actorId: this.auth.currentUser()?.uid || 'admin',
          actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
          actorRole: 'admin',
          action: 'job_refunded',
          targetId: job.id,
          targetType: 'job',
          reason: 'গ্রাহকের অনুরোধে বিল রিফান্ড অনুমোদন'
        });

        this.toast.success(
          isBn ? `অর্ডার #${job.id}-এর রিফান্ড সফলভাবে সম্পন্ন হয়েছে!` : `Refund for order #${job.id} issued successfully!`
        );
      }
    });
  }

  public exportCsv(): void {
    const rows = this.filteredJobs().map(j => ({
      'Job ID': j.id,
      'Category': j.categoryName,
      'Customer': j.customerName,
      'Worker': j.workerName || 'Unassigned',
      'Price': j.finalPrice || j.estimatedPrice,
      'Status': j.status,
      'Created At': j.timeline.createdAt
    }));
    exportToCsv('KajKhoj_Jobs', rows);
  }
}
