import { useEffect, useRef } from 'react'
import { Clock, Droplet, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react'
import WeatherIcon from './WeatherIcon'
import { dayLabel, describeWeather, hourOf, hoursForDay, next24Hours, shortDate } from '../lib/weather'

export default function HourlyForecast({ weather, selectedDay: rawDay = 0, onSelectDay, sectionRef }) {
  const d = weather.daily
  const selectedDay = Math.min(Math.max(rawDay, 0), d.time.length - 1)
  const isToday = selectedDay === 0
  const date = d.time[selectedDay]
  const hours = isToday ? next24Hours(weather) : hoursForDay(weather, date)
  const nowKey = weather.current.time.slice(0, 13)
  const scroller = useRef(null)
  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  // Al cambiar de día, volver al inicio de la tira.
  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 })
  }, [selectedDay, weather])

  const lastDay = d.time.length - 1

  return (
    <section ref={sectionRef} className="glass scroll-mt-4 rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xs font-medium tracking-wide text-white/70 uppercase">
            <Clock className="size-4" />
            {isToday ? 'Próximas 24 horas' : `${dayLabel(date, selectedDay)} · ${shortDate(date)}`}
          </h2>
          {!isToday && (
            <p className="mt-1 text-sm text-white/80">
              {describeWeather(d.weather_code[selectedDay]).label} · Máx. {Math.round(d.temperature_2m_max[selectedDay])}°
              · Mín. {Math.round(d.temperature_2m_min[selectedDay])}° · Lluvia {d.precipitation_probability_max[selectedDay] ?? 0}%
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isToday && (
            <button
              onClick={() => onSelectDay(0)}
              className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30"
            >
              <Undo2 className="size-3.5" /> Hoy
            </button>
          )}
          <button
            onClick={() => onSelectDay(selectedDay - 1)}
            disabled={selectedDay === 0}
            className="rounded-full p-1.5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Día anterior"
            title="Día anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => onSelectDay(selectedDay + 1)}
            disabled={selectedDay === lastDay}
            className="rounded-full p-1.5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Día siguiente"
            title="Día siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div ref={scroller} className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
          {hours.map((h, i) => {
            const isNow = h.time.slice(0, 13) === nowKey
            return (
              <div
                key={h.time}
                className={`flex min-w-[4.5rem] snap-start flex-col items-center gap-2 rounded-2xl px-2 py-3 ${
                  isNow ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <span className="text-sm text-white/80">{isNow && isToday && i === 0 ? 'Ahora' : hourOf(h.time)}</span>
                <WeatherIcon code={h.code} isDay={h.isDay} className="size-7" />
                <span className="text-lg font-semibold">{Math.round(h.temp)}°</span>
                <span
                  className={`flex items-center gap-0.5 text-xs ${h.precip >= 20 ? 'text-sky-200' : 'text-white/40'}`}
                  title="Probabilidad de lluvia"
                >
                  <Droplet className="size-3" />
                  {h.precip ?? 0}%
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 hidden justify-end gap-1 sm:flex">
          <button onClick={() => scrollBy(-1)} className="rounded-full px-2 py-0.5 text-xs text-white/60 hover:bg-white/15 hover:text-white" aria-label="Desplazar horas a la izquierda">
            ← horas
          </button>
          <button onClick={() => scrollBy(1)} className="rounded-full px-2 py-0.5 text-xs text-white/60 hover:bg-white/15 hover:text-white" aria-label="Desplazar horas a la derecha">
            horas →
          </button>
        </div>
      </div>
    </section>
  )
}
