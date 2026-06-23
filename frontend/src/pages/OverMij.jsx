import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function OverMij() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [newSkill, setNewSkill] = useState('')
  const [newHobbyIcon, setNewHobbyIcon] = useState('')
  const [newHobbyLabel, setNewHobbyLabel] = useState('')
  const [newSubject, setNewSubject] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(setProfile)
      .catch(() => {})
  }, [])

  function startEdit() {
    setDraft(JSON.parse(JSON.stringify(profile)))
    setNewSkill(''); setNewHobbyIcon(''); setNewHobbyLabel(''); setNewSubject('')
    setEditing(true)
  }

  function cancel() { setDraft(null); setEditing(false) }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (res.ok) { setProfile(p => ({ ...p, ...draft })); setDraft(null); setEditing(false) }
    } finally { setSaving(false) }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      if (res.ok) {
        const { avatar_url } = await res.json()
        // Add cache-bust so browser reloads the new image
        const busted = `${avatar_url}?t=${Date.now()}`
        setProfile(p => ({ ...p, avatar_url: busted }))
        setDraft(d => ({ ...d, avatar_url: busted }))
      }
    } finally { setUploading(false) }
  }

  async function handleAvatarDelete() {
    if (!user) return
    const res = await fetch(`/api/profile/avatar/${user.id}`, { method: 'DELETE' })
    if (res.ok) {
      setProfile(p => ({ ...p, avatar_url: '' }))
      setDraft(d => ({ ...d, avatar_url: '' }))
    }
  }

  function addSkill() {
    const v = newSkill.trim(); if (!v) return
    setDraft(d => ({ ...d, skills: [...d.skills, v] })); setNewSkill('')
  }
  function removeSkill(i) { setDraft(d => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) })) }

  function addHobby() {
    const label = newHobbyLabel.trim(); if (!label) return
    setDraft(d => ({ ...d, hobbies: [...d.hobbies, { icon: newHobbyIcon.trim() || '•', label }] }))
    setNewHobbyIcon(''); setNewHobbyLabel('')
  }
  function removeHobby(i) { setDraft(d => ({ ...d, hobbies: d.hobbies.filter((_, idx) => idx !== i) })) }

  function addSubject() {
    const v = newSubject.trim(); if (!v) return
    setDraft(d => ({ ...d, subjects: [...d.subjects, v] })); setNewSubject('')
  }
  function removeSubject(i) { setDraft(d => ({ ...d, subjects: d.subjects.filter((_, idx) => idx !== i) })) }

  if (!profile) return <div className="empty-state">Laden…</div>

  const data = editing ? draft : profile
  const avatarUrl = data?.avatar_url || ''

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Over mij</h2>
          <div className="subtitle">Een korte introductie</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {editing ? (
            <>
              <button className="btn btn-ghost" onClick={cancel} disabled={saving}>Annuleren</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={startEdit}>Bewerken</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>

        {/* Bio */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

            {/* Avatar */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profielfoto"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', display: 'block', border: '2px solid var(--border)' }}
                  />
                ) : (
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'var(--primary-light)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', color: 'var(--primary)',
                  }}>
                    👤
                  </div>
                )}
                {editing && (
                  <label style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: uploading ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.32)',
                    cursor: uploading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '1.3rem',
                    transition: 'background 0.15s',
                  }}
                    title="Profielfoto wijzigen"
                  >
                    {uploading ? '…' : '📷'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              {editing && avatarUrl && (
                <button
                  onClick={handleAvatarDelete}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.75rem', padding: 0 }}
                >
                  Verwijderen
                </button>
              )}
            </div>

            {/* Text fields */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <>
                  <input
                    className="edit-input"
                    value={draft.name}
                    onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                    placeholder="Jouw naam"
                    style={{ marginBottom: '8px', fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.1rem' }}
                  />
                  <input
                    className="edit-input"
                    value={draft.title}
                    onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                    placeholder="Bijv. Student · OSG Twente"
                    style={{ marginBottom: '10px', fontSize: '0.82rem' }}
                  />
                  <textarea
                    className="edit-input"
                    value={draft.bio}
                    onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                    placeholder="Schrijf hier iets over jezelf…"
                    rows={4}
                  />
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--title)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                    {data.name || <span style={{ color: 'var(--text-dim)' }}>Naam</span>}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginBottom: '12px', fontWeight: 500 }}>
                    {data.title || <span style={{ color: 'var(--text-dim)' }}>Functie / rol</span>}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                    {data.bio || <span style={{ color: 'var(--text-dim)' }}>Nog geen introductietekst. Klik op Bewerken om te beginnen.</span>}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {data.skills.map((s, i) => (
              <span key={i} className="badge badge-primary" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {s}
                {editing && (
                  <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '1rem', opacity: 0.7 }}>×</button>
                )}
              </span>
            ))}
            {data.skills.length === 0 && !editing && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog geen skills.</span>}
          </div>
          {editing && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input className="edit-input" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Skill toevoegen…" />
              <button className="btn btn-primary btn-sm" onClick={addSkill}>+</button>
            </div>
          )}
        </div>

        {/* Hobby's */}
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Hobby's</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            {data.hobbies.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                fontSize: '0.88rem', color: 'var(--text)',
              }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{h.icon}</span>
                <span style={{ flex: 1 }}>{h.label}</span>
                {editing && (
                  <button onClick={() => removeHobby(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0, lineHeight: 1, fontSize: '1rem' }}>×</button>
                )}
              </div>
            ))}
            {data.hobbies.length === 0 && !editing && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog geen hobby's.</span>}
          </div>
          {editing && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input className="edit-input" value={newHobbyIcon} onChange={e => setNewHobbyIcon(e.target.value)} placeholder="🎯" style={{ width: '60px', textAlign: 'center', flexShrink: 0 }} />
              <input className="edit-input" value={newHobbyLabel} onChange={e => setNewHobbyLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHobby()} placeholder="Hobby toevoegen…" />
              <button className="btn btn-primary btn-sm" onClick={addHobby}>+</button>
            </div>
          )}
        </div>

        {/* Leukste vakken */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="section-title" style={{ marginTop: 0 }}>Leukste vakken op school</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {data.subjects.map((v, i) => (
              <span key={i} className="badge badge-blue" style={{ fontSize: '0.82rem', padding: '5px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {v}
                {editing && (
                  <button onClick={() => removeSubject(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '1rem', opacity: 0.7 }}>×</button>
                )}
              </span>
            ))}
            {data.subjects.length === 0 && !editing && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog geen vakken.</span>}
          </div>
          {editing && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input className="edit-input" value={newSubject} onChange={e => setNewSubject(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubject()} placeholder="Vak toevoegen…" />
              <button className="btn btn-primary btn-sm" onClick={addSubject}>+</button>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
