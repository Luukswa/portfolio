import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Overzicht() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user && !user.is_teacher && !user.is_admin) { navigate('/'); return }
    fetch('/api/teacher/students').then(r => r.json()).then(setStudents).catch(() => {})
  }, [user])

  function fmt(iso) {
    if (!iso) return 'Nog niet ingelogd'
    return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
  }

  if (!students) return <div className="empty-state">Laden…</div>

  const filtered = students.filter(s =>
    s.display_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Leerlingoverzicht</h2>
          <div className="subtitle">{filtered.length} van {students.length} gebruiker{students.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: '16px' }}>
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
            }}>
              {s.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)' }}>{s.display_name}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>Ingelogd: {fmt(s.last_login)}</div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">{search ? 'Geen resultaten gevonden.' : 'Nog geen gebruikers.'}</div>
      )}
    </>
  )
}
