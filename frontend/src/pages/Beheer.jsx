import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useBranding } from '../context/BrandingContext'

const THEME_META = {
  standaard: {
    label: 'Standaard',
    description: 'Donkerblauw met cyaan accent',
    swatches: ['#0d4c92', '#09afd9', '#0a3d78'],
  },
  genseler: {
    label: "’t Genseler huisstijl",
    description: 'Zomerlucht cyaan · Golven blauw · Morgenrood rood',
    swatches: ['#00bcdf', '#006684', '#ed1c24'],
  },
}

export default function Beheer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState(null)
  const { theme: activeTheme, setTheme } = useBranding()
  const [savingTheme, setSavingTheme] = useState(false)

  useEffect(() => {
    if (user && !user.is_admin) { navigate('/'); return }
    fetch('/api/admin/users').then(r => r.json()).then(setUsers).catch(() => {})
  }, [user])

  async function toggle(id, field, current) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    })
    setUsers(u => u.map(x => x.id === id ? { ...x, [field]: !current } : x))
  }

  async function saveTheme(name) {
    if (name === activeTheme || savingTheme) return
    setSavingTheme(true)
    try {
      const r = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: name }),
      })
      if (r.ok) setTheme(name)
    } finally {
      setSavingTheme(false)
    }
  }

  function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
  }

  if (!users) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Gebruikersbeheer</h2>
          <div className="subtitle">{users.length} gebruiker{users.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Gebruiker</th>
              <th>E-mail</th>
              <th>Laatste login</th>
              <th>Beheerder</th>
              <th>Docent</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--title)', fontWeight: 700, fontSize: '0.85rem',
                    }}>
                      {u.display_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span style={{ fontWeight: 500 }}>{u.display_name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-soft)' }}>{u.email}</td>
                <td style={{ color: 'var(--text-soft)', fontSize: '0.82rem' }}>{fmt(u.last_login)}</td>
                <td>
                  <button
                    onClick={() => toggle(u.id, 'is_admin', u.is_admin)}
                    className={`badge ${u.is_admin ? 'badge-primary' : 'badge-gray'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    title={u.is_admin ? 'Klik om te verwijderen' : 'Klik om te maken'}
                  >
                    {u.is_admin ? 'Ja' : 'Nee'}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => toggle(u.id, 'is_teacher', u.is_teacher)}
                    className={`badge ${u.is_teacher ? 'badge-blue' : 'badge-gray'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    title={u.is_teacher ? 'Klik om te verwijderen' : 'Klik om te maken'}
                  >
                    {u.is_teacher ? 'Ja' : 'Nee'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Theme / Huisstijl */}
      <div style={{ marginTop: '32px' }}>
        <div className="section-title" style={{ marginTop: 0, marginBottom: '4px' }}>Huisstijl</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '16px' }}>
          Kies het kleurthema voor alle portfoliopagina's.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Object.entries(THEME_META).map(([key, meta]) => {
            const active = key === activeTheme
            return (
              <div
                key={key}
                className="card"
                onClick={() => saveTheme(key)}
                style={{
                  cursor: active ? 'default' : savingTheme ? 'wait' : 'pointer',
                  border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: active ? 'var(--shadow)' : 'none',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                  opacity: savingTheme && !active ? 0.6 : 1,
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                  {meta.swatches.map((color, i) => (
                    <div key={i} style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: color, border: '2px solid rgba(0,0,0,0.08)',
                      flexShrink: 0,
                    }} />
                  ))}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '4px' }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                  {meta.description}
                </div>
                {active && (
                  <span className="badge badge-primary" style={{ marginTop: '14px', display: 'inline-block' }}>
                    Actief
                  </span>
                )}
                {!active && (
                  <span className="badge badge-gray" style={{ marginTop: '14px', display: 'inline-block', opacity: 0.7 }}>
                    Activeren
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
