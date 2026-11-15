import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { AreaService } from '../../../core/services/area.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
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
  private toast = inject(ToastService);

  public areas = this.areaService.areas;

  public showCreateModal = signal<boolean>(false);
  public newZoneName = signal<string>('');
  public newUpazila = signal<string>('সাভার');
  public newRadius = signal<number>(5);
  public newSurge = signal<number>(1.0);

  // Surge Multiplier Modal
  public showSurgeModal = signal<boolean>(false);
  public selectedSurgeArea = signal<Area | null>(null);
  public surgeValue = signal<number>(1.0);

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

    const isBn = this.theme.currentLang() === 'bn';
    this.toast.info(
      isBn 
        ? `জোন "${area.zoneName}" ${updated.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে।` 
        : `Zone "${area.zoneName}" is now ${updated.isActive ? 'active' : 'inactive'}.`
    );
  }

  public openSurgeModal(area: Area): void {
    this.selectedSurgeArea.set(area);
    this.surgeValue.set(area.surgeMultiplier || 1.0);
    this.showSurgeModal.set(true);
  }

  public closeSurgeModal(): void {
    this.showSurgeModal.set(false);
    this.selectedSurgeArea.set(null);
  }

  public confirmSurge(): void {
    const area = this.selectedSurgeArea();
    if (!area) return;

    const val = Number(this.surgeValue());
    if (isNaN(val) || val < 1.0 || val > 3.0) {
      this.toast.warn(this.theme.currentLang() === 'bn' ? 'সার্জ মাল্টিপ্লায়ার ১.০ থেকে ৩.০-এর মধ্যে হতে হবে।' : 'Surge multiplier must be between 1.0 and 3.0.');
      return;
    }

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

    const isBn = this.theme.currentLang() === 'bn';
    this.toast.success(
      isBn
        ? `জোন "${area.zoneName}"-এর সার্জ মাল্টিপ্লায়ার ${val}x নির্ধারণ করা হয়েছে!`
        : `Surge multiplier for "${area.zoneName}" set to ${val}x!`
    );

    this.closeSurgeModal();
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
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'এলাকা মুছুন' : 'Delete Area',
      message: isBn
        ? 'আপনি কি এই এলাকাটি মুছে ফেলতে চান?'
        : 'Are you sure you want to delete this area?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'মুছুন' : 'Delete',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
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
