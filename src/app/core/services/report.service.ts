import { Injectable, signal, inject } from '@angular/core';
import { Report } from '../models/report.model';
import { SOSAlert } from '../models/sos.model';
import { BlacklistItem, UserAppeal } from '../models/blacklist.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private notificationService = inject(NotificationService);

  private reportsSignal = signal<Report[]>([
    {
      id: 'rep_1',
      jobId: 'job_demo_101',
      reporterId: 'user_customer_demo_1',
      reporterName: 'তানভীর আহমেদ',
      againstId: 'worker_korim_2',
      againstName: 'করিম মিয়া',
      type: 'overcharge',
      severity: 'low',
      description: 'অতিরিক্ত ভিজিট ফি দাবি করেছিল',
      evidence: [],
      status: 'resolved',
      assignedAdmin: 'user_admin_savar_1',
      resolution: 'ওয়ার্কারকে প্ল্যাটফর্ম নিয়ম সম্পর্কে সতর্ক করা হয়েছে',
      createdAt: '2026-11-08T15:00:00Z'
    },
    {
      id: 'rep_2',
      jobId: 'job_demo_102',
      reporterId: 'user_customer_demo_1',
      reporterName: 'তানভীর আহমেদ',
      againstId: 'worker_rahim_1',
      againstName: 'মোঃ রহিম উদ্দিন',
      type: 'quality',
      severity: 'medium',
      description: 'কল মেরামতের পর হালকা পানি চুইয়ে পড়ছে, পুনরায় পরীক্ষা প্রয়োজন',
      evidence: [],
      status: 'investigating',
      assignedAdmin: 'user_admin_savar_1',
      createdAt: '2026-11-11T11:30:00Z'
    }
  ]);

  private sosAlertsSignal = signal<SOSAlert[]>([
    {
      id: 'sos_demo_1',
      uid: 'user_customer_demo_1',
      userName: 'তানভীর আহমেদ',
      userPhone: '০১৭১২-৩৪৫৬৭৮',
      location: { lat: 23.8223, lng: 90.2673, address: 'সাভার বাজার রোড, সাভার, ঢাকা' },
      status: 'active',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    }
  ]);

  private blacklistSignal = signal<BlacklistItem[]>([
    {
      id: 'blk_1',
      type: 'phone',
      value: '01500000000',
      reason: 'গ্রাহকের সাথে প্রতারণা ও ভুয়া প্রোফাইল',
      bannedBy: 'সুপার অ্যাডমিন',
      bannedAt: '2026-11-01T10:00:00Z'
    },
    {
      id: 'blk_2',
      type: 'nid',
      value: '19902692019283999',
      reason: 'জাল জাতীয় পরিচয়পত্র (Fake NID)',
      bannedBy: 'সাভার জোন অ্যাডমিন',
      bannedAt: '2026-11-05T14:30:00Z'
    }
  ]);

  private appealsSignal = signal<UserAppeal[]>([
    {
      id: 'app_1',
      uid: 'user_banned_demo',
      userName: 'শফিক আলম',
      userPhone: '01500000000',
      userRole: 'worker',
      reason: 'ভুল বোঝাবুঝির কারণে বরখাস্ত',
      explanation: 'গ্রাহকের সাথে কাজের রেট নিয়ে ভুল বোঝাবুঝি হয়েছিল, আমি অতিরিক্ত টাকা নেইনি। পুনর্বিবেচনা আশা করছি।',
      status: 'pending',
      submittedAt: '2026-11-10T16:00:00Z'
    }
  ]);

  public reports = this.reportsSignal.asReadonly();
  public sosAlerts = this.sosAlertsSignal.asReadonly();
  public blacklist = this.blacklistSignal.asReadonly();
  public appeals = this.appealsSignal.asReadonly();

  public createReport(report: Partial<Report>): Report {
    const newReport: Report = {
      id: `rep_${Date.now()}`,
      reporterId: report.reporterId || 'user',
      reporterName: report.reporterName || 'ইউজার',
      againstId: report.againstId || 'worker',
      againstName: report.againstName || 'ওয়ার্কার',
      type: report.type || 'behavior',
      severity: report.severity || 'medium',
      description: report.description || 'অভিযোগের বিবরণ',
      evidence: report.evidence || [],
      status: 'open',
      createdAt: new Date().toISOString(),
      ...report
    } as Report;

    this.reportsSignal.update(list => [newReport, ...list]);

    this.notificationService.addNotification({
      userId: 'admin',
      title: 'নতুন বিরোধ / অভিযোগ দাখিল 🚨',
      body: `${newReport.reporterName} কর্তৃক ${newReport.againstName} এর বিরুদ্ধে অভিযোগ দায়ের করা হয়েছে।`,
      type: 'safety',
      link: '/admin/reports'
    });

    return newReport;
  }

  // Trigger SOS with SMS broadcast (Item 78)
  public triggerSOS(alert: Partial<SOSAlert>): SOSAlert {
    const sos: SOSAlert = {
      id: `sos_${Date.now()}`,
      uid: alert.uid || 'user',
      userName: alert.userName || 'জরুরি কলার',
      userPhone: alert.userPhone || '01712345678',
      location: alert.location || { lat: 23.8223, lng: 90.2673, address: 'সাভার, ঢাকা' },
      status: 'active',
      createdAt: new Date().toISOString(),
      ...alert
    } as SOSAlert;

    this.sosAlertsSignal.update(list => [sos, ...list]);

    // Emergency notification to Admin Control Room
    this.notificationService.addNotification({
      userId: 'admin',
      title: 'জরুরি SOS অ্যালার্ম! 🆘',
      body: `${sos.userName} (${sos.userPhone}) জরুরি সাহায্য চেয়েছেন! অবস্থান: ${sos.location.address}`,
      type: 'safety',
      link: '/admin/reports'
    });

    return sos;
  }

  public resolveSOS(id: string, note: string): void {
    this.sosAlertsSignal.update(list => list.map(s => s.id === id ? { ...s, status: 'resolved', resolutionNote: note } : s));
  }

  public updateReportStatus(id: string, status: 'open' | 'investigating' | 'resolved' | 'rejected', resolution?: string): void {
    this.reportsSignal.update(list => list.map(r => r.id === id ? {
      ...r,
      status,
      resolution: resolution || r.resolution
    } : r));
  }

  // Blacklist manager (Item 72, 74, 99)
  public addToBlacklist(item: Omit<BlacklistItem, 'id' | 'bannedAt'>): void {
    const newItem: BlacklistItem = {
      ...item,
      id: `blk_${Date.now()}`,
      bannedAt: new Date().toISOString()
    };
    this.blacklistSignal.update(list => [newItem, ...list]);
  }

  public removeFromBlacklist(id: string): void {
    this.blacklistSignal.update(list => list.filter(b => b.id !== id));
  }

  // User Appeals (Item 75)
  public submitAppeal(appeal: Omit<UserAppeal, 'id' | 'status' | 'submittedAt'>): void {
    const newAppeal: UserAppeal = {
      ...appeal,
      id: `app_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    this.appealsSignal.update(list => [newAppeal, ...list]);
  }

  public reviewAppeal(appealId: string, approved: boolean, note: string, reviewerName: string = 'অ্যাডমিন'): void {
    this.appealsSignal.update(list => list.map(a => {
      if (a.id === appealId) {
        return {
          ...a,
          status: approved ? 'approved' : 'rejected',
          reviewedBy: reviewerName,
          reviewNote: note,
          reviewedAt: new Date().toISOString()
        };
      }
      return a;
    }));
  }
}
