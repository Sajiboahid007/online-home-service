import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { Report } from '../../../core/models/report.model';
import { SOSAlert } from '../../../core/models/sos.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BnNumberPipe, TimeAgoPipe],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss'
})
export class AdminReportsComponent {
  private reportService = inject(ReportService);

  public reports = this.reportService.reports;
  public sosAlerts = this.reportService.sosAlerts;

  public activeFilter = signal<'all' | 'open' | 'investigating' | 'resolved'>('all');
  public selectedReport = signal<Report | null>(null);
  public resolutionText = signal<string>('');
  public selectedSOS = signal<SOSAlert | null>(null);
  public sosNote = signal<string>('');

  public activeSOSCount = computed(() => {
    return this.sosAlerts().filter(s => s.status === 'active').length;
  });

  public filteredReports = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.reports();
    return this.reports().filter(r => r.status === filter);
  });

  public setFilter(filter: 'all' | 'open' | 'investigating' | 'resolved'): void {
    this.activeFilter.set(filter);
  }

  public openResolveSOS(sos: SOSAlert): void {
    this.selectedSOS.set(sos);
    this.sosNote.set('পুলিশ ও সাভার কন্ট্রোল রুমের সাথে যোগাযোগ করে পরিস্থিতি নিয়ন্ত্রণে আনা হয়েছে।');
  }

  public closeSOSModal(): void {
    this.selectedSOS.set(null);
  }

  public confirmResolveSOS(): void {
    const sos = this.selectedSOS();
    if (sos) {
      this.reportService.resolveSOS(sos.id, this.sosNote().trim());
      this.selectedSOS.set(null);
    }
  }

  public openReportDetails(report: Report): void {
    this.selectedReport.set(report);
    this.resolutionText.set(report.resolution || '');
  }

  public closeReportDetails(): void {
    this.selectedReport.set(null);
  }

  public updateStatus(status: 'investigating' | 'resolved' | 'rejected'): void {
    const r = this.selectedReport();
    if (r) {
      this.reportService.updateReportStatus(r.id, status, this.resolutionText().trim());
      this.selectedReport.set(null);
    }
  }

  public getTypeText(type: string): string {
    switch (type) {
      case 'overcharge': return 'অতিরিক্ত পারিশ্রমিক দাবি';
      case 'behavior': return 'অপেশাদার আচরণ';
      case 'quality': return 'কাজের নিম্নমান / ক্ষতিসাধন';
      case 'no_show': return 'অনুপস্থিতি';
      case 'harassment': return 'হয়রানি';
      case 'theft': return 'চুরি বা খোয়া যাওয়া';
      default: return 'সাধারণ অভিযোগ';
    }
  }
}
