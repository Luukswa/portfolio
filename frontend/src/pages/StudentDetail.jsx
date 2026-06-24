import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'

function Lightbox({ urls, initialIndex = 0, title, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  const multi = urls.length > 1
  const prev = useCallback(() => setIdx(i => (i - 1 + urls.length) % urls.length), [urls.length])
  const next = useCallback(() => setIdx(i => (i + 1) % urls.length), [urls.length])

  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + urls.length) % urls.length)
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % urls.length)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose, urls.length])

  const navBtn = (onClick, label) => (
    <button onClick={onClick} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(4px)' }}>{label}</button>
  )

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '12px' }}
    >
      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: '90vw', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {title && <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.92rem', fontFamily: 'var(--title)', flex: 1 }}>{title}</span>}
        {multi && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{idx + 1} / {urls.length}</span>}
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
      </div>

      {/* Image row with arrows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '90vw', width: '100%', justifyContent: 'center' }}>
        {multi && navBtn(prev, '‹')}
        <img
          key={idx}
          src={`${urls[idx]}?t=1`}
          alt=""
          style={{ maxWidth: multi ? 'calc(90vw - 120px)' : '90vw', maxHeight: 'calc(90vh - 140px)', objectFit: 'contain', borderRadius: '8px', display: 'block' }}
        />
        {multi && navBtn(next, '›')}
      </div>

      {/* Thumbnail strip */}
      {multi && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '90vw', padding: '4px 0' }}>
          {urls.map((u, i) => (
            <img
              key={i}
              src={`${u}?t=1`}
              alt=""
              onClick={() => setIdx(i)}
              style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '5px', cursor: 'pointer', flexShrink: 0, border: i === idx ? '2px solid #fff' : '2px solid transparent', opacity: i === idx ? 1 : 0.55, transition: 'opacity 0.15s' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [refs, setRefs]         = useState(null)
  const [werkstukken, setWerkstukken] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [lightbox, setLightbox] = useState(null) // { urls, initialIndex, title }

  useEffect(() => {
    if (user && !user.is_teacher && !user.is_admin) { navigate('/'); return }
    if (!id) return

    Promise.all([
      fetch(`/api/teacher/students/${id}/profile`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/grades`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/goals`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/cv`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/referenties`).then(r => r.json()),
      fetch(`/api/teacher/students/${id}/werkstukken`).then(r => r.json()),
    ]).then(([p, g, go, c, rf, wk]) => {
      setStudentName(p.display_name || '')
      setProfile(p)
      setGrades(g)
      setGoals(go)
      setCv(c)
      setRefs(rf)
      setWerkstukken(wk)
    }).catch(() => {})

    fetch(`/api/profile/avatar/${id}`).then(r => {
      if (r.ok) setAvatarUrl(`/api/profile/avatar/${id}`)
    }).catch(() => {})
  }, [user, id])

  const loaded = profile && grades && goals && cv && refs && werkstukken

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

      {/* Referenties */}
      <Section title="Referenties">
        {(() => {
          const ref1empty = !refs.ref1.naam && !refs.ref1.datum && !refs.ref1.vak && !refs.ref1.opmerking
          const ref2empty = !refs.ref2.naam && !refs.ref2.datum && !refs.ref2.vak && !refs.ref2.opmerking
          if (ref1empty && ref2empty) return <Empty />
          const RefBlock = ({ label, r }) => (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '8px' }}>{label}</div>
              {r.datum && <div style={{ marginBottom: '4px' }}><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>Datum:</span><span style={{ fontSize: '0.85rem' }}>{r.datum}</span></div>}
              {r.naam && <div style={{ marginBottom: '4px' }}><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>Naam:</span><span style={{ fontSize: '0.85rem' }}>{r.naam}</span></div>}
              {r.vak && <div style={{ marginBottom: '4px' }}><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>Vak:</span><span style={{ fontSize: '0.85rem' }}>{r.vak}</span></div>}
              {r.opmerking && <div><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>Opmerking:</span><span style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>{r.opmerking}</span></div>}
            </div>
          )
          return (
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {!ref1empty && <RefBlock label="Vakleerkracht" r={refs.ref1} />}
              {!ref2empty && <RefBlock label="Stageleerkracht" r={refs.ref2} />}
            </div>
          )
        })()}
      </Section>

      {/* Werkstukken */}
      <Section title={`Werkstukken${werkstukken.length ? ` (${werkstukken.length})` : ''}`}>
        {werkstukken.length === 0 ? <Empty /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {werkstukken.map(w => {
              const fotos = w.fotos || []
              const urls  = fotos.map(f => f.url)
              const open  = i => setLightbox({ urls, initialIndex: i, title: w.vak || '' })
              return (
                <div key={w.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface2)', display: 'flex', flexDirection: 'column' }}>
                  {fotos.length > 0 ? (
                    <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', padding: '6px', background: 'var(--surface2)' }}>
                      {fotos.map((f, i) => (
                        <img key={f.id} src={`${f.url}?t=1`} alt="" onClick={() => open(i)} style={{ width: fotos.length === 1 ? '100%' : '72px', height: fotos.length === 1 ? 'auto' : '72px', aspectRatio: fotos.length === 1 ? '4/3' : undefined, objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', flexShrink: 0, display: 'block' }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>Geen foto</div>
                  )}
                  <div style={{ padding: '10px 12px', fontSize: '0.82rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {w.vak && <div style={{ fontWeight: 600, marginBottom: '3px' }}>{w.vak}</div>}
                    {w.datum && <div style={{ color: 'var(--text-soft)' }}>{w.datum}</div>}
                    {w.trots_omdat && <div style={{ color: 'var(--text-soft)', marginTop: '4px', lineHeight: 1.4 }}>{w.trots_omdat}</div>}
                    {fotos.length > 0 && (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: '8px', alignSelf: 'flex-start' }} onClick={() => open(0)}>
                        🔍 {fotos.length > 1 ? `Bekijk album (${fotos.length})` : 'Bekijk foto'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {lightbox && <Lightbox urls={lightbox.urls} initialIndex={lightbox.initialIndex} title={lightbox.title} onClose={() => setLightbox(null)} />}

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
