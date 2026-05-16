'use client';

import { useEffect, useRef } from 'react';
import type { Map, Marker, GeoJSON as LeafletGeoJSON } from 'leaflet';

export type Clinic = {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  status: string;
};

type Props = {
  clinics: Clinic[];
  userLocation?: [number, number] | null;
  highlightIds?: number[];
  routeGeoJSON?: object | null;
  onGetDirections?: (clinic: Clinic) => void;
};

// Emerald dot marker — avoids the leaflet/webpack default icon path issue
function makeClinicIcon(L: typeof import('leaflet'), highlighted: boolean) {
  const color = highlighted ? '#0d9488' : '#059669';
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function makeUserIcon(L: typeof import('leaflet')) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:#3B82F6;border:2px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

export default function ClinicMap({
  clinics,
  userLocation,
  highlightIds = [],
  routeGeoJSON,
  onGetDirections,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const clinicMarkersRef = useRef<{ id: number; marker: Marker }[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const routeLayerRef = useRef<LeafletGeoJSON | null>(null);

  // Initialise map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let destroyed = false;

    (async () => {
      const L = (await import('leaflet')).default;

      if (destroyed || !containerRef.current) return;

      const map = L.map(containerRef.current).setView([51.5074, -0.1278], 11);
      mapRef.current = map;

      L.tileLayer(
        `https://api.mapsi.dev/v1/tiles/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPSI_API_KEY}`,
        { attribution: '© <a href="https://mapsi.dev">Mapsi</a> © OpenStreetMap contributors', maxZoom: 19 }
      ).addTo(map);

      clinics
        .filter((c) => c.status === 'active')
        .forEach((clinic) => {
          const highlighted = highlightIds.includes(clinic.id);
          const marker = L.marker([clinic.lat, clinic.lng], {
            icon: makeClinicIcon(L, highlighted),
          });

          const directionsBtn = onGetDirections
            ? `<button
                onclick="window.dispatchEvent(new CustomEvent('mapsi:directions', {detail: ${clinic.id}}))"
                style="margin-top:8px;padding:4px 10px;background:#059669;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">
                Get Directions
              </button>`
            : '';

          marker
            .bindPopup(
              `<div style="min-width:180px">
                <b style="color:#047857">${clinic.name}</b><br>
                <span style="font-size:12px">${clinic.address}</span><br>
                <span style="font-size:12px">${clinic.phone}</span><br>
                <span style="font-size:11px;color:#6B7280">${clinic.hours}</span>
                ${directionsBtn}
              </div>`
            )
            .addTo(map);

          clinicMarkersRef.current.push({ id: clinic.id, marker });
        });
    })();

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      clinicMarkersRef.current = [];
      userMarkerRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bubble up "Get Directions" events from popup buttons
  useEffect(() => {
    if (!onGetDirections) return;
    const handler = (e: Event) => {
      const clinicId = (e as CustomEvent<number>).detail;
      const clinic = clinics.find((c) => c.id === clinicId);
      if (clinic) onGetDirections(clinic);
    };
    window.addEventListener('mapsi:directions', handler);
    return () => window.removeEventListener('mapsi:directions', handler);
  }, [clinics, onGetDirections]);

  // Update highlighted markers when highlightIds changes
  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = (await import('leaflet')).default;
      clinicMarkersRef.current.forEach(({ id, marker }) => {
        marker.setIcon(makeClinicIcon(L, highlightIds.includes(id)));
      });
    })();
  }, [highlightIds]);

  // Show/update user location marker
  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = (await import('leaflet')).default;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;

      if (!userLocation) return;

      userMarkerRef.current = L.marker(userLocation, { icon: makeUserIcon(L) })
        .bindPopup('Your location')
        .addTo(mapRef.current!);

      mapRef.current!.flyTo(userLocation, 13, { duration: 1 });
    })();
  }, [userLocation]);

  // Draw/clear route
  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = (await import('leaflet')).default;
      routeLayerRef.current?.remove();
      routeLayerRef.current = null;

      if (!routeGeoJSON) return;

      routeLayerRef.current = L.geoJSON(routeGeoJSON as Parameters<typeof L.geoJSON>[0], {
        style: { color: '#059669', weight: 5, opacity: 0.85 },
      }).addTo(mapRef.current!);

      const bounds = routeLayerRef.current.getBounds();
      if (bounds.isValid()) mapRef.current!.fitBounds(bounds, { padding: [40, 40] });
    })();
  }, [routeGeoJSON]);

  return <div ref={containerRef} className="w-full h-[500px] rounded-lg" />;
}
