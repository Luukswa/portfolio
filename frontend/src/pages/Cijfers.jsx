import { useState, useEffect } from 'react'

function cijferBadge(c) {
  if (c >= 7)   return 'badge badge-green'
  if (c >= 5.5) return 'badge badge-amber'
  return 'badge badge-red'
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Cijfers() {
  const [grades, setGrades] = useState(null)
  const [vak, setVak] = useState('')
  const [cijfer, setCijfer] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/grades')
      .then(r => r.json())
      .then(setGrades)
      .catch(() => {})
  }, [])

  async function add(e) {
    e.preventDefault()
    setError('')
    if (!vak.trim()) { setError('Vul een vaknaam in.'); return }
    const c = parseFloat(cijfer.replace(',', '.'))
    if (isNaN(c) || c < 1 || c > 10) { setError('Cijfer moet tussen 1 en 10 liggen.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vak: vak.trim(), cijfer: c }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Er ging iets mis.'); return }
      setGrades(g => [...g, data].sort((a, b) => a.vak.localeCompare(b.vak)))
      setVak(''); setCijfer('')
    } finally { setSaving(false) }
  }

  async function remove(id) {
    await fetch(`/api/grades/${id}`, { method: 'DELETE' })
    setGrades(g => g.filter(x => x.id !== id))
  }

  if (!grades) return <div className="empty-state">Laden…</div>

  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.cijfer, 0) / grades.length).toFixed(1)
    : null
  const passes = grades.filter(g => g.cijfer >= 5.5).length

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Mijn cijfers</h2>
          <div className="subtitle">
            {grades.length === 0
              ? 'Nog geen cijfers toegevoegd'
              : `${grades.length} vak${grades.length !== 1 ? 'ken' : ''} · gemiddelde ${avg}`}
          </div>
        </div>
      </div>

      {/* Stats */}
      {grades.length > 0 && (
        <div className="stats-row" style={{ marginBottom: '16px' }}>
          <div className="stat blue">
            <div className="stat-icon-wrap">📚</div>
            <div className="stat-body">
              <div className="num">{grades.length}</div>
              <div className="lbl">Vakken</div>
            </div>
          </div>
          <div className={`stat ${parseFloat(avg) >= 5.5 ? 'green' : 'red'}`}>
            <div className="stat-icon-wrap">⌀</div>
            <div className="stat-body">
              <div className="num">{avg}</div>
              <div className="lbl">Gemiddelde</div>
            </div>
          </div>
          <div className="stat green">
            <div className="stat-icon-wrap">✓</div>
            <div className="stat-body">
              <div className="num">{passes}</div>
              <div className="lbl">Voldoendes</div>
            </div>
          </div>
          <div className="stat red">
            <div className="stat-icon-wrap">✗</div>
            <div className="stat-body">
              <div className="num">{grades.length - passes}</div>
              <div className="lbl">Onvoldoendes</div>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <form onSubmit={add} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 2, minWidth: '160px', marginBottom: 0 }}>
            <label>Vak</label>
            <input
              className="edit-input"
              value={vak}
              onChange={e => setVak(e.target.value)}
              placeholder="Bijv. Informatica"
              autoComplete="off"
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
            <label>Cijfer</label>
            <input
              className="edit-input"
              value={cijfer}
              onChange={e => setCijfer(e.target.value)}
              placeholder="7.5"
              inputMode="decimal"
              autoComplete="off"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginBottom: 0 }}>
            {saving ? 'Toevoegen…' : 'Toevoegen'}
          </button>
        </form>
        {error && <div style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '8px' }}>{error}</div>}
      </div>

      {/* Table */}
      {grades.length === 0 ? (
        <div className="empty-state">Voeg je eerste cijfer toe via het formulier hierboven.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vak</th>
                <th>Cijfer</th>
                <th>Datum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 500 }}>{g.vak}</td>
                  <td>
                    <span className={cijferBadge(g.cijfer)} style={{ fontSize: '0.82rem', padding: '3px 10px' }}>
                      {g.cijfer % 1 === 0 ? g.cijfer.toFixed(1) : g.cijfer}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-soft)', fontSize: '0.82rem' }}>{fmt(g.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => remove(g.id)}
                      className="btn btn-danger btn-sm"
                      title="Verwijderen"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
