import { useMemo, useState } from 'react'
import {
  blocks, district, districtName, metrics, fmt, fmtCompact, type Stats,
} from './metrics'
import MapView from './components/MapView'
import Charts from './components/Charts'
import BlockTable from './components/BlockTable'

function Delta({ value, base, unit, digits = 1 }: { value: number; base: number; unit: string; digits?: number }) {
  const d = value - base
  const sign = d > 0 ? '+' : d < 0 ? '−' : ''
  return (
    <span className={d >= 0 ? 'delta up' : 'delta down'}>
      {sign}{fmt(Math.abs(d), digits)} {unit} vs district
    </span>
  )
}

export default function App() {
  const [metricKey, setMetricKey] = useState<keyof Stats>('population')
  const [selected, setSelected] = useState<string | null>(null)

  const metric = metrics.find((m) => m.key === metricKey)!
  const block = useMemo(() => blocks.find((b) => b.name === selected) ?? null, [selected])
  const s = block ? block.stats : district

  const kpis = [
    { label: 'Population', value: fmt(s.population), sub: block ? `${fmt((s.population / district.population) * 100, 1)}% of district` : `${blocks.length} blocks` },
    { label: 'Households', value: fmt(s.households), sub: `${fmt(s.population / s.households, 1)} people per household` },
    { label: 'Sex ratio', value: fmt(s.sexRatio), sub: block ? <Delta value={s.sexRatio} base={district.sexRatio} unit="" digits={0} /> : 'females per 1,000 males' },
    { label: 'Literacy', value: `${fmt(s.literacy, 1)}%`, sub: block ? <Delta value={s.literacy} base={district.literacy} unit="pts" /> : `women ${fmt(s.femaleLiteracy, 1)}% · men ${fmt(s.maleLiteracy, 1)}%` },
    { label: 'Work participation', value: `${fmt(s.wpr, 1)}%`, sub: block ? <Delta value={s.wpr} base={district.wpr} unit="pts" /> : `women ${fmt(s.femaleWpr, 1)}%` },
    { label: 'Density', value: fmt(s.density), sub: `per km² over ${fmt(s.areaKm2)} km²` },
  ]

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>{districtName} district</h1>
          <p className="lede">
            Census profile of {blocks.length} blocks · {fmtCompact(district.population)} people
          </p>
        </div>
        <div className="scope">
          <span className="scope-label">Showing</span>
          <strong>{block ? `${block.name} block` : 'Whole district'}</strong>
          {block && (
            <button className="link" onClick={() => setSelected(null)}>
              Clear selection
            </button>
          )}
        </div>
      </header>

      <section className="kpis" aria-label="Key figures">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </section>

      <section className="stage">
        <div className="map-col">
          <div className="map-bar">
            <label htmlFor="metric">Colour map by</label>
            <select id="metric" value={metricKey} onChange={(e) => setMetricKey(e.target.value as keyof Stats)}>
              {metrics.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <MapView metric={metric} selected={selected} onSelect={setSelected} />
        </div>
        <Charts metric={metric} selected={selected} onSelect={setSelected} />
      </section>

      <BlockTable selected={selected} onSelect={setSelected} />

      <footer className="foot">Boundaries and census attributes from Block-Boundary.geojson. Literacy rates are measured on the population aged 7 and above.</footer>
    </div>
  )
}
