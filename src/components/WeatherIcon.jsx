import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  CloudHail,
} from 'lucide-react'
import { describeWeather } from '../lib/weather'

const DAY = {
  clear: Sun,
  mostlyClear: CloudSun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  heavyRain: CloudRainWind,
  snow: CloudSnow,
  heavySnow: Snowflake,
  storm: CloudLightning,
  hail: CloudHail,
}

const NIGHT = { ...DAY, clear: Moon, mostlyClear: CloudMoon, partly: CloudMoon }

const COLORS = {
  clear: 'text-amber-300',
  mostlyClear: 'text-amber-200',
  partly: 'text-amber-100',
  storm: 'text-yellow-200',
  hail: 'text-sky-100',
}

export default function WeatherIcon({ code, isDay = true, className = 'size-6', strokeWidth = 1.75 }) {
  const { icon, label } = describeWeather(code)
  const Icon = (isDay ? DAY : NIGHT)[icon] ?? Cloud
  const color = isDay ? COLORS[icon] ?? 'text-white' : 'text-indigo-100'
  return <Icon className={`${className} ${color} drop-shadow`} strokeWidth={strokeWidth} aria-label={label} />
}
