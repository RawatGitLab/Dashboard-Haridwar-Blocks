import { useState } from 'react'
import { blocks, fmt, type Stats } from '../metrics'

type Col = { key: keyof Stats; label: string; digits: number }

const cols: Col[] = [
  { key: 'population', label: 'Population', digits: 0 },
  { key: 'households', label: 'Households', digits: 0 },
  { key: 'sexRatio', label: 'Sex ratio', digits: 0 },
  { key: 'literacy', label: 'Literacy %', digits: 1 },
  { key: 'femaleLiteracy', label: 'Female literacy %', digits: 1 },
  { key: 'wpr', label: 'Work participation %', digits: 1 },
  { key: 'scShare', label: 'SC share %', digits: 1 },
  { key: 'density', label: 'Density /km²', digits: 0 },
]

interface Props {
  selected: string | null
  onSelect: (name: string | null) => void
}

export default function BlockTable({ selected, onSelect }: Props) {
  const [sort, setSort] = useState<{ key: keyof Stats | 'name'; dir: 1 | -1 }>({ key: 'population', dir: -1 })

  const rows = [...blocks].sort((a, b) => {
    if (sort.key === 'name') return a.name.localeCompare(b.name) * sort.dir
    return (a.stats[sort.key] - b.stats[sort.key]) * sort.dir
  })

  const head = (key: keyof Stats | 'name', label: string) => (
    <th
      key={key}
      aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
      className={key === 'name' ? 'left' : ''}
    >
      <button onClick={() => setSort({ key, dir: sort.key === key ? (sort.dir === 1 ? -1 : 1) : -1 })}>
        {label}{sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  )

  return (
    <section className="panel table-panel">
      <h2>All blocks</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>{head('name', 'Block')}{cols.map((c) => head(c.key, c.label))}</tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr
                key={b.name}
                className={b.name === selected ? 'is-selected' : ''}
                onClick={() => onSelect(b.name === selected ? null : b.name)}
              >
                <td className="left"><button className="row-btn">{b.name}</button></td>
                {cols.map((c) => (
                  <td key={c.key}>{fmt(b.stats[c.key], c.digits)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
