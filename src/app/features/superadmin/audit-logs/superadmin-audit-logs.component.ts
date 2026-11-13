import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLog } from '../../../core/models/audit-log.model';
import { exportToCsv } from '../../../core/utils/csv-exporter';

@Component({
  selector: 'app-superadmin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-audit-logs.component.html',
  styleUrls: ['./superadmin-audit-logs.component.scss']
})
export class SuperadminAuditLogsComponent {
  private auditLogService = inject(AuditLogService);

  public logs = this.auditLogService.logs;
  public searchTerm = signal('');
  public selectedType = signal('all');

  public filteredLogs = computed(() => {
    const list: AuditLog[] = this.logs();
    const query = this.searchTerm().toLowerCase().trim();
    const type = this.selectedType();

    return list.filter((item: AuditLog) => {
      const matchType = type === 'all' || item.targetType === type;
      const matchQuery =
        !query ||
        item.action.toLowerCase().includes(query) ||
        item.actorName.toLowerCase().includes(query) ||
        (item.reason && item.reason.toLowerCase().includes(query)) ||
        item.targetId.toLowerCase().includes(query);
      return matchType && matchQuery;
    });
  });

  public exportLogs(): void {
    const data = this.filteredLogs().map((l: AuditLog) => ({
      ID: l.id,
      Timestamp: l.createdAt,
      Actor: `${l.actorName} (${l.actorRole})`,
      Action: l.action,
      TargetType: l.targetType,
      TargetId: l.targetId,
      Details: l.reason || ''
    }));

    exportToCsv(`kajkhoj-audit-logs-${new Date().toISOString().split('T')[0]}`, data);
  }
}
