import { useState, useEffect, useRef } from 'react'

const EMPTY = { vak: '', gemaakt_bij: '', datum: '', trots_omdat: '' }

function PhotoArea({ fotoUrl, cacheKey, editing, onUpload }) {
  const inputRef = useRef()
  // Only add cache-bust to API URLs (/api/...), not to data: or blob: previews
  const src = fotoUrl
    ? (fotoUrl.startsWith('/') || fotoUrl.startsWith('http') ? `${fotoUrl}?t=${cacheKey}` : fotoUrl)
    : null

  if (!editing) {
    return src ? (
      <img src={src} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '6px 6px 0 0', display: 'block' }} />
    ) : (
      <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--surface2)', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
        Geen foto
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      style={{
        width: '100%', aspectRatio: '4/3', borderRadius: '6px 6px 0 0',
        background: src ? 'transparent' : 'var(--surface2)',
        border: src ? 'none' : '2px dashed var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
      }}
    >
      {src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: src ? 0 : 1, transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = src ? 0 : 1}
      >
        <span style={{ fontSize: '1.4rem' }}>📷</span>
        <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{src ? 'Foto wijzigen' : 'Foto toevoegen'}</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && onUpload(e.target.files[0])} />
    </div>
  )
}

function WerkstukCard({ item, onSaved, onDeleted }) {
  const [editing, setEditing]     = useState(false)
  const [form, setForm]           = useState({ vak: item.vak, gemaakt_bij: item.gemaakt_bij, datum: item.datum, trots_omdat: item.trots_omdat })
  const [fotoUrl, setFotoUrl]     = useState(item.foto_url)
  const [cacheKey, setCacheKey]   = useState(item.foto_url ? 1 : 0)
  const [pendingFile, setPending] = useState(null)
  const [previewUrl, setPreview]  = useState(null)
  const [saving, setSaving]       = useState(false)

  // Keep fotoUrl in sync if parent updates item.foto_url
  useEffect(() => { setFotoUrl(item.foto_url) }, [item.foto_url])

  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }

  function pickPhoto(file) {
    setPending(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/werkstukken/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      let newFotoUrl = fotoUrl
      if (pendingFile) {
        const fd = new FormData(); fd.append('file', pendingFile)
        const res = await fetch(`/api/werkstukken/${item.id}/foto`, { method: 'POST', body: fd })
        const data = await res.json()
        newFotoUrl = data.foto_url
        setCacheKey(Date.now())
      }
      setFotoUrl(newFotoUrl)
      setPending(null); setPreview(null)
      setEditing(false)
      onSaved({ ...item, ...form, foto_url: newFotoUrl })
    } finally { setSaving(false) }
  }

  function cancel() {
    setForm({ vak: item.vak, gemaakt_bij: item.gemaakt_bij, datum: item.datum, trots_omdat: item.trots_omdat })
    setPending(null); setPreview(null); setEditing(false)
  }

  // Use object URL as preview while editing, stable API url when viewing
  const displayFoto = previewUrl || (fotoUrl || null)
  const displayKey  = previewUrl ? 'preview' : cacheKey

  const label = (txt) => (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>{txt}</span>
  )

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
      <PhotoArea fotoUrl={displayFoto} cacheKey={displayKey} editing={editing} onUpload={pickPhoto} />

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {editing ? (
          <>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Vak</label><input className="edit-input" value={form.vak} onChange={set('vak')} placeholder="Naam van het vak" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Dit heb ik gemaakt bij</label><input className="edit-input" value={form.gemaakt_bij} onChange={set('gemaakt_bij')} placeholder="Bijv. een opdracht, stage…" /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>Datum</label><input className="edit-input" value={form.datum} onChange={set('datum')} placeholder="dd-mm-jjjj" /></div>
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
            {item.datum      && <div>{label('Datum')}<div style={{ fontSize: '0.85rem', marginTop: '1px' }}>{item.datum}</div></div>}
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

function AddForm({ onAdded, onCancel }) {
  const [form, setForm]       = useState(EMPTY)
  const [previewUrl, setPreview] = useState(null)
  const [saving, setSaving]   = useState(false)
  const fileRef               = useRef(null) // ref avoids stale-closure on fast clicks

  function set(f) { return e => setForm(p => ({ ...p, [f]: e.target.value })) }
  function pickPhoto(file) {
    fileRef.current = file
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('vak',         form.vak)
      fd.append('gemaakt_bij', form.gemaakt_bij)
      fd.append('datum',       form.datum)
      fd.append('trots_omdat', form.trots_omdat)
      if (fileRef.current) fd.append('file', fileRef.current)
      const res  = await fetch('/api/werkstukken', { method: 'POST', body: fd })
      const item = await res.json()
      onAdded(item)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--primary)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <PhotoArea fotoUrl={previewUrl} cacheKey="preview" editing onUpload={pickPhoto} />
      <form onSubmit={submit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Vak</label><input className="edit-input" value={form.vak} onChange={set('vak')} placeholder="Naam van het vak" autoFocus /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Dit heb ik gemaakt bij</label><input className="edit-input" value={form.gemaakt_bij} onChange={set('gemaakt_bij')} placeholder="Bijv. een opdracht, stage…" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Datum</label><input className="edit-input" value={form.datum} onChange={set('datum')} placeholder="dd-mm-jjjj" /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label>Ik ben hier trots op omdat</label><textarea className="edit-input" value={form.trots_omdat} onChange={set('trots_omdat')} rows={3} placeholder="Vertel waarom je hier trots op bent…" /></div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Toevoegen…' : 'Toevoegen'}</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>Annuleren</button>
        </div>
      </form>
    </div>
  )
}

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
