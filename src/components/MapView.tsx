import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Pane, Polygon, useMap } from 'react-leaflet'
import type { Layer, PathOptions, LatLngExpression } from 'leaflet'
import L from 'leaflet'
import union from '@turf/union'
import { featureCollection as fc } from '@turf/helpers'
import type { Feature, MultiPolygon, Polygon as GJPolygon, Position } from 'geojson'
import { blocks, classify, fmt, PALETTE, type BlockFeature, type Metric, featureCollection } from '../metrics'

interface Props {
  metric: Metric
  selected: string | null
  onSelect: (name: string | null) => void
}

const MASK_COLOR = '#EEF2F0' // same as page background
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

interface Basemap {
  id: string
  name: string
  url: string
  attribution: string
  maxZoom: number
  subdomains?: string
}

/** OSM-based basemaps that need no API key. */
const BASEMAPS: Basemap[] = [
  { id: 'osm', name: 'OSM Standard', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: OSM_ATTR, maxZoom: 19 },
  {
    id: 'hot', name: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: `${OSM_ATTR}, Tiles &copy; <a href="https://www.hotosm.org/">HOT</a>`, maxZoom: 19, subdomains: 'abc',
  },
  {
    id: 'cyclosm', name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: `${OSM_ATTR}, Tiles &copy; <a href="https://www.cyclosm.org">CyclOSM</a>`, maxZoom: 20, subdomains: 'abc',
  },
  {
    id: 'topo', name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: `${OSM_ATTR}, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`, maxZoom: 17, subdomains: 'abc',
  },
  {
    id: 'light', name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>`, maxZoom: 20, subdomains: 'abcd',
  },
  {
    id: 'dark', name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: `${OSM_ATTR} &copy; <a href="https://carto.com/attributions">CARTO</a>`, maxZoom: 20, subdomains: 'abcd',
  },
]

/** Thumbnail = one tile over Haridwar (zoom 12), shown at native size and cropped, never scaled. */
const thumb = (b: Basemap) =>
  b.url.replace('{s}', (b.subdomains ?? 'a')[0]).replace('{z}', '12').replace('{x}', '2937').replace('{y}', '1693')

function BasemapGallery({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = BASEMAPS.find((b) => b.id === value)!
  return (
    <div className="bm-gallery">
      <button
        type="button"
        className="bm-toggle"
        aria-expanded={open}
        aria-label="Choose basemap"
        title="Basemap gallery"
        onClick={() => setOpen((o) => !o)}
      >
        <img src={thumb(current)} alt="" />
        <span>Basemap</span>
      </button>
      {open && (
        <div className="bm-panel" role="listbox" aria-label="Basemap gallery">
          {BASEMAPS.map((b) => (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={b.id === value}
              className={`bm-item${b.id === value ? ' active' : ''}`}
              onClick={() => {
                onChange(b.id)
                setOpen(false)
              }}
            >
              <img src={thumb(b)} alt="" loading="lazy" />
              <span>{b.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
const toLatLng = (ring: Position[]): LatLngExpression[] => ring.map(([x, y]) => [y, x])

/** Dissolve all blocks into one district outline. */
function districtOutline(): Feature<GJPolygon | MultiPolygon> {
  const feats = featureCollection.features as Feature<GJPolygon | MultiPolygon>[]
  return union(fc(feats)) as Feature<GJPolygon | MultiPolygon>
}

/** Keeps the map locked to Haridwar: fit on load, no panning or zooming out beyond it. */
function LockToDistrict({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap()
  useEffect(() => {
    const apply = () => {
      map.invalidateSize()
      const zoom = map.getBoundsZoom(bounds, false, L.point(16, 16))
      map.setMinZoom(zoom)
      map.setMaxBounds(bounds.pad(0.08))
      map.fitBounds(bounds, { padding: [16, 16], animate: false })
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map, bounds])
  return null
}

/** Adds a "zoom to layer" button to the zoom control, right after zoom out. */
function ZoomToLayer({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap()
  useEffect(() => {
    const bar = map.zoomControl.getContainer()
    if (!bar) return
    const a = L.DomUtil.create('a', 'zoom-layer-btn', bar) as HTMLAnchorElement
    a.href = '#'
    a.title = 'Zoom to Haridwar district'
    a.setAttribute('role', 'button')
    a.setAttribute('aria-label', 'Zoom to Haridwar district')
    a.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5"/><rect x="5" y="5" width="6" height="6" rx="1"/></svg>'
    L.DomEvent.disableClickPropagation(a)
    L.DomEvent.on(a, 'click', (e) => {
      L.DomEvent.preventDefault(e)
      map.fitBounds(bounds, { padding: [16, 16] })
    })
    return () => {
      L.DomEvent.off(a)
      a.remove()
    }
  }, [map, bounds])
  return null
}

export default function MapView({ metric, selected, onSelect }: Props) {
  const [basemapId, setBasemapId] = useState('osm')
  const basemap = BASEMAPS.find((b) => b.id === basemapId)!
  const scale = useMemo(() => classify(blocks.map((b) => b.stats[metric.key])), [metric])
  const byName = useMemo(() => new Map(blocks.map((b) => [b.name, b])), [])
  const bounds = useMemo(() => L.geoJSON(featureCollection as never).getBounds(), [])

  // Everything outside Haridwar is covered by a mask: a big rectangle with the district cut out.
  const mask = useMemo(() => {
    const outline = districtOutline()
    const polys: Position[][][] =
      outline.geometry.type === 'Polygon' ? [outline.geometry.coordinates] : outline.geometry.coordinates
    const world: LatLngExpression[] = [[-85, -180], [-85, 180], [85, 180], [85, -180]]
    const holes = polys.map((p) => toLatLng(p[0]))
    const islands = polys.flatMap((p) => p.slice(1).map(toLatLng)) // gaps inside the district stay masked
    return { rings: [world, ...holes], islands }
  }, [])

  const style = (f?: BlockFeature): PathOptions => {
    const b = byName.get(String(f?.properties.Name))!
    const isSel = b.name === selected
    return {
      fillColor: scale.colorFor(b.stats[metric.key]),
      fillOpacity: 0.5,
      color: isSel ? '#E0A030' : '#FFFFFF',
      weight: isSel ? 3.5 : 1.5,
    }
  }

  const onEach = (f: BlockFeature, layer: Layer) => {
    const b = byName.get(String(f.properties.Name))!
    const v = b.stats[metric.key]
    layer.bindTooltip(
      `<strong>${b.name}</strong><br/>${metric.label}: ${fmt(v, metric.digits)} ${metric.unit}`,
      { sticky: true, className: 'map-tip' }
    )
    layer.on({
      click: () => onSelect(b.name === selected ? null : b.name),
      mouseover: (e) => (e.target as L.Path).setStyle({ weight: 3 }),
      mouseout: (e) => (e.target as L.Path).setStyle(style(f)),
    })
  }

  return (
    <div className="map-wrap">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [16, 16] }}
        maxBounds={bounds.pad(0.08)}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        className="map"
      >
        <TileLayer
          key={basemap.id}
          attribution={basemap.attribution}
          url={basemap.url}
          maxZoom={basemap.maxZoom}
          subdomains={basemap.subdomains ?? 'abc'}
        />
        <Pane name="mask" style={{ zIndex: 350 }}>
          <Polygon
            positions={mask.rings}
            interactive={false}
            pathOptions={{ stroke: false, fillColor: MASK_COLOR, fillOpacity: 0.78, fillRule: 'evenodd' }}
          />
          {mask.islands.map((ring, i) => (
            <Polygon key={i} positions={ring} interactive={false} pathOptions={{ stroke: false, fillColor: MASK_COLOR, fillOpacity: 0.78 }} />
          ))}
        </Pane>
        <LockToDistrict bounds={bounds} />
        <ZoomToLayer bounds={bounds} />
        <GeoJSON
          key={`${metric.key}-${selected}`}
          data={featureCollection as never}
          style={style as never}
          onEachFeature={onEach as never}
        />
      </MapContainer>
      <BasemapGallery value={basemapId} onChange={setBasemapId} />
      <div className="legend" aria-label={`Legend for ${metric.label}`}>
        <div className="legend-title">{metric.label}{metric.unit ? ` (${metric.unit})` : ''}</div>
        <div className="legend-bar">
          {PALETTE.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </div>
        <div className="legend-range">
          <span>{fmt(scale.min, metric.digits)}</span>
          <span>{fmt(scale.max, metric.digits)}</span>
        </div>
      </div>
    </div>
  )
}
