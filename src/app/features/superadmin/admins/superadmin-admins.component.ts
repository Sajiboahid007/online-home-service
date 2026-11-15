import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { User, UserStatus } from '../../../core/models/user.model';

@Component({
  selector: 'app-superadmin-admins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-admins.component.html',
  styleUrls: ['./superadmin-admins.component.scss']
})
export class SuperadminAdminsComponent implements OnInit {
  public theme = inject(ThemeService);
  private seedData = inject(SeedDataService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  private defaultAdmins: User[] = [
    {
      uid: 'user_admin_savar_1',
      role: 'admin',
      name: 'সাভার জোন এডমিন (Savar Zone Admin)',
      phone: '01700000002',
      email: 'admin.savar@kajkhoj.com',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
      status: 'active',
      areaId: 'savar_bazar',
      createdAt: '2026-01-05T00:00:00Z'
    },
    {
      uid: 'user_admin_mirpur_2',
      role: 'admin',
      name: 'মিরপুর জোন এডমিন (Mirpur Zone Admin)',
      phone: '01700000003',
      email: 'admin.mirpur@kajkhoj.com',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      status: 'active',
      areaId: 'dhaka_mirpur',
      createdAt: '2026-02-10T00:00:00Z'
    }
  ];

  public admins = signal<User[]>([]);

  public showModal = signal<boolean>(false);
  public isEditing = signal<boolean>(false);
  public editingAdminUid = signal<string | null>(null);

  // Form fields
  public formName = '';
  public formPhone = '';
  public formEmail = '';
  public formAreaId = 'savar_bazar';
  public formStatus: UserStatus = 'active';

  ngOnInit(): void {
    this.loadAdmins();
  }

  private loadAdmins(): void {
    try {
      const saved = localStorage.getItem('kajkhoj_admins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.admins.set(parsed);
          return;
        }
      }
    } catch {}
    this.admins.set(this.defaultAdmins);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('kajkhoj_admins', JSON.stringify(this.admins()));
    } catch {}
  }

  public openCreateModal(): void {
    this.isEditing.set(false);
    this.editingAdminUid.set(null);
    this.formName = '';
    this.formPhone = '';
    this.formEmail = '';
    this.formAreaId = 'savar_bazar';
    this.formStatus = 'active';
    this.showModal.set(true);
  }

  public openEditModal(admin: User): void {
    this.isEditing.set(true);
    this.editingAdminUid.set(admin.uid);
    this.formName = admin.name || '';
    this.formPhone = admin.phone || '';
    this.formEmail = admin.email || '';
    this.formAreaId = admin.areaId || 'savar_bazar';
    this.formStatus = admin.status || 'active';
    this.showModal.set(true);
  }

  public closeModal(): void {
    this.showModal.set(false);
  }

  public saveAdmin(): void {
    if (!this.formName.trim() || !this.formPhone.trim()) {
      alert('অনুগ্রহ করে এডমিনের নাম ও ফোন নম্বর পূরণ করুন (Please enter name and phone number)');
      return;
    }

    if (this.isEditing()) {
      const uid = this.editingAdminUid();
      if (!uid) return;

      this.admins.update(list => list.map(a => {
        if (a.uid === uid) {
          return {
            ...a,
            name: this.formName.trim(),
            phone: this.formPhone.trim(),
            email: this.formEmail.trim(),
            areaId: this.formAreaId,
            status: this.formStatus
          };
        }
        return a;
      }));

      this.saveToStorage();

      this.auditLog.logAction({
        actorId: this.auth.currentUser()?.uid || 'superadmin',
        actorName: 'সুপার এডমিন (SuperAdmin)',
        actorRole: 'superadmin',
        action: 'admin_updated',
        targetId: uid,
        targetType: 'user',
        reason: `এডমিন তথ্য আপডেট: ${this.formName.trim()} (${this.formAreaId})`
      });

      this.toast.success(
        `এডমিন "${this.formName.trim()}" সফলভাবে আপডেট করা হয়েছে / Admin updated successfully`,
        'আপডেট সম্পন্ন (Updated)'
      );
    } else {
      const newAdmin: User = {
        uid: `admin_${Date.now()}`,
        role: 'admin',
        name: this.formName.trim(),
        phone: this.formPhone.trim(),
        email: this.formEmail.trim(),
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        status: this.formStatus,
        areaId: this.formAreaId,
        createdAt: new Date().toISOString()
      };

      this.admins.update(list => [newAdmin, ...list]);
      this.saveToStorage();

      this.auditLog.logAction({
        actorId: this.auth.currentUser()?.uid || 'superadmin',
        actorName: 'সুপার এডমিন (SuperAdmin)',
        actorRole: 'superadmin',
        action: 'admin_created',
        targetId: newAdmin.uid,
        targetType: 'user',
        reason: `নতুন জোন এডমিন নিয়োগ: ${newAdmin.name} (${newAdmin.areaId})`
      });

      this.toast.success(
        `নতুন এডমিন "${newAdmin.name}" সফলভাবে তৈরি হয়েছে / Admin created successfully`,
        'তৈরি সম্পন্ন (Created)'
      );
    }

    this.closeModal();
  }

  public toggleAdminStatus(admin: User): void {
    const updatedStatus: UserStatus = admin.status === 'active' ? 'suspended' : 'active';
    this.admins.update(list => list.map(a => a.uid === admin.uid ? { ...a, status: updatedStatus } : a));
    this.saveToStorage();

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'superadmin',
      actorName: 'সুপার এডমিন (SuperAdmin)',
      actorRole: 'superadmin',
      action: 'admin_status_changed',
      targetId: admin.uid,
      targetType: 'user',
      reason: `এডমিন ${admin.name} ${updatedStatus === 'active' ? 'পুনরায় সক্রিয়' : 'নিষ্ক্রিয়'} করা হলো`
    });

    this.toast.info(
      `এডমিন "${admin.name}" এখন ${updatedStatus === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Suspended)'}`,
      'স্ট্যাটাস পরিবর্তন (Status Changed)'
    );
  }

  public deleteAdmin(admin: User): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'এডমিন মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Admin Deletion',
      message: isBn
        ? `আপনি কি নিশ্চিতভাবে এডমিন "${admin.name}" (${admin.phone}) অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান?`
        : `Are you sure you want to permanently delete admin account "${admin.name}" (${admin.phone})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'মুছুন' : 'Delete',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.admins.update(list => list.filter(a => a.uid !== admin.uid));
        this.saveToStorage();

        this.auditLog.logAction({
          actorId: this.auth.currentUser()?.uid || 'superadmin',
          actorName: isBn ? 'সুপার এডমিন' : 'SuperAdmin',
          actorRole: 'superadmin',
          action: 'admin_deleted',
          targetId: admin.uid,
          targetType: 'user',
          reason: `Admin deleted: ${admin.name} (${admin.email || admin.phone})`
        });

        this.toast.warn(
          isBn ? `এডমিন "${admin.name}" সফলভাবে মুছে ফেলা হয়েছে` : `Admin "${admin.name}" deleted successfully`,
          isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted'
        );
      }
    });
  }

  public getAdminDisplayName(admin: User): string {
    if (!admin?.name) return '';
    const isEn = this.theme.currentLang() === 'en';
    const match = admin.name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return isEn ? match[2].trim() : match[1].trim();
    }
    return admin.name;
  }

  public getAdminZoneName(admin: User): string {
    const isEn = this.theme.currentLang() === 'en';
    switch (admin.areaId) {
      case 'savar_bazar':
        return isEn ? 'Savar Bazar' : 'সাভার বাজার';
      case 'dhaka_mirpur':
        return isEn ? 'Mirpur Dhaka' : 'মিরপুর ঢাকা';
      case 'ashulia_epz':
        return isEn ? 'Ashulia EPZ' : 'আশুলিয়া';
      case 'hemayetpur':
        return isEn ? 'Hemayetpur' : 'হেমায়েতপুর';
      default:
        return admin.areaId || (isEn ? 'Savar Bazar' : 'সাভার বাজার');
    }
  }

  public getAdminStatusLabel(admin: User): string {
    const isEn = this.theme.currentLang() === 'en';
    if (admin.status === 'active') {
      return isEn ? 'Active' : 'সক্রিয়';
    }
    return isEn ? 'Suspended' : 'স্থগিত';
  }
}
