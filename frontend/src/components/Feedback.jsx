import { useState } from 'react'

function FeedbackItem({ f, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--title)', flexShrink: 0 }}>
        {f.teacher_name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', borderTopLeftRadius: '3px', padding: '7px 11px', flex: 1, display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '2px' }}>
            {f.teacher_name} <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>· docent</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{f.body}</div>
        </div>
        {onDelete && (
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0, lineHeight: 1, fontSize: '1rem', flexShrink: 0 }}>×</button>
        )}
      </div>
    </div>
  )
}

/** Read-only feedback thread for students. Render as a sibling BELOW the entry's own card — never inside it. */
export function FeedbackThread({ items }) {
  if (!items || !items.length) return null
  return (
    <div style={{ marginTop: '2px', marginBottom: '6px', paddingLeft: '13px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map(f => <FeedbackItem key={f.id} f={f} />)}
    </div>
  )
}

/** Editable feedback thread + composer for teachers. Also render as a sibling BELOW the entry's own card.
 *  Collapsed behind a small "+ Feedback geven" button by default — never an always-open input. */
export function FeedbackComposer({ items, teacherId, isAdmin, onAdd, onDelete }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  function cancel() { setOpen(false); setText('') }

  async function submit() {
    if (!text.trim()) return
    setSending(true)
    try {
      await onAdd(text.trim())
      setText('')
      setOpen(false)
    } finally { setSending(false) }
  }

  if (!items.length && !open) {
    return (
      <div style={{ marginTop: '6px', marginBottom: '10px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} style={{ color: 'var(--text-dim)' }}>💬 Feedback geven</button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '6px', marginBottom: '10px', paddingLeft: '13px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map(f => (
        <FeedbackItem
          key={f.id}
          f={f}
          onDelete={(isAdmin || f.teacher_id === teacherId) ? () => onDelete(f.id) : null}
        />
      ))}
      {open ? (
        <div style={{ display: 'flex', gap: '6px', maxWidth: '440px' }}>
          <input
            className="edit-input"
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') cancel() }}
            placeholder="Schrijf feedback…"
            style={{ fontSize: '0.85rem' }}
          />
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={sending || !text.trim()}>{sending ? '…' : 'Versturen'}</button>
          <button className="btn btn-ghost btn-sm" onClick={cancel}>Annuleren</button>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} style={{ alignSelf: 'flex-start', color: 'var(--text-dim)' }}>+ Reageren</button>
      )}
    </div>
  )
}
