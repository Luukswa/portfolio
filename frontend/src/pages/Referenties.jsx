import { useState, useEffect } from 'react'

const EMPTY = { type: '', naam: '', datum: '', vak: '', opmerking: '' }

function Row({ label, value, multiline }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text)', whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</div>
    </div>
  )
}

const fieldLabel = txt => (
  <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>{txt}</span>
)

function RefFields({ form, set }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Type</label>
        <input className="edit-input" value={form.type} onChange={set('type')} placeholder="Bijv. Vakleerkracht" />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Naam</label>
        <input className="edit-input" value={form.naam} onChange={set('naam')} placeholder="Voor- en achternaam" />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Datum</label>
        <input className="edit-input" value={form.datum} onChange={set('datum')} placeholder="dd-mm-jjjj" />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Vak</label>
        <input className="edit-input" value={form.vak} onChange={set('vak')} placeholder="Naam van het vak" />
      </div>
      <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
        <label>Opmerking</label>
        <textarea className="edit-input" value={form.opmerking} onChange={set('opmerking')} rows={3} placeholder="Eventuele opmerkingen…" />
      </div>
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

  return (
    <div className="card">
      {editing ? (
        <>
          {fieldLabel('Referentie')}
          <div style={{ marginTop: '10px' }}>
            <RefFields form={form} set={set} />
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuleren</button>
          </div>
        </>
      ) : (
        <>
          {item.type && <div className="section-title" style={{ marginTop: 0 }}>{item.type}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {item.naam && <Row label="Naam" value={item.naam} />}
            {item.datum && <Row label="Datum" value={item.datum} />}
            {item.vak && <Row label="Vak" value={item.vak} />}
            {item.opmerking && <Row label="Opmerking" value={item.opmerking} multiline />}
            {!item.naam && !item.datum && !item.vak && !item.opmerking && (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Nog niet ingevuld.</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Bewerken</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDeleted(item.id)}>Verwijderen</button>
          </div>
        </>
      )}
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
    <div className="card" style={{ border: '1.5px solid var(--primary)' }}>
      {fieldLabel('Nieuwe referentie')}
      <form onSubmit={submit} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <RefFields form={form} set={set} />
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
        {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Referentie toevoegen</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
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
        <div className="empty-state">Klik op "+ Referentie toevoegen" om je eerste referentie toe te voegen.</div>
      )}
    </>
  )
}
