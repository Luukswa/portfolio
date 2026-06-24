import { useState, useEffect, useRef } from 'react'
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
    label: "'t Genseler huisstijl",
    description: 'Zomerlucht cyaan · Golven blauw · Morgenrood rood',
    swatches: ['#00bcdf', '#006684', '#ed1c24'],
  },
}

export default function Beheer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('gebruikers')
  const [users, setUsers] = useState(null)
  const { theme: activeTheme, setTheme, logoUrl, refreshBranding } = useBranding()
  const [savingTheme, setSavingTheme] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef()

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

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/branding/logo', { method: 'POST', body: fd })
      if (r.ok) await refreshBranding()
    } finally {
      setUploadingLogo(false)
      if (logoRef.current) logoRef.current.value = ''
    }
  }

  async function handleLogoDelete() {
    const r = await fetch('/api/admin/branding/logo', { method: 'DELETE' })
    if (r.ok) await refreshBranding()
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
          <h2>Beheer</h2>
          <div className="subtitle">
            {tab === 'gebruikers'
              ? `${users.length} gebruiker${users.length !== 1 ? 's' : ''}`
              : 'Thema en logo instellen'}
          </div>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'gebruikers' ? ' active' : ''}`} onClick={() => setTab('gebruikers')}>
          Gebruikers
        </button>
        <button className={`tab-btn${tab === 'huisstijl' ? ' active' : ''}`} onClick={() => setTab('huisstijl')}>
          Huisstijl
        </button>
      </div>

      {/* ── Gebruikers ── */}
      {tab === 'gebruikers' && (
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
      )}

      {/* ── Huisstijl ── */}
      {tab === 'huisstijl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Logo */}
          <div className="card">
            <div className="section-title" style={{ marginTop: 0, marginBottom: '16px' }}>Logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{
                width: '140px', height: '80px', borderRadius: '10px',
                background: 'var(--primary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" style={{ maxWidth: '110px', maxHeight: '60px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  : <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>Geen logo</span>
                }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                <label style={{ cursor: uploadingLogo ? 'wait' : 'pointer' }}>
                  <span className={`btn btn-ghost btn-sm`} style={{ pointerEvents: 'none' }}>
                    {uploadingLogo ? 'Uploaden…' : logoUrl ? 'Logo wijzigen' : 'Logo uploaden'}
                  </span>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
                {logoUrl && (
                  <button
                    onClick={handleLogoDelete}
                    disabled={uploadingLogo}
                    className="btn btn-ghost btn-sm"
                  >
                    Logo verwijderen
                  </button>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '280px' }}>
                  JPG, PNG, WebP of SVG. Het logo wordt wit weergegeven in de header.
                </div>
              </div>
            </div>
          </div>

          {/* Thema */}
          <div className="card">
            <div className="section-title" style={{ marginTop: 0, marginBottom: '6px' }}>Kleurthema</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '18px' }}>
              Geldt direct voor alle gebruikers.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {Object.entries(THEME_META).map(([key, meta]) => {
                const active = key === activeTheme
                return (
                  <div
                    key={key}
                    onClick={() => saveTheme(key)}
                    style={{
                      borderRadius: '10px', padding: '16px',
                      border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'var(--primary-light)' : 'var(--surface2)',
                      cursor: active ? 'default' : savingTheme ? 'wait' : 'pointer',
                      opacity: savingTheme && !active ? 0.6 : 1,
                      transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
                      boxShadow: active ? 'var(--shadow-sm)' : 'none',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      {meta.swatches.map((color, i) => (
                        <div key={i} style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: color, border: '2px solid rgba(0,0,0,0.08)',
                          flexShrink: 0,
                        }} />
                      ))}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)', marginBottom: '4px' }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {meta.description}
                    </div>
                    <span className={`badge ${active ? 'badge-primary' : 'badge-gray'}`} style={{ opacity: active ? 1 : 0.65 }}>
                      {active ? 'Actief' : 'Activeren'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </>
  )
}
