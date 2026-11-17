import { useCallback, useEffect, useRef, useState } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import SearchBar from './components/SearchBar'
import CurrentWeather from './components/CurrentWeather'
import HourlyForecast from './components/HourlyForecast'
import DailyForecast from './components/DailyForecast'
import { detectLocation, fetchWeather } from './lib/api'
import { THEMES, getThemeKey } from './lib/weather'

const REFRESH_MS = 10 * 60 * 1000

function Background({ themeKey }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {Object.entries(THEMES).map(([key, t]) => (
        <div
          key={key}
          className={`absolute inset-0 transition-opacity duration-1000 ${t.bg} ${key === themeKey ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className={`absolute -top-32 -right-24 size-[28rem] rounded-full blur-3xl ${t.glow}`} />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="mx-auto h-24 w-64 rounded-2xl bg-white/10 sm:mx-0" />
      <div className="h-32 rounded-3xl bg-white/10" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/10" />
        ))}
      </div>
      <div className="h-36 rounded-3xl bg-white/10" />
    </div>
  )
}

export default function App() {
  const [place, setPlace] = useState(null)
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('locating') // locating | loading | ready | error
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const requestId = useRef(0)
  const hourlyRef = useRef(null)

  const selectDay = useCallback((i) => {
    setSelectedDay(i)
    // En pantallas pequeñas el panel por horas queda fuera de vista: lo traemos.
    const el = hourlyRef.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const loadWeather = useCallback(async (p, { silent = false } = {}) => {
    const id = ++requestId.current
    if (!silent) setStatus('loading')
    setError(null)
    try {
      const data = await fetchWeather(p.latitude, p.longitude)
      if (id !== requestId.current) return // respuesta obsoleta
      setPlace(p)
      setWeather(data)
      if (!silent) setSelectedDay(0) // nueva ubicación → volver a "Hoy"
      setStatus('ready')
    } catch {
      if (id !== requestId.current) return
      setError('No se pudo obtener el pronóstico. Revisa tu conexión e inténtalo de nuevo.')
      setStatus('error')
    }
  }, [])

  const locate = useCallback(async () => {
    setStatus('locating')
    const p = await detectLocation()
    await loadWeather(p)
  }, [loadWeather])

  useEffect(() => {
    locate()
  }, [locate])

  // Refresco automático para mantener los datos en tiempo real.
  useEffect(() => {
    if (!place) return
    const t = setInterval(() => loadWeather(place, { silent: true }), REFRESH_MS)
    return () => clearInterval(t)
  }, [place, loadWeather])

  const themeKey = weather ? getThemeKey(weather.current.weather_code, weather.current.is_day === 1) : 'cloudy'
  const busy = status === 'locating' || status === 'loading'

  return (
    <div className="min-h-dvh text-white">
      <Background themeKey={themeKey} />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <SearchBar onSelect={(p) => loadWeather(p)} onLocate={locate} locating={status === 'locating'} />

        {status === 'locating' && !weather && (
          <p className="text-center text-sm text-white/70">Detectando tu ubicación…</p>
        )}

        {status === 'error' && (
          <div className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
            <CloudOff className="size-10 text-white/70" />
            <p className="text-white/85">{error}</p>
            <button
              onClick={() => (place ? loadWeather(place) : locate())}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"
            >
              <RefreshCw className="size-4" /> Reintentar
            </button>
          </div>
        )}

        {busy && !weather && <Skeleton />}

        {weather && place && (
          <div className={`flex flex-col gap-6 transition-opacity duration-300 ${busy ? 'opacity-60' : 'opacity-100'}`}>
            <CurrentWeather place={place} weather={weather} />
            <HourlyForecast
              weather={weather}
              selectedDay={selectedDay}
              onSelectDay={selectDay}
              sectionRef={hourlyRef}
            />
            <DailyForecast weather={weather} selectedDay={selectedDay} onSelectDay={selectDay} />
          </div>
        )}

        <footer className="pt-2 text-center text-xs text-white/50">
          Datos meteorológicos de{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline hover:text-white/80">
            Open-Meteo
          </a>{' '}
          · Se actualiza cada 10 minutos
        </footer>
      </main>
    </div>
  )
}
