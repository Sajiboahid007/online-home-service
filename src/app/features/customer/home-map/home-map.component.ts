import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MapService } from '../../../core/services/map.service';
import { LocationService } from '../../../core/services/location.service';
import { WorkerService } from '../../../core/services/worker.service';
import { CategoryService } from '../../../core/services/category.service';
import { JobService } from '../../../core/services/job.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerProfile } from '../../../core/models/worker.model';
import { Category } from '../../../core/models/category.model';
import { Job, PaymentMethod } from '../../../core/models/job.model';
import { BnNumberPipe } from '../../../shared/pipes/bn-number.pipe';
import { TakaPipe } from '../../../shared/pipes/taka.pipe';
import { MaskPhonePipe } from '../../../shared/pipes/mask-phone.pipe';
import { Map as MapLibreMap, Marker } from 'maplibre-gl';

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BnNumberPipe, TakaPipe, MaskPhonePipe],
  templateUrl: './home-map.component.html',
  styleUrl: './home-map.component.scss'
})
export class HomeMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  private mapService = inject(MapService);
  private locationService = inject(LocationService);
  private workerService = inject(WorkerService);
  private categoryService = inject(CategoryService);
  private jobService = inject(JobService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  public categories = this.categoryService.categories;
  public selectedCategoryId = signal<string>('all');
  public userLocation = this.locationService.userLocation;
  public currentUser = this.authService.currentUser;
  public onlyTrustedOrFemale = signal<boolean>(false);
  public searchQuery = signal<string>('');
  public searchResults = signal<{ address: string; lat: number; lng: number }[]>([]);

  // Modals & Panels
  public selectedWorker = signal<WorkerProfile | null>(null);
  public showInstantBookingModal = signal<boolean>(false);
  public isSheetExpanded = signal<boolean>(false);

  // Instant & Scheduled booking form state
  public bookingMode = signal<'instant' | 'scheduled' | 'bulk_labor'>('instant');
  public bookingCategory = signal<string>('plumber');
  public bookingDescription = signal<string>('বাসায় জরুরি প্লাম্বিং সার্ভিস প্রয়োজন');
  public bookingPaymentMethod = signal<PaymentMethod>('cash');
  public scheduledDate = signal<string>('আগামীকাল');
  public scheduledTimeSlot = signal<string>('সকাল ৯:০০ - দুপুর ১২:০০');
  public bulkLaborCount = signal<number>(3);
  public isSubmittingJob = signal<boolean>(false);

  // MapLibre references
  private map?: MapLibreMap;
  private workerMarkers: Marker[] = [];
  private userMarker?: Marker;

  // Nearby workers based on selected category & location
  public nearbyWorkers = computed(() => {
    const loc = this.userLocation();
    const catId = this.selectedCategoryId() === 'all' ? undefined : this.selectedCategoryId();
    let workers = this.workerService.getNearbyWorkers(loc.lat, loc.lng, catId);
    if (this.onlyTrustedOrFemale()) {
      workers = workers.filter(w => w.trustedBadge || w.verified);
    }
    return workers;
  });

  public toggleTrustedFilter(): void {
    this.onlyTrustedOrFemale.update(v => !v);
    this.renderWorkerMarkers();
  }

  public async onSearchInput(query: string): Promise<void> {
    this.searchQuery.set(query);
    if (query.trim().length >= 2) {
      const results = await this.locationService.searchAddress(query);
      this.searchResults.set(results);
    } else {
      this.searchResults.set([]);
    }
  }

  public selectSearchResult(item: { address: string; lat: number; lng: number }): void {
    this.locationService.setUserLocation({
      lat: item.lat,
      lng: item.lng,
      address: item.address
    });
    this.searchResults.set([]);
    this.searchQuery.set(item.address);

    if (this.map) {
      this.map.flyTo({ center: [item.lng, item.lat], zoom: 14 });
      if (this.userMarker) {
        this.userMarker.setLngLat([item.lng, item.lat]);
      }
      this.mapService.drawRadiusCircle(this.map, { lat: item.lat, lng: item.lng }, 3);
      this.renderWorkerMarkers();
    }
  }

  public onlineWorkersCount = computed(() => {
    return this.nearbyWorkers().filter(w => w.isOnline && !w.isBusy).length;
  });

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;

    const loc = this.userLocation();
    this.map = this.mapService.createMap(
      this.mapContainer.nativeElement,
      { lat: loc.lat, lng: loc.lng },
      14
    );

    this.map.on('load', () => {
      this.userMarker = this.mapService.createUserMarker(loc.lat, loc.lng, this.map!);
      this.mapService.drawRadiusCircle(this.map!, { lat: loc.lat, lng: loc.lng }, 3);
      this.renderWorkerMarkers();
    });
  }

  public selectCategory(catId: string): void {
    this.selectedCategoryId.set(catId);
    this.bookingCategory.set(catId === 'all' ? 'plumber' : catId);
    this.renderWorkerMarkers();
  }

  private renderWorkerMarkers(): void {
    if (!this.map) return;

    // Clear existing worker markers
    this.clearMarkers();

    const workers = this.nearbyWorkers();
    for (const worker of workers) {
      const marker = this.mapService.createWorkerMarker(worker, this.map, (w) => {
        this.openWorkerProfile(w);
      });
      this.workerMarkers.push(marker);
    }
  }

  private clearMarkers(): void {
    for (const marker of this.workerMarkers) {
      marker.remove();
    }
    this.workerMarkers = [];
  }

  public openWorkerProfile(worker: WorkerProfile): void {
    this.selectedWorker.set(worker);
  }

  public closeWorkerProfile(): void {
    this.selectedWorker.set(null);
  }

  public toggleSheet(): void {
    this.isSheetExpanded.update(v => !v);
  }

  public openInstantBooking(): void {
    const activeCat = this.selectedCategoryId() === 'all' ? 'plumber' : this.selectedCategoryId();
    this.bookingCategory.set(activeCat);
    this.showInstantBookingModal.set(true);
  }

  public closeInstantBooking(): void {
    this.showInstantBookingModal.set(false);
  }

  public flyToWorker(worker: WorkerProfile): void {
    if (!this.map) return;
    this.map.flyTo({
      center: [worker.homeLocation.lng, worker.homeLocation.lat],
      zoom: 15,
      essential: true
    });
    this.openWorkerProfile(worker);
  }

  public recenterToUser(): void {
    if (!this.map) return;
    const loc = this.userLocation();
    this.map.flyTo({
      center: [loc.lng, loc.lat],
      zoom: 14,
      essential: true
    });
  }

  public startDirectBooking(worker: WorkerProfile): void {
    const user = this.currentUser();
    const loc = this.userLocation();
    const cat = this.categoryService.getCategoryById(worker.categoryIds[0]) || { nameBn: 'সার্ভিস' };

    this.isSubmittingJob.set(true);

    const newJob = this.jobService.createJob({
      customerId: user?.uid || 'user_customer_demo_1',
      customerName: user?.name || 'তানভীর আহমেদ',
      customerPhone: user?.phone || '01712345678',
      workerId: worker.uid,
      workerName: worker.name,
      workerPhone: worker.phone,
      workerPhoto: worker.photoURL,
      categoryId: worker.categoryIds[0],
      categoryName: cat.nameBn,
      areaId: worker.areaId || 'savar_bazar',
      type: 'direct',
      status: 'accepted',
      description: `সরাসরি বুকিং: ${worker.name}-এর নিকট সেবা চাওয়া হয়েছে`,
      estimatedPrice: worker.rate,
      location: loc,
      paymentMethod: 'cash'
    });

    this.closeWorkerProfile();
    this.isSubmittingJob.set(false);
    this.router.navigate(['/customer/tracking', newJob.id]);
  }

  public isFavorite(workerId: string): boolean {
    return this.authService.isFavoriteWorker(workerId);
  }

  public toggleFavorite(worker: WorkerProfile): void {
    this.authService.toggleFavoriteWorker(worker.uid);
  }

  public setBookingMode(mode: 'instant' | 'scheduled' | 'bulk_labor'): void {
    this.bookingMode.set(mode);
    if (mode === 'bulk_labor') {
      this.bookingCategory.set('day_laborer');
      this.bookingDescription.set(`বাসা বদল ও মালামাল বহনের জন্য ${this.bulkLaborCount()} জন দিনমজুর শ্রমিক প্রয়োজন`);
    } else if (mode === 'scheduled') {
      this.bookingDescription.set(`পূর্বনির্ধারিত সেবা: ${this.scheduledDate()} (${this.scheduledTimeSlot()})`);
    }
  }

  public changeLaborCount(delta: number): void {
    const updated = Math.min(10, Math.max(2, this.bulkLaborCount() + delta));
    this.bulkLaborCount.set(updated);
    this.bookingDescription.set(`বাসা বদল ও মালামাল বহনের জন্য ${updated} জন দিনমজুর শ্রমিক প্রয়োজন`);
  }

  public submitInstantBooking(): void {
    const user = this.currentUser();
    const loc = this.userLocation();
    const catId = this.bookingCategory();
    const cat = this.categoryService.getCategoryById(catId) || { nameBn: 'সার্ভিস' };
    const mode = this.bookingMode();

    this.isSubmittingJob.set(true);

    // Pick top available worker in category for simulated quick instant dispatch
    const candidateWorker = this.nearbyWorkers().find(w => 
      w.isOnline && !w.isBusy && w.categoryIds.includes(catId)
    );

    let estPrice = candidateWorker?.rate || 350;
    if (mode === 'bulk_labor') {
      estPrice = (candidateWorker?.rate || 700) * this.bulkLaborCount();
    }

    const scheduledTimestamp = mode === 'scheduled' 
      ? new Date(Date.now() + 86400000).toISOString()
      : undefined;

    const newJob = this.jobService.createJob({
      customerId: user?.uid || 'user_customer_demo_1',
      customerName: user?.name || 'তানভীর আহমেদ',
      customerPhone: user?.phone || '01712345678',
      workerId: (mode === 'instant' && candidateWorker) ? candidateWorker.uid : null,
      workerName: (mode === 'instant' && candidateWorker) ? candidateWorker.name : undefined,
      workerPhone: (mode === 'instant' && candidateWorker) ? candidateWorker.phone : undefined,
      workerPhoto: (mode === 'instant' && candidateWorker) ? candidateWorker.photoURL : undefined,
      categoryId: catId,
      categoryName: cat.nameBn,
      areaId: candidateWorker?.areaId || 'savar_bazar',
      type: mode === 'scheduled' ? 'scheduled' : mode === 'bulk_labor' ? 'board_fixed' : 'instant',
      status: (mode === 'instant' && candidateWorker) ? 'accepted' : 'searching',
      description: this.bookingDescription(),
      scheduledAt: scheduledTimestamp,
      estimatedPrice: estPrice,
      location: loc,
      paymentMethod: this.bookingPaymentMethod()
    });

    this.showInstantBookingModal.set(false);
    this.isSubmittingJob.set(false);
    this.router.navigate(['/customer/tracking', newJob.id]);
  }
}
