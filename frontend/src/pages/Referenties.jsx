import { useState, useEffect } from 'react'

const EMPTY_REF = { type: '', naam: '', datum: '', vak: '', opmerking: '' }

function Row({ label, value, multiline }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text)', whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</div>
    </div>
  )
}

export default function Referenties() {
  const [refs, setRefs] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/referenties').then(r => r.json()).then(setRefs).catch(() => setRefs([]))
  }, [])

  function startEdit() {
    setDraft(refs.map(r => ({ ...r })))
    setEditing(true)
  }

  function cancel() {
    setDraft([])
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/referenties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (res.ok) {
        setRefs(draft.map(r => ({ ...r })))
        setEditing(false)
      }
    } finally { setSaving(false) }
  }

  function updateRef(i, field, value) {
    setDraft(d => d.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  if (refs === null) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Mijn referenties</h2>
          <div className="subtitle">{refs.length} referentie{refs.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {editing ? (
            <>
              <button className="btn btn-ghost" onClick={cancel} disabled={saving}>Annuleren</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={startEdit}>Bewerken</button>
          )}
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {draft.map((ref, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div className="section-title" style={{ margin: 0 }}>Referentie {i + 1}</div>
                <button
                  onClick={() => setDraft(d => d.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.82rem', padding: '2px 6px' }}
                >
                  Verwijderen
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Type</label>
                  <input className="edit-input" value={ref.type} onChange={e => updateRef(i, 'type', e.target.value)} placeholder="Bijv. Vakleerkracht" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Naam</label>
                  <input className="edit-input" value={ref.naam} onChange={e => updateRef(i, 'naam', e.target.value)} placeholder="Voor- en achternaam" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Datum</label>
                  <input className="edit-input" value={ref.datum} onChange={e => updateRef(i, 'datum', e.target.value)} placeholder="dd-mm-jjjj" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Vak</label>
                  <input className="edit-input" value={ref.vak} onChange={e => updateRef(i, 'vak', e.target.value)} placeholder="Naam van het vak" />
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label>Opmerking</label>
                  <textarea className="edit-input" value={ref.opmerking} onChange={e => updateRef(i, 'opmerking', e.target.value)} rows={3} placeholder="Eventuele opmerkingen…" />
                </div>
              </div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            onClick={() => setDraft(d => [...d, { ...EMPTY_REF }])}
            style={{ alignSelf: 'flex-start' }}
          >
            + Referentie toevoegen
          </button>
        </div>
      ) : refs.length === 0 ? (
        <div className="empty-state">Nog geen referenties. Klik op Bewerken om er een toe te voegen.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {refs.map((ref, i) => (
            <div key={ref.id || i} className="card">
              {ref.type && <div className="section-title" style={{ marginTop: 0 }}>{ref.type}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ref.naam && <Row label="Naam" value={ref.naam} />}
                {ref.datum && <Row label="Datum" value={ref.datum} />}
                {ref.vak && <Row label="Vak" value={ref.vak} />}
                {ref.opmerking && <Row label="Opmerking" value={ref.opmerking} multiline />}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
