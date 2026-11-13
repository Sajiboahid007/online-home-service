import { Injectable, signal, inject } from '@angular/core';
import { PlatformSettings } from '../models/settings.model';
import { SeedDataService } from './seed-data.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private seedData = inject(SeedDataService);
  private settingsSignal = signal<PlatformSettings>(this.seedData.defaultSettings);
  public settings = this.settingsSignal.asReadonly();

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('kajkhoj_settings');
    if (saved) {
      try {
        this.settingsSignal.set(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    this.settingsSignal.set(this.seedData.defaultSettings);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem('kajkhoj_settings', JSON.stringify(this.settingsSignal()));
  }

  public updateSettings(settings: PlatformSettings): void {
    this.settingsSignal.set(settings);
    this.saveToStorage();
  }
}
