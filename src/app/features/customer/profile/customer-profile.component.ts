import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerService } from '../../../core/services/worker.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { User } from '../../../core/models/user.model';
import { WorkerProfile } from '../../../core/models/worker.model';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageUploaderComponent, BnNumberPipe, TakaPipe],
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
  public photoURL = signal<string>('');
  public avatarImgError = signal<boolean>(false);

  public favoriteWorkers = computed(() => {
    const user = this.auth.currentUser();
    const guest = this.auth.getGuestFavorites();
    const favIds = user?.favoriteWorkers && user.favoriteWorkers.length > 0
      ? user.favoriteWorkers
      : (guest.length > 0 ? guest : (user?.favoriteWorkers || []));
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
  public newAddressLabel = signal<string>('বাসা');
  public newAddressText = signal<string>('');

  public successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.name.set(user.name || '');
      this.phone.set(user.phone || '');
      this.email.set(user.email || '');
      this.photoURL.set(user.photoURL || '');

      if (user.emergencyContact) {
        this.emergencyName.set(user.emergencyContact.name);
        this.emergencyPhone.set(user.emergencyContact.phone);
        this.emergencyRelation.set(user.emergencyContact.relation);
      }

      const defaultAddrs = [
        { id: 'addr_1', label: 'বাসা', address: 'বাসা ১২, রোড ৩, সাভার নিউ মার্কেট এরিয়া', lat: 23.8230, lng: 90.2660 },
        { id: 'addr_2', label: 'অফিস', address: 'সাভার বাসস্ট্যান্ড সেন্ট্রাল প্লাজা', lat: 23.8245, lng: 90.2689 }
      ];
      this.savedAddresses.set(user.savedAddresses || defaultAddrs);
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

  public removeFavorite(workerId: string): void {
    const isBn = this.theme.currentLang() === 'bn';
    this.confirmation.confirm({
      header: isBn ? 'প্রিয় তালিকা থেকে অপসারণ' : 'Remove Favorite',
      message: isBn
        ? 'আপনি কি নিশ্চিত যে এই কারিগরকে আপনার প্রিয় তালিকা থেকে অপসারণ করতে চান?'
        : 'Are you sure you want to remove this worker from your favorites list?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: isBn ? 'অপসারণ' : 'Remove',
      rejectLabel: isBn ? 'বাতিল' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        const success = this.auth.removeFavoriteWorker(workerId);
        if (success) {
          this.notification.notify(
            isBn ? 'প্রিয় তালিকা থেকে সফলভাবে সরানো হয়েছে' : 'Removed from favorites successfully',
            'info',
            isBn ? 'প্রিয় কারিগর' : 'Favorite Worker'
          );
        }
      }
    });
  }

  public viewWorker(workerId: string): void {
    this.router.navigate(['/customer/worker-profile', workerId]);
  }

  public saveProfile(): void {
    const currentUser = this.auth.currentUser();
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      name: this.name(),
      phone: this.phone(),
      email: this.email(),
      photoURL: this.photoURL(),
      emergencyContact: {
        name: this.emergencyName(),
        phone: this.emergencyPhone(),
        relation: this.emergencyRelation()
      },
      savedAddresses: this.savedAddresses()
    };

    this.auth.setUser(updatedUser);
    this.successMessage.set('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
