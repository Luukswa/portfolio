import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Overzicht() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState(null)

  useEffect(() => {
    if (user && !user.is_teacher && !user.is_admin) { navigate('/'); return }
    fetch('/api/teacher/students').then(r => r.json()).then(setStudents).catch(() => {})
  }, [user])

  function fmt(iso) {
    if (!iso) return 'Nog niet ingelogd'
    return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
  }

  if (!students) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Leerlingoverzicht</h2>
          <div className="subtitle">{students.length} gebruiker{students.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {students.map(s => (
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

      {students.length === 0 && (
        <div className="empty-state">Nog geen gebruikers gevonden.</div>
      )}
    </>
  )
}
