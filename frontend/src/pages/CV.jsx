import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const EMPTY = { naam: '', adres: '', postcode: '', telefoon: '', email: '', hobbies: [], vaardigheden: [], werkervaring: [] }
const EMPTY_WERK = { bedrijf: '', functie: '', periode: '', beschrijving: '' }

/* ── Tag input ─────────────────────────────────────── */
function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('')
  function add() {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {tags.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.82rem', fontWeight: 600 }}>
              {t}
              <button onClick={() => onChange(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input className="edit-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder} style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={add} type="button">+</button>
      </div>
    </div>
  )
}

/* ── Werkervaring edit row ──────────────────────────── */
function WerkRow({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(entry)
  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }
  function save() { onUpdate(form); setEditing(false) }
  function cancel() { setForm(entry); setEditing(false) }

  if (editing) return (
    <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '1.5px solid var(--primary)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Bedrijf</label><input className="edit-input" value={form.bedrijf} onChange={set('bedrijf')} placeholder="Bedrijfsnaam" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Functie</label><input className="edit-input" value={form.functie} onChange={set('functie')} placeholder="Jouw functie" /></div>
      </div>
      <div className="form-group" style={{ marginBottom: '8px' }}><label>Periode</label><input className="edit-input" value={form.periode} onChange={set('periode')} placeholder="Jan 2023 – heden" /></div>
      <div className="form-group" style={{ marginBottom: '10px' }}><label>Beschrijving</label><textarea className="edit-input" value={form.beschrijving} onChange={set('beschrijving')} rows={2} placeholder="Wat heb je gedaan?" /></div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="btn btn-primary btn-sm" onClick={save}>Opslaan</button>
        <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuleren</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{entry.bedrijf || '—'}{entry.functie ? ` · ${entry.functie}` : ''}</div>
        {entry.periode && <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginTop: '2px' }}>{entry.periode}</div>}
        {entry.beschrijving && <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: '4px' }}>{entry.beschrijving}</div>}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Bewerken</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>×</button>
      </div>
    </div>
  )
}

/* ── CV Preview (styled to match template) ─────────── */
function CVPreview({ cv, avatarUrl }) {
  const BG      = '#0d3535'
  const STRIP_R = '#1b5252'
  const CIRCLE  = '#7b8c27'
  const LABEL   = '#a8d0d0'

  const section = (title, content) => (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: LABEL, marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '0.62rem', lineHeight: 1.75, color: '#fff' }}>{content}</div>
    </div>
  )

  return (
    <div id="cv-preview" style={{
      display: 'flex', width: '100%', maxWidth: '660px', margin: '0 auto',
      aspectRatio: '210/297', background: BG,
      fontFamily: "'Titillium Web', 'Barlow', sans-serif",
      color: '#fff', position: 'relative', overflow: 'hidden',
      borderRadius: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Left strip — Mijn CV */}
      <div style={{ width: '46px', flexShrink: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Mijn CV
        </span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '26px 18px 26px 20px', display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0, overflow: 'hidden' }}>

        {/* Photo circle — top right, overlapping */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '148px', height: '148px', borderRadius: '50%',
          background: CIRCLE, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.75)', textAlign: 'center', padding: '0 20px', lineHeight: 1.5 }}>Foto via<br />"Over mij"</span>
          }
        </div>

        {/* Naam header */}
        <div style={{ marginBottom: '20px', paddingRight: '90px' }}>
          <div style={{ fontSize: '0.55rem', color: LABEL, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Naam</div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{cv.naam || <span style={{ opacity: 0.35 }}>Naam invullen</span>}</div>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', flex: 1 }}>
          {/* Left */}
          <div>
            {section('Profiel',
              <>{cv.naam && <div>{cv.naam}</div>}{cv.adres && <div>{cv.adres}</div>}{cv.postcode && <div>{cv.postcode}</div>}
              {!cv.naam && !cv.adres && !cv.postcode && <span style={{ opacity: 0.35 }}>Nog niet ingevuld</span>}</>
            )}
            {section('Contact',
              <>{cv.telefoon && <div><span style={{ opacity: 0.6 }}>Tel: </span>{cv.telefoon}</div>}
              {cv.email && <div><span style={{ opacity: 0.6 }}>E-mail: </span>{cv.email}</div>}
              {!cv.telefoon && !cv.email && <span style={{ opacity: 0.35 }}>Nog niet ingevuld</span>}</>
            )}
            {section("Hobby's",
              cv.hobbies?.length > 0
                ? cv.hobbies.map((h, i) => <div key={i}>• {h}</div>)
                : <span style={{ opacity: 0.35 }}>Nog niet ingevuld</span>
            )}
          </div>

          {/* Right */}
          <div>
            {section('Vaardigheden / Kwaliteiten',
              cv.vaardigheden?.length > 0
                ? cv.vaardigheden.map((v, i) => <div key={i}>• {v}</div>)
                : <span style={{ opacity: 0.35 }}>Nog niet ingevuld</span>
            )}
            {section('Werkervaring',
              cv.werkervaring?.length > 0
                ? cv.werkervaring.map((w, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700 }}>{w.bedrijf}{w.functie ? ` · ${w.functie}` : ''}</div>
                    {w.periode && <div style={{ opacity: 0.65, fontSize: '0.56rem' }}>{w.periode}</div>}
                    {w.beschrijving && <div style={{ marginTop: '1px', opacity: 0.85 }}>{w.beschrijving}</div>}
                  </div>
                ))
                : <span style={{ opacity: 0.35 }}>Nog niet ingevuld</span>
            )}
          </div>
        </div>
      </div>

      {/* Right decorative strip */}
      <div style={{ width: '42px', flexShrink: 0, background: STRIP_R, borderLeft: '1px solid rgba(255,255,255,0.06)' }} />
    </div>
  )
}

