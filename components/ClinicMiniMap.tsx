'use client';

import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap, Marker as MaplibreMarker } from 'maplibre-gl';
import { ZONE_STYLES } from './CoverageLayer';

type ZoneKey = keyof typeof ZONE_STYLES;

type Props = {
  userLocation: [number, number] | null;
  zone: ZoneKey | null;
  nearestClinicLocation?: [number, number] | null;
};

export default function ClinicMiniMap({ userLocation, zone, nearestClinicLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const userMarkerRef = useRef<MaplibreMarker | null>(null);
  const clinicMarkerRef = useRef<MaplibreMarker | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let destroyed = false;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (destroyed || !containerRef.current) return;

      const styleRes = await fetch('/api/tiles/styles?style=light');
      const style = await styleRes.json();

      const rewriteUrl = (u: string) =>
        u.replace(/https?:\/\/[^/]*mapsi\.dev(?:\/v\d+)?\/tiles\//, '/api/tiles/')
         .replace(/[?&]key=[^&]+/g, '');

      for (const src of Object.values(style.sources ?? {}) as Record<string, unknown>[]) {
        if (Array.isArray(src.tiles)) src.tiles = (src.tiles as string[]).map(rewriteUrl);
        if (typeof src.url === 'string') {
          const proxyUrl = rewriteUrl(src.url as string);
          if (proxyUrl.startsWith('/api/tiles/')) {
            try {
              const tj = await (await fetch(proxyUrl)).json() as Record<string, unknown>;
              if (Array.isArray(tj.tiles)) {
                src.tiles = (tj.tiles as string[]).map(rewriteUrl);
                if (tj.minzoom !== undefined) src.minzoom = tj.minzoom;
                if (tj.maxzoom !== undefined) src.maxzoom = tj.maxzoom;
                delete src.url;
              }
            } catch { /* keep url */ }
          }
        }
      }

      const center: [number, number] = userLocation
        ? [userLocation[1], userLocation[0]]
        : [-0.1278, 51.5074];

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center,
        zoom: 13,
        interactive: false,
        attributionControl: false,
        transformRequest: (url: string) => {
          if (!url.includes('mapsi.dev')) return { url };
          const match = url.match(/https?:\/\/[^/]*mapsi\.dev(?:\/v\d+)?\/tiles\/([^?]*)/);
          if (!match) return { url };
          const tilePath = match[1].replace(/\/$/, '');
          let qs = '';
          try { const p = new URL(url).searchParams; p.delete('key'); qs = p.toString(); } catch { /* ignore */ }
          return { url: `/api/tiles/${tilePath}${qs ? `?${qs}` : ''}` };
        },
      });
      mapRef.current = map;

      map.on('load', () => {
        if (destroyed) return;
        if (userLocation) {
          const el = document.createElement('div');
          el.style.cssText = 'width:14px;height:14px;background:#3B82F6;border:2px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,.5)';
          userMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([userLocation[1], userLocation[0]])
            .addTo(map);
        }
        if (nearestClinicLocation) {
          const el = document.createElement('div');
          el.style.cssText = 'width:12px;height:12px;background:#059669;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)';
          clinicMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([nearestClinicLocation[1], nearestClinicLocation[0]])
            .addTo(map);
        }
      });
    })();

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user marker when userLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (!userLocation) return;
      const el = document.createElement('div');
      el.style.cssText = 'width:14px;height:14px;background:#3B82F6;border:2px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,.5)';
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation[1], userLocation[0]])
        .addTo(map);
      map.setCenter([userLocation[1], userLocation[0]]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Update clinic marker when nearestClinicLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded() || !nearestClinicLocation) return;
    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      clinicMarkerRef.current?.remove();
      clinicMarkerRef.current = null;
      const el = document.createElement('div');
      el.style.cssText = 'width:12px;height:12px;background:#059669;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)';
      clinicMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([nearestClinicLocation[1], nearestClinicLocation[0]])
        .addTo(map);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearestClinicLocation]);

  const zoneStyle = zone ? ZONE_STYLES[zone] : null;

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 relative">
      {zoneStyle && (
        <div
          className="px-3 py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: zoneStyle.color }}
        >
          {zoneStyle.label} — {zoneStyle.fee}
        </div>
      )}
      <div ref={containerRef} className="w-full h-[180px]" />
      {!userLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Enter your address to see the map</p>
        </div>
      )}
    </div>
  );
}
