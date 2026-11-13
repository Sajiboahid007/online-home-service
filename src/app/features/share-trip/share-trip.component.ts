import { Component, inject, signal, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { JobService } from '../../core/services/job.service';
import { MapService } from '../../core/services/map.service';
import { Job } from '../../core/models/job.model';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { BnNumberPipe } from '../../shared/pipes/bn-number.pipe';
import { Map as MapLibreMap } from 'maplibre-gl';

@Component({
  selector: 'app-share-trip',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, BnNumberPipe],
  templateUrl: './share-trip.component.html',
  styleUrls: ['./share-trip.component.scss']
})
export class ShareTripComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private jobService = inject(JobService);
  private mapService = inject(MapService);

  public job = signal<Job | null>(null);
  public etaMinutes = signal<number>(12);
  private map: MapLibreMap | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId') || 'job_demo_102';
    const found = this.jobService.getJobById(id);
    if (found) {
      this.job.set(found);
    }
  }

  ngAfterViewInit(): void {
    const j = this.job();
    if (!j || !this.mapContainer) return;

    setTimeout(() => {
      this.map = this.mapService.createMap(
        this.mapContainer.nativeElement,
        { lat: j.location.lat, lng: j.location.lng },
        14
      );

      // Customer pin
      this.mapService.createUserMarker(j.location.lat, j.location.lng, this.map);

      // Worker live position
      const workerLoc = { lat: j.location.lat + 0.008, lng: j.location.lng - 0.006 };
      this.mapService.drawRouteLine(this.map, workerLoc, j.location).then(res => {
        this.etaMinutes.set(res.durationMin || 10);
      });
    }, 100);
  }
}
