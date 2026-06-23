import { useState, useEffect } from 'react'

const EMPTY_REF = { datum: '', naam: '', vak: '', opmerking: '' }
const EMPTY = { ref1: { ...EMPTY_REF }, ref2: { ...EMPTY_REF } }

const LABELS = {
  ref1: 'Referentie 1 — Vakleerkracht',
  ref2: 'Referentie 2 — Stageleerkracht',
}

function RefCard({ label, ref: r }) {
  const hasContent = r.naam || r.datum || r.vak || r.opmerking
  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="section-title" style={{ marginTop: 0 }}>{label}</div>
      {hasContent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {r.datum && <Row label="Datum" value={r.datum} />}
          {r.naam && <Row label="Naam" value={r.naam} />}
          {r.vak && <Row label="Vak" value={r.vak} />}
          {r.opmerking && <Row label="Opmerking" value={r.opmerking} multiline />}
        </div>
      ) : (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog niet ingevuld.</div>
      )}
    </div>
  )
}

function Row({ label, value, multiline }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text)', whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</div>
    </div>
  )
}

function RefForm({ label, data, onChange }) {
  function set(field) { return e => onChange({ ...data, [field]: e.target.value }) }
  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="section-title" style={{ marginTop: 0 }}>{label}</div>
      <div className="form-group" style={{ marginBottom: '10px' }}><label>Datum</label><input className="edit-input" value={data.datum} onChange={set('datum')} placeholder="dd-mm-jjjj" /></div>
      <div className="form-group" style={{ marginBottom: '10px' }}><label>Naam</label><input className="edit-input" value={data.naam} onChange={set('naam')} placeholder="Voor- en achternaam" /></div>
      <div className="form-group" style={{ marginBottom: '10px' }}><label>Vak</label><input className="edit-input" value={data.vak} onChange={set('vak')} placeholder="Naam van het vak" /></div>
      <div className="form-group" style={{ marginBottom: 0 }}><label>Opmerking</label><textarea className="edit-input" value={data.opmerking} onChange={set('opmerking')} rows={3} placeholder="Eventuele opmerkingen…" /></div>
    </div>
  )
}

export default function Referenties() {
  const [refs, setRefs]     = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/referenties').then(r => r.json()).then(d => { setRefs(d); setForm(d) }).catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/referenties', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setRefs(form); setEditing(false) }
    } finally { setSaving(false) }
  }

  function cancel() { setForm(refs); setEditing(false) }

  if (!refs) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Mijn referenties</h2>
          <div className="subtitle">Vakleerkracht en stageleerkracht</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {editing ? (
            <>
              <button className="btn btn-ghost" onClick={cancel}>Annuleren</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => { setForm(refs); setEditing(true) }}>Bewerken</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {editing ? (
          <>
            <RefForm label={LABELS.ref1} data={form.ref1} onChange={v => setForm(f => ({ ...f, ref1: v }))} />
            <RefForm label={LABELS.ref2} data={form.ref2} onChange={v => setForm(f => ({ ...f, ref2: v }))} />
          </>
        ) : (
          <>
            <RefCard label={LABELS.ref1} ref={refs.ref1} />
            <RefCard label={LABELS.ref2} ref={refs.ref2} />
          </>
        )}
      </div>
    </>
  )
}
