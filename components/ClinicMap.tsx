'use client';

import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap, Marker as MaplibreMarker } from 'maplibre-gl';

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

type MarkerEntry = { id: number; marker: MaplibreMarker; el: HTMLDivElement };

function clinicColor(highlighted: boolean) {
  return highlighted ? '#0d9488' : '#059669';
}

export default function ClinicMap({
  clinics,
  userLocation,
  highlightIds = [],
  routeGeoJSON,
  onGetDirections,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const clinicMarkersRef = useRef<MarkerEntry[]>([]);
  const userMarkerRef = useRef<MaplibreMarker | null>(null);
  const routeReadyRef = useRef(false);

  // Initialise map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (destroyed || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: `https://mapsi.dev/v1/tiles/styles?style=light&key=${process.env.NEXT_PUBLIC_MAPSI_API_KEY}`,
        center: [-0.1278, 51.5074],
        zoom: 11,
      });
      mapRef.current = map;

      map.on('load', () => {
        if (destroyed) return;

        // Route source + layer (empty until user requests directions)
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#059669', 'line-width': 5, 'line-opacity': 0.85 },
        });
        routeReadyRef.current = true;

        // Clinic markers
        clinics
          .filter((c) => c.status === 'active')
          .forEach((clinic) => {
            const el = document.createElement('div');
            el.style.cssText = `width:14px;height:14px;background:${clinicColor(highlightIds.includes(clinic.id))};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer`;

            const directionsBtn = onGetDirections
              ? `<button onclick="window.dispatchEvent(new CustomEvent('mapsi:directions',{detail:${clinic.id}}))" style="margin-top:8px;padding:4px 10px;background:#059669;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">Get Directions</button>`
              : '';

            const popup = new maplibregl.Popup({ offset: 10 }).setHTML(
              `<div style="min-width:180px">
                <b style="color:#047857">${clinic.name}</b><br>
                <span style="font-size:12px">${clinic.address}</span><br>
                <span style="font-size:12px">${clinic.phone}</span><br>
                <span style="font-size:11px;color:#6B7280">${clinic.hours}</span>
                ${directionsBtn}
              </div>`
            );

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([clinic.lng, clinic.lat])
              .setPopup(popup)
              .addTo(map);

            clinicMarkersRef.current.push({ id: clinic.id, marker, el });
          });
      });
    })();

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      clinicMarkersRef.current = [];
      userMarkerRef.current = null;
      routeReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bubble up "Get Directions" events from popup buttons
  useEffect(() => {
    if (!onGetDirections) return;
    const handler = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      const clinic = clinics.find((c) => c.id === id);
      if (clinic) onGetDirections(clinic);
    };
    window.addEventListener('mapsi:directions', handler);
    return () => window.removeEventListener('mapsi:directions', handler);
  }, [clinics, onGetDirections]);

  // Update highlighted marker colours
  useEffect(() => {
    clinicMarkersRef.current.forEach(({ id, el }) => {
      el.style.background = clinicColor(highlightIds.includes(id));
    });
  }, [highlightIds]);

  // Show/update user location marker
  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (!userLocation) return;

      const el = document.createElement('div');
      el.style.cssText = 'width:16px;height:16px;background:#3B82F6;border:2px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,.5)';

      const map = mapRef.current;
      if (!map) return;

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation[1], userLocation[0]])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setText('Your location'))
        .addTo(map);

      map.flyTo({ center: [userLocation[1], userLocation[0]], zoom: 13, duration: 1000 });
    })();
  }, [userLocation]);

  // Draw/clear route
  useEffect(() => {
    if (!mapRef.current || !routeReadyRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source = mapRef.current.getSource('route') as any;
    if (!source) return;

    if (!routeGeoJSON) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    source.setData(routeGeoJSON);

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      const fc = routeGeoJSON as { features?: Array<{ geometry?: { coordinates?: [number, number][] } }> };
      const coords = fc.features?.[0]?.geometry?.coordinates;
      if (coords?.length) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
        );
        mapRef.current!.fitBounds(bounds, { padding: 40 });
      }
    })();
  }, [routeGeoJSON]);

  return <div ref={containerRef} className="w-full h-[500px] rounded-lg" />;
}
