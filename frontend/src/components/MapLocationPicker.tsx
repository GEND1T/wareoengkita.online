import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Loader2,
  Navigation,
  MapPin,
  Maximize2,
  X,
  Check,
  Crosshair,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  searchAddress,
  reverseGeocodeCoords,
  type GeoSearchResult,
} from '../services/wilayahService';

// Fix default Leaflet marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom green marker icon
const greenMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapLocationResult {
  lat: number;
  lon: number;
  displayName: string;
  road: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  village: string;
}

interface MapLocationPickerProps {
  initialLat?: number;
  initialLon?: number;
  initialAddress?: string;
  onLocationSelect: (result: MapLocationResult) => void;
}

// --- Sub-component: Fly map to position ---
function FlyToPosition({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 17, { duration: 1.2 });
  }, [lat, lon, map]);
  return null;
}

// --- Sub-component: Click on map to move marker ---
function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper: Try to parse "lat, lon" from a string (e.g. pasted from Google Maps)
function parseCoordinates(text: string): { lat: number; lon: number } | null {
  const cleaned = text.trim();
  // Match patterns like "-6.2088, 106.8456" or "-6.2088 106.8456"
  const match = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }
  return null;
}

// --- MAIN COMPONENT ---
const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLat,
  initialLon,
  initialAddress,
  onLocationSelect,
}) => {
  // Default to Jakarta center
  const DEFAULT_LAT = -6.2088;
  const DEFAULT_LON = 106.8456;

  const [lat, setLat] = useState(initialLat || DEFAULT_LAT);
  const [lon, setLon] = useState(initialLon || DEFAULT_LON);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || '');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Manual coord input state (always visible below map, no toggle)
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  // GPS state
  const [isLocating, setIsLocating] = useState(false);

  // Fullscreen map state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenLat, setFullscreenLat] = useState(lat);
  const [fullscreenLon, setFullscreenLon] = useState(lon);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // MapContainer key to force re-render when toggling fullscreen
  const [mapKey, setMapKey] = useState(0);

  // Close search results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Dynamically update map center and inputs when props change (e.g. during Edit Address mode)
  useEffect(() => {
    if (initialLat !== undefined && initialLon !== undefined && (initialLat !== lat || initialLon !== lon)) {
      setLat(initialLat);
      setLon(initialLon);
      setManualLat(initialLat.toFixed(6));
      setManualLon(initialLon.toFixed(6));
      setMapKey((k) => k + 1);
    }
    if (initialAddress !== undefined) {
      setSelectedAddress(initialAddress);
    }
  }, [initialLat, initialLon, initialAddress]);

  // Debounced search — skip if the input looks like coordinates
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    // Don't trigger text search if it looks like coordinates
    if (parseCoordinates(searchQuery)) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchAddress(searchQuery);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply a search result or geocode result
  const applyLocation = useCallback(
    (result: GeoSearchResult) => {
      setLat(result.lat);
      setLon(result.lon);
      setManualLat(result.lat.toFixed(6));
      setManualLon(result.lon.toFixed(6));
      setSelectedAddress(result.displayName);
      setSearchQuery('');
      setShowResults(false);
      setSearchResults([]);
      setMapKey((k) => k + 1);

      onLocationSelect({
        lat: result.lat,
        lon: result.lon,
        displayName: result.displayName,
        road: result.road,
        district: result.district,
        city: result.city,
        province: result.province,
        postalCode: result.postalCode,
        village: result.village,
      });
    },
    [onLocationSelect]
  );

  // GPS handler
  const handleGPS = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const result = await reverseGeocodeCoords(latitude, longitude);
        if (result) {
          applyLocation(result);
        } else {
          setLat(latitude);
          setLon(longitude);
          setManualLat(latitude.toFixed(6));
          setManualLon(longitude.toFixed(6));
          setMapKey((k) => k + 1);
        }
        setIsLocating(false);
      },
      async () => {
        // Fallback: Jakarta
        const result = await reverseGeocodeCoords(DEFAULT_LAT, DEFAULT_LON);
        if (result) applyLocation(result);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [applyLocation]);

  // Handle search Enter key — detect coordinates pasted in search field
  const handleSearchKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      const coords = parseCoordinates(searchQuery);
      if (coords) {
        // Coordinates detected → auto-fill lat/lon fields & reverse geocode
        setManualLat(coords.lat.toFixed(6));
        setManualLon(coords.lon.toFixed(6));
        setIsReverseGeocoding(true);
        const result = await reverseGeocodeCoords(coords.lat, coords.lon);
        if (result) {
          applyLocation(result);
        } else {
          setLat(coords.lat);
          setLon(coords.lon);
          setMapKey((k) => k + 1);
        }
        setSearchQuery('');
        setIsReverseGeocoding(false);
      }
    },
    [searchQuery, applyLocation]
  );

  // Handle manual lat/lon field changes — auto-apply when both are valid
  const handleManualLatChange = useCallback(
    async (newVal: string) => {
      setManualLat(newVal);
      const parsedLat = parseFloat(newVal);
      const parsedLon = parseFloat(manualLon);
      if (
        !isNaN(parsedLat) && !isNaN(parsedLon) &&
        parsedLat >= -90 && parsedLat <= 90 &&
        parsedLon >= -180 && parsedLon <= 180 &&
        newVal.length >= 4 && manualLon.length >= 4
      ) {
        setIsReverseGeocoding(true);
        const result = await reverseGeocodeCoords(parsedLat, parsedLon);
        if (result) {
          applyLocation(result);
        } else {
          setLat(parsedLat);
          setLon(parsedLon);
          setMapKey((k) => k + 1);
        }
        setIsReverseGeocoding(false);
      }
    },
    [manualLon, applyLocation]
  );

  const handleManualLonChange = useCallback(
    async (newVal: string) => {
      setManualLon(newVal);
      const parsedLat = parseFloat(manualLat);
      const parsedLon = parseFloat(newVal);
      if (
        !isNaN(parsedLat) && !isNaN(parsedLon) &&
        parsedLat >= -90 && parsedLat <= 90 &&
        parsedLon >= -180 && parsedLon <= 180 &&
        manualLat.length >= 4 && newVal.length >= 4
      ) {
        setIsReverseGeocoding(true);
        const result = await reverseGeocodeCoords(parsedLat, parsedLon);
        if (result) {
          applyLocation(result);
        } else {
          setLat(parsedLat);
          setLon(parsedLon);
          setMapKey((k) => k + 1);
        }
        setIsReverseGeocoding(false);
      }
    },
    [manualLat, applyLocation]
  );

  // Fullscreen map click handler
  const handleFullscreenMapClick = useCallback((clickLat: number, clickLon: number) => {
    setFullscreenLat(clickLat);
    setFullscreenLon(clickLon);
  }, []);

  // Save location from fullscreen
  const handleSaveFullscreenLocation = useCallback(async () => {
    setIsReverseGeocoding(true);
    const result = await reverseGeocodeCoords(fullscreenLat, fullscreenLon);
    if (result) {
      applyLocation(result);
    } else {
      setLat(fullscreenLat);
      setLon(fullscreenLon);
      setManualLat(fullscreenLat.toFixed(6));
      setManualLon(fullscreenLon.toFixed(6));
    }
    setIsReverseGeocoding(false);
    setIsFullscreen(false);
    setMapKey((k) => k + 1);
  }, [fullscreenLat, fullscreenLon, applyLocation]);

  // Open fullscreen
  const openFullscreen = () => {
    setFullscreenLat(lat);
    setFullscreenLon(lon);
    setIsFullscreen(true);
  };

  return (
    <div className="space-y-3">
      {/* --- SEARCH BAR --- */}
      <div ref={searchRef} className="relative">
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Cari Alamat atau Paste Koordinat
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Ketik alamat atau paste koordinat"
            className="w-full bg-white text-sm rounded-xl py-2.5 pl-9 pr-10 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-2 focus:ring-[#063104]/20 transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {(isSearching || isReverseGeocoding) && (
            <Loader2 className="w-4 h-4 text-[#063104] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-[60] left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 max-h-56 overflow-y-auto space-y-0.5 animate-fade-in">
            {searchResults.map((item) => (
              <button
                key={item.placeId}
                type="button"
                onClick={() => applyLocation(item)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs hover:bg-emerald-50 text-gray-800 transition-colors flex items-start gap-2 group"
              >
                <MapPin className="w-3.5 h-3.5 text-[#77a160] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-gray-900 block truncate">
                    {item.displayName.split(',')[0]}
                  </span>
                  <span className="text-gray-500 text-[10px] line-clamp-2 mt-0.5 block">
                    {item.displayName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- GPS BUTTON --- */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={isLocating}
        className="w-full bg-emerald-50 hover:bg-emerald-100/80 text-[#063104] border border-emerald-200/80 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all focus:outline-none"
      >
        {isLocating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#063104]" />
            <span>Mendeteksi Lokasi GPS...</span>
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 fill-[#063104]" />
            <span>Gunakan Lokasi GPS Saat Ini</span>
          </>
        )}
      </button>

      {/* --- MAP PREVIEW --- */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ isolation: 'isolate' }}>
        <div style={{ height: '200px', width: '100%' }}>
          <MapContainer
            key={`preview-${mapKey}`}
            center={[lat, lon]}
            zoom={17}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lon]} icon={greenMarkerIcon} />
            <FlyToPosition lat={lat} lon={lon} />
          </MapContainer>
        </div>

        {/* Expand button overlay — positioned OUTSIDE the Leaflet container with high z-index */}
        <div
          className="absolute top-2.5 right-2.5"
          style={{ zIndex: 9999, pointerEvents: 'auto' }}
        >
          <button
            type="button"
            onClick={openFullscreen}
            className="bg-white hover:bg-gray-50 text-[#063104] p-2.5 rounded-xl shadow-lg border border-gray-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Perluas Peta"
          >
            <Maximize2 className="w-4.5 h-4.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Coordinate badge */}
        <div
          className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg font-mono"
          style={{ zIndex: 9999 }}
        >
          {lat.toFixed(6)}, {lon.toFixed(6)}
        </div>
      </div>

      {/* --- MANUAL LAT/LON INPUT (always visible, below map, above selected address) --- */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 mb-0.5">
            <Crosshair className="w-3 h-3" />
            Latitude
          </label>
          <input
            type="text"
            value={manualLat}
            onChange={(e) => handleManualLatChange(e.target.value)}
            placeholder="-6.2088"
            className="w-full bg-white text-xs rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20 font-mono text-gray-700"
          />
        </div>
        <div className="flex-1">
          <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 mb-0.5">
            <Crosshair className="w-3 h-3" />
            Longitude
          </label>
          <input
            type="text"
            value={manualLon}
            onChange={(e) => handleManualLonChange(e.target.value)}
            placeholder="106.8456"
            className="w-full bg-white text-xs rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20 font-mono text-gray-700"
          />
        </div>
        {isReverseGeocoding && (
          <div className="pb-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#063104]" />
          </div>
        )}
      </div>

      {/* --- SELECTED ADDRESS SUMMARY --- */}
      {selectedAddress && (
        <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-1 animate-fade-in shadow-xs">
          <div className="flex items-start gap-1.5 text-[#063104] font-black text-[11px]">
            <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 mt-0.5 text-emerald-700" />
            <span>Lokasi Terpilih:</span>
          </div>
          <p className="text-gray-800 font-semibold leading-relaxed pl-5">{selectedAddress}</p>
        </div>
      )}

      {/* --- FULLSCREEN MAP MODAL --- */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[2000] bg-black/60 flex flex-col animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          {/* Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#063104]" />
              <h3 className="font-bold text-gray-900 text-sm">Pilih Lokasi di Peta</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Info banner */}
          <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2 text-xs text-[#063104] font-medium flex items-center gap-2 shrink-0">
            <Crosshair className="w-3.5 h-3.5" />
            <span>Ketuk peta untuk memindahkan pin ke lokasi yang diinginkan</span>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapContainer
              key={`fullscreen-${mapKey}`}
              center={[fullscreenLat, fullscreenLon]}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[fullscreenLat, fullscreenLon]} icon={greenMarkerIcon} />
              <MapClickHandler onClick={handleFullscreenMapClick} />
              <FlyToPosition lat={fullscreenLat} lon={fullscreenLon} />
            </MapContainer>

            {/* Coordinate overlay */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-xs px-3 py-1.5 rounded-xl shadow-md border border-gray-200/80 font-mono text-gray-700 z-[1000]">
              {fullscreenLat.toFixed(6)}, {fullscreenLon.toFixed(6)}
            </div>
          </div>

          {/* Bottom save bar */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 shrink-0 safe-area-bottom">
            <button
              type="button"
              onClick={handleSaveFullscreenLocation}
              disabled={isReverseGeocoding}
              className="w-full bg-[#063104] hover:bg-[#084205] text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm focus:outline-none disabled:opacity-60"
            >
              {isReverseGeocoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendapatkan alamat...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Gunakan Lokasi Ini</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
