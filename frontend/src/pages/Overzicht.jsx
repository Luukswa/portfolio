import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  { key: 'profiel',     label: 'Over mij' },
  { key: 'cijfers',     label: 'Cijfers' },
  { key: 'doelen',      label: 'Doelen' },
  { key: 'cv',          label: 'CV' },
  { key: 'referenties', label: 'Referenties' },
  { key: 'werkstukken', label: 'Werkstukken' },
]

function filled(value) {
  return typeof value === 'boolean' ? value : value > 0
}

function completionScore(completion) {
  if (!completion) return 0
  return SECTIONS.reduce((n, s) => n + (filled(completion[s.key]) ? 1 : 0), 0)
}

function CompletionDots({ completion }) {
  if (!completion) return null
  return (
    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
      {SECTIONS.map(s => (
        <span
          key={s.key}
          title={`${s.label}: ${filled(completion[s.key]) ? 'ingevuld' : 'nog niet ingevuld'}`}
          style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: filled(completion[s.key]) ? 'var(--green)' : 'transparent',
            border: `1.5px solid ${filled(completion[s.key]) ? 'var(--green)' : 'var(--border)'}`,
          }}
        />
      ))}
    </div>
  )
}

export default function Overzicht() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState(null)
  const [search, setSearch] = useState('')
  const [completeFilter, setCompleteFilter] = useState('alle')
  const [sort, setSort] = useState('naam')

  useEffect(() => {
    if (user && !user.is_teacher && !user.is_admin) { navigate('/'); return }
    fetch('/api/teacher/students').then(r => r.json()).then(setStudents).catch(() => {})
  }, [user])

  function fmt(iso) {
    if (!iso) return 'Nog niet ingelogd'
    return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
  }

  if (!students) return <div className="empty-state">Laden…</div>

  const total = SECTIONS.length

  let filtered = students.filter(s =>
    s.display_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )
  if (completeFilter === 'onvolledig') filtered = filtered.filter(s => completionScore(s.completion) < total)
  if (completeFilter === 'compleet')   filtered = filtered.filter(s => completionScore(s.completion) === total)

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'incompleet') {
      const diff = completionScore(a.completion) - completionScore(b.completion)
      if (diff !== 0) return diff
    }
    return a.display_name.localeCompare(b.display_name)
  })

  const onvolledigCount = students.filter(s => completionScore(s.completion) < total).length
  const compleetCount   = students.filter(s => completionScore(s.completion) === total).length

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Leerlingoverzicht</h2>
          <div className="subtitle">{filtered.length} van {students.length} leerling{students.length !== 1 ? 'en' : ''}</div>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: '10px' }}>
        <input
          className="edit-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoeken op naam of e-mail…"
          style={{ maxWidth: '340px' }}
          autoComplete="off"
        />
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Wissen</button>
        )}
        <div className="toolbar-actions">
          <select className="edit-input" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto' }}>
            <option value="naam">Sorteren: Naam</option>
            <option value="incompleet">Sorteren: Minst compleet eerst</option>
          </select>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: '16px' }}>
        <button className={`btn btn-sm ${completeFilter === 'alle' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCompleteFilter('alle')}>
          Alles <span style={{ opacity: 0.75 }}>· {students.length}</span>
        </button>
        <button className={`btn btn-sm ${completeFilter === 'onvolledig' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCompleteFilter('onvolledig')}>
          Onvolledig <span style={{ opacity: 0.75 }}>· {onvolledigCount}</span>
        </button>
        <button className={`btn btn-sm ${completeFilter === 'compleet' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCompleteFilter('compleet')}>
          Compleet <span style={{ opacity: 0.75 }}>· {compleetCount}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {filtered.map(s => (
          <div
            key={s.id}
            className="card"
            onClick={() => navigate(`/overzicht/${s.id}`)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.1rem',
              position: 'relative', overflow: 'hidden',
            }}>
              {s.display_name?.[0]?.toUpperCase() ?? '?'}
              <img
                src={`/api/profile/avatar/${s.id}?t=1`}
                alt=""
                onError={e => { e.currentTarget.style.display = 'none' }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)' }}>{s.display_name}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>Ingelogd: {fmt(s.last_login)}</div>
              <CompletionDots completion={s.completion} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">{search ? 'Geen resultaten gevonden.' : 'Nog geen leerlingen.'}</div>
      )}
    </>
  )
}
