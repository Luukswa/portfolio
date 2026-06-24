import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Lightbox({ urls, initialIndex = 0, title, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  const multi = urls.length > 1
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
    <button onClick={onClick} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{label}</button>
  )
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '12px' }}>
      <div style={{ width: '100%', maxWidth: '90vw', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {title && <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.92rem', fontFamily: 'var(--title)', flex: 1 }}>{title}</span>}
        {multi && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{idx + 1} / {urls.length}</span>}
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '90vw', width: '100%', justifyContent: 'center' }}>
        {multi && navBtn(() => setIdx(i => (i - 1 + urls.length) % urls.length), '‹')}
        <img key={idx} src={`${urls[idx]}?t=1`} alt="" style={{ maxWidth: multi ? 'calc(90vw - 120px)' : '90vw', maxHeight: 'calc(90vh - 140px)', objectFit: 'contain', borderRadius: '8px', display: 'block' }} />
        {multi && navBtn(() => setIdx(i => (i + 1) % urls.length), '›')}
      </div>
      {multi && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '90vw', padding: '4px 0' }}>
          {urls.map((u, i) => (
            <img key={i} src={`${u}?t=1`} alt="" onClick={() => setIdx(i)} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '5px', cursor: 'pointer', flexShrink: 0, border: i === idx ? '2px solid #fff' : '2px solid transparent', opacity: i === idx ? 1 : 0.55, transition: 'opacity 0.15s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function cijferColor(c) {
  if (c >= 7)   return 'badge-green'
  if (c >= 5.5) return 'badge-amber'
  return 'badge-red'
}

function statColor(avg) {
  if (!avg) return 'blue'
  if (avg >= 7)   return 'green'
  if (avg >= 5.5) return 'amber'
  return 'red'
}

function Panel({ title, to, children }) {
  const navigate = useNavigate()
  return (
    <div className="dash-panel" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="dash-panel-header">
        <span className="dash-panel-title">{title}</span>
        {to && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(to)}>
            Bewerken →
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Dim({ text }) {
  return <div style={{ color: 'var(--text-dim)', fontSize: '0.83rem' }}>{text}</div>
}

export default function Home() {
  const { user }  = useAuth()
  const [data, setData]     = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    const get     = (url, fb)  => fetch(url).then(r => r.ok ? r.json() : fb).catch(() => fb)
    const getArr  = url        => get(url, []).then(v => Array.isArray(v) ? v : [])

    Promise.all([
      get('/api/profile',     null),
      getArr('/api/grades'),
      getArr('/api/goals'),
      getArr('/api/werkstukken'),
      get('/api/cv',          null),
      get('/api/referenties', null),
    ]).then(([profile, grades, goals, werkstukken, cv, refs]) =>
      setData({ profile, grades, goals, werkstukken, cv, refs })
    ).catch(() =>
      setData({ profile: null, grades: [], goals: [], werkstukken: [], cv: null, refs: null })
    )
    fetch(`/api/profile/avatar/${user.id}`).then(r => {
      if (r.ok) setAvatar(`/api/profile/avatar/${user.id}`)
    }).catch(() => {})
  }, [user.id])

  if (!data) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <WelcomeBanner user={user} avatar={null} loading />
      <div className="empty-state">Laden…</div>
    </div>
  )

  const { profile, grades, goals, werkstukken, cv, refs } = data

  const avg     = grades.length ? (grades.reduce((s, g) => s + g.cijfer, 0) / grades.length) : null
  const avgStr  = avg ? avg.toFixed(1) : '—'
  const cvDone  = cv ? [cv.naam, cv.adres, cv.postcode, cv.telefoon, cv.email].filter(Boolean).length : 0
  const ref1ok  = !!(refs?.ref1?.naam || refs?.ref1?.datum)
  const ref2ok  = !!(refs?.ref2?.naam || refs?.ref2?.datum)

  const recentGrades = [...grades]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Welcome ── */}
      <WelcomeBanner user={user} avatar={avatar} />

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div className={`stat ${statColor(avg)}`}>
          <div className="stat-icon-wrap">📊</div>
          <div className="stat-body">
            <div className="num">{avgStr}</div>
            <div className="lbl">Gemiddeld cijfer</div>
          </div>
        </div>
        <div className="stat blue">
          <div className="stat-icon-wrap">📝</div>
          <div className="stat-body">
            <div className="num">{grades.length}</div>
            <div className="lbl">Cijfers</div>
          </div>
        </div>
        <div className="stat blue">
          <div className="stat-icon-wrap">🎯</div>
          <div className="stat-body">
            <div className="num">{goals.length}</div>
            <div className="lbl">Doelen</div>
          </div>
        </div>
        <div className="stat blue">
          <div className="stat-icon-wrap">🖼️</div>
          <div className="stat-body">
            <div className="num">{werkstukken.length}</div>
            <div className="lbl">Werkstukken</div>
          </div>
        </div>
      </div>

      {/* ── Main panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Cijfers */}
        <Panel title="Mijn cijfers" to="/mijn-cijfers">
          {recentGrades.length === 0 ? <Dim text="Nog geen cijfers toegevoegd." /> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentGrades.map((g, i) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < recentGrades.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500 }}>{g.vak}</span>
                  <span className={`badge ${cijferColor(g.cijfer)}`} style={{ fontSize: '0.8rem' }}>
                    {g.cijfer % 1 === 0 ? g.cijfer.toFixed(1) : g.cijfer}
                  </span>
                </div>
              ))}
              {avg && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', fontSize: '0.8rem', fontFamily: 'var(--title)', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Gemiddelde</span>
                  <span style={{ color: 'var(--text)' }}>{avgStr}</span>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Over mij */}
        <Panel title="Over mij" to="/over-mij">
          {!profile?.bio && !profile?.skills?.length && !profile?.hobbies?.length
            ? <Dim text="Nog niets ingevuld." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profile?.bio && (
                  <p style={{ fontSize: '0.87rem', color: 'var(--text-soft)', lineHeight: 1.65 }}>
                    {profile.bio.length > 200 ? profile.bio.slice(0, 200) + '…' : profile.bio}
                  </p>
                )}
                {profile?.skills?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: '6px' }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {profile.skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
                    </div>
                  </div>
                )}
                {profile?.hobbies?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: '6px' }}>Hobby's</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {profile.hobbies.map((h, i) => <span key={i} className="badge badge-gray">{h.emoji} {h.label}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
        </Panel>

        {/* Doelen */}
        <Panel title="Doelen" to="/doelen">
          {goals.length === 0 ? <Dim text="Nog geen doelen toegevoegd." /> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {goals.map((g, i) => (
                <div key={g.id} style={{ padding: '8px 0', borderBottom: i < goals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: g.wil_leren ? '3px' : 0 }}>🎯 {g.doel}</div>
                  {g.wil_leren && <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>Wil leren: {g.wil_leren}</div>}
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Werkstukken */}
        <Panel title="Werkstukken" to="/mijn-werkstukken">
          {werkstukken.length === 0 ? <Dim text="Nog geen werkstukken toegevoegd." /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {werkstukken.slice(0, 6).map(w => {
                const urls = (w.fotos || []).map(f => f.url)
                const hasFotos = urls.length > 0
                return (
                  <div
                    key={w.id}
                    onClick={() => hasFotos && setLightbox({ urls, title: w.vak || '' })}
                    style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface2)', cursor: hasFotos ? 'pointer' : 'default' }}
                  >
                    {hasFotos
                      ? <img src={`${urls[0]}?t=1`} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', aspectRatio: '1', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--text-dim)' }}>🖼️</div>
                    }
                    <div style={{ padding: '4px 6px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.vak}</div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        {/* CV */}
        <Panel title="CV" to="/mijn-cv">
          {!cv || cvDone === 0 ? <Dim text="CV nog niet ingevuld." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Naam',    val: cv.naam },
                { label: 'Adres',   val: cv.adres },
                { label: 'Tel.',    val: cv.telefoon },
                { label: 'E-mail',  val: cv.email },
              ].filter(r => r.val).map(r => (
                <div key={r.label} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ fontFamily: 'var(--title)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', width: '44px', flexShrink: 0, paddingTop: '2px' }}>{r.label}</span>
                  <span style={{ color: 'var(--text)' }}>{r.val}</span>
                </div>
              ))}
              {cv.vaardigheden?.length > 0 && (
                <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {cv.vaardigheden.map(v => <span key={v} className="badge badge-primary">{v}</span>)}
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Referenties */}
        <Panel title="Referenties" to="/mijn-referenties">
          {!ref1ok && !ref2ok ? <Dim text="Nog geen referenties ingevuld." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[{ label: 'Vakleerkracht', ref: refs.ref1, ok: ref1ok }, { label: 'Stageleerkracht', ref: refs.ref2, ok: ref2ok }]
                .filter(r => r.ok)
                .map(({ label, ref }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--title)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: '4px' }}>{label}</div>
                    {ref.naam  && <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{ref.naam}</div>}
                    {ref.vak   && <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>{ref.vak}</div>}
                    {ref.datum && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>{ref.datum}</div>}
                  </div>
                ))}
            </div>
          )}
        </Panel>

      </div>

      {lightbox && <Lightbox urls={lightbox.urls} title={lightbox.title} onClose={() => setLightbox(null)} />}
    </div>
  )
}

function WelcomeBanner({ user, avatar, loading }) {
  const initials = user.display_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ background: 'var(--primary)', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow)' }}>
      {avatar
        ? <img src={avatar} alt="" style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
        : <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.2rem', color: '#fff', flexShrink: 0 }}>{initials}</div>
      }
      <div>
        <div style={{ fontFamily: 'var(--title)', fontWeight: 700, fontSize: '1.15rem', color: '#fff' }}>
          Welkom, {user.display_name}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginTop: '3px' }}>
          {loading ? 'Laden…' : 'Hier is een overzicht van je portfolio'}
        </div>
      </div>
    </div>
  )
}
