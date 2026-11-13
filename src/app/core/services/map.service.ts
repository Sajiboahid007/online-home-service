import { Injectable } from '@angular/core';
import { Map as MapLibreMap, Marker, Popup, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import { WorkerProfile } from '../models/worker.model';
import { environment } from '../../../environments/environment';

try {
  setWorkerUrl('/maplibre-gl-worker.mjs');
} catch {
  setWorkerUrl('https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl-worker.mjs');
}

@Injectable({
  providedIn: 'root'
})
export class MapService {

  public createMap(container: HTMLElement, center?: { lat: number; lng: number }, zoom?: number): MapLibreMap {
    const mapCenter = center || environment.map.defaultCenter;
    const mapZoom = zoom || environment.map.defaultZoom;

    const map = new MapLibreMap({
      container,
      style: environment.map.style,
      center: [mapCenter.lng, mapCenter.lat],
      zoom: mapZoom,
      attributionControl: false
    });

    map.addControl(new NavigationControl({ showCompass: true }), 'top-right');
    return map;
  }

  // Privacy fuzzing for offline workers (~200m offset)
  public fuzzLocation(point: { lat: number; lng: number }, meters: number = 200): { lat: number; lng: number } {
    const earthRadius = 6378137;
    const dLat = (meters * (Math.random() - 0.5) * 2) / earthRadius;
    const dLng = (meters * (Math.random() - 0.5) * 2) / (earthRadius * Math.cos((Math.PI * point.lat) / 180));
    return {
      lat: point.lat + (dLat * 180) / Math.PI,
      lng: point.lng + (dLng * 180) / Math.PI
    };
  }

  public createWorkerMarker(
    worker: WorkerProfile,
    map: MapLibreMap,
    onSelectProfile?: (worker: WorkerProfile) => void
  ): Marker {
    const el = document.createElement('div');
    const statusClass = worker.isOnline ? (worker.isBusy ? 'busy' : 'online') : 'offline';
    el.className = `worker-marker ${statusClass}`;

    const catIcon = worker.categoryIds.includes('plumber') ? '🔧' :
                    worker.categoryIds.includes('electrician') ? '⚡' :
                    worker.categoryIds.includes('ac_technician') ? '❄️' :
                    worker.categoryIds.includes('cleaner') ? '🧹' : '👷';

    el.innerHTML = `
      <img src="${worker.photoURL}" alt="${worker.name}" class="avatar" />
      <span class="cat-icon-badge">${catIcon}</span>
      ${worker.verified ? '<span class="verified-badge">✓</span>' : ''}
    `;

    // Map Popup
    const popupContent = document.createElement('div');
    popupContent.className = 'worker-popup';
    popupContent.innerHTML = `
      <div class="popup-header">
        <img src="${worker.photoURL}" alt="${worker.name}" />
        <div>
          <h4>${worker.name} ${worker.verified ? '✔️' : ''}</h4>
          <span style="font-size: 12px; color: #6b7280;">⭐ ${worker.rating.toFixed(1)} (${worker.totalJobs} কাজ)</span>
        </div>
      </div>
      <div class="popup-meta">
        <span class="popup-rate">৳${worker.rate} / ${worker.rateUnit === 'job' ? 'কাজ' : worker.rateUnit === 'hour' ? 'ঘণ্টা' : 'দিন'}</span>
        <span>${worker.isOnline ? '🟢 অনলাইন ও প্রস্তুত' : worker.isBusy ? '🟠 কাজে ব্যস্ত' : '⚪ অফলাইন'}</span>
        ${worker.distanceKm !== undefined ? `<span>📍 প্রায় ${worker.distanceKm} কিমি দূরে</span>` : ''}
      </div>
      <button class="view-profile-btn" id="btn-profile-${worker.uid}">প্রোফাইল দেখুন</button>
    `;

    const profileBtn = popupContent.querySelector(`#btn-profile-${worker.uid}`);
    if (profileBtn && onSelectProfile) {
      profileBtn.addEventListener('click', () => {
        onSelectProfile(worker);
      });
    }

    const popup = new Popup({ offset: 30, closeButton: true })
      .setDOMContent(popupContent);

    // Apply location fuzzing if worker is offline (Spec §4.3)
    const baseLoc = worker.homeLocation;
    const displayLoc = !worker.isOnline ? this.fuzzLocation(baseLoc, 200) : baseLoc;

    return new Marker({ element: el })
      .setLngLat([displayLoc.lng, displayLoc.lat])
      .setPopup(popup)
      .addTo(map);
  }

  public createUserMarker(lat: number, lng: number, map: MapLibreMap): Marker {
    const el = document.createElement('div');
    el.className = 'user-marker';

    return new Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map);
  }

  // Draw GeoJSON radius circle around customer (3, 5, 10 km)
  public drawRadiusCircle(map: MapLibreMap, center: { lat: number; lng: number }, radiusKm: number, sourceId: string = 'radius-circle'): void {
    const points = 64;
    const coords: [number, number][] = [];
    const distanceX = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center.lng + x, center.lat + y]);
    }
    coords.push(coords[0]);

    const geojsonData: any = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
      });

      map.addLayer({
        id: `${sourceId}-fill`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#0f766e',
          'fill-opacity': 0.12
        }
      });

      map.addLayer({
        id: `${sourceId}-line`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#0f766e',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });
    }
  }

  // Draw route polyline using OSRM
  public async drawRouteLine(
    map: MapLibreMap,
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    sourceId: string = 'route-line'
  ): Promise<{ distanceKm: number; durationMin: number }> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMin = Math.round(route.duration / 60);

        const geojsonData: any = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          }
        };

        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as any).setData(geojsonData);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: geojsonData
          });

          map.addLayer({
            id: `${sourceId}-casing`,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': 6
            }
          });

          map.addLayer({
            id: `${sourceId}-core`,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#0f766e',
              'line-width': 4
            }
          });
        }

        return { distanceKm, durationMin };
      }
    } catch (err) {
      console.warn('OSRM routing fallback to straight line:', err);
    }

    // Fallback straight line
    const fallbackCoords = [[start.lng, start.lat], [end.lng, end.lat]];
    const geojsonData: any = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: fallbackCoords }
    };
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(geojsonData);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: geojsonData });
      map.addLayer({
        id: `${sourceId}-core`,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#0f766e', 'line-width': 3, 'line-dasharray': [2, 1] }
      });
    }

    return { distanceKm: 2.5, durationMin: 12 };
  }

  // Draw Heatmap for Admin Live Operations
  public drawDemandHeatmap(
    map: MapLibreMap,
    points: { lat: number; lng: number; weight?: number }[],
    sourceId: string = 'demand-heatmap'
  ): void {
    const features = points.map(p => ({
      type: 'Feature',
      properties: { weight: p.weight || 1 },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
    }));

    const geojsonData: any = {
      type: 'FeatureCollection',
      features
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
      });

      map.addLayer({
        id: `${sourceId}-heat`,
        type: 'heatmap',
        source: sourceId,
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.75
        }
      });
    }
  }
}
