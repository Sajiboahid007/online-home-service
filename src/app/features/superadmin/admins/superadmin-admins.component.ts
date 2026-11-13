import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-superadmin-admins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-admins.component.html',
  styleUrls: ['./superadmin-admins.component.scss']
})
export class SuperadminAdminsComponent {
  private seedData = inject(SeedDataService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);

  public admins = signal<User[]>([
    {
      uid: 'user_admin_savar_1',
      role: 'admin',
      name: 'সাভার জোন এডমিন',
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
      name: 'মিরপুর জোন এডমিন',
      phone: '01700000003',
      email: 'admin.mirpur@kajkhoj.com',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      status: 'active',
      areaId: 'dhaka_mirpur',
      createdAt: '2026-02-10T00:00:00Z'
    }
  ]);

  public showCreateModal = signal<boolean>(false);
  public newName = signal<string>('');
  public newPhone = signal<string>('');
  public newEmail = signal<string>('');
  public newAreaId = signal<string>('savar_bazar');

  public toggleAdminStatus(admin: User): void {
    const updatedStatus = admin.status === 'active' ? 'suspended' : 'active';
    this.admins.update(list => list.map(a => a.uid === admin.uid ? { ...a, status: updatedStatus } : a));

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'superadmin',
      actorName: 'সুপার এডমিন',
      actorRole: 'superadmin',
      action: 'admin_status_changed',
      targetId: admin.uid,
      targetType: 'user',
      reason: `এডমিন ${admin.name} ${updatedStatus === 'active' ? 'পুনরায় সক্রিয়' : 'নিষ্ক্রিয়'} করা হলো`
    });
  }

  public createAdmin(): void {
    if (!this.newName().trim() || !this.newPhone().trim()) return;

    const newAdmin: User = {
      uid: `admin_${Date.now()}`,
      role: 'admin',
      name: this.newName().trim(),
      phone: this.newPhone().trim(),
      email: this.newEmail().trim(),
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      status: 'active',
      areaId: this.newAreaId(),
      createdAt: new Date().toISOString()
    };

    this.admins.update(list => [newAdmin, ...list]);

    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'superadmin',
      actorName: 'সুপার এডমিন',
      actorRole: 'superadmin',
      action: 'admin_created',
      targetId: newAdmin.uid,
      targetType: 'user',
      reason: `নতুন জোন এডমিন নিয়োগ: ${newAdmin.name} (${newAdmin.areaId})`
    });

    this.newName.set('');
    this.newPhone.set('');
    this.newEmail.set('');
    this.showCreateModal.set(false);
  }
}