/* ── Main page ─────────────────────────────────────── */
export default function CV() {
  const { user } = useAuth()
  const [cv, setCv]         = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [addingWerk, setAddingWerk] = useState(false)
  const [newWerk, setNewWerk] = useState(EMPTY_WERK)

  useEffect(() => {
    fetch('/api/cv').then(r => r.json()).then(d => { setCv(d); setForm(d) }).catch(() => {})
    if (user?.id) {
      fetch(`/api/profile/avatar/${user.id}`).then(r => {
        if (r.ok) setAvatarUrl(`/api/profile/avatar/${user.id}`)
      }).catch(() => {})
    }
  }, [user?.id])

  function field(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/cv', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setCv(form); setEditing(false) }
    } finally { setSaving(false) }
  }

  function cancel() { setForm(cv); setEditing(false); setAddingWerk(false) }

  function updateWerk(i, u) { setForm(f => ({ ...f, werkervaring: f.werkervaring.map((w, idx) => idx === i ? u : w) })) }
  function deleteWerk(i)    { setForm(f => ({ ...f, werkervaring: f.werkervaring.filter((_, idx) => idx !== i) })) }
  function addWerk() {
    if (!newWerk.bedrijf.trim() && !newWerk.functie.trim()) return
    setForm(f => ({ ...f, werkervaring: [...f.werkervaring, newWerk] }))
    setNewWerk(EMPTY_WERK); setAddingWerk(false)
  }

  if (!cv) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Mijn CV</h2>
          <div className="subtitle">Jouw curriculum vitae</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {editing ? (
            <>
              <button className="btn btn-ghost" onClick={cancel}>Annuleren</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => window.print()}>🖨 Afdrukken</button>
              <button className="btn btn-primary" onClick={() => { setForm(cv); setEditing(true) }}>Bewerken</button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div>
          {/* Persoonlijke gegevens */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ marginTop: 0 }}>Persoonlijke gegevens</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}><label>Naam</label><input className="edit-input" value={form.naam} onChange={field('naam')} placeholder="Voor- en achternaam" /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label>Adres</label><input className="edit-input" value={form.adres} onChange={field('adres')} placeholder="Straatnaam en huisnummer" /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label>Postcode en woonplaats</label><input className="edit-input" value={form.postcode} onChange={field('postcode')} placeholder="1234 AB Woonplaats" /></div>
              <div className="form-group" style={{ marginBottom: 0 }}><label>Telefoon</label><input className="edit-input" value={form.telefoon} onChange={field('telefoon')} placeholder="06-12345678" /></div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}><label>E-mail</label><input className="edit-input" value={form.email} onChange={field('email')} placeholder="naam@example.com" /></div>
            </div>
          </div>

          {/* Vaardigheden */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ marginTop: 0 }}>Vaardigheden / Kwaliteiten</div>
            <TagInput tags={form.vaardigheden} onChange={v => setForm(f => ({ ...f, vaardigheden: v }))} placeholder="Vaardigheid toevoegen en Enter drukken…" />
          </div>

          {/* Hobby's */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ marginTop: 0 }}>Hobby's</div>
            <TagInput tags={form.hobbies} onChange={v => setForm(f => ({ ...f, hobbies: v }))} placeholder="Hobby toevoegen en Enter drukken…" />
          </div>

          {/* Werkervaring */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Werkervaring</div>
              {!addingWerk && <button className="btn btn-ghost btn-sm" onClick={() => setAddingWerk(true)}>+ Toevoegen</button>}
            </div>

            {form.werkervaring.map((w, i) => (
              <WerkRow key={i} entry={w} onUpdate={u => updateWerk(i, u)} onDelete={() => deleteWerk(i)} />
            ))}

            {addingWerk && (
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', border: '1.5px solid var(--primary)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}><label>Bedrijf</label><input className="edit-input" value={newWerk.bedrijf} onChange={e => setNewWerk(w => ({ ...w, bedrijf: e.target.value }))} placeholder="Bedrijfsnaam" autoFocus /></div>
                  <div className="form-group" style={{ marginBottom: 0 }}><label>Functie</label><input className="edit-input" value={newWerk.functie} onChange={e => setNewWerk(w => ({ ...w, functie: e.target.value }))} placeholder="Jouw functie" /></div>
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}><label>Periode</label><input className="edit-input" value={newWerk.periode} onChange={e => setNewWerk(w => ({ ...w, periode: e.target.value }))} placeholder="Jan 2023 – heden" /></div>
                <div className="form-group" style={{ marginBottom: '10px' }}><label>Beschrijving</label><textarea className="edit-input" value={newWerk.beschrijving} onChange={e => setNewWerk(w => ({ ...w, beschrijving: e.target.value }))} rows={2} placeholder="Wat heb je gedaan?" /></div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-primary btn-sm" onClick={addWerk}>Toevoegen</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setAddingWerk(false); setNewWerk(EMPTY_WERK) }}>Annuleren</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <CVPreview cv={cv} avatarUrl={avatarUrl} />
      )}
    </>
  )
}
