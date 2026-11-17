// Fuentes de datos gratuitas y sin clave de API:
//  - Open-Meteo (pronóstico + geocodificación)
//  - BigDataCloud (geocodificación inversa desde coordenadas)
//  - ipapi.co / ipwho.is (ubicación aproximada por IP como respaldo)

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

const DEFAULT_PLACE = {
  name: 'Madrid',
  region: 'Comunidad de Madrid',
  country: 'España',
  latitude: 40.4168,
  longitude: -3.7038,
  source: 'default',
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchWeather(lat, lon, signal) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'pressure_msl',
      'precipitation',
    ].join(','),
    hourly: ['temperature_2m', 'weather_code', 'is_day', 'precipitation_probability'].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
      'uv_index_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  })
  return getJSON(`${FORECAST_URL}?${params}`, signal)
}

export async function searchCities(query, signal) {
  const params = new URLSearchParams({ name: query, count: '7', language: 'es', format: 'json' })
  const data = await getJSON(`${GEOCODING_URL}?${params}`, signal)
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1 ?? '',
    country: r.country ?? '',
    countryCode: r.country_code ?? '',
    latitude: r.latitude,
    longitude: r.longitude,
    source: 'search',
  }))
}

function getBrowserPosition(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Geolocalización no disponible'))
    // Si el usuario no responde al permiso, el navegador no dispara su propio timeout:
    // aplicamos uno propio para pasar al respaldo por IP.
    const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado')), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve(pos.coords)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60 * 1000 },
    )
  })
}

// Quita prefijos administrativos ("Partido de Tigre" → "Tigre").
const cleanName = (s) =>
  (s ?? '').replace(/^(Partido|Municipio|Departamento|Comuna|Distrito|Cantón|Concelho) (de |del )?/i, '').trim()

const uniq = (arr) => arr.filter((v, i) => v && !/^\d+$/.test(v) && arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)

/**
 * Nominatim (OpenStreetMap): da barrio, localidad y partido/municipio por separado.
 *   name     → lo más específico: barrio / localidad
 *   district → partido / ciudad que lo contiene (si es distinto)
 */
async function reverseNominatim(lat, lon) {
  const params = new URLSearchParams({
    lat,
    lon,
    format: 'jsonv2',
    zoom: '16',
    addressdetails: '1',
    'accept-language': 'es',
  })
  const d = await getJSON(`https://nominatim.openstreetmap.org/reverse?${params}`)
  const a = d.address
  if (!a) throw new Error('sin dirección')
  const neighbourhood = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.borough
  const locality = a.town || a.city || a.village || a.hamlet || a.municipality
  const partido = cleanName(a.county || a.state_district || a.municipality)
  const [name, ...rest] = uniq([neighbourhood, locality, partido].map(cleanName))
  if (!name) throw new Error('sin localidad')
  return {
    name,
    district: rest.join(', '),
    region: a.state || a.province || '',
    country: a.country || '',
  }
}

/** BigDataCloud (respaldo): toma el nivel administrativo más específico disponible. */
export async function reverseBigDataCloud(lat, lon) {
  const params = new URLSearchParams({ latitude: lat, longitude: lon, localityLanguage: 'es' })
  const d = await getJSON(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`)
  const admin = (d.localityInfo?.administrative ?? [])
    .filter((x) => x.adminLevel > 4 && x.name)
    .sort((x, y) => y.adminLevel - x.adminLevel)
    .map((x) => cleanName(x.name))
  const [name, ...rest] = uniq([...admin, cleanName(d.locality), cleanName(d.city)])
  return {
    name: name || d.principalSubdivision || 'Tu ubicación',
    district: rest.filter((n) => n !== d.principalSubdivision).slice(0, 1).join(''),
    region: d.principalSubdivision || '',
    country: d.countryName || '',
  }
}

export async function reverseGeocode(lat, lon) {
  try {
    return await reverseNominatim(lat, lon)
  } catch {
    try {
      return await reverseBigDataCloud(lat, lon)
    } catch {
      return { name: 'Tu ubicación', district: '', region: '', country: '' }
    }
  }
}

async function locateByIP() {
  try {
    const d = await getJSON('https://ipapi.co/json/')
    if (d.latitude == null) throw new Error('sin datos')
    return {
      name: d.city || 'Tu ubicación',
      region: d.region || '',
      country: d.country_name || '',
      latitude: d.latitude,
      longitude: d.longitude,
      source: 'ip',
    }
  } catch {
    const d = await getJSON('https://ipwho.is/')
    if (!d.success) throw new Error('sin datos')
    return {
      name: d.city || 'Tu ubicación',
      region: d.region || '',
      country: d.country || '',
      latitude: d.latitude,
      longitude: d.longitude,
      source: 'ip',
    }
  }
}

/** Detecta la ubicación: GPS del navegador → IP → ciudad por defecto. */
export async function detectLocation() {
  try {
    const { latitude, longitude } = await getBrowserPosition()
    const info = await reverseGeocode(latitude, longitude)
    return { ...info, latitude, longitude, source: 'gps' }
  } catch {
    try {
      return await locateByIP()
    } catch {
      return DEFAULT_PLACE
    }
  }
}
