import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Store,
  MessageCircle,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Clock,
  Package,
  Compass,
  Loader2,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

// Custom Leaflet Markers
const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper component to adjust Leaflet viewport to fit both Store and Customer pins
const FitBoundsHelper: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
};

// Haversine distance fallback calculator in KM
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface InternalCourierMapViewProps {
  open: boolean;
  onClose: () => void;
  order: any;
  onConfirmReceipt?: (orderId: string) => void;
}

export const InternalCourierMapView: React.FC<InternalCourierMapViewProps> = ({
  open,
  onClose,
  order,
  onConfirmReceipt,
}) => {
  const [roadPolyline, setRoadPolyline] = useState<[number, number][]>([]);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [roadDurationMin, setRoadDurationMin] = useState<number | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState<boolean>(false);

  // Origin (Store) Coordinates - exact match from store profile
  const rawStoreLat = order?.store?.latitude ?? order?.storeLat;
  const rawStoreLon = order?.store?.longitude ?? order?.storeLon;
  const storeLat = rawStoreLat !== undefined && rawStoreLat !== null ? Number(rawStoreLat) : -6.94354419176064;
  const storeLon = rawStoreLon !== undefined && rawStoreLon !== null ? Number(rawStoreLon) : 109.1316514084431;

  const storeName = order?.store?.name || order?.storeName || 'OrganikStore Utama';
  const storeAddress = order?.store?.address || 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan';

  // Destination (Customer) Coordinates - exact match from customer address
  const rawDestLat = order?.customerLat;
  const rawDestLon = order?.customerLon;
  const destLat = rawDestLat !== undefined && rawDestLat !== null ? Number(rawDestLat) : storeLat - 0.025;
  const destLon = rawDestLon !== undefined && rawDestLon !== null ? Number(rawDestLon) : storeLon - 0.015;
  const customerName = order?.customerName || 'Pembeli';
  const customerPhone = order?.phone || order?.customerPhone || '081298765432';
  const customerAddress = order?.shippingAddress || 'Alamat Tujuan Pengiriman';
  const orderNo = order?.orderNo || order?.id;

  // Fetch real road polyline & turn-by-turn driving geometry from OSRM Routing Engine API
  useEffect(() => {
    if (!open || !order) return;
    let isMounted = true;
    async function fetchRoadRoute() {
      if (!storeLat || !storeLon || !destLat || !destLon) return;
      try {
        setIsFetchingRoute(true);
        // OSRM routing endpoint (lon,lat;lon,lat)
        const url = `https://router.project-osrm.org/route/v1/driving/${storeLon},${storeLat};${destLon},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // OSRM coordinates are [longitude, latitude], convert to Leaflet [latitude, longitude]
          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon]
          );

          if (isMounted) {
            setRoadPolyline(coords);
            setRoadDistanceKm(Math.round((route.distance / 1000) * 10) / 10);
            setRoadDurationMin(Math.round(route.duration / 60));
          }
        }
      } catch (err) {
        console.warn('[InternalCourierMap] OSRM routing fetch failed:', err);
      } finally {
        if (isMounted) setIsFetchingRoute(false);
      }
    }

    fetchRoadRoute();
    return () => {
      isMounted = false;
    };
  }, [open, order, storeLat, storeLon, destLat, destLon]);

  if (!open || !order) return null;

  // Distance & time fallbacks
  const haversineDist = calculateHaversineKm(storeLat, storeLon, destLat, destLon);
  const displayDistance = roadDistanceKm ?? haversineDist;
  const displayDuration = roadDurationMin ?? Math.round(displayDistance * 3.5 + 5);

  const bounds: L.LatLngBoundsExpression = [
    [storeLat, storeLon],
    [destLat, destLon],
  ];

  const fallbackPolyline: [number, number][] = [
    [storeLat, storeLon],
    [destLat, destLon],
  ];

  const activePolyline = roadPolyline.length > 0 ? roadPolyline : fallbackPolyline;

  const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Halo ${customerName}, saya kurir internal toko sedang mengantar pesanan #${orderNo}.`
  )}`;

  const gmapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${storeLat},${storeLon}&destination=${destLat},${destLon}&travelmode=driving`;
  const wazeNavUrl = `https://waze.com/ul?ll=${destLat},${destLon}&navigate=yes`;

  const items = order.items || (order.itemsJson ? JSON.parse(order.itemsJson) : []);

  return (
    <div
      className="fixed inset-0 z-[3800] bg-black/65 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[95vh] relative">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#063104] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Compass className="w-5 h-5 text-[#FACC15] animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 text-sm truncate">
                  Peta Rute Navigasi Kurir Internal (OSRM Jalan Real)
                </h3>
                <span className="bg-emerald-100 text-[#063104] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Dalam Pengiriman
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                Pesanan <strong className="text-[#063104] font-mono">#{orderNo}</strong> • {customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body: Live Map & Route Details */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto min-h-0">
          {/* Left / Top: Interactive Leaflet Map Canvas */}
          <div className="w-full md:w-7/12 h-80 md:h-auto min-h-[320px] relative bg-slate-100 shrink-0 border-b md:border-b-0 md:border-r border-gray-200">
            <MapContainer
              center={[storeLat, storeLon]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitBoundsHelper bounds={bounds} />

              {/* Pin 1: Origin (Store) */}
              <Marker position={[storeLat, storeLon]} icon={storeIcon}>
                <Popup>
                  <div className="p-1 space-y-1">
                    <strong className="text-emerald-800 text-xs flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-[#063104]" />
                      {storeName} (Toko Asal)
                    </strong>
                    <p className="text-[11px] text-gray-600 leading-tight">{storeAddress}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Lat: {storeLat.toFixed(5)}, Lon: {storeLon.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Pin 2: Destination (Customer) */}
              <Marker position={[destLat, destLon]} icon={customerIcon}>
                <Popup>
                  <div className="p-1 space-y-1">
                    <strong className="text-rose-700 text-xs flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {customerName} (Lokasi Tujuan)
                    </strong>
                    <p className="text-[11px] text-gray-600 leading-tight">{customerAddress}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Lat: {destLat.toFixed(5)}, Lon: {destLon.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Real Road Polyline Line (Following Streets) */}
              <Polyline
                positions={activePolyline}
                pathOptions={{
                  color: '#063104',
                  weight: 5,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapContainer>

            {/* Map Overlay Badge Info */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-gray-200 flex items-center gap-3">
              {isFetchingRoute ? (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <Loader2 className="w-4 h-4 text-[#063104] animate-spin" />
                  <span>Memuat Rute Jalan...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#063104]">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>{displayDistance} KM</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>~{displayDuration} Menit</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right / Bottom: Order Info & Route Navigation Details */}
          <div className="w-full md:w-5/12 p-4 sm:p-5 space-y-4 overflow-y-auto flex flex-col justify-between bg-white">
            <div className="space-y-3.5 text-xs">
              {/* Route Summary Box */}
              <div className="bg-gradient-to-br from-emerald-50/90 to-emerald-50/30 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-[#063104]">
                  <span>Rute Perjalanan Kurir Toko</span>
                  <span className="bg-[#063104] text-white px-2 py-0.5 rounded-md text-[10px]">
                    Navigasi Real Jalan
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Jarak Rute Jalan:</span>
                    <strong className="text-gray-900 text-sm font-black">{displayDistance} KM</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">Estimasi Waktu:</span>
                    <strong className="text-emerald-800 text-sm font-black">~{displayDuration} Menit</strong>
                  </div>
                </div>
              </div>

              {/* Origin Store Location */}
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200/80 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  1. Titik Penjemputan Toko:
                </span>
                <p className="font-extrabold text-gray-900 text-xs flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-[#063104] shrink-0" />
                  <span>{storeName}</span>
                </p>
                <p className="text-[11px] text-gray-600 leading-tight pl-4">{storeAddress}</p>
                <p className="text-[10px] text-gray-400 font-mono pl-4">
                  {storeLat.toFixed(5)}, {storeLon.toFixed(5)}
                </p>
              </div>

              {/* Destination Customer Location */}
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200/80 space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  2. Titik Tujuan Pengantaran:
                </span>
                <p className="font-extrabold text-gray-900 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{customerName}</span>
                  <span className="text-gray-500 font-normal">({customerPhone})</span>
                </p>
                <p className="text-[11px] text-gray-600 leading-tight pl-4">{customerAddress}</p>
                <p className="text-[10px] text-gray-400 font-mono pl-4">
                  {destLat.toFixed(5)}, {destLon.toFixed(5)}
                </p>
              </div>

              {/* Order Items Summary */}
              {items && items.length > 0 && (
                <div className="bg-white rounded-2xl p-3 border border-gray-200/80 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-extrabold text-gray-900 text-xs border-b border-gray-100 pb-1.5">
                    <Package className="w-4 h-4 text-[#063104]" />
                    <span>Barang yang Dibawa ({items.length} item)</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {items.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-800 font-bold truncate max-w-[170px]">
                          {it.name || it.productName}
                        </span>
                        <span className="text-gray-500 shrink-0">
                          {it.quantity} x {formatCurrency(it.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick External Navigation Links */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2">
                <a
                  href={gmapsNavUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>Buka Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200" />
                </a>

                <a
                  href={wazeNavUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                  title="Navigasi Waze"
                >
                  <span>Waze</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-[#063104] font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-300 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>WhatsApp Pembeli</span>
                </a>

                {onConfirmReceipt && (
                  <button
                    type="button"
                    onClick={() => onConfirmReceipt(order.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                    title="Selesaikan Pengiriman"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesai</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
