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
  coverageZones?: object | null;
  showZones?: boolean;
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
  coverageZones,
  showZones = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const clinicMarkersRef = useRef<MarkerEntry[]>([]);
  const userMarkerRef = useRef<MaplibreMarker | null>(null);
  const routeReadyRef = useRef(false);
  const coverageReadyRef = useRef(false);
  const coverageZonesRef = useRef<object | null>(coverageZones ?? null);
  const showZonesRef = useRef(showZones);

  // Initialise map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (destroyed || !containerRef.current) return;

      // Fetch the Mapsi style server-side then rewrite tile URLs to our throttled proxy
      const styleRes = await fetch(`/api/tiles/styles?style=light`);
      const style = await styleRes.json();

      // Rewrite inline tile URL arrays and pre-expand TileJSON sources.
      // Pre-expanding converts sources with `url` (TileJSON) into inline `tiles` arrays
      // so MapLibre never fetches a TileJSON directly — eliminating any path for a
      // mapsi.dev URL to reach the browser before transformRequest can intercept it.
      const rewriteUrl = (u: string) =>
        u.replace(/https?:\/\/[^/]*mapsi\.dev(?:\/v\d+)?\/tiles\//, '/api/tiles/')
         .replace(/[?&]key=[^&]+/g, '');

      for (const src of Object.values(style.sources ?? {}) as Record<string, unknown>[]) {
        if (Array.isArray(src.tiles)) {
          src.tiles = (src.tiles as string[]).map(rewriteUrl);
        }
        if (typeof src.url === 'string') {
          const proxyUrl = rewriteUrl(src.url as string);
          if (proxyUrl.startsWith('/api/tiles/')) {
            try {
              const tjRes = await fetch(proxyUrl);
              if (tjRes.ok) {
                const tj = await tjRes.json() as Record<string, unknown>;
                if (Array.isArray(tj.tiles) && (tj.tiles as string[]).length > 0) {
                  src.tiles = (tj.tiles as string[]).map(rewriteUrl);
                  if (tj.minzoom !== undefined) src.minzoom = tj.minzoom;
                  if (tj.maxzoom !== undefined) src.maxzoom = tj.maxzoom;
                  if (tj.attribution !== undefined) src.attribution = tj.attribution;
                  delete src.url;
                }
              }
            } catch { /* keep url if TileJSON fetch fails */ }
          } else {
            src.url = proxyUrl;
          }
        }
      }

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: [-0.1278, 51.5074],
        zoom: 11,
        // Intercept every request MapLibre makes — tiles, TileJSON, glyphs — so nothing
        // ever reaches mapsi.dev directly from the browser (which would be CORS-blocked).
        transformRequest: (url: string) => {
          if (!url.includes('mapsi.dev')) return { url };
          const match = url.match(/https?:\/\/[^/]*mapsi\.dev(?:\/v\d+)?\/tiles\/([^?]*)/);
          if (!match) return { url };
          const tilePath = match[1].replace(/\/$/, '');
          let queryString = '';
          try {
            const params = new URL(url).searchParams;
            params.delete('key');
            queryString = params.toString();
          } catch { /* ignore malformed URLs */ }
          return { url: `/api/tiles/${tilePath}${queryString ? `?${queryString}` : ''}` };
        },
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

        // Coverage zone source + fill + outline (below route)
        map.addSource('coverage', {
          type: 'geojson',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: (coverageZonesRef.current ?? { type: 'FeatureCollection', features: [] }) as any,
        });
        map.addLayer({
          id: 'coverage-fill',
          type: 'fill',
          source: 'coverage',
          layout: { visibility: showZonesRef.current ? 'visible' : 'none' },
          paint: {
            'fill-color': ['match', ['get', 'zone'], 'central', '#22c55e', 'inner', '#eab308', '#ef4444'],
            'fill-opacity': 0.15,
          },
        }, 'route');
        map.addLayer({
          id: 'coverage-outline',
          type: 'line',
          source: 'coverage',
          layout: { visibility: showZonesRef.current ? 'visible' : 'none' },
          paint: {
            'line-color': ['match', ['get', 'zone'], 'central', '#16a34a', 'inner', '#ca8a04', '#dc2626'],
            'line-width': 2,
            'line-dasharray': [4, 2],
          },
        }, 'route');
        coverageReadyRef.current = true;

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

  // Sync latest coverageZones + showZones into refs; update map if ready
  useEffect(() => {
    coverageZonesRef.current = coverageZones ?? null;
    if (!mapRef.current || !coverageReadyRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapRef.current.getSource('coverage') as any)?.setData(
      coverageZones ?? { type: 'FeatureCollection', features: [] }
    );
  }, [coverageZones]);

  useEffect(() => {
    showZonesRef.current = showZones;
    if (!mapRef.current || !coverageReadyRef.current) return;
    const vis = showZones ? 'visible' : 'none';
    if (mapRef.current.getLayer('coverage-fill')) {
      mapRef.current.setLayoutProperty('coverage-fill', 'visibility', vis);
      mapRef.current.setLayoutProperty('coverage-outline', 'visibility', vis);
    }
  }, [showZones]);

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
