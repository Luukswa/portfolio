import { useState, useEffect } from 'react'

const EMPTY = { doel: '', wil_leren: '', nodig: '' }

function GoalCard({ goal, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ doel: goal.doel, wil_leren: goal.wil_leren, nodig: goal.nodig })
  const [saving, setSaving] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function save() {
    if (!form.doel.trim()) return
    setSaving(true)
    await onSave(goal.id, form)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setForm({ doel: goal.doel, wil_leren: goal.wil_leren, nodig: goal.nodig })
    setEditing(false)
  }

  return (
    <div className="card" style={{ marginBottom: '14px' }}>
      {editing ? (
        <>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Doel</label>
            <input className="edit-input" value={form.doel} onChange={set('doel')} placeholder="Mijn doel is…" autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Wat ik wil leren</label>
            <textarea className="edit-input" value={form.wil_leren} onChange={set('wil_leren')} placeholder="Ik wil leren om…" rows={3} />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Wat heb ik daar voor nodig</label>
            <textarea className="edit-input" value={form.nodig} onChange={set('nodig')} placeholder="Hiervoor heb ik nodig…" rows={3} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.doel.trim()}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuleren</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: goal.wil_leren || goal.nodig ? '14px' : 0 }}>
            <h3 style={{ fontFamily: 'var(--title)', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.3 }}>
              🎯 {goal.doel}
            </h3>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Bewerken</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(goal.id)}>×</button>
            </div>
          </div>

          {(goal.wil_leren || goal.nodig) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {goal.wil_leren && (
                <div style={{ background: 'var(--primary-light)', borderRadius: '8px', padding: '10px 14px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary)', marginBottom: '5px' }}>
                    Wat ik wil leren
                  </div>
                  <div style={{ fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{goal.wil_leren}</div>
                </div>
              )}
              {goal.nodig && (
                <div style={{ background: 'var(--secondary-light)', borderRadius: '8px', padding: '10px 14px', borderLeft: '3px solid var(--secondary)' }}>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--secondary)', marginBottom: '5px' }}>
                    Wat heb ik nodig
                  </div>
                  <div style={{ fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{goal.nodig}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Doelen() {
  const [goals, setGoals] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(setGoals)
      .catch(() => {})
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function add(e) {
    e.preventDefault()
    setError('')
    if (!form.doel.trim()) { setError('Vul een doel in.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Er ging iets mis.'); return }
      setGoals(g => [data, ...g])
      setForm(EMPTY)
      setAdding(false)
    } finally { setSaving(false) }
  }

  async function remove(id) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    setGoals(g => g.filter(x => x.id !== id))
  }

  async function save(id, updated) {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (res.ok) {
      setGoals(g => g.map(x => x.id === id ? { ...x, ...updated } : x))
    }
  }

  if (!goals) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Doelen</h2>
          <div className="subtitle">
            {goals.length === 0 ? 'Nog geen doelen toegevoegd' : `${goals.length} doel${goals.length !== 1 ? 'en' : ''}`}
          </div>
        </div>
        {!adding && (
          <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Nieuw doel</button>
        )}
      </div>

      {adding && (
        <div className="card" style={{ marginBottom: '20px', borderLeft: '3px solid var(--primary)' }}>
          <div style={{ fontFamily: 'var(--title)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Nieuw doel
          </div>
          <form onSubmit={add}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Doel</label>
              <input className="edit-input" value={form.doel} onChange={set('doel')} placeholder="Mijn doel is…" autoFocus />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Wat ik wil leren</label>
              <textarea className="edit-input" value={form.wil_leren} onChange={set('wil_leren')} placeholder="Ik wil leren om…" rows={3} />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Wat heb ik daar voor nodig</label>
              <textarea className="edit-input" value={form.nodig} onChange={set('nodig')} placeholder="Hiervoor heb ik nodig…" rows={3} />
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: '0.82rem', marginBottom: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Toevoegen…' : 'Toevoegen'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => { setAdding(false); setForm(EMPTY); setError('') }}>
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 && !adding ? (
        <div className="empty-state">Klik op "+ Nieuw doel" om je eerste doel toe te voegen.</div>
      ) : (
        goals.map(g => (
          <GoalCard key={g.id} goal={g} onDelete={remove} onSave={save} />
        ))
      )}
    </>
  )
}
