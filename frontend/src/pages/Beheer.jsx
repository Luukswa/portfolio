import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Beheer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState(null)

  useEffect(() => {
    if (user && !user.is_admin) { navigate('/'); return }
    fetch('/api/admin/users').then(r => r.json()).then(setUsers).catch(() => {})
  }, [user])

  async function toggle(id, field, current) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    })
    setUsers(u => u.map(x => x.id === id ? { ...x, [field]: !current } : x))
  }

  function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
  }

  if (!users) return <div className="empty-state">Laden…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Gebruikersbeheer</h2>
          <div className="subtitle">{users.length} gebruiker{users.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Gebruiker</th>
              <th>E-mail</th>
              <th>Laatste login</th>
              <th>Beheerder</th>
              <th>Docent</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--title)', fontWeight: 700, fontSize: '0.85rem',
                    }}>
                      {u.display_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span style={{ fontWeight: 500 }}>{u.display_name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-soft)' }}>{u.email}</td>
                <td style={{ color: 'var(--text-soft)', fontSize: '0.82rem' }}>{fmt(u.last_login)}</td>
                <td>
                  <button
                    onClick={() => toggle(u.id, 'is_admin', u.is_admin)}
                    className={`badge ${u.is_admin ? 'badge-primary' : 'badge-gray'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    title={u.is_admin ? 'Klik om te verwijderen' : 'Klik om te maken'}
                  >
                    {u.is_admin ? 'Ja' : 'Nee'}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => toggle(u.id, 'is_teacher', u.is_teacher)}
                    className={`badge ${u.is_teacher ? 'badge-blue' : 'badge-gray'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    title={u.is_teacher ? 'Klik om te verwijderen' : 'Klik om te maken'}
                  >
                    {u.is_teacher ? 'Ja' : 'Nee'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
