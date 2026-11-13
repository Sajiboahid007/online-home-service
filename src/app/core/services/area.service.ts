import { Injectable, signal, inject } from '@angular/core';
import { Area } from '../models/area.model';
import { SeedDataService } from './seed-data.service';
import { GeoService } from './geo.service';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private seedData = inject(SeedDataService);
  private geoService = inject(GeoService);

  private areasSignal = signal<Area[]>([]);
  public areas = this.areasSignal.asReadonly();

  constructor() {
    this.loadAreas();
  }

  private loadAreas(): void {
    const saved = localStorage.getItem('kajkhoj_areas');
    if (saved) {
      try {
        this.areasSignal.set(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    this.areasSignal.set(this.seedData.defaultAreas);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem('kajkhoj_areas', JSON.stringify(this.areasSignal()));
  }

  public getAreaById(id: string): Area | undefined {
    return this.areasSignal().find(a => a.id === id);
  }

  public addArea(area: Area): void {
    this.areasSignal.update(list => [...list, area]);
    this.saveToStorage();
  }

  public updateArea(area: Area): void {
    this.areasSignal.update(list => list.map(a => a.id === area.id ? area : a));
    this.saveToStorage();
  }

  public deleteArea(id: string): void {
    this.areasSignal.update(list => list.filter(a => a.id !== id));
    this.saveToStorage();
  }

  // Check if coordinates fall inside an active operational area (Item 114)
  public isServiceAvailable(lat: number, lng: number): { available: boolean; area?: Area } {
    for (const area of this.areasSignal()) {
      if (!area.isActive) continue;
      const distance = this.geoService.getDistanceKm(lat, lng, area.center.lat, area.center.lng);
      if (distance <= area.radiusKm) {
        return { available: true, area };
      }
    }
    return { available: false };
  }
}
