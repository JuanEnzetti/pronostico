// Códigos meteorológicos WMO usados por Open-Meteo → texto, icono y tema visual.

const CODES = {
  0: { label: 'Despejado', icon: 'clear' },
  1: { label: 'Mayormente despejado', icon: 'mostlyClear' },
  2: { label: 'Parcialmente nublado', icon: 'partly' },
  3: { label: 'Nublado', icon: 'cloudy' },
  45: { label: 'Niebla', icon: 'fog' },
  48: { label: 'Niebla con escarcha', icon: 'fog' },
  51: { label: 'Llovizna ligera', icon: 'drizzle' },
  53: { label: 'Llovizna', icon: 'drizzle' },
  55: { label: 'Llovizna intensa', icon: 'drizzle' },
  56: { label: 'Llovizna helada', icon: 'drizzle' },
  57: { label: 'Llovizna helada intensa', icon: 'drizzle' },
  61: { label: 'Lluvia ligera', icon: 'rain' },
  63: { label: 'Lluvia', icon: 'rain' },
  65: { label: 'Lluvia intensa', icon: 'heavyRain' },
  66: { label: 'Lluvia helada', icon: 'rain' },
  67: { label: 'Lluvia helada intensa', icon: 'heavyRain' },
  71: { label: 'Nevada ligera', icon: 'snow' },
  73: { label: 'Nevada', icon: 'snow' },
  75: { label: 'Nevada intensa', icon: 'heavySnow' },
  77: { label: 'Granos de nieve', icon: 'snow' },
  80: { label: 'Chubascos ligeros', icon: 'rain' },
  81: { label: 'Chubascos', icon: 'rain' },
  82: { label: 'Chubascos fuertes', icon: 'heavyRain' },
  85: { label: 'Chubascos de nieve', icon: 'snow' },
  86: { label: 'Chubascos de nieve fuertes', icon: 'heavySnow' },
  95: { label: 'Tormenta', icon: 'storm' },
  96: { label: 'Tormenta con granizo', icon: 'hail' },
  99: { label: 'Tormenta con granizo fuerte', icon: 'hail' },
}

export function describeWeather(code) {
  return CODES[code] ?? { label: 'Desconocido', icon: 'cloudy' }
}

/** Clave de tema visual según condición y si es de día o de noche. */
export function getThemeKey(code, isDay) {
  const { icon } = describeWeather(code)
  switch (icon) {
    case 'storm':
    case 'hail':
      return 'storm'
    case 'snow':
    case 'heavySnow':
      return 'snow'
    case 'drizzle':
    case 'rain':
    case 'heavyRain':
      return isDay ? 'rain' : 'rainNight'
    case 'fog':
      return 'fog'
    case 'cloudy':
      return isDay ? 'cloudy' : 'nightCloudy'
    case 'partly':
      return isDay ? 'partly' : 'night'
    default:
      return isDay ? 'clear' : 'night'
  }
}

// Clases completas (no generadas dinámicamente) para que Tailwind las detecte.
export const THEMES = {
  clear: { bg: 'bg-linear-to-br from-sky-600 via-orange-500 to-amber-500', glow: 'bg-amber-200/50' },
  partly: { bg: 'bg-linear-to-br from-sky-700 via-sky-500 to-amber-400', glow: 'bg-amber-100/40' },
  cloudy: { bg: 'bg-linear-to-br from-slate-500 via-slate-600 to-sky-900', glow: 'bg-slate-200/25' },
  night: { bg: 'bg-linear-to-br from-slate-950 via-indigo-950 to-indigo-800', glow: 'bg-indigo-300/20' },
  nightCloudy: { bg: 'bg-linear-to-br from-slate-950 via-slate-800 to-slate-700', glow: 'bg-slate-300/15' },
  rain: { bg: 'bg-linear-to-br from-slate-600 via-slate-700 to-blue-950', glow: 'bg-sky-300/20' },
  rainNight: { bg: 'bg-linear-to-br from-slate-950 via-slate-900 to-blue-950', glow: 'bg-sky-400/15' },
  storm: { bg: 'bg-linear-to-br from-gray-950 via-violet-950 to-slate-900', glow: 'bg-violet-400/20' },
  snow: { bg: 'bg-linear-to-br from-slate-400 via-sky-700 to-indigo-800', glow: 'bg-white/30' },
  fog: { bg: 'bg-linear-to-br from-zinc-500 via-slate-600 to-zinc-800', glow: 'bg-zinc-100/25' },
}

// --- Utilidades de formato. Open-Meteo devuelve horas locales de la ubicación
// (timezone=auto) como "YYYY-MM-DDTHH:mm" sin zona, así que las leemos como texto.

export const hourOf = (iso) => iso.slice(11, 16)

export function dayLabel(isoDate, index) {
  if (index === 0) return 'Hoy'
  if (index === 1) return 'Mañana'
  const [y, m, d] = isoDate.split('-').map(Number)
  const s = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(new Date(y, m - 1, d))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function shortDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
}

export function windDirection(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  return dirs[Math.round(deg / 45) % 8]
}

export function longDateAt(utcOffsetSeconds) {
  const now = new Date(Date.now() + utcOffsetSeconds * 1000)
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(now)
}

function hourAt(hourly, i) {
  return {
    time: hourly.time[i],
    temp: hourly.temperature_2m[i],
    code: hourly.weather_code[i],
    isDay: hourly.is_day[i] === 1,
    precip: hourly.precipitation_probability?.[i] ?? null,
  }
}

/** Las próximas 24 horas a partir de la hora actual de la ubicación. */
export function next24Hours(weather) {
  const { hourly, current } = weather
  const nowKey = current.time.slice(0, 13)
  let start = hourly.time.findIndex((t) => t.slice(0, 13) === nowKey)
  if (start < 0) start = 0
  const end = Math.min(start + 24, hourly.time.length)
  return Array.from({ length: end - start }, (_, i) => hourAt(hourly, start + i))
}

/** Las 24 horas (00:00–23:00) de un día concreto ("YYYY-MM-DD"). */
export function hoursForDay(weather, isoDate) {
  const { hourly } = weather
  const out = []
  hourly.time.forEach((t, i) => {
    if (t.startsWith(isoDate)) out.push(hourAt(hourly, i))
  })
  return out
}
