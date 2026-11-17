import { CalendarDays, Droplet } from 'lucide-react'
import WeatherIcon from './WeatherIcon'
import { dayLabel, describeWeather, shortDate } from '../lib/weather'

export default function DailyForecast({ weather, selectedDay, onSelectDay }) {
  const d = weather.daily
  const weekMin = Math.min(...d.temperature_2m_min)
  const weekMax = Math.max(...d.temperature_2m_max)
  const span = Math.max(weekMax - weekMin, 1)
  const currentTemp = weather.current.temperature_2m

  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <h2 className="mb-2 flex items-center justify-between gap-2 text-xs font-medium tracking-wide text-white/70 uppercase">
        <span className="flex items-center gap-2">
          <CalendarDays className="size-4" /> Próximos {d.time.length} días
        </span>
        <span className="text-[11px] font-normal tracking-normal normal-case text-white/50">
          Toca un día para ver sus horas
        </span>
      </h2>
      <ul className="-mx-2 flex flex-col gap-1">
        {d.time.map((date, i) => {
          const min = d.temperature_2m_min[i]
          const max = d.temperature_2m_max[i]
          const left = ((min - weekMin) / span) * 100
          const width = ((max - min) / span) * 100
          const precip = d.precipitation_probability_max[i]
          const nowPos = i === 0 ? ((currentTemp - weekMin) / span) * 100 : null
          const selected = i === selectedDay
          return (
            <li key={date}>
              <button
                onClick={() => onSelectDay(i)}
                aria-pressed={selected}
                className={`grid w-full cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl px-2 py-3 text-left ring-1 transition sm:grid-cols-[9rem_2rem_3rem_1fr] sm:gap-4 ${
                  selected
                    ? 'bg-white/20 ring-white/40'
                    : 'ring-transparent hover:bg-white/10 hover:ring-white/15 active:bg-white/15'
                }`}
              >
              <div className="min-w-0">
                <p className="truncate font-medium">{dayLabel(date, i)}</p>
                <p className="truncate text-xs text-white/60 sm:hidden">{describeWeather(d.weather_code[i]).label}</p>
                <p className="hidden text-xs text-white/60 sm:block">{shortDate(date)}</p>
              </div>
              <WeatherIcon code={d.weather_code[i]} className="size-7" />
              <span
                className={`flex w-12 items-center justify-end gap-0.5 text-xs sm:justify-start ${
                  precip >= 20 ? 'text-sky-200' : 'text-white/40'
                }`}
              >
                <Droplet className="size-3" />
                {precip ?? 0}%
              </span>
              <div className="col-span-3 flex items-center gap-3 sm:col-span-1">
                <span className="w-9 text-right text-white/70">{Math.round(min)}°</span>
                <div className="relative h-1.5 flex-1 rounded-full bg-white/15">
                  <div
                    className="absolute inset-y-0 rounded-full bg-linear-to-r from-sky-300 via-amber-200 to-orange-400"
                    style={{ left: `${left}%`, width: `${Math.max(width, 3)}%` }}
                  />
                  {nowPos !== null && (
                    <div
                      className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/40 bg-white"
                      style={{ left: `${Math.min(Math.max(nowPos, 0), 100)}%` }}
                      title="Temperatura actual"
                    />
                  )}
                </div>
                <span className="w-9 font-semibold">{Math.round(max)}°</span>
              </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
