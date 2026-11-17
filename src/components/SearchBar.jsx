import { useEffect, useRef, useState } from 'react'
import { Search, MapPin, LocateFixed, LoaderCircle, X } from 'lucide-react'
import { searchCities } from '../lib/api'

export default function SearchBar({ onSelect, onLocate, locating }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)
  const inputRef = useRef(null)

  // Autocompletado con debounce y cancelación de peticiones obsoletas.
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const list = await searchCities(term, ctrl.signal)
        setResults(list)
        setActive(list.length ? 0 : -1)
        setOpen(true)
      } catch (e) {
        if (e.name !== 'AbortError') setResults([])
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 280)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query])

  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const choose = (place) => {
    onSelect(place)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e) => {
    if (!open || !results.length) {
      if (e.key === 'Escape') setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0) choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showEmpty = open && !loading && query.trim().length >= 2 && results.length === 0

  return (
    <div className="flex w-full items-center gap-2">
      <div ref={boxRef} className="relative flex-1">
        <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3 transition focus-within:bg-white/20 focus-within:ring-2 focus-within:ring-white/40">
          {loading ? (
            <LoaderCircle className="size-5 shrink-0 animate-spin text-white/70" />
          ) : (
            <Search className="size-5 shrink-0 text-white/70" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar ciudad…"
            aria-label="Buscar ciudad"
            role="combobox"
            aria-expanded={open}
            aria-controls="city-results"
            autoComplete="off"
            className="w-full min-w-0 bg-transparent text-base text-white placeholder:text-white/60 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded-full p-0.5 text-white/60 hover:text-white"
              aria-label="Borrar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {(open && results.length > 0) || showEmpty ? (
          <ul
            id="city-results"
            role="listbox"
            className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 py-1 shadow-2xl backdrop-blur-xl"
          >
            {showEmpty && <li className="px-4 py-3 text-sm text-white/60">No se encontraron ciudades</li>}
            {results.map((r, i) => (
              <li key={r.id} role="option" aria-selected={i === active}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(r)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                    i === active ? 'bg-white/15' : ''
                  }`}
                >
                  <MapPin className="size-4 shrink-0 text-white/50" />
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-white">{r.name}</span>
                    <span className="text-sm text-white/60">
                      {[r.region, r.country].filter(Boolean).length ? ', ' : ''}
                      {[r.region, r.country].filter(Boolean).join(', ')}
                    </span>
                  </span>
                  {r.countryCode && (
                    <span className="ml-auto shrink-0 text-xs font-medium tracking-wider text-white/40">
                      {r.countryCode}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        onClick={onLocate}
        disabled={locating}
        title="Usar mi ubicación"
        aria-label="Usar mi ubicación"
        className="glass grid size-12 shrink-0 place-items-center rounded-2xl text-white transition hover:bg-white/20 disabled:opacity-60"
      >
        {locating ? <LoaderCircle className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
      </button>
    </div>
  )
}
