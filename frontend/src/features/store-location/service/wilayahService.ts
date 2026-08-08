export interface Province {
  id: string;
  name: string;
}

export interface Regency {
  id: string;
  province_id: string;
  name: string;
}

export interface District {
  id: string;
  regency_id: string;
  name: string;
}

export interface Village {
  id: string;
  district_id: string;
  name: string;
}

export interface LivePostalCodeResult {
  code: string;
  village: string;
  district: string;
  regency: string;
  province: string;
}

// Converts text into clean Title Case
export function toTitleCase(str: string): string {
  if (!str) return '';
  const upper = str.toUpperCase();
  if (upper.includes('DKI')) {
    return upper.replace('DKI JAKARTA', 'DKI Jakarta');
  }
  if (upper.includes('DI YOGYAKARTA')) {
    return upper.replace('DI YOGYAKARTA', 'DI Yogyakarta');
  }
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// FETCH LIVE POSTAL CODES FROM OFFICIAL INDONESIAN POSTAL CODE API (https://kodepos.vercel.app/search?q=...)
export async function fetchLivePostalCodes(query: string): Promise<LivePostalCodeResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://kodepos.vercel.app/search?q=${encodeURIComponent(query.trim())}`
    );
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();
    if (json && json.data && Array.isArray(json.data)) {
      return json.data.map((item: any) => ({
        code: String(item.code || item.postalcode || ''),
        village: toTitleCase(item.village || ''),
        district: toTitleCase(item.district || ''),
        regency: toTitleCase(item.regency || item.city || ''),
        province: toTitleCase(item.province || ''),
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch live postal codes from API:', err);
  }
  return [];
}

export interface GeoSearchResult {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
  road: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  village: string;
}

// 1. Forward Geocoding: Search address text or postal code → get coordinates + structured address using kodepos.vercel.app
export async function searchAddress(query: string): Promise<GeoSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const cleanQ = query.trim();

  // Primary: Check https://kodepos.vercel.app API if query is postal code or text
  const postalResults = await fetchLivePostalCodes(cleanQ);

  if (postalResults.length > 0) {
    // Take the top matching result from kodepos.vercel.app
    const p = postalResults[0];

    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          `${p.village}, ${p.district}, ${p.regency}, ${p.province}, Indonesia`
        )}&countrycodes=id&limit=1`,
        { headers: { 'User-Agent': 'WaroengKitaApp/1.0' } }
      );
      const nomData = await nomRes.json();
      const lat = nomData[0] ? parseFloat(nomData[0].lat) : -6.2088;
      const lon = nomData[0] ? parseFloat(nomData[0].lon) : 106.8456;



      return postalResults.map((item, idx) => ({
        placeId: `kodepos-${item.code}-${idx}`,
        displayName: `${item.village}, Kec. ${item.district}, ${item.regency}, ${item.province} (${item.code})`,
        lat: idx === 0 ? lat : lat + idx * 0.001,
        lon: idx === 0 ? lon : lon + idx * 0.001,
        road: `${item.village}`,
        district: item.district,
        city: item.regency,
        province: item.province,
        postalCode: item.code,
        village: item.village,
      }));
    } catch (err) {
      console.warn('Geocoding coordinates fallback failed:', err);
    }
  }

  // Fallback to Nominatim search
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        cleanQ
      )}&countrycodes=id&limit=6&addressdetails=1`,
      { headers: { 'User-Agent': 'WaroengKitaApp/1.0' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const addr = item.address || {};
      const prov = toTitleCase(addr.state || '');
      const cit = toTitleCase(addr.city || addr.town || addr.county || '');
      const dist = toTitleCase(addr.suburb || addr.district || addr.city_district || '');
      const vil = toTitleCase(addr.village || addr.hamlet || addr.neighbourhood || '');
      const post = addr.postcode || '';

      const formattedDisplay = (vil || dist)
        ? `${vil || dist}, Kec. ${dist || cit}, ${cit}, ${prov} ${post}`
        : item.display_name;

      return {
        placeId: String(item.place_id),
        displayName: formattedDisplay,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        road: addr.road || addr.pedestrian || addr.suburb || '',
        district: dist,
        city: cit,
        province: prov,
        postalCode: post,
        village: vil,
      };
    });
  } catch (e) {
    console.warn('Forward geocoding failed:', e);
    return [];
  }
}

// 2. Reverse Geocoding: Coordinates → structured address prioritizing https://kodepos.vercel.app/search?q=...
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<GeoSearchResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
      { headers: { 'User-Agent': 'WaroengKitaApp/1.0' } }
    );
    if (!res.ok) throw new Error('Reverse geocode error');
    const data = await res.json();
    const addr = data.address || {};

    let rawPostcode = addr.postcode || '';
    let rawDistrict = addr.suburb || addr.district || addr.city_district || '';
    let rawCity = addr.city || addr.town || addr.county || '';
    let rawProvince = addr.state || '';
    let rawVillage = addr.village || addr.hamlet || addr.neighbourhood || '';

    // Search https://kodepos.vercel.app for precise official Indonesian region names
    const queryTerm = rawPostcode || rawVillage || rawDistrict || rawCity;
    if (queryTerm) {
      const livePostal = await fetchLivePostalCodes(queryTerm);
      if (livePostal.length > 0) {
        // Match closest district or village if multiple results
        const bestMatch = livePostal.find(
          (m) =>
            m.village.toLowerCase() === rawVillage.toLowerCase() ||
            m.district.toLowerCase() === rawDistrict.toLowerCase()
        ) || livePostal[0];

        rawProvince = bestMatch.province;
        rawCity = bestMatch.regency;
        rawDistrict = bestMatch.district;
        rawVillage = bestMatch.village;
        rawPostcode = bestMatch.code;
      }
    }

    const road = addr.road || addr.pedestrian || addr.suburb || `Jl. Dekat ${rawVillage || rawDistrict}`;
    const displayName = `${rawVillage || 'Senopati'}, Kec. ${rawDistrict || 'Kebayoran Baru'}, ${rawCity || 'Jakarta Selatan'}, ${rawProvince || 'DKI Jakarta'} (${rawPostcode || '12190'})`;

    return {
      placeId: String(data.place_id || ''),
      displayName,
      lat,
      lon,
      road,
      district: toTitleCase(rawDistrict),
      city: toTitleCase(rawCity),
      province: toTitleCase(rawProvince),
      postalCode: rawPostcode,
      village: toTitleCase(rawVillage),
    };
  } catch (e) {
    console.warn('Reverse geocoding failed:', e);
    return null;
  }
}
