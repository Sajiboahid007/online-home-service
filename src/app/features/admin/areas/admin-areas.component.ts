import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { AreaService } from '../../../core/services/area.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { exportToCsv } from '../../../core/utils/csv-exporter';
import { Area } from '../../../core/models/area.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';

@Component({
  selector: 'app-admin-areas',
  standalone: true,
  imports: [CommonModule, FormsModule, BnNumberPipe],
  templateUrl: './admin-areas.component.html',
  styleUrls: ['./admin-areas.component.scss']
})
export class AdminAreasComponent {
  public theme = inject(ThemeService);
  private areaService = inject(AreaService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);
  private confirmation = inject(ConfirmationService);

  public areas = this.areaService.areas;

  public showCreateModal = signal<boolean>(false);
  public newZoneName = signal<string>('');
  public newUpazila = signal<string>('সাভার');
  public newRadius = signal<number>(5);
  public newSurge = signal<number>(1.0);

  public toggleActive(area: Area): void {
    const updated = { ...area, isActive: !area.isActive };
    this.areaService.updateArea(updated);

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'admin',
      actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
      actorRole: 'admin',
      action: 'area_status_updated',
      targetId: area.id,
      targetType: 'area',
      reason: `জোন ${area.zoneName} ${updated.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হলো`
    });
  }

  public adjustSurge(area: Area): void {
    const input = prompt(`সার্জ মাল্টিপ্লায়ার সেট করুন (${area.zoneName}):`, area.surgeMultiplier.toString());
    if (input) {
      const val = parseFloat(input);
      if (!isNaN(val) && val >= 1.0 && val <= 3.0) {
        this.areaService.updateArea({ ...area, surgeMultiplier: val });

        this.auditLog.logAction({
          actorId: this.auth.currentUser()?.uid || 'admin',
          actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
          actorRole: 'admin',
          action: 'surge_multiplier_updated',
          targetId: area.id,
          targetType: 'area',
          reason: `সার্জ মাল্টিপ্লায়ার পরিবর্তন: ${area.surgeMultiplier}x -> ${val}x`
        });
      }
    }
  }

  public createArea(): void {
    if (!this.newZoneName().trim()) return;

    const id = `area_${Date.now()}`;
    const newArea: Area = {
      id,
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: this.newUpazila() || 'সাভার',
      zoneName: this.newZoneName().trim(),
      center: { lat: 23.8223, lng: 90.2673 },
      radiusKm: this.newRadius() || 5,
      isActive: true,
      surgeMultiplier: this.newSurge() || 1.0,
      adminIds: ['user_admin_savar_1']
    };

    this.areaService.addArea(newArea);

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'admin',
      actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
      actorRole: 'admin',
      action: 'area_created',
      targetId: id,
      targetType: 'area',
      reason: `নতুন জোন তৈরি: ${newArea.zoneName}`
    });

    this.newZoneName.set('');
    this.showCreateModal.set(false);
  }

  public deleteArea(id: string): void {
    this.confirmation.confirm({
      header: 'এলাকা মুছে ফেলার নিশ্চিতকরণ (Confirm Area Deletion)',
      message: 'আপনি কি নিশ্চিতভাবে এই এলাকা মুছে ফেলতে চান?\nAre you sure you want to delete this operational area?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'মুছুন / Delete',
      rejectLabel: 'বাতিল / Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.areaService.deleteArea(id);
      }
    });
  }

  public exportCsv(): void {
    const rows = this.areas().map(a => ({
      'Area ID': a.id,
      'Zone Name': a.zoneName,
      'Upazila': a.upazila,
      'District': a.district,
      'Radius (km)': a.radiusKm,
      'Surge Multiplier': a.surgeMultiplier,
      'Active': a.isActive
    }));
    exportToCsv('KajKhoj_Areas', rows);
  }
}
