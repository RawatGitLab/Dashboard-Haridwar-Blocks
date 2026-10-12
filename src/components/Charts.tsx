import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { blocks, fmt, type Metric } from '../metrics'

interface Props {
  metric: Metric
  selected: string | null
  onSelect: (name: string | null) => void
}

const INK = '#14262B'
const TEAL = '#0D6B78'
const SAFFRON = '#E0A030'
const BRICK = '#A8452F'
const STONE = '#9DB3B0'

export default function Charts({ metric, selected, onSelect }: Props) {
  const ranked = [...blocks]
    .map((b) => ({ name: b.name, value: b.stats[metric.key] }))
    .sort((a, b) => b.value - a.value)

  const literacy = blocks.map((b) => ({
    name: b.name,
    Men: +b.stats.maleLiteracy.toFixed(1),
    Women: +b.stats.femaleLiteracy.toFixed(1),
  }))

  const work = blocks.map((b) => {
    const t = b.stats.cultivators + b.stats.agriLabourers + b.stats.householdInd + b.stats.otherWorkers
    const p = (v: number) => +((v / t) * 100).toFixed(1)
    return {
      name: b.name,
      Cultivators: p(b.stats.cultivators),
      'Agricultural labour': p(b.stats.agriLabourers),
      'Household industry': p(b.stats.householdInd),
      Other: p(b.stats.otherWorkers),
    }
  })

  const axis = { fontSize: 12, fill: INK }
  const dim = (name: string) => (selected && selected !== name ? 0.35 : 1)

  return (
    <div className="charts">
      <article className="panel">
        <h2>{metric.label} by block</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ranked} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} stroke="#DCE5E3" />
            <XAxis type="number" tick={axis} tickFormatter={(v) => fmt(v, metric.digits)} />
            <YAxis type="category" dataKey="name" width={86} tick={axis} />
            <Tooltip formatter={(v: number) => `${fmt(v, metric.digits)} ${metric.unit}`} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} onClick={(d) => onSelect(d.name === selected ? null : d.name)} cursor="pointer">
              {ranked.map((r) => (
                <Cell key={r.name} fill={r.name === selected ? SAFFRON : TEAL} fillOpacity={dim(r.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </article>

      <article className="panel">
        <h2>Literacy rate, men and women</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={literacy} margin={{ left: -12, right: 8 }}>
            <CartesianGrid vertical={false} stroke="#DCE5E3" />
            <XAxis dataKey="name" tick={{ ...axis, fontSize: 11 }} interval={0} />
            <YAxis tick={axis} domain={[0, 100]} unit="%" />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend iconType="square" />
            <Bar dataKey="Men" fill={TEAL} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Women" fill={BRICK} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </article>

      <article className="panel">
        <h2>How people earn a living</h2>
        <p className="panel-note">Share of all workers, main and marginal combined</p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={work} layout="vertical" margin={{ left: 8, right: 16 }} stackOffset="expand">
            <XAxis type="number" tick={axis} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
            <YAxis type="category" dataKey="name" width={86} tick={axis} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Cultivators" stackId="a" fill={TEAL} />
            <Bar dataKey="Agricultural labour" stackId="a" fill={STONE} />
            <Bar dataKey="Household industry" stackId="a" fill={SAFFRON} />
            <Bar dataKey="Other" stackId="a" fill={BRICK} />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </div>
  )
}
