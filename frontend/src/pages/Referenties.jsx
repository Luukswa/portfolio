import { useState, useEffect } from 'react'

const EMPTY = { type: '', naam: '', datum: '', vak: '', opmerking: '' }

const fieldLabel = txt => (
  <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>{txt}</span>
)

function Row({ label, value, multiline }) {
  return (
    <div>
      {fieldLabel(label)}
      <div style={{ fontSize: '0.88rem', color: 'var(--text)', whiteSpace: multiline ? 'pre-wrap' : 'normal', marginTop: '2px' }}>{value}</div>
    </div>
  )
}

// ── Referentie card ───────────────────────────────────────────────────────────

function ReferentieCard({ item, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ type: item.type, naam: item.naam, datum: item.datum, vak: item.vak, opmerking: item.opmerking })
  const [saving, setSaving]   = useState(false)

  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/referenties/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setEditing(false)
      onSaved({ ...item, ...form })
    } finally { setSaving(false) }
  }

  function cancel() {
    setForm({ type: item.type, naam: item.naam, datum: item.datum, vak: item.vak, opmerking: item.opmerking })
    setEditing(false)
  }

  const hdrType  = editing ? form.type : item.type
  const hdrTitle = editing ? (form.naam || form.type || 'Nieuwe referentie') : (item.naam || item.type || 'Referentie')

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {hdrType && <span className="badge badge-primary" style={{ flexShrink: 0 }}>{hdrType}</span>}
        <span style={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, color: 'var(--text)' }}>{hdrTitle}</span>
        {!editing && item.datum && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', flexShrink: 0 }}>{item.datum}</span>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {editing ? (
          <>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Type</label><input className="edit-input" value={form.type} onChange={set('type')} placeholder="Bijv. Vakleerkracht" autoFocus /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Naam</label><input className="edit-input" value={form.naam} onChange={set('naam')} placeholder="Voor- en achternaam" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Datum</label><input className="edit-input" value={form.datum} onChange={set('datum')} placeholder="dd-mm-jjjj" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Vak</label><input className="edit-input" value={form.vak} onChange={set('vak')} placeholder="Naam van het vak" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Opmerking</label><textarea className="edit-input" value={form.opmerking} onChange={set('opmerking')} rows={3} placeholder="Eventuele opmerkingen…" /></div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
              <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuleren</button>
            </div>
          </>
        ) : (
          <>
            {item.vak && <Row label="Vak" value={item.vak} />}
            {item.opmerking && <Row label="Opmerking" value={item.opmerking} multiline />}
            {!item.vak && !item.opmerking && !item.datum && (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Nog niet ingevuld.</div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Bewerken</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDeleted(item.id)}>Verwijderen</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Add form ──────────────────────────────────────────────────────────────────

function AddForm({ onAdded, onCancel }) {
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/referenties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) onAdded(await res.json())
    } finally { setSaving(false) }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--primary)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

      {/* ── Header preview ── */}
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="badge badge-primary" style={{ flexShrink: 0, opacity: form.type ? 1 : 0.4 }}>{form.type || 'Type'}</span>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, color: form.naam ? 'var(--text)' : 'var(--text-dim)' }}>
          {form.naam || 'Nieuwe referentie'}
        </span>
      </div>

      {/* ── Form ── */}
      <form onSubmit={submit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Type</label><input className="edit-input" value={form.type} onChange={set('type')} placeholder="Bijv. Vakleerkracht" autoFocus /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Naam</label><input className="edit-input" value={form.naam} onChange={set('naam')} placeholder="Voor- en achternaam" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Datum</label><input className="edit-input" value={form.datum} onChange={set('datum')} placeholder="dd-mm-jjjj" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Vak</label><input className="edit-input" value={form.vak} onChange={set('vak')} placeholder="Naam van het vak" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Opmerking</label><textarea className="edit-input" value={form.opmerking} onChange={set('opmerking')} rows={3} placeholder="Eventuele opmerkingen…" /></div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Toevoegen…' : 'Toevoegen'}</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>Annuleren</button>
        </div>
      </form>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Referenties() {
  const [refs, setRefs]     = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/referenties').then(r => r.json()).then(setRefs).catch(() => setRefs([]))
  }, [])

  async function remove(id) {
    await fetch(`/api/referenties/${id}`, { method: 'DELETE' })
    setRefs(rs => rs.filter(x => x.id !== id))
  }

  if (refs === null) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Mijn referenties</h2>
          <div className="subtitle">{refs.length === 0 ? 'Nog geen referenties' : `${refs.length} referentie${refs.length !== 1 ? 's' : ''}`}</div>
        </div>
        {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Nieuwe referentie</button>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {adding && <AddForm onAdded={item => { setRefs(rs => [...rs, item]); setAdding(false) }} onCancel={() => setAdding(false)} />}
        {refs.map(ref => (
          <ReferentieCard
            key={ref.id}
            item={ref}
            onSaved={updated => setRefs(rs => rs.map(x => x.id === updated.id ? updated : x))}
            onDeleted={remove}
          />
        ))}
      </div>

      {refs.length === 0 && !adding && (
        <div className="empty-state">Klik op "+ Nieuwe referentie" om je eerste referentie toe te voegen.</div>
      )}
    </>
  )
}
