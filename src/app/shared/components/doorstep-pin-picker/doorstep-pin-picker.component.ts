import {
  AfterViewInit, Component, ElementRef, OnDestroy, ViewChild,
  inject, input, output, signal
} from '@angular/core';
import { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { GeoPoint } from '../../../core/models/worker.model';
import { MapService } from '../../../core/services/map.service';
import { LocationService } from '../../../core/services/location.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

/** What the customer confirmed: exact pin + directions for the technician. */
export interface DoorstepPin {
  location: GeoPoint;
  /** True once the customer moved the pin, tapped the map, or used GPS. */
  pinned: boolean;
  landmark: string;
  doorPhotoURL?: string;
}

const PHOTO_MAX_SIDE_PX = 800;
const PHOTO_JPEG_QUALITY = 0.7;
const LANDMARK_MAX_LENGTH = 120;

/**
 * Lets the customer drag a pin onto their exact gate/building, add a landmark note
 * and an optional gate photo. Emits the result on every change via `pinChange`.
 */
@Component({
  selector: 'app-doorstep-pin-picker',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './doorstep-pin-picker.component.html',
  styleUrl: './doorstep-pin-picker.component.scss'
})
export class DoorstepPinPickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  /** Where the pin starts (usually the customer's current location). */
  public initial = input.required<GeoPoint>();
  public pinChange = output<DoorstepPin>();

  private mapService = inject(MapService);
  private locationService = inject(LocationService);

  public readonly landmarkMaxLength = LANDMARK_MAX_LENGTH;
  public location = signal<GeoPoint>({ lat: 0, lng: 0 });
  public pinned = signal(false);
  public landmark = signal('');
  public doorPhotoURL = signal<string | undefined>(undefined);
  public isLocating = signal(false);
  public isResolvingAddress = signal(false);
  public photoError = signal<string | null>(null);

  private map?: MapLibreMap;
  private marker?: Marker;
  private geocodeTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    const start = this.initial();
    this.location.set({ ...start });

    this.map = this.mapService.createMap(this.mapEl.nativeElement, start, 17);
    this.marker = new Marker({ draggable: true, color: '#dc2626' })
      .setLngLat([start.lng, start.lat])
      .addTo(this.map);

    this.marker.on('dragend', () => {
      const { lng, lat } = this.marker!.getLngLat();
      this.movePin(lat, lng);
    });

    // Tapping the map is easier than dragging on small phones
    this.map.on('click', (e) => this.movePin(e.lngLat.lat, e.lngLat.lng));

    // Map is created inside an animating modal; re-measure once it has settled
    this.map.on('load', () => this.map?.resize());

    this.emit();
  }

  ngOnDestroy(): void {
    clearTimeout(this.geocodeTimer);
    this.marker?.remove();
    this.map?.remove();
  }

  public async useMyGps(): Promise<void> {
    this.isLocating.set(true);
    try {
      const loc = await this.locationService.detectCurrentPosition();
      this.map?.flyTo({ center: [loc.lng, loc.lat], zoom: 17 });
      this.movePin(loc.lat, loc.lng, loc.address);
    } finally {
      this.isLocating.set(false);
    }
  }

  public onLandmarkInput(value: string): void {
    this.landmark.set(value.slice(0, LANDMARK_MAX_LENGTH));
    this.emit();
  }

  public async onPhotoSelected(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = ''; // allow re-selecting the same file
    if (!file) return;

    this.photoError.set(null);
    if (!file.type.startsWith('image/')) {
      this.photoError.set('শুধুমাত্র ছবি ফাইল যোগ করা যাবে।');
      return;
    }
    try {
      this.doorPhotoURL.set(await this.shrinkPhoto(file));
      this.emit();
    } catch {
      this.photoError.set('ছবিটি পড়া যায়নি, আবার চেষ্টা করুন।');
    }
  }

  public removePhoto(): void {
    this.doorPhotoURL.set(undefined);
    this.emit();
  }

  private movePin(lat: number, lng: number, knownAddress?: string): void {
    this.marker?.setLngLat([lng, lat]);
    this.pinned.set(true);
    this.location.set({ lat, lng, address: knownAddress ?? this.location().address });
    this.emit();
    if (!knownAddress) {
      this.scheduleReverseGeocode(lat, lng);
    }
  }

  /** Debounced so repeated drags don't hammer the free geocoder (1 req/s limit). */
  private scheduleReverseGeocode(lat: number, lng: number): void {
    clearTimeout(this.geocodeTimer);
    this.geocodeTimer = setTimeout(async () => {
      this.isResolvingAddress.set(true);
      try {
        const address = await this.locationService.reverseGeocode(lat, lng);
        const current = this.location();
        // Ignore if the pin moved again while we were waiting
        if (address && current.lat === lat && current.lng === lng) {
          this.location.set({ ...current, address });
          this.emit();
        }
      } finally {
        this.isResolvingAddress.set(false);
      }
    }, 800);
  }

  /** Downscale to a small JPEG so the job stays light (jobs are stored locally and synced). */
  private shrinkPhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, PHOTO_MAX_SIDE_PX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    });
  }

  private emit(): void {
    this.pinChange.emit({
      location: this.location(),
      pinned: this.pinned(),
      landmark: this.landmark().trim(),
      doorPhotoURL: this.doorPhotoURL()
    });
  }
}
