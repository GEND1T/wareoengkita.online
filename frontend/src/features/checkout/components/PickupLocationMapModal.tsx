import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Clock, Phone, Banknote, Check, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { PickupLocation } from '../../../types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Red pin for Customer
const customerMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green pin for Pickup Locations
const storeMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Gold pin for Selected Pickup Location
const selectedStoreMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper: Distance calculation using Haversine formula
function getDistanceKm(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return parseFloat(dist.toFixed(1));
}

function formatDistance(distKm: number | null): string {
  if (distKm === null) return '';
  if (distKm < 1) return `${Math.round(distKm * 1000)} m`;
  return `${distKm.toFixed(1)} km`;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(val || 0)
    .replace(/\s/g, ' ');

// Sub-component: Fit bounds for initial load
function FitMapBounds({
  customerLat,
  customerLon,
  locations,
}: {
  customerLat?: number;
  customerLon?: number;
  locations: PickupLocation[];
}) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    if (customerLat && customerLon) {
      points.push([customerLat, customerLon]);
    }
    locations.forEach((loc) => {
      if (loc.latitude && loc.longitude) {
        points.push([loc.latitude, loc.longitude]);
      }
    });
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, customerLat, customerLon, locations]);
  return null;
}

// Sub-component: Fly to active pin when selected
function FlyToTarget({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 16, { duration: 1.0 });
    }
  }, [lat, lon, map]);
  return null;
}

interface PickupLocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickupLocations: PickupLocation[];
  selectedLocationId?: string;
  customerLat?: number;
  customerLon?: number;
  customerAddressName?: string;
  onSelectLocation: (locationId: string) => void;
}

export const PickupLocationMapModal: React.FC<PickupLocationMapModalProps> = ({
  isOpen,
  onClose,
  pickupLocations,
  selectedLocationId,
  customerLat,
  customerLon,
  customerAddressName,
  onSelectLocation,
}) => {
  const [activeLocationId, setActiveLocationId] = useState<string>(
    selectedLocationId || (pickupLocations[0]?.id ?? '')
  );

  useEffect(() => {
    if (selectedLocationId) {
      setActiveLocationId(selectedLocationId);
    } else if (pickupLocations.length > 0) {
      setActiveLocationId(pickupLocations[0].id);
    }
  }, [selectedLocationId, pickupLocations]);

  if (!isOpen) return null;

  const activeLocation = pickupLocations.find((pl) => pl.id === activeLocationId) || pickupLocations[0];
  const activeDistanceKm = activeLocation
    ? getDistanceKm(customerLat, customerLon, activeLocation.latitude, activeLocation.longitude)
    : null;

  // Default map center (if no customer lat/lon or location lat/lon)
  const defaultCenterLat = activeLocation?.latitude || customerLat || -6.2088;
  const defaultCenterLon = activeLocation?.longitude || customerLon || 106.8456;

  const handleConfirmSelect = () => {
    if (activeLocation) {
      onSelectLocation(activeLocation.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white px-4 py-3.5 flex items-center justify-between shadow-sm z-10 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <MapIcon className="w-4 h-4 text-[#063104]" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">Peta Lokasi Pengambilan</h3>
            <p className="text-[11px] text-gray-500">Pilih pin lokasi toko terdekat untuk self-pickup</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative w-full h-full min-h-[300px]">
        <MapContainer
          center={[defaultCenterLat, defaultCenterLon]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <FitMapBounds customerLat={customerLat} customerLon={customerLon} locations={pickupLocations} />
          {activeLocation && <FlyToTarget lat={activeLocation.latitude} lon={activeLocation.longitude} />}

          {/* Customer Location Pin */}
          {customerLat && customerLon && (
            <Marker position={[customerLat, customerLon]} icon={customerMarkerIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-red-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                    <span>Alamat Anda</span>
                  </p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{customerAddressName || 'Lokasi Pengiriman'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Store Pickup Location Pins */}
          {pickupLocations.map((pl) => {
            const isSelected = pl.id === activeLocationId;
            const dist = getDistanceKm(customerLat, customerLon, pl.latitude, pl.longitude);

            return (
              <Marker
                key={pl.id}
                position={[pl.latitude, pl.longitude]}
                icon={isSelected ? selectedStoreMarkerIcon : storeMarkerIcon}
                eventHandlers={{
                  click: () => setActiveLocationId(pl.id),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <p className="font-bold text-gray-900">{pl.name}</p>
                    <p className="text-gray-600 text-[10px]">{pl.address}</p>
                    {dist !== null && (
                      <p className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{formatDistance(dist)} dari lokasi Anda</span>
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-md border border-gray-200 text-[11px] space-y-1.5 z-[1000]">
          {customerLat && customerLon && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
              <span className="font-semibold text-gray-700">Lokasi Anda</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span className="font-semibold text-gray-700">Lokasi Toko Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span className="font-extrabold text-amber-900">Toko Terpilih</span>
          </div>
        </div>
      </div>

      {/* Location Drawer & Selection Card */}
      <div className="bg-white border-t border-gray-200 shadow-2xl z-10 p-4 space-y-3 shrink-0 rounded-t-3xl max-h-[45vh] overflow-y-auto">
        {/* Horizontal location pills switcher if multiple locations */}
        {pickupLocations.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {pickupLocations.map((pl) => {
              const isSelected = pl.id === activeLocationId;
              const dist = getDistanceKm(customerLat, customerLon, pl.latitude, pl.longitude);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => setActiveLocationId(pl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#063104] text-white border-[#063104] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{pl.name}</span>
                  {dist !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {formatDistance(dist)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Location Details Card */}
        {activeLocation ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <span>{activeLocation.name}</span>
                  {activeDistanceKm !== null && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>{formatDistance(activeDistanceKm)}</span>
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{activeLocation.address}</p>
              </div>

              <span className="font-extrabold text-xs text-[#063104] bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-xs shrink-0">
                {activeLocation.pickupFee ? formatCurrency(activeLocation.pickupFee) : 'GRATIS'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 pt-1 border-t border-emerald-200/60">
              {activeLocation.operatingHours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>{activeLocation.operatingHours}</span>
                </span>
              )}
              {activeLocation.phone && (
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WA: {activeLocation.phone}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">Tidak ada lokasi pengambilan dipilih.</p>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirmSelect}
          disabled={!activeLocation}
          className="w-full bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Gunakan Lokasi Ini untuk Self-Pickup</span>
        </button>
      </div>
    </div>
  );
};

export default PickupLocationMapModal;
