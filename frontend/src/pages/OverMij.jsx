import { useState, useEffect } from 'react'

export default function OverMij() {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

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
      if (res.ok) { setProfile(draft); setDraft(null); setEditing(false) }
    } finally { setSaving(false) }
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
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary-light)', border: '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', color: 'var(--primary)',
            }}>
              👤
            </div>
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
              <input
                className="edit-input"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Skill toevoegen…"
              />
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
              <input
                className="edit-input"
                value={newHobbyIcon}
                onChange={e => setNewHobbyIcon(e.target.value)}
                placeholder="🎯"
                style={{ width: '60px', textAlign: 'center', flexShrink: 0 }}
              />
              <input
                className="edit-input"
                value={newHobbyLabel}
                onChange={e => setNewHobbyLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHobby()}
                placeholder="Hobby toevoegen…"
              />
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
              <input
                className="edit-input"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubject()}
                placeholder="Vak toevoegen…"
              />
              <button className="btn btn-primary btn-sm" onClick={addSubject}>+</button>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
