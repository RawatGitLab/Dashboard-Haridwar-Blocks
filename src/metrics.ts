import type { Feature, FeatureCollection, MultiPolygon } from 'geojson'
import proj4 from 'proj4'
import raw from './data/Block-Boundary.geojson?raw'

export type Props = Record<string, number | string>
export type BlockFeature = Feature<MultiPolygon, Props>

export interface Stats {
  population: number
  households: number
  male: number
  female: number
  sexRatio: number
  literacy: number
  maleLiteracy: number
  femaleLiteracy: number
  childShare: number
  scShare: number
  stShare: number
  wpr: number
  femaleWpr: number
  areaKm2: number
  density: number
  mainWorkers: number
  marginalWorkers: number
  nonWorkers: number
  cultivators: number
  agriLabourers: number
  householdInd: number
  otherWorkers: number
}

export interface Block {
  name: string
  code: string
  stats: Stats
  feature: BlockFeature
}

const n = (p: Props, k: string) => Number(p[k] ?? 0)
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0)

/** Build stats from summed raw census counts. */
function statsFrom(sum: Record<string, number>, areaM2: number): Stats {
  const s = (k: string) => sum[k] ?? 0
  const pop = s('TOT_P')
  const area = areaM2 / 1e6
  return {
    population: pop,
    households: s('No_HH'),
    male: s('TOT_M'),
    female: s('TOT_F'),
    sexRatio: s('TOT_M') ? (s('TOT_F') / s('TOT_M')) * 1000 : 0,
    // literacy rates use the 7+ population, as in census practice
    literacy: pct(s('P_LIT'), pop - s('P_06')),
    maleLiteracy: pct(s('M_LIT'), s('TOT_M') - s('M_06')),
    femaleLiteracy: pct(s('F_LIT'), s('TOT_F') - s('F_06')),
    childShare: pct(s('P_06'), pop),
    scShare: pct(s('P_SC'), pop),
    stShare: pct(s('P_ST'), pop),
    wpr: pct(s('TOT_WORK_P'), pop),
    femaleWpr: pct(s('TOT_WORK_F'), s('TOT_F')),
    areaKm2: area,
    density: area ? pop / area : 0,
    mainWorkers: s('MAINWORK_P'),
    marginalWorkers: s('MARGWORK_P'),
    nonWorkers: s('NON_WORK_P'),
    cultivators: s('MAIN_CL_P') + s('MARG_CL_P'),
    agriLabourers: s('MAIN_AL_P') + s('MARG_AL_P'),
    householdInd: s('MAIN_HH_P') + s('MARG_HH_P'),
    otherWorkers: s('MAIN_OT_P') + s('MARG_OT_P'),
  }
}

const NUMERIC_KEYS = [
  'No_HH', 'TOT_P', 'TOT_M', 'TOT_F', 'P_06', 'M_06', 'F_06', 'P_SC', 'P_ST',
  'P_LIT', 'M_LIT', 'F_LIT', 'TOT_WORK_P', 'TOT_WORK_F', 'MAINWORK_P', 'MARGWORK_P',
  'NON_WORK_P', 'MAIN_CL_P', 'MAIN_AL_P', 'MAIN_HH_P', 'MAIN_OT_P',
  'MARG_CL_P', 'MARG_AL_P', 'MARG_HH_P', 'MARG_OT_P',
]

const collection = JSON.parse(raw) as FeatureCollection<MultiPolygon, Props>

/**
 * The boundary file stores projected metres (UTM zone 44N, EPSG:32644), not degrees,
 * although it is labelled CRS84. Leaflet needs WGS84 lon/lat, so reproject on load.
 * Files that are already in degrees are left untouched.
 */
const UTM_44N = '+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs'
type Ring = number[][]
function looksProjected(c: MultiPolygon['coordinates']) {
  const [x, y] = c[0][0][0]
  return Math.abs(x) > 180 || Math.abs(y) > 90
}
collection.features.forEach((f) => {
  if (!looksProjected(f.geometry.coordinates)) return
  f.geometry.coordinates = f.geometry.coordinates.map((poly) =>
    poly.map((ring: Ring) => ring.map(([x, y]) => proj4(UTM_44N, 'WGS84', [x, y])))
  ) as MultiPolygon['coordinates']
})

export const blocks: Block[] = (collection.features as BlockFeature[])
  .map((f) => {
    const p = f.properties
    const sum: Record<string, number> = {}
    NUMERIC_KEYS.forEach((k) => (sum[k] = n(p, k)))
    return {
      name: String(p.Name),
      code: String(p.Block_Code),
      stats: statsFrom(sum, n(p, 'Shape_Area')),
      feature: f,
    }
  })
  .sort((a, b) => b.stats.population - a.stats.population)

export const districtName = String(collection.features[0].properties.Dist_Name)

export const district: Stats = (() => {
  const sum: Record<string, number> = {}
  let area = 0
  collection.features.forEach((f) => {
    NUMERIC_KEYS.forEach((k) => (sum[k] = (sum[k] ?? 0) + n(f.properties, k)))
    area += n(f.properties, 'Shape_Area')
  })
  return statsFrom(sum, area)
})()

export const featureCollection = collection

/* ---------- Map indicators ---------- */

export interface Metric {
  key: keyof Stats
  label: string
  unit: string
  digits: number
}

export const metrics: Metric[] = [
  { key: 'population', label: 'Population', unit: '', digits: 0 },
  { key: 'density', label: 'Density', unit: 'per km²', digits: 0 },
  { key: 'literacy', label: 'Literacy rate', unit: '%', digits: 1 },
  { key: 'femaleLiteracy', label: 'Female literacy', unit: '%', digits: 1 },
  { key: 'sexRatio', label: 'Sex ratio', unit: 'F per 1,000 M', digits: 0 },
  { key: 'wpr', label: 'Work participation', unit: '%', digits: 1 },
  { key: 'scShare', label: 'Scheduled Caste share', unit: '%', digits: 1 },
  { key: 'childShare', label: 'Children 0–6', unit: '%', digits: 1 },
]

export const fmt = (v: number, digits = 0) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const fmtCompact = (v: number) =>
  v >= 100000 ? `${(v / 100000).toFixed(2)} lakh` : fmt(v)

export const PALETTE = ['#E3EFEC', '#B3D6D0', '#6FB1AE', '#2E858C', '#0D4B59']

export function classify(values: number[], steps = PALETTE.length) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = (max - min) / steps || 1
  const breaks = Array.from({ length: steps + 1 }, (_, i) => min + width * i)
  const colorFor = (v: number) => {
    const i = Math.min(steps - 1, Math.max(0, Math.floor((v - min) / width)))
    return PALETTE[i]
  }
  return { min, max, breaks, colorFor }
}
