import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: '14px' }}>
      <div className="section-title" style={{ marginTop: 0 }}>{title}</div>
      {children}
    </div>
  )
}

function Empty() {
  return <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog niet ingevuld.</div>
}

function cijferColor(c) {
  if (c >= 7)   return 'badge-green'
  if (c >= 5.5) return 'badge-amber'
  return 'badge-red'
}

export default function StudentDetail() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()

  const [studentName, setStudentName] = useState('')
  const [profile, setProfile]   = useState(null)
  const [grades, setGrades]     = useState(null)
  const [goals, setGoals]       = useState(null)
  const [cv, setCv]             = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    if (user && !user.is_teacher && !user.is_admin) { navigate('/'); return }
    if (!id) return

    Promise.all([
      fetch(`/api/teacher/students/${id}/profile`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/grades`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/goals`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/cv`).then(r => r.json()),
    ]).then(([p, g, go, c]) => {
      setStudentName(p.display_name || '')
      setProfile(p)
      setGrades(g)
      setGoals(go)
      setCv(c)
    }).catch(() => {})

    fetch(`/api/profile/avatar/${id}`).then(r => {
      if (r.ok) setAvatarUrl(`/api/profile/avatar/${id}`)
    }).catch(() => {})
  }, [user, id])

  const loaded = profile && grades && goals && cv

  if (!loaded) return <div className="empty-state">Laden…</div>

  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.cijfer, 0) / grades.length).toFixed(1)
    : null

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
            : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.3rem' }}>
                {studentName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )
          }
          <div>
            <h2>{studentName || `Leerling #${id}`}</h2>
            <div className="subtitle">Portfolio-overzicht</div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/overzicht')}>← Terug</button>
      </div>

      {/* Over mij */}
      <Section title="Over mij">
        {profile.bio
          ? <p style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text)', marginBottom: profile.skills?.length || profile.hobbies?.length || profile.subjects?.length ? '14px' : 0 }}>{profile.bio}</p>
          : null}
        {profile.skills?.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '6px' }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
            </div>
          </div>
        )}
        {profile.hobbies?.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '6px' }}>Hobby's</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.hobbies.map((h, i) => <span key={i} className="badge badge-gray">{h.emoji} {h.label}</span>)}
            </div>
          </div>
        )}
        {profile.subjects?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '6px' }}>Favoriete vakken</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.subjects.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
            </div>
          </div>
        )}
        {!profile.bio && !profile.skills?.length && !profile.hobbies?.length && !profile.subjects?.length && <Empty />}
      </Section>

      {/* Cijfers */}
      <Section title={`Mijn cijfers${avg ? ` — gemiddelde ${avg}` : ''}`}>
        {grades.length === 0 ? <Empty /> : (
          <div className="table-wrap" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
            <table>
              <thead><tr><th>Vak</th><th>Cijfer</th></tr></thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 500 }}>{g.vak}</td>
                    <td><span className={`badge ${cijferColor(g.cijfer)}`} style={{ fontSize: '0.78rem' }}>{g.cijfer % 1 === 0 ? g.cijfer.toFixed(1) : g.cijfer}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Doelen */}
      <Section title="Doelen">
        {goals.length === 0 ? <Empty /> : goals.map(g => (
          <div key={g.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>🎯 {g.doel}</div>
            {g.wil_leren && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginRight: '6px' }}>Wil leren:</span>
                <span style={{ fontSize: '0.83rem', color: 'var(--text-soft)' }}>{g.wil_leren}</span>
              </div>
            )}
            {g.nodig && (
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginRight: '6px' }}>Nodig:</span>
                <span style={{ fontSize: '0.83rem', color: 'var(--text-soft)' }}>{g.nodig}</span>
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* CV */}
      <Section title="CV">
        {!cv.naam && !cv.adres && !cv.telefoon && !cv.email && !cv.vaardigheden?.length && !cv.werkervaring?.length ? <Empty /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              {cv.naam && <div style={{ marginBottom: '6px' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>Naam</span><div style={{ fontSize: '0.88rem' }}>{cv.naam}</div></div>}
              {cv.adres && <div style={{ marginBottom: '6px' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>Adres</span><div style={{ fontSize: '0.88rem' }}>{cv.adres}</div></div>}
              {cv.postcode && <div style={{ marginBottom: '6px' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>Postcode</span><div style={{ fontSize: '0.88rem' }}>{cv.postcode}</div></div>}
              {cv.telefoon && <div style={{ marginBottom: '6px' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>Telefoon</span><div style={{ fontSize: '0.88rem' }}>{cv.telefoon}</div></div>}
              {cv.email && <div><span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)' }}>E-mail</span><div style={{ fontSize: '0.88rem' }}>{cv.email}</div></div>}
            </div>
            <div>
              {cv.vaardigheden?.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '6px' }}>Vaardigheden</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>{cv.vaardigheden.map(v => <span key={v} className="badge badge-primary">{v}</span>)}</div>
                </div>
              )}
              {cv.werkervaring?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '6px' }}>Werkervaring</div>
                  {cv.werkervaring.map((w, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.bedrijf}{w.functie ? ` · ${w.functie}` : ''}</div>
                      {w.periode && <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)' }}>{w.periode}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Section>
    </>
  )
}
