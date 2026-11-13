import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  templateUrl: './customer-profile.component.html',
  styleUrls: ['./customer-profile.component.scss']
})
export class CustomerProfileComponent implements OnInit {
  private auth = inject(AuthService);

  public name = signal<string>('');
  public phone = signal<string>('');
  public email = signal<string>('');
  public photoURL = signal<string>('');

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
    this.savedAddresses.update(list => list.filter(a => a.id !== id));
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
