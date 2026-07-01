import { useState, useEffect } from 'react'

const EMPTY = { doel: '', wil_leren: '', nodig: '' }

function Section({ label, text, bg, color }) {
  if (!text) return null
  return (
    <div style={{ background: bg, borderRadius: '6px', padding: '8px 11px' }}>
      <strong style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color, opacity: 0.7, marginBottom: '3px' }}>{label}</strong>
      <span style={{ fontSize: '0.875rem', color, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{text}</span>
    </div>
  )
}

function FeedbackList({ items }) {
  if (!items.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map(f => (
        <div key={f.id} style={{ background: 'var(--amber-dim)', borderRadius: '6px', padding: '8px 11px' }}>
          <strong style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--amber)', opacity: 0.8, marginBottom: '3px' }}>
            Feedback van {f.teacher_name}
          </strong>
          <span style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{f.body}</span>
        </div>
      ))}
    </div>
  )
}

function GoalCard({ goal, feedback, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ doel: goal.doel, wil_leren: goal.wil_leren, nodig: goal.nodig })
  const [saving, setSaving] = useState(false)

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

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
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {editing ? (
        <>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Doel</label>
            <input className="edit-input" value={form.doel} onChange={set('doel')} placeholder="Mijn doel is…" autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Wat ik wil leren</label>
            <textarea className="edit-input" value={form.wil_leren} onChange={set('wil_leren')} placeholder="Ik wil leren om…" rows={3} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Wat heb ik daar voor nodig</label>
            <textarea className="edit-input" value={form.nodig} onChange={set('nodig')} placeholder="Hiervoor heb ik nodig…" rows={3} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.doel.trim()}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuleren</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.4 }}>{goal.doel}</span>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Bewerken</button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(goal.id)}>×</button>
            </div>
          </div>
          <Section label="Wat ik wil leren"       text={goal.wil_leren} bg="var(--primary-dim)"  color="var(--primary-dark)" />
          <Section label="Wat ik daarvoor nodig heb" text={goal.nodig}  bg="var(--green-dim)"    color="var(--green)" />
          <FeedbackList items={feedback} />
        </>
      )}
    </div>
  )
}

export default function Doelen() {
  const [goals, setGoals] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(setGoals)
      .catch(() => {})
    fetch('/api/feedback')
      .then(r => r.json())
      .then(setFeedback)
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
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--primary)', borderRadius: '10px', padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Doel</label>
              <input className="edit-input" value={form.doel} onChange={set('doel')} placeholder="Mijn doel is…" autoFocus />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Wat ik wil leren</label>
              <textarea className="edit-input" value={form.wil_leren} onChange={set('wil_leren')} placeholder="Ik wil leren om…" rows={3} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Wat heb ik daar voor nodig</label>
              <textarea className="edit-input" value={form.nodig} onChange={set('nodig')} placeholder="Hiervoor heb ik nodig…" rows={3} />
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: '0.82rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Toevoegen…' : 'Toevoegen'}</button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setAdding(false); setForm(EMPTY); setError('') }}>Annuleren</button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 && !adding ? (
        <div className="empty-state">Klik op "+ Nieuw doel" om je eerste doel toe te voegen.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {goals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              feedback={feedback.filter(f => f.target_type === 'goal' && f.target_id === g.id)}
              onDelete={remove}
              onSave={save}
            />
          ))}
        </div>
      )}
    </>
  )
}
