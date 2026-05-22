'use client';

// Zone legend + toggle UI rendered below the map on /locations.
// Map layer rendering lives in ClinicMap (which owns the MapLibre instance).

export type ZoneMode = 'fixed' | 'isochrone';

export const ZONE_STYLES = {
  central: { color: '#16a34a', bg: '#22c55e', label: 'Central London', fee: '£70 home visit' },
  inner:   { color: '#ca8a04', bg: '#eab308', label: 'Inner London',   fee: '£50 home visit' },
  outer:   { color: '#dc2626', bg: '#ef4444', label: 'Outer London',   fee: 'Clinic visits only' },
} as const;

type Props = {
  visible: boolean;
  onToggle: () => void;
  zoneMode: ZoneMode;
  onZoneModeChange: (mode: ZoneMode) => void;
  isochroneLoading?: boolean;
  requiresLocation?: boolean;
};

export default function CoverageLayer({
  visible,
  onToggle,
  zoneMode,
  onZoneModeChange,
  isochroneLoading,
  requiresLocation,
}: Props) {
  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">Coverage Zones</span>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            visible ? 'bg-emerald-600' : 'bg-gray-300'
          }`}
          aria-label={visible ? 'Hide zones' : 'Show zones'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              visible ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {visible && (
        <>
          {/* Fixed vs Isochrone tabs */}
          <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onZoneModeChange('fixed')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                zoneMode === 'fixed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Fixed Postcode
            </button>
            <button
              onClick={() => onZoneModeChange('isochrone')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                zoneMode === 'isochrone'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Drive-Time
            </button>
          </div>

          {zoneMode === 'isochrone' && requiresLocation && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded p-2 mb-3">
              Search your postcode above to generate drive-time zones from nearby clinics.
            </p>
          )}
          {zoneMode === 'isochrone' && isochroneLoading && (
            <p className="text-xs text-gray-500 mb-3">Generating drive-time zones…</p>
          )}

          {/* Legend */}
          <div className="space-y-1.5">
            {(Object.entries(ZONE_STYLES) as [keyof typeof ZONE_STYLES, typeof ZONE_STYLES[keyof typeof ZONE_STYLES]][]).map(
              ([key, style]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-sm flex-shrink-0 border"
                    style={{ backgroundColor: style.bg + '40', borderColor: style.color }}
                  />
                  <span className="text-xs text-gray-700 flex-1">{style.label}</span>
                  <span className="text-xs text-gray-500 font-medium">{style.fee}</span>
                </div>
              )
            )}
          </div>

          {zoneMode === 'fixed' && (
            <p className="text-xs text-gray-400 mt-2">
              Zones based on postcode prefix — instant, no API call.
            </p>
          )}
          {zoneMode === 'isochrone' && !requiresLocation && (
            <p className="text-xs text-gray-400 mt-2">
              Zones show 30-min drive radius from nearest clinics.
            </p>
          )}
        </>
      )}
    </div>
  );
}
