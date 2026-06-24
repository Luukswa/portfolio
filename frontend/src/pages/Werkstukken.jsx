import { useState, useEffect, useRef, useCallback } from 'react'

const EMPTY = { vak: '', gemaakt_bij: '', datum: '', trots_omdat: '' }

function displayDatum(d) {
  if (!d) return ''
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d
}

function toInputDate(d) {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const m = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return ''
}

// ── Inline lightbox ───────────────────────────────────────────────────────────

function Lightbox({ url, onClose }) {
  const close = useCallback(e => { if (e.target === e.currentTarget) onClose() }, [onClose])
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '-14px', right: '-14px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', display: 'block' }} />
      </div>
    </div>
  )
}

// ── Photo strip (view + edit) ─────────────────────────────────────────────────

function FotoStrip({ fotos, editing, onAdd, onDelete }) {
  const inputRef  = useRef()
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox]   = useState(null)

  async function handleAdd(file) {
    setUploading(true)
    try { await onAdd(file) } finally { setUploading(false) }
  }

  const thumb = { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', display: 'block', flexShrink: 0 }
  const strip = { display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 12px', minHeight: '100px', alignItems: 'center', background: 'var(--surface2)', borderRadius: '6px 6px 0 0' }

  if (!editing) {
    if (fotos.length === 0) return (
      <div style={{ ...strip, justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>Geen foto's</div>
    )
    return (
      <>
        <div style={strip}>
          {fotos.map(f => (
            <img key={f.id} src={`${f.url}?t=1`} alt="" style={{ ...thumb, cursor: 'pointer' }} onClick={() => setLightbox(f.url)} />
          ))}
        </div>
        {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      </>
    )
  }

  return (
    <div style={strip}>
      {fotos.map(f => (
        <div key={f.id} style={{ position: 'relative', flexShrink: 0 }}>
          <img src={`${f.url}?t=1`} alt="" style={thumb} />
          <button
            onClick={() => onDelete(f.id)}
            style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#e53e3e', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
          >×</button>
        </div>
      ))}
      <div
        onClick={() => !uploading && inputRef.current.click()}
        style={{ width: '80px', height: '80px', borderRadius: '6px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', color: 'var(--text-dim)', flexShrink: 0, gap: '2px' }}
      >
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{uploading ? '…' : '+'}</span>
        <span style={{ fontSize: '0.65rem' }}>Foto</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleAdd(e.target.files[0])} />
    </div>
  )
}

// ── Werkstuk card ─────────────────────────────────────────────────────────────

function WerkstukCard({ item, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ vak: item.vak, gemaakt_bij: item.gemaakt_bij, datum: item.datum, trots_omdat: item.trots_omdat })
  const [fotos, setFotos]     = useState(item.fotos || [])
  const [saving, setSaving]   = useState(false)

  useEffect(() => { setFotos(item.fotos || []) }, [item.fotos])

  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }

  async function addFoto(file) {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`/api/werkstukken/${item.id}/fotos`, { method: 'POST', body: fd })
    if (res.ok) { const f = await res.json(); setFotos(fs => [...fs, f]) }
  }

  async function deleteFoto(fotoId) {
    await fetch(`/api/werkstukken/${item.id}/fotos/${fotoId}`, { method: 'DELETE' })
    setFotos(fs => fs.filter(x => x.id !== fotoId))
  }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/werkstukken/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setEditing(false)
      onSaved({ ...item, ...form, fotos })
    } finally { setSaving(false) }
  }

  function cancel() {
    setForm({ vak: item.vak, gemaakt_bij: item.gemaakt_bij, datum: item.datum, trots_omdat: item.trots_omdat })
    setEditing(false)
  }

  const label = txt => <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>{txt}</span>

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
      <FotoStrip fotos={fotos} editing={editing} onAdd={addFoto} onDelete={deleteFoto} />

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {editing ? (
          <>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Vak <span style={{ color: '#e53e3e' }}>*</span></label><input className="edit-input" value={form.vak} onChange={set('vak')} placeholder="Naam van het vak" required /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Dit heb ik gemaakt bij</label><input className="edit-input" value={form.gemaakt_bij} onChange={set('gemaakt_bij')} placeholder="Bijv. een opdracht, stage…" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Datum</label><input className="edit-input" type="date" value={toInputDate(form.datum)} onChange={set('datum')} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Ik ben hier trots op omdat</label><textarea className="edit-input" value={form.trots_omdat} onChange={set('trots_omdat')} rows={3} placeholder="Vertel waarom je hier trots op bent…" /></div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
              <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuleren</button>
            </div>
          </>
        ) : (
          <>
            {item.vak        && <div>{label('Vak')}<div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: '1px' }}>{item.vak}</div></div>}
            {item.gemaakt_bij && <div>{label('Dit heb ik gemaakt bij')}<div style={{ fontSize: '0.85rem', marginTop: '1px' }}>{item.gemaakt_bij}</div></div>}
            {item.datum      && <div>{label('Datum')}<div style={{ fontSize: '0.85rem', marginTop: '1px' }}>{displayDatum(item.datum)}</div></div>}
            {item.trots_omdat && <div>{label('Ik ben hier trots op omdat')}<div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '1px', lineHeight: 1.5 }}>{item.trots_omdat}</div></div>}
            {!item.vak && !item.gemaakt_bij && !item.datum && !item.trots_omdat && <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Nog niet ingevuld.</div>}
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px' }}>
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
  const [form, setForm]      = useState(EMPTY)
  const [pending, setPending] = useState([]) // [{dataUrl, file}]
  const [saving, setSaving]  = useState(false)
  const inputRef             = useRef()

  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }

  function addFiles(fileList) {
    Array.from(fileList).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => setPending(ps => [...ps, { dataUrl: e.target.result, file }])
      reader.readAsDataURL(file)
    })
  }

  function removeFile(idx) { setPending(ps => ps.filter((_, i) => i !== idx)) }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('vak',         form.vak)
      fd.append('gemaakt_bij', form.gemaakt_bij)
      fd.append('datum',       form.datum)
      fd.append('trots_omdat', form.trots_omdat)
      pending.forEach(p => fd.append('file', p.file))
      const res  = await fetch('/api/werkstukken', { method: 'POST', body: fd })
      const item = await res.json()
      onAdded(item)
    } finally { setSaving(false) }
  }

  const thumb = { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', display: 'block' }
  const strip = { display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 12px', minHeight: '100px', alignItems: 'center', background: 'var(--surface2)' }

  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--primary)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {/* Multi-photo picker strip */}
      <div style={strip}>
        {pending.map((p, i) => (
          <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
            <img src={p.dataUrl} alt="" style={thumb} />
            <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#e53e3e', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        ))}
        <div onClick={() => inputRef.current.click()} style={{ width: '80px', height: '80px', borderRadius: '6px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0, gap: '2px' }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: '0.65rem' }}>Foto('s)</span>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
      </div>

      <form onSubmit={submit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Vak <span style={{ color: '#e53e3e' }}>*</span></label><input className="edit-input" value={form.vak} onChange={set('vak')} placeholder="Naam van het vak" required autoFocus /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Dit heb ik gemaakt bij</label><input className="edit-input" value={form.gemaakt_bij} onChange={set('gemaakt_bij')} placeholder="Bijv. een opdracht, stage…" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Datum</label><input className="edit-input" type="date" value={form.datum} onChange={set('datum')} /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Ik ben hier trots op omdat</label><textarea className="edit-input" value={form.trots_omdat} onChange={set('trots_omdat')} rows={3} placeholder="Vertel waarom je hier trots op bent…" /></div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Toevoegen…' : 'Toevoegen'}</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>Annuleren</button>
        </div>
      </form>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Werkstukken() {
  const [items, setItems]   = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/werkstukken').then(r => r.json()).then(setItems).catch(() => {})
  }, [])

  async function remove(id) {
    await fetch(`/api/werkstukken/${id}`, { method: 'DELETE' })
    setItems(it => it.filter(x => x.id !== id))
  }

  if (!items) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Mijn werkstukken</h2>
          <div className="subtitle">{items.length === 0 ? 'Nog geen werkstukken' : `${items.length} werkstuk${items.length !== 1 ? 'ken' : ''}`}</div>
        </div>
        {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Nieuw werkstuk</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {adding && <AddForm onAdded={item => { setItems(it => [item, ...it]); setAdding(false) }} onCancel={() => setAdding(false)} />}
        {items.map(item => (
          <WerkstukCard
            key={item.id}
            item={item}
            onSaved={updated => setItems(it => it.map(x => x.id === updated.id ? updated : x))}
            onDeleted={remove}
          />
        ))}
      </div>

      {items.length === 0 && !adding && (
        <div className="empty-state">Klik op "+ Nieuw werkstuk" om je eerste werkstuk toe te voegen.</div>
      )}
    </>
  )
}
