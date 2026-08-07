import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Clock, Phone, ExternalLink, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Red pin for Customer Location
const customerMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green pin for Selected Store Pickup Location
const storeMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper: Haversine distance calculation in km
function getDistanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null): number | null {
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

// Format distance string
function formatDistance(distKm: number | null): string {
  if (distKm === null) return '';
  if (distKm < 1) return `${Math.round(distKm * 1000)} m`;
  return `${distKm.toFixed(1)} km`;
}

// Auto-fit map bounds to customer & store location
function FitRouteBounds({
  customerLat,
  customerLon,
  storeLat,
  storeLon,
}: {
  customerLat?: number | null;
  customerLon?: number | null;
  storeLat?: number | null;
  storeLon?: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
    const points: [number, number][] = [];
    if (customerLat && customerLon) points.push([customerLat, customerLon]);
    if (storeLat && storeLon) points.push([storeLat, storeLon]);

    if (points.length > 0) {
      if (points.length === 1) {
        map.setView(points[0], 15);
      } else {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [customerLat, customerLon, storeLat, storeLon, map]);

  return null;
}

export interface PickupRouteMapModalProps {
  open: boolean;
  onClose: () => void;
  customerLat?: number | null;
  customerLon?: number | null;
  customerAddressName?: string;
  pickupLocation: any;
  orderNo?: string;
}

export const PickupRouteMapModal: React.FC<PickupRouteMapModalProps> = ({
  open,
  onClose,
  customerLat,
  customerLon,
  customerAddressName,
  pickupLocation,
  orderNo,
}) => {
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);

  const storeLat = pickupLocation?.latitude;
  const storeLon = pickupLocation?.longitude;

  // Calculate Haversine distance
  const distanceKm = getDistanceKm(customerLat, customerLon, storeLat, storeLon);

  // Fetch real-road OSRM route polyline
  useEffect(() => {
    if (!open || !customerLat || !customerLon || !storeLat || !storeLon) {
      setRoutePolyline([]);
      return;
    }

    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${customerLon},${customerLat};${storeLon},${storeLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
          const geoCoords = json.routes[0].geometry.coordinates;
          // OSRM returns [lon, lat], Leaflet polyline requires [lat, lon]
          const leafletCoords: [number, number][] = geoCoords.map((c: [number, number]) => [c[1], c[0]]);
          setRoutePolyline(leafletCoords);
        } else {
          setRoutePolyline([[customerLat, customerLon], [storeLat, storeLon]]);
        }
      } catch (err) {
        console.error('OSRM route fetch error:', err);
        setRoutePolyline([[customerLat, customerLon], [storeLat, storeLon]]);
      }
    };

    fetchOSRMRoute();
  }, [open, customerLat, customerLon, storeLat, storeLon]);

  if (!open || !pickupLocation) return null;

  const defaultCenterLat = storeLat || -6.2088;
  const defaultCenterLon = storeLon || 106.8456;

  // Google Maps Directions link using precise lat,lon coordinates
  const googleMapsDirectionsUrl = customerLat && customerLon
    ? `https://www.google.com/maps/dir/?api=1&origin=${customerLat},${customerLon}&destination=${storeLat},${storeLon}`
    : `https://www.google.com/maps/dir/?api=1&destination=${storeLat},${storeLon}`;

  return (
    <div className="fixed inset-0 z-[4000] bg-black/60 flex flex-col justify-end sm:justify-center items-center animate-fade-in backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-[82vh] relative">
        {/* Header Bar */}
        <div className="bg-white px-4 py-3.5 flex items-center justify-between shadow-xs z-10 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-[#063104]" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <span>Rute Lokasi Pengambilan</span>
                {orderNo && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-[#063104] px-2 py-0.5 rounded-full border border-emerald-200">
                    #{orderNo}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500">Peta rute perjalanan lokasi Anda menuju toko pengambilan</p>
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

            <FitRouteBounds
              customerLat={customerLat}
              customerLon={customerLon}
              storeLat={storeLat}
              storeLon={storeLon}
            />

            {/* OSRM Real-Road Route Polyline */}
            {routePolyline.length > 0 && (
              <Polyline
                positions={routePolyline}
                pathOptions={{
                  color: '#063104',
                  weight: 5,
                  opacity: 0.85,
                  dashArray: '8, 8',
                }}
              />
            )}

            {/* Customer Location Pin */}
            {customerLat && customerLon && (
              <Marker position={[customerLat, customerLon]} icon={customerMarkerIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-red-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Lokasi Anda</span>
                    </p>
                    <p className="text-gray-600 text-[10px] mt-0.5">{customerAddressName || 'Alamat Pelanggan'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Store Pickup Location Pin */}
            {storeLat && storeLon && (
              <Marker position={[storeLat, storeLon]} icon={storeMarkerIcon}>
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <p className="font-bold text-[#063104]">{pickupLocation.name}</p>
                    <p className="text-gray-600 text-[10px]">{pickupLocation.address}</p>
                    {distanceKm !== null && (
                      <p className="text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>{formatDistance(distanceKm)} dari posisi Anda</span>
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
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
              <span className="font-extrabold text-[#063104]">Lokasi Pengambilan Toko</span>
            </div>
            {routePolyline.length > 0 && (
              <div className="flex items-center gap-2 pt-0.5 border-t border-gray-100">
                <span className="w-4 h-1 rounded bg-[#063104] shrink-0"></span>
                <span className="font-bold text-gray-600 text-[10px]">Rute Jalan Real (OSRM)</span>
              </div>
            )}
          </div>
        </div>

        {/* Store Info & Navigation Action Card */}
        <div className="bg-white border-t border-gray-200 shadow-2xl z-10 p-4 space-y-3 shrink-0 rounded-t-3xl">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <span>{pickupLocation.name}</span>
                  {distanceKm !== null && (
                    <span className="bg-emerald-100 text-[#063104] text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>{formatDistance(distanceKm)}</span>
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{pickupLocation.address}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-600 pt-2 border-t border-emerald-200/60 font-medium">
              {pickupLocation.operatingHours && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span>Jam Operasional: {pickupLocation.operatingHours}</span>
                </span>
              )}
              {pickupLocation.phone && (
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>WA: {pickupLocation.phone}</span>
                </span>
              )}
            </div>
          </div>

          {/* Primary Action Button: Buka Navigasi Google Maps */}
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 border border-emerald-900/30"
          >
            <Navigation className="w-4 h-4 text-emerald-300 fill-emerald-300" />
            <span>Buka Navigasi Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
          </a>
        </div>
      </div>
    </div>
  );
};
