import { Injectable, signal } from '@angular/core';
import { AuditLog } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private logsSignal = signal<AuditLog[]>([
    {
      id: 'log_1',
      actorId: 'user_admin_savar_1',
      actorName: 'সাভার জোন অ্যাডমিন',
      actorRole: 'admin',
      action: 'worker_kyc_approved',
      targetId: 'worker_rahim_1',
      targetType: 'worker',
      reason: 'জাতীয় পরিচয়পত্র ও ফেসিয়াল ভেরিফিকেশন সফল',
      createdAt: '2026-11-10T10:00:00Z'
    },
    {
      id: 'log_2',
      actorId: 'user_superadmin_1',
      actorName: 'সুপার অ্যাডমিন',
      actorRole: 'superadmin',
      action: 'settings_updated',
      targetId: 'platform_settings',
      targetType: 'settings',
      reason: 'কমিশন হার ১৫% অপরিবর্তিত রাখা হয়েছে',
      createdAt: '2026-11-11T12:30:00Z'
    }
  ]);

  public logs = this.logsSignal.asReadonly();

  constructor() {
    const saved = localStorage.getItem('kajkhoj_audit_logs');
    if (saved) {
      try {
        this.logsSignal.set(JSON.parse(saved));
      } catch (e) {}
    }
  }

  public logAction(
    actionOrLog: string | Omit<AuditLog, 'id' | 'createdAt'>,
    targetType?: any,
    targetId?: string,
    details?: any
  ): void {
    let newLog: AuditLog;
    if (typeof actionOrLog === 'string') {
      newLog = {
        id: `log_${Date.now()}`,
        actorId: 'user_admin',
        actorName: 'সুপার অ্যাডমিন',
        actorRole: 'superadmin',
        action: actionOrLog,
        targetType: targetType || 'settings',
        targetId: targetId || 'system',
        reason: typeof details === 'string' ? details : JSON.stringify(details || {}),
        after: details,
        createdAt: new Date().toISOString()
      };
    } else {
      newLog = {
        ...actionOrLog,
        id: `log_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
    }
    this.logsSignal.update(list => [newLog, ...list]);
    localStorage.setItem('kajkhoj_audit_logs', JSON.stringify(this.logsSignal()));
  }
}
