import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const EMPTY = { naam: '', adres: '', postcode: '', telefoon: '', email: '', hobbies: [], vaardigheden: [], werkervaring: [] }
const EMPTY_WERK = { bedrijf: '', functie: '', periode: '', beschrijving: '' }

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
            <span key={t} className="badge badge-primary" style={{ gap: '4px' }}>
              {t}
              <button onClick={() => onChange(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, padding: 0, marginLeft: '2px' }}>×</button>
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

function Field({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

export default function CV() {
  const { user } = useAuth()
  const [cv, setCv]           = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [addingWerk, setAddingWerk] = useState(false)
  const [newWerk, setNewWerk] = useState(EMPTY_WERK)

  useEffect(() => {
    fetch('/api/cv').then(r => r.json()).then(d => { setCv(d); setForm(d) }).catch(() => {})
  }, [])

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
            <button className="btn btn-primary" onClick={() => { setForm(cv); setEditing(true) }}>Bewerken</button>
          )}
        </div>
      </div>

      {editing ? (
        <>
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

          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ marginTop: 0 }}>Vaardigheden / Kwaliteiten</div>
            <TagInput tags={form.vaardigheden} onChange={v => setForm(f => ({ ...f, vaardigheden: v }))} placeholder="Vaardigheid toevoegen en Enter drukken…" />
          </div>

          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ marginTop: 0 }}>Hobby's</div>
            <TagInput tags={form.hobbies} onChange={v => setForm(f => ({ ...f, hobbies: v }))} placeholder="Hobby toevoegen en Enter drukken…" />
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="section-title" style={{ marginTop: 0, marginBottom: 0 }}>Werkervaring</div>
              {!addingWerk && <button className="btn btn-ghost btn-sm" onClick={() => setAddingWerk(true)}>+ Toevoegen</button>}
            </div>
            {form.werkervaring.map((w, i) => (
              <WerkRow key={i} entry={w} onUpdate={u => updateWerk(i, u)} onDelete={() => deleteWerk(i)} />
            ))}
            {form.werkervaring.length === 0 && !addingWerk && (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog geen werkervaring toegevoegd.</div>
            )}
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
        </>
      ) : (
        <>
          {/* View mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="card">
              <div className="section-title" style={{ marginTop: 0 }}>Persoonlijke gegevens</div>
              <Field label="Naam" value={cv.naam} />
              <Field label="Adres" value={cv.adres} />
              <Field label="Postcode en woonplaats" value={cv.postcode} />
              {!cv.naam && !cv.adres && !cv.postcode && <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog niet ingevuld.</div>}
            </div>
            <div className="card">
              <div className="section-title" style={{ marginTop: 0 }}>Contact</div>
              <Field label="Telefoon" value={cv.telefoon} />
              <Field label="E-mail" value={cv.email} />
              {!cv.telefoon && !cv.email && <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog niet ingevuld.</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="card">
              <div className="section-title" style={{ marginTop: 0 }}>Vaardigheden / Kwaliteiten</div>
              {cv.vaardigheden?.length > 0
                ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{cv.vaardigheden.map(v => <span key={v} className="badge badge-primary">{v}</span>)}</div>
                : <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog niet ingevuld.</div>}
            </div>
            <div className="card">
              <div className="section-title" style={{ marginTop: 0 }}>Hobby's</div>
              {cv.hobbies?.length > 0
                ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{cv.hobbies.map(h => <span key={h} className="badge badge-blue">{h}</span>)}</div>
                : <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog niet ingevuld.</div>}
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginTop: 0 }}>Werkervaring</div>
            {cv.werkervaring?.length > 0
              ? cv.werkervaring.map((w, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < cv.werkervaring.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.bedrijf}{w.functie ? ` · ${w.functie}` : ''}</div>
                  {w.periode && <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginTop: '2px' }}>{w.periode}</div>}
                  {w.beschrijving && <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '4px' }}>{w.beschrijving}</div>}
                </div>
              ))
              : <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog niet ingevuld.</div>}
          </div>
        </>
      )}
    </>
  )
}
