import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { User } from '../../../core/models/user.model';
import { WorkerProfile } from '../../../core/models/worker.model';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BnNumberPipe, TakaPipe],
  templateUrl: './customer-profile.component.html',
  styleUrls: ['./customer-profile.component.scss']
})
export class CustomerProfileComponent implements OnInit {
  public theme = inject(ThemeService);
  private auth = inject(AuthService);
  private workerService = inject(WorkerService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private confirmation = inject(ConfirmationService);

  public name = signal<string>('');
  public phone = signal<string>('');
  public email = signal<string>('');

  public favoriteWorkers = computed(() => {
    const user = this.auth.currentUser();
    const favIds = user ? (user.favoriteWorkers || []) : this.auth.getGuestFavorites();
    return this.workerService.workers().filter(w => favIds.includes(w.uid));
  });

  public userInitials = computed(() => {
    const n = this.name();
    if (!n) return '👤';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  });

  public emergencyName = signal<string>('');
  public emergencyPhone = signal<string>('');
  public emergencyRelation = signal<string>('স্ত্রী / স্বামী');

  public savedAddresses = signal<{ id: string; label: string; address: string; lat: number; lng: number }[]>([]);
  public showAddAddress = signal<boolean>(false);
  public workerToDelete = signal<WorkerProfile | null>(null);
  public newAddressLabel = signal<string>('বাসা');
  public newAddressText = signal<string>('');

  public successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.name.set(user.name || '');
      this.phone.set(user.phone || '');
      this.email.set(user.email || '');

      if (user.emergencyContact) {
        this.emergencyName.set(user.emergencyContact.name);
        this.emergencyPhone.set(user.emergencyContact.phone);
        this.emergencyRelation.set(user.emergencyContact.relation);
      }

      this.savedAddresses.set(Array.isArray(user.savedAddresses) ? [...user.savedAddresses] : []);
    }
  }

  public addAddress(): void {
    if (!this.newAddressText().trim()) return;
    const newAddr = {
      id: `addr_${Date.now()}`,
      label: this.newAddressLabel() || 'অন্যান্য',
      address: this.newAddressText().trim(),
      lat: 23.8223,
      lng: 90.2673
    };
    this.savedAddresses.update(list => [...list, newAddr]);
    this.newAddressText.set('');
    this.showAddAddress.set(false);
  }

  public deleteAddress(id: string): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'ঠিকানা মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Delete Address',
      message: isBn
        ? 'আপনি কি নিশ্চিত যে এই সংরক্ষিত ঠিকানাটি মুছে ফেলতে চান?'
        : 'Are you sure you want to delete this saved address?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'মুছুন' : 'Delete',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.savedAddresses.update(list => list.filter(a => a.id !== id));
      }
    });
  }

  public promptRemoveFavorite(worker: WorkerProfile): void {
    this.workerToDelete.set(worker);
  }

  public cancelDeleteFavorite(): void {
    this.workerToDelete.set(null);
  }

  public async confirmDeleteFavorite(): Promise<void> {
    const worker = this.workerToDelete();
    if (!worker) return;
    const isBn = this.theme.currentLang() === 'bn';
    const success = await this.auth.removeFavoriteWorker(worker.uid);
    if (success) {
      this.notification.notify(
        isBn ? 'প্রিয় তালিকা থেকে সফলভাবে সরানো হয়েছে' : 'Removed from favorites successfully',
        'info',
        isBn ? 'প্রিয় কারিগর' : 'Favorite Worker'
      );
    }
    this.workerToDelete.set(null);
  }

  public removeFavorite(workerId: string): void {
    const worker = this.workerService.getWorkerById(workerId);
    if (worker) {
      this.promptRemoveFavorite(worker);
    } else {
      this.auth.removeFavoriteWorker(workerId);
    }
  }

  public getWorkerInitials(name?: string): string {
    if (!name) return '🔧';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  public onWorkerAvatarImgError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
      const parent = target.parentElement;
      if (parent && !parent.querySelector('.pf-avatar-initials')) {
        const fallback = document.createElement('div');
        fallback.className = 'pf-avatar pf-avatar-initials';
        fallback.innerText = '🔧';
        parent.insertBefore(fallback, target);
      }
    }
  }

  public viewWorker(workerId: string): void {
    this.router.navigate(['/customer/worker-profile', workerId]);
  }

  public saveProfile(): void {
    const currentUser = this.auth.currentUser();
    if (!currentUser) return;

    const trimmedEmergencyName = this.emergencyName().trim();
    const trimmedEmergencyPhone = this.emergencyPhone().trim();
    const hasEmergencyContact = !!(trimmedEmergencyName || trimmedEmergencyPhone);

    const updatedUser: User = {
      ...currentUser,
      name: this.name().trim() || currentUser.name,
      phone: this.phone().trim(),
      email: this.email().trim() || undefined,
      emergencyContact: hasEmergencyContact
        ? {
            name: trimmedEmergencyName,
            phone: trimmedEmergencyPhone,
            relation: this.emergencyRelation()
          }
        : undefined,
      savedAddresses: this.savedAddresses()
    };

    // Strip only base64 data URI images so database/storage remains clean while keeping external SSO avatars
    if (updatedUser.photoURL?.startsWith('data:image')) {
      delete updatedUser.photoURL;
    }

    this.auth.setUser(updatedUser);
    void this.auth.syncGoogleUserToFirestore(updatedUser);
    this.successMessage.set('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
