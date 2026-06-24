import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function cijferColor(c) {
  if (c >= 7)   return 'badge-green'
  if (c >= 5.5) return 'badge-amber'
  return 'badge-red'
}

function Panel({ title, linkTo, linkLabel, children }) {
  const navigate = useNavigate()
  return (
    <div className="dash-panel">
      <div className="dash-panel-header">
        <div className="dash-panel-title">{title}</div>
        {linkTo && <button className="btn btn-ghost btn-sm" onClick={() => navigate(linkTo)}>{linkLabel ?? 'Bekijken →'}</button>}
      </div>
      {children}
    </div>
  )
}

function Empty({ label }) {
  return <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{label}</div>
}

export default function Home() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()).catch(() => null),
      fetch('/api/grades').then(r => r.json()).catch(() => []),
      fetch('/api/goals').then(r => r.json()).catch(() => []),
      fetch('/api/werkstukken').then(r => r.json()).catch(() => []),
      fetch('/api/cv').then(r => r.json()).catch(() => null),
      fetch('/api/referenties').then(r => r.json()).catch(() => null),
    ]).then(([profile, grades, goals, werkstukken, cv, refs]) => {
      setData({ profile, grades, goals, werkstukken, cv, refs })
    })
  }, [])

  if (!data) return (
    <>
      <div className="dash-welcome">
        <div>
          <div className="dash-welcome-text">Welkom, {user.display_name}</div>
          <div className="dash-welcome-sub">Portfolio</div>
        </div>
      </div>
      <div className="empty-state">Laden…</div>
    </>
  )

  const { profile, grades, goals, werkstukken, cv, refs } = data

  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.cijfer, 0) / grades.length).toFixed(1)
    : null

  const cvFields = cv ? [cv.naam, cv.adres, cv.postcode, cv.telefoon, cv.email].filter(Boolean).length : 0
  const cvTotal  = 5
  const ref1ok   = refs?.ref1 && (refs.ref1.naam || refs.ref1.datum)
  const ref2ok   = refs?.ref2 && (refs.ref2.naam || refs.ref2.datum)

  const recentGrades     = [...grades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)
  const recentWerkstukken = werkstukken.slice(0, 4)

  return (
    <>
      {/* Welcome banner */}
      <div className="dash-welcome">
        <div>
          <div className="dash-welcome-text">Welkom, {user.display_name}</div>
          <div className="dash-welcome-sub">Hier is een overzicht van je portfolio</div>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div className={`stat ${avg >= 7 ? 'green' : avg >= 5.5 ? 'amber' : avg ? 'red' : 'blue'}`}>
          <div className="stat-icon-wrap">📊</div>
          <div className="num">{avg ?? '—'}</div>
          <div className="lbl">Gemiddeld cijfer</div>
        </div>
        <div className="stat blue">
          <div className="stat-icon-wrap">📝</div>
          <div className="num">{grades.length}</div>
          <div className="lbl">Cijfers</div>
        </div>
        <div className="stat blue">
          <div className="stat-icon-wrap">🎯</div>
          <div className="num">{goals.length}</div>
          <div className="lbl">Doelen</div>
        </div>
        <div className="stat blue">
          <div className="stat-icon-wrap">🖼️</div>
          <div className="num">{werkstukken.length}</div>
          <div className="lbl">Werkstukken</div>
        </div>
        <div className={`stat ${cvFields === cvTotal ? 'green' : cvFields > 0 ? 'amber' : 'blue'}`}>
          <div className="stat-icon-wrap">📄</div>
          <div className="num">{cvFields}/{cvTotal}</div>
          <div className="lbl">CV ingevuld</div>
        </div>
        <div className={`stat ${ref1ok && ref2ok ? 'green' : ref1ok || ref2ok ? 'amber' : 'blue'}`}>
          <div className="stat-icon-wrap">👤</div>
          <div className="num">{(ref1ok ? 1 : 0) + (ref2ok ? 1 : 0)}/2</div>
          <div className="lbl">Referenties</div>
        </div>
      </div>

      {/* Panels grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>

        {/* Over mij */}
        <Panel title="Over mij" linkTo="/over-mij" linkLabel="Bewerken →">
          {profile?.bio
            ? <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: profile.skills?.length ? '10px' : 0 }}>{profile.bio.length > 180 ? profile.bio.slice(0, 180) + '…' : profile.bio}</p>
            : null
          }
          {profile?.skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
              {profile.skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
            </div>
          )}
          {profile?.hobbies?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {profile.hobbies.map((h, i) => <span key={i} className="badge badge-gray">{h.emoji} {h.label}</span>)}
            </div>
          )}
          {!profile?.bio && !profile?.skills?.length && !profile?.hobbies?.length && <Empty label="Nog niets ingevuld." />}
        </Panel>

        {/* Cijfers */}
        <Panel title="Mijn cijfers" linkTo="/mijn-cijfers" linkLabel="Alle cijfers →">
          {recentGrades.length === 0 ? <Empty label="Nog geen cijfers." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentGrades.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{g.vak}</span>
                  <span className={`badge ${cijferColor(g.cijfer)}`} style={{ fontSize: '0.78rem' }}>
                    {g.cijfer % 1 === 0 ? g.cijfer.toFixed(1) : g.cijfer}
                  </span>
                </div>
              ))}
              {avg && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-dim)', fontFamily: 'var(--title)', fontWeight: 600 }}>
                  <span>Gemiddelde</span>
                  <span style={{ color: 'var(--text)' }}>{avg}</span>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Doelen */}
        <Panel title="Doelen" linkTo="/doelen" linkLabel="Bewerken →">
          {goals.length === 0 ? <Empty label="Nog geen doelen." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {goals.map(g => (
                <div key={g.id} style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>🎯 {g.doel}</div>
                  {g.wil_leren && <div style={{ color: 'var(--text-soft)', marginTop: '2px', fontSize: '0.8rem' }}>Wil leren: {g.wil_leren}</div>}
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Werkstukken */}
        <Panel title="Werkstukken" linkTo="/mijn-werkstukken" linkLabel="Alle werkstukken →">
          {recentWerkstukken.length === 0 ? <Empty label="Nog geen werkstukken." /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {recentWerkstukken.map(w => {
                const foto = w.fotos?.[0]
                return (
                  <div key={w.id} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface2)' }}>
                    {foto
                      ? <img src={`${foto.url}?t=1`} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🖼️</div>
                    }
                    <div style={{ padding: '6px 8px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.vak}</div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        {/* Referenties */}
        <Panel title="Referenties" linkTo="/mijn-referenties" linkLabel="Bewerken →">
          {!ref1ok && !ref2ok ? <Empty label="Nog geen referenties." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[{ label: 'Vakleerkracht', ref: refs.ref1, ok: ref1ok }, { label: 'Stageleerkracht', ref: refs.ref2, ok: ref2ok }]
                .filter(r => r.ok)
                .map(({ label, ref }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', fontFamily: 'var(--title)', marginBottom: '3px' }}>{label}</div>
                    {ref.naam && <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ref.naam}</div>}
                    {ref.vak  && <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>{ref.vak}</div>}
                    {ref.datum && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{ref.datum}</div>}
                  </div>
                ))
              }
            </div>
          )}
        </Panel>

        {/* CV */}
        <Panel title="CV" linkTo="/mijn-cv" linkLabel="Bewerken →">
          {!cv || cvFields === 0 ? <Empty label="CV nog niet ingevuld." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem' }}>
              {cv.naam     && <div><span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>Naam</span>{cv.naam}</div>}
              {cv.adres    && <div><span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>Adres</span>{cv.adres}</div>}
              {cv.telefoon && <div><span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>Tel.</span>{cv.telefoon}</div>}
              {cv.email    && <div><span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', marginRight: '6px' }}>E-mail</span>{cv.email}</div>}
              {cv.vaardigheden?.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {cv.vaardigheden.map(v => <span key={v} className="badge badge-primary">{v}</span>)}
                </div>
              )}
              {cv.werkervaring?.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  {cv.werkervaring.map((w, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                      {w.bedrijf}{w.functie ? ` · ${w.functie}` : ''}{w.periode ? ` (${w.periode})` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>

      </div>
    </>
  )
}
