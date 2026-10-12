# Haridwar Block Dashboard

Vite + React + TypeScript dashboard built from `src/data/Block-Boundary.geojson` (6 blocks of Haridwar district with census attributes).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## What it shows
- District / block KPIs: population, households, sex ratio, literacy, work participation, density
- Choropleth map (Leaflet) switchable between 8 indicators; click a block to focus the dashboard on it
- Charts: indicator ranking, men vs women literacy, livelihood mix
- Sortable table of all blocks

## Swap in other data
Replace the GeoJSON in `src/data/`. Field names follow the census layout (`TOT_P`, `P_LIT`, `TOT_WORK_P`, ...); derived indicators live in `src/metrics.ts`.
