# Pronóstico

App de clima en tiempo real con React 19 + Vite + Tailwind CSS v4 + Lucide.
Datos de [Open-Meteo](https://open-meteo.com/) (gratis, sin clave de API).

## Uso

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
```

## Estructura

- `src/lib/api.js` – pronóstico, autocompletado de ciudades y detección de ubicación (GPS → IP → Madrid).
- `src/lib/weather.js` – códigos WMO → texto/icono, temas de color y formatos de fecha/hora.
- `src/components/` – `SearchBar`, `CurrentWeather`, `HourlyForecast`, `DailyForecast`, `WeatherIcon`.
- `src/App.jsx` – estado, fondo dinámico según clima y día/noche, refresco cada 10 min.
