import { MapPin, Thermometer, Droplets, Wind, Gauge, SunDim, Sunrise, Navigation2 } from 'lucide-react'
import WeatherIcon from './WeatherIcon'
import { describeWeather, hourOf, longDateAt, windDirection } from '../lib/weather'

function Stat({ icon: Icon, label, value, unit, extra }) {
  return (
    <div className="glass flex flex-col gap-2 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-white/70 uppercase">
        <Icon className="size-4" strokeWidth={2} />
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        {unit && <span className="text-sm text-white/70">{unit}</span>}
      </div>
      {extra && <div className="text-xs text-white/60">{extra}</div>}
    </div>
  )
}

function feelsLikeHint(diff) {
  if (diff <= -3) return 'Se siente más frío'
  if (diff >= 3) return 'Se siente más cálido'
  return 'Similar a la real'
}

function humidityHint(h) {
  if (h < 30) return 'Ambiente seco'
  if (h > 70) return 'Ambiente húmedo'
  return 'Confortable'
}

function uvHint(uv) {
  if (uv < 3) return 'Bajo'
  if (uv < 6) return 'Moderado'
  if (uv < 8) return 'Alto'
  if (uv < 11) return 'Muy alto'
  return 'Extremo'
}

export default function CurrentWeather({ place, weather }) {
  const c = weather.current
  const today = {
    max: weather.daily.temperature_2m_max[0],
    min: weather.daily.temperature_2m_min[0],
    uv: weather.daily.uv_index_max[0],
    sunrise: weather.daily.sunrise[0],
    sunset: weather.daily.sunset[0],
  }
  const isDay = c.is_day === 1
  const { label } = describeWeather(c.weather_code)
  const subtitle = [place.district, place.region, place.country]
    .filter((v, i, arr) => v && v !== place.name && arr.indexOf(v) === i)
    .join(', ')

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
        <div className="flex items-center gap-2 text-white/80">
          <MapPin className="size-4" />
          <span className="text-sm font-medium">
            {place.source === 'gps' ? 'Tu ubicación' : place.source === 'ip' ? 'Ubicación aproximada' : 'Ciudad'}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{place.name}</h1>
        {subtitle && <p className="text-white/75">{subtitle}</p>}
        <p className="mt-1 text-sm text-white/60 first-letter:uppercase">{longDateAt(weather.utc_offset_seconds)}</p>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <WeatherIcon code={c.weather_code} isDay={isDay} className="size-24 sm:size-28" strokeWidth={1.25} />
          <div>
            <div className="text-7xl leading-none font-extralight tracking-tighter sm:text-8xl">
              {Math.round(c.temperature_2m)}
              <span className="align-top text-4xl font-light text-white/80">°</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 sm:items-end">
          <p className="text-xl font-medium">{label}</p>
          <p className="text-white/75">
            Máx. {Math.round(today.max)}° · Mín. {Math.round(today.min)}°
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat
          icon={Thermometer}
          label="Sensación"
          value={Math.round(c.apparent_temperature)}
          unit="°C"
          extra={feelsLikeHint(c.apparent_temperature - c.temperature_2m)}
        />
        <Stat
          icon={Droplets}
          label="Humedad"
          value={c.relative_humidity_2m}
          unit="%"
          extra={humidityHint(c.relative_humidity_2m)}
        />
        <Stat
          icon={Wind}
          label="Viento"
          value={Math.round(c.wind_speed_10m)}
          unit="km/h"
          extra={
            <span className="inline-flex items-center gap-1">
              <Navigation2
                className="size-3"
                style={{ transform: `rotate(${(c.wind_direction_10m + 180) % 360}deg)` }}
                fill="currentColor"
              />
              {windDirection(c.wind_direction_10m)} · ráfagas {Math.round(c.wind_gusts_10m)} km/h
            </span>
          }
        />
        <Stat icon={Gauge} label="Presión" value={Math.round(c.pressure_msl)} unit="hPa" extra="Nivel del mar" />
        <Stat icon={SunDim} label="Índice UV" value={Math.round(today.uv ?? 0)} extra={`${uvHint(today.uv ?? 0)} (máx. hoy)`} />
        <Stat
          icon={Sunrise}
          label="Sol"
          value={hourOf(today.sunrise)}
          extra={`Puesta a las ${hourOf(today.sunset)}`}
        />
      </div>
    </section>
  )
}
