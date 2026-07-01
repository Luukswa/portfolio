import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FeedbackThread } from '../components/Feedback'

const EMPTY_PROFILE = { name: '', title: '', bio: '', skills: [], hobbies: [], subjects: [], avatar_url: '' }

const WIZARD_STEPS = [
  { label: 'Naam & foto' },
  { label: 'Over jezelf' },
  { label: 'Skills' },
  { label: "Hobby's" },
  { label: 'Vakken' },
]

export default function OverMij() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [wizardActive, setWizardActive] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  const [newSkill, setNewSkill] = useState('')
  const [newHobbyLabel, setNewHobbyLabel] = useState('')
  const [newSubject, setNewSubject] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : EMPTY_PROFILE)
      .then(p => {
        const loaded = p || EMPTY_PROFILE
        setProfile(loaded)
        if (!loaded.name) {
          setDraft({ ...EMPTY_PROFILE, ...loaded })
          setWizardActive(true)
          setWizardStep(1)
        }
      })
      .catch(() => {
        setProfile(EMPTY_PROFILE)
        setDraft({ ...EMPTY_PROFILE })
        setWizardActive(true)
        setWizardStep(1)
      })
    fetch('/api/feedback')
      .then(r => r.json())
      .then(setFeedback)
      .catch(() => {})
  }, [])

  function startEdit() {
    setDraft(JSON.parse(JSON.stringify(profile)))
    setNewSkill(''); setNewHobbyLabel(''); setNewSubject('')
    setError('')
    setEditing(true)
  }
  function cancel() { setDraft(null); setEditing(false); setError('') }

  async function save() {
    if (!draft.name.trim()) { setError('Naam is verplicht.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        setProfile(prev => ({ ...prev, ...draft }))
        setDraft(null)
        setEditing(false)
        if (wizardActive) {
          setWizardActive(false)
        }
      } else {
        setError(body.error || 'Er ging iets mis.')
      }
    } finally { setSaving(false) }
  }

  function dismissWizard() {
    setWizardActive(false)
    setDraft(null)
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
    setDraft(d => ({ ...d, hobbies: [...d.hobbies, { icon: '', label }] }))
    setNewHobbyLabel('')
  }
  function removeHobby(i) { setDraft(d => ({ ...d, hobbies: d.hobbies.filter((_, idx) => idx !== i) })) }

  function addSubject() {
    const v = newSubject.trim(); if (!v) return
    setDraft(d => ({ ...d, subjects: [...d.subjects, v] })); setNewSubject('')
  }
  function removeSubject(i) { setDraft(d => ({ ...d, subjects: d.subjects.filter((_, idx) => idx !== i) })) }

  if (!profile) return <div className="empty-state">Laden…</div>

  // ── WIZARD ────────────────────────────────────────────────────────────────
  if (wizardActive && draft) {
    const totalSteps = WIZARD_STEPS.length
    const isFirst = wizardStep === 1
    const isLast = wizardStep === totalSteps
    const avatarUrl = draft.avatar_url || ''

    return (
      <>
        <div className="page-header">
          <div>
            <h2>Profiel instellen</h2>
            <div className="subtitle">Stap {wizardStep} van {totalSteps} — {WIZARD_STEPS[wizardStep - 1].label}</div>
          </div>
          <button className="btn btn-ghost" onClick={dismissWizard} style={{ fontSize: '0.82rem' }}>Later invullen</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px' }}>
          {WIZARD_STEPS.map((step, idx) => {
            const n = idx + 1
            const done = wizardStep > n
            const active = wizardStep === n
            return [
              <div key={`step-${idx}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: (done || active) ? 'var(--primary)' : 'var(--surface2)',
                  border: `2px solid ${(done || active) ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: (done || active) ? '#fff' : 'var(--text-soft)',
                  fontSize: '0.8rem', fontWeight: 700,
                  transition: 'all 0.2s',
                }}>
                  {done ? '✓' : n}
                </div>
                <span style={{
                  fontSize: '0.68rem', whiteSpace: 'nowrap',
                  color: active ? 'var(--primary)' : done ? 'var(--text-soft)' : 'var(--text-dim)',
                  fontWeight: active ? 600 : 400,
                }}>{step.label}</span>
              </div>,
              idx < totalSteps - 1 && (
                <div key={`line-${idx}`} style={{
                  flex: 1, height: '2px', minWidth: '12px',
                  background: done ? 'var(--primary)' : 'var(--border)',
                  marginTop: '14px',
                  transition: 'background 0.2s',
                }} />
              ),
            ]
          })}
        </div>

        {/* Step content */}
        <div className="card" style={{ minHeight: '260px' }}>

          {wizardStep === 1 && (
            <div>
              <div style={{ fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>Naam & profielfoto</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '20px' }}>Hoe wil je dat je portfolio wordt weergegeven?</div>
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profielfoto" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', display: 'block', border: '2px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary-light)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'var(--primary)' }}>👤</div>
                    )}
                    <label style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: uploading ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)', cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', transition: 'background 0.15s' }} title="Profielfoto uploaden">
                      {uploading ? '…' : '📷'}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  {avatarUrl && <button onClick={handleAvatarDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.75rem', padding: 0 }}>Verwijderen</button>}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', maxWidth: '100px' }}>Klik op het icoon om een foto te uploaden</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)', display: 'block', marginBottom: '4px' }}>Naam *</label>
                    <input className="edit-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Jouw naam" autoFocus />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)', display: 'block', marginBottom: '4px' }}>Titel / rol</label>
                    <input className="edit-input" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Bijv. Student · OSG Twente" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div>
              <div style={{ fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>Over jezelf</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '20px' }}>Vertel iets over wie je bent, wat je interesseert, en wat je wil bereiken.</div>
              <textarea className="edit-input" value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} placeholder="Schrijf hier iets over jezelf…" rows={7} autoFocus />
            </div>
          )}

          {wizardStep === 3 && (
            <div>
              <div style={{ fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>Skills</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '20px' }}>Welke vaardigheden heb je? Bijv. Programmeren, Muziek, Tekenen…</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', minHeight: '36px' }}>
                {draft.skills.map((s, i) => (
                  <span key={i} className="badge badge-primary" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    {s}
                    <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '1rem', opacity: 0.7 }}>×</button>
                  </span>
                ))}
                {draft.skills.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', alignSelf: 'center' }}>Nog geen skills toegevoegd.</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="edit-input" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Skill toevoegen…" autoFocus />
                <button className="btn btn-primary btn-sm" onClick={addSkill}>+</button>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div>
              <div style={{ fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>Hobby's</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '20px' }}>Wat doe je graag in je vrije tijd?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', minHeight: '36px' }}>
                {draft.hobbies.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text)' }}>
                    {h.icon && <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{h.icon}</span>}
                    <span style={{ flex: 1 }}>{h.label}</span>
                    <button onClick={() => removeHobby(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0, lineHeight: 1, fontSize: '1rem' }}>×</button>
                  </div>
                ))}
                {draft.hobbies.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', alignSelf: 'center' }}>Nog geen hobby's toegevoegd.</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="edit-input" value={newHobbyLabel} onChange={e => setNewHobbyLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHobby()} placeholder="Hobby toevoegen…" autoFocus />
                <button className="btn btn-primary btn-sm" onClick={addHobby}>+</button>
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div>
              <div style={{ fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>Leukste vakken</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: '20px' }}>Welke vakken vind je het leukst op school?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', minHeight: '36px' }}>
                {draft.subjects.map((v, i) => (
                  <span key={i} className="badge badge-blue" style={{ fontSize: '0.82rem', padding: '5px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {v}
                    <button onClick={() => removeSubject(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '1rem', opacity: 0.7 }}>×</button>
                  </span>
                ))}
                {draft.subjects.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', alignSelf: 'center' }}>Nog geen vakken toegevoegd.</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="edit-input" value={newSubject} onChange={e => setNewSubject(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubject()} placeholder="Vak toevoegen…" autoFocus />
                <button className="btn btn-primary btn-sm" onClick={addSubject}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => isLast ? save() : setWizardStep(s => s + 1)}
            disabled={saving || (isFirst && !draft.name.trim())}
            style={{ fontSize: '0.85rem' }}
          >
            {isLast ? 'Overslaan & opslaan' : 'Stap overslaan'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {error && <span style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{error}</span>}
            {!isFirst && <button className="btn btn-ghost" onClick={() => setWizardStep(s => s - 1)} disabled={saving}>← Terug</button>}
            <button
              className="btn btn-primary"
              onClick={() => isLast ? save() : setWizardStep(s => s + 1)}
              disabled={saving || (isFirst && !draft.name.trim())}
            >
              {saving ? 'Opslaan…' : isLast ? '✓ Klaar!' : 'Volgende →'}
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── NORMAL VIEW ───────────────────────────────────────────────────────────
  const data = editing ? draft : profile
  const avatarUrl = data?.avatar_url || ''

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Over mij</h2>
          <div className="subtitle">Een korte introductie</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editing ? (
            <>
              {error && <span style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{error}</span>}
              <button className="btn btn-ghost" onClick={cancel} disabled={saving}>Annuleren</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !draft.name.trim()}>
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
                    placeholder="Jouw naam *"
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

      <div style={{ marginTop: '16px' }}>
        <FeedbackThread items={feedback.filter(f => f.target_type === 'profiel')} />
      </div>
    </>
  )
}
