import dotenv from 'dotenv';
dotenv.config();

// ============================================================
// Biteship Shipping API Service — Optimized with In-Memory Cache
// Rates API: Rp 5/request | Tracking API: Rp 10/request | Area API: Rp 2/request
// ============================================================

const BITESHIP_BASE_URL = 'https://api.biteship.com';
const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || '';

// In-memory cache to avoid repeated API calls
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const ratesCache = new Map<string, CacheEntry<any>>();
const trackingCache = new Map<string, CacheEntry<any>>();

const RATES_CACHE_TTL = 30 * 60 * 1000;    // 30 minutes for rates
const TRACKING_CACHE_TTL = 2 * 60 * 1000;   // 2 minutes for tracking (needs to be more fresh)

function getCacheKey(prefix: string, params: Record<string, any>): string {
  return `${prefix}:${JSON.stringify(params)}`;
}

function getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key);
  }
  return null;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// Periodically clean expired cache entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ratesCache.entries()) {
    if (entry.expiresAt < now) ratesCache.delete(key);
  }
  for (const [key, entry] of trackingCache.entries()) {
    if (entry.expiresAt < now) trackingCache.delete(key);
  }
}, 10 * 60 * 1000);

async function biteshipFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!BITESHIP_API_KEY) {
    throw new Error('BITESHIP_API_KEY is not configured');
  }

  const url = `${BITESHIP_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': BITESHIP_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`[Biteship] API Error ${response.status}:`, data);
    throw new Error(data?.error || data?.message || `Biteship API error: ${response.status}`);
  }

  return data;
}

// ============================================================
// Rates API — Get shipping rates (cached for 30 min)
// Only GoSend and GrabExpress for instant delivery
// ============================================================

export interface RatesRequest {
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  couriers: string;  // "gosend,grab" 
  items: Array<{
    name: string;
    value: number;
    weight: number;
    quantity: number;
    length?: number;
    width?: number;
    height?: number;
  }>;
}

export interface CourierRate {
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  description: string;
  price: number;
  type: string;
  shipment_duration_range: string;
  shipment_duration_unit: string;
}

export interface RatesResponse {
  success: boolean;
  origin: any;
  destination: any;
  couriers?: CourierRate[];
  pricing?: CourierRate[];
}

export async function getRates(params: RatesRequest): Promise<RatesResponse> {
  // Round coordinates to 4 decimal places for cache key consistency
  const cacheParams = {
    olat: Math.round(params.origin_latitude * 10000) / 10000,
    olon: Math.round(params.origin_longitude * 10000) / 10000,
    dlat: Math.round(params.destination_latitude * 10000) / 10000,
    dlon: Math.round(params.destination_longitude * 10000) / 10000,
    couriers: params.couriers,
    totalWeight: params.items.reduce((sum, i) => sum + (i.weight * i.quantity), 0),
  };

  const cacheKey = getCacheKey('rates', cacheParams);
  const cached = getFromCache(ratesCache, cacheKey);
  if (cached) {
    console.log('[Biteship] Rates served from cache');
    return cached;
  }

  console.log('[Biteship] Fetching rates from API...');
  const result = await biteshipFetch('/v1/rates/couriers', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  setCache(ratesCache, cacheKey, result, RATES_CACHE_TTL);
  return result;
}

// ============================================================
// Orders API — Create, track, cancel courier bookings
// ============================================================

export interface CreateOrderRequest {
  origin_contact_name: string;
  origin_contact_phone: string;
  origin_address: string;
  origin_coordinate: { latitude: number; longitude: number };
  origin_postal_code?: number;
  destination_contact_name: string;
  destination_contact_phone: string;
  destination_address: string;
  destination_coordinate: { latitude: number; longitude: number };
  destination_postal_code?: number;
  courier_company: string;    // "gosend" or "grab"
  courier_type: string;       // "instant"
  delivery_type: string;      // "now" or "later"
  order_note?: string;
  items: Array<{
    name: string;
    value: number;
    weight: number;
    quantity: number;
  }>;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  object: string;
  id: string;
  shipper: any;
  origin: any;
  destination: any;
  courier: {
    tracking_id: string;
    waybill_id: string;
    company: string;
    name: string;
    phone: string;
    type: string;
    link: string;
    driver_name?: string;
    driver_phone?: string;
    driver_plate_number?: string;
  };
  status: string;
  price: number;
}

export async function createCourierOrder(params: CreateOrderRequest): Promise<CreateOrderResponse> {
  console.log('[Biteship] Creating courier order...');
  const result = await biteshipFetch('/v1/orders', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return result;
}

// ============================================================
// Tracking API — Get order tracking info (cached for 2 min)
// ============================================================

export async function trackCourierOrder(biteshipOrderId: string): Promise<any> {
  const cacheKey = getCacheKey('tracking', { id: biteshipOrderId });
  const cached = getFromCache(trackingCache, cacheKey);
  if (cached) {
    console.log('[Biteship] Tracking served from cache');
    return cached;
  }

  console.log('[Biteship] Fetching tracking from API...');
  const result = await biteshipFetch(`/v1/orders/${biteshipOrderId}`, {
    method: 'GET',
  });

  setCache(trackingCache, cacheKey, result, TRACKING_CACHE_TTL);
  return result;
}

// ============================================================
// Cancel Order
// ============================================================

export async function cancelCourierOrder(biteshipOrderId: string): Promise<any> {
  console.log('[Biteship] Cancelling order:', biteshipOrderId);
  const result = await biteshipFetch(`/v1/orders/${biteshipOrderId}`, {
    method: 'DELETE',
  });
  // Invalidate tracking cache for this order
  trackingCache.delete(getCacheKey('tracking', { id: biteshipOrderId }));
  return result;
}

// ============================================================
// Utility: Clear all caches (admin action)
// ============================================================

export function clearBiteshipCache(): void {
  ratesCache.clear();
  trackingCache.clear();
  console.log('[Biteship] All caches cleared');
}

// ============================================================
// Utility: Check if Biteship is configured
// ============================================================

export function isBiteshipConfigured(): boolean {
  return !!BITESHIP_API_KEY && BITESHIP_API_KEY.length > 0;
}
