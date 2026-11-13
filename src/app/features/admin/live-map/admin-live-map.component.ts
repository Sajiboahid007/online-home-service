import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService } from '../../../core/services/map.service';
import { WorkerService } from '../../../core/services/worker.service';
import { Map as MapLibreMap } from 'maplibre-gl';

@Component({
  selector: 'app-admin-live-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-live-map.component.html',
  styleUrl: './admin-live-map.component.scss'
})
export class AdminLiveMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  private map?: MapLibreMap;

  private mapService = inject(MapService);
  private workerService = inject(WorkerService);

  public workers = this.workerService.workers;

  public onlineCount = computed(() => this.workers().filter(w => w.isOnline && !w.isBusy).length);
  public busyCount = computed(() => this.workers().filter(w => w.isOnline && w.isBusy).length);
  public offlineCount = computed(() => this.workers().filter(w => !w.isOnline).length);

  constructor() {}

  ngAfterViewInit(): void {
    this.map = this.mapService.createMap(this.mapContainer.nativeElement);

    this.map.on('load', () => {
      // Add worker markers
      for (const worker of this.workers()) {
        this.mapService.createWorkerMarker(worker, this.map!);
      }
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
